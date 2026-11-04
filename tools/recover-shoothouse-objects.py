"""Recover source renderer ownership without changing the imported triangles.

Source LOD keeps original vertices. Match their 1/4096 m positions back to
Unity renderer submeshes; source object bounds then provide whole-object paint
assignment. This is an offline authoring tool, not a runtime spatial heuristic.
"""
import array, base64, collections, functools, gzip, hashlib, json, re, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent/'reference-maps/batch-audit/shoothouse/scene'
def archive(path):
 s=json.loads(gzip.decompress(path.read_bytes()))
 if 'parts'in s:s=json.loads(gzip.decompress(b''.join((path.parent/p).read_bytes()for p in s['parts'])))
 return s
raw=archive(ROOT/'dist/maps/shoothouse-data.json.gz')
scene=json.loads((BASE/'scene.json').read_text())
points=set()
groups={}
for kind,g in raw['groups'].items():
 pv=array.array('i');pv.frombytes(base64.b64decode(g['pv']))
 ix=array.array('I');ix.frombytes(base64.b64decode(g['ix']))
 pp=list(zip(pv[::3],pv[1::3],pv[2::3]));points.update(pp);groups[kind]=(pp,ix)
print('Imported unique positions',len(points),flush=True)
owners={};objects=[];seen=set()
@functools.lru_cache(8)
def vertices(key):
 m=scene['meshes'][key];v=array.array('f');v.frombytes((BASE/(m['file']+'.vertices')).read_bytes());return m,v
cosmetic=re.compile(r'spawn|flag|sky|decal|flowers|foliage|grass|tree|blood|\bfx\b|anti|cigarette|misc_bolt|conduit_1_(?:strap|union)|barbed_wire',re.I)
for ri,r in enumerate(scene['renderers']):
 if cosmetic.search(r['object']):continue
 m,v=vertices(r['mesh']);matrix=r['matrix']
 for si in range(r['firstSubMesh'],r['firstSubMesh']+r['subMeshCount']):
  key=(r['mesh'],si,tuple(x for row in matrix for x in row))
  if key in seen:continue
  seen.add(key)
  material=r['materials'][min(si-r['firstSubMesh'],len(r['materials'])-1)]if r['materials']else r['object']
  if re.search('decal|sky|fog|shadow|dirt_overlay|garbage|rubble_small',material,re.I):continue
  first,count=m['ranges'][si];ix=array.array('I')
  with (BASE/(m['file']+'.indices')).open('rb')as f:f.seek(first*12);ix.frombytes(f.read(count*12))
  lo=[1e9]*3;hi=[-1e9]*3;matched=[]
  for i in set(ix):
   x,y,z=v[i*6:i*6+3]
   p=tuple(sum(row[j]*a for j,a in enumerate((x,y,z)))+row[3]+offset for row,offset in zip(matrix,(65,-245,300)))
   for j in range(3):lo[j]=min(lo[j],p[j]);hi[j]=max(hi[j],p[j])
   q=tuple(round(a*4096)for a in p)
   if q in points:matched.append(q)
  if not matched:continue
  oi=len(objects);objects.append({'name':r['object'].split('|')[0],'material':material,'lo':[round(a,5)for a in lo],'hi':[round(a,5)for a in hi]})
  for q in matched:
   if q not in owners:owners[q]=[oi]
   else:owners[q].append(oi)
 if ri%2000==0:print('Renderer',ri,'objects',len(objects),flush=True)
packed={};summary={}
for kind,(pp,ix)in groups.items():
 out=array.array('I');found=0
 for j in range(0,len(ix),3):
  votes=collections.Counter(o for i in ix[j:j+3]for o in owners.get(pp[i],()))
  if votes:
   # Prefer the smallest whole source assembly when coplanar objects share edges.
   best=max(votes,key=lambda o:(votes[o],-sum((objects[o]['hi'][k]-objects[o]['lo'][k])**2 for k in range(3))))
   found+=1;out.append(best+1)
  else:out.append(0)
 packed[kind]=base64.b64encode(out.tobytes()).decode();summary[kind]={'triangles':len(out),'matched':found}
path=ROOT/'tools/art/shoothouse-objects.json.gz';path.parent.mkdir(exist_ok=True)
path.write_bytes(gzip.compress(json.dumps({'version':1,'sourceArchiveSHA256':hashlib.sha256((ROOT/'dist/maps/shoothouse-data.json.gz').read_bytes()).digest().hex(),'objects':objects,'groups':packed,'summary':summary},separators=(',',':')).encode(),mtime=0))
print(json.dumps({'objects':len(objects),'summary':summary,'bytes':path.stat().st_size}),flush=True)

# Material-combined batches need connected source assemblies, too.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/'tools/split-shoothouse-assemblies.py')],check=True)
