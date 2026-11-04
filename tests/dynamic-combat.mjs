import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {ArenaAI} from '../dist/ai.js';
import {receiveImpact,stepImpact,impactPose,resetImpact,IMPACT} from '../dist/impact.js';
import {healthPickup} from '../dist/pickups.js';
import {createGameHarness} from './harness.mjs';
import {animateDummy} from '../dist/characters.js';

const nodes=[];for(let x=-10;x<=10;x++)for(let z=0;z<=20;z++)nodes.push({id:nodes.length,x,y:0,z,edges:[]});
for(const n of nodes)for(const m of nodes)if(Math.abs(n.x-m.x)+Math.abs(n.z-m.z)===1)n.edges.push({node:m,action:'walk',cost:1});
const navigation={nodes,anchors:[nodes[0],nodes[220],nodes[440]],blocks:[],stepHeight:.3};
const target={id:'rival',pos:{x:0,y:0,z:14},eye:{x:0,y:1.7,z:14},hp:100,alive:true,spawnAge:10};
let fired=0;const world={actors:()=>[target],pickups:[],canSee:()=>true,move:(b,x,z)=>{b.pos.x+=x;b.pos.z+=z},physics(){},fire:()=>fired++,animate:(bot,b,dt)=>{stepImpact(bot,dt);b.previous={...bot.pos}}};
const ai=new ArenaAI({navigation,world,random:()=>.5}),bot={name:'bot',pos:new THREE.Vector3(0,0,4),group:new THREE.Group(),hp:100,loadout:['rail','smg']};
const b=ai.reset(bot,2);ai.clock=3;b.facing=0;ai.perceive(bot,b,[target]);b.reaction=0;
b.charge=.7;b.pressure=50;ai.chooseGoal(bot,b);assert.equal(b.action,'reposition');assert.ok(ai.walkClear(bot.pos,b.goal));
assert.match(b.actionReason,/pressure/,'transition records the actual cause');
const oldGoal={...b.goal};ai.clock+=.3;b.pressure=0;ai.chooseGoal(bot,b);assert.deepEqual(b.goal,oldGoal,'useful reposition survives a quiet decision tick');
const hit=receiveImpact(bot,{weapon:'pistol',damage:42,direction:{x:1,z:0}});ai.damaged(bot,{id:'rival',pos:target.pos},{...hit,damage:42});
assert.equal(b.action,'recover');assert.equal(b.charge,0,'heavy contact cancels committed shot');assert.ok(b.recover>0);
b.visible=true;b.cool=b.rest=b.reaction=0;ai.combat(bot,b,.01,[target]);assert.equal(fired,0,'cannot fire inside real recovery window');
const firstEnd=b.recover;const next=receiveImpact(bot,{weapon:'pistol',damage:42});ai.damaged(bot,null,{...next,damage:42});assert.equal(b.recover,firstEnd,'fresh hits cannot renew the same stagger');
b.reload=.1;ai.combat(bot,b,.05,[target]);assert.equal(b.reload,.05,'reload progresses during impact recovery');b.reload=0;
for(let i=0;i<40;i++)ai.update(1/120);assert.equal(b.recover,0,'finite recovery returns control');
assert.ok(ai.stats.actions.reposition>0&&ai.stats.actions.recover>0);

// Range changes can make the same opponent contest pursuit with its second gun.
target.pos.z=target.eye.z=bot.pos.z+4;b.weaponHeld=3;ai.clock+=.2;ai.perceive(bot,b,[target]);ai.chooseWeapon(bot,b);assert.equal(b.weaponType,'smg');
b.memory.get('rival').at=ai.clock-.4;b.visible=false;ai.chooseGoal(bot,b);assert.equal(b.action,'pursue');

