import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
import {BALANCE,toDisplay,fromDisplay,normalizePerks,activePerks,weaponEngagement} from '../dist/balance.js';
import {WEAPON_SLOTS,normalizeBuilds,previewBuild,weaponStats} from '../dist/loadout.js';
import {distanceDamage,FireControl} from '../dist/weapon-cycle.js';
import {traceCartridges} from '../dist/ballistics.js';
import {AttackCoordinator} from '../dist/attack-coordination.js';
import {difficultyForRound} from '../dist/ai.js';
const h=createGameHarness(191);h.setup();const bases=h.run('weapons');
const fitted=(g,parts=[])=>weaponStats(bases[g],g,parts.reduce((b,a)=>previewBuild(b,g,a.slot,a.id),normalizeBuilds()));
let count=0,max=0;
for(let g=0;g<6;g++)for(const a of [null,...WEAPON_SLOTS[g].action])for(const p of [null,...WEAPON_SLOTS[g].ammunition]){
 const w=fitted(g,[a,p].filter(Boolean));
 // Exercise the real ballistic resolver with every pellet/projectile hitting the head.
 const target={hp:10000,dead:0},proxy=new THREE.Object3D();proxy.raycast=(r,hits)=>hits.push({distance:2,point:new THREE.Vector3(0,0,-2),object:{userData:{bot:target,part:'head'}}});
 const packet=g===4?(w.damage+w.splash)*w.volley:((traceCartridges(w,new THREE.Vector3(),new THREE.Vector3(0,0,-1),[proxy],{random:()=>.5}).hits.get(target)?.damage||0)+w.splash*w.volley);
 const sequence=packet*w.burst;max=Math.max(max,sequence);assert.ok(sequence<180+1e-7,`${bases[g].name} ${a?.name} ${p?.name}: ${sequence}`);count++;
}
assert.equal(count,96);assert.ok(Math.abs(max-175.5)<1e-8);
const stock=fitted(2),frangible=fitted(2,[WEAPON_SLOTS[2].ammunition.find(a=>a.key==='frangible')]);
for(const distance of [0,8,10,14,18,24,35,60]){assert.equal(frangible.spread,stock.spread);assert.ok(frangible.damage*distanceDamage(frangible,distance)>=stock.damage*distanceDamage(stock,distance));if(distance>=18)assert.equal(distanceDamage(frangible,distance),distanceDamage(stock,distance));}
assert.ok(Math.abs(distanceDamage(frangible,8)-1.3)<1e-8);
for(const base of [90,200]){assert.equal(toDisplay(base,base),100);assert.equal(toDisplay(fromDisplay(25,base),base),25);}
assert.equal(activePerks(normalizePerks({reload:true,speed:true,armor:true,recovery:true})).length,2);
for(const round of [1,4,8,17,31,100])assert.ok(difficultyForRound(round).reaction>=.35);
assert.equal(difficultyForRound(8).reaction,.35);
assert.equal(weaponEngagement(fitted(5,[WEAPON_SLOTS[5].ammunition.find(a=>a.key==='slug')]),'shotgun').idealRange,14);
const coordinator=new AttackCoordinator(),heavy=fitted(3),ordinary=fitted(0),owner={},second={},third={};
assert.equal(coordinator.request(owner,'player',heavy,0,20).allowed,false);
assert.equal(coordinator.request(second,'player',heavy,.2,20).allowed,false);
assert.equal(coordinator.request(second,'player',ordinary,.4,20).allowed,false);
assert.equal(coordinator.request(owner,'player',heavy,.65,20).allowed,true);coordinator.fired(owner,'player',.65);
coordinator.release(owner);assert.equal(coordinator.request(second,'player',ordinary,1,20).allowed,false,'death after firing cannot erase in-flight reservation');
assert.equal(coordinator.request(second,'player',ordinary,1.26,20).allowed,true);assert.equal(coordinator.request(third,'player',ordinary,1.26,20).allowed,true);assert.equal(coordinator.request(owner,'player',ordinary,1.26,20).allowed,false);
assert.equal(coordinator.request(owner,'bot',ordinary,1.26,20).allowed,true,'coordination is per victim');
const burst=fitted(0,[WEAPON_SLOTS[0].action.find(a=>a.key==='ratchet')]),trigger=new FireControl();assert.ok(trigger.tick(.01,burst,{down:true}).fire);let continued=0;for(let i=0;i<20;i++)if(trigger.tick(.01,burst,{down:false}).fire)continued++;assert.equal(continued,2,'committed burst finishes after input release');
h.run(`{
 mode='play';perks={};spawnPlayer();assert.equal(health,200);updateHUD();assert.equal($('health').textContent,100);
 for(const bot of bots)assert.equal(bot.hp,90);
 const target=bots[0],finisher=bots[1];spawnBot(target);matchPoints=matchAssists=0;damageBot(target,45,null);damageBot(target,45,finisher);assert.equal(matchPoints,50,'half bot health earns 50 assist points');
 spawnPlayer();damagePlayer(100,finisher);assert.equal(health,100);updateHUD();assert.equal($('health').textContent,50);
 assert.equal(healthAfterPickup(health,200,{kind:'health',amount:25},200),150);healPlayer(500);assert.equal(health,200);assert.equal(playerCredit.maxHealth,200);
 spawnBot(target);target.hp=45;healBot(target,500);assert.equal(target.hp,90);assert.equal(target.maxHealth,90);
 perks={armor:true};spawnPlayer();assert.equal(health,240);updateHUD();assert.equal($('health').textContent,100);assert.ok($('health-label').textContent.includes('20 ARMOR'));
 perks={recovery:true};health=100;focus=0;streak=0;streakReady=false;const money=credits;spawnBot(target);damageBot(target,90,null,'torso',null,{streak:true});assert.equal(health,100);assert.equal(focus,0);assert.equal(streak,0);assert.equal(credits,money);
 spawnBot(target);damageBot(target,90,null);assert.equal(health,140);assert.equal(focus,8);assert.equal(streak,1);assert.equal(credits,money+10);
 // Airstrike warning and overlapping markers: one full-strength hit per actor only.
 worldMeshes=[];blocks=[];for(const b of bots){spawnBot(b);b.pos.set(0,0,0);}equipment.streak='airstrike';activateStreak();assert.equal(bots[0].hp,90);stepSpecialAttacks(.74);assert.equal(bots[0].hp,90);stepSpecialAttacks(.02);for(const b of bots)assert.equal(b.hp,45);assert.equal(streak,1);
 equipment.streak='surge';health=80;focus=10;activateStreak();assert.equal(health,160);assert.equal(focus,50);
 // Delayed barrage genuinely spaces launch times and does not refill kill rewards.
 rockets=[];equipment.streak='barrage';activateStreak();stepSpecialAttacks(.01);assert.equal(rockets.length,1);stepSpecialAttacks(.12);assert.equal(rockets.length,2);stepSpecialAttacks(.12);assert.equal(rockets.length,3);assert.ok(rockets.every(r=>r.mods.spec.streak));
}`);
console.log(`Balance v2: ${count} native payload combinations; max fixed sequence ${max.toFixed(2)} internal / ${(max/2).toFixed(2)} displayed player damage; Frangible range, health/HUD/assist/healing/armor, perks, difficulty, coordination, bursts, streak warning/overlap/recursion and delayed barrage pass.`);
// Real rival scheduling must honor the same reservations as the coordinator unit checks.
const incoming=[];const {ArenaAI}=await import('../dist/ai.js');
const victim={id:'player',alive:true,pos:{x:0,y:0,z:10},eye:{x:0,y:1.7,z:10},spawnAge:100,hp:100};
const rail=fitted(3),ai=new ArenaAI({round:8,navigation:{nodes:[],anchors:[],pads:[]},random:()=>.5,world:{weapon:()=>({native:rail,magazine:rail.mag,range:90,idealRange:25,burst:1,rest:.5}),canSee:()=>true,fire:(bot,point)=>incoming.push({at:ai.clock,bot,point})}});
const shooters=[0,1].map(i=>({name:'rail-'+i,pos:{x:0,y:0,z:0},loadout:['rail'],rival:{perks:{}}}));
for(const bot of shooters){const b=ai.reset(bot);b.target='player';b.visible=true;b.facing=0;b.cool=b.rest=b.reaction=0;b.memory.set('player',{eye:victim.eye,pos:victim.pos});}
ai.clock=2;
for(let i=0;i<600;i++){ai.clock+=1/120;for(const bot of shooters)ai.combat(bot,ai.brains.get(bot),1/120,[victim]);}
assert.ok(incoming.length>=3);assert.ok(incoming[0].at>=2.65-1e-6);
for(let i=1;i<incoming.length;i++)assert.ok(incoming[i].at-incoming[i-1].at>=.85-1e-6,'native heavy impacts do not overlap');
console.log('Native heavy-opponent scheduling: visible windup and inter-attacker separation pass.');
