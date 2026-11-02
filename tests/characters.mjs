import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
import {animateDummy,fireDummy,beginRagdoll,stepRagdoll} from '../dist/characters.js';
const h=createGameHarness();h.setup();
const b=h.run('bots[0]');h.run('opponentAI=null;spawnBot(bots[0]);bots[0].pos.set(0,0,0);resetDummyRig(bots[0]);');
const brain={previous:{x:0,y:0,z:0},facing:0,aim:{x:0,y:1.3,z:10},weapon:{reload:1.7},weaponType:'rifle',reload:0,underFire:0,charge:0};
let samples=0,maxStretch=0;
for(const [speed,crouched]of [[0,false],[3,false],[6.5,false],[1.8,true]]){b.crouched=crouched;for(let i=0;i<240;i++){brain.previous={...b.pos};b.pos.z+=speed/120;animateDummy(b,brain,1/120,()=>0);b.group.updateMatrixWorld(true);for(const side of ['left','right']){const hip=b.markers[side+'Hip'].getWorldPosition(new THREE.Vector3()),knee=b.markers[side+'Knee'].getWorldPosition(new THREE.Vector3()),ankle=b.markers[side+'Ankle'].getWorldPosition(new THREE.Vector3());assert.ok(Math.abs(hip.distanceTo(knee)-.4)<1e-5);assert.ok(Math.abs(knee.distanceTo(ankle)-.39)<1e-5);assert.ok(ankle.y>.035,'feet remain above floor');maxStretch=Math.max(maxStretch,hip.distanceTo(ankle));}samples++}}
assert.ok(b.anim.crouch>.99);assert.ok(b.parts.head.position.y<1.3,'crouch actually lowers head');
fireDummy(b,'shotgun');assert.equal(b.anim.shot,1);animateDummy(b,brain,.1,()=>0);assert.ok(b.anim.shot<.3,'recoil settles');
h.run('spawnBot(bots[0]);bots[0].pos.set(0,0,0);resetDummyRig(bots[0]);');
const floor=[];beginRagdoll(b,new THREE.Vector3(1,.15,0),'torso');for(let i=0;i<600;i++)stepRagdoll(b,1/120,floor);
let highest=0,error=0;for(const n of b.ragdoll.list){assert.ok(Number.isFinite(n.p.x+n.p.y+n.p.z));assert.ok(n.p.y>=n.radius-.002,'ragdoll stays above floor');highest=Math.max(highest,n.p.y)}for(const l of b.ragdoll.links){const length=l.a.p.distanceTo(l.b.p);error=Math.max(error,Math.max(l.min-length,length-l.max,0));}
assert.ok(highest<.65,'body collapses instead of staying upright');assert.ok(error<.07,'ragdoll joints remain attached');
// No launch: immediate gravity collapse, with existing travel and vertical speed retained.
h.run('spawnBot(bots[0]);bots[0].pos.set(0,0,0);resetDummyRig(bots[0]);');
beginRagdoll(b,new THREE.Vector3());for(const n of b.ragdoll.list)assert.ok(n.p.distanceTo(n.prev)<1e-8,'stationary death has no invented velocity');for(let i=0;i<60;i++)stepRagdoll(b,1/120,[]);assert.ok(b.ragdoll.nodes.chest.p.y<.3,'stationary body drops promptly');
h.run('spawnBot(bots[0]);bots[0].pos.set(0,3,0);resetDummyRig(bots[0]);');b.anim.initialized=true;b.anim.velocity.set(6,0,-2);b.anim.jointVelocity={};b.vy=-3;beginRagdoll(b,new THREE.Vector3());let n=b.ragdoll.nodes.pelvis;const inherited=n.p.clone().sub(n.prev).multiplyScalar(120);assert.ok(inherited.distanceTo(new THREE.Vector3(6,-3,-2))<1e-6,'travel and fall speed carry across death');const start=n.p.clone();for(let i=0;i<12;i++)stepRagdoll(b,1/120,[]);assert.ok(n.p.x-start.x>.45);assert.ok(n.p.z<start.z-.1);assert.ok(n.p.y<start.y-.3);
// Death near thin, rotated cover and on an elevated platform.
for(const yaw of [0,.55]){h.run('spawnBot(bots[0]);bots[0].pos.set(-.55,1.5,0);resetDummyRig(bots[0]);');const blocks=[{x:0,z:0,w:.12,d:6,bottom:0,top:5,yaw},{x:-2,z:0,w:4,d:5,bottom:1.3,top:1.5,yaw:0}];beginRagdoll(b,new THREE.Vector3(2,.3,0));for(let i=0;i<500;i++)stepRagdoll(b,1/120,blocks);for(const n of b.ragdoll.list){const u=Math.cos(yaw)*n.p.x-Math.sin(yaw)*n.p.z;assert.ok(Math.abs(u)>.06+n.radius-.02||n.p.y>5+n.radius,'thin wall blocks ragdoll');assert.ok(Number.isFinite(n.p.y))}}
const paths=[];for(const tick of [1/120,.22/120]){h.run('spawnBot(bots[0]);bots[0].pos.set(0,4,0);resetDummyRig(bots[0]);');b.anim.initialized=true;b.anim.velocity.set(6,0,0);b.anim.jointVelocity={};beginRagdoll(b,new THREE.Vector3());for(let t=0;t<.3;t+=tick)stepRagdoll(b,Math.min(tick,.3-t),[]);paths.push(b.ragdoll.nodes.chest.p.clone())}assert.ok(paths[0].distanceTo(paths[1])<.1,'slow-motion substeps preserve world-time momentum');
console.log(`Characters: ${samples} idle/walk/run/crouch samples, articulated lengths, floor clearance, recoil, falling/settling, attached joints, raised platforms and rotated thin-wall contacts pass.`);
