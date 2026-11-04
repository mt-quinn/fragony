"""Import the downloaded stock Shipment and Stendby's Nuked Radiant geometry.

Usage: python3 tools/import-radiant.py shipment|nuketown
Only geometry, transforms and material-role names are emitted. No source art.
v25 model layout reference: mauserzjeh/cod-asset-importer/templates/*_v25.bt.
"""
import array, base64, collections, functools, gzip, hashlib, itertools, json, math, pathlib, re, struct, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REF = ROOT.parent / 'reference-maps'
ID = sys.argv[1]
CONFIG = {
 'shipment': ('shipment-source/mp_shipment_map_source', 'mp_shipment.map', (0, 80, 192), (-848, 848, -784, 944, 160, 700)),
 'nuketown': ('nuketown/mp_nuked_pack_map_source', 'mp_nuked.map', (0, 500, -80), (-2290, 2290, -650, 1530, -100, 700)),
}
EXTRA = json.loads((ROOT/'tools/source-map-config.json').read_text()) if (ROOT/'tools/source-map-config.json').exists() else {}
for key, cfg in EXTRA.items():CONFIG[key]=(cfg['folder'],cfg['filename'],cfg['origin'],cfg['crop'])
assert ID in CONFIG
cfg=EXTRA.get(ID,{})
folder, filename, ORIGIN, CROP = CONFIG[ID]
BASE = REF / folder
SCALE = 1 / 32
groups, brushes, spawns, model_instances, detail_anchors = {}, [], [], [], []
collision_meshes={'models':[],'instances':[]};collision_prototypes={}
audit = collections.Counter()
inputs = {}
render_keys=set();collision_keys=set()
dot = lambda a,b: sum(x*y for x,y in zip(a,b))
sub = lambda a,b: [x-y for x,y in zip(a,b)]
cross = lambda a,b: [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(v):
 length=math.sqrt(dot(v,v));return [x/length for x in v] if length>1e-10 else [0,0,0]
def game(p):return [(p[0]-ORIGIN[0])*SCALE,(p[2]-ORIGIN[2])*SCALE,(ORIGIN[1]-p[1])*SCALE]
def direction(p):return [p[0],p[2],-p[1]]
def rotation(angles):
 pitch,yaw,roll=[math.radians(a) for a in angles]
 cp,sp,cy,sy,cr,sr=math.cos(pitch),math.sin(pitch),math.cos(yaw),math.sin(yaw),math.cos(roll),math.sin(roll)
 return [[cy*cp,cy*sp*sr-sy*cr,cy*sp*cr+sy*sr],[sy*cp,sy*sp*sr+cy*cr,sy*sp*cr-cy*sr],[-sp,cp*sr,cp*cr]]
IDENTITY=[[1,0,0],[0,1,0],[0,0,1]]
def apply(m,p):return [dot(row,p) for row in m]
def compose(m,n):return [[sum(m[i][k]*n[k][j] for k in range(3))for j in range(3)]for i in range(3)]
def transform(p,m,t):return [a+b for a,b in zip(apply(m,p),t)]
def intersects(vs):return all(max(v[a] for v in vs)>=CROP[a*2] and min(v[a] for v in vs)<=CROP[a*2+1] for a in range(3))
def crop(vs):
 for axis in range(3):
  for limit,sign in [(CROP[axis*2],1),(CROP[axis*2+1],-1)]:
   if not vs:return []
   out=[]
   for a,b in zip(vs,vs[1:]+vs[:1]):
    da=(a[axis]-limit)*sign;db=(b[axis]-limit)*sign
    if da>=-1e-6:out.append(a)
    if (da>=0)!=(db>=0):
     t=da/(da-db);out.append([a[i]+(b[i]-a[i])*t for i in range(3)])
   vs=out
 return vs
def role(material):
 s=material.lower()
 if re.search('fence|chainlink|grate',s):return 'fence'
 if re.search('glass|window_glass',s):return 'glass'
 if re.search('cargo|container',s):return 'container_'+('blue' if 'blue'in s else 'green' if 'green'in s else 'ochre')
 if re.search('grass|lawn|hedge|shrub',s):return 'landscape'
 if re.search('snow|ice_',s):return 'snow'
 if re.search('wood|plank|pallet',s):return 'wood'
 if re.search('metal|steel|rail|pipe|roof|shingle',s):return 'steel'
 if re.search('lightpanel|lightfluohang',s):return 'light'
 return 'concrete'
def hidden(s):return bool(re.search(r'^(?:caulk|clip|playerclip|ladder|weap|hint|portal|skip|nodraw|trigger|lightgrid|light_portal|mantle|traverse|sky|nodraw)',s))
def nonphysical(s):return bool(re.search(r'^(?:hint|portal|skip|trigger|lightgrid|light_portal|mantle|traverse|sky|ladder|clip_weap|weaponclip)',s))
def block(vs,planes,tag,movement_only=False):
 if not vs:return
 pts=[game(v) for v in vs];lo=[min(v[i]for v in pts)for i in range(3)];hi=[max(v[i]for v in pts)for i in range(3)]
 if any(hi[i]-lo[i]<1e-5 for i in range(3)):return
 key=(movement_only,tuple(sorted(tuple(round(x,6)for x in p)for p in planes)))
 if key in collision_keys:audit['duplicate collision']+=1;return
 collision_keys.add(key)
 brushes.append(dict(id=ID+'-'+tag,x=(lo[0]+hi[0])/2,z=(lo[2]+hi[2])/2,w=hi[0]-lo[0],d=hi[2]-lo[2],bottom=lo[1],top=hi[1],planes=[[float(v)for v in p]for p in planes],movementOnly=movement_only))
def prism(tri,tag):
 vv=[game(p)for p in tri];n=unit(cross(sub(vv[1],vv[0]),sub(vv[2],vv[0])))
 if dot(n,n)<.5:return
 # Preserve the actual face as the front; backing goes inward only.
 back=[[v[j]-n[j]*.012 for j in range(3)]for v in vv];vs=vv+back
 lo=[min(v[i]for v in vs)for i in range(3)];hi=[max(v[i]for v in vs)for i in range(3)]
 ps=([]if cfg else[[1,0,0,hi[0]],[-1,0,0,-lo[0]],[0,1,0,hi[1]],[0,-1,0,-lo[1]],[0,0,1,hi[2]],[0,0,-1,-lo[2]]])+[n+[dot(n,vv[0])],[-x for x in n]+[-dot(n,vv[0])+.012]]
 for a,b in zip(vv,vv[1:]+vv[:1]):
  en=unit(cross(sub(b,a),n));ps.append(en+[dot(en,a)])
 source=[[p[0]/SCALE+ORIGIN[0],ORIGIN[1]-p[2]/SCALE,p[1]/SCALE+ORIGIN[2]]for p in vs]
 block(source,ps,tag,True)
def emit(material,tri,normals=None,collision=False,visible=True):
 if not intersects(tri):audit['outside triangles']+=1;return
 n=unit(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])))
 if dot(n,n)<.5:return
 if collision and n[2]<-.65: # Ground meshes in Radiant can have reversed winding.
  tri=[tri[0],tri[2],tri[1]];n=[-x for x in n]
 poly=crop(tri)
 for i in range(1,len(poly)-1):
  ts=[poly[0],poly[i],poly[i+1]]
  if math.sqrt(dot(cross(sub(ts[1],ts[0]),sub(ts[2],ts[0])),cross(sub(ts[1],ts[0]),sub(ts[2],ts[0]))))<.001:continue
  packed=struct.pack('<9f',*(v for p in sorted(tuple(round(v,5)for v in p)for p in ts)for v in p))
  key=(material,hashlib.blake2b(packed,digest_size=16).digest())
  if collision:prism(ts,'surface-'+str(audit['collision triangles']));audit['collision triangles']+=1
  if not visible:continue
  if key in render_keys:
   audit['duplicate triangles']+=1;continue
  render_keys.add(key)
  g=groups.setdefault(material,dict(p=array.array('f'),n=array.array('f'),c=[]))
  for j,p in enumerate(ts):g['p'].extend(game(p));g['n'].extend(direction(normals[j] if normals and len(poly)==3 else n))
  audit['render triangles']+=1
