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
 const w=l.w+.8,d=l.d+.8;for(let ix=0;ix<=12;ix++)for(let iz=0;iz<=12;iz++){
  const x=l.x+(ix/12-.5)*(w-.04),z=l.z+(iz/12-.5)*(d-.04);ray.set(new THREE.Vector3(x,l.low+1,z),new THREE.Vector3(0,-1,0));ray.far=2;const hits=ray.intersectObject(cap,false);assert.ok(hits.length&&Math.abs(hits[0].point.y-l.low)<.002,l.id+' complete visible seal at '+[x,z]);rays++;
 }
 let checked=0;for(let ix=0;ix<=6;ix++)for(let iz=0;iz<=6;iz++){
  const x=l.x+(ix/6-.5)*(w-.9),z=l.z+(iz/6-.5)*(d-.9);let body={x,z,feet:l.low+1,height:1.9,radius:.4};if(!canOccupy(blocks,body))continue;let vy=0;for(let frame=0;frame<240&&!body.grounded;frame++){vy-=23/120;body=moveCharacter(blocks,body,{x:0,z:0,y:vy/120},{bounds:RESERVOIR.bounds,stepHeight:RESERVOIR.stepHeight});assert.ok(body.feet>=l.low-.002,l.id+' no fall through the pit bottom');}assert.ok(body.grounded&&body.feet>=l.low-.002,l.id+' supported landing');checked++;falls++;
 }assert.ok(checked>=16,l.id+' actual empty-pit fall coverage');
}
console.log(`Reservoir exposed pits: ${rays} floor rays and ${falls} native falls pass across all four shafts with platforms raised.`);
