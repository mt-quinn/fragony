// Discover tread sequences from visible triangles, independently of navigation
// and collision. Walk the imported geometry without ever issuing a jump.
import fs from 'node:fs';
import {MAPS} from '../dist/map.js';
import {readSourceRender} from '../dist/maps/source-render.js';
import {canOccupy,moveCharacter,bodyContacts} from '../dist/collision.js';
import {blockSpan,nearBlocks} from '../dist/geometry.js';
const report=[],reviews=JSON.parse(fs.readFileSync(new URL('./stair-audit-review.json',import.meta.url)));
const sub=(a,b)=>a.map((v,i)=>v-b[i]),len=v=>Math.hypot(...v),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
for(const map of MAPS.filter(m=>!process.argv[2]||m.id===process.argv[2])){
 if(map.load)await map.load();
 const chunks=map.renderChunks||await readSourceRender(new URL('../dist/maps/'+map.id+'-render.json.gz',import.meta.url));
 const treads=[],seen=new Set();
 for(const chunk of chunks){const p=chunk.attributes.position.array,normals=chunk.attributes.normal?.array,ix=chunk.index?.array;
  for(let i=0;i<(ix?.length||p.length/3);i+=3){const v=[0,1,2].map(k=>{const j=(ix?ix[i+k]:i+k)*3;return[p[j],p[j+1],p[j+2]]});
   if(normals&&[0,1,2].some(k=>normals[(ix?ix[i+k]:i+k)*3+1]<.99))continue;
   if(Math.max(...v.map(p=>p[1]))-Math.min(...v.map(p=>p[1]))>.002)continue;
   const edges=[[0,1],[1,2],[2,0]].map(([a,b])=>({a,b,v:sub(v[b],v[a])})).sort((a,b)=>len(b.v)-len(a.v));
   const [hyp,wide,short]=edges,w=len(wide.v),d=len(short.v);
   if(w<.9||d<.12||d>1.2||w/d<1.6||Math.abs(dot(wide.v,short.v)/(w*d))>.015)continue;
   const x=(v[hyp.a][0]+v[hyp.b][0])/2,z=(v[hyp.a][2]+v[hyp.b][2])/2,y=v[0][1];
   let dx=-wide.v[2]/w,dz=wide.v[0]/w;if(dx<-.001||Math.abs(dx)<.001&&dz<0){dx=-dx;dz=-dz;}
   const key=[x,y,z,dx,dz].map(n=>Math.round(n*50)).join(',');if(seen.has(key))continue;seen.add(key);treads.push({x,y,z,w,d,dx,dz,family:chunk.family});
  }
 }
 const cells=new Map();for(const t of treads){const key=Math.floor(t.x/2)+','+Math.floor(t.z/2);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);}
 const next=(a,sign,previous=null)=>{let best=null,score=Infinity;for(let x=Math.floor((a.x-1.5)/2);x<=Math.floor((a.x+1.5)/2);x++)for(let z=Math.floor((a.z-1.5)/2);z<=Math.floor((a.z+1.5)/2);z++)for(const b of cells.get(x+','+z)||[]){const dx=b.x-a.x,dz=b.z-a.z,run=(dx*a.dx+dz*a.dz)*sign,side=Math.abs(dx*a.dz-dz*a.dx),rise=b.y-a.y;if(run<.12||run>1.3||run>Math.max(a.d,b.d)*1.6+.08||rise/run>1.2||previous&&(Math.abs(run-previous.run)>.1||Math.abs(rise-previous.rise)>.08)||rise<.06||rise>.61||side>.12||a.dx*b.dx+a.dz*b.dz<.98||Math.abs(a.w-b.w)>.2)continue;const s=run+side*3;if(s<score){score=s;best=b;}}return best;};
 const flights=[],used=new Set();for(const seed of [...treads].sort((a,b)=>a.y-b.y))for(const sign of[-1,1]){
  if(used.has(seed))continue;let chain=[seed],current=seed;for(let n=0;n<80;n++){const previous=chain.length>1?{run:Math.hypot(current.x-chain.at(-2).x,current.z-chain.at(-2).z),rise:current.y-chain.at(-2).y}:null;const b=next(current,sign,previous);if(!b)break;chain.push(b);current=b;}if(chain.length<3)continue;chain.forEach(t=>used.add(t));flights.push({treads:chain,dx:seed.dx*sign,dz:seed.dz*sign});
 }
 const results=[];
 function fitted(t){for(let feet=t.y-.025;feet<=t.y+1.251;feet+=.025){const p={x:t.x,z:t.z,feet,radius:.4,height:1.9};if(!canOccupy(map.brushes,p))continue;const hit=moveCharacter(map.brushes,p,{x:0,y:-.04,z:0},{bounds:map.bounds,stepHeight:map.stepHeight});if(hit.grounded)return hit;}return null;}
 function walk(a,b,fps){let p=fitted(a),goal=fitted(b);if(!p||!goal)return{ok:false,reason:'visible tread has no standing clearance',startClear:!!p,endClear:!!goal};const start=[p.x,p.feet,p.z];let grounded=true,vy=0;const distance=Math.hypot(b.x-a.x,b.z-a.z);for(let n=0;n<fps*(distance/3+3);n++){const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz);if(d<.06&&Math.abs(p.feet-goal.feet)<.12)return{ok:true,start,end:[goal.x,goal.feet,goal.z]};vy-=23/fps;p=moveCharacter(map.brushes,p,{x:dx/Math.max(d,.001)*Math.min(d,3/fps),z:dz/Math.max(d,.001)*Math.min(d,3/fps),y:vy/fps},{grounded,bounds:map.bounds,stepHeight:map.stepHeight});grounded=p.grounded;if(grounded||p.ceiling)vy=0;}
 const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz),hits=bodyContacts(map.brushes,{...p,x:p.x+dx/Math.max(d,.001)*.03,z:p.z+dz/Math.max(d,.001)*.03});return{ok:false,position:[p.x,p.feet,p.z],goal:[goal.x,goal.feet,goal.z],obstructions:hits.map(h=>({id:h.block.id,top:h.top,bottom:h.bottom}))};}
 for(const flight of flights){const first=flight.treads[0],last=flight.treads.at(-1),runs=[];
  const shiftBy=(t,offset)=>({...t,x:t.x+flight.dz*offset,z:t.z-flight.dx*offset});
  const lanes=[0];for(let lane=.2;lane<Math.min(first.w,last.w)/2-.41;lane+=.2)lanes.push(lane,-lane);
  let end=last,endInset=0;
  if(!lanes.some(lane=>fitted(shiftBy(last,lane))))for(const inset of[.1,.2,.3]){const candidate={...last,x:last.x-flight.dx*inset,z:last.z-flight.dz*inset};if(lanes.some(lane=>fitted(shiftBy(candidate,lane)))){end=candidate;endInset=inset;break;}}
  const clearLane=lane=>fitted(shiftBy(first,lane))&&fitted(shiftBy(end,lane));
  const lane=lanes.find(lane=>[-.2,0,.2].every(offset=>clearLane(lane+offset)))??lanes.find(clearLane);
  for(const offset of[-.2,0,.2]){const shift=t=>shiftBy(t,(lane??0)+offset);
   for(const fps of[30,60,144]){const a=shift(first),b=shift(end),clear=!!fitted(a)&&!!fitted(b);runs.push({offset,fps,excluded:lane!==undefined&&!clear,up:walk(a,b,fps),down:walk(b,a,fps)});}
  }
  const review=reviews.find(r=>r.map===map.id&&r.family===first.family&&flight.treads.every(t=>t.x>=r.bounds[0]&&t.x<=r.bounds[1]&&t.y>=r.bounds[2]&&t.y<=r.bounds[3]&&t.z>=r.bounds[4]&&t.z<=r.bounds[5]));
  const approach=[.7,.5,.3,.1,0].map(distance=>({...first,x:first.x-flight.dx*distance,z:first.z-flight.dz*distance,y:first.y-(distance?.6:0)})).find(t=>fitted(shiftBy(t,lane??0)))||first;
  const approachRuns=review?[]:[30,60,144].map(fps=>({fps,up:walk(shiftBy(approach,lane??0),shiftBy(end,lane??0),fps),down:walk(shiftBy(end,lane??0),shiftBy(approach,lane??0),fps)}));
  results.push({first,last,review:review?.reason||null,approach,approachRuns,count:flight.treads.length,lane:lane??null,endInset,direction:[flight.dx,flight.dz],runs});
 }
 const summary={map:map.id,reviewedNonStairs:results.filter(f=>f.review).length,visibleTreads:treads.length,flights:flights.length,runs:results.reduce((s,f)=>s+f.runs.length*2,0),failed:results.filter(f=>!f.review).reduce((s,f)=>s+f.runs.filter(r=>!r.excluded&&!r.up.ok).length+f.runs.filter(r=>!r.excluded&&!r.down.ok).length,0)};
 summary.approachFailures=results.filter(f=>!f.review).reduce((s,f)=>s+f.approachRuns.filter(r=>!r.up.ok||!r.down.ok).length,0);console.log(JSON.stringify(summary));report.push({summary,flights:results});map.unload?.();
}
fs.writeFileSync(new URL('../docs/qa/visible-stairs'+(process.argv[2]?'-'+process.argv[2]:'')+'.json',import.meta.url),JSON.stringify(report,null,2));

if(report.some(m=>m.summary.failed||m.summary.approachFailures))process.exitCode=1;
