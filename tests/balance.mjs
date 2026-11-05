import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
import {normalizeBuilds,previewBuild,WEAPON_SLOTS,weaponStats} from '../dist/loadout.js';
import {distanceDamage} from '../dist/weapon-cycle.js';
import {traceCartridges} from '../dist/ballistics.js';
import {autoFirePadding,nearbyAutoTarget,AUTO_AIM_PADDING} from '../dist/mobile-targeting.js';
import {AutoFire} from '../dist/mobile-core.js';
import {ArenaAI,AI_TUNING,difficultyForRound} from '../dist/ai.js';
const h=createGameHarness(22);h.setup();const bases=h.run('weapons');
const build=(g,slot,key)=>previewBuild(normalizeBuilds(),g,slot,WEAPON_SLOTS[g][slot].find(a=>a.key===key).id);
const stats=(g,slot,key)=>weaponStats(bases[g],g,build(g,slot,key));
const origin=new THREE.Vector3(0,1.3,0),forward=new THREE.Vector3(0,0,-1),body=new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.4),new THREE.MeshBasicMaterial());
body.userData.bot={name:'TARGET',hp:1000,dead:0};body.userData.part='torso';
for(const [g,slot,key]of [[0,'ammunition','duplex'],[1,'action','twin'],[2,'action','duplex'],[3,'action','split'],[5,'action','double']]){
 const w=stats(g,slot,key);
 for(const ads of [false,true])for(const distance of [10,30,60]){
  body.position.set(0,1.3,-distance);body.updateMatrixWorld(true);
  const shot=traceCartridges(w,origin,forward,[body],{ads,random:()=>.5});
  assert.ok(Math.abs(shot.hits.get(body.userData.bot)?.damage-w.damage*w.pellets*w.volley*distanceDamage(w,distance-.2))<1e-7,`${w.action} / ${w.ammunition}: both shots hit the crosshair at ${distance}m`);
 }
}
// Every blast-producing ammo uses the final actual radius; other ammo stays precise.
for(let g=0;g<6;g++)for(const part of WEAPON_SLOTS[g].ammunition){
 const w=stats(g,'ammunition',part.key),explosive=w.splash>0||['rocket','airburst','breach','skip'].includes(w.payload);
 assert.equal(autoFirePadding(w),AUTO_AIM_PADDING+(explosive?w.blast:0),part.name);
}
assert.equal(autoFirePadding(stats(4,'action','pressure')),AUTO_AIM_PADDING+2.5);
body.position.set(1.1,1.3,-10);body.updateMatrixWorld(true);
const ray=new THREE.Raycaster(origin,forward,0,90),explosive=stats(0,'ammunition','demolition');
assert.equal(nearbyAutoTarget(ray,[body],[]),null);
assert.ok(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),'blast reaches outside the direct-hit box');
body.position.x=3.5;body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),null,'outside blast stays outside acquisition');
body.position.set(2.8,4.4,-10);body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),null,'diagonal box corners cannot inflate blast reach');
body.position.set(1.1,1.3,-10);body.updateMatrixWorld(true);
const cover=new THREE.Mesh(new THREE.BoxGeometry(6,6,.5),new THREE.MeshBasicMaterial());cover.position.set(0,1.3,-5);cover.updateMatrixWorld(true);
assert.equal(nearbyAutoTarget(ray,[body],[cover],autoFirePadding(explosive)),null,'blast margin does not acquire enemies through cover');
console.log('Acquisition: centered legacy packets, blast padding, diagonal bounds and cover pass. Modular build/damage coverage is in modular.mjs.');
