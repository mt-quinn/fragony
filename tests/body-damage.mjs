import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {BODY_MULTIPLIERS,bodyDamage} from '../dist/combat.js';
import {traceCartridges} from '../dist/ballistics.js';
import {createGameHarness} from './harness.mjs';
const w={damage:24,pellets:1,volley:1,spread:0,core:1,payload:'bullet',penetration:[1],splash:0},origin=new THREE.Vector3(),direction=new THREE.Vector3(0,0,-1);
for(const [part,multiplier]of Object.entries(BODY_MULTIPLIERS)){const bot={hp:100,dead:0},mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());mesh.position.z=-10;mesh.userData={bot,part};mesh.updateMatrixWorld(true);const hit=traceCartridges(w,origin,direction,[mesh]).hits.get(bot);assert.equal(hit.damage,24*multiplier);assert.equal(hit.parts[0].damage,24*multiplier);mesh.geometry.dispose();mesh.material.dispose();}
assert.equal(bodyDamage(24,'unknown'),24);
const bot={hp:100,dead:0},parts=['head','torso','leftArm','rightLeg'];let index=0;const proxy=new THREE.Object3D();proxy.raycast=(ray,hits)=>hits.push({distance:10,point:new THREE.Vector3(0,0,-10),object:{userData:{bot,part:parts[index++]}}});const mixed=traceCartridges({...w,damage:10,pellets:4},origin,direction,[proxy]);assert.equal(mixed.hits.get(bot).damage,40);assert.deepEqual(mixed.hits.get(bot).parts.map(p=>p.damage),[15,10,7.5,7.5]);
const explosive=traceCartridges({...w,damage:16,splash:8,blast:1.5},origin,direction,[Object.assign(new THREE.Object3D(),{raycast:(ray,hits)=>hits.push({distance:10,point:new THREE.Vector3(0,0,-10),object:{userData:{bot,part:'leftArm'}}})})]);assert.equal(explosive.hits.get(bot).damage,12);assert.equal(explosive.blasts[0].damage,8,'splash is a separate torso-area payload, not a second limb multiplier');
console.log('Body damage: legacy trace regions, mixed packets, separate splash and fallback fixtures pass. Live player/bot damage parity is covered by modular-integration.mjs.');
