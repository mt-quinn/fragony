"""Working 3D reconstruction for spatial investigation; not production map import.
Preserves source convex brush surfaces, quadratic patches, compiled BSP surfaces,
trigger bounds and entity target relationships. Uses 32 native units/metre only as
analysis coordinates. No original textures or original game simulation implied.
"""
from pathlib import Path
import json,re,struct,zipfile,math,itertools,collections
ROOT=Path(__file__).parent
EVIDENCE=json.loads((ROOT.parent/'elite-force/evidence.json').read_text())
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def sub(a,b):return [x-y for x,y in zip(a,b)]
def verts(ps):
 out=[]
 for a,b,c in itertools.combinations(ps,3):
  bc=cross(b,c);det=dot(a[:3],bc)
  if abs(det)<1e-7:continue
  ca=cross(c,a);ab=cross(a,b);p=[(a[3]*bc[i]+b[3]*ca[i]+c[3]*ab[i])/det for i in range(3)]
  if all(dot(q[:3],p)-q[3]<.04 for q in ps) and not any(dot(sub(p,v),sub(p,v))<.005 for v in out):out.append(p)
 return out
def source_map(m):
 text=Path(m['source']).read_text();br=[];patches=[];depth=0;ei=-1;ps=[];ts=[];points=[]
 for line in text.splitlines():
  s=line.strip()
  if s=='{':
   depth+=1
   if depth==1:ei+=1
   if depth==2:ps=[];ts=[]
  elif s=='}':
   if depth==2 and ps:br.append({'p':ps,'t':ts,'e':ei})
   depth-=1
  elif depth==2 and s.startswith('('):
   q=re.match(r'\( ([^)]*) \) \( ([^)]*) \) \( ([^)]*) \) (\S+)',s)
   if not q:raise ValueError(s)
   a,b,c=[list(map(float,q[i].split())) for i in [1,2,3]];n=cross(sub(b,a),sub(c,a));ln=math.sqrt(dot(n,n))
   if ln<1e-8:continue
   n=[-v/ln for v in n];ps.append(n+[dot(n,a)]);ts.append(q[4])
 # Patch control arrays in Radiant are outer-width, inner-height.
 pat=r'patchDef2\s*\{\s*(\S+)\s*\(\s*(\d+)\s+(\d+)[^)]*\)\s*\((.*?)\)\s*\}'
 for q in re.finditer(pat,text,re.S):
  texture,w,h,body=q[1],int(q[2]),int(q[3]),q[4]
  cps=[list(map(float,r))[:3] for r in re.findall(r'\(\s*([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)\s+[-+.\deE]+\s+[-+.\deE]+\s*\)',body)]
  assert len(cps)==w*h,(m['name'],len(cps),w,h)
  patches.append({'t':texture,'w':w,'h':h,'v':cps})
 assert len(patches)==m['patches'],(m['name'],len(patches),m['patches'])
 return br,patches

