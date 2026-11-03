import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import * as THREE from '../dist/vendor/three.module.js';
import {SOURCE_ARENAS} from '../dist/maps/source-arenas.js';
import {restoreNavigation,findRoute,nearestNode} from '../dist/ai.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
import {launchTime,nearBlocks,blockSpan} from '../dist/geometry.js';
import {ElevatorSystem} from '../dist/elevators.js';
import {buildBrushMap} from '../dist/map-view.js';
import {industrialDistricts} from '../dist/industrial.js';
for(const map of SOURCE_ARENAS.filter(m=>!process.argv.slice(2).length||process.argv.slice(2).includes(m.id))){
 await map.load();assert.ok(map.precompiled&&map.renderChunks.length>5,map.id+' prepared visual geometry');
 const {fingerprint}=await import('../dist/maps/'+map.id+'-nav.js');
 const digest=createHash('sha256').update(fs.readFileSync(new URL('../dist/maps/'+map.id+'-data.json.gz',import.meta.url))).update(JSON.stringify([map.elevators,map.pads,map.anchors,map.stepHeight,map.bounds,map.maxHeight,!!map.navigationGround,...(map.navigationGrid||map.navigationRefinement?[map.navigationGrid||1,map.navigationRefinement||null]:[])])).digest('hex');assert.equal(digest,fingerprint,map.id+' current source/traversal bake');
 assert.ok(industrialDistricts(map.id).length>=4,map.id+' authored area palettes');
 for(const [i,p]of [...map.spawns,...map.pickups.map(p=>[p.x,p.y,p.z])].entries()){
  let body={x:p[0],feet:p[1]+.008,z:p[2],radius:.4,height:1.9};assert.ok(canOccupy(map.brushes,body),map.id+' standing placement '+i);
  body=moveCharacter(map.brushes,body,{x:0,y:-.07,z:0},{bounds:map.bounds,stepHeight:map.stepHeight});assert.ok(body.grounded&&Math.abs(body.feet-p[1])<.08,map.id+' supported placement '+i);
 }
 const nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);
 for(const a of map.spawns)for(const b of map.spawns)assert.ok(findRoute(nav,{x:a[0],y:a[1],z:a[2]},{x:b[0],y:b[1],z:b[2]}).length,map.id+' source routes');
 for(const pad of map.pads){
  const t=launchTime(pad.power,pad.landing.y-pad.y);assert.ok(t>0);for(let j=0;j<9;j++){
   const r=j?pad.triggerRadius*.95:0,angle=j*Math.PI/4,x=pad.x+Math.cos(angle)*r,z=pad.z+Math.sin(angle)*r;
   let floor=-Infinity;for(const b of nearBlocks(map.brushes,x,z,.4,pad.y-.5,pad.y+.3)){const s=blockSpan(b,x,z,.4);if(s&&s.top<=pad.y+.3)floor=Math.max(floor,s.top);}assert.ok(Number.isFinite(floor),pad.id+' supported trigger');
   let p={x,z,feet:floor+.005,radius:.4,height:1.9},vy=pad.power,landed=false;const duration=launchTime(pad.power,pad.landing.y-p.feet);
   for(let frame=0;frame<720;frame++){vy-=23/120;p=moveCharacter(map.brushes,p,{x:(pad.landing.x-x)/duration/120,z:(pad.landing.z-z)/duration/120,y:vy/120},{grounded:false,bounds:map.bounds,stepHeight:map.stepHeight});assert.ok(!p.ceiling,pad.id+' native flight head clearance');if(p.grounded&&frame>8){assert.ok(Math.abs(p.feet-pad.landing.y)<.18&&Math.hypot(p.x-pad.landing.x,p.z-pad.landing.z)<1.2,pad.id+' native arrival '+JSON.stringify(p));landed=true;break;}}assert.ok(landed,pad.id+' native full trigger disc lands');
  }
 }
 for(const def of map.elevators)for(const dt of [1/30,1/120])for(const offset of [[0,0],[.2,0],[-.2,0],[0,.1],[0,-.1]]){
  const blocks=map.brushes.slice();blocks.triangleCollision=map.brushes.triangleCollision;const system=new ElevatorSystem([def],blocks),lift=system.lifts[0];let feet=lift.low,top=false,bottom=false;
  const actor={x:()=>lift.x+offset[0],z:()=>lift.z+offset[1],feet:()=>feet,velocityY:()=>0,height:()=>1.9,carry:dy=>feet+=dy};
  for(let t=0;t<16;t+=dt){system.step(dt,[actor]);assert.ok(canOccupy(system.staticBlocks,{x:actor.x(),z:actor.z(),feet:feet+.003,height:1.9,radius:.4}),def.id+' full native shaft clearance');if(feet>=lift.high-.01)top=true;if(top&&feet<=lift.low+.01)bottom=true;}assert.ok(top&&bottom,def.id+' actual physical roundtrip');
 }
 const arena=new THREE.Group(),world=[];buildBrushMap(arena,map,[],world);arena.updateMatrixWorld(true);assert.ok(world.length>5);
 let checked=0;for(const mesh of world.filter(m=>m.geometry.boundsTree).filter((_,i)=>i%7===0)){
  const box=new THREE.Box3().setFromObject(mesh),center=box.getCenter(new THREE.Vector3());for(const direction of [new THREE.Vector3(0,-1,0),new THREE.Vector3(-1,0,0)]){
   const origin=center.clone().addScaledVector(direction,-100),ray=new THREE.Raycaster(origin,direction,0,200),fast=ray.intersectObject(mesh,false);const custom=mesh.raycast;mesh.raycast=THREE.Mesh.prototype.raycast;const plain=ray.intersectObject(mesh,false).filter(hit=>!mesh.material.userData.alphaAt||!hit.uv||mesh.material.userData.alphaAt(hit.uv));mesh.raycast=custom;assert.equal(fast.length,plain.length,map.id+' prepared BVH matches triangle rays');if(fast.length)assert.ok(Math.abs(fast[0].distance-plain[0].distance)<1e-5);checked++;
  }
 }assert.ok(checked>0);arena.traverse(o=>o.geometry?.dispose());
 console.log(map.id+': supported starts/resources, '+map.spawns.length**2+' routes, '+map.pads.length+' full-disc native pads, '+map.elevators.length+' safe lifts, '+checked+' prepared-render ray comparisons pass.');map.unload();
}
