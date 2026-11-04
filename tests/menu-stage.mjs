import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {MenuStage,MENU_STAGE} from '../dist/menu-stage.js';
import {createGameHarness} from './harness.mjs';
const h=createGameHarness();h.setup();await h.run(`(async()=>{await MAPS.find(m=>m.id===MENU_STAGE.mapId).load();changeArena(MENU_STAGE.mapId);previewRig=createDummy();previewDummy=previewRig.group;menuStage=new MenuStage(scene,previewRig,createDummy('smg'));})()`);
const stage=h.run('menuStage'),camera=h.run('camera'),scene=h.run('scene');
assert.equal(stage.rig.group.userData.pixelForgeClean,true);
assert.equal(stage.rival.group.userData.pixelForgeClean,true);
assert.equal(stage.group.parent,scene);assert.equal(stage.rig.group.parent,stage.group);
for(const rig of [stage.rig,stage.rival]){
 scene.updateMatrixWorld(true);const position=rig.group.getWorldPosition(new THREE.Vector3());h.context.testPosition=position;
 const floor=h.run('floorAt(testPosition.x,testPosition.z,testPosition.y+.4)');assert.ok(Math.abs(position.y-floor)<.04,'both actors stand on actual Shoot House collision');
 const bounds=new THREE.Box3().setFromObject(rig.group);assert.ok(bounds.min.y>floor-.05&&bounds.min.y<floor+.05,'feet/hand contact the floor');
}
const originalPose=stage.rig.parts.head.position.clone(),objects=stage.group.children.length;
for(const [width,height]of [[1280,720],[844,390],[932,430],[667,320],[320,640]]){
 stage.present(camera,width,height,1/60);scene.updateMatrixWorld(true);
 const head=rig=>rig.parts.head.getWorldPosition(new THREE.Vector3()).project(camera),right=head(stage.rig),left=head(stage.rival);
 assert.ok(right.x>.25&&right.x<.95,'sliding opponent stays to the right');assert.ok(left.x>-.95&&left.x<-.25,'close opponent stays left');assert.ok(left.y<.40&&left.y>-.5,'left head stays below the logo');
 for(const rig of [stage.rig,stage.rival])for(const part of ['head','torso','pelvis']){
  const target=rig.parts[part].getWorldPosition(new THREE.Vector3()),distance=camera.position.distanceTo(target),ray=new THREE.Raycaster(camera.position,target.clone().sub(camera.position).normalize(),0,distance-.03);
  assert.equal(ray.intersectObjects(h.run('worldMeshes'),false).length,0,'corridor scenery does not occlude either opponent');
 }
 stage.hide(camera);assert.equal(stage.group.visible,false);assert.equal(camera.view.enabled,false,'gameplay/inspection use a centered camera');
}
stage.reducedMotion={matches:true};stage.present(camera,844,390,1,1);const still=camera.position.clone(),time=stage.time;stage.present(camera,844,390,1,1);assert.deepEqual(camera.position,still);assert.equal(stage.time,time);stage.reducedMotion=null;stage.present(camera,844,390,.1,0);const motionOff=camera.position.clone();stage.present(camera,844,390,.1,0);assert.deepEqual(camera.position,motionOff);assert.deepEqual(stage.rig.parts.head.position,originalPose);assert.equal(stage.group.children.length,objects,'rendering never allocates new scene objects');
await h.run(`(async()=>{
menuReturnMapId='rust';prepareMenuStage();assert.ok(pickups.filter(p=>p.kind!=='pad').every(p=>!p.mesh.visible));
const beforeBag=localStorage.getItem('dh-map-rotation');await beginPractice();assert.equal(MAP.id,'rust');assert.equal(localStorage.getItem('dh-map-rotation'),beforeBag);await mainMenu();assert.equal(MAP.id,MENU_STAGE.mapId);assert.equal(menuReturnMapId,'rust');
showShop(true);inspectWeapon();assert.equal(camera.view.enabled,false);closeInspection();await mainMenu();assert.equal(menuReturnMapId,'rust');await beginPractice();assert.equal(MAP.id,'rust');
changeArena('reservoir');await mainMenu();assert.equal(menuReturnMapId,'reservoir');await beginPractice();assert.equal(MAP.id,'reservoir');await mainMenu();assert.ok(bots.every(b=>!b.group.visible));
practiceMode=false;await startRandomMatch();const activeMap=MAP.id,bag=localStorage.getItem('dh-map-rotation'),saved=localStorage.getItem('dh-run');await mainMenu();assert.equal(MAP.id,MENU_STAGE.mapId);assert.equal(localStorage.getItem('dh-run'),saved);assert.equal(localStorage.getItem('dh-map-rotation'),bag);await $('continue').onclick();assert.equal(MAP.id,activeMap);assert.equal(camera.view.enabled,false);assert.equal(menuStage.group.visible,false);assert.ok(pickups.every(p=>p.mesh.visible));
})()`,{timeout:180000});
console.log('Menu: grounded Shoot House duel, unobstructed framing at five sizes, reduced motion, stable scene objects, centered gameplay/inspection, practice map memory and saved campaign/rotation preserved.');
