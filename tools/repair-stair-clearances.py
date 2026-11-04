"""Apply reviewed clearance subtraction to raw and prepared collision packs."""
import base64,gzip,json,pathlib,struct,sys
from stair_collision import clear_stairs
root=pathlib.Path(__file__).resolve().parents[1]
configs=json.loads((root/'tools/source-map-config.json').read_text())
def decode(s,code):
 b=base64.b64decode(s);return struct.unpack('<'+str(len(b)//4)+code,b)
def encode(v,code):return base64.b64encode(struct.pack('<'+str(len(v))+code,*v)).decode()
for name in sys.argv[1:]:
 for family in ['data','physics']:
  path=root/'dist/maps'/f'{name}-{family}.json.gz';data=json.loads(gzip.decompress(path.read_bytes()));c=data['collision'];bs=decode(c['bounds'],'f');offsets=decode(c['offsets'],'I');ps=decode(c['planes'],'f')
  brushes=[dict(id=key,x=bs[i*7],z=bs[i*7+1],w=bs[i*7+2],d=bs[i*7+3],bottom=bs[i*7+4],top=bs[i*7+5],movementOnly=bool(bs[i*7+6]),planes=[list(ps[j*4:j*4+4]) for j in range(offsets[i],offsets[i+1])]) for i,key in enumerate(c['ids'])]
  result=clear_stairs(brushes,configs[name]['stairClearances']);bounds=[];planes=[];offsets=[0]
  for b in result:
   bounds.extend([b['x'],b['z'],b['w'],b['d'],b['bottom'],b['top'],int(b['movementOnly'])]);planes.extend(v for p in b['planes'] for v in p);offsets.append(len(planes)//4)
  c.update(ids=[b['id'] for b in result],bounds=encode(bounds,'f'),planes=encode(planes,'f'),offsets=encode(offsets,'I'));data['source']['stairClearances']=configs[name]['stairClearances'];path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=6,mtime=0));print(name,family,len(brushes),'->',len(result))
