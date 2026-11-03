"""Legacy converter for the user-supplied Shipment2 CoD4 fastfile.

The production Shipment map now uses import-radiant.py. This converter remains
the format reference for extract-iw3-model-library.py and writes a separate
legacy asset when run directly; it cannot overwrite the stock Shipment import.

Usage: python3 tools/import-shipment.py /path/to/mp_shipment2.ff
This is a fingerprint-checked converter for this supplied asset, not a general
fastfile loader. Layout/serialization reference: Laupetin/OpenAssetTools IW3
IW3_Assets.h and XAssets/{GfxWorld,clipMap_t,XModel}.txt. No original textures,
shaders, audio, scripts, character assets or outside scenery are distributed.
"""
import sys,struct,zlib,pathlib,json,re,math,hashlib,base64,collections
SOURCE_SHA='5617d0bddaa7d72577fbc0097d33f8875d333936702da8610e1fed47760fa4e4'
GFX=0xae31be;VERTS=0x10360e0;INDICES=0xae34a7;SURFACES=0x122f251;DRAW_INSTANCES=0x1242031;CLIP=0x125b901;MATERIAL_MEMORY=0x1023e97;MATERIAL_NAMES=(0x1024087,0x10360e0);MAPENTS=0x13239c1
SCALE=1/32;ORIGIN=(96,48,0);CROP=(-1152,1344,-1328,1424,-64,896)
INLINE=(0xffffffff,0xfffffffe)
source=pathlib.Path(sys.argv[1]);raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==SOURCE_SHA,'Unsupported fastfile fingerprint; do not use offsets on another map.'
assert raw[:8]==b'IWffu100' and struct.unpack_from('<I',raw,8)[0]==5
b=zlib.decompress(raw[12:]);assert len(b)==49953530
u=lambda o:struct.unpack_from('<I',b,o)[0];h=lambda o:struct.unpack_from('<H',b,o)[0];f=lambda o:struct.unpack_from('<f',b,o)[0]
def vec(o):return struct.unpack_from('<3f',b,o)
def point(p):return[(p[0]-ORIGIN[0])*SCALE,p[2]*SCALE,(ORIGIN[1]-p[1])*SCALE]
def normal(p):return[p[0],p[2],-p[1]]
def dot(a,c):return sum(x*y for x,y in zip(a,c))
def sub(a,c):return[x-y for x,y in zip(a,c)]
def cross(a,c):return[a[1]*c[2]-a[2]*c[1],a[2]*c[0]-a[0]*c[2],a[0]*c[1]-a[1]*c[0]]
def unit(v):
 n=math.sqrt(dot(v,v));return[x/n for x in v]if n>1e-10 else[0,1,0]
def unpack_normal(p):
 v=b[p:p+4];s=(v[3]+192)/32385;return[(v[i]-127)*s for i in range(3)]
def intersects(lo,hi):return hi[0]>=CROP[0] and lo[0]<=CROP[1] and hi[1]>=CROP[2] and lo[1]<=CROP[3] and hi[2]>=CROP[4] and lo[2]<=CROP[5]
def inside(p):return CROP[0]<=p[0]<=CROP[1] and CROP[2]<=p[1]<=CROP[3] and CROP[4]<=p[2]<=CROP[5]
# Polygon clipping only changes geometry beyond original playable boundaries.
def crop_triangle(vertices):
 p=vertices
 for axis,limit,sign in[(0,CROP[0],1),(0,CROP[1],-1),(1,CROP[2],1),(1,CROP[3],-1),(2,CROP[4],1),(2,CROP[5],-1)]:
  if not p:break
  out=[]
  for a,c in zip(p,p[1:]+p[:1]):
   da=(a[axis]-limit)*sign;dc=(c[axis]-limit)*sign
   if da>=-1e-7:out.append(a)
   if (da>=0)!=(dc>=0):
    t=da/(da-dc);out.append([a[i]+(c[i]-a[i])*t for i in range(len(a))])
  p=out
 return[[p[0],p[i],p[i+1]]for i in range(1,len(p)-1)]
