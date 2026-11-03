"""Original EF Radiant brushes/Bezier patches; no scripts or source art executed.

Usage: python3 tools/import-eliteforce.py [siege ...]
One rigid axis conversion and 1/32 scale preserve all original architecture.
Source entity/provenance records remain available for placement/traversal QA.
"""
import array, base64, collections, gzip, hashlib, itertools, json, math, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REF = ROOT.parent/'reference-maps/eliteforce-next-map-round'
SELECT = json.loads((REF/'selection.json').read_text())
IDS = ['siege','mutiny','bravery','ef-showdown','delta-station','beta-station','forge2','forge1','blast-radius']
CONFIG = dict(zip(IDS, SELECT))
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
sub=lambda a,b:[x-y for x,y in zip(a,b)]
cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(v):
 l=math.sqrt(dot(v,v));return [x/l for x in v] if l>1e-10 else [0,0,0]
def blob(v,kind):return base64.b64encode(array.array(kind,v).tobytes()).decode()
def parse(path):
 root={'lines':[],'children':[]};stack=[root]
 for raw in path.read_text().splitlines():
  s=raw.split('//')[0].strip()
  if s=='{':
   n={'lines':[],'children':[]};stack[-1]['children'].append(n);stack.append(n)
  elif s=='}':stack.pop()
  elif s:stack[-1]['lines'].append(s)
 assert len(stack)==1
 return root['children']
def props(n):return dict(re.findall(r'^"([^"]+)"\s+"([^"]*)"$', '\n'.join(n['lines']),re.M))
plane_re=re.compile(r'^\(\s*([^()]+)\)\s*\(\s*([^()]+)\)\s*\(\s*([^()]+)\)\s*(\S+)')
def hull(n):
 faces=[]
 for line in n['lines']:
  m=plane_re.match(line)
  if m:
   p=[list(map(float,m[i].split()))for i in [1,2,3]];normal=unit(cross(sub(p[2],p[0]),sub(p[1],p[0])))
   if dot(normal,normal)>.5:faces.append((normal,dot(normal,p[0]),m[4]))
 vs=[]
 for a,b,c in itertools.combinations(faces,3):
  bc=cross(b[0],c[0]);det=dot(a[0],bc)
  if abs(det)<1e-7:continue
  ca=cross(c[0],a[0]);ab=cross(a[0],b[0]);p=[(a[1]*bc[i]+b[1]*ca[i]+c[1]*ab[i])/det for i in range(3)]
  if all(dot(n,p)<=d+.02 for n,d,_ in faces) and not any(dot(sub(p,q),sub(p,q))<.001 for q in vs):vs.append(p)
 return faces,vs
def hidden(m):return bool(re.search(r'^(?:common/)?(?:clip|playerclip|botclip|do_not_enter|do_not_enter|donotenter|ladder|trigger|origin|caulk|hint|skip|nodraw|sky|junk_sky|blocknpc|cushion)',m))
def tool(m):return bool(re.search(r'^common/(?:do_not_enter|donotenter|botclip|blocknpc|trigger|origin|hint|skip|ladder)',m))
def role(m):
 if re.search('glass|forcefield',m):return 'glass'
 if re.search('light|blip|glow',m):return 'light'
 if re.search('grate|grill|fence',m):return 'steel' # Original gratings remain solid source surfaces.
 if re.search('wood|plank|timber|doorwood',m):return 'wood'
 if re.search('metal|trim|pipe|rail|struct|black',m):return 'steel'
 if re.search('redline|blueline|console|panel|computer',m):return 'paint'
 return 'concrete'
def triangle_bvh(tris):
 positions=[];indices=[];points={}
 for tri in tris:
  for p in tri:
   key=tuple(round(v,7)for v in p)
   if key not in points:points[key]=len(positions)//3;positions.extend(p)
   indices.append(points[key])
 tb=[([min(p[k]for p in t)for k in range(3)],[max(p[k]for p in t)for k in range(3)])for t in tris]
 bounds=[];links=[];order=[]
 def node(ids):
  i=len(links);lo=[min(tb[t][0][k]for t in ids)for k in range(3)];hi=[max(tb[t][1][k]for t in ids)for k in range(3)];bounds.extend(lo+hi);links.extend([0,0])
  if len(ids)<=12:links[i]=-len(order)-1;links[i+1]=len(ids);order.extend(ids);return i//2
  axis=max(range(3),key=lambda k:hi[k]-lo[k]);ids.sort(key=lambda t:tb[t][0][axis]+tb[t][1][axis]);mid=len(ids)//2;links[i]=node(ids[:mid]);links[i+1]=node(ids[mid:]);return i//2
 node(list(range(len(tris))))
 return dict(p=blob(positions,'f'),i=blob([indices[t*3+k]for t in order for k in range(3)],'I'),b=blob(bounds,'f'),l=blob(links,'i'))