// A fragment is a route opportunity, not a replacement for the strategic goal.
world.pickups=[healthPickup('fragment',0,0,6,5)];world.pickups[0].timer=0;bot.pos.set(0,0,4);bot.hp=95;b.visible=false;b.target=null;b.heard=null;b.detour=null;b.detourIn=0;b.recover=0;
ai.setGoal(b,'rotate',{x:0,y:0,z:15});b.path=nodes.filter(n=>n.x===0&&n.z>4&&n.z<=15).map(n=>({...n,action:'walk'}));ai.pickRouteDetour(bot,b);
assert.equal(b.detour.pickup.id,'fragment');assert.equal(b.goal.z,15);assert.equal(ai.stats.detours,1);
let collected=false;
for(let i=0;i<400;i++){ai.navigate(bot,b,1/120);if(bot.pos.distanceTo(new THREE.Vector3(0,0,6))<.65){world.pickups[0].timer=15;bot.hp=100;collected=true}if(collected&&bot.pos.z>9)break}
assert.ok(collected&&bot.pos.z>9,'physical detour rejoins the larger route');assert.equal(b.goal.z,15);

const ledgeAI=new ArenaAI({navigation:{...navigation,blocks:[{x:0,z:0,w:2,d:20,bottom:0,top:2}]},world:{...world,projectiles:()=>[{pos:{x:0,y:3,z:8},velocity:{x:0,y:0,z:-24},owner:null}]},round:12,random:()=>.1});
const onLedge={name:'ledge',pos:{x:0,y:2,z:4},hp:100},ledgeBrain=ledgeAI.reset(onLedge);ledgeBrain.facing=0;ledgeAI.clock=3;ledgeAI.noticeProjectiles(onLedge,ledgeBrain);assert.equal(ledgeBrain.dodge,null,'do not dodge off either side of a narrow supported ledge');

// Body-local response must be invariant when the entire encounter is rotated.
function response(yaw,weapon='pistol',damage=35){const c=Math.cos(yaw),s=Math.sin(yaw),actor={pos:new THREE.Vector3(),group:new THREE.Group()};actor.group.rotation.y=yaw;resetImpact(actor);receiveImpact(actor,{weapon,damage,part:'rightArm',direction:{x:s,z:c},point:{x:c*.3+s*.1,y:1.4,z:-s*.3+c*.1}});stepImpact(actor,.04);return impactPose(actor,{})}
const reference=response(0);for(const yaw of [Math.PI/2,Math.PI,Math.PI*1.5]){const pose=response(yaw);for(const k of Object.keys(reference))assert.ok(Math.abs(pose[k]-reference[k])<1e-8,'rotation-invariant '+k)}
assert.ok(response(0,'pistol').z>response(0,'smg',9).z*2,'Nailer has a distinct stronger response');
assert.notEqual(IMPACT.pistol.duration,IMPACT.smg.duration);

const h=createGameHarness(83);h.setup();
h.run(`{const bot=bots[0];spawnBot(bot);bot.hp=200;damageBot(bot,48,null,'torso',null,{impactType:'shotgun',parts:[{part:'torso',damage:24},{part:'rightArm',damage:24}]});assert.equal(bot.impacts.length,1,'grouped pellets produce one response');assert.equal(bot.hp,152);const n=bot.impacts.length;damageBot(bot,200,null,'head');damageBot(bot,20,null,'torso');assert.equal(bot.impacts.length,n,'death and corpse hits do not add living reactions');spawnBot(bot);assert.equal(bot.impacts.length,0,'respawn clears impact state');}`);

const rig=h.run('bots[0]');const brain={previous:{...rig.pos},facing:0,aim:{x:rig.pos.x,y:1.3,z:rig.pos.z+10},weapon:{reload:1.7},weaponType:'rifle',reload:0,charge:0};
for(let i=0;i<120;i++){brain.previous={...rig.pos};rig.pos.x+=4/120;animateDummy(rig,brain,1/120,()=>0)}
assert.ok(rig.group.rotation.y>.3,'pelvis leads a lateral step');assert.ok(rig.anim.twist<-.3,'upper body counterturns to keep attention');
const gunRotation=rig.weaponMount.getWorldQuaternion(new THREE.Quaternion()),forward=new THREE.Vector3(0,0,1).applyQuaternion(gunRotation);assert.ok(Math.abs(forward.x)<.03,'weapon remains aimed while hips turn');
console.log('Dynamic combat: pressure, commitment, pursuit, range switches, bounded stagger/reload continuity, useful detours, local impact symmetry, grouped pellets, respawn and independent body/weapon orientation pass.');
