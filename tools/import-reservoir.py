"""Bake user-supplied EF2 Reservoir BSP into original-space geometry and collision.
Usage: python3 tools/import-reservoir.py /path/to/ctf_reservoir.pk3
Format reference (read, not copied): Spearmint code/qcommon/bsp_ef2.c.
No game textures, lightmaps, scripts, models or specialty spawn rooms are imported.
"""
import sys,struct,zipfile,re,json,itertools,math,pathlib,collections
b=zipfile.ZipFile(sys.argv[1]).read('maps/ctf_reservoir.bsp')
assert b[:8]==b'EF2!\x14\0\0\0'
def lump(i):
 o,n=struct.unpack_from('<2i',b,12+8*i);return b[o:o+n]
def records(i,fmt):return list(struct.iter_unpack(fmt,lump(i)))
shaders=records(0,'<64s3i');planes=records(1,'<4f');sides=records(12,'<2i');brushes=records(13,'<3i');models=records(15,'<6f4i');faces=records(5,'<12i12f2if6i');verts=records(6,'<8f4B3f');indices=records(7,'<i')
entities=[dict(re.findall(r'"(.*?)"\s+"(.*?)"',x)) for x in re.findall(r'\{(.*?)\}',lump(16).decode(errors='replace'),re.S)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def point(p):return [round(p[0]/32,5),round((p[2]+1280)/32,5),round((768-p[1])/32,5)]
def normal(p):return[p[0],p[2],-p[1]]
def main(p):return abs(p[0])<1500 and -1100<p[1]<2750 and -2000<p[2]<600
# Convex brush vertices are the feasible intersections of triples of bounding planes.
def brush_vertices(ps):
 out=[]
 for a,c,d in itertools.combinations(ps,3):
  bc=cross(c,d);det=dot(a[:3],bc)
  if abs(det)<1e-6:continue
  ca=cross(d,a);ab=cross(a,c);p=[(a[3]*bc[i]+c[3]*ca[i]+d[3]*ab[i])/det for i in range(3)]
  if all(dot(q[:3],p)-q[3]<.04 for q in ps) and not any(sum((p[i]-v[i])**2 for i in range(3))<.01 for v in out):out.append(p)
 return out
collision=[];water=[];ladder_candidates=[]
for index,(count,start,shader) in enumerate(brushes[:models[0][9]]):
 content=shaders[shader][2];name=shaders[shader][0].split(b'\0')[0].decode()
 if not(content&1 or content&65536 or content&32) or 'skyportal' in name:continue
 ps=[planes[sides[i][1]] for i in range(start,start+count)];vs=brush_vertices(ps)
 if not vs or not all(main(p) for p in vs):continue
 lo=[min(v[i] for v in vs) for i in range(3)];hi=[max(v[i] for v in vs) for i in range(3)]
 # The ladder's tiny rungs are world brushes. Remove these; elevators replace climbing.
 if hi[2]-lo[2]<=8.1 and hi[2]<-96 and ((80<abs((lo[0]+hi[0])/2)<105 and (lo[1]>2350 or hi[1]<-830)) or (220<abs((lo[0]+hi[0])/2)<250 and 550<lo[1]<1000)):
  ladder_candidates.append(index);continue
 low=point([lo[0],hi[1],lo[2]]);high=point([hi[0],lo[1],hi[2]])
 # Most source brushes are axis aligned; retain the fast existing box path for them.
 block={'id':'reservoir-'+str(index),'x':round((low[0]+high[0])/2,5),'z':round((low[2]+high[2])/2,5),'w':round(high[0]-low[0],5),'d':round(high[2]-low[2],5),'bottom':low[1],'top':high[1]}
 if any(max(abs(v) for v in p[:3])<.99999 for p in ps):
  block['planes']=[[round(v,7) for v in (*normal(p), (p[3]+1280*p[2]-768*p[1])/32)] for p in ps]
 (water if content&32 else collision).append(block)
# Original indexed planar faces and quadratic Bezier patches, grouped by source material.
groups={};source_bounds=[]
def addtri(shader,tri):
 if not all(main(v[:3]) for v in tri):return
 name=shaders[shader][0].split(b'\0')[0].decode()
 if any(s in name for s in ['caulk','clip','nodraw','skyportal']):return
 # Same small rung removal from the visible skin.
 mid=[sum(v[i] for v in tri)/3 for i in range(3)]
 if max(v[2] for v in tri)-min(v[2] for v in tri)<=8.1 and mid[2]<-96 and ((80<abs(mid[0])<105 and (mid[1]>2350 or mid[1]<-830)) or (220<abs(mid[0])<250 and 550<mid[1]<1000)):return
 kind='water' if 'sfwater' in name else 'glass' if 'glass' in name else 'light' if any(s in name for s in ['light','blip']) else 'ink' if any(s in name for s in ['black','ledge','trim','metal']) else 'floor' if any(s in name for s in ['carpet','floor','base2']) else 'shell'
 group=groups.setdefault(kind,{'p':[],'n':[],'c':[]})
 for v in tri:
  p=point(v[:3]);n=normal(v[5:8]);group['p']+=p;group['n']+=[round(q,5) for q in n]
  # Broad area accents, directional face value and gentle height graduation retain depth.
  side=mid[1]>768;floor=n[1]>.55
  color=([.22,.33,.34] if side else [.30,.36,.31]) if kind=='floor' else [.73,.78,.72]
  if kind=='shell':
   shade=.85+.15*max(0,n[1])+.06*n[0];color=[q*shade for q in ([.38,.48,.45] if floor else color)]
  group['c']+=[round(q,3) for q in color]
for f in faces[:models[0][7]]:
 shader,_,typ,fv,nv,fi,ni=f[:7]
 if typ in (1,3):
  for j in range(fi,fi+ni,3):addtri(shader,[verts[fv+indices[j+k][0]] for k in range(3)])
 elif typ==2:
  w,h=f[24:26]
  for y in range(0,h-2,2):
   for x in range(0,w-2,2):
    patch=[[verts[fv+(y+j)*w+x+i] for i in range(3)] for j in range(3)]
    def bez(u,v):
     a=[(1-u)**2,2*u*(1-u),u*u];c=[(1-v)**2,2*v*(1-v),v*v]
     return [sum(patch[j][i][k]*a[i]*c[j] for j in range(3) for i in range(3)) for k in range(8)]
    steps=4
    grid=[[bez(i/steps,j/steps) for i in range(steps+1)] for j in range(steps+1)]
    for j in range(steps):
     for i in range(steps):
      a,c,d,e=grid[j][i],grid[j][i+1],grid[j+1][i],grid[j+1][i+1];addtri(shader,[a,c,e]);addtri(shader,[a,e,d])
# Keep source entity coordinates alongside adapted items so the conversion is auditable.
items=[];spawns=[];ladders=[]
for e in entities:
 cls=e.get('classname','');p=[float(v) for v in e.get('origin','0 0 0').split()]
 if not main(p):continue
 if cls=='info_player_deathmatch':spawns.append({'position':point(p),'source':p,'angle':float(e.get('angle',0))})
 if 'item_health' in cls or 'item_armor' in cls:items.append({'position':point(p),'source':p,'type':cls})
 if cls=='trigger_ladder':
  m=models[int(e['model'][1:])];lo=[m[i]+p[i] for i in range(3)];hi=[m[i+3]+p[i] for i in range(3)];ladders.append({'origin':point(p),'min':point([lo[0],hi[1],lo[2]]),'max':point([hi[0],lo[1],hi[2]])})
out={'source':'ctf_reservoir — [SFI]Valix, EF2 remake supplied by player','scale':1/32,'brushes':collision,'water':water,'groups':groups,'items':items,'spawns':spawns,'ladders':ladders,'removedLadderBrushes':ladder_candidates}
path=pathlib.Path('dist/maps/reservoir-data.js');path.write_text('// Generated by tools/import-reservoir.py from the supplied EF2! v20 BSP.\nexport default '+json.dumps(out,separators=(',',':'))+';\n')
print('Wrote',path,path.stat().st_size,'bytes;',len(collision),'collision brushes;',sum(len(g['p'])//9 for g in groups.values()),'triangles;',len(items),'items;',len(spawns),'spawns')
print('LADDERS',json.dumps(ladders));print('FLOOR TOPS',collections.Counter(round(q['top'],3) for q in collision).most_common(20));print('removed',len(ladder_candidates),'ladder rungs')