@functools.lru_cache(None)
def parse(path):
 path=pathlib.Path(path);text=path.read_text(errors='replace');inputs[str(path.relative_to(REF))]=hashlib.sha256(path.read_bytes()).hexdigest()
 root={'lines':[],'children':[]};stack=[root]
 for raw in text.splitlines():
  line=raw.split('//')[0].strip()
  if line=='{':
   child={'lines':[],'children':[]};stack[-1]['children'].append(child);stack.append(child)
  elif line=='}':stack.pop()
  elif line:stack[-1]['lines'].append(line)
 assert len(stack)==1,path
 return root['children']
def props(node):return dict(re.findall(r'^"([^"]+)"\s+"([^"]*)"$', '\n'.join(node['lines']),re.M))
plane_re=re.compile(r'^\(\s*([^()]+)\)\s*\(\s*([^()]+)\)\s*\(\s*([^()]+)\)\s*(\S+)')
def brush(node,m,t,tag,solid=True):
 solid=solid and not any(re.search(r'contents\s+(?:weaponClip|nonColliding)',line)for line in node['lines'])
 faces=[]
 for line in node['lines']:
  match=plane_re.match(line)
  if not match:continue
  p=[transform(list(map(float,match[i].split())),m,t)for i in (1,2,3)]
  n=unit(cross(sub(p[2],p[0]),sub(p[1],p[0])));d=dot(n,p[0]);faces.append((n,d,match[4]))
 if not faces:return
 if all(nonphysical(f[2])for f in faces):audit['tool brushes']+=1;return
 # The source planes define a convex half-space intersection. Recover actual
 # corners, not the arbitrary three points used to specify each infinite plane.
 vertices=[]
 for a,b,c in itertools.combinations(faces,3):
  bc=cross(b[0],c[0]);det=dot(a[0],bc)
  if abs(det)<1e-7:continue
  ca=cross(c[0],a[0]);ab=cross(a[0],b[0]);p=[(a[1]*bc[i]+b[1]*ca[i]+c[1]*ab[i])/det for i in range(3)]
  if all(dot(n,p)<=d+.02 for n,d,_ in faces)and not any(dot(sub(p,q),sub(p,q))<.001 for q in vertices):vertices.append(p)
 if len(vertices)<4:audit['degenerate brushes']+=1;return
 if not intersects(vertices):audit['outside brushes']+=1;return
 # Clip the convex hull to the playable envelope so no hidden distant slab
 # expands the runtime spatial index or creates unreachable exterior routes.
 bounds=[([1,0,0],CROP[1]),([-1,0,0],-CROP[0]),([0,1,0],CROP[3]),([0,-1,0],-CROP[2]),([0,0,1],CROP[5]),([0,0,-1],-CROP[4])]
 clipped=[(n,d)for n,d,_ in faces]+bounds
 for n,d,material in faces:
  poly=[v for v in vertices if abs(dot(n,v)-d)<.04]
  if len(poly)<3 or hidden(material):continue
  center=[sum(v[i]for v in poly)/len(poly)for i in range(3)]
  u=unit(sub(poly[0],center));v=cross(n,u)
  poly.sort(key=lambda p:math.atan2(dot(sub(p,center),v),dot(sub(p,center),u)))
  for i in range(1,len(poly)-1):emit(role(material),[poly[0],poly[i],poly[i+1]])
 if solid and not all(nonphysical(f[2])for f in faces):
  ps=[direction(n)+[(d-dot(n,ORIGIN))*SCALE] for n,d in clipped]
  clipped_vertices=[[min(max(p[i],CROP[i*2]),CROP[i*2+1])for i in range(3)]for p in vertices]
  block(clipped_vertices,ps,tag,all(hidden(f[2])for f in faces))
  audit['convex brushes']+=1
