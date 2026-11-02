"""Read-only map study. stdlib only. Writes derived evidence, never game assets.
.map brushes use inward plane normals; BSP uses outward planes.
Patch surfaces, shader semantics and runtime entity scripting are not reconstructed.
"""
from pathlib import Path
import re, json, math, struct, zipfile, collections, hashlib
ROOT=Path(__file__).parent
SOURCE=Path('/Users/quinn/Downloads')
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def parse_map(path):
 entities=[];brushes=[];depth=0;current=None;planes=[];textures=[];patches=0
 for line in path.read_text(errors='replace').splitlines():
  s=line.strip()
  if s=='{':
   depth+=1
   if depth==1:current={};entities.append(current)
   if depth==2:planes=[];textures=[]
  elif s=='}':
   if depth==2 and planes:brushes.append({'p':planes,'t':textures[0],'e':len(entities)-1})
   depth-=1
  elif depth==1 and s.startswith('"'):
   kv=re.findall(r'"([^"\n]*)"',s)
   if len(kv)>=2:current[kv[0]]=kv[1]
  elif depth==2 and s.startswith('('):
   m=re.match(r'\( ([^)]*) \) \( ([^)]*) \) \( ([^)]*) \) (\S+)',s)
   if not m:raise ValueError((path,s))
   a,b,c=[list(map(float,m[i].split())) for i in (1,2,3)]
   n=cross([b[i]-a[i] for i in range(3)],[c[i]-a[i] for i in range(3)])
   length=math.sqrt(dot(n,n))
   if length<1e-8:continue
   n=[-v/length for v in n];planes.append(n+[dot(n,a)]);textures.append(m[4])
  elif s.startswith('patchDef'):patches+=1
 assert depth==0
 return entities,brushes,patches,'Radiant source'
def parse_bsp(path,member):
 b=zipfile.ZipFile(path).read(member);ef2=b[:4]==b'EF2!';base=12 if ef2 else 8
 assert b[:8] in (b'EF2!\x14\0\0\0',b'IBSP.\0\0\0')
 def lump(i):
  o,n=struct.unpack_from('<ii',b,base+8*i);assert 0<=o<=len(b) and o+n<=len(b);return b[o:o+n]
 def rec(i,f):return list(struct.iter_unpack(f,lump(i)))
 entities=[dict(re.findall(r'"(.*?)"\s+"(.*?)"',x)) for x in re.findall(r'\{(.*?)\}',lump(16 if ef2 else 0).decode(errors='replace'),re.S)]
 planes=rec(1 if ef2 else 2,'<4f');shaders=rec(0 if ef2 else 1,'<64s3i' if ef2 else '<64s2i');sides=rec(12 if ef2 else 9,'<2i');raw=rec(13 if ef2 else 8,'<3i')
 brushes=[]
 for row in raw:
  count,start,shader=row if ef2 else (row[1],row[0],row[2])
  name=shaders[shader][0].split(b'\0')[0].decode();contents=shaders[shader][2]
  if not(contents & (1|32|65536)):continue
  ps=[planes[sides[i][1 if ef2 else 0]] for i in range(start,start+count)]
  brushes.append({'p':ps,'t':name,'e':0,'contents':contents})
 return entities,brushes,None,'EF2! v20' if ef2 else 'IBSP v46'
def category(c):
 if c=='item_botroam':return 'botroam'
 if c.startswith('info_player_deathmatch'):return 'spawn'
 if c.startswith('team_CTF_') and ('player' in c or 'spawn' in c):return 'teamspawn'
 if 'flag' in c.lower():return 'flag'
 if 'health' in c or 'hypo' in c or c=='holdable_medkit':return 'health'
 if 'armor' in c:return 'armor'
 if c.startswith(('weapon_','weapons_')):return 'weapon'
 if c.startswith('ammo_') or c.startswith('item_ammo'):return 'ammo'
 if c.startswith('item_') or c.startswith('holdable_'):return 'power'
 if c.startswith('target_') or c.startswith('trigger_') or c.startswith('func_'):return 'traversal'
 return 'other'
def clip(ps,z,bounds):
 x0,y0,x1,y1=bounds;poly=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
 for a,b,c,d in ps:
  if not poly:break
  out=[]
  for i,p in enumerate(poly):
   q=poly[(i+1)%len(poly)];dp=a*p[0]+b*p[1]+c*z-d;dq=a*q[0]+b*q[1]+c*z-d
   if dp<=.001:out.append(p)
   if (dp<=.001)!=(dq<=.001):
    t=dp/(dp-dq);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
  poly=out
 return poly
