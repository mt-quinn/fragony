"""Import supplied CoD1 Rust IBSP59 world geometry, collision and entity placements.
Usage: python3 tools/import-rust.py /path/zzz_mp_Rust.pk3
Structure reference: snake-biscuits/bsp_tool infinity_ward/call_of_duty1{,_demo}.py.
Original texture pixels and external game models are not imported. Outside scenery
is clipped to the original player-boundary envelope, not approximated by new cover.
"""
import sys,struct,zipfile,re,json,math,pathlib,collections,base64
source=pathlib.Path(sys.argv[1]);raw=source.read_bytes() if source.suffix.lower()=='.bsp' else zipfile.ZipFile(source).read('maps/mp/mp_Rust.bsp')
assert raw[:8]==b'IBSP;\0\0\0'
def lump(i):
 n,o=struct.unpack_from('<2I',raw,8+8*i);return raw[o:o+n]
def records(i,fmt):return list(struct.iter_unpack(fmt,lump(i)))
textures=records(0,'<64s2I');planes=records(2,'<4f');sides=records(3,'<2I');brushes=records(4,'<2H');soups=records(6,'<2HI2HI');vertices=records(7,'<10f4B');indices=[x[0]for x in records(8,'<H')];cv=records(25,'<3f');ci=[x[0]for x in records(26,'<H')];patches=records(24,'<I2H2I')
entities=[dict(re.findall(r'"(.*?)"\s+"(.*?)"',x))for x in re.findall(r'\{(.*?)\}',lump(29).decode(),re.S)]
# Original player clip walls: x86..98 /2575..2586, y622..637 /-1794..-1779.
# Keep their visible boundary structure as well, but discard all distant backdrop.
CROP=(74,2598,-1812,637);CROP_FLOOR=-5120;ORIGIN=(1336,-592,-5088);SCALE=1/32
r=lambda x:round(x,5)
def point(p):return[(p[0]-ORIGIN[0])*SCALE,(p[2]-ORIGIN[2])*SCALE,(ORIGIN[1]-p[1])*SCALE]
def normal(p):return[p[0],p[2],-p[1]]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def sub(a,b):return[x-y for x,y in zip(a,b)]
def unit(p):
 l=math.sqrt(dot(p,p));return[x/l for x in p]if l>1e-10 else[0,1,0]
def clip(poly,axis,value,positive):
 if not poly:return[]
 out=[];a=poly[-1];da=(a[axis]-value)*(1 if positive else-1)
 for b in poly:
  db=(b[axis]-value)*(1 if positive else-1)
  if (da>=-1e-6)!=(db>=-1e-6):
   t=da/(da-db);out.append([a[i]+t*(b[i]-a[i])for i in range(len(a))])
  if db>=-1e-6:out.append(list(b))
  a,da=b,db
 return out
def crop(poly):
 for axis,value,positive in[(0,CROP[0],True),(0,CROP[1],False),(1,CROP[2],True),(1,CROP[3],False),(2,CROP_FLOOR,True)]:poly=clip(poly,axis,value,positive)
 return poly
def transformed_plane(p):return[r(x)for x in(*normal(p[:3]),(p[3]-p[0]*ORIGIN[0]-p[1]*ORIGIN[1]-p[2]*ORIGIN[2])*SCALE)]
def name(i):return textures[i][0].split(b'\0')[0].decode()
def material(s):
 if 'sky/'in s or '/common/'in s:return None
 if 'fence' in s or 'masked' in s:return'fence'
 if 'seacontainer3'in s or 'zeikant3'in s:return'container-teal'
 if 'seacontainer4'in s or 'zeikant2'in s:return'container-ochre'
 if any(x in s for x in['dirt','rock@','cobblestone']):return'ground'
 if 'concrete'in s:return'concrete'
 if 'wood' in s or 'crate' in s:return'equipment'
 return'steel'
