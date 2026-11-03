import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
import {normalizeBuilds,previewBuild,WEAPON_SLOTS,weaponStats} from '../dist/loadout.js';
import {distanceDamage} from '../dist/weapon-cycle.js';
import {traceCartridges} from '../dist/ballistics.js';
import {autoFirePadding,nearbyAutoTarget,AUTO_AIM_PADDING} from '../dist/mobile-targeting.js';
import {AutoFire} from '../dist/mobile-core.js';
import {ArenaAI,AI_TUNING,difficultyForRound} from '../dist/ai.js';
const h=createGameHarness(22);h.setup();const bases=h.run('weapons');
const build=(g,slot,key)=>previewBuild(normalizeBuilds(),g,slot,WEAPON_SLOTS[g][slot].find(a=>a.key===key).id);
const stats=(g,slot,key)=>weaponStats(bases[g],g,build(g,slot,key));
const origin=new THREE.Vector3(0,1.3,0),forward=new THREE.Vector3(0,0,-1),body=new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.4),new THREE.MeshBasicMaterial());
body.userData.bot={name:'TARGET',hp:1000,dead:0};body.userData.part='torso';
for(const [g,slot,key]of [[0,'ammunition','duplex'],[1,'action','twin'],[2,'action','duplex'],[3,'action','split'],[5,'action','double']]){
 const w=stats(g,slot,key);
 for(const ads of [false,true])for(const distance of [10,30,60]){
  body.position.set(0,1.3,-distance);body.updateMatrixWorld(true);
  const shot=traceCartridges(w,origin,forward,[body],{ads,random:()=>.5});
  assert.ok(Math.abs(shot.hits.get(body.userData.bot)?.damage-w.damage*w.pellets*w.volley*distanceDamage(w,distance-.2))<1e-7,`${w.action} / ${w.ammunition}: both shots hit the crosshair at ${distance}m`);
 }
}
// Every blast-producing ammo uses the final actual radius; other ammo stays precise.
for(let g=0;g<6;g++)for(const part of WEAPON_SLOTS[g].ammunition){
 const w=stats(g,'ammunition',part.key),explosive=w.splash>0||['rocket','airburst','breach','skip'].includes(w.payload);
 assert.equal(autoFirePadding(w),AUTO_AIM_PADDING+(explosive?w.blast:0),part.name);
}
assert.equal(autoFirePadding(stats(4,'action','pressure')),AUTO_AIM_PADDING+4.4);
body.position.set(1.1,1.3,-10);body.updateMatrixWorld(true);
const ray=new THREE.Raycaster(origin,forward,0,90),explosive=stats(0,'ammunition','demolition');
assert.equal(nearbyAutoTarget(ray,[body],[]),null);
assert.ok(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),'blast reaches outside the direct-hit box');
body.position.x=2;body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),null,'outside blast stays outside acquisition');
body.position.set(1.5,3.4,-10);body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(ray,[body],[],autoFirePadding(explosive)),null,'diagonal box corners cannot inflate blast reach');
body.position.set(1.1,1.3,-10);body.updateMatrixWorld(true);
const cover=new THREE.Mesh(new THREE.BoxGeometry(6,6,.5),new THREE.MeshBasicMaterial());cover.position.set(0,1.3,-5);cover.updateMatrixWorld(true);
assert.equal(nearbyAutoTarget(ray,[body],[cover],autoFirePadding(explosive)),null,'blast margin does not acquire enemies through cover');
// Exercise the real mobile sensor and trigger together, not just radius arithmetic.
h.context.AutoFire=AutoFire;
h.run(`
mode='play';opponentAI=null;settings.motion=0;worldMeshes=[];blocks=[];pickups=[];bots.forEach(b=>scene.remove(b.group));bots=[];owned=[0,1,2,3,4,5];playerPos.set(0,1.3,0);viewHeight=1.3;yaw=pitch=0;respawnTime=0;
const target={name:'AUTO',lifeId:1,hp:100000,maxHealth:100000,dead:0,pos:new THREE.Vector3(1.1,0,-10),parts:{}};
const proxy=new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.4),new THREE.MeshBasicMaterial());proxy.userData.bot=target;proxy.position.set(1.1,1.3,-10);target.parts.body=proxy;scene.add(proxy);bots=[target];
mobile={active:true,enabled:true,settings:{aimAssist:false},state:{ads:false,held:new Set(),focus:false},auto:new AutoFire(),trigger(dt,target,distance,blocked,onTarget){return this.auto.step(dt,{target,blocked,onTarget,weapon:'rifle'})}};
equipped=0;builds=previewBuild(normalizeBuilds(),0,'ammunition','0-ammunition-demolition');shotTimer=reloading=0;scene.updateMatrixWorld(true);
for(let i=0;i<10;i++){mobileTargetClock=0;syncTouchInputs(1/60);}assert.equal(mouseDown,true,'blast near miss really fires, rather than only precharging');
builds=normalizeBuilds();mobile.auto.reset();for(let i=0;i<10;i++){mobileTargetClock=0;syncTouchInputs(1/60);}assert.equal(mouseDown,false,'removing blast ammo restores direct-hit requirement');
`);
// Native shooting consumes the expected cartridges and sends the same centered
// trajectories through the actual character meshes, including the rocket path.
const live=createGameHarness(13);live.setup();live.run(`
mode='play';settings.motion=0;worldMeshes=[];blocks=[];pickups=[];bots.forEach(b=>scene.remove(b.group));bots=[];opponentAI=null;owned=[0,1,2,3,4,5];respawnTime=0;playerPos.set(0,1.12,0);viewHeight=1.12;yaw=pitch=0;
const rig=createDummy(),victim={...rig,name:'CENTERED',hp:100000,maxHealth:100000,dead:0,deaths:0,score:0,pos:new THREE.Vector3(0,0,-30)};victim.group.position.copy(victim.pos);victim.group.traverse(m=>m.userData.bot=victim);scene.add(victim.group);bots=[victim];
const savedRandom=Math.random;Math.random=()=>.5;
for(const [g,slot,key] of [[0,'ammunition','duplex'],[1,'action','twin'],[2,'action','duplex'],[3,'action','split'],[5,'action','double'],[4,'action','twin']]){
 const a=WEAPON_SLOTS[g][slot].find(a=>a.key===key);builds=previewBuild(normalizeBuilds(),g,slot,a.id);equipped=g;const w=playerWeapon();ammo=w.mag;reloading=shotTimer=0;aimSpring.reset();fireControl.reset();feedSystem.reset(owned,i=>playerWeapon(i));buildWeapon();scene.updateMatrixWorld(true);const before=victim.hp,loaded=ammo,projectiles=rockets.length;assert.ok(shoot());assert.equal(ammo,loaded-w.volley);
 if(g===4){assert.equal(rockets.length,projectiles+2);for(const r of rockets.slice(-2))assert.ok(r.vel.clone().normalize().distanceTo(new THREE.Vector3(0,0,-1))<1e-6,'both rockets travel along the crosshair');}
 else assert.ok(Math.abs(before-victim.hp-w.damage*w.pellets*w.volley*distanceDamage(w,30))<1e-6,'native centered '+w.action+' / '+w.ammunition+' hits at 30m');
}
Math.random=savedRandom;
`);
for(const native of [false,true]){
 const sample=round=>{
  const shots=[],actor={id:'player',alive:true,eye:{x:0,y:1.7,z:20},pos:{x:0,y:0,z:20}},stock=weaponStats(bases[0],0,normalizeBuilds());
  const ai=new ArenaAI({round,navigation:{anchors:[],nodes:[],pads:[]},random:()=>.5,world:{canSee:()=>true,fire:(bot,point)=>shots.push({at:ai.clock,point}),...(native?{weapon:()=>({...AI_TUNING.weapons.rifle,native:stock,magazine:stock.mag})}:{})}});
  const bot={pos:{x:0,y:0,z:0},loadout:['rifle'],rival:{perks:{}}},b=ai.reset(bot,1);
  ai.clock=2;b.target='player';b.facing=0;b.visible=true;b.reaction=ai.difficulty.reaction;b.cool=0;b.memory.set('player',{eye:actor.eye,pos:actor.pos});
  for(let i=0;i<1200;i++){ai.clock+=1/120;b.biasIn-=1/120;ai.combat(bot,b,1/120,[actor]);}
  assert.ok(shots.length);return shots;
 };
 const easy=sample(1),hard=sample(31);
 assert.ok(easy[0].at-hard[0].at>.8,'opening bots hesitate substantially longer on both combat paths');
 assert.ok(Math.abs(easy[0].point.x)>Math.abs(hard[0].point.x)*20,'opening shots are much less precise');
 assert.ok(easy.length<hard.length,'opening bursts leave more breathing room');
}
for(const key of Object.keys(AI_TUNING.early))for(const round of [13,17,31,100]){
 const e=Math.pow(Math.min(1,(round-1)/AI_TUNING.progressionRounds),.65),prior=AI_TUNING.early[key]+(AI_TUNING.late[key]-AI_TUNING.early[key])*e;
 assert.ok(Math.abs(difficultyForRound(round)[key]-prior)<1e-9,'established mid/late tuning preserved');
}
console.log('Balance: centered dual projectiles at 10/30/60m, every blast ammo radius, native mobile blast firing/direct-hit restoration, cover and diagonal limits, slower/inaccurate opening bots on legacy/native paths, unchanged round13+ tuning pass.');
