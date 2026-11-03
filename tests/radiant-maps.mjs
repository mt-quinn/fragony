import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {SHIPMENT} from '../dist/maps/shipment.js';
import {NUKETOWN} from '../dist/maps/nuketown.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
import {nearBlocks,blockSpan} from '../dist/geometry.js';
import {restoreNavigation,findRoute} from '../dist/ai.js';
import {createGameHarness} from './harness.mjs';
for(const map of [SHIPMENT,NUKETOWN]){
 const {fingerprint}=await import('../dist/maps/'+map.id+'-nav.js');
 const digest=createHash('sha256').update(fs.readFileSync(new URL('../dist/maps/'+map.id+'-data.js',import.meta.url))).update(JSON.stringify([map.elevators,map.pads,map.anchors,map.stepHeight,map.bounds,map.maxHeight,!!map.navigationGround])).digest('hex');assert.equal(fingerprint,digest,map.id+' cached navigation matches source and traversal');
 assert.equal(map.spawns.length,map.id==='shipment'?8:30);
 assert.equal(map.pickups.filter(p=>p.amount===50).length,1);assert.equal(map.pickups.filter(p=>p.amount===25).length,4);
 assert.equal(map.pickups.filter(p=>p.amount===5).length,map.id==='shipment'?12:16);
 for(const [i,s]of map.spawns.entries()){
  assert.ok(canOccupy(map.brushes,{x:s[0],z:s[2],feet:s[1]+.002,height:1.9,radius:.4}),map.id+' source spawn '+i+' has standing clearance');
  const landed=moveCharacter(map.brushes,{x:s[0],z:s[2],feet:s[1]+.01,height:1.9,radius:.4},{x:0,y:-.05,z:0},{bounds:map.bounds});assert.ok(landed.grounded,map.id+' source spawn '+i+' has real support');
 }
 for(const p of map.pickups){assert.ok(canOccupy(map.brushes,{x:p.x,z:p.z,feet:p.y+.002,height:1.9,radius:.4}),p.id+' reachable standing pickup');assert.ok(nearBlocks(map.brushes,p.x,p.z,.01).some(b=>{const s=blockSpan(b,p.x,p.z,0);return s&&Math.abs(s.top-p.y)<.05}),p.id+' exact source floor');}
 const nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);
 for(const a of map.spawns)for(const b of map.spawns)assert.ok(findRoute(nav,{x:a[0],y:a[1],z:a[2]},{x:b[0],y:b[1],z:b[2]}).length,map.id+' source-spawn route');
 for(const g of Object.values(map.groups))for(let i=0;i<g.p.length;i+=3){assert.ok(Number.isFinite(g.p[i]+g.p[i+1]+g.p[i+2]));assert.ok(Math.abs(g.p[i])<=map.bounds.x+.001&&Math.abs(g.p[i+2])<=map.bounds.z+.001,map.id+' no exterior scenery beyond crop');}
 console.log(map.name+': source starts/real support, health economy, all '+map.spawns.length**2+' directed routes, crop and cache fingerprint pass.');
}
const h=createGameHarness(941);h.setup();
h.run(`
const saved=localStorage.getItem('dh-run');for(const id of ['shipment','nuketown']){beginPractice(id);assert.equal(MAP.id,id);assert.ok(navNodes.length>1000);assert.equal(practiceMaps().length,MAPS.length);}assert.equal(localStorage.getItem('dh-run'),saved,'practice keeps saved campaign');
for(const [from,to]of [[2,28],[28,4],[9,29],[29,10],[0,6]]){
 changeArena('nuketown');makeBots();mode='play';respawnTime=0;playerPos.set(0,40,0);const bot=bots[0];bots=[bot];const s=MAP.spawns[from],target=MAP.spawns[to];bot.pos.set(...s);bot.vy=0;const brain=opponentAI.reset(bot,0);brain.goal={type:'rotate',x:target[0],y:target[1],z:target[2]};brain.detourIn=Infinity;let reached=false,maxRecovery=0;
 for(let i=0;i<14400;i++){opponentAI.clock+=1/120;opponentAI.navigate(bot,brain,1/120);opponentAI.world.physics(bot,brain,1/120);if(Math.hypot(bot.pos.x-target[0],bot.pos.z-target[2])<1.2&&Math.abs(bot.pos.y-target[1])<.35){reached=true;break;}}
 assert.ok(reached,'native bot physically completes Nuketown route '+from+' → '+to+'; final '+bot.pos.toArray());
}
console.log('Native practice switches between both maps; both upstairs houses and cross-map garden route physically completed.');
`,{timeout:240000});