colors={'ground':[.51,.54,.46],'concrete':[.73,.75,.69],'steel':[.38,.45,.42],'container-teal':[.36,.53,.50],'container-ochre':[.65,.55,.34],'equipment':[.55,.59,.51],'fence':[.42,.49,.46],'model-cover':[.52,.59,.54]}
groups={};clipped_sources=0

def emit_triangle(kind,tri,shader=None):
 global clipped_sources
 poly=crop(tri)
 if len(poly)<3:return
 group=groups.setdefault(kind,{'p':[],'n':[],'c':[],'uv':[]})
 for i in range(1,len(poly)-1):
  v=[poly[0],poly[i],poly[i+1]];positions=[point(x[:3])for x in v]
  authored=unit(normal([sum(x[j]for x in v)for j in range(7,10)]))if len(v[0])>=10 else unit(cross(sub(positions[1],positions[0]),sub(positions[2],positions[0])))
  if dot(cross(sub(positions[1],positions[0]),sub(positions[2],positions[0])),authored)<0:v[1],v[2]=v[2],v[1];positions[1],positions[2]=positions[2],positions[1]
  for p,x in zip(positions,v):
   n=unit(normal(x[7:10]))if len(x)>=10 else authored;group['p']+=p;group['n']+=[r(a)for a in n];shade=.88+.12*max(0,n[1])+.025*n[0];group['c']+=[r(c*shade)for c in colors[kind]];group['uv']+=([r(x[3]),r(x[4])]if len(x)>=10 else[r(p[0]*.5),r(p[2]*.5)])
for sh,order,fv,nv,ni,fi in soups:
 kind=material(name(sh))
 if not kind:continue
 for i in range(fi,fi+ni,3):emit_triangle(kind,[vertices[fv+indices[i+j]]for j in range(3)],sh)

collision=[];model_clips=[];ladders=[];offset=0

def hull(ps,lo,hi):
 # Clip a source AABB by all authored non-axial planes, preserving convex shape.
 polygons=[]
 for axis in range(3):
  a,b=(axis+1)%3,(axis+2)%3
  for side in [0,1]:
   poly=[]
   for u,v in[(0,0),(1,0),(1,1),(0,1)]:
    p=[0,0,0];p[axis]=[lo,hi][side][axis];p[a]=[lo,hi][u][a];p[b]=[lo,hi][v][b];poly.append(p)
   polygons.append(poly)
 for plane in ps[6:]:
  nextpolys=[];cuts=[]
  for poly in polygons:
   result=[];a=poly[-1];da=plane[3]-dot(plane[:3],a)
   for b in poly:
    db=plane[3]-dot(plane[:3],b)
    if(da>=-1e-5)!=(db>=-1e-5):
     t=da/(da-db);p=[a[i]+t*(b[i]-a[i])for i in range(3)];result.append(p);cuts.append(p)
    if db>=-1e-5:result.append(b)
    a,da=b,db
   if len(result)>=3:nextpolys.append(result)
  if len(cuts)>=3:
   center=[sum(p[i]for p in cuts)/len(cuts)for i in range(3)];u=unit(sub(cuts[0],center));v=unit(cross(plane[:3],u));cuts.sort(key=lambda p:math.atan2(dot(sub(p,center),v),dot(sub(p,center),u)));nextpolys.append(cuts)
  polygons=nextpolys
 return polygons