def mesh(node,m,t,tag,solid=True,curved=False):
 if not node['children']:return
 body=node['children'][0];rows=body['children']
 # Parentheses are rows, not brace nodes, so read v records in source order.
 lines=body['lines'];solid=solid and not any(re.search(r'contents\s+(?:weaponClip|nonColliding)',line)for line in lines);vertices=[];turned=[]
 for line in lines:
  match=re.match(r'v\s+(\S+)\s+(\S+)\s+(\S+)\s+(?:c|t)',line)
  if match:
   vertices.append(transform(list(map(float,match.groups())),m,t));flag=re.search(r'\bf\s+(\d+)',line);turned.append(bool(flag and int(flag[1])&1))
 dims=next((list(map(int,line.split()[:2]))for line in lines if re.match(r'^\d+ \d+ \d+ \d+$',line)),None)
 if not dims or len(vertices)!=dims[0]*dims[1]:
  if audit['unsupported meshes']<2:print('Unsupported mesh:',lines[:10],dims,len(vertices),file=sys.stderr)
  audit['unsupported meshes']+=1;return
 material=next((line for line in lines if re.match(r'^[\w/]+$',line)and line not in ['lightmap_gray']), 'concrete')
 visible=not hidden(material) or (cfg.get('meshCaulkVisible') and material=='caulk')
 if not visible and nonphysical(material):return
 w,h=dims
 def quad(a,b,c,d,flip=False):
  triangles=([[a,b,c],[a,c,d]]if flip else[[a,b,d],[b,c,d]])
  normal=unit(cross(sub(b,a),sub(c,a)));coplanar=cfg and solid and dot(normal,normal)>.5 and abs(dot(normal,sub(d,a)))<.001
  for tri in triangles:emit(role(material),tri,collision=solid and not coplanar,visible=visible)
  if coplanar and intersects([a,b,c,d]):
   polygon=crop([a,b,c,d])
   if normal[2]<-.65:polygon.reverse()
   if len(polygon)>=3:prism(polygon,'quad-'+str(audit['collision quads']));audit['collision quads']+=1
 if curved and w%2 and h%2 and w>=3 and h>=3:
  for x in range(0,w-2,2):
   for y in range(0,h-2,2):
    def sample(u,v):
     bu=[(1-u)**2,2*u*(1-u),u*u];bv=[(1-v)**2,2*v*(1-v),v*v]
     return [sum(vertices[(x+i)*h+y+j][k]*bu[i]*bv[j]for i in range(3)for j in range(3))for k in range(3)]
    # Four subdivisions retain the architectural curves and walkable terrain.
    for i in range(4):
     for j in range(4):quad(sample(i/4,j/4),sample((i+1)/4,j/4),sample((i+1)/4,(j+1)/4),sample(i/4,(j+1)/4))
 else:
  for x in range(w-1):
   for y in range(h-1):quad(vertices[x*h+y],vertices[(x+1)*h+y],vertices[(x+1)*h+y+1],vertices[x*h+y+1],turned[x*h+y])
 audit['curves'if curved else'terrain meshes']+=1
