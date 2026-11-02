import fs from 'node:fs';
import {RESERVOIR as map} from '../../dist/maps/reservoir.js';
import {restoreNavigation,nearestNode,findRoute} from '../../dist/ai.js';
import {createGameHarness} from '../../tests/harness.mjs';
const nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight);
const places={northBase:[-19.75,37,-47.5],southBase:[20,37,47.5],northApproach:[0,14,-43],southApproach:[0,14,43],westGallery:[-31,31,0],eastGallery:[31,31,0],upperNorth:[-3,34,-6],upperSouth:[3,34,6],major:[0,14,0],northWater:[0,2,-18],southWater:[0,2,18],northLiftLow:[0,14,-48.7],northLiftHigh:[0,34,-48.7],eastLiftLow:[5.4,14,-3.5],eastLiftHigh:[5.4,34,-3.5]};
for(const [k,p]of Object.entries(places)){const n=nearestNode(nav,{x:p[0],y:p[1],z:p[2]});console.log(k,p,'nearest', [n.x,n.y,n.z]);}
const h=createGameHarness(124);h.setup();h.run("changeArena('reservoir');makeBots();mode='play';respawnTime=0;playerPos.set(40,40,55);");
const result={places,routes:[],sightlines:[],pickups:map.pickups.map(({id,x,y,z,amount})=>({id,x,y,z,amount})),navigation:{nodes:nav.nodes.length,edges:nav.nodes.reduce((s,n)=>s+n.edges.length,0)}};
for(const [a,pa]of Object.entries(places))for(const [b,pb]of Object.entries(places))if(a!==b){const visible=h.run(`opponentAI.world.canSee(new THREE.Vector3(...${JSON.stringify([pa[0],pa[1]+1.65,pa[2]])}),new THREE.Vector3(...${JSON.stringify([pb[0],pb[1]+1.65,pb[2]])}))`);if(visible)result.sightlines.push([a,b]);}
const pairs=[['northBase','major'],['southBase','major'],['northBase','southBase'],['northApproach','southApproach'],['northApproach','major'],['major','northApproach'],['major','westGallery'],['westGallery','major'],['major','eastGallery'],['eastGallery','major'],['westGallery','eastGallery'],['eastGallery','westGallery'],['upperNorth','major'],['major','upperNorth'],['northWater','major'],['major','northWater'],['northWater','southWater'],['northLiftLow','northLiftHigh'],['northLiftHigh','northLiftLow'],['eastLiftLow','eastLiftHigh'],['eastLiftHigh','eastLiftLow']];
for(const [a,b]of pairs){
 const start=places[a],goal=places[b],from={x:start[0],y:start[1],z:start[2]},to={x:goal[0],y:goal[1],z:goal[2]},path=findRoute(nav,from,to);
 const estimate=path.reduce((s,p,i)=>{const prev=i?path[i-1]:from;return s+Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z)},0),actions=Object.fromEntries(['walk','drop','jump','swim','elevator'].map(k=>[k,path.filter(p=>p.action===k).length]));
 const actual=h.run(`{elevatorSystem.reset();const b=bots[0];bots=[b];b.pos.set(...${JSON.stringify(start)});b.vy=0;const brain=opponentAI.reset(b,0),target=new THREE.Vector3(...${JSON.stringify(goal)});brain.goal={type:'rotate',x:target.x,y:target.y,z:target.z};let reached=false,samples=[],length=0,prev=b.pos.clone(),t=0;for(let i=0;i<10800;i++){opponentAI.clock+=1/60;stepElevators(1/60);opponentAI.navigate(b,brain,1/60);opponentAI.world.physics(b,brain,1/60);t=(i+1)/60;length+=b.pos.distanceTo(prev);prev.copy(b.pos);if(i%15===0)samples.push([+t.toFixed(3),...b.pos.toArray().map(x=>+x.toFixed(4)),brain.liftRide?.lift?.id||null]);if(b.pos.distanceTo(target)<.65&&!brain.liftRide){reached=true;break}}({reached,time:t,length,end:b.pos.toArray(),samples});}`);
 const row={a,b,actions,plannedLength:estimate,...actual};result.routes.push(row);console.log(a,'→',b,'reached',actual.reached,'seconds',actual.time.toFixed(2),'distance',actual.length.toFixed(1),actions,flush());
 fs.writeFileSync(new URL('./reservoir-routes.json',import.meta.url),JSON.stringify(result));
}
function flush(){return ''}
console.log('LOS',JSON.stringify(result.sightlines));
