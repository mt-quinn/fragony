import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {SOURCE_ARENAS} from '../dist/maps/source-arenas.js';
import {nearBlocks,blockSpan,launchTime} from '../dist/geometry.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
const [id,tx,ty,tz,sourceIndex]=process.argv.slice(2),m=await SOURCE_ARENAS.find(m=>m.id===id).load(),target={x:+tx,y:+ty,z:+tz};
let reachable=null,nearest=null;if(sourceIndex!==undefined){const graph=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../reference-maps/'+id+'/navigation-audit.json.gz',import.meta.url))));nearest=p=>{let best=0,score=Infinity;graph.forEach((n,i)=>{const q=(n[0]-p[0])**2+9*(n[1]-p[1])**2+(n[2]-p[2])**2;if(q<score){score=q;best=i}});return best};const start=nearest(m.spawns[+sourceIndex]),q=[start];reachable=new Set(q);for(let j=0;j<q.length;j++)for(const e of graph[q[j]][3])if(!reachable.has(e[0])){reachable.add(e[0]);q.push(e[0])}}
function floor(x,z,y,r=0){let f=-Infinity;for(const b of nearBlocks(m.brushes,x,z,Math.max(.01,r),-100,y+.3)){const s=blockSpan(b,x,z,r);if(s&&s.top<=y+.3)f=Math.max(f,s.top);}return f;}
function supported(x,z,y,r=.75){return Array.from({length:8},(_,i)=>floor(x+Math.cos(i*Math.PI/4)*r,z+Math.sin(i*Math.PI/4)*r,y)).every(f=>Math.abs(f-y)<.2)&&canOccupy(m.brushes,{x,z,feet:y+.01,height:1.9,radius:.4});}
if(!supported(target.x,target.z,target.y,.45)){const nearby=[];for(let dx=-4;dx<=4;dx+=.5)for(let dz=-4;dz<=4;dz+=.5){const x=target.x+dx,z=target.z+dz,y=floor(x,z,target.y);if(Math.abs(y-target.y)<.25&&supported(x,z,y,.65))nearby.push({x,y,z});}if(!nearby.length)throw Error('Unsafe target');nearby.sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z));Object.assign(target,nearby[0]);}
const options=[];
for(let d=1;d<=24;d+=1)for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=+(target.x+Math.cos(a)*d).toFixed(2),z=+(target.z+Math.sin(a)*d).toFixed(2),y=floor(x,z,target.y-1,.4);if(reachable&&!reachable.has(nearest([x,y,z])))continue;if(!Number.isFinite(y)||target.y-y<1.5||!supported(x,z,y))continue;
 for(const power of [10,11,12,13,14,15,15.25,15.5,15.75,15.9,16,16.5,18,20,22,24]){if(power**2/46<target.y-y+.12)continue;const t=launchTime(power,target.y-y);let good=true;
 for(const [dx,dz]of [[0,0],[.35,0],[-.35,0],[0,.35],[0,-.35]]){if(!supported(x+dx,z+dz,y,.4)){good=false;break;}for(let i=1;i<=120;i++){const q=t*i/120;if(!canOccupy(m.brushes,{x:x+dx+(target.x-x-dx)*q/t,z:z+dz+(target.z-z-dz)*q/t,feet:y+.01+power*q-11.5*q*q,height:1.9,radius:.4})){good=false;break;}}if(!good)break;}
 if(good){options.push({x,y:+y.toFixed(3),z,power,landing:target,triggerRadius:.35});break;}}
 if(options.length>=8)break;
}
console.log(JSON.stringify(options,null,2));
