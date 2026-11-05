import {modelAttachments,applyAttachmentModels,animateAttachmentModels} from '../dist/attachment-models.js';
import {renderWeaponView} from '../dist/presentation.js';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createNailer,animateNailer} from '../dist/nailer.js';
import {WEAPON_SLOTS} from '../dist/loadout.js';
import {WEAPON_ORDER,weaponSlot} from '../dist/weapon-order.js';
import {createGameHarness} from './harness.mjs';
const parent=new THREE.Group(),h=createNailer(parent),y=h.sightY;
assert.equal(y,.244);assert.equal(h.muzzleZ,-.625);
for(const ammo of [7,0])for(const t of [0,.12,.26,.4,.5,.65,.8,.9,1]){h.emptyReload=ammo===0;animateNailer(h,{reload:t,reloading:true,ammo});parent.updateMatrixWorld(true);parent.traverse(m=>assert.ok(m.matrixWorld.elements.every(Number.isFinite)));if(t===.4)assert.equal(h.magazine.visible,false);if(t===.26)assert.ok(h.magazine.position.y<-.3);if(ammo===0&&t<.78)assert.ok(h.slide.position.z>.09);if(t>=.9)assert.ok(h.slide.position.z<.001)}
animateNailer(h,{ammo:0});assert.equal(h.slide.position.z,.102);animateNailer(h,{ammo:7,shotAge:.025});assert.ok(h.slide.position.z>.07);animateNailer(h,{ammo:7,shotAge:1});assert.equal(h.slide.position.z,0);assert.ok(h.left.position.distanceTo(h.leftBase)<1e-8);
// Sights stay centered in ADS; every optic leaves a genuine open central window.
for(const optic of [null,...WEAPON_SLOTS[1].optic]){
 const p=new THREE.Group(),hero=createNailer(p,{attachments:optic?[optic]:[]});p.position.set(0,-hero.sightY*.85,-.5);p.scale.setScalar(.85);p.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1),0,2);const meshes=[];p.traverse(m=>{if(m.isMesh&&m.material.opacity!==.075)meshes.push(m)});
 if(optic)assert.equal(ray.intersectObjects(meshes,false).length,0,optic.id+' target window must remain clear');
 for(const phase of [0,.25,.8]){hero.emptyReload=true;animateNailer(hero,{ammo:0,reload:phase,reloading:true});assert.equal(hero.sightY,optic ? .355 : .244)}
}
// Physically visible combinations: barrels, all muzzle options and all magazines.
for(const barrel of [null,...WEAPON_SLOTS[1].action])for(const muzzle of [null,...WEAPON_SLOTS[1].ammunition])for(const magazine of [null,...WEAPON_SLOTS[1].feed]){
 const p=new THREE.Group(),parts=[barrel,muzzle,magazine].filter(Boolean),hero=createNailer(p,{attachments:modelAttachments(1,parts)});applyAttachmentModels(hero,1,parts);p.updateMatrixWorld(true);assert.ok(hero.muzzleZ<-.45);assert.ok(hero.muzzleZ>-.95);let n=0;p.traverse(m=>{if(m.isMesh){n++;assert.ok(m.geometry.attributes.position.count>0)}});assert.ok(n<155,'bounded hero model detail');
}
assert.deepEqual(WEAPON_ORDER,[1,2,0,5,4,3]);assert.deepEqual(WEAPON_ORDER.map(weaponSlot),[1,2,3,4,5,6]);
console.log('Legacy hand-cannon geometry, animation and optics fixtures pass.');
const c=new THREE.PerspectiveCamera(33,1,.07,160);c.userData.weaponFovFloor=65;let fov;renderWeaponView({render:(s,c)=>fov=c.fov},{},c);assert.equal(fov,65);assert.equal(c.fov,33);assert.throws(()=>renderWeaponView({render:()=>{throw Error('render')}},{},c));assert.equal(c.fov,33);
