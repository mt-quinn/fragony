"""Read the supplied Shoot House Unity bundle without executing its behaviours.

Requires UnityPy. Saves scene transforms, renderer submesh selections, native
colliders, and indexed geometry. Source and static-batched render copies are
never both emitted. No texture, audio, shader or behaviour payload is copied.
"""
import collections, functools, json, pathlib, struct, sys
import UnityPy
from UnityPy.helpers.MeshHelper import MeshHandler
source=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
env=UnityPy.load(str(source));objects=list(env.objects)
def key(o):return str(o.assets_file.name)+':'+str(o.path_id)
def pointer(p):return key(p.deref()) if p else None
@functools.lru_cache(None)
def read(k):return readers[k].read()
readers={key(o):o for o in objects}
identity=[[1,0,0,0],[0,1,0,0],[0,0,1,0]]
def multiply(a,b):return [[sum(a[i][k]*b[k][j]for k in range(3))+(a[i][3]if j==3 else 0)for j in range(4)]for i in range(3)]
def local(t):
 q=t.m_LocalRotation;x,y,z,w=q.x,q.y,q.z,q.w;s=t.m_LocalScale;p=t.m_LocalPosition
 a=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),p.x],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),p.y],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),p.z]]
 for i in range(3):
  for j,v in enumerate([s.x,s.y,s.z]):a[i][j]*=v
 return a
transforms={};gos={};components=collections.defaultdict(dict)
for o in objects:
 if o.type.name=='Transform':
  t=o.read();transforms[key(o)]=t;components[pointer(t.m_GameObject)]['Transform']=key(o)
 elif o.type.name=='GameObject':gos[key(o)]=o.read()
 elif o.type.name in ('MeshRenderer','MeshFilter','MeshCollider','BoxCollider'):
  obj=o.read();components[pointer(obj.m_GameObject)].setdefault(o.type.name,[]).append(key(o))
@functools.lru_cache(None)
def world(k):
 t=transforms[k];return multiply(world(pointer(t.m_Father)),local(t))if t.m_Father else local(t)
@functools.lru_cache(None)
def active(k):
 g=gos[k];t=transforms[components[k]['Transform']]
 return bool(g.m_IsActive)and(not t.m_Father or active(pointer(transforms[pointer(t.m_Father)].m_GameObject)))
meshes={};materials={}
def meshref(p):
 if not p:return None
 try:k=pointer(p)
 except FileNotFoundError:return None # editor marker primitives live in Unity's built-in resources
 if k in meshes:return k
 m=p.read();a=m.m_LocalAABB
 meshes[k]={'name':m.m_Name,'center':[a.m_Center.x,a.m_Center.y,a.m_Center.z],'extent':[a.m_Extent.x,a.m_Extent.y,a.m_Extent.z],'vertices':m.m_VertexData.m_VertexCount,'submeshes':len(m.m_SubMeshes)}
 return k
renderers=[];colliders=[];spawns=[]
for k,g in gos.items():
 if k not in components or 'Transform'not in components[k]:continue
 c=components[k];matrix=world(c['Transform']);enabled=active(k);name=g.m_Name
 if 'spawn'in name.lower() and enabled:spawns.append({'name':name,'position':[r[3]for r in matrix]})
 for rk in c.get('MeshRenderer',[]):
  r=read(rk)
  if not enabled or not r.m_Enabled or not c.get('MeshFilter'):continue
  mf=read(c['MeshFilter'][0]);mesh=meshref(mf.m_Mesh)
  if not mesh:continue
  mats=[]
  for mp in r.m_Materials:
   mk=pointer(mp)
   if mk and mk not in materials:materials[mk]=mp.read().m_Name
   mats.append(materials.get(mk,''))
  batch=r.m_StaticBatchInfo
  renderers.append({'object':name,'mesh':mesh,'matrix':world(pointer(r.m_StaticBatchRoot))if batch.subMeshCount and r.m_StaticBatchRoot else identity if batch.subMeshCount else matrix,'firstSubMesh':batch.firstSubMesh if batch.subMeshCount else 0,'subMeshCount':batch.subMeshCount or meshes[mesh]['submeshes'],'materials':mats,'batched':bool(batch.subMeshCount)})
 for ck in c.get('MeshCollider',[]):
  r=read(ck)
  if enabled and r.m_Enabled and not r.m_IsTrigger and r.m_Mesh:colliders.append({'object':name,'mesh':meshref(r.m_Mesh),'matrix':matrix,'convex':r.m_Convex})
 for ck in c.get('BoxCollider',[]):
  r=read(ck)
  if enabled and r.m_Enabled and not r.m_IsTrigger:colliders.append({'object':name,'matrix':matrix,'center':[r.m_Center.x,r.m_Center.y,r.m_Center.z],'size':[r.m_Size.x,r.m_Size.y,r.m_Size.z]})
scene={'source':str(source),'meshes':meshes,'renderers':renderers,'colliders':colliders,'spawns':spawns}
(out/'scene.json').write_text(json.dumps(scene,separators=(',',':')))
print('SCENE',len(renderers),'renderers',sum(r['batched']for r in renderers),'batched;',len(colliders),'colliders;',len(spawns),'spawn markers',flush=True)
print('SPAWNS',spawns[:12],flush=True)
print('RENDER SAMPLES',renderers[100:102],flush=True)
for i,(k,meta)in enumerate(meshes.items()):
 filename='mesh-'+str(i);meta['file']=filename
 handler=MeshHandler(readers[k].read());handler.process();vertices=handler.m_Vertices or[];normals=handler.m_Normals or[(0,1,0)]*len(vertices)
 with (out/(filename+'.vertices')).open('wb')as f:
  for v,n in zip(vertices,normals):f.write(struct.pack('<6f',*v[:3],*n[:3]))
 triangles=handler.get_triangles();meta['ranges']=[]
 with (out/(filename+'.indices')).open('wb')as f:
  at=0
  for tris in triangles:
   meta['ranges'].append([at,len(tris)]);at+=len(tris)
   for tri in tris:f.write(struct.pack('<3I',*tri))
 if i%100==0:print('MESHES',i,'/',len(meshes),flush=True)
(out/'scene.json').write_text(json.dumps(scene,separators=(',',':')))
print('Geometry scene extraction complete.',flush=True)
