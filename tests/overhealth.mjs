import assert from 'node:assert/strict';
import {healthAfterPickup,healthPickup} from '../dist/pickups.js';
import {createGameHarness} from './harness.mjs';
for(const base of [90,200])for(const armor of [1,1.2])for(const amount of [5,25,50]){
 const max=base*armor,p=healthPickup('test',0,0,0,amount),cap=max*(amount===25?1:1.5);
 assert.equal(p.overhealth,amount!==25);
 for(const hp of [0,max-1,max,max*1.5-1,max*1.5,max*1.6])assert.equal(healthAfterPickup(hp,max,p,base),hp>=cap?hp:Math.min(cap,hp+amount*base/100));
}
const h=createGameHarness(41);h.setup();h.run(`{
changeArena('reservoir');startMatch(false);mode='play';locked=true;keys.clear();mouseDown=false;
const bot=bots[0];bots=[bot];opponentAI.brains=new Map([[bot,bot.brain]]);opponentAI.world.actors=()=>[];
for(const armor of [false,true])for(const amount of [5,25,50]){
 perks={armor};health=maxHealth(BALANCE.playerHP,perks);const max=health,p=pickups.find(p=>p.amount===amount);for(const q of pickups)q.timer=100;p.timer=0;
 playerPos.set(p.x,p.y+eyeHeight,p.z);vel.set(0,0,0);vy=0;respawnTime=0;
 bot.pos.set(1000,0,1000);recordDamage(playerCredit,'test',1);updateStep(1/120);
 const expected=amount===25?max:Math.min(max*1.5,max+fromDisplay(amount,BALANCE.playerHP));assert.equal(health,expected);assert.equal(p.timer>0,amount!==25);
 if(amount!==25)assert.equal(playerCredit.damageCredit?.size||0,0);
 for(const q of pickups)q.timer=100;p.timer=0;health=max*1.5;updateStep(1/120);assert.equal(health,max*1.5);assert.equal(p.timer,0);
 bot.maxHealth=BALANCE.botHP*(armor?1.2:1);bot.hp=bot.maxHealth;bot.pos.set(p.x,p.y,p.z);p.timer=0;opponentAI.world.collect(bot,bot.brain);
 assert.equal(bot.hp,amount===25?bot.maxHealth:Math.min(bot.maxHealth*1.5,bot.maxHealth+fromDisplay(amount,BALANCE.botHP)));assert.equal(p.timer>0,amount!==25);
 bot.hp=bot.maxHealth*1.5;p.timer=0;opponentAI.world.collect(bot,bot.brain);assert.equal(bot.hp,bot.maxHealth*1.5);assert.equal(p.timer,0);
}
const major=pickups.find(p=>p.amount===50);for(const p of pickups)p.timer=100;major.timer=0;bot.maxHealth=90;bot.hp=90;bot.pos.set(major.x,major.y,major.z);const brain=opponentAI.reset(bot,0);brain.goal=null;brain.regionAge=0;brain.visible=false;brain.heard=null;opponentAI.chooseGoal(bot,brain);assert.equal(brain.goal.pickup,major,'healthy bots can deliberately pursue the major for overheal');
perks={};health=200;healPlayer(500);assert.equal(health,200,'ordinary healing stays capped');bot.maxHealth=90;bot.hp=90;healBot(bot,500);assert.equal(bot.hp,90);
}`);
console.log('Overhealth: +5/+50 reach 150% of each actor maximum, armor and normalized increments, +25 standard cap, real player/bot collection, full pickup preservation and ordinary-heal caps pass.');
