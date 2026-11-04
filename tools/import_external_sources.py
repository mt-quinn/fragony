"""Geometry-only adapters for the audited T6 and Unity source archives.

Adapters feed source-space triangles and original collision into the shared
crop/packing pipeline. They never execute imported scripts or source shaders.
"""
import collections, functools, hashlib, itertools, json, math, mmap, pathlib, re, struct

def glb_mesh(path):
 raw=path.read_bytes();assert raw[:4]==b'glTF';at=12;doc=None;binary=None
 while at<len(raw):
  size,kind=struct.unpack_from('<II',raw,at);part=raw[at+8:at+8+size];at+=size+8
  if kind==0x4e4f534a:doc=json.loads(part)
  if kind==0x004e4942:binary=part
 def accessor(i):
  a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];count={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];size=struct.calcsize('<'+fmt)*count;stride=v.get('byteStride',size);start=v.get('byteOffset',0)+a.get('byteOffset',0)
  return [struct.unpack_from('<'+fmt*count,binary,start+j*stride)for j in range(a['count'])]
 out=[]
 for m in doc['meshes']:
  for p in m['primitives']:
   positions=accessor(p['attributes']['POSITION']);normals=accessor(p['attributes']['NORMAL'])if'NORMAL'in p['attributes']else None;ix=[v[0]for v in accessor(p['indices'])];name=doc.get('materials',[{}])[p.get('material',0)].get('name','concrete')
   out.append((positions,normals,ix,name))
 return out

def visit_external(n):
 if n['cfg']['external']=='t6':summit(n)
 elif n['cfg']['external']=='unity':unity(n)
 else:raise ValueError(n['cfg']['external'])