for index,(count,shader)in enumerate(brushes):
 ss=sides[offset:offset+count];offset+=count;bounds=[struct.unpack('<f',struct.pack('<I',s[0]))[0]for s in ss[:6]]
 lo=[bounds[0],bounds[2],bounds[4]];hi=[bounds[1],bounds[3],bounds[5]];tex=name(shader);contents=textures[shader][2]
 if hi[0]<CROP[0]or lo[0]>CROP[1]or hi[1]<CROP[2]or lo[1]>CROP[3]or hi[2]<CROP_FLOOR:continue
 if 'sky/'in tex or contents==0x801:continue
 if not(contents&1 or contents&0x10000 or contents&0x20000):continue
 ps=[]
 for axis in range(3):
  for sign in[-1,1]:
   n=[0,0,0];n[axis]=sign;ps.append((*n,bounds[axis*2+(1 if sign>0 else 0)]*sign))
 ps+= [planes[s[0]]for s in ss[6:]]
 # Exact crop planes remove collision outside the retained boundary envelope.
 for axis,sign,value in[(0,-1,CROP[0]),(0,1,CROP[1]),(1,-1,CROP[2]),(1,1,CROP[3]),(2,-1,CROP_FLOOR)]:
  n=[0,0,0];n[axis]=sign;ps.append((*n,sign*value))
 lo[2]=max(lo[2],CROP_FLOOR);lo[0]=max(lo[0],CROP[0]);hi[0]=min(hi[0],CROP[1]);lo[1]=max(lo[1],CROP[2]);hi[1]=min(hi[1],CROP[3]);low=point([lo[0],hi[1],lo[2]]);high=point([hi[0],lo[1],hi[2]])
 block={'id':'rust-brush-'+str(index),'x':r((low[0]+high[0])/2),'z':r((low[2]+high[2])/2),'w':r(high[0]-low[0]),'d':r(high[2]-low[2]),'bottom':low[1],'top':high[1],'sourceShader':shader,'sourceContents':contents}
 if count>6:block['planes']=[transformed_plane(p)for p in ps]
 collision.append(block)
 if 'ladder'in tex:ladders.append({'id':index,'min':low,'max':high,'sourceBounds':bounds})
 if 'clip_nosight'in tex and hi[2]>-5088:
  model_clips.append(index)
  for poly in hull(ps,lo,hi):
   if len(poly)<3:continue
   center=[sum(p[i]for p in poly)/len(poly)for i in range(3)]
   # Determine outward face normal from the authored hull constraints.
   n=min(ps,key=lambda p:abs(dot(p[:3],center)-p[3]))[:3]
   for i in range(1,len(poly)-1):
    tri=[poly[0],poly[i],poly[i+1]];emit_triangle('model-cover',[list(p)+[0,0,0,0]+list(n)for p in tri])

# First stream uses indexed terrain; the remaining records use unindexed convex
# patch triangles. Their next offsets prove num_triangles*3 continuity in this file.
patch_kinds=collections.Counter();patch_count=0

def prism(tri,key):
 poly=crop(tri)
 if len(poly)<3:return
 for i in range(1,len(poly)-1):
  v=[point(p)for p in[poly[0],poly[i],poly[i+1]]];n=unit(cross(sub(v[1],v[0]),sub(v[2],v[0])))
  if math.sqrt(dot(cross(sub(v[1],v[0]),sub(v[2],v[0])),cross(sub(v[1],v[0]),sub(v[2],v[0]))))<1e-7:continue
  # Symmetric 25mm surface prism retains slopes and ceilings, rather than AABB terrain.
  e=.025;pts=[[p[j]+n[j]*s*e for j in range(3)]for p in v for s in[-1,1]];lo=[min(p[j]for p in pts)for j in range(3)];hi=[max(p[j]for p in pts)for j in range(3)];ps=[[*n,dot(n,v[0])+e],*[]];ps.append([*[-x for x in n],-dot(n,v[0])+e])
  center=[sum(p[j]for p in v)/3 for j in range(3)]
  for a,b in zip(v,v[1:]+v[:1]):
   side=unit(cross(sub(b,a),n));dist=dot(side,a)
   if dot(side,center)>dist:side=[-x for x in side];dist=-dist
   ps.append([*side,dist])
  # Redundant axial bounds keep the engine cylinder/plane broad phase local.
  # They do not alter the exact prism volume, but prevent false remote contacts.
  for axis in range(3):
   for sign in [-1,1]:
    q=[0,0,0];q[axis]=sign;ps.append([*q,(hi[axis] if sign>0 else -lo[axis])])
  collision.append({'id':f'rust-patch-{key}-{i}','x':r((lo[0]+hi[0])/2),'z':r((lo[2]+hi[2])/2),'w':r(max(.001,hi[0]-lo[0])),'d':r(max(.001,hi[2]-lo[2])),'bottom':r(lo[1]),'top':r(hi[1]),'planes':[[r(x)for x in p]for p in ps]})
