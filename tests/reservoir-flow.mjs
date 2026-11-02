import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {FrameRenderer} from '../dist/presentation.js';
import {chooseSpawn} from '../dist/spawns.js';
import {createGameHarness} from './harness.mjs';
// A wall backface must occlude the same hidden rooms in color and AO depth.
const frame=new FrameRenderer({extensions:{has:()=>true},capabilities:{maxSamples:2},getDrawingBufferSize:v=>v.set(640,480)},new THREE.Scene(),new THREE.PerspectiveCamera());
const wall=new THREE.Mesh(new THREE.PlaneGeometry(5,5),frame.gtao.normalMaterial);wall.updateMatrixWorld(true);
assert.ok(new THREE.Raycaster(new THREE.Vector3(0,0,-2),new THREE.Vector3(0,0,1)).intersectObject(wall).length,'AO sees wall backs');frame.dispose();
const entries=[[0,0,0],[15,0,0],[40,0,0]],history=new Map();
assert.equal(chooseSpawn(entries,[{pos:{x:0,y:0,z:0}}],{random:()=>0}),entries[2],'avoid occupied spawn');
const first=chooseSpawn(entries,[],{now:0,recent:history,random:()=>0});
assert.notEqual(chooseSpawn(entries,[],{now:1,recent:history,random:()=>0}),first,'rotate recently used entry regions');
const totals={};
for(const seed of [17,81,124]){
 const h=createGameHarness(seed);h.setup();
 const result=h.run(`changeArena('reservoir');startMatch();playerPos.set(...${JSON.stringify(seed===17?[-31,32.7,0]:seed===81?[31,32.7,0]:[0,35.7,46])});const coverage={},fights={},lifePositions=new Map();
 const zone=p=>p.z < -32?'north':p.z>32?'south':p.x < -15?'west':p.x>15?'east':p.y<13?'water':'center';
 const originalFire=opponentAI.world.fire;opponentAI.world.fire=(bot,...args)=>{const z=zone(bot.pos);fights[z]=(fights[z]||0)+1;return originalFire(bot,...args)};
 for(let i=0;i<2750&&mode==='play';i++){scene.updateMatrixWorld(true);updateStep(1/30);if(i%30===0)for(const b of bots)if(!b.dead){const z=zone(b.pos);coverage[z]=(coverage[z]||0)+1;const key=b.name+':'+b.lifeId;let seen=lifePositions.get(key);if(!seen){seen=new Set();lifePositions.set(key,seen)}seen.add(z)}}
 assert.equal(mode,'results');assert.ok((coverage.center||0)+(coverage.water||0)+(coverage.east||0)+(coverage.west||0)>90,'substantial traffic outside bases');
 assert.ok(opponentAI.stats.shots>30);assert.ok([...lifePositions.values()].some(s=>s.size>=3),'bots traverse multiple regions in one life');
 ({coverage,fights,shots:opponentAI.stats.shots,actions:opponentAI.stats.actions,staggers:opponentAI.stats.staggers,detours:opponentAI.stats.detours,kills:bots.reduce((n,b)=>n+b.frags,0)});`,{timeout:180000});
 console.log('Reservoir flow',seed,JSON.stringify(result));
 for(const [z,n]of Object.entries(result.coverage))totals[z]=(totals[z]||0)+n;
 for(const z of Object.keys(result.fights))totals['fight-'+z]=(totals['fight-'+z]||0)+result.fights[z];
}
for(const z of ['north','south','west','east','center','water']){assert.ok(totals[z]>10,'traffic in '+z);assert.ok(totals['fight-'+z]>0,'combat in '+z)}
console.log('Reservoir flow: multi-seed matches traverse and fight in both bases, both galleries, center and water routes.',totals);