@functools.lru_cache(None)
def model_library():return json.loads((REF/'shipment/model-geometry.json').read_text())
def model_path(name):
 for root in [BASE,REF/'cod4-sdk',REF/'batch-audit/mp_firingrange_source_cod4',REF/'nuketown/mp_nuked_pack_map_source']:
  for alias in [name,'bo2_'+name if name.startswith('hj_')else name]:
   p=root/'raw/xmodel'/alias
   if p.is_file():return p
 return BASE/'raw/xmodel'/name
@functools.lru_cache(None)
def model_collision(name):
 path=model_path(name)
 if not path.is_file():return []
 b=path.read_bytes();pos=b.index(b'\0',27)+1
 for _ in range(4):pos+=4;pos=b.index(b'\0',pos)+1
 pos+=4;sections=struct.unpack_from('<I',b,pos)[0];pos+=4;out=[]
 for _ in range(sections):
  count=struct.unpack_from('<I',b,pos)[0];pos+=4;start=pos;pos+=count*48;contents=struct.unpack_from('<I',b,pos+28)[0];pos+=36
  if not contents&(1|16|0x10000|0x20000):continue
  for i in range(count):
   a,c,d=[struct.unpack_from('<4f',b,start+i*48+j*16)for j in range(3)];cd=cross(c[:3],d[:3]);det=dot(a[:3],cd)
   if abs(det)<1e-12:continue
   da=cross(d[:3],a[:3]);ac=cross(a[:3],c[:3]);tri=[]
   for s,t in [(0,0),(1,0),(0,1)]:tri.append([(a[3]*cd[j]+(c[3]+s)*da[j]+(d[3]+t)*ac[j])/det for j in range(3)])
   out.append(tri)
 if cfg:
  from merge_collision_faces import merge_faces
  return merge_faces(out)
 return out