groups={};world_sources=[];triangle_collision=[];collision=[];omitted=collections.Counter()
def color_for(name,n,p):
 if 'blue' in name:return[.40,.58,.63]
 if 'green' in name:return[.48,.57,.43]
 if 'white' in name:return[.73,.74,.67]
 if 'cargo' in name:return[.65,.55,.39]
 if 'ground' in name:return[.52,.56,.53]
 if 'fence' in name or 'metal' in name or 'vehicle' in name:return[.40,.48,.47]
 return[.70,.72,.66] if n[1]<.55 else[.60,.65,.59]
def add_triangle(name,vs,ns=None,source_id=None):
 if any(x in name for x in ['sky_sp','_default_water','decal','signage','containertext','containernumbers']):omitted['nonstructural world art']+=1;return
 ns=ns or [unit(cross(sub(vs[1],vs[0]),sub(vs[2],vs[0])))]*3
 data=[list(v)+list(n)for v,n in zip(vs,ns)]
 for tri in crop_triangle(data):
  g=groups.setdefault(name,{'p':[],'n':[],'c':[],'sourceMaterial':name})
  for v in tri:
   p=point(v[:3]);n=normal(unit(v[3:6]));g['p']+=p;g['n']+=n;g['c']+=color_for(name,n,p)
# Native world render mesh: local surface indices + firstVertex, packed normals.
assert(u(GFX+16),u(GFX+24),u(GFX+48))==(85863,1610,39990)
material_names=[m.group().decode()[3:]for m in re.finditer(rb'(?:mc|wc)/[a-zA-Z0-9_~&/.-]+',b[MATERIAL_NAMES[0]:MATERIAL_NAMES[1]])];assert len(material_names)==62
for i in range(1610):
 o=SURFACES+i*48;first=u(o+4);nv,nt=h(o+8),h(o+10);base=u(o+12);mi=(u(o+16)-0x4048745d)//8;assert 0<=mi<62
 name=material_names[mi];lo=vec(o+24);hi=vec(o+36)
 if not intersects(lo,hi):omitted['outside world surfaces']+=1;continue
 world_sources.append({'surface':i,'material':name,'firstVertex':first,'vertexCount':nv,'triangles':nt,'baseIndex':base})
 for j in range(nt):
  ids=struct.unpack_from('<3H',b,INDICES+(base+j*3)*2);assert max(ids)<nv
  vi=[VERTS+(first+k)*44 for k in ids];add_triangle(name,[vec(v)for v in vi],[unpack_normal(v+36)for v in vi],i)
# Native collision stream. Pointers alias already loaded arrays; no guessed bounds.
counts={name:(h(CLIP+off)if name=='brushes'else u(CLIP+off))for name,off in[('staticModels',16),('materials',24),('sides',32),('edges',40),('nodes',48),('leafs',56),('leafNodes',64),('leafBrushes',72),('leafSurfaces',80),('verts',88),('tris',96),('borders',108),('partitions',116),('aabbs',124),('cmodels',132),('brushes',140)]}
assert counts['staticModels']==1377 and counts['brushes']==1871
p=CLIP+284;offsets={}
def array(name,n,size):
 global p
 offsets[name]=p;r=p;p+=n*size;return r
