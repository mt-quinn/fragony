"""Decode supplied AAS v5 graphs; retain native directed travel semantics.
References: ioquake3 botlib/aasfile.h and be_aas_file.c. Independent implementation.
"""
from pathlib import Path
import struct,json,zipfile,collections,heapq,math
ROOT=Path(__file__).parent
NAMES={2:'walk',3:'crouch',4:'barrier-jump',5:'jump',6:'ladder',7:'drop',8:'swim',9:'water-exit',10:'teleport',11:'elevator',12:'rocket-jump',13:'bfg-jump',14:'grapple',15:'double-jump',16:'ramp-jump',17:'strafe-jump',18:'jump-pad',19:'bob'}
def read(path,member):
 b=bytearray(zipfile.ZipFile(path).read(member));assert b[:8]==b'EAAS\x05\0\0\0'
 for i in range(116):b[8+i]^=(i*119)&255
 def lump(i):
  o,n=struct.unpack_from('<ii',b,12+8*i);assert 124<=o<=len(b) and o+n<=len(b),(i,o,n);return b[o:o+n]
 def records(i,f):return list(struct.iter_unpack(f,lump(i)))
 ar=records(7,'<3i9f');settings=records(8,'<7i');reach=records(9,'<3i6fiH2x');planes=records(2,'<4fi');nodes=records(10,'<3i');boxes=records(0,'<2i6f')
 assert len(ar)==len(settings)
 areas=[]
 for i,a in enumerate(ar):
  st=settings[i];es=[]
  for r in reach[st[6]:st[6]+st[5]]:
   assert 0<=r[0]<len(ar)
   es.append({'to':r[0],'start':r[3:6],'end':r[6:9],'travel':r[9]&0xffffff,'flags':r[9]>>24,'time':r[10]})
  areas.append({'id':a[0],'min':a[3:6],'max':a[6:9],'center':a[9:12],'contents':st[0],'flags':st[1],'presence':st[2],'cluster':st[3],'edges':es})
 def area(point):
  node=1
  while node>0:
   p=planes[nodes[node][0]];side=0 if sum(x*y for x,y in zip(p[:3],point))-p[3]>0 else 1;node=nodes[node][1+side]
  return -node
 return {'areas':areas,'planes':planes,'nodes':nodes,'boxes':boxes,'travelCounts':dict(collections.Counter(NAMES.get(e['travel'],str(e['travel'])) for a in areas for e in a['edges']))},area

def dijkstra(graph,start,end,allowed=None):
 ars=graph['areas'];cost={start:0};parent={};heap=[(0,start)]
 while heap:
  d,n=heapq.heappop(heap)
  if d!=cost[n]:continue
  if n==end:break
  for e in ars[n]['edges']:
   if allowed is not None and e['travel'] not in allowed:continue
   # AAS traveltime is only the reachability transition. Add in-area movement
   # between reference centers and reach endpoints at a declared proxy speed.
   c=e['time']/100+(math.dist(ars[n]['center'],e['start'])+math.dist(e['end'],ars[e['to']]['center']))/320
   nd=d+c
   if nd<cost.get(e['to'],float('inf')):cost[e['to']]=nd;parent[e['to']]=(n,e);heapq.heappush(heap,(nd,e['to']))
 if end not in cost:return None
 out=[];n=end
 while n!=start:
  prev,e=parent[n];out.append({'from':prev,**e});n=prev
 return {'costProxySeconds':cost[end],'edges':list(reversed(out))}

for name,path in [('rev_voy2','/Users/quinn/Downloads/rev_voy2/rev_voy2.pk3'),('ctf_reservoir','/Users/quinn/Downloads/ctfreservoir/ctf_reservoir.pk3')]:
 graph,locate=read(path,f'maps/{name}.aas');model=json.loads((ROOT/(name+'.json')).read_text());points=[]
 for p in model['points']:
  if p['k'] not in ['spawn','teamspawn','flag','health','armor','weapon']:continue
  origin=p['p'];a=locate(origin)
  if not a:
   for dy in [8,16,24,-8,-16,-24]:
    a=locate([origin[0],origin[1],origin[2]+dy])
    if a:break
  points.append({'index':p['i'],'class':p['c'],'origin':origin,'area':a})
 graph['points']=points;routes=[];flags=[p for p in points if 'flag' in p['class'] and 'base' not in p['class']]
 starts=[p for p in points if p['class']=='info_player_deathmatch' or p['class'].endswith('player')]
 for s in starts:
  if not s['area']:continue
  for f in flags:
   if not f['area']:continue
   for title,allowed in [('ordinary',set([2,3,4,5,6,7,8,9,10,11,18,19])),('no-teleport',set([2,3,4,5,6,7,8,9,11,18,19]))]:
    r=dijkstra(graph,s['area'],f['area'],allowed)
    if r:routes.append({'from':s['index'],'to':f['index'],'variant':title,**r})
 graph['routes']=routes;(ROOT/(name+'-aas.json')).write_text(json.dumps(graph,separators=(',',':')))
 print(name,'areas',len(graph['areas']),'edges',sum(len(a['edges']) for a in graph['areas']),'travel',graph['travelCounts'],'located',sum(bool(p['area']) for p in points),'/',len(points),'routes',len(routes))
 print('special links',[(a['id'],e['to'],NAMES.get(e['travel']),e['start'],e['end'],e['time']) for a in graph['areas'] for e in a['edges'] if e['travel'] in [6,10,11,18]][:45])