def bsp(m):
 b=zipfile.ZipFile(m['source']).read(m['member']);ef2=b[:4]==b'EF2!';base=12 if ef2 else 8
 def lump(i):
  o,n=struct.unpack_from('<ii',b,base+8*i);return b[o:o+n]
 def rec(i,fmt):return list(struct.iter_unpack(fmt,lump(i)))
 shaders=rec(0 if ef2 else 1,'<64s3i' if ef2 else '<64s2i');ps=rec(1 if ef2 else 2,'<4f');sides=rec(12 if ef2 else 9,'<2i');bs=rec(13 if ef2 else 8,'<3i');models=rec(15 if ef2 else 7,'<6f4i')
 faces=rec(5 if ef2 else 13,'<12i12f2if6i' if ef2 else '<12i12f2i');vs=rec(6 if ef2 else 10,'<8f4B3f' if ef2 else '<10f4B');indices=rec(7 if ef2 else 11,'<i')
 names=[r[0].split(b'\0')[0].decode() for r in shaders];brushes=[]
 for i,row in enumerate(bs):
  count,start,shader=row if ef2 else (row[1],row[0],row[2]);contents=shaders[shader][2];model=next((j for j,r in enumerate(models) if r[8]<=i<r[8]+r[9]),0)
  entity=next((j for j,e in enumerate(m['entities']) if e.get('model')==f'*{model}'),0) if model else 0
  planes=[ps[sides[k][1 if ef2 else 0]] for k in range(start,start+count)]
  brushes.append({'p':planes,'t':[names[shader]]*count,'e':entity,'contents':contents,'model':model})
 triangles=[];patches=[]
 for f in faces:
  shader,_,typ,fv,nv,fi,ni=f[:7];name=names[shader]
  if typ in (1,3):
   for j in range(fi,fi+ni,3):triangles.append((name,[list(vs[fv+indices[j+k][0]][:3]) for k in range(3)]))
  elif typ==2:
   w,h=f[24:26];patches.append({'t':name,'w':w,'h':h,'v':[list(vs[fv+y*w+x][:3]) for x in range(w) for y in range(h)]})
 return brushes,patches,triangles

def utility(t):return any(k in t.lower() for k in ['caulk','nodraw','hint','skip','clip','origin','areaportal','trigger','donotenter','sky'])
def kind(t,n=None):
 t=t.lower()
 if any(s in t for s in ['water','slime','lava']):return 'water'
 if any(s in t for s in ['glass','grate']):return 'glass'
 if any(s in t for s in ['light','glow']):return 'light'
 return 'floor' if n and n[2]>.6 else 'shell'

