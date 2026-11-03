"""Rebuild native collision from referenced source vertices only.
Unity mesh buffers may contain unused vertices. They must never participate in
instance bounds or convex cover hulls. No render surface is changed here.
"""
import pathlib,json,gzip,base64,re,functools,collections
import numpy as np
import meshoptimizer as meshopt
from scipy.spatial import ConvexHull
from source_collision_mesh import prototype,instance
root=pathlib.Path(__file__).resolve().parents[1];base=root.parent/'reference-maps/batch-audit/shoothouse/scene';scene=json.loads((base/'scene.json').read_text());path=root/'dist/maps/shoothouse-data.json.gz';data=json.loads(gzip.decompress(path.read_bytes()));models=[];instances=[];protos={};stats=collections.Counter()
cosmetic=re.compile(r'spawn|flag|sky|decal|flowers|foliage|grass|tree|blood|\bfx\b|anti|cigarette|misc_bolt|conduit_1_(?:strap|union)|barbed_wire|shell_casings|lighting_fixtures|wires_electrical|metal_chain|russian_coil|dirt_rocky|me_light_|exit_light|electrical_conduit|electrical_box_small|lamp_holder',re.I)
solid=re.compile(r'tire|crate|barrel|sandbag|pallet|cinderblock|trashcan|ammo_box',re.I)
max_scale=collections.defaultdict(lambda:1e-9)
for item in scene['colliders']:
 if item.get('mesh'):max_scale[item['mesh']]=max(max_scale[item['mesh']],float(np.linalg.norm(np.asarray(item['matrix'])[:,:3])))
@functools.lru_cache(16)
def mesh(key):
 m=scene['meshes'][key];v=np.frombuffer((base/(m['file']+'.vertices')).read_bytes(),dtype='<f4').reshape(-1,6)[:,:3];i=np.frombuffer((base/(m['file']+'.indices')).read_bytes(),dtype='<u4').reshape(-1,3);used=np.unique(i);return v[used],np.searchsorted(used,i).astype(np.uint32)
for r in scene['colliders']:
 name=r['object']
 if cosmetic.search(name):stats['decorative collider instances omitted']+=1;continue
 if not r.get('mesh'):continue
 points,indices=mesh(r['mesh'])
 if not len(points)or not len(indices):continue
 matrix=np.asarray(r['matrix'],dtype=np.float64).copy();matrix[:,3]+=[65,-245,300];world=points@matrix[:,:3].T+matrix[:,3];lo=world.min(axis=0);hi=world.max(axis=0)
 if np.any(hi<[-35,0,-53])or np.any(lo>[36,22,53]):continue
 if re.search('rubble|debris|gravel|garbage|trash|rock_cluster',name,re.I)and hi[1]-lo[1]<.5:stats['low loose ground detail omitted']+=1;continue
 hull=bool((r.get('convex')or solid.search(name))and np.max(hi-lo)<(7.2 if 'closed'in name else 4.5)and np.linalg.matrix_rank(points-points[0])==3)
 key=(r['mesh'],hull)
 if key not in protos:
  proto=len(models);protos[key]=proto
  if hull:
   h=ConvexHull(points);planes=h.equations.copy();planes[:,3]*=-1;planes=np.unique(np.round(planes,7),axis=0);models.append({'h':base64.b64encode(planes.astype('<f4').tobytes()).decode(),'t':len(h.simplices)});stats['source-vertex convex cover models']+=1
  else:
   quantum=.0001/max_scale[r['mesh']];keys=np.rint(points/quantum).astype(np.int64);_,first,remap=np.unique(keys,axis=0,return_index=True,return_inverse=True);unique=points[first];flat=np.asarray(remap[indices],dtype=np.uint32).reshape(-1);destination=np.empty_like(flat);error=np.zeros(1,dtype=np.float32);tolerance=.0009/max_scale[r['mesh']]
   count=meshopt.simplify(destination,flat,unique,target_index_count=max(3,(len(flat)//20//3)*3),target_error=tolerance,options=5,result_error=error)
   assert error[0]*max_scale[r['mesh']]<=.00101
   models.append(prototype(unique,destination[:count].reshape(-1,3)));stats['native triangle models']+=1;stats['native prototype triangles before LOD']+=len(indices);stats['native prototype triangles after LOD']+=count//3
 item=instance(protos[key],points,matrix,name);instances.append(item);stats['native source triangles before adaptation']+=len(indices)
data['triangleCollision']={'models':models,'instances':instances};data['source']['collisionMeshInstances']=len(instances);data['source']['collisionMeshModels']=len(models);data['source']['collisionAdaptation']={'method':'Indexed source vertices only. Exact source-vertex convex hull planes for small solid cover. Terrain, architecture, vehicles and open structures use border-locked source-vertex collision LOD with at most 1mm world-space error, including submillimetre seam welding. Tiny decorative items have no movement collider.','maximumCollisionErrorMetres':.001,'counts':dict(stats)}
tmp=path.with_suffix('.gz.tmp');tmp.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=6,mtime=0));tmp.replace(path);print(json.dumps(stats),len(models),len(instances),flush=True)