for id in sys.argv[1:] or IDS:
 config=CONFIG[id];path=REF/config['source_file'];entities=parse(path);audit=collections.Counter();groups={};brushes=[];patch_tris=[];special=[];items=[];starts=[];lights=[];seen=set();collision_seen=set();materials=collections.Counter()
 ep=[(props(e),e)for e in entities]
 origins=[list(map(float,p['origin'].split()))for p,e in ep if p.get('classname')=='info_player_deathmatch']
 assert origins
 # Translation centres the source play space; vertical datum stays below the
 # lowest source pickup/start, including lower routes, rather than cutting them.
 po=[list(map(float,p['origin'].split()))for p,e in ep if 'origin'in p and p.get('classname','').startswith(('item_','ammo_','weapon_','info_player_deathmatch')) and p.get('classname')!='item_botroam']
 origin=[(min(p[k]for p in origins)+max(p[k]for p in origins))/2 for k in [0,1]]+[math.floor((min(p[2]for p in po)-128)/32)*32]
 def point(p):return [(p[0]-origin[0])/32,(p[2]-origin[2])/32,(origin[1]-p[1])/32]
 def normal(p):return [p[0],p[2],-p[1]]
 def emit(m,tri,ns=None):
  n=unit(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])))
  if dot(n,n)<.5:return
  key=tuple(sorted(tuple(round(v,6)for v in p)for p in tri))
  if key in seen:audit['duplicate render triangles']+=1;return
  seen.add(key);g=groups.setdefault(role(m),{'p':[],'n':[]})
  g['p'].extend(v for p in tri for v in point(p));g['n'].extend(v for nn in (ns or [n]*3) for v in normal(nn));audit['triangles']+=1
 def record_brush(n,tag,render=True,solid=True):
  faces,vs=hull(n)
  if len(vs)<4:return None
  ms=[f[2]for f in faces];materials.update(ms);pts=[point(p)for p in vs];lo=[min(p[k]for p in pts)for k in range(3)];hi=[max(p[k]for p in pts)for k in range(3)]
  box={'id':id+'-'+tag,'x':(lo[0]+hi[0])/2,'z':(lo[2]+hi[2])/2,'w':hi[0]-lo[0],'d':hi[2]-lo[2],'bottom':lo[1],'top':hi[1],'planes':[normal(n)+[(d-dot(n,origin))/32]for n,d,_ in faces],'movementOnly':all(hidden(m)for m in ms)}
  if any('ladder'in m for m in ms):special.append({'classname':'source_ladder','bounds':box,'sourceTag':tag})
  if solid and not all(tool(m)for m in ms):
   key=tuple(sorted(tuple(round(v,7)for v in p)for p in box['planes']))
   if key not in collision_seen:brushes.append(box);collision_seen.add(key);audit['convex brushes']+=1
  if render:
   for n,d,m in faces:
    if hidden(m):continue
    poly=[p for p in vs if abs(dot(n,p)-d)<.04]
    if len(poly)<3:continue
    center=[sum(p[k]for p in poly)/len(poly)for k in range(3)];u=unit(sub(poly[0],center));v=cross(n,u);poly.sort(key=lambda p:math.atan2(dot(sub(p,center),v),dot(sub(p,center),u)))
    for j in range(1,len(poly)-1):emit(m,[poly[0],poly[j],poly[j+1]],[n]*3)
  return box
 def patch(n,tag):
  body=n['children'][0];s='\n'.join(body['lines']);m=body['lines'][0];records=re.findall(r'\(\s*([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s*\)',s)
  dims=list(map(int,records[0][:2]));w,h=dims;control=[list(map(float,p[:3]))for p in records[1:]]
  assert len(control)==w*h,(id,tag,dims,len(control))
  audit['patches']+=1
  if hidden(m):return
  for x in range(0,w-2,2):
   for y in range(0,h-2,2):
    # Radiant serializes columns first, each with height control points.
    cp=[[control[(x+i)*h+y+j]for j in range(3)]for i in range(3)]
    def bez(u,v):
     a=[(1-u)**2,2*u*(1-u),u*u];b=[(1-v)**2,2*v*(1-v),v*v]
     return [sum(cp[i][j][k]*a[i]*b[j]for i in range(3)for j in range(3))for k in range(3)]
    steps=8;grid=[[bez(i/steps,j/steps)for j in range(steps+1)]for i in range(steps+1)]
    for i in range(steps):
     for j in range(steps):
      for tri in [[grid[i][j],grid[i+1][j],grid[i+1][j+1]],[grid[i][j],grid[i+1][j+1],grid[i][j+1]]]:
       emit(m,tri)
       if dot(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])),cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])))>1e-7:
        game=[point(p)for p in tri];n=unit(cross(sub(game[1],game[0]),sub(game[2],game[0])))
        # Two-sided native patches: upward winding for exposed floor candidates.
        if n[1]<-.65:game=[game[0],game[2],game[1]]
        patch_tris.append(game)
 for ei,(p,e)in enumerate(ep):
  cls=p.get('classname','');pos=point(list(map(float,p.get('origin','0 0 0').split())))
  if cls=='info_player_deathmatch':starts.append({'position':pos,'angle':float(p.get('angle',0)),'entity':ei})
  if cls.startswith(('item_','weapon_','ammo_','holdable_'))and cls!='item_botroam' or cls in ['team_CTF_redflag','team_CTF_blueflag']:
   # target_give-only items are script supplies, not physical pickups.
   if not p.get('targetname'):
    amount=5 if cls.startswith('ammo_') or cls in ['item_hypo_small','item_armor_shard'] else 50 if cls in ['item_armor_body','item_quad','item_regen','item_haste','item_invis','item_flight','item_seeker','team_CTF_redflag','team_CTF_blueflag'] else 25
    items.append({'id':'source-'+str(ei),'position':pos,'amount':amount,'sourceClass':cls,'entity':ei})
  if cls=='light':lights.append({'position':pos,'intensity':float(p.get('light',300))})
  dynamic=cls=='func_plat';trigger=cls.startswith('trigger_');boxes=[]
  for bi,b in enumerate(e['children']):
   tag=str(ei)+'-'+str(bi)
   if b['lines'] and b['lines'][0]=='patchDef2':
    if not trigger and not dynamic:patch(b,tag)
   else:
    box=record_brush(b,tag,not(trigger or dynamic),not(trigger or dynamic))
    if box:boxes.append(box)
  if trigger or dynamic or cls.startswith('target_') and cls not in ['target_speaker']:
   special.append({**p,'position':pos,'entity':ei,'boxes':boxes})
 audit['patch collision triangles']=len(patch_tris)
 # Collision planes are retained without quantization or render simplification.
 bounds=[];planes=[];offsets=[0];ids=[]
 for b in brushes:
  ids.append(b['id']);bounds.extend([b['x'],b['z'],b['w'],b['d'],b['bottom'],b['top'],int(b['movementOnly'])]);planes.extend(v for p in b['planes']for v in p);offsets.append(len(planes)//4)
 packed={}
 for k,g in groups.items():
  # Indexed position+normal format shared with the existing source loader.
  unique={};verts=[];ix=[]
  for i in range(0,len(g['p']),3):
   values=tuple(g['p'][i:i+3]+g['n'][i:i+3]);key=tuple(round(v,7)for v in values)
   if key not in unique:unique[key]=len(verts)//6;verts.extend(values)
   ix.append(unique[key])
  packed[k]={'v':blob(verts,'f'),'i':blob(ix,'I')}
 source={'title':config['friendly_name'],'engine':config['engine_name'],'author':'Raven Software','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'scale':1/32,'origin':origin,'audit':dict(audit)}
 data={'source':source,'groups':packed,'collision':{'bounds':blob(bounds,'f'),'planes':blob(planes,'f'),'offsets':blob(offsets,'I'),'ids':ids}}
 if patch_tris:
  lo=[min(p[k]for t in patch_tris for p in t)for k in range(3)];hi=[max(p[k]for t in patch_tris for p in t)for k in range(3)];identity=[[1,0,0,0],[0,1,0,0],[0,0,1,0]]
  data['triangleCollision']={'models':[triangle_bvh(patch_tris)],'instances':[{'proto':0,'matrix':identity,'inverse':identity,'bounds':lo+hi,'name':'original-bezier-patches'}]}
 out=ROOT/'dist/maps'/f'{id}-data.json.gz';out.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=6,mtime=0))
 authoring=REF/id;authoring.mkdir(exist_ok=True);(authoring/'source-entities.json').write_text(json.dumps({'source':source,'starts':starts,'items':items,'special':special,'lights':lights},indent=2))
 print(id,json.dumps(dict(audit)),len(items),'pickups',out.stat().st_size,'bytes',flush=True)