@functools.lru_cache(None)
def model(name):
 path=model_path(name)
 if not path.is_file():
  data=model_library();alias=name
  if name=='com_barrel_biohazard_rust':alias='com_barrel_white_rust'
  if name.startswith('me_cargocontainersingleface_'):alias='me_cargocontainersingleface'
  if name=='me_chainlink_fence_pole2':alias='me_chainlink_fence_pole'
  return [(data[alias]['p'],data[alias]['n'],'prop_'+name)] if alias in data else []
 data=path.read_bytes();assert struct.unpack_from('<H',data)[0]==25
 pos=data.index(b'\0',27)+1;lods=[]
 for _ in range(4):
  pos+=4;end=data.index(b'\0',pos);lods.append(data[pos:end].decode());pos=end+1
 pos+=4;sections=struct.unpack_from('<I',data,pos)[0];pos+=4
 for _ in range(sections):
  count=struct.unpack_from('<I',data,pos)[0];pos+=4+count*48+36
 count=struct.unpack_from('<H',data,pos)[0];pos+=2;materials=[]
 for _ in range(count):
  end=data.index(b'\0',pos);materials.append(data[pos:end].decode());pos=end+1
 lod=next((n for n in lods if n),'')
 sf=path.parent.parent/'xmodelsurfs'/lod.lower()
 if not sf.exists():return []
 b=sf.read_bytes()
 if struct.unpack_from('<H',b)[0]!=25:
  audit['unsupported model '+name]+=1;return []
 inputs[str(sf.relative_to(REF))]=hashlib.sha256(b).hexdigest();pos=4;result=[]
 for surface_index in range(struct.unpack_from('<H',b,2)[0]):
  pos+=3;nv,nt,nv2=struct.unpack_from('<HHH',b,pos);pos+=6
  if nv!=nv2:
   pos+=2
   if nv2:
    while struct.unpack_from('<H',b,pos)[0]:pos+=2
    pos+=4
  else:pos+=4
  verts=[];normals=[]
  for _ in range(nv):
   normals.append(struct.unpack_from('<3f',b,pos));pos+=48
   weights=0
   if nv!=nv2:weights=b[pos];pos+=3
   verts.append(struct.unpack_from('<3f',b,pos));pos+=12+weights*4
  pp=[];nn=[]
  for _ in range(nt):
   a,c,d=struct.unpack_from('<3H',b,pos);pos+=6
   for i in [a,d,c]:pp.extend(verts[i]);nn.extend(normals[i])
  material=materials[surface_index] if surface_index<len(materials)else ''
  if re.search('decal|_text$|_logo',material):continue
  kind='glass'if re.search('glass|window_c',material)else'rubber'if re.search('tire|rubber',material)else'light'if re.search('fluorescent_on|light.*_on',material)else'prop_'+name
  result.append((pp,nn,kind))
 assert pos==len(b),(name,pos,len(b))
 return result
