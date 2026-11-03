// Search actual supported launch/landing pairs across missing source routes.
// Both broad collision samples and the native 120 Hz controller must pass.
import fs from 'node:fs';import {gunzipSync}from'node:zlib';
import {readSourceData}from'../dist/maps/source-data.js';
import {canOccupy,moveCharacter}from'../dist/collision.js';
import {nearBlocks,blockSpan,launchTime}from'../dist/geometry.js';
const root=new URL('../',import.meta.url),ref=new URL('../../reference-maps/eliteforce-next-map-round/',import.meta.url),specPath=new URL('dist/maps/source-arena-specs.js',root),specs=JSON.parse(fs.readFileSync(specPath,'utf8').split('export default ')[1].trim().replace(/;$/,''));
for(const id of process.argv.slice(2)){
 const spec=specs.find(s=>s.id===id),data=await readSourceData(new URL('dist/maps/'+id+'-data.json.gz',root)),raw=JSON.parse(gunzipSync(fs.readFileSync(new URL(id+'/navigation-audit.json.gz',ref)))),nodes=raw.map((n,i)=>({id:i,x:n[0],y:n[1],z:n[2],edges:n[3].map(e=>e[0]),back:[]}));
 for(const n of nodes)for(const to of n.edges)nodes[to].back.push(n.id);
 const nearest=p=>{let best,score=Infinity;for(const n of nodes){const d=(p.x-n.x)**2+(p.z-n.z)**2+9*(p.y-n.y)**2;if(d<score){best=n;score=d;}}return best};
 const reach=(start,reverse=false)=>{const seen=new Set([start.id]),q=[start.id];for(let i=0;i<q.length;i++)for(const j of nodes[q[i]][reverse?'back':'edges'])if(!seen.has(j)){seen.add(j);q.push(j)}return seen};
 const key=p=>[p.x,p.y,p.z].join(','),cached=new Map();
 function supported(p,r=.68){const k=key(p)+','+r;if(cached.has(k))return cached.get(k);let okay=canOccupy(data.brushes,{x:p.x,z:p.z,feet:p.y+.004,radius:.4,height:1.9});
  if(okay)for(let i=0;i<8;i++){const x=p.x+Math.cos(i*Math.PI/4)*r,z=p.z+Math.sin(i*Math.PI/4)*r;if(!nearBlocks(data.brushes,x,z,.01,p.y-.18,p.y+.15).some(b=>{const s=blockSpan(b,x,z,0);return s&&Math.abs(s.top-p.y)<.16})){okay=false;break}}
  cached.set(k,okay);return okay;
 }
 function flight(from,to,power,full=false){const rise=to.y-from.y;if(power*power/46<rise+.08)return false;const time=launchTime(power,rise),speed=Math.hypot(to.x-from.x,to.z-from.z)/time;if(time<=0||speed>19)return false;
  if(!full){for(let i=1;i<48;i++){const t=time*i/48;if(!canOccupy(data.brushes,{x:from.x+(to.x-from.x)*t/time,z:from.z+(to.z-from.z)*t/time,feet:from.y+.005+power*t-11.5*t*t,radius:.43,height:1.94}))return false;}return true;}
  for(let o=0;o<9;o++){const r=o?.27:0,a=o*Math.PI/4,x=from.x+Math.cos(a)*r,z=from.z+Math.sin(a)*r;let p={x,z,feet:from.y+.004,radius:.4,height:1.9},vy=power,landed=false;
   for(let f=0;f<900;f++){vy-=23/120;p=moveCharacter(data.brushes,p,{x:(to.x-x)/time/120,z:(to.z-z)/time/120,y:vy/120},{grounded:false,bounds:spec.bounds,stepHeight:spec.stepHeight??.45});if(p.ceiling||p.recovery>.06)return false;if(p.grounded&&f>5){if(Math.abs(p.feet-to.y)>.2||Math.hypot(p.x-to.x,p.z-to.z)>.8)return false;landed=true;break;}}if(!landed)return false;
  }return true;
 }
 function find(fromSet,toSet,target){
  const allLandings=nodes.filter(n=>toSet.has(n.id)).sort((a,b)=>(a.x-target.x)**2+(a.z-target.z)**2+4*(a.y-target.y)**2-((b.x-target.x)**2+(b.z-target.z)**2+4*(b.y-target.y)**2)),landings=[...allLandings.slice(0,100),...allLandings.filter((n,i)=>i%Math.max(1,Math.floor(allLandings.length/450))===0)],sources=nodes.filter(n=>fromSet.has(n.id)),pairs=[];
  for(const to of landings){if(!supported(to,.48))continue;
   for(const from of sources){const dx=from.x-to.x,dz=from.z-to.z,d=dx*dx+dz*dz,rise=to.y-from.y;if(d>42**2||d<1||rise>26||rise< -20)continue;const cost=d+rise*rise*.45+((to.x-target.x)**2+(to.z-target.z)**2)*.03;pairs.push({from,to,cost});}
  }pairs.sort((a,b)=>a.cost-b.cost);
  let tested=0;for(const {from,to}of pairs.slice(0,9000)){if(!supported(from))continue;tested++;
   const min=Math.sqrt(46*Math.max(0,to.y-from.y+.12));for(const power of [...new Set([2,3,4,5,6,Math.max(7,min+.15),Math.max(8,min+.8),Math.max(9,min+1.5),Math.max(10,min+3),12,14,16,18,20,22,24,27,30,34])].sort((a,b)=>a-b)){
    if(!flight(from,to,power)||!flight(from,to,power,true))continue;
    return {from,to,power};
   }
  }console.log(id,'no flight; tested',tested,'source pairs');return null;
 }
 function findLift(fromSet,toSet,target){
  const allEnds=nodes.filter(n=>toSet.has(n.id)).sort((a,b)=>(a.x-target.x)**2+(a.z-target.z)**2+4*(a.y-target.y)**2-((b.x-target.x)**2+(b.z-target.z)**2+4*(b.y-target.y)**2)),ends=[...allEnds.slice(0,100),...allEnds.filter((n,i)=>i%Math.max(1,Math.floor(allEnds.length/450))===0)],others=nodes.filter(n=>fromSet.has(n.id)),candidates=[];
  for(const end of ends)for(const other of others){const d=Math.hypot(end.x-other.x,end.z-other.z),rise=Math.abs(end.y-other.y);if(d>4||rise<1.5||rise>22)continue;candidates.push({high:end.y>other.y?end:other,low:end.y>other.y?other:end,cost:d*2+rise*.2+Math.hypot(end.x-target.x,end.z-target.z)*.1});}
  candidates.sort((a,b)=>a.cost-b.cost);const seen=new Set();
  for(const pair of candidates.slice(0,2000))for(const r of [.8,1,1.2,1.4,1.6])for(let angle=0;angle<8;angle++){
   const high=pair.high,low=pair.low,x=+(high.x+Math.cos(angle*Math.PI/4)*r).toFixed(3),z=+(high.z+Math.sin(angle*Math.PI/4)*r).toFixed(3),k=[x,z,low.y,high.y].join(',');if(seen.has(k)||Math.hypot(x-low.x,z-low.z)>3)continue;seen.add(k);
   let clear=true;for(let y=low.y+.004;y<=high.y+.004;y+=.15){for(const [dx,dz]of[[0,0],[.22,0],[-.22,0],[0,.22],[0,-.22]])if(!canOccupy(data.brushes,{x:x+dx,z:z+dz,feet:y,height:1.9,radius:.4})){clear=false;break;}if(!clear)break;}if(!clear)continue;
   const w=1.45,d=1.45,pit={id:'probe-pit',x,z,w,d,bottom:low.y-.6,top:low.y};
   function board(entry,floor,reverse=false){const blocks=data.brushes.slice();blocks.triangleCollision=data.brushes.triangleCollision;blocks.push(pit,{id:'probe-deck',x,z,w,d,bottom:floor-.28,top:floor});const start=reverse?{x,z,y:floor}:entry,end=reverse?entry:{x,z,y:floor};let body={x:start.x,z:start.z,feet:start.y+.004,height:1.9,radius:.4};if(!canOccupy(blocks,body))return false;
    for(let f=0;f<360;f++){const dx=end.x-body.x,dz=end.z-body.z,len=Math.hypot(dx,dz);if(len<.1)return Math.abs(body.feet-floor)<.12;body=moveCharacter(blocks,body,{x:dx/len*3/120,z:dz/len*3/120,y:-.01},{grounded:true,bounds:spec.bounds,stepHeight:spec.stepHeight??.57});if(Math.abs(body.feet-floor)>.12||body.recovery>.05)return false;}return false;
   }
   if(!board(low,low.y)||!board(low,low.y,true)||!board(high,high.y)||!board(high,high.y,true))continue;
   return {def:{id:id+'-access-lift-'+(spec.elevators?.length||0),x,z,w,d,low:low.y,high:high.y,boardingRadius:.25,entryLow:{x:low.x,z:low.z},entryHigh:{x:high.x,z:high.z},entry:{x:low.x,z:low.z},pit:{w,d}},low,high};
  }return null;
 }
 const pads=spec.pads||[];for(const p of pads){const from=nearest(p),to=nearest(p.landing);if(!from.edges.includes(to.id)){from.edges.push(to.id);to.back.push(from.id);}}
 for(const l of spec.elevators||[]){const a=nearest({...l.entryLow||l.entry,y:l.low}),b=nearest({...l.entryHigh||l.entry,y:l.high});if(!a.edges.includes(b.id)){a.edges.push(b.id);b.back.push(a.id);}if(!b.edges.includes(a.id)){b.edges.push(a.id);a.back.push(b.id);}}
 const anchors=[...spec.starts.map(s=>({x:s.position[0],y:s.position[1],z:s.position[2],label:'spawn-'+s.entity})),...spec.resources.map(p=>({...p,label:p.id}))],home=nearest(anchors[0]),unresolved=[];
 for(let iteration=0;iteration<30;iteration++){
  const forward=reach(home),back=reach(home,true);let missing=anchors.find(a=>!forward.has(nearest(a).id)),reverse=false;
  if(!missing){missing=anchors.find(a=>!back.has(nearest(a).id));reverse=true;}if(!missing)break;
  const target=nearest(missing),f=reach(target),b=reach(target,true),component=new Set([...f].filter(i=>b.has(i)));console.log(id,reverse?'return':'access',missing.label,'component',component.size,'home reachable',forward.size);
  const result=reverse?find(component,back,target):find(forward,component,target);
  if(!result){const lift=reverse?findLift(component,back,target):findLift(forward,component,target);if(lift){spec.elevators??=[];spec.elevators.push({...lift.def,sourceRoute:missing.label});lift.low.edges.push(lift.high.id);lift.high.back.push(lift.low.id);lift.high.edges.push(lift.low.id);lift.low.back.push(lift.high.id);console.log('VALIDATED LIFT',JSON.stringify(spec.elevators.at(-1)));continue;}unresolved.push({anchor:missing,reverse,component:component.size});break;}
  const {from,to,power}=result,pad={id:id+'-access-'+pads.length,x:from.x,y:from.y,z:from.z,power,landing:{x:to.x,y:to.y,z:to.z},triggerRadius:.28,size:1.35,sourceRoute:missing.label};pads.push(pad);from.edges.push(to.id);to.back.push(from.id);console.log('VALIDATED PAD',JSON.stringify(pad));
 }
 spec.pads=pads;spec.precompiled=false;
 const customPath=new URL(id+'/gameplay.json',ref),custom=fs.existsSync(customPath)?JSON.parse(fs.readFileSync(customPath)):{};fs.writeFileSync(customPath,JSON.stringify({...custom,pads,elevators:spec.elevators||[]},null,2));
 fs.writeFileSync(new URL(id+'/connection-audit.json',ref),JSON.stringify({pads,elevators:spec.elevators||[],unresolved},null,2));
 const latest=JSON.parse(fs.readFileSync(specPath,'utf8').split('export default ')[1].trim().replace(/;$/,''));
 fs.writeFileSync(specPath,'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(latest.map(s=>s.id===id?spec:s))+';\n');
 console.log(id,'TOTAL',pads.length,'pads; unresolved',unresolved.length);
}
