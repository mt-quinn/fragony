import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MAPS,selectMap} from '../dist/map.js';
import {RESERVOIR as map,RESERVOIR_SOURCE as source} from '../dist/maps/reservoir.js';
import {fingerprint} from '../dist/maps/reservoir-nav.js';
import {restoreNavigation,findRoute,nearestNode} from '../dist/ai.js';
import {healthAfterPickup,healthPickup} from '../dist/pickups.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
import {ElevatorSystem} from '../dist/elevators.js';
import {createGameHarness} from './harness.mjs';
const digest=createHash('sha256').update(fs.readFileSync(new URL('../dist/maps/reservoir-data.js',import.meta.url))).update(JSON.stringify([map.elevators,map.anchors,map.stepHeight])).digest('hex');
assert.equal(fingerprint,digest,'geometry/navigation changed: run node tools/bake-reservoir-nav.mjs');
assert.equal(source.items.length,36);assert.equal(source.spawns.length,12);assert.ok(map.brushes.length>1100);assert.ok(Object.values(source.groups).reduce((n,g)=>n+g.p.length/9,0)>12000);
for(const [i,p]of source.items.entries()){const q=map.pickups[i];assert.equal(q.x,p.position[0]);assert.equal(q.z,p.position[2]);assert.equal(q.amount,p.type.includes('medium')?25:5)}
// EF keeps each source reward pattern; its exact per-entity sizes/counts are
// checked by eliteforce-maps. The earlier eleven arenas retain one major.
for(const m of MAPS){assert.ok(m.pickups.every(p=>p.kind==='health'&&[5,25,50].includes(p.amount)));if(m.sourceFamily==='eliteforce')continue;assert.equal(m.pickups.filter(p=>p.amount===50).length,1);assert.ok(m.pickups.filter(p=>p.amount===5).length>=12);assert.ok(m.pickups.filter(p=>p.amount===25).length>=4);assert.ok(!m.pickups.some(p=>p.kind==='armor'));}
const small=healthPickup('s',0,0,0,5),standard=healthPickup('h',0,0,0,25),major=healthPickup('m',0,0,0,50);
for(const max of [100,140]){assert.equal(healthAfterPickup(max,max,small),max);assert.equal(healthAfterPickup(max,max,major),max);assert.equal(healthAfterPickup(max,max,standard),max);assert.equal(healthAfterPickup(max-10,max,standard),max);assert.equal(healthAfterPickup(150,max,standard),150)}assert.equal(healthAfterPickup(198,100,small),198);assert.equal(healthAfterPickup(200,100,major),200);
const navigation=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight);
for(const a of map.spawns)for(const b of map.spawns)assert.ok(findRoute(navigation,{x:a[0],y:a[1],z:a[2]},{x:b[0],y:b[1],z:b[2]}).length);
for(const p of [...map.pickups,...map.spawns.map(([x,y,z])=>({x,y,z}))]){assert.ok(canOccupy(map.brushes,{x:p.x,z:p.z,feet:p.y,height:1.9,radius:.4}),'clear pickup/spawn '+JSON.stringify(p));assert.ok(Math.abs(nearestNode(navigation,p).y-p.y)<.35,'height-matched navigation');}
// Every lift carries a standing body both directions at 30/120Hz and checks all
// static ceiling contacts throughout, rather than merely checking its endpoints.
for(const dt of [1/30,1/120])for(const definition of map.elevators){const blocks=map.brushes.map(b=>({...b})),system=new ElevatorSystem([definition],blocks),lift=system.lifts[0];let feet=lift.low,top=false,bottom=false;const actor={x:()=>lift.x,z:()=>lift.z,feet:()=>feet,velocityY:()=>0,height:()=>1.9,carry:dy=>feet+=dy};for(let t=0;t<10;t+=dt){system.step(dt,[actor]);assert.ok(canOccupy(system.staticBlocks,{x:lift.x,z:lift.z,feet,height:1.9,radius:.4}));if(feet>=lift.high-.01)top=true;if(top&&feet<=lift.low+.01)bottom=true}assert.ok(top&&bottom,definition.id+' completes a safe round trip');}
// Low ceiling blocks ascent; descending slab reverses before crushing somebody.
{const ceiling={x:0,z:0,w:4,d:4,bottom:3,top:4},blocks=[ceiling],system=new ElevatorSystem([{id:'test',x:0,z:0,w:2,d:2,low:0,high:5,entry:{x:0,z:2}}],blocks);let feet=0,max=0;for(let i=0;i<300;i++){system.step(1/120,[{x:()=>0,z:()=>0,feet:()=>feet,velocityY:()=>0,height:()=>1.9,carry:dy=>feet+=dy}]);max=Math.max(max,feet);assert.ok(feet+1.9<=3.001)}assert.ok(max>0&&max<1.11)}
const h=createGameHarness(124);h.setup();h.run("changeArena('reservoir');makeBots();mode='play';respawnTime=0;playerPos.set(30,32,0);");
const routes=[...[0,1,2,3].flatMap(i=>{const e=map.elevators[i];return[[[e.entry.x,e.low,e.entry.z],[e.entry.x,e.high,e.entry.z]],[[e.entry.x,e.high,e.entry.z],[e.entry.x,e.low,e.entry.z]]]}),[[-19.75,37,-47.5],[20,37,-47.5]],[[20,37,-40.25],[20.25,37,39.75]],[[0,2,18],[0,14,0]],[[-31,31,0],[31,31,0]]];
for(const [start,goal]of routes)h.run(`{elevatorSystem.reset();const b=bots[0];bots=[b];b.pos.set(...${JSON.stringify(start)});b.vy=0;const brain=opponentAI.reset(b,0),target=new THREE.Vector3(...${JSON.stringify(goal)});brain.goal={type:'rotate',x:target.x,y:target.y,z:target.z};let reached=false;for(let i=0;i<5400;i++){opponentAI.clock+=1/60;stepElevators(1/60);opponentAI.navigate(b,brain,1/60);opponentAI.world.physics(b,brain,1/60);if(b.pos.distanceTo(target)<.65&&!brain.liftRide){reached=true;break}}assert.ok(reached,'actual route '+JSON.stringify(${JSON.stringify([start,goal])})+' ended '+JSON.stringify(b.pos));}`);
// Real player collection, including assist reset, overhealth and untouched full packs.
h.run(`{bots=[];opponentAI.brains.clear();mode='play';respawnTime=0;health=100;focus=100;perks={};vel.set(0,0,0);vy=0;keys.clear();const p=pickups.find(p=>p.amount===5);playerPos.set(p.x,p.y+eyeHeight,p.z);recordDamage(playerCredit,'attacker',10);updateStep(1/120);assert.ok(health>100);assert.equal(playerCredit.damageCredit?.size||0,0);assert.ok(p.timer>0);const normal=pickups.find(p=>p.amount===25);playerPos.set(normal.x,normal.y+eyeHeight,normal.z);health=200;updateStep(1/120);assert.equal(health,200);assert.equal(normal.timer,0);health=190;updateStep(1/120);assert.equal(health,200);assert.ok(normal.timer>0);const major=pickups.find(p=>p.amount===50);playerPos.set(major.x,major.y+eyeHeight,major.z);health=100;updateStep(1/120);assert.equal(health,200);assert.ok(major.timer>29);}`);
h.run(`{changeArena('testworks');assert.equal(MAP.id,'testworks');changeArena('reservoir');assert.equal(MAP.id,'reservoir');saveRun();assert.equal(JSON.parse(localStorage.getItem('dh-run')).mapId,'reservoir');makeBots();startMatch();for(let i=0;i<5500&&mode==='play';i++)updateStep(1/60);assert.equal(time,0);assert.equal(mode,'results');assert.ok(opponentAI.stats.shots>30,'bots engage during a full match');assert.ok(opponentAI.stats.pickups>0,'bots collect health');console.log('Reservoir match:',opponentAI.stats.shots,'shots,',opponentAI.stats.pickups,'pickups,',bots.reduce((n,b)=>n+(b.frags||0),0),'bot kills');}` ,{timeout:60000});
selectMap('testworks');console.log('Reservoir: exact source geometry/item coordinates, 144 routes, four bidirectional physical bot lifts, ceiling safety, stair/gallery/water travel, real health collection/caps, map switching/save and full match pass.');
