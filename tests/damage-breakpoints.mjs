import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
import {normalizeBuilds,previewBuild,weaponStats,WEAPON_SLOTS} from '../dist/loadout.js';
import {distanceDamage} from '../dist/weapon-cycle.js';
import {traceCartridges} from '../dist/ballistics.js';
const h=createGameHarness(92);h.setup();const bases=h.run('weapons');
const stock=g=>weaponStats(bases[g],g,normalizeBuilds());
assert.equal(stock(1).damage,45);assert.equal(Math.ceil(100/stock(1).damage),3);
assert.equal(stock(3).damage,80);assert.equal(stock(3).damage*1.5,120);
let combinations=0;
for(let g=0;g<6;g++)for(const action of [null,...WEAPON_SLOTS[g].action])for(const ammo of [null,...WEAPON_SLOTS[g].ammunition]){
 let b=normalizeBuilds();for(const part of [action,ammo])if(part)b=previewBuild(b,g,part.slot,part.id);
 const w=weaponStats(bases[g],g,b),direct=w.damage*w.pellets*w.volley,splash=w.splash*w.volley;
 const name=bases[g].name+' '+w.action+' '+w.ammunition;
 if(g===4)assert.ok(direct+splash<100,name+' rocket contact must be survivable');
 else if(g===3)assert.ok(direct+splash<100,name+' rail body must be survivable');
 else if(g!==5)assert.ok(direct*1.5+splash<100,name+' even perfect head packets must be survivable');
 else assert.ok(direct*distanceDamage(w,5)+splash<100,name+' shotgun body beyond point blank');
 combinations++;
}
// Real grouped pellet packets: at 8 m, ten head pellets (and two misses) kill;
// twelve torso pellets cannot. At 20 m even all head pellets cannot kill.
const origin=new THREE.Vector3(),forward=new THREE.Vector3(0,0,-1),w=stock(5);
function shot(distance,parts){
 const target={hp:100,dead:0};let i=0;
 const proxy=new THREE.Object3D();proxy.raycast=(ray,hits)=>{const part=parts[i++];if(part)hits.push({distance,point:new THREE.Vector3(0,0,-distance),object:{userData:{bot:target,part}}});};
 return traceCartridges(w,origin,forward,[proxy],{random:()=>.5}).hits.get(target)?.damage||0;
}
assert.ok(shot(2,Array(12).fill('torso'))>=100);
assert.ok(shot(5,Array(12).fill('torso'))<100);
assert.ok(shot(8,Array(10).fill('head'))>=100);
assert.ok(shot(8,Array(9).fill('head'))<100);
assert.ok(shot(20,Array(12).fill('head'))<100);
// Native incoming path uses the same stock breakpoints and records exact damage.
h.run(`{
 mode='play';blocks=[];worldMeshes=[];respawnTime=0;playerSpawnAt=-10;opponentAI.clock=20;perks={};playerPos.set(0,1.7,10);yaw=0;
 for(const b of bots){b.dead=100;b.group.visible=false;}const b=bots[0];b.dead=0;b.pos.set(0,0,0);b.rival.owned=[1,3];b.rival.builds=normalizeBuilds();
 for(const [g,y,damage]of [[1,1.1,45],[3,1.1,80],[3,1.65,120]]){
 health=200;playerHistory.clear();const w={...weaponStats(weapons[g],g,normalizeBuilds()),type:ALL_WEAPONS[g],rounds:1,spread:0};
 fireRivalWeapon(b,{x:0,y,z:10},w);assert.equal(200-health,damage);
 }
}`);
console.log('Damage breakpoints: '+combinations+' action/ammo combinations, real shotgun packets and native incoming Nailer/Lancer pass.');