def visit(path,m=IDENTITY,t=(0,0,0),depth=0):
 assert depth<12
 for ei,e in enumerate(parse(str(path))):
  p=props(e);cls=p.get('classname','worldspawn');name=p.get('model','')
  if cls=='misc_prefab':
   if re.search(r'trash/|/mp/|wire_black',name)or(ID=='shipment'and re.search(r'bldg/shipment_story|ch_apartment|city_store',name)):audit['scenery prefabs']+=1;continue
   child=BASE/'map_source'/name
   if not child.exists():audit['missing prefab '+name]+=1;continue
   o=list(map(float,p.get('origin','0 0 0').split()));r=rotation(list(map(float,p.get('angles','0 0 0').split())))
   scale=float(p.get('modelscale','1'));r=[[v*scale for v in row]for row in r]
   visit(child,compose(m,r),transform(o,m,t),depth+1);continue
  if cls in ('misc_model','script_model')and name:
   if name in cfg.get('omitModels',[]):audit['replaced climb-only model']+=1;continue
   o=transform(list(map(float,p.get('origin','0 0 0').split())),m,t)
   if not all(CROP[i*2]-100<=o[i]<=CROP[i*2+1]+100 for i in range(3)):audit['outside models']+=1;continue
   if re.search('grass|shrub|brush02|flowers|tree_|powerpole|bottle|trashbag|cardboard|antenna|milk|mannequin|dest_mp_nuked|picture_frame|curtain|lamp|pillow|books|cushion|hinge|knob|handle|plate_bolt|_plate_|restaurant_plate|clothes_|plants_|rubble_small|potted|tableclock',name):audit['decorative models']+=1;continue
   geo=model(name)
   if not geo:audit['missing model '+name]+=1;continue
   r=compose(m,rotation(list(map(float,p.get('angles','0 0 0').split()))));scale=float(p.get('modelscale','1'))
   for pp,nn,kind in geo:
    for i in range(0,len(pp),9):
     tri=[transform([v*scale for v in pp[j:j+3]],r,o)for j in range(i,i+9,3)];normals=[apply(r,nn[j:j+3])for j in range(i,i+9,3)]
     emit('landscape' if 'hedge'in name else kind,tri,normals)
   if cfg and abs(scale*dot(r[0],cross(r[1],r[2])))>1e-10:
    native=model_collision(name)
    if native:
     from source_collision_mesh import prototype,instance
     if name not in collision_prototypes:
      positions=[];ix=[];unique={}
      for polygon in native:
       ids=[]
       for p in polygon:
        key=tuple(p)
        if key not in unique:unique[key]=len(positions);positions.append(p)
        ids.append(unique[key])
       ix.extend([[ids[0],ids[j],ids[j+1]]for j in range(1,len(ids)-1)])
      collision_prototypes[name]=(len(collision_meshes['models']),positions);collision_meshes['models'].append(prototype(positions,ix))
     proto,positions=collision_prototypes[name];mat=[[v*scale*SCALE for v in r[0]],[v*scale*SCALE for v in r[2]],[-v*scale*SCALE for v in r[1]]];offset=game(o)
     for row,v in zip(mat,offset):row.append(v)
     collision_meshes['instances'].append(instance(proto,positions,mat,name))
   model_instances.append(dict(name=name,position=game(o)));audit['models']+=1;continue
  if cls=='mp_dm_spawn':
   o=transform(list(map(float,p['origin'].split())),m,t);spawns.append(dict(position=game(o),source=o,angle=float(p.get('angles','0 0 0').split()[1])))
  if cls not in ('worldspawn','func_group','script_brushmodel'):continue
  if cls=='func_group'and p.get('type')in ('patch','terrain'):pass
  for bi,b in enumerate(e['children']):
   if 'mesh'in b['lines']or'curve'in b['lines']:mesh(b,m,t,str(ei)+'-'+str(bi),curved='curve'in b['lines'])
   else:brush(b,m,t,'brush-'+str(audit['convex brushes']))

