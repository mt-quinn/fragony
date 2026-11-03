import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
const h=createGameHarness(742,{legacyFixtures:false});h.setup();
for(const id of ['killhouse','vacant','showdown','firingrange','hijacked','summit','shoothouse']){
 await h.run(`(async()=>{await beginPractice('${id}');practiceMode=false;startMatch(false);mode='play';locked=true;time=30;health=100000;respawnTime=0;playerPos.set(MAP.spawns[0][0],MAP.spawns[0][1]+1.7,MAP.spawns[0][2]);viewHeight=1.7;vy=0;vel.set(0,0,0);keys.clear();mouseDown=false;
 for(let frame=0;frame<1000&&mode==='play';frame++){updateStep(1/30);assert.ok(Number.isFinite(playerPos.x)&&Number.isFinite(playerPos.y));for(const b of bots)assert.ok(Number.isFinite(b.pos.x)&&Number.isFinite(b.pos.y)&&b.pos.y>=-.1,MAP.id+' bot stays in the physical world');}
 assert.equal(mode,'results');assert.ok(opponentAI.stats.shots>0,MAP.id+' real combat');assert.ok(opponentAI.stats.pickups>0,MAP.id+' actual resources collected');console.log(MAP.id,'native match complete',opponentAI.stats.shots,'shots',opponentAI.stats.pickups,'pickups');assert.ok(bots.length>=5);
 })()`,{timeout:600000});
}
console.log('Seven imported arenas: native game loading, full short matches, finite physics and arena transitions pass.');
