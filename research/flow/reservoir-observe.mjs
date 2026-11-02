import fs from 'node:fs';
import {createGameHarness} from '../../tests/harness.mjs';
const trials=[];
for(const [seed,point]of [[17,[-31,32.7,0]],[81,[0,15.7,0]],[124,[0,3.7,18]]]){
 const h=createGameHarness(seed);h.setup();
 const data=h.run(`changeArena('reservoir');startMatch();playerPos.set(...${JSON.stringify(point)});const events=[],lives={},region=p=>p.z< -32?'north':p.z>32?'south':p.x< -15?'west':p.x>15?'east':p.y<13?'water':'center';const originalFire=opponentAI.world.fire;opponentAI.world.fire=(b,...args)=>{events.push({t:+opponentAI.clock.toFixed(2),event:'shot',actor:b.name,position:b.pos.toArray(),region:region(b.pos),hp:b.hp,goal:b.brain?.goal?.type,weapon:b.brain?.weaponType});return originalFire(b,...args)};
 const originalCollect=opponentAI.world.collect;opponentAI.world.collect=(b,...args)=>{const before=b.hp,ts=pickups.map(p=>p.timer);originalCollect(b,...args);if(b.hp>before)for(let i=0;i<pickups.length;i++)if(ts[i]<=0&&pickups[i].timer>0){const p=pickups[i];events.push({t:+opponentAI.clock.toFixed(2),event:'pickup',actor:b.name,hpBefore:before,hpAfter:b.hp,id:p.id,amount:p.amount,position:b.pos.toArray(),region:region(b.pos)})}};
 for(let i=0;i<2750&&mode==='play';i++){scene.updateMatrixWorld(true);updateStep(1/30);if(i%15===0)for(const b of bots)if(!b.dead){const key=b.name+':'+b.lifeId;let l=lives[key];if(!l){l=lives[key]={actor:b.name,start:opponentAI.clock,samples:[]}}l.samples.push([+opponentAI.clock.toFixed(2),...b.pos.toArray().map(x=>+x.toFixed(3)),b.hp,region(b.pos),b.brain?.goal?.type])}}
 ({events,lives,stats:opponentAI.stats});`,{timeout:180000});
 trials.push({seed,point,...data});fs.writeFileSync(new URL('./reservoir-observations.json',import.meta.url),JSON.stringify(trials));const pickups=data.events.filter(e=>e.event==='pickup');console.log('trial',seed,'shots',data.events.filter(e=>e.event==='shot').length,'collections',pickups.length,'major',pickups.filter(e=>e.amount===50),'byAmount',Object.fromEntries([5,25,50].map(n=>[n,pickups.filter(e=>e.amount===n).length])));
}
