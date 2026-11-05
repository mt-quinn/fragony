import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {RESERVOIR} from '../dist/maps/reservoir.js';
import {buildBrushMap,dressElevators} from '../dist/map-view.js';
import {ElevatorSystem} from '../dist/elevators.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
const arena=new THREE.Group(),blocks=[],world=[];buildBrushMap(arena,RESERVOIR,blocks,world);const system=new ElevatorSystem(RESERVOIR.elevators,blocks);dressElevators(arena,system,world);
// Expose the entire bottom. A lowered platform must not conceal a missing seal.
for(const l of system.lifts){l.y=l.block.top=l.high;l.block.bottom=l.high-.28;l.mesh.position.y=l.high;}arena.updateMatrixWorld(true);
const ray=new THREE.Raycaster();let rays=0,falls=0;
for(const l of system.lifts){
 const cap=world.find(m=>m.name===l.id+'-pit-floor');assert.ok(cap,l.id+' permanent rendered floor');
 const w=l.pit?.w||l.w+.8,d=l.pit?.d||l.d+.8;for(let ix=0;ix<=12;ix++)for(let iz=0;iz<=12;iz++){
  const x=l.x+(ix/12-.5)*(w-.04),z=l.z+(iz/12-.5)*(d-.04);ray.set(new THREE.Vector3(x,l.low+1,z),new THREE.Vector3(0,-1,0));ray.far=2;const hits=ray.intersectObject(cap,false);assert.ok(hits.length&&Math.abs(hits[0].point.y-l.low)<.002,l.id+' complete visible seal at '+[x,z]);rays++;
 }
 let checked=0;for(let ix=0;ix<=6;ix++)for(let iz=0;iz<=6;iz++){
  const x=l.x+(ix/6-.5)*(w-.9),z=l.z+(iz/6-.5)*(d-.9);let body={x,z,feet:l.low+1,height:1.9,radius:.4};if(!canOccupy(blocks,body))continue;let vy=0;for(let frame=0;frame<240&&!body.grounded;frame++){vy-=23/120;body=moveCharacter(blocks,body,{x:0,z:0,y:vy/120},{bounds:RESERVOIR.bounds,stepHeight:RESERVOIR.stepHeight});assert.ok(body.feet>=l.low-.002,l.id+' no fall through the pit bottom');}assert.ok(body.grounded&&body.feet>=l.low-.002,l.id+' supported landing');checked++;falls++;
 }assert.ok(checked>=16,l.id+' actual empty-pit fall coverage');
}
console.log(`Reservoir exposed pits: ${rays} floor rays and ${falls} native falls pass across all four shafts with platforms raised.`);

// Reproduce walking off either short side of a central platform. These points
// are OUTSIDE the old platform-sized cap but inside the original shaft opening.
let edgeFalls=0;
for(const l of system.lifts.filter(l=>l.id.startsWith('center-')))for(const dt of [1/30,1/60,1/144])for(const sign of [-1,1])for(const dx of [-.65,0,.65]){
 const z=l.z+sign*2.05,x=l.x+dx;let body={x,z,feet:l.high-2,height:1.9,radius:.4},vy=-3;
 if(!canOccupy(blocks,body))continue;
 for(let i=0;i<6/dt&&!body.grounded;i++){vy-=23*dt;body=moveCharacter(blocks,body,{x:0,z:0,y:vy*dt},{bounds:RESERVOIR.bounds,stepHeight:RESERVOIR.stepHeight});assert.ok(body.feet>=l.low-.003,l.id+' catches side gap '+[dx,sign]);}
 assert.ok(body.grounded&&Math.abs(body.feet-l.low)<.003,l.id+' stable shaft-bottom landing');edgeFalls++;
}
console.log(edgeFalls+' central lift side-gap drops pass at 30/60/144Hz.');
assert.equal(edgeFalls,18,'both central shaft openings covered');
// Use the shipped player update, rather than only the collision helper.
const {createGameHarness}=await import('./harness.mjs');const game=createGameHarness(834,{legacyFixtures:false});game.setup();
game.run(`{
 bots=[];opponentAI.brains.clear();mode='play';respawnTime=0;time=90;keys.clear();
 for(const l of elevatorSystem.lifts.filter(l=>l.id.startsWith('center-'))){
  elevatorSystem.reset();l.y=l.target=l.block.top=l.high;l.block.bottom=l.high-.28;l.wait=100;
  const sign=l.id==='center-east'?1:-1;playerPos.set(l.x,l.high-2+eyeHeight,l.z+sign*2.05);vy=-3;vel.set(0,0,0);grounded=false;
  for(let i=0;i<480;i++){updateStep(1/120);assert.ok(playerPos.y-eyeHeight>=l.low-.003,'actual player stays above pit floor');}
  assert.ok(grounded);assert.ok(Math.abs(playerPos.y-eyeHeight-l.low)<.003);assert.ok(Math.abs(playerPos.z-l.z-sign*2.05)<.02,'no respawn or relocation');
 }
}`);
console.log('Actual player side-gap falls land on both central pit floors without relocation.');
// Walk off a moving-height platform into the open side of each central shaft.
for(const l of system.lifts.filter(l=>l.id.startsWith('center-'))){
 l.block.top=24;l.block.bottom=23.72;let body={x:l.x,z:l.z,feet:24,height:1.9,radius:.4,grounded:true},vy=0,leftPlatform=false;const sign=l.id==='center-east'?1:-1;
 for(let i=0;i<720;i++){const dz=sign*Math.min(4/120,Math.max(0,2.05-sign*(body.z-l.z)));vy-=23/120;body=moveCharacter(blocks,body,{x:0,z:dz,y:vy/120},{grounded:body.grounded,bounds:RESERVOIR.bounds,stepHeight:RESERVOIR.stepHeight});if(body.grounded)vy=0;if(body.feet<23)leftPlatform=true;assert.ok(body.feet>=14-.003);}
 assert.ok(leftPlatform&&body.grounded&&Math.abs(body.feet-14)<.003,l.id+' walk off platform to shaft floor');
}
console.log('Walking off both central platforms at mid-ride height lands safely on the shaft floor.');
