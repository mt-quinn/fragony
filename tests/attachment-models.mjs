import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createToolWeapon,createToolWorld,animateToolWeapon,disposeToolModel} from '../dist/tool-weapons.js';
import {createNailer,createNailerWorld,animateNailer} from '../dist/nailer.js';
import {applyAttachmentModels,animateAttachmentModels,modelAttachments,disposeAttachmentModels} from '../dist/attachment-models.js';
import {WEAPON_SLOTS} from '../dist/loadout.js';
let builds=0,maxDraws=0,maxVerts=0,twins=0;
for(let gun=0;gun<6;gun++){
 const groups=['action','ammunition','feed'].map(slot=>WEAPON_SLOTS[gun][slot]),handling=WEAPON_SLOTS[gun].handling;
 const choices=[...groups,handling],kits=[...choices.flat().map(a=>[a])];for(let omitted=0;omitted<4;omitted++){const slots=choices.filter((_,i)=>i!==omitted);for(const a of slots[0])for(const b of slots[1])for(const c of slots[2])kits.push([a,b,c]);}
 for(const kit of kits){
  const parent=new THREE.Group(),options={attachments:modelAttachments(gun,kit)},h=gun===1?createNailer(parent,options):createToolWeapon(parent,gun,options),state=applyAttachmentModels(h,gun,kit);
  assert.equal(applyAttachmentModels(h,gun,kit),state,'idempotent when kit is unchanged');assert.ok(state.muzzleOffsets.length>=1&&state.muzzleOffsets.length<=2);const action=kit.find(a=>a.slot==='action');if(action?.config.volley===2)assert.equal(state.muzzleOffsets.length,2,'paired action has two physical muzzles '+gun+'/'+kit.map(a=>a.name));if(action?.config.charge)assert.ok(state.lamps.some(l=>l.kind==='charge'),'charged action has animated indicators');assert.ok(state.root.children.length>0||state.feedRoot,'every purchased part has visible hardware');
  if(state.muzzleOffsets.length===2){twins++;assert.ok(state.muzzleOffsets[0].distanceTo(state.muzzleOffsets[1])>.06,'paired shots have distinct physical muzzle locations')}
  for(const reload of [0,.17,.35,.50,.75,.90,1]){
   const pose={reloading:reload<1,reload,shotAge:reload/4,ammo:Math.floor(reload*12),charge:reload,heat:reload,time:reload*3,anchor:reload};
   if(gun===1)animateNailer(h,pose);else animateToolWeapon(h,pose);animateAttachmentModels(state,pose);parent.updateMatrixWorld(true);parent.traverse(m=>{assert.ok(m.matrixWorld.elements.every(Number.isFinite),gun+'/'+kit.map(a=>a.name));if(m.geometry){for(const field of ['position','normal'])assert.ok(m.geometry.attributes[field].array.every(Number.isFinite),'finite geometry');assert.ok(m.scale.toArray().every(n=>n>0),'positive mesh dimensions')}});let poseDraws=0,poseVerts=0;parent.traverseVisible(m=>{if(m.isMesh){poseDraws++;poseVerts+=m.geometry.attributes.position.count}});maxDraws=Math.max(maxDraws,poseDraws);maxVerts=Math.max(maxVerts,poseVerts);assert.ok(poseDraws<85&&poseVerts<105000,'bounded animated detail');
  }
  animateAttachmentModels(state,{shotAge:10,ammo:12});
  let draws=0,verts=0;parent.traverseVisible(m=>{if(m.isMesh){draws++;verts+=m.geometry.attributes.position.count}});maxDraws=Math.max(draws,maxDraws);maxVerts=Math.max(verts,maxVerts);assert.ok(draws<85,'bounded hero draws '+gun+'/'+kit.map(a=>a.name)+' '+draws);assert.ok(verts<105000,'bounded vertices '+verts);
  // All conversion components remain outside the optic / iron sight's aim channel.
  parent.position.set(-(h.sightX||0)*.85,-h.sightY*.85,-.5);parent.scale.setScalar(.85);parent.updateMatrixWorld(true);const meshes=[];for(const root of state.roots)root.traverseVisible(m=>{if(m.isMesh)meshes.push(m)});const hits=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1),.01,3).intersectObjects(meshes,false);assert.equal(hits.length,0,'clear sight channel '+gun+'/'+kit.map(a=>a.name));
  const owned=new Set();for(const root of state.roots)root.traverse(m=>{if(m.geometry?.userData.weaponOwned)owned.add(m.geometry)});let disposed=0;for(const geo of owned)geo.addEventListener('dispose',()=>disposed++);disposeAttachmentModels(state);assert.equal(disposed,owned.size,'conversion-owned buffers disposed');assert.ok(state.roots.every(n=>!n.parent));disposeToolModel(parent);builds++;
 }
 const worldParent=new THREE.Group(),world=gun===1?createNailerWorld(worldParent):createToolWorld(worldParent,gun),kit=groups.map((list,i)=>list[i]),state=applyAttachmentModels(world,gun,kit,{world:true});animateAttachmentModels(state,{shotAge:.03,charge:.6,ammo:3,time:1});worldParent.updateMatrixWorld(true);worldParent.traverse(m=>assert.ok(m.matrixWorld.elements.every(Number.isFinite)));disposeAttachmentModels(state);disposeToolModel(worldParent);
}
console.log(`Attachment models: ${builds} individual/mixed hero builds, ${twins} paired configurations, six lower-detail world kits; clear sights, finite animated transforms, idempotent application and owned-buffer disposal pass. Max hero ${maxDraws} draws / ${maxVerts} vertices.`);