static_start=array('staticModels',counts['staticModels'],80)
s=array('materials',counts['materials'],72);materials=[{'name':b[s+i*72:s+i*72+64].split(b'\0')[0].decode(),'surfaceFlags':u(s+i*72+64),'contents':u(s+i*72+68)}for i in range(counts['materials'])]
s=array('sides',counts['sides'],12);sides=[{'plane':(u(s+i*12)-0x40410e19)//20,'material':u(s+i*12+4)}for i in range(counts['sides'])]
planes=[struct.unpack_from('<4f',b,0xcad800+i*20)for i in range(2710)];assert all(abs(dot(n[:3],n[:3])-1)<.002 for n in planes)
array('edges',counts['edges'],1);array('nodes',counts['nodes'],8);array('leafs',counts['leafs'],44);array('leafBrushes',counts['leafBrushes'],2);s=array('leafNodes',counts['leafNodes'],20)
for i in range(counts['leafNodes']):
 cnt=struct.unpack_from('<h',b,s+i*20+2)[0]
 if cnt>0 and u(s+i*20+8)in INLINE:p+=cnt*2
array('leafSurfaces',counts['leafSurfaces'],4);s=array('verts',counts['verts'],12);clipverts=[vec(s+i*12)for i in range(counts['verts'])];s=array('tris',counts['tris']*3,2);clipindices=struct.unpack_from('<%dH'%(counts['tris']*3),b,s)
array('triWalkable',((3*counts['tris']+31)//32)*4,1);array('borders',counts['borders'],28);partitions=array('partitions',counts['partitions'],12);aabbs=array('aabbs',counts['aabbs'],32);array('cmodels',counts['cmodels'],72);s=array('brushes',counts['brushes'],80)
partition_material={}
for i in range(counts['aabbs']):
 q=aabbs+i*32
 if h(q+26)==0:partition_material[u(q+28)]=h(q+24)
triangle_material={}
for i in range(counts['partitions']):
 q=partitions+i*12;material=partition_material[i]
 for ti in range(u(q+4),u(q+4)+b[q]):triangle_material[ti]=material
assert len(triangle_material)==counts['tris']
for i in range(counts['brushes']):
 if i>=1859:omitted['local objective brushes']+=1;continue
 q=s+i*80;lo=list(vec(q));hi=list(vec(q+16));contents=u(q+12);n=u(q+28);first=(u(q+32)-0x40699969)//12 if n else 0
 if not intersects(lo,hi)or not(contents&(1|16|0x10000|0x20000)):omitted['outside or nonmovement brushes']+=1;continue
 if max(hi[0]-lo[0],hi[1]-lo[1])>6000 and lo[2]>0:omitted['skybox brushes']+=1;continue
 # Crop world-spanning ground slabs to the cosmetic envelope, beyond real clips.
 lo=[max(lo[j],CROP[j*2])if j<2 else max(lo[j],CROP[4])for j in range(3)];hi=[min(hi[j],CROP[j*2+1])if j<2 else min(hi[j],CROP[5])for j in range(3)]
 if any(hi[j]-lo[j]<.01 for j in range(3)):continue
 axial=[(1,0,0,hi[0]),(-1,0,0,-lo[0]),(0,1,0,hi[1]),(0,-1,0,-lo[1]),(0,0,1,hi[2]),(0,0,-1,-lo[2])];ps=axial+[planes[sides[j]['plane']]for j in range(first,first+n)]
 low=point((lo[0],hi[1],lo[2]));high=point((hi[0],lo[1],hi[2]));mids=struct.unpack_from('<6h',b,q+36)
 block={'id':'shipment-brush-'+str(i),'x':(low[0]+high[0])/2,'z':(low[2]+high[2])/2,'w':high[0]-low[0],'d':high[2]-low[2],'bottom':low[1],'top':high[1],'sourceBrush':i,'contents':contents,'movementOnly':not bool(contents&(1|16)),'sourceMaterials':list(dict.fromkeys(materials[k]['name']for k in mids if k>=0))}
 if n:block['planes']=[normal(v[:3])+[(v[3]-v[0]*ORIGIN[0]-v[1]*ORIGIN[1])*SCALE]for v in ps]
 collision.append(block)
def triangle_prism(vs,source_id,contents=1):
 # Original collision face is unchanged; backing thickness extends inward only.
 vv=[point(v)for v in vs];n=unit(cross(sub(vv[1],vv[0]),sub(vv[2],vv[0])));thickness=.0125
 if dot(n,n)<.5:return
 if abs(dot(sub(vv[1],vv[0]),cross(sub(vv[2],vv[0]),n)))<1e-8:return
 back=[[v[j]-n[j]*thickness for j in range(3)]for v in vv];allv=vv+back;lo=[min(v[j]for v in allv)for j in range(3)];hi=[max(v[j]for v in allv)for j in range(3)]
 ps=[[1,0,0,hi[0]],[-1,0,0,-lo[0]],[0,1,0,hi[1]],[0,-1,0,-lo[1]],[0,0,1,hi[2]],[0,0,-1,-lo[2]],n+[dot(n,vv[0])],[-x for x in n]+[-dot(n,vv[0])+thickness]]
 for a,c in zip(vv,vv[1:]+vv[:1]):
  en=unit(cross(sub(c,a),n));ps.append(en+[dot(en,a)])
 collision.append({'id':'shipment-triangle-'+str(source_id),'x':(lo[0]+hi[0])/2,'z':(lo[2]+hi[2])/2,'w':max(.001,hi[0]-lo[0]),'d':max(.001,hi[2]-lo[2]),'bottom':lo[1],'top':hi[1],'planes':ps,'sourceTriangle':source_id,'contents':contents,'movementOnly':True})
 triangle_collision.extend(sum(vv,[]))
for i in range(counts['tris']):
 material=materials[triangle_material[i]];contents=material['contents']
 if not contents&(1|16|0x10000|0x20000):continue
 vs=[clipverts[k]for k in clipindices[i*3:i*3+3]]
 if all(inside(v)for v in vs):triangle_prism(vs,'world-'+str(i),contents)
# Entity source string is metadata only; gameplay uses copied spawn transforms.
n=u(MAPENTS+8);entity_string=b[MAPENTS+12:MAPENTS+12+n].decode(errors='replace');entities=[dict(re.findall(r'"(.*?)"\s+"(.*?)"',e))for e in re.findall(r'\{(.*?)\}',entity_string,re.S)]
spawns=[{'position':point([float(x)for x in e['origin'].split()]),'source':[float(x)for x in e['origin'].split()],'angle':float(e.get('angles','0 0 0').split()[1]),'type':e['classname']}for e in entities if e.get('classname')=='mp_dm_spawn']
assert len(spawns)==22
# Recover exact compiled XModel LOD vertices/triangles for necessary in-play props.
# Unlike scenery baking, this never substitutes a primitive for a supplied mesh.
def parse_model(s,name,nb,nr,ns):
 p=b.index(b'\0',s+220)+1
 for off,n,size in[(8,nb,2),(12,nb-nr,1),(16,nb-nr,8),(20,(nb-nr)*4,4),(24,nb,1),(28,nb,32)]:
  if u(s+off)in INLINE:p+=n*size
 surf=p;p+=ns*56;out=[]
 for i in range(ns):
  q=surf+i*56;nv,nt=h(q+2),h(q+4);vc=struct.unpack_from('<4h',b,q+16);nblend=sum(v*c for v,c in zip(vc,[1,3,5,7]));vp=ip=None
  if u(q+24)in INLINE:p+=nblend*2
  if u(q+28)in INLINE:vp=p;p+=nv*32
  if u(q+36)in INLINE:
   nr=u(q+32);r=p;p+=nr*12
   for j in range(nr):
    rr=r+j*12
    if u(rr+8)in INLINE:
     t=p;p+=40
     if u(t+28)in INLINE:p+=u(t+24)*16
     if u(t+36)in INLINE:p+=u(t+32)*2
  if u(q+12)in INLINE:ip=p;p+=nt*6
  assert nv<20000 and nt<30000
  if vp and ip:assert max(struct.unpack_from('<%dH'%(nt*3),b,ip))<nv
  out.append({'nv':nv,'nt':nt,'vertices':vp,'indices':ip,'vertexPtr':u(q+28),'indexPtr':u(q+12)})
 return{'offset':s,'name':name,'bones':nb,'surfaces':out,'parsedEnd':p,'lodSurfaceCount':h(s+44),'lodSurfaceStart':h(s+46),'contents':u(s+160),'mins':list(vec(s+172)),'maxs':list(vec(s+184))}
models=[]
for match in re.finditer(rb'\xff\xff\xff\xff',b[:GFX]):
 s=match.start()
 if s+350>=GFX:continue
 nb,nr,ns,lr=b[s+4:s+8]
 if not(1<=nr<=nb and 1<=ns<=100 and lr<=2 and u(s+32)==0xffffffff):continue
 name=b[s+220:s+350].split(b'\0')[0]
 if re.fullmatch(rb'[a-zA-Z0-9_/-]{4,100}',name):models.append(parse_model(s,name.decode(),nb,nr,ns))
assert len(models)==68
# Zone stream block7/8 hold shared packed vertices and index arrays. Their
# pointer aliases can target a subrange of an earlier buffer (colored props
# intentionally reuse meshes). Source allocation alignment is16bytes.
for key,ptrkey,countkey,size,base in [('vertices','vertexPtr','nv',32,0x70000000),('indices','indexPtr','nt',6,0x80000000)]:
 offset=0;ranges=[]
 for model in models:
  for surface in model['surfaces']:
   if surface[key]:
    offset=(offset+15)//16*16;ranges.append((base+offset+1,base+offset+1+surface[countkey]*size,surface[key]));offset+=surface[countkey]*size
   else:
    pointer=surface[ptrkey];found=next((r for r in ranges if r[0]<=pointer<r[1]),None)
    if found:surface[key]=found[2]+pointer-found[0]
asset_indices=[i for i in range(188)if u(0x14bb+i*8)==3]
# The final unused model entry is a shared stub. All used static references stop
# before the objective/perk assets, whose transforms are deliberately not loaded.
model_assets=dict(zip(asset_indices,models));retained_models=[];model_counts=collections.Counter()
def transform(p,origin,axis,scale=1):return[origin[j]+scale*sum(p[k]*axis[k*3+j]for k in range(3))for j in range(3)]
def transform_normal(n,axis):return unit([sum(n[k]*axis[k*3+j]for k in range(3))for j in range(3)])
def model_needed(name,origin):
 return -1088<origin[0]<1280 and -1264<origin[1]<1360 and -32<origin[2]<640 and not any(x in name for x in ['foliage','apartment','lockingbar','bottle','cardboard','trashbag','milk','antenna','satellite','roadrock','trash_pile','plastic_crate','junktire','airduct','bomb_objective','perc_','water_tower','tower_crane','pallet_destroyed'])
for i in range(1377):
 q=DRAW_INSTANCES+i*76;origin=vec(q+4);axis=struct.unpack_from('<9f',b,q+16);scale=f(q+52);asset=((u(q+56)&0xfffffff)-1-0x1480-4)//8;m=model_assets.get(asset)
 assert m and asset<125,'Unexpected static model alias; verify source mapping.'
 if not model_needed(m['name'],origin):omitted['outside or decorative models']+=1;continue
 if not m['contents']&1:continue
 record={'sourceInstance':i,'asset':asset,'name':m['name'],'origin':list(origin),'axis':list(axis),'scale':scale,'position':point(origin),'contents':m['contents']};retained_models.append(record);model_counts[m['name']]+=1
 first=m['lodSurfaceStart'];count=m['lodSurfaceCount']
 for si in range(first,first+count):
  surf=m['surfaces'][si];vp,ip=surf['vertices'],surf['indices']
  if not(vp and ip):raise AssertionError('Unresolved shared source vertex buffer: '+m['name'])
  for ti in range(surf['nt']):
   ids=struct.unpack_from('<3H',b,ip+ti*6);vs=[transform(vec(vp+j*32),origin,axis,scale)for j in ids];ns=[transform_normal(unpack_normal(vp+j*32+24),axis)for j in ids]
   add_triangle('prop_'+m['name'],vs,ns,'model-'+str(i))
# Original model collision triangle coefficients are retained as compact audit
# data. Movement uses the map's original clip_nosight/playerclip convex hulls,
# which already cover these props; duplicating detailed ribs as thousands of
# capsule prisms would change source movement and waste mobile CPU.
MODEL_COLLISION_ANCHORS={"me_cargocontainerlockingbar":[{"offset":123237,"triangles":123281}],"me_cargocontainerlockingbar_flip":[{"offset":272415,"triangles":272459}],"vehicle_tanker_truck_civ":[{"offset":993142,"triangles":993890},{"offset":993186,"triangles":994466},{"offset":993230,"triangles":995042},{"offset":993274,"triangles":1112018},{"offset":993318,"triangles":1112930},{"offset":993362,"triangles":1113842},{"offset":993406,"triangles":1115954},{"offset":993450,"triangles":1116866},{"offset":993494,"triangles":1117778},{"offset":993538,"triangles":1118834},{"offset":993582,"triangles":1123826},{"offset":993626,"triangles":1128098},{"offset":993670,"triangles":1132370},{"offset":993714,"triangles":1138322},{"offset":993758,"triangles":1143938},{"offset":993802,"triangles":1149554},{"offset":993846,"triangles":1155266}],"me_dumpster":[{"offset":1231563,"triangles":1231651},{"offset":1231607,"triangles":1242691}],"com_trashbag1_black":[{"offset":1268563,"triangles":1268607}],"com_trashbag2_green":[{"offset":1313327,"triangles":1313371}],"com_cardboardbox01":[{"offset":1334514,"triangles":1334602},{"offset":1334558,"triangles":1336810}],"com_cardboardbox04":[{"offset":1338693,"triangles":1338781},{"offset":1338737,"triangles":1339357}],"com_bottle3":[{"offset":1349437,"triangles":1349481}],"com_cardboardbox03":[{"offset":1365979,"triangles":1366067},{"offset":1366023,"triangles":1369907}],"com_bottle1":[{"offset":1379160,"triangles":1379204}],"com_bottle2":[{"offset":1390011,"triangles":1390055}],"com_milk_carton":[{"offset":1398090,"triangles":1398134}],"bc_military_tire04_big":[{"offset":1449375,"triangles":1449419}],"me_chainlink_fence_pole":[{"offset":1470126,"triangles":1470170}],"vehicle_semi_truck_cargo":[{"offset":2323115,"triangles":2323335},{"offset":2323159,"triangles":2324007},{"offset":2323203,"triangles":2431911},{"offset":2323247,"triangles":2522535},{"offset":2323291,"triangles":2753367}],"me_cargocontainersingleface":[{"offset":3295740,"triangles":3295828},{"offset":3295784,"triangles":3450196}],"com_barrel_white_rust":[{"offset":4071890,"triangles":4071934}],"com_barrel_blue_rust":[{"offset":4085727,"triangles":4085771}],"com_barrel_black_rust":[{"offset":4099496,"triangles":4099540}],"com_barrel_green_rust":[{"offset":4113265,"triangles":4113309}],"com_barrel_white":[{"offset":4127182,"triangles":4127226}],"com_barrel_tan":[{"offset":4140930,"triangles":4140974}],"me_dumpster_close":[{"offset":4236355,"triangles":4236443},{"offset":4236399,"triangles":4246907}],"me_streetlight":[{"offset":4277326,"triangles":4277370}],"me_citrus_box2":[{"offset":4281501,"triangles":4281545}],"ch_roadrock_07":[{"offset":4286621,"triangles":4286665}],"com_pallet_stack":[{"offset":4482049,"triangles":4482093}],"com_pallet_2":[{"offset":4561133,"triangles":4561177}],"vehicle_80s_hatch1_yeldest":[{"offset":4697964,"triangles":4698052},{"offset":4698008,"triangles":4816708}],"vehicle_80s_sedan1_greendest":[{"offset":4928563,"triangles":4928651},{"offset":4928607,"triangles":5032955}],"com_barrel_black":[{"offset":5036676,"triangles":5036720}],"com_pallet_destroyed":[{"offset":5081776,"triangles":5081820}],"com_trashcan_metal_with_trash":[{"offset":5124921,"triangles":5125009},{"offset":5124965,"triangles":5127697}],"com_airduct_s_90":[{"offset":6180271,"triangles":6180315}],"com_airduct_square":[{"offset":6184757,"triangles":6184801}],"com_airduct_s_up_down":[{"offset":6189864,"triangles":6189952},{"offset":6189908,"triangles":6191296}],"com_ex_airconditioner":[{"offset":6230098,"triangles":6230142}],"me_satellitedish":[{"offset":6332018,"triangles":6332062}],"me_ac_window":[{"offset":6349634,"triangles":6349678}],"me_antenna2":[{"offset":6390915,"triangles":6390959}],"me_antenna3":[{"offset":6440380,"triangles":6440424}],"com_water_tower":[{"offset":6795865,"triangles":6795953},{"offset":6795909,"triangles":6868145}],"com_tower_crane":[{"offset":7121788,"triangles":7121832}],"vehicle_80s_sedan1_red":[{"offset":7506019,"triangles":7507471},{"offset":7506063,"triangles":7510687},{"offset":7506107,"triangles":7514815},{"offset":7506151,"triangles":7519279},{"offset":7506195,"triangles":7523119},{"offset":7506239,"triangles":7527583},{"offset":7506283,"triangles":7529407},{"offset":7506327,"triangles":7530367},{"offset":7506371,"triangles":7531135},{"offset":7506415,"triangles":7532095},{"offset":7506459,"triangles":7532863},{"offset":7506503,"triangles":7535263},{"offset":7506547,"triangles":7537663},{"offset":7506591,"triangles":7638079},{"offset":7506635,"triangles":7643359},{"offset":7506679,"triangles":7644127},{"offset":7506723,"triangles":7644895},{"offset":7506767,"triangles":7645087},{"offset":7506811,"triangles":7645327},{"offset":7506855,"triangles":7645519},{"offset":7506899,"triangles":7645759},{"offset":7506943,"triangles":7645807},{"offset":7506987,"triangles":7646575},{"offset":7507031,"triangles":7647343},{"offset":7507075,"triangles":7647535},{"offset":7507119,"triangles":7647775},{"offset":7507163,"triangles":7647967},{"offset":7507207,"triangles":7648207},{"offset":7507251,"triangles":7652719},{"offset":7507295,"triangles":7657999},{"offset":7507339,"triangles":7664527},{"offset":7507383,"triangles":7671055},{"offset":7507427,"triangles":7677583}],"com_trashbag2_black":[{"offset":7686011,"triangles":7686055}],"vehicle_semi_truck":[{"offset":8551701,"triangles":8551921},{"offset":8551745,"triangles":8552593},{"offset":8551789,"triangles":8660497},{"offset":8551833,"triangles":8751121},{"offset":8551877,"triangles":8981953}],"vehicle_semi_truck_trailer":[{"offset":9296377,"triangles":9296509},{"offset":9296421,"triangles":9344893},{"offset":9296465,"triangles":9435517}],"vehicle_small_hatchback_blue":[{"offset":9857826,"triangles":9858442},{"offset":9857870,"triangles":9859594},{"offset":9857914,"triangles":9859786},{"offset":9857958,"triangles":9859978},{"offset":9858002,"triangles":9860362},{"offset":9858046,"triangles":9860746},{"offset":9858090,"triangles":9861130},{"offset":9858134,"triangles":9861514},{"offset":9858178,"triangles":9864202},{"offset":9858222,"triangles":9866890},{"offset":9858266,"triangles":9898762},{"offset":9858310,"triangles":9900682},{"offset":9858354,"triangles":9902602},{"offset":9858398,"triangles":9904522}],"com_trashcan_metal":[{"offset":9930463,"triangles":9930507}],"foliage_tree_pine_lg_b":[{"offset":10047478,"triangles":10047610},{"offset":10047522,"triangles":10054762},{"offset":10047566,"triangles":10057258}],"com_airduct_c_scale":[{"offset":10059245,"triangles":10059289}],"me_corrugated_metal2x8":[{"offset":10069668,"triangles":10069712}],"me_corrugated_metal4x8":[{"offset":10088978,"triangles":10089022}],"me_plastic_crate3":[{"offset":10104105,"triangles":10104149}],"com_bottle4":[{"offset":10115813,"triangles":10115857}],"me_plastic_crate2":[{"offset":10120197,"triangles":10120241}],"com_junktire":[{"offset":10165717,"triangles":10165761}],"com_bomb_objective":[{"offset":10658146,"triangles":10658322},{"offset":10658190,"triangles":10660626},{"offset":10658234,"triangles":10707234},{"offset":10658278,"triangles":10709922}],"com_bomb_objective_d":[{"offset":11061730,"triangles":11061862},{"offset":11061774,"triangles":11095462},{"offset":11061818,"triangles":11101030}]}
model_collision={}
for name in model_counts:
 records=[]
 for record in MODEL_COLLISION_ANCHORS[name]:
  q=record['offset'];count=u(q+4);start=record['triangles'];coeff=b[start:start+count*48]
  assert len(coeff)==count*48
  records.append({'sourceOffset':q,'count':count,'mins':list(vec(q+8)),'maxs':list(vec(q+20)),'bone':u(q+32),'contents':u(q+36),'surfaceFlags':u(q+40),'coefficients':base64.b64encode(coeff).decode()})
 model_collision[name]=records

# Exact source collision triangles and brush provenance remain available for
# audits and for model-aware collision integration without altering render art.
out={'source':{'title':'Shipment2','author':'Carcass26','file':'mp_shipment2.ff','sha256':SOURCE_SHA,'format':'IWffu100/v5','decompressedBytes':len(b),'scale':SCALE,'origin':ORIGIN,'cropSource':CROP,'playableSourceApprox':[-1024,1208,-1200,1296],'counts':{'vertices':39990,'indices':85863,'surfaces':1610,'planes':2710,'brushes':1871,'collisionTriangles':2760,'staticModels':1377},'offsets':{'gfxWorld':GFX,'vertices':VERTS,'indices':INDICES,'surfaces':SURFACES,'clipMap':CLIP,'mapEnts':MAPENTS},'omitted':dict(omitted),'retainedModels':dict(model_counts)},'brushes':collision,'groups':groups,'spawns':spawns,'entities':entities,'materials':materials,'sourceWorldSurfaces':world_sources,'modelInstances':retained_models,'collisionTriangles':triangle_collision,'sourceModelCollision':model_collision,'water':[]}
def f32blob(values):return base64.b64encode(struct.pack('<%df'%len(values),*values)).decode()
# Compact float32 streams avoid enormous JSON number arrays on mobile Safari.
for g in groups.values():
 for key in('p','n','c'):g[key]=f32blob(g[key])
out['collisionTriangles']=f32blob(triangle_collision)
path=pathlib.Path(__file__).resolve().parent.parent/'dist/maps/shipment2-legacy-data.js'
path.write_text('// Generated from the supplied Shipment2 fastfile by tools/import-shipment.py.\nconst decode=s=>{const raw=atob(s),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Float32Array(bytes.buffer)};\nconst data='+json.dumps(out,separators=(',',':'))+';\nfor(const group of Object.values(data.groups))for(const key of ["p","n","c"])group[key]=decode(group[key]);data.collisionTriangles=decode(data.collisionTriangles);export default data;\n')
print(json.dumps({'file':str(path),'bytes':path.stat().st_size,'brushes':len(collision),'groups':len(groups),'spawns':len(spawns),'retainedModelInstances':len(retained_models),'modelTypes':dict(model_counts),'omitted':dict(omitted)},indent=2))
