import assert from 'node:assert/strict';
import {HurtFeedback,HURT,nearMissSegment} from '../dist/hurt.js';
import {createGameHarness} from './harness.mjs';
const f=new HurtFeedback();
f.hit(10,100,Math.PI);let state=f.step(0,100,100,0);assert.ok(Math.abs(state.directions[0].rotation)<1e-6,'front stays top');
state=f.step(0,100,100,Math.PI/2);assert.ok(Math.abs(state.directions[0].rotation-Math.PI/2)<1e-6,'world direction tracks camera rotation');
f.hit(20,100,Math.PI+.1);assert.equal(f.directions.length,1,'nearby hits merge');
f.hit(20,100,0);f.hit(20,100,-Math.PI/2);assert.equal(f.directions.length,3,'several attackers remain visible');
for(let i=0;i<12;i++)f.hit(20,100,Math.PI/2,'source'+i);assert.equal(f.directions.length,HURT.maxDirections,'bounded clutter');
f.step(2.1,100,100,0);assert.equal(f.directions.length,0,'arcs expire');
for(const fps of [30,60,144]){f.reset();let beats=0;for(let i=0;i<fps*5;i++){state=f.step(1/fps,20,100,0);beats+=state.beat}assert.ok(state.edge>.2&&state.edge<=.65);assert.ok(beats>=4&&beats<=5,'quiet bounded heartbeat cadence');state=f.step(.01,0,100,0,{alive:false});assert.equal(state.edge,0);assert.equal(state.beat,false);assert.equal(f.directions.length,0)}
f.reset();for(let i=0;i<60;i++)state=f.step(1/60,50,100,0);const mild=state.edge;for(let i=0;i<60;i++)state=f.step(1/60,20,100,0);assert.ok(state.edge>mild);for(let i=0;i<120;i++)state=f.step(1/60,100,100,0);assert.ok(state.edge<.001,'healing removes warning');
f.reset();f.hit(5,100);assert.equal(f.directions.length,0,'unknown source never invents direction');
const h=createGameHarness();h.setup();h.run(`
spawnPlayer();const source=playerPos.clone().add(new THREE.Vector3(5,0,0));damagePlayer(20,null,{origin:source});assert.equal(hurtFeedback.directions.length,1,'self blast has real origin');spawnPlayer();assert.equal(hurtFeedback.directions.length,0,'respawn clears cues');assert.equal(hurtFeedback.low,0);
`);
console.log('Damage feedback: front/right/turning bearings, simultaneous attackers, expiry, health scaling, healing/death/respawn cleanup and real-time heartbeat cadence pass.');

f.reset();f.nearMiss(Math.PI,'a');state=f.step(0,100,100,0);assert.equal(state.directions[0].kind,'near');assert.equal(state.flash,0,'near fire is not damage');
f.hit(20,100,Math.PI,'a');f.hit(20,100,Math.PI,'b');f.nearMiss(Math.PI+.05,'c');state=f.step(0,80,100,0);assert.equal(state.directions.length,3,'same-angle shooters stay separate');assert.equal(new Set(state.directions.map(c=>c.lane)).size,3,'overlapping arcs have distinct radial layers');
f.nearMiss(Math.PI,'a');state=f.step(.2,80,100,Math.PI/2);assert.equal(state.directions.find(c=>c.sourceId==='a').kind,'hit','near miss cannot downgrade a live hit');assert.ok(state.directions.every(c=>Math.abs(c.rotation-Math.PI/2)<.1),'all layers rotate together');
f.hit(10,100,Math.PI,'a');assert.equal(f.directions.length,3,'same shooter refreshes instead of multiplying');
for(const [bearing,expected]of [[Math.PI,0],[Math.PI/2,Math.PI/2],[0,Math.PI],[-Math.PI/2,-Math.PI/2]]){f.reset();f.hit(10,100,bearing,'test');state=f.step(0,100,100,0);assert.ok(Math.abs(Math.cos(state.directions[0].rotation)-Math.cos(expected))<1e-6);assert.ok(Math.abs(Math.sin(state.directions[0].rotation)-Math.sin(expected))<1e-6)}
const eye={x:0,y:1.7,z:0};assert.ok(nearMissSegment({x:1,y:1,z:-10},{x:1,y:1,z:10},eye));assert.equal(nearMissSegment({x:1,y:1,z:-10},{x:1,y:1,z:-2},eye),null,'stopped by cover before passing player');assert.equal(nearMissSegment({x:4,y:1,z:-10},{x:4,y:1,z:10},eye),null,'distant fire excluded');assert.equal(nearMissSegment(eye,eye,eye),null);
h.run(`
spawnPlayer();worldMeshes=[];bots.forEach(b=>scene.remove(b.group));const shooter=bots[0];shooter.pos.set(1,0,-10);bots=[shooter];playerPos.set(0,1.7,0);playerSpawnAt=0;opponentAI.clock=10;hurtFeedback.reset();const gun={type:'rifle',damage:10,spread:0,range:30,pellets:1};
fireBotWeapon(shooter,{x:1,y:1,z:10},gun);assert.equal(health,100);assert.equal(hurtFeedback.directions[0].sourceId,shooter.name+':'+shooter.lifeId);assert.equal(hurtFeedback.step(0,health,100,yaw).directions[0].kind,'near');
// The actual trace stops at solid cover; no visual suppression passes through it.
hurtFeedback.reset();const cover=new THREE.Mesh(new THREE.BoxGeometry(5,3,.3),new THREE.MeshBasicMaterial());cover.position.set(0,1,-4);scene.add(cover);worldMeshes=[cover];fireBotWeapon(shooter,{x:1,y:1,z:10},gun);assert.equal(hurtFeedback.directions.length,0);
scene.remove(cover);worldMeshes=[];fireBotWeapon(shooter,{x:0,y:1,z:0},gun);assert.ok(health<100);assert.equal(hurtFeedback.step(0,health,100,yaw).directions[0].kind,'hit');
`);
console.log('Incoming fire: per-shooter overlap layers, refresh/upgrade priority, all camera quadrants, actual near-miss bullet segments and blocked-shot suppression pass.');
