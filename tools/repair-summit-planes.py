"""Repair packed Summit source and production collision without changing art."""
import base64, gzip, importlib, json, math, pathlib, re, struct
from summit_planes import signed_distance
root = pathlib.Path(__file__).resolve().parents[1]
cfg = json.loads((root/'tools/source-map-config.json').read_text())['summit']
base = root.parent/'reference-maps'/cfg['folder']/'dump/maps/mp'
clip = json.loads((base/'mp_mountain.d3dbsp.clipmap.json').read_text())
entities = [dict(re.findall(r'"([^"]+)"\s+"([^"]*)"', body)) for body in re.findall(r'\{([^{}]*)\}', (base/'mp_mountain.d3dbsp.ents').read_text())]
placements = {int(e['model'][1:]):e for e in entities if e.get('model','').startswith('*') and e.get('classname')=='script_brushmodel'}
owned = {bi:mi for mi,m in enumerate(clip['cmodels'][1:],1) for bi in m['brushes']}
def rotation(angles):
 p,y,r = [math.radians(a) for a in angles]; cp,sp,cy,sy,cr,sr=math.cos(p),math.sin(p),math.cos(y),math.sin(y),math.cos(r),math.sin(r)
 return [[cy*cp,cy*sp*sr-sy*cr,cy*sp*cr+sy*sr],[sy*cp,sy*sp*sr+cy*cr,sy*sp*cr-cy*sr],[-sp,cp*sr,cp*cr]]
def dot(a,b): return sum(x*y for x,y in zip(a,b))
for family in ['data','physics']:
 path = root/'dist/maps'/f'summit-{family}.json.gz'
 data = json.loads(gzip.decompress(path.read_bytes())); collision=data['collision']
 offsets=struct.unpack('<%dI'%(len(base64.b64decode(collision['offsets']))//4),base64.b64decode(collision['offsets']))
 planes=list(struct.unpack('<%df'%(len(base64.b64decode(collision['planes']))//4),base64.b64decode(collision['planes'])))
 count=0
 for i,key in enumerate(collision['ids']):
  match=re.fullmatch('summit-native-brush-(\\d+)',key)
  if not match: continue
  index=int(match[1]); brush=clip['brushes'][index]; entity=placements.get(owned.get(index,0),{})
  matrix=rotation(map(float,entity.get('angles','0 0 0').split())); offset=list(map(float,entity.get('origin','0 0 0').split()))
  for j,side in enumerate(brush['sides']):
   normal=[dot(row,side['normal']) for row in matrix]; distance=(signed_distance(side,brush['bounds'])+dot(normal,offset)-dot(normal,cfg['origin']))/32
   at=(offsets[i]+j)*4+3
   if abs(planes[at]-distance)>1e-5: planes[at]=distance;count+=1
 collision['planes']=base64.b64encode(struct.pack('<%df'%len(planes),*planes)).decode()
 data['source']['collisionPlaneRepair']='Native signed clip distances recovered against brush bounds; sloped staircase clips retained.'
 path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=6,mtime=0))
 print(f'{family}: repaired {count} signed plane distances')
