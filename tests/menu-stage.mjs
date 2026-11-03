import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {MenuStage,MENU_STAGE} from '../dist/menu-stage.js';
import {createGameHarness} from './harness.mjs';
const h=createGameHarness();h.setup();h.run(`changeArena(MENU_STAGE.mapId);previewRig=createDummy();previewDummy=previewRig.group;menuStage=new MenuStage(scene,previewRig);`);
const stage=h.run('menuStage'),camera=h.run('camera'),scene=h.run('scene');
assert.equal(stage.group.parent,scene);assert.equal(stage.rig.group.parent,stage.group);
assert.equal(h.run('floorAt(MENU_STAGE.position[0],MENU_STAGE.position[2],MENU_STAGE.position[1]+.1)'),MENU_STAGE.position[1]);
for(const [width,height]of [[1280,720],[1256,1358],[844,390],[932,430]]){
 stage.present(camera,width,height,1/60);scene.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(stage.rig.group),center=bounds.getCenter(new THREE.Vector3()).project(camera);
 assert.ok(center.x>.35&&center.x<.65,'character stays on the right of the text');
 for(const y of [bounds.min.y,bounds.max.y]){const point=new THREE.Vector3(MENU_STAGE.position[0],y,MENU_STAGE.position[2]).project(camera);assert.ok(Math.abs(point.y)<.95,'head and feet stay in frame');}
 for(const part of ['head','torso','pelvis']){
  const target=stage.rig.parts[part].getWorldPosition(new THREE.Vector3()),distance=camera.position.distanceTo(target),ray=new THREE.Raycaster(camera.position,target.clone().sub(camera.position).normalize(),0,distance);
  assert.equal(ray.intersectObjects(h.run('worldMeshes'),false).length,0,'map geometry does not occlude the posed character');
 }
 assert.ok(bounds.min.y>=MENU_STAGE.position[1]-.04&&bounds.min.y<MENU_STAGE.position[1]+.04,'feet touch the real gantry');
 stage.hide(camera);assert.equal(stage.group.visible,false);assert.equal(camera.view.enabled,false,'gameplay and inspection use a centered camera');
}
await h.run(`(async()=>{
menuReturnMapId='rust';prepareMenuStage();assert.ok(pickups.filter(p=>p.kind!=='pad').every(p=>!p.mesh.visible));
const beforeBag=localStorage.getItem('dh-map-rotation');beginPractice();assert.equal(MAP.id,'rust');assert.equal(localStorage.getItem('dh-map-rotation'),beforeBag);mainMenu();assert.equal(MAP.id,'reservoir');assert.equal(menuReturnMapId,'rust');
showShop(true);inspectWeapon();assert.equal(camera.view.enabled,false);closeInspection();mainMenu();assert.equal(menuReturnMapId,'rust');beginPractice();assert.equal(MAP.id,'rust');
changeArena('reservoir');mainMenu();assert.equal(menuReturnMapId,'reservoir');beginPractice();assert.equal(MAP.id,'reservoir');mainMenu();assert.ok(bots.every(b=>!b.group.visible));
practiceMode=false;await startRandomMatch();const activeMap=MAP.id,bag=localStorage.getItem('dh-map-rotation'),saved=localStorage.getItem('dh-run');mainMenu();assert.equal(MAP.id,'reservoir');assert.equal(localStorage.getItem('dh-run'),saved);assert.equal(localStorage.getItem('dh-map-rotation'),bag);await $('continue').onclick();assert.equal(MAP.id,activeMap);assert.equal(camera.view.enabled,false);assert.equal(menuStage.group.visible,false);assert.ok(pickups.every(p=>p.mesh.visible));
})()`,{timeout:180000});
console.log('Menu: grounded world pose, unobstructed framing at four sizes, hidden pickups/actors, centered gameplay/inspection, practice map memory and saved campaign/rotation preserved.');
