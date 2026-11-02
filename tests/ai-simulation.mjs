import { createGameHarness } from './harness.mjs';
for(const round of [1,6,12])for(const seed of [17,81,209]){
 const {run,setup}=createGameHarness(seed);setup();
 run(`
 round=${round};startMatch(true);locked=true;let highFrames=0,topFrames=0,underpassFrames=0,stationary=0,maxStationary=0;const areaVisits=new Set();const previous=new Map();let checkIn=0;
 for(let i=0;i<2701&&mode==='play';i++){
  scene.updateMatrixWorld(true);update(1/30);
  highFrames+=bots.filter(b=>!b.dead&&b.pos.y>2.8).length;topFrames+=bots.filter(b=>!b.dead&&b.pos.y>7.5).length;for(const b of bots)if(!b.dead){for(const a of MAP.areas)if(Math.abs(b.pos.x-a.x)<a.w/2&&Math.abs(b.pos.z-a.z)<a.d/2)areaVisits.add(a.name);if(b.pos.y<.3&&MAP.solids.some(s=>s.style==='deck'&&inBlock(s,b.pos.x,b.pos.z,-.1)))underpassFrames++}
  if(++checkIn===30){checkIn=0;for(const b of bots){const old=previous.get(b.name);if(old&&!b.dead&&b.pos.distanceTo(old.pos)<.5&&b.brain.goal&&b.pos.distanceTo(new THREE.Vector3(b.brain.goal.x,b.brain.goal.y,b.brain.goal.z))>3){old.still++;maxStationary=Math.max(maxStationary,old.still)}else if(old)old.still=0;previous.set(b.name,{pos:b.pos.clone(),still:old?.still||0})}}
 }
 assert.equal(mode,'results');assert.equal(areaVisits.size,5,'all distinct areas should participate');assert.ok(topFrames>60,'upper control should see traffic');assert.ok(underpassFrames>60,'bots should use sheltered routes below decks');assert.ok(opponentAI.stats.pads>0,'opponents should deliberately use jump pads');assert.ok(highFrames>100,'opponents should use raised lanes');assert.ok(opponentAI.stats.pickups>0,'opponents should collect useful pickups');assert.ok(bots.reduce((n,b)=>n+b.score,0)>0,'free-for-all combat should produce kills');assert.ok(maxStationary<10,'bots should not stall on a distant goal for ten seconds');
 console.log(JSON.stringify({round,seed:${seed},kills:bots.map(b=>b.score),playerDeaths:deathCount,shots:opponentAI.stats.shots,areas:[...areaVisits],topFrames,underpassFrames,switches:opponentAI.stats.switches,weapons:opponentAI.stats.weapons,dodges:opponentAI.stats.dodges,pads:opponentAI.stats.pads,drops:opponentAI.stats.drops,pickups:opponentAI.stats.pickups,maxStall:maxStationary,goals:opponentAI.stats.goals,actions:opponentAI.stats.actions,staggers:opponentAI.stats.staggers,detours:opponentAI.stats.detours}));
 `,{timeout:180000});
}
