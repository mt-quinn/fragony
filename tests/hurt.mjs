import assert from 'node:assert/strict';
import {HurtFeedback,HURT} from '../dist/hurt.js';
import {createGameHarness} from './harness.mjs';
const f=new HurtFeedback();
f.hit(10,100,Math.PI);let state=f.step(0,100,100,0);assert.ok(Math.abs(state.directions[0].rotation)<1e-6,'front stays top');
state=f.step(0,100,100,Math.PI/2);assert.ok(Math.abs(state.directions[0].rotation-Math.PI/2)<1e-6,'world direction tracks camera rotation');
f.hit(20,100,Math.PI+.1);assert.equal(f.directions.length,1,'nearby hits merge');
f.hit(20,100,0);f.hit(20,100,-Math.PI/2);assert.equal(f.directions.length,3,'several attackers remain visible');
f.hit(20,100,Math.PI/2);assert.equal(f.directions.length,HURT.maxDirections,'bounded clutter');
f.step(1.3,100,100,0);assert.equal(f.directions.length,0,'arcs expire');
for(const fps of [30,60,144]){f.reset();let beats=0;for(let i=0;i<fps*5;i++){state=f.step(1/fps,20,100,0);beats+=state.beat}assert.ok(state.edge>.2&&state.edge<=.65);assert.ok(beats>=4&&beats<=5,'quiet bounded heartbeat cadence');state=f.step(.01,0,100,0,{alive:false});assert.equal(state.edge,0);assert.equal(state.beat,false);assert.equal(f.directions.length,0)}
f.reset();for(let i=0;i<60;i++)state=f.step(1/60,50,100,0);const mild=state.edge;for(let i=0;i<60;i++)state=f.step(1/60,20,100,0);assert.ok(state.edge>mild);for(let i=0;i<120;i++)state=f.step(1/60,100,100,0);assert.ok(state.edge<.001,'healing removes warning');
f.reset();f.hit(5,100);assert.equal(f.directions.length,0,'unknown source never invents direction');
const h=createGameHarness();h.setup();h.run(`
spawnPlayer();const source=playerPos.clone().add(new THREE.Vector3(5,0,0));damagePlayer(20,null,{origin:source});assert.equal(hurtFeedback.directions.length,1,'self blast has real origin');spawnPlayer();assert.equal(hurtFeedback.directions.length,0,'respawn clears cues');assert.equal(hurtFeedback.low,0);
`);
console.log('Damage feedback: front/right/turning bearings, simultaneous attackers, expiry, health scaling, healing/death/respawn cleanup and real-time heartbeat cadence pass.');
