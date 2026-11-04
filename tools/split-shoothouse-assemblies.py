"""Separate disconnected geometry in Unity's material-combined renderers.

Source renderers with generic material names may span the entire map. Their
connected components, rather than that batch's midpoint, own the paint recipe.
Run after recover-shoothouse-objects.py. Original triangles are only referenced.
"""
import array,base64,collections,gzip,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1];path=root/'tools/art/shoothouse-objects.json.gz'
data=json.loads(gzip.decompress(path.read_bytes()));
source=root/'dist/maps/shoothouse-data.json.gz';raw=json.loads(gzip.decompress(source.read_bytes()))
if 'parts'in raw:raw=json.loads(gzip.decompress(b''.join((source.parent/p).read_bytes()for p in raw['parts'])))
raw=raw['groups']
objects=data['objects'];large={i+1 for i,o in enumerate(objects)if max(o['hi'][k]-o['lo'][k]for k in (0,2))>18 and not re.search(r'_\d+$',o['name'])}
for kind,blob in data['groups'].items():
 own=array.array('I');own.frombytes(base64.b64decode(blob));g=raw[kind];ix=array.array('I');ix.frombytes(base64.b64decode(g['ix']));pv=array.array('i');pv.frombytes(base64.b64decode(g['pv']));selected=collections.defaultdict(list)
 for ti,oi in enumerate(own):
  if oi in large:selected[oi].append(ti)
 for oi,tris in selected.items():
  parent={};first={}
  def find(a):
   while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
   return a
  for ti in tris:
   parent[ti]=ti
   for vi in ix[ti*3:ti*3+3]:
    if vi in first:parent[find(ti)]=find(first[vi])
    else:first[vi]=ti
  components=collections.defaultdict(list)
  for ti in tris:components[find(ti)].append(ti)
  for ci,tt in enumerate(components.values()):
   indices=set(v for ti in tt for v in ix[ti*3:ti*3+3]);lo=[min(pv[v*3+k]/4096 for v in indices)for k in range(3)];hi=[max(pv[v*3+k]/4096 for v in indices)for k in range(3)]
   o={**objects[oi-1],'lo':lo,'hi':hi,'component':ci};objects.append(o);new=len(objects)
   for ti in tt:own[ti]=new
  print(kind,objects[oi-1]['name'],len(components),'assemblies',flush=True)
 data['groups'][kind]=base64.b64encode(own.tobytes()).decode()
data['componentSplit']=True;path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));print('Objects',len(objects),'bytes',path.stat().st_size)