if cfg.get('external'):
 from import_external_sources import visit_external
 visit_external(globals())
else:
 visit(BASE/'map_source'/filename)
 for extra in cfg.get('extraMaps',[]):visit(BASE/'map_source'/extra)
for spawn in cfg.get('spawns',[]):spawns.append(dict(position=game(spawn[:3]),source=spawn[:3],angle=spawn[3] if len(spawn)>3 else 0))
if cfg.get('stairClearances'):
 from stair_collision import clear_stairs
 brushes[:]=clear_stairs(brushes,cfg['stairClearances'])

if cfg.get('removeCollisionIds'):
 brushes[:]=[b for b in brushes if b['id']not in cfg['removeCollisionIds']]
# The navigable footprint removes scenery within the rectangular source crop
# as well. A one-cell margin retains the walls/fences which define play space.
# Clip triangles at the exterior cell edges; every retained in-play point and
# smooth vertex normal stays on its original surface.
footprint_path=REF/(cfg.get('footprintFolder',ID))/'playable-footprint.json'
if footprint_path.exists():
 footprint=json.loads(footprint_path.read_text());cells={tuple(c)for c in footprint['cells']};cell=footprint['cellSize']
 inputs[str(footprint_path.relative_to(REF))]=hashlib.sha256(footprint_path.read_bytes()).hexdigest()
 def clip_cell(poly,ix,iz):
  for axis,limit,sign in [(0,ix*cell,1),(0,(ix+1)*cell,-1),(2,iz*cell,1),(2,(iz+1)*cell,-1)]:
   if not poly:return []
   out=[]
   for a,b in zip(poly,poly[1:]+poly[:1]):
    da=(a[axis]-limit)*sign;db=(b[axis]-limit)*sign
    if da>=-1e-7:out.append(a)
    if da*db< -1e-14:
     t=da/(da-db);out.append([a[k]+(b[k]-a[k])*t for k in range(6)])
   poly=out
  return poly
 for name,g in groups.items():
  out={'p':array.array('f'),'n':array.array('f'),'c':[]}
  for i in range(0,len(g['p']),9):
   tri=[g['p'][j:j+3]+g['n'][j:j+3]for j in range(i,i+9,3)]
   ax=math.floor(min(p[0]for p in tri)/cell);bx=math.floor(max(p[0]for p in tri)/cell)
   az=math.floor(min(p[2]for p in tri)/cell);bz=math.floor(max(p[2]for p in tri)/cell)
   tiles=[(x,z)for x in range(ax,bx+1)for z in range(az,bz+1)]
   kept=[tile for tile in tiles if tile in cells]
   if not kept:audit['outside footprint triangles']+=1;continue
   polygons=[tri]if len(kept)==len(tiles)else[clip_cell(tri,*tile)for tile in kept]
   for poly in polygons:
    for j in range(1,len(poly)-1):
     vs=[poly[0],poly[j],poly[j+1]]
     if dot(cross(sub(vs[1][:3],vs[0][:3]),sub(vs[2][:3],vs[0][:3])),cross(sub(vs[1][:3],vs[0][:3]),sub(vs[2][:3],vs[0][:3])))<1e-12:continue
     for v in vs:out['p'].extend(v[:3]);out['n'].extend(unit(v[3:]))
  g.update(out)