def summit(n):
 from summit_planes import signed_distance
 base=n['BASE']/'dump';prefix='maps/mp/mp_mountain.d3dbsp';w=json.loads((base/(prefix+'.gfxworld.json')).read_text());cl=json.loads((base/(prefix+'.clipmap.json')).read_text());emit,role,game,prism,block=n['emit'],n['role'],n['game'],n['prism'],n['block'];crop=n['CROP'];origin=n['ORIGIN'];scale=n['SCALE'];audit=n['audit']
 vb=(base/w['vertexFile']).read_bytes();ib=(base/w['indexFile']).read_bytes()
 entities=[dict(re.findall(r'"([^"]+)"\s+"([^"]*)"',body))for body in re.findall(r'\{([^{}]*)\}',(base/(prefix+'.ents')).read_text())]
 placements={int(e['model'][1:]):e for e in entities if e.get('model','').startswith('*')and e.get('classname')=='script_brushmodel'}
 def entity_matrix(e):return n['rotation'](list(map(float,e.get('angles','0 0 0').split()))),list(map(float,e.get('origin','0 0 0').split()))
 for mi,model in enumerate(w['models']):
  if mi and mi not in placements:continue
  matrix,offset=entity_matrix(placements[mi])if mi else(n['IDENTITY'],(0,0,0))
  for s in w['surfaces'][model['startSurfIndex']:model['startSurfIndex']+model['surfaceCount']]:
   if re.search('sky|decal|waterfall|fog|foliage',s.get('material',''),re.I):continue
   for i in range(s['triCount']):
    ix=struct.unpack_from('<3H',ib,(s['baseIndex']+i*3)*2);v=[n['transform'](struct.unpack_from('<3f',vb,(s['firstVertex']+j)*44),matrix,offset)for j in ix]
    emit(role(s.get('material','')),v)
 print('Summit world shell',dict(audit),flush=True)
 # Native brush halfspaces retain the stock clip volumes, including collision
 # folded from props into this port's world clipmap. No AABB substitutes.
 owned={bi:mi for mi,m in enumerate(cl['cmodels'][1:],1)for bi in m['brushes']}
 for i,b in enumerate(cl['brushes']):
  mi=owned.get(i,0)
  if mi and mi not in placements:continue
  # Breakable glass is retained visually but left passable: the native map
  # expects it to shatter and our game has no breakable-window interaction.
  if mi and placements[mi].get('targetname')=='bo1_glass':continue
  if not b['contents']&(1|16|0x10000|0x20000):continue
  matrix,offset=entity_matrix(placements[mi])if mi else(n['IDENTITY'],(0,0,0))
  center=list(b['bounds']['midPoint'].values());half=list(b['bounds']['halfSize'].values());corners=[n['transform'](v,matrix,offset)for v in itertools.product(*[(center[j]-half[j],center[j]+half[j])for j in range(3)])]
  lo=[max(min(v[j]for v in corners),crop[j*2])for j in range(3)];hi=[min(max(v[j]for v in corners),crop[j*2+1])for j in range(3)]
  if any(a>=b for a,b in zip(lo,hi)):continue
  ps=[]
  for side in b['sides']:
   norm=n['apply'](matrix,side['normal']);distance=signed_distance(side,b['bounds'])+n['dot'](norm,offset);ps.append(n['direction'](norm)+[(distance-n['dot'](norm,origin))*scale])
  for axis in range(3):
   for sign,limit in [(1,hi[axis]),(-1,-lo[axis])]:
    norm=[0,0,0];norm[axis]=sign;ps.append(n['direction'](norm)+[(limit-n['dot'](norm,origin))*scale])
  block(list(itertools.product(*zip(lo,hi))),ps,'native-brush-'+str(i),not bool(b['contents']&17))
 verts=[v for v in struct.iter_unpack('<3f',(base/cl['vertFile']).read_bytes())];tris=list(struct.iter_unpack('<3H',(base/cl['triFile']).read_bytes()));uinds=struct.unpack('<%dH'%cl['nuinds'],(base/cl['uindFile']).read_bytes());materials={a['partition']:cl['materials'][a['materialIndex']]['contents']for a in cl['aabbTrees']if not a['childCount']}
 owned_part={pi:mi for mi,m in enumerate(cl['cmodels'][1:],1)for pi in m['partitions']}
 for pi,p in enumerate(cl['partitions']):
  mi=owned_part.get(pi,0)
  if mi and(mi not in placements or placements[mi].get('targetname')=='bo1_glass'):continue
  matrix,offset=entity_matrix(placements[mi])if mi else(n['IDENTITY'],(0,0,0))
  if not materials.get(pi,0)&(1|16|0x10000|0x20000):continue
  for ti in range(p['firstTri'],p['firstTri']+p['triCount']):
   tri=[n['transform'](verts[j],matrix,offset)for j in tris[ti]]
   if n['intersects'](tri):
    polygon=n['crop'](tri)
    for k in range(1,len(polygon)-1):prism([polygon[0],polygon[k],polygon[k+1]],'native-triangle-'+str(ti)+'-'+str(k))
 print('Summit native collision',len(n['brushes']),flush=True)
 @functools.lru_cache(None)
 def model(name):
  meta=base/'xmodel'/f'{name}.json'
  if not meta.exists():return []
  d=json.loads(meta.read_text());return glb_mesh(base/d['lods'][0]['file'])if d.get('lods')else[]
 for instance in w['staticModels']:
  name=instance.get('model','');o=list(instance['origin'].values())
  if not all(crop[j*2]-192<=o[j]<=crop[j*2+1]+192 for j in range(3))or re.search('tree|pine|foliage|grass|flower|bush|snowdrift|skybox|hanging_wire',name):continue
  axis=instance['axis'];matrix=[[axis[j][i]*instance['scale']for j in range(3)]for i in range(3)]
  for pp,nn,ix,mat in model(name):
   for k in range(0,len(ix),3):
    # GLB stores inches in Y-up; undo that rotation before native placement.
    tri=[n['transform']([pp[j][0],-pp[j][2],pp[j][1]],matrix,o)for j in ix[k:k+3]]
    emit(role(mat)if role(mat)!='concrete'else'prop_'+name,tri)
  n['model_instances'].append({'name':name,'position':game(o)})
 for body in re.findall(r'\{([^{}]*)\}',(base/(prefix+'.ents')).read_text()):
  d=dict(re.findall(r'"([^"]+)"\s+"([^"]*)"',body))
  if d.get('classname')=='mp_dm_spawn':
   p=list(map(float,d['origin'].split()));n['spawns'].append({'position':game(p),'source':p,'angle':float(d.get('angles','0 0 0').split()[1])})
 n['inputs']['batch-audit/summit-bo1/mp_mountain.ff']=hashlib.sha256((n['BASE']/'mp_mountain.ff').read_bytes()).hexdigest()

