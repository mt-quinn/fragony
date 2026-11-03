import {modelAttachments,applyAttachmentModels,animateAttachmentModels} from '../dist/attachment-models.js';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createToolWeapon,animateToolWeapon,createToolWorld,disposeToolModel} from '../dist/tool-weapons.js';
import {WEAPON_SLOTS,normalizeBuilds,previewBuild} from '../dist/loadout.js';
import {createGameHarness} from './harness.mjs';
const guns=[0,2,5,4,3];let inspected=0;
for(const gun of guns){
 const slots=WEAPON_SLOTS[gun],kits=[[],...Object.values(slots).flat().map(a=>[a]),...[0,1,2].map(i=>Object.values(slots).map(a=>a[Math.min(i,a.length-1)]))];
 for(const kit of kits){
  const root=new T.Group(),h=createToolWeapon(root,gun,{attachments:modelAttachments(gun,kit)});const models=applyAttachmentModels(h,gun,kit);
  assert.ok(Number.isFinite(h.muzzleZ));assert.ok(h.muzzleZ<-.45);assert.ok(Number.isFinite(h.sightY));
  for(const reload of [0,.15,.28,.36,.45,.56,.70,.82,.95,1]){
   h.emptyReload=true;animateToolWeapon(h,{reload,reloading:true,ammo:0,shotAge:1});root.updateMatrixWorld(true);root.traverse(m=>{assert.ok(m.matrixWorld.elements.every(Number.isFinite),'finite transform');if(m.isMesh){for(const k of ['position','normal'])assert.ok(m.geometry.attributes[k].array.every(Number.isFinite));assert.ok(m.scale.toArray().every(n=>n>0))}});
  }
  animateToolWeapon(h,{ammo:30,shotAge:10});root.position.set(-h.sightX*.85,-h.sightY*.85,-.5);root.scale.setScalar(.85);root.updateMatrixWorld(true);
  const optics=kit.find(a=>a.slot==='optic');if(optics||gun===3){const meshes=[];root.traverseVisible(m=>{if(m.isMesh&&m.material.opacity!==.075)meshes.push(m)});assert.equal(new T.Raycaster(new T.Vector3(),new T.Vector3(0,0,-1),0,3).intersectObjects(meshes,false).length,0,'clear optic '+gun+'/'+optics?.id)}
  let draws=0,verts=0;root.traverseVisible(m=>{if(m.isMesh){draws++;verts+=m.geometry.attributes.position.count}});assert.ok(draws<=70,'bounded draws '+gun+':'+draws);assert.ok(verts<65000,'bounded hero detail');
  if(gun!==0){const arm=h.arms[1],base=arm.position.clone();animateToolWeapon(h,{reloading:true,reload:.28,ammo:0});assert.ok(arm.position.distanceTo(base)>.02,'support arm follows reload');animateToolWeapon(h,{shotAge:10,ammo:30});assert.ok(arm.position.distanceTo(base)<1e-6,'support arm returns');}
  let owned=[];root.traverse(m=>{if(m.geometry?.userData.weaponOwned)owned.push(m.geometry)});let disposed=0;for(const g of owned)g.addEventListener('dispose',()=>disposed++);disposeToolModel(root);assert.equal(disposed,owned.length,'owned buffers disposed');inspected++;
 }
 const world=new T.Group();createToolWorld(world,gun);let draws=0;world.traverseVisible(m=>{if(m.isMesh)draws++});assert.ok(draws<=14,'world draw budget');disposeToolModel(world);
}
const game=createGameHarness(81);game.setup();game.run(`{
 mode='play';respawnTime=0;worldMeshes=[];settings.motion=0;owned=[0,1,2,3,4,5];const expected=[[24,30,.13,1.35],[83,7,.53,1.6],[13,42,.055,1.05],[155,4,1.35,2],[150,5,.85,1.8],[12,8,.83,1.7]];
 for(const gun of [0,2,3,4,5]){equipped=gun;builds=normalizeBuilds();buildWeapon();const h=weaponGroup.userData.heroTool;assert.ok(h);assert.equal(playerWeapon().damage,expected[gun][0]);assert.equal(playerWeapon().mag,expected[gun][1]);assert.equal(playerWeapon().interval,expected[gun][2]);assert.equal(playerWeapon().reload,expected[gun][3]);assert.equal(flash.position.z,h.muzzleZ);assert.equal(flash.position.x,h.muzzleX||0);assert.equal(flash.position.y,h.muzzleY);health=35;tintPlayerArms();let skins=[];weaponGroup.traverse(m=>{if(m.userData.healthSkin)skins.push(m)});assert.ok(skins.length>=4);assert.ok(skins.every(m=>m.material.color.getHex()===healthColors[7]));
  ammo=playerWeapon().mag;reloading=0;weaponMotion.reset();aimSpring.reset();keys.clear();keys.add('MouseRight');nearWall=0;for(let i=0;i<120;i++)present(1/60);weaponGroup.updateMatrixWorld(true);const aimPoint=new THREE.Vector3(h.sightX,h.sightY,-.4).applyMatrix4(weaponGroup.matrixWorld).project(camera);assert.ok(Math.abs(aimPoint.x)<1e-4&&Math.abs(aimPoint.y)<1e-4,'actual sight axis '+gun);keys.clear();
 }
}`);
console.log('Arsenal: '+inspected+' base/individual/mixed builds; finite reload poses, open optic axes, returning hand/arm rigs, bounded hero/world draws, owned-buffer disposal, health colors and actual ADS/muzzle alignment pass.');