maps=[]
paths=[(p,None) for p in sorted((SOURCE/'eliteforce_holomatch_maps').glob('*.map'))]+[(SOURCE/'ctfreservoir/ctf_reservoir.pk3','maps/ctf_reservoir.bsp'),(SOURCE/'rev_voy2/rev_voy2.pk3','maps/rev_voy2.bsp')]
for path,member in paths:
 entities,brushes,patches,fmt=parse_bsp(path,member) if member else parse_map(path)
 points=[]
 for index,e in enumerate(entities):
  if 'origin' in e:
   p=list(map(float,e['origin'].split()))
   if len(p)==3:points.append({'p':p,'c':e.get('classname',''),'k':category(e.get('classname','')),'i':index,**{k:e[k] for k in ['target','targetname','angle','spawnflags','team'] if k in e}})
 playable=[e for e in points if e['k'] in ['spawn','teamspawn','flag','health','armor','weapon']]
 # Reservoir includes disconnected specialty rooms far below the main arena.
 if path.stem=='ctf_reservoir':playable=[e for e in playable if abs(e['p'][0])<1500 and -1100<e['p'][1]<2750 and -1500<e['p'][2]<600]
 bounds=[min(e['p'][i] for e in playable)-192 for i in (0,1)]+[max(e['p'][i] for e in playable)+192 for i in (0,1)]
 heights=sorted(e['p'][2] for e in playable);counts=collections.Counter(round(z/64)*64 for z in heights)
 bands=sorted(counts,key=lambda z:(-counts[z],z))[:3]
 if len(bands)<3:bands+= [max(heights)+128]*(3-len(bands))
 bands=sorted(set(bands));slices=[z+32 for z in bands]
 name=Path(member).stem if member else path.stem
 if name=='ctf_reservoir':slices=[-800,-256,16]
 if name=='rev_voy2':slices=[48,112,224]
 row={'name':name,'source':str(path),'member':member,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'format':fmt,'patches':patches,'entities':entities,'points':points,'brushes':brushes,'bounds':bounds,'bands':slices,'playablePointBounds':[[min(e['p'][i] for e in playable),max(e['p'][i] for e in playable)] for i in range(3)],'classes':dict(collections.Counter(e.get('classname','') for e in entities)),'pointKinds':dict(collections.Counter(e['k'] for e in points))}
 maps.append(row)
 print(name,'brushes',len(brushes),'patches',patches,'kinds',row['pointKinds'],'z',row['playablePointBounds'][2],flush=True)
(ROOT/'evidence.json').write_text(json.dumps(maps,separators=(',',':')))
# Derived small contact sheet, same crop per map across height slices. Units native, not metres.
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="%d" viewBox="0 0 1500 %d">'% (len(maps)*305+70,len(maps)*305+70),'<rect width="100%" height="100%" fill="#f5f2e9"/><text x="30" y="35" font-family="sans-serif" font-size="22">Elite Force spatial atlas — brush cross sections, not walkability</text>']
colors={'spawn':'#108b72','teamspawn':'#a240a6','flag':'#dc3b32','health':'#dc8b15','armor':'#1978c7','weapon':'#c33b59','power':'#8752bf','ammo':'#888','traversal':'#999','other':'#999'}
for mi,m in enumerate(maps):
 y=70+mi*305;svg.append(f'<text x="24" y="{y}" font-family="sans-serif" font-size="19">{m["name"]} · {m["format"]} · {len(m["brushes"])} brushes</text>')
 x0,y0,x1,y1=m['bounds'];scale=min(450/(x1-x0),245/(y1-y0))
 for ci,z in enumerate(m['bands']):
  ox=ci*500+25;oy=y+25
  svg.append(f'<text x="{ox}" y="{y+20}" font-family="sans-serif" font-size="12">native Z {z:g}</text>')
  for br in m['brushes']:
   poly=clip(br['p'],z,m['bounds'])
   if len(poly)<3:continue
   color='#a8cbd7' if 'water' in br['t'] or br.get('contents',0)&32 else '#444a50'
   if any(t in br['t'] for t in ['trigger','clip','nodraw','hint','skip']):color='#c4c0b3'
   coords=' '.join(f'{ox+(p[0]-x0)*scale:.2f},{oy+(y1-p[1])*scale:.2f}' for p in poly)
   svg.append(f'<polygon points="{coords}" fill="{color}"/>')
  for e in m['points']:
   if e['k'] in ('other','traversal','ammo','botroam') or abs(e['p'][2]-(z-32))>80:continue
   p=e['p']
   if not(x0<=p[0]<=x1 and y0<=p[1]<=y1):continue
   svg.append(f'<circle cx="{ox+(p[0]-x0)*scale:.2f}" cy="{oy+(y1-p[1])*scale:.2f}" r="3.4" fill="{colors[e["k"]]}" stroke="white" stroke-width=".6"/>')
svg.append('</svg>');(ROOT/'contact-sheet.svg').write_text(''.join(svg))