def unity(n):
 import numpy as np
 from scipy.spatial import ConvexHull
 from merge_collision_faces import merge_faces
 from source_collision_mesh import prototype,instance
 import meshoptimizer as meshopt
 base=n['BASE']/'scene';scene=json.loads((base/'scene.json').read_text());audit=n['audit'];emit=n['emit'];seen=set()
 @functools.lru_cache(16)
 def buffers(key):
  meta=scene['meshes'][key]
  vertices=np.frombuffer((base/(meta['file']+'.vertices')).read_bytes(),dtype='<f4').reshape(-1,6);indices=np.frombuffer((base/(meta['file']+'.indices')).read_bytes(),dtype='<u4').reshape(-1,3);used=np.unique(indices);return meta,vertices[used],np.searchsorted(used,indices).astype(np.uint32)
 def world(p,m):return [sum(m[i][j]*p[j]for j in range(3))+m[i][3]for i in range(3)]
 def cod(p):return [p[0]*32,-p[2]*32,p[1]*32]
 def transformed(p,m):return cod(world(p,m))
 low=np.array(n['CROP'][::2]);high=np.array(n['CROP'][1::2])
 def transform_array(vertices,matrix):
  m=np.asarray(matrix);p=vertices[:,:3]@m[:,:3].T+m[:,3];return np.column_stack((p[:,0]*32,-p[:,2]*32,p[:,1]*32))
 def keep(tris):return np.all(tris.max(axis=1)>=low,axis=1)&np.all(tris.min(axis=1)<=high,axis=1)
 cosmetic=re.compile(r'spawn|flag|sky|decal|flowers|foliage|grass|tree|blood|\bfx\b|anti|cigarette|misc_bolt|conduit_1_(?:strap|union)|barbed_wire',re.I)
 for r in scene['renderers']:
  if cosmetic.search(r['object']):continue
  meta,vb,ib=buffers(r['mesh']);matrix=r['matrix']
  for si in range(r['firstSubMesh'],r['firstSubMesh']+r['subMeshCount']):
   key=(r['mesh'],si,tuple(v for row in matrix for v in row))
   if key in seen:audit['duplicate source submesh']+=1;continue
   seen.add(key)
   material=r['materials'][min(si-r['firstSubMesh'],len(r['materials'])-1)]if r['materials']else r['object']
   if re.search('decal|sky|fog|shadow|dirt_overlay|garbage|rubble_small',material,re.I):continue
   first,count=meta['ranges'][si]
   indices=ib[first:first+count];used=np.unique(indices);points=transform_array(vb[used],matrix)
   if np.any(points.max(axis=0)<low)or np.any(points.min(axis=0)>high):audit['outside source submeshes']+=1;continue
   if re.search('rubble|debris|gravel|garbage|trash',r['object'],re.I)and np.ptp(points[:,2])<16:audit['nonstructural source detail']+=1;continue
   local_indices=np.searchsorted(used,indices).astype(np.uint32);tris=points[local_indices];mask=keep(tris);kind=n['role'](material)
   if kind=='concrete'and re.search('vehicle|veh8_|car_|helicopter|forklift|tire',r['object'],re.I):kind='prop_vehicle'
   selected=local_indices[mask]
   if len(selected)>48:
    # Border-locked, 8 mm maximum render error. The source collision below is
    # untouched. Kept vertices remain original source positions.
    unique,remap=np.unique(points.astype(np.float32),axis=0,return_inverse=True);indices=np.asarray(remap[selected],dtype=np.uint32).reshape(-1);destination=np.empty_like(indices);error=np.zeros(1,dtype=np.float32)
    count=meshopt.simplify(destination,indices,unique,target_index_count=max(3,(len(indices)//8//3)*3),target_error=.256,options=5,result_error=error)
    assert error[0]<=.25601
    audit['source render triangles before LOD']+=len(selected);audit['source render triangles after LOD']+=count//3
    for tri in unique[destination[:count].reshape(-1,3)]:emit(kind,[p.tolist()for p in tri])
   else:
    for tri in tris[mask]:emit(kind,[p.tolist()for p in tri])
  audit['source renderer instances']+=1
  if audit['source renderer instances']%1000==0:print('Shoot House source objects',audit['source renderer instances'],'triangles',audit['render triangles'],flush=True)
 print('Shoot House visible source shell',dict(audit),flush=True)
 # Use original enabled, non-trigger Unity colliders. Combined draw meshes are
 # never treated as collision, and editor markers never become game geometry.
 for ci,r in enumerate(scene['colliders']):
  if cosmetic.search(r['object']):continue
  matrix=r['matrix']
  if r.get('mesh'):
   meta,vb,ib=buffers(r['mesh'])
   if not len(vb)or not len(ib):continue
   points=transform_array(vb,matrix)
   if np.any(points.max(axis=0)<low)or np.any(points.min(axis=0)>high):continue
   if re.search('rubble|debris|gravel|garbage|trash',r['object'],re.I)and np.ptp(points[:,2])<16:continue
   if r.get('convex')and len(points)>=4 and np.linalg.matrix_rank(points-points[0])==3:
    hull=ConvexHull(points);planes=[n['direction'](p[:3])+[(-p[3]-n['dot'](p[:3],n['ORIGIN']))*n['SCALE']]for p in hull.equations];corners=points[hull.vertices].clip(low,high).tolist();n['block'](corners,planes,'unity-convex-'+str(ci),True)
   else:
    if r['mesh']not in n['collision_prototypes']:
     proto=len(n['collision_meshes']['models']);n['collision_prototypes'][r['mesh']]=proto;n['collision_meshes']['models'].append(prototype(vb[:,:3],ib))
    proto=n['collision_prototypes'][r['mesh']];game_matrix=[list(row)for row in matrix]
    for row,offset in zip(game_matrix,[65,-245,300]):row[3]+=offset
    n['collision_meshes']['instances'].append(instance(proto,vb[:,:3],game_matrix,r['object']))
  elif 'size'in r:
   center=r['center'];half=[v/2 for v in r['size']];corners=[transformed(v,matrix)for v in itertools.product(*[(center[j]-half[j],center[j]+half[j])for j in range(3)])]
   if not n['intersects'](corners):continue
   # An exact oriented box is six planes through its transformed corners.
   ps=[];mid=[sum(v[j]for v in corners)/8 for j in range(3)]
   for axis in range(3):
    for side in [-1,1]:
     pts=[v for bits,v in zip(itertools.product([-1,1],repeat=3),corners)if bits[axis]==side];normal=n['unit'](n['cross'](n['sub'](pts[1],pts[0]),n['sub'](pts[2],pts[0])));distance=n['dot'](normal,pts[0])
     if n['dot'](normal,mid)>distance:normal=[-v for v in normal];distance=-distance
     ps.append(n['direction'](normal)+[(distance-n['dot'](normal,n['ORIGIN']))*n['SCALE']])
   n['block'](corners,ps,'unity-box-'+str(ci),True)
  audit['source collider instances']+=1
  if ci%1000==0:print('Shoot House colliders',ci,'brushes',len(n['brushes']),flush=True)
 print('Shoot House original collision',len(n['brushes']),flush=True)
 for s in scene['spawns']:
  if not s['name'].lower().startswith('spawn'):continue
  p=cod(s['position'])
  if all(n['CROP'][j*2]<=p[j]<=n['CROP'][j*2+1]for j in range(3)):n['spawns'].append({'position':n['game'](p),'source':p,'angle':0})
 n['inputs']['batch-audit/shoothouse/usm_shoothouse.rfl']=hashlib.sha256((n['BASE']/'usm_shoothouse.rfl').read_bytes()).hexdigest()
