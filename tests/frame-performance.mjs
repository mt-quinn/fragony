import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {MeshBVH,CENTER} from '../dist/vendor/three-mesh-bvh.module.js';
import {buildBrushMap} from '../dist/map-view.js';
import {sweepMeshes} from '../dist/projectile-sweep.js';
import {ActorBatches} from '../dist/actor-batches.js';
// Factory maps need acceleration even without optional authoring metadata.
const geo=new T.BoxGeometry(4,3,2),flat=geo.toNonIndexed(),p=flat.attributes.position,n=flat.attributes.normal,arena=new T.Group(),world=[];
buildBrushMap(arena,{id:'performance-fixture',brushes:[],groups:{wall:{p:Array.from(p.array),n:Array.from(n.array),c:Array(p.count*3).fill(.5)}},lights:[]},[],world);
assert(world[0].geometry.boundsTree,'ordinary brush-map construction always prepares spatial queries');
const geometry=new T.TorusKnotGeometry(2,.6,80,8),material=new T.MeshBasicMaterial({side:T.DoubleSide});
const fast=new T.Mesh(geometry,material),slow=new T.Mesh(geometry.clone(),material);fast.position.set(2,1,-3);fast.rotation.set(.3,.7,-.2);fast.scale.set(1.7,.6,1.1);fast.updateMatrixWorld(true);slow.matrixAutoUpdate=false;slow.matrixWorld.copy(fast.matrixWorld);geometry.boundsTree=new MeshBVH(geometry,{strategy:CENTER,indirect:true});
let visited=0;const cast=geometry.boundsTree.shapecast.bind(geometry.boundsTree);geometry.boundsTree.shapecast=callbacks=>cast({...callbacks,intersectsTriangle:(...args)=>{visited++;return callbacks.intersectsTriangle(...args);}});
let seed=913;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<450;i++){
 const origin=new T.Vector3(random()*16-6,random()*10-4,random()*16-11),direction=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize(),length=random()*20,radius=[.005,.04,.2,.6][i%4];
 const a=sweepMeshes(origin,direction,length,radius,[fast]),b=sweepMeshes(origin,direction,length,radius,[slow]);assert.equal(!!a,!!b,'capsule BVH pruning preserves contacts');if(a){assert(Math.abs(a.distance-b.distance)<1e-7);if(a.distance>1e-7)assert(a.point.distanceTo(b.point)<1e-6,JSON.stringify({i,a:a.distance,b:b.distance,point:a.point.distanceTo(b.point)}));}
}
assert(visited<450*geometry.index.count/3*.1,'spatial traversal avoids over90% of brute triangle checks');
// A sheared parent must also conservatively enclose the swept sphere locally.
fast.matrixWorld.multiply(new T.Matrix4().set(1,.6,.2,0,0,1,.4,0,0,0,1,0,0,0,0,1));slow.matrixWorld.copy(fast.matrixWorld);
for(let i=0;i<150;i++){
 const origin=new T.Vector3(random()*16-6,random()*10-4,random()*16-11),direction=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();
 const a=sweepMeshes(origin,direction,20,.4,[fast]),b=sweepMeshes(origin,direction,20,.4,[slow]);assert.equal(!!a,!!b);if(a)assert(Math.abs(a.distance-b.distance)<1e-7);
}
// Updating an articulated transform must update cached bounds and inverse.
fast.position.x+=20;fast.updateMatrixWorld(true);slow.matrixWorld.copy(fast.matrixWorld);const origin=new T.Vector3(22,1,8),direction=new T.Vector3(0,0,-1);assert.equal(!!sweepMeshes(origin,direction,20,.2,[fast]),!!sweepMeshes(origin,direction,20,.2,[slow]));
// Share draws across actors while preserving every world-space pose/material.
const scene=new T.Scene(),camera=new T.PerspectiveCamera(),batches=new ActorBatches(),roots=[];
for(let i=0;i<5;i++){const root=new T.Group();root.userData.pixelForgeClean=true;root.position.set(i*2,0,-4);for(let j=0;j<2;j++){const m=new T.Mesh(geo,material);m.position.y=j;root.add(m);}scene.add(root);roots.push(root);}scene.updateMatrixWorld(true);
const renderer={render(s,c){s.onBeforeRender(this,s,c);assert.equal(batches.group.children.length,1,'ten identical parts across five actors share one draw');assert.equal(batches.group.children[0].count,10);assert.equal(batches.hidden.length,10);}};batches.render(renderer,scene,camera);for(const root of roots)assert(root.children.every(m=>m.visible));batches.dispose();
console.log('Frame performance: untagged map BVHs,600 exact swept contacts under nonuniform/sheared transforms, >90% triangle rejection, moving bounds and cross-actor instancing pass.');