def convert(m):
 if m['format']=='Radiant source':brushes,patches=source_map(m);triangles=[]
 else:brushes,patches,triangles=bsp(m)
 useful=[p['p'] for p in m['points'] if p['k'] in ['spawn','health','armor','weapon','flag'] and (m['name']!='ctf_reservoir' or p['p'][2]>-1500 and abs(p['p'][0])<1500)]
 cx=(min(p[0] for p in useful)+max(p[0] for p in useful))/2;cy=(min(p[1] for p in useful)+max(p[1] for p in useful))/2;bottom=min(p[2] for p in useful)-128
 def point(p):return [round((p[0]-cx)/32,5),round((p[2]-bottom)/32,5),round((cy-p[1])/32,5)]
 def planes(ps):return [[a,c,-b,(d-a*cx-b*cy-c*bottom)/32] for a,b,c,d in ps]
 groups={};collision=[];water=[];triggers=[];facecount=0
 def addtri(t,tri,entity=0):
  if utility(t):return
  if m['name']=='ctf_reservoir' and any(p[2]<-1500 or abs(p[0])>1500 for p in tri):return
  n=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));ln=math.sqrt(dot(n,n))
  if ln<1e-7:return
  n=[v/ln for v in n];k=kind(t,n);cls=m['entities'][entity].get('classname','');k+=f'|{entity}' if cls in ['func_door','func_plat','func_train','func_pendulum'] else '';g=groups.setdefault(k,{'p':[]})
  for p in tri:g['p']+=point(p)
 for bi,b in enumerate(brushes):
  vs=verts(b['p'])
  if not vs:continue
  # BSP submodels may be authored in local space; apply entity origin.
  e=m['entities'][b['e']];origin=list(map(float,e.get('origin','0 0 0').split())) if m['format']!='Radiant source' and b.get('model') else [0,0,0]
  ps=[list(p[:3])+[p[3]+dot(p[:3],origin)] for p in b['p']];vs=[[p[i]+origin[i] for i in range(3)] for p in vs]
  lo=[min(v[i] for v in vs) for i in range(3)];hi=[max(v[i] for v in vs) for i in range(3)]
  if m['name']=='ctf_reservoir' and (hi[2]<-1500 or lo[0]>1500 or hi[0]<-1500):continue
  low=point([lo[0],hi[1],lo[2]]);high=point([hi[0],lo[1],hi[2]])
  box={'id':f'{bi}','x':(low[0]+high[0])/2,'z':(low[2]+high[2])/2,'w':high[0]-low[0],'d':high[2]-low[2],'bottom':low[1],'top':high[1],'planes':planes(ps),'entity':b['e'],'class':e.get('classname',''),'texture':b['t'][0]}
  tex=b['t'][0].lower();cls=e.get('classname','')
  if cls.startswith('trigger_') or 'trigger' in tex:triggers.append(box)
  elif kind(tex)=='water' or b.get('contents',0)&32:water.append(box)
  elif m['format']=='Radiant source' and not any(s in tex for s in ['hint','skip','origin','areaportal','donotenter','sky']) or b.get('contents',0)&(1|65536):collision.append(box)
  if m['format']=='Radiant source':
   for fi,p in enumerate(ps):
    face=[v for v in vs if abs(dot(p[:3],v)-p[3])<.05]
    if len(face)<3:continue
    center=[sum(v[i] for v in face)/len(face) for i in range(3)];ref=[1,0,0] if abs(p[0])<.8 else [0,1,0];u=cross(p[:3],ref);v=cross(p[:3],u)
    face.sort(key=lambda q:math.atan2(dot(sub(q,center),v),dot(sub(q,center),u)))
    for j in range(1,len(face)-1):addtri(b['t'][fi],[face[0],face[j],face[j+1]],b['e'])
 for t,tri in triangles:addtri(t,tri)
 patchTriangles=0
 for patch in patches:
  if utility(patch['t']):continue
  w,h=patch['w'],patch['h'];cps=patch['v']
  for x in range(0,w-2,2):
   for y in range(0,h-2,2):
    def bez(u,v):
     a=[(1-u)**2,2*u*(1-u),u*u];b=[(1-v)**2,2*v*(1-v),v*v]
     return [sum(cps[(x+i)*h+y+j][k]*a[i]*b[j] for i in range(3) for j in range(3)) for k in range(3)]
    steps=4;grid=[[bez(i/steps,j/steps) for j in range(steps+1)] for i in range(steps+1)]
    for i in range(steps):
     for j in range(steps):
      a,b,c,d=grid[i][j],grid[i+1][j],grid[i][j+1],grid[i+1][j+1]
      addtri(patch['t'],[a,b,d]);addtri(patch['t'],[a,d,c]);patchTriangles+=2
 points=[{**p,'position':point(p['p'])} for p in m['points']]
 targets=[]
 for i,e in enumerate(m['entities']):
  if 'target' not in e:continue
  for j,t in enumerate(m['entities']):
   if t.get('targetname')==e['target']:targets.append({'from':i,'to':j,'class':e.get('classname',''),'destination':t.get('classname',''),'name':e['target']})
 out={'name':m['name'],'format':m['format'],'transform':{'cx':cx,'cy':cy,'bottom':bottom,'scale':1/32},'groups':groups,'brushes':collision,'water':water,'triggers':triggers,'points':points,'entities':m['entities'],'targets':targets,'patches':len(patches),'patchTriangles':patchTriangles,'bounds':{'x':max(abs((p[0]-cx)/32) for p in useful)+5,'z':max(abs((p[1]-cy)/32) for p in useful)+5},'maxHeight':max((p[2]-bottom)/32 for p in useful)+8}
 (ROOT/(m['name']+'.json')).write_text(json.dumps(out,separators=(',',':')))
 print(m['name'],'brushes',len(collision),'patches',len(patches),'patch triangles',patchTriangles,'triangles',sum(len(g['p'])//9 for g in groups.values()),'target links',len(targets),flush=True)
 return {k:out[k] for k in ['name','bounds','maxHeight','patches','patchTriangles']}
if __name__=='__main__':
 result=[convert(m) for m in EVIDENCE];(ROOT/'maps.json').write_text(json.dumps(result))
