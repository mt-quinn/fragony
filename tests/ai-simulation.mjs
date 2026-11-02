import { createGameHarness } from './harness.mjs';
for(const round of [1,6,12])for(const seed of [17,81,209]){
 const {run,setup}=createGameHarness(seed);setup();
 run(`
 round=${round};startMatch(true);locked=true;let highFrames=0,stationary=0,maxStationary=0;const previous=new Map();let checkIn=0;
 for(let i=0;i<2701&&mode==='play';i++){
  scene.updateMatrixWorld(true);update(1/30);
  highFrames+=bots.filter(b=>!b.dead&&b.pos.y>2.8).length;
  if(++checkIn===30){checkIn=0;for(const b of bots){const old=previous.get(b.name);if(old&&!b.dead&&b.pos.distanceTo(old.pos)<.5&&b.brain.goal&&b.pos.distanceTo(new THREE.Vector3(b.brain.goal.x,b.brain.goal.y,b.brain.goal.z))>3){old.still++;maxStationary=Math.max(maxStationary,old.still)}else if(old)old.still=0;previous.set(b.name,{pos:b.pos.clone(),still:old?.still||0})}}
 }
 assert.equal(mode,'results');assert.ok(opponentAI.stats.pads>0,'opponents should deliberately use jump pads');assert.ok(highFrames>100,'opponents should use raised lanes');assert.ok(opponentAI.stats.pickups>0,'opponents should collect useful pickups');assert.ok(bots.reduce((n,b)=>n+b.score,0)>0,'free-for-all combat should produce kills');assert.ok(maxStationary<10,'bots should not stall on a distant goal for ten seconds');
 console.log(JSON.stringify({round,seed:${seed},kills:bots.map(b=>b.score),playerDeaths:deathCount,shots:opponentAI.stats.shots,switches:opponentAI.stats.switches,weapons:opponentAI.stats.weapons,dodges:opponentAI.stats.dodges,pads:opponentAI.stats.pads,drops:opponentAI.stats.drops,pickups:opponentAI.stats.pickups,maxStall:maxStationary,goals:opponentAI.stats.goals}));
 `);
}
