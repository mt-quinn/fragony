import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createRifle,animateRifle} from '../dist/rifle.js';
import {createGameHarness} from './harness.mjs';
const group=new THREE.Group(),hero=createRifle(group),poses=[];
for(const t of [0,.12,.28,.39,.45,.58,.70,.85,.94,1]){animateRifle(hero,{reload:t,reloading:true,shotAge:2,ammo:0});poses.push({t,y:hero.magazine.position.y,visible:hero.magazine.visible,left:hero.left.position.clone(),bolt:hero.bolt.position.z});group.updateMatrixWorld(true);group.traverse(m=>{if(m.isMesh){assert.ok(m.geometry.attributes.position.count>0);assert.ok(m.matrixWorld.elements.every(Number.isFinite))}})}
assert.ok(poses[2].y<-.35);assert.equal(poses[4].visible,false);assert.ok(Math.abs(poses[6].y)<.12);assert.ok(poses[7].bolt>hero.boltBase.z+.03);animateRifle(hero,{ammo:30,shotAge:1});assert.equal(hero.magazine.visible,true);assert.equal(hero.magazine.position.y,0);assert.ok(hero.left.position.distanceTo(hero.leftBase)<1e-6);animateRifle(hero,{ammo:0});assert.ok(hero.bolt.position.z>hero.boltBase.z+.05);
const h=createGameHarness();h.setup();h.run(`
owned=[0];equipped=0;buildWeapon();assert.ok(weaponGroup.userData.heroRifle);weaponGroup.traverse(m=>assert.ok(m.layers.isEnabled(1)));ammo=30;reload();assert.equal(reloading,0);ammo=0;reload();assert.ok(reloading>0);assert.ok(weaponGroup.userData.heroRifle.emptyReload);
for(const gun of [0,1,2,3,4,5]){equipped=gun;buildWeapon();let skin=[];weaponGroup.traverse(m=>{if(m.userData.healthSkin)skin.push(m)});assert.ok(skin.length>0);for(const hp of [100,50,10,0]){health=hp;tintPlayerArms();assert.ok(skin.every(m=>m.material.color.getHex()===(hp?healthColors[Math.round(hp/100*20)]:0x858c88)))}health=100}
const before=blocks.length;assert.ok(blocks.some(b=>b.bottom>11&&b.top<12),'light housings and panels participate in collision');
`);
console.log('Presentation: rifle geometry/layers, magazine withdrawal/replacement, bolt operation, hand recovery, empty reload and physical light fixtures pass.');
