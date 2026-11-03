import {createGameHarness} from './harness.mjs';
const h=createGameHarness(117);h.setup();
h.run(`
for(const [id,point]of[['rust',[1,16.075,-8.5]],['shipment',[6,9.2625,-12]]]){
 changeArena(id);startMatch(false);mode='play';locked=true;time=90;health=100000;respawnTime=0;playerPos.set(...point);viewHeight=playerPos.y;vy=0;vel.set(0,0,0);keys.clear();mouseDown=false;
 for(let i=0;i<5500&&mode==='play';i++)updateStep(1/60);
 assert.equal(time,0,id+' round finishes');assert.equal(mode,'results');assert.ok(opponentAI.stats.shots>25,id+' bots engage');assert.ok(opponentAI.stats.pickups>0,id+' bots reach resources');assert.ok(opponentAI.stats.pads>0,id+' bots use vertical routes');assert.ok(bots.every(b=>b.pos.toArray().every(Number.isFinite)),id+' no invalid physics');console.log(id+' full native match: '+opponentAI.stats.shots+' shots, '+opponentAI.stats.pickups+' pickups, '+opponentAI.stats.pads+' pad launches.');
}
`,{timeout:240000});
