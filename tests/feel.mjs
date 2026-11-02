import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
import {accelerate,Spring,HitFeedback} from '../dist/feel.js';
import {resolveDamage,combineOutcomes} from '../dist/combat.js';
for(const fps of [30,60,144]){
 const {run,setup}=createGameHarness(42);setup();run(`mode='play';locked=true;bots.forEach(b=>scene.remove(b.group));bots=[];opponentAI=null;worldMeshes=[];pickups=[];playerPos.set(0,1.7,0);viewHeight=1.7;yaw=pitch=0;grounded=true;equipped=2;ammo=42;reloading=shotTimer=0;mouseDown=true;for(let i=0;i<${fps};i++)update(1/${fps});assert.equal(shotsFired,19,'SMG cadence at ${fps} FPS');assert.equal(ammo,23);assert.ok(effects.length<=FEEL.maxEffects);`);
}
const {run,setup}=createGameHarness();setup();run(`
mode='play';locked=true;worldMeshes=[];bots.forEach(b=>scene.remove(b.group));bots=[];opponentAI=null;pickups=[];
function victim(x,z,hp=100){const d=createDummy(),b={...d,name:'TEST',hp,dead:0,deaths:0,score:0,pos:new THREE.Vector3(x,0,z)};b.group.position.copy(b.pos);b.group.traverse(m=>m.userData.bot=b);scene.add(b.group);bots.push(b);return b}
playerPos.set(0,1.74,0);viewHeight=1.74;grounded=false;yaw=Math.PI/2;pitch=0;camera.rotation.set(0,0,0);equipped=3;ammo=4;shotTimer=reloading=respawnTime=0;const b=victim(-8,0);shoot();assert.ok(b.dead,'new mouse direction used before presentation');assert.equal(matchPoints,150);assert.equal(headshotKills,1);assert.equal(feedback.kind,'headkill');const serial=feedback.serial;damageBot(b,200,null,'head');assert.equal(matchPoints,150);assert.equal(feedback.serial,serial,'corpse cannot confirm');
for(let i=0;i<300;i++)burst(new THREE.Vector3(),0xd9ef45,1);assert.equal(effects.length,FEEL.maxEffects);updateEffects(2);assert.equal(effects.length,0);
spawnPlayer();keys.add('Space');lastJumpHeld=false;grounded=true;vy=0;update(1/60);assert.ok(vy>0,'jump leaves floor without input lock');
settings.motion=0;yaw=.4;pitch=.1;aimSpring.reset();syncAimCamera();assert.equal(camera.rotation.y,.4);assert.equal(camera.rotation.x,.1);
`);
let v={x:0,z:0};for(let i=0;i<60;i++)v=accelerate(v.x,v.z,7.5,0,1/60,true);assert.ok(Math.abs(v.x-7.5)<.01);for(let i=0;i<15;i++)v=accelerate(v.x,v.z,0,0,1/60,true);assert.ok(v.x<.25);v=accelerate(9,0,0,0,.1,false);assert.equal(v.x,9,'air momentum retained');
const target={hp:20};const kill=resolveDamage(target,40,{head:true});assert.equal(kill.points,150);assert.equal(resolveDamage(target,40).points,0);assert.equal(combineOutcomes([kill,{damage:0,points:150}]).points,150);
const f=new HitFeedback();f.resolve(kill);f.resolve({damage:10});assert.equal(f.kind,'headkill');f.step(1);assert.equal(f.points,0);
const spring=new Spring();spring.impulse(20);for(let i=0;i<300;i++)spring.step(1/60);assert.ok(Math.abs(spring.x)<.0001);
console.log('Feel: 30/60/144 FPS cadence, fresh aim, headshot scoring, corpse suppression, effect budgets, responsive jumping, braking, air momentum, comfort setting, and spring recovery pass.');
