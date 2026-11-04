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
const h=createGameHarness(9);h.setup();h.run(`{
 mode='play';locked=true;blocks=[];worldMeshes=[];health=100;respawnTime=0;playerSpawnAt=-10;opponentAI.clock=20;perks={};playerPos.set(0,1.7,10);yaw=0;for(const b of bots){b.dead=100;b.group.visible=false;}const b=bots[0];b.dead=0;b.pos.set(0,0,0);b.loadout=['rifle'];b.rival.owned=[0];b.rival.builds=normalizeBuilds();opponentAI.reset(b,0);const w={...opponentAI.world.weapon(b,'rifle').native,spread:0,type:'rifle',rounds:1};
 for(const [x,y,expected,part]of [[0,1.65,37.5,'head'],[0,1.1,25,'torso'],[0,.8,25,'pelvis'],[.3,1.1,18.75,'rightArm'],[-.3,1.1,18.75,'leftArm'],[.1,.3,18.75,'rightLeg'],[-.1,.3,18.75,'leftLeg']]){health=100;playerHistory.clear();fireRivalWeapon(b,{x,y,z:10},w);assert.equal(100-health,expected,part+' native incoming multiplier');const row=playerHistory.snapshot()[0];assert.equal(row.damage,expected);assert.equal(row.parts[part],expected,'recap reports resolved limb damage');}
}`);
console.log('Body damage: all seven regions, shared player/bot traces, mixed shotgun packets, independent splash, unknown-region fallback and native incoming hit/recap totals pass (head1.5, core1, limbs.75).');