source=dict(title='Stock Shipment' if ID=='shipment'else 'Nuked / Nuketown',author='Infinity Ward; source recovery xoxor4d / Stendby' if ID=='shipment'else 'Treyarch; CoD4 adaptation Stendby',scale=SCALE,origin=ORIGIN,cropSource=CROP,inputs=inputs,counts=dict(audit),format='Radiant iwmap 4 / v25 static models',provenance='https://customapscod.com/mod.php?id=ODE%3D' if ID=='shipment'else 'https://www.customapscod.com/mod.php?id=ODk%3D')
if cfg:source.update(title=cfg['title'],author=cfg['author'],provenance=cfg['provenance'])
if cfg.get('collisionAdaptation'):source['collisionAdaptation']=cfg['collisionAdaptation']
if cfg.get('stairClearances'):source['stairClearances']=cfg['stairClearances']
source['collisionMeshInstances']=len(collision_meshes['instances']);source['collisionMeshModels']=len(collision_meshes['models'])
render_keys.clear();collision_keys.clear()
def blob(values):return base64.b64encode(struct.pack('<%df'%len(values),*values)).decode()
for name,g in list(groups.items()):
 unique={};vertices=[];indices=[]
 for i in range(0,len(g['p']),3):
  if cfg:packed=struct.pack('<3i3h',*[round(v*4096)for v in g['p'][i:i+3]],*[max(-32767,min(32767,round(v*32767)))for v in unit(g['n'][i:i+3])])
  else:packed=struct.pack('<6f',*(g['p'][i:i+3]+g['n'][i:i+3]))
  if packed not in unique:unique[packed]=len(unique);vertices.append(packed)
  indices.append(unique[packed])
 groups[name]={'v':base64.b64encode(b''.join(vertices)).decode(),'i':base64.b64encode(struct.pack('<%dI'%len(indices),*indices)).decode()}
 if cfg:groups[name]['q']=1
out=dict(source=source,brushes=brushes,groups=groups,spawns=spawns,modelInstances=model_instances,water=[])
if collision_meshes['instances']:out['triangleCollision']=collision_meshes
path=ROOT/'dist/maps'/f'{ID}-data.js'
if not cfg:path.write_text('// Generated by tools/import-radiant.py. Indexed source geometry; original art excluded.\nconst decode=(s,T)=>{const raw=atob(s),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new T(bytes.buffer)};\nconst data='+json.dumps(out,separators=(',',':'))+';\nfor(const g of Object.values(data.groups)){const v=decode(g.v,Float32Array),ix=decode(g.i,Uint32Array);g.p=new Float32Array(ix.length*3);g.n=new Float32Array(ix.length*3);g.c=new Float32Array(ix.length*3).fill(.65);for(let i=0;i<ix.length;i++)for(let k=0;k<3;k++){g.p[i*3+k]=v[ix[i]*6+k];g.n[i*3+k]=v[ix[i]*6+3+k]}delete g.v;delete g.i}export default data;\n')
print(json.dumps(dict(map=ID,bytes=path.stat().st_size if path.exists()else 0,brushes=len(brushes),groups=len(groups),spawns=len(spawns),counts=dict(audit)),indent=2))
if cfg:
 # Packed collision retains the exact convex halfspaces without hundreds of
 # thousands of nested JSON number arrays at runtime.
 bounds=array.array('f');plane_values=array.array('f');offsets=array.array('I',[0]);ids=[]
 for b in brushes:
  bounds.extend([b['x'],b['z'],b['w'],b['d'],b['bottom'],b['top'],int(b.get('movementOnly',False))]);ids.append(b['id'])
  for p in b['planes']:plane_values.extend(p)
  offsets.append(len(plane_values)//4)
 out['collision']={'bounds':base64.b64encode(bounds.tobytes()).decode(),'planes':base64.b64encode(plane_values.tobytes()).decode(),'offsets':base64.b64encode(offsets.tobytes()).decode(),'ids':ids}
 del out['brushes']
 raw=json.dumps(out,separators=(',',':')).encode()
 packed=ROOT/'dist/maps'/f'{ID}-data.json.gz';temporary=packed.with_suffix('.gz.tmp');temporary.write_bytes(gzip.compress(raw,compresslevel=6,mtime=0));temporary.replace(packed)
 path.write_text("// Geometry-only source data; loaded on demand.\nimport {readSourceData} from './source-data.js';\nexport default await readSourceData(new URL('./"+ID+"-data.json.gz',import.meta.url));\n")
 print('Compressed geometry',packed.stat().st_size,flush=True)