for index,(flags,nv,ni,a,b)in enumerate(patches):
 if flags&65536:
  assert a+nv<=len(cv)and b+ni<=len(ci)
  for j in range(b,b+ni,3):prism([cv[a+ci[j+k]]for k in range(3)],f'{index}-{j}');patch_count+=1
  patch_kinds['indexed-terrain']+=1
 else:
  start=b;triangles=nv;assert start+triangles*3<=len(cv)
  if index+1<len(patches):assert patches[index+1][4]==start+triangles*3
  for j in range(start,start+triangles*3,3):prism(cv[j:j+3],f'{index}-{j}');patch_count+=1
  patch_kinds['unindexed-convex-patch']+=1
spawns=[];model_entities=[]
for e in entities:
 cls=e.get('classname','');p=[float(v)for v in e.get('origin','0 0 0').split()]
 if not(CROP[0]<=p[0]<=CROP[1]and CROP[2]<=p[1]<=CROP[3]):continue
 if cls=='mp_deathmatch_spawn':spawns.append({'position':point(p),'source':p,'angle':float(e.get('angles','0 0 0').split()[1]),'classname':cls})
 if cls in['misc_model','script_model']:model_entities.append({**e,'position':point(p),'sourcePosition':p,'externalAsset':True})
visible_vertices=[g['p']for g in groups.values()];bounds=[[min(g[i::3])for g in visible_vertices]for i in range(3)]
out={'source':'mp_Rust1.0 CoD1 remake supplied by player','format':'IBSP59','scale':SCALE,'sourceOrigin':ORIGIN,'cropSourceBounds':CROP,'cropSourceFloor':CROP_FLOOR,'sourceWorldBounds':list(records(27,'<6f6i')[0][:6]),'playableSourceBounds':[98,2575,-1779,622],'brushes':collision,'water':[],'groups':groups,'spawns':spawns,'modelEntities':model_entities,'modelCoverBrushes':model_clips,'ladders':ladders,'sourceTextures':[{'name':name(i),'flags':x[1],'contents':x[2]}for i,x in enumerate(textures)],'collisionPatchStats':dict(patch_kinds),'sourceCollisionTriangles':patch_count,'triangleCount':sum(len(g['p'])//9 for g in groups.values()),'notes':['Exact authored world triangles and brush planes. Rendered background outside original boundary envelope removed.','External base-game xmodels are not in supplied archive. Their source placements and collision hulls are retained; collision-backed missing props have closed matching hull skins.','Original masked fence/grate surfaces exported separately for material-aware treatment; no original pixels or game scripts executed.']}
encoded={kind:{key:base64.b64encode(struct.pack('<'+str(len(values))+'f',*values)).decode()for key,values in g.items()}for kind,g in groups.items()}
out['groups']=encoded
path=pathlib.Path('dist/maps/rust-data.js');path.write_text('// Generated by tools/import-rust.py from player-supplied IBSP59.\nconst data='+json.dumps(out,separators=(',',':'))+';\nconst floats=s=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new Float32Array(bytes.buffer);};\nfor(const g of Object.values(data.groups))for(const key of ["p","n","c","uv"])g[key]=floats(g[key]);\nexport default data;\n')
print('Wrote',path,path.stat().st_size,'bytes;',len(collision),'collision solids;',out['triangleCount'],'render triangles;',len(spawns),'DM spawns;',len(model_entities),'external model placements; clips',len(model_clips),dict(patch_kinds));print('LADDERS',json.dumps(ladders))
