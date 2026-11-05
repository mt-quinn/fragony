import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {RUST,RUST_SOURCE} from '../dist/maps/rust.js';
import {fingerprint as rustFingerprint} from '../dist/maps/rust-nav.js';
import {blockSpan,nearBlocks,launchTime} from '../dist/geometry.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
import {restoreNavigation,findRoute} from '../dist/ai.js';
import {createGameHarness} from './harness.mjs';
const offsets=[[0,0],[.75,0],[-.75,0],[0,.75],[0,-.75],[.53,.53],[.53,-.53],[-.53,.53],[-.53,-.53]];
function floor(map,x,z,ceiling,radius=0){let y=0;for(const b of nearBlocks(map.brushes,x,z,radius||.01)){const span=blockSpan(b,x,z,radius);if(span&&span.top<=ceiling)y=Math.max(y,span.top);}return y;}
function fullSupport(map,x,y,z,radius=.7){for(let i=0;i<17;i++){const xx=x+(i?Math.cos(i/16*Math.PI*2)*radius:0),zz=z+(i?Math.sin(i/16*Math.PI*2)*radius:0);if(Math.abs(floor(map,xx,zz,y+.08)-y)>.08)return false;}return true;}
for(const [map,source,fingerprint,spawnCount]of[[RUST,RUST_SOURCE,rustFingerprint,35]]){
 assert.equal(map.spawns.length,spawnCount);assert.equal(map.pads.length,4);assert.equal(map.pickups.filter(p=>p.amount===50).length,1);assert.equal(map.pickups.filter(p=>p.amount===25).length,4);assert.equal(map.pickups.filter(p=>p.amount===5).length,12);
 for(const [i,s]of map.spawns.entries()){assert.equal(s[0],source.spawns[i].position[0]);assert.equal(s[2],source.spawns[i].position[2]);assert.ok(canOccupy(map.brushes,{x:s[0],z:s[2],feet:s[1]+.005,height:1.9,radius:.4}),map.id+' original spawn clearance');}
 const digest=createHash('sha256').update(fs.readFileSync(new URL('../dist/maps/'+map.id+'-data.js',import.meta.url))).update(JSON.stringify([map.elevators,map.pads,map.anchors,map.stepHeight,map.bounds,map.maxHeight,!!map.navigationGround])).digest('hex');assert.equal(digest,fingerprint,map.id+' traversal changed: rebake source navigation');
 const nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);assert.equal(nav.pads.length,4);for(const a of map.spawns)for(const b of map.spawns)assert.ok(findRoute(nav,{x:a[0],y:a[1],z:a[2]},{x:b[0],y:b[1],z:b[2]}).length,map.id+' all source spawn routes');
 for(const pad of map.pads){const target=pad.landing;assert.ok(fullSupport(map,target.x,target.y,target.z),pad.id+' landing is genuinely inside the original platform');for(const dx of [-pad.size/2,pad.size/2])for(const dz of [-pad.size/2,pad.size/2])assert.ok(Math.abs(floor(map,pad.x+dx,pad.z+dz,pad.y+.25)-pad.y)<.25,pad.id+' visual plate stays on the source floor');
  for(const [dx,dz]of offsets){const x=pad.x+dx,z=pad.z+dz,y=floor(map,x,z,pad.y+.3,.4),time=launchTime(pad.power,target.y-y);assert.ok(Math.abs(y-pad.y)<.3,pad.id+' off-center trigger remains supported');
   for(let step=0;step<=180;step++){const t=time*step/180;assert.ok(canOccupy(map.brushes,{x:x+(target.x-x)*t/time,z:z+(target.z-z)*t/time,feet:y+.005+pad.power*t-11.5*t*t,height:1.9,radius:.4}),pad.id+' complete off-center flight clearance');}
   let body={x,z,feet:y+.005,height:1.9,radius:.4,grounded:false},vy=pad.power,landed=false;for(let i=0;i<720;i++){vy-=23/120;body=moveCharacter(map.brushes,body,{x:(target.x-x)/time/120,z:(target.z-z)/time/120,y:vy/120},{grounded:false,stepHeight:map.stepHeight,bounds:map.bounds});assert.ok(!body.ceiling,pad.id+' no head contact during real flight');if(body.grounded&&i>8){assert.ok(Math.abs(body.feet-target.y)<.12&&Math.hypot(body.x-target.x,body.z-target.z)<1.2,pad.id+' real movement reaches intended platform');assert.ok(fullSupport(map,body.x,body.feet,body.z,.4),pad.id+' real arrival is safely inside the platform');landed=true;break;}}assert.ok(landed,pad.id+' real flight lands');
  }
 }
 console.log(map.name+': exact '+spawnCount+' source spawns, all '+spawnCount**2+' routes, four genuine-footprint pads, 36 off-center analytic/native arrivals, resource access and navigation fingerprint pass.');
}
// The actual bot scheduler must use the exact landing, not its rounded graph node.
const h=createGameHarness(912);h.setup();await h.run(`(async()=>{
changeArena('rust');makeBots();mode='play';locked=true;respawnTime=0;health=100000;const pad=MAP.pads[0],bot=bots[0],brain=opponentAI.brains.get(bot);bot.pos.set(pad.x,pad.y,pad.z);bot.vy=0;brain.flight=null;brain.pathIn=100;brain.path=[{x:pad.landing.x+2,y:pad.landing.y,z:pad.landing.z,action:'pad',pad}];brain.goal={type:'rotate',...pad.landing};brain.visible=false;brain.memory.clear();opponentAI.navigate(bot,brain,1/120);assert.ok(brain.flight);const flight=launchTime(pad.power,pad.landing.y-bot.pos.y);assert.ok(Math.abs(brain.flight.vx-(pad.landing.x-bot.pos.x)/flight)<1e-8,'AI uses exact source landing');
const saved=localStorage.getItem('dh-run');await beginPractice('shipment');assert.equal(MAP.id,'shipment');assert.ok(navNodes.length>1000);assert.equal(practiceMaps().length,MAPS.length);showPracticeMaps();assert.equal($('panel').querySelectorAll('[data-practice-map]').length,MAPS.length);assert.equal(localStorage.getItem('dh-run'),saved,'practice map selection leaves campaign untouched');practiceCollection.kit.mechanism={id:'semi',rank:3};buildWeapon();const configured=JSON.stringify(practiceCollection.kit);await beginPractice('rust');assert.equal(equipped,0);assert.equal(JSON.stringify(practiceCollection.kit),configured,'map change keeps the modular practice configuration');
})()`);
console.log('Imported maps: exact AI pad trajectory, cached native practice-map switching and campaign isolation pass.');

h.run(`
for(const [id,padIndex,target]of[['rust',0,{x:6,y:20.65625,z:-2.5}],['rust',1,{x:6,y:20.65625,z:-2.5}]]){
 changeArena(id);makeBots();mode='play';respawnTime=0;playerPos.set(35,40,35);const bot=bots[0];bots=[bot];const pad=MAP.pads[padIndex];bot.pos.set(pad.x,pad.y+.005,pad.z);bot.vy=0;const brain=opponentAI.reset(bot,0);brain.goal={type:'rotate',...target};let reached=false;
 for(let i=0;i<7200;i++){opponentAI.clock+=1/120;opponentAI.navigate(bot,brain,1/120);opponentAI.world.physics(bot,brain,1/120);if(Math.hypot(bot.pos.x-target.x,bot.pos.z-target.z)<.4&&Math.abs(bot.pos.y-target.y)<.1){reached=true;break;}}
 assert.ok(reached,'real AI completes staged source route '+id+'/'+padIndex);assert.ok(opponentAI.stats.pads>0);
}
console.log('Native AI completes both Rust entries through the summit stages.');
`,{timeout:180000});
