// Research-only policy. Current production AI remains unchanged.
import {ArenaAI,findRoute} from '../../dist/ai.js';
import {healthAfterPickup} from '../../dist/pickups.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y||0)-(b.y||0),a.z-b.z);
export function installFragmentAgent({AI=ArenaAI,route=findRoute,heal=healthAfterPickup}={}){
 const original=AI.prototype.chooseGoal;
 AI.prototype.chooseGoal=function(bot,b){
  const clear=!b.target&&!b.visible&&!(b.heard&&this.clock-b.heard.at<this.difficulty.memory),injured=bot.hp<this.tuning.navigation.retreatHealth*b.profile.caution;
  // Finish the last fragment of a chosen line rather than dropping the plan when
  // its remaining individual value falls below the ordinary pursuit threshold.
  if(clear&&!injured&&b.goal?.fragmentCircuit&&b.goal.pickup?.timer<=0&&b.goalAge<5&&dist(bot.pos,b.goal)<8)return;
  original.call(this,bot,b);
  if(!clear||injured||!['rotate','pickup'].includes(b.goal?.type)||bot.hp>=200)return;
  const available=this.world.pickups.filter(p=>p.kind==='health'&&p.amount===5&&p.timer<=0),seen=new Set(),clusters=[];
  for(const p of available){if(seen.has(p))continue;seen.add(p);const c=[p];for(let i=0;i<c.length;i++)for(const q of available)if(!seen.has(q)&&dist(c[i],q)<=2.3&&Math.abs(c[i].y-q.y)<.35&&this.world.canSee({...c[i],y:c[i].y+.7},{...q,y:q.y+.7})){seen.add(q);c.push(q)}if(c.length>=2)clusters.push(c);}
  let baseline=8;if(b.goal.type==='pickup'){const p=b.goal.pickup;if(p)baseline=(heal(bot.hp,100,p)-bot.hp)*1.25+(p.amount===50&&bot.hp<200?12:0)-dist(bot.pos,p)*1.5;}
  let choice=null,best=baseline;
  for(const c of clusters){const entry=[...c].sort((a,z)=>dist(bot.pos,a)-dist(bot.pos,z))[0];if(dist(bot.pos,entry)>22)continue;let hp=bot.hp,collection=0,last=entry;const ordered=[entry],remaining=c.filter(p=>p!==entry);while(remaining.length){remaining.sort((a,z)=>dist(last,a)-dist(last,z));const next=remaining.shift();collection+=dist(last,next);ordered.push(next);last=next;}if(collection>10)continue;for(const p of ordered)hp=heal(hp,100,p);
   const path=route(this.navigation,bot.pos,entry);if(!path.length)continue;let travel=0,prev=bot.pos;for(const p of path){travel+=dist(prev,p);if(p.action==='elevator')travel+=8;prev=p;}
   const score=(hp-bot.hp)*1.25-(travel+collection)*1.5;if(score>best){best=score;choice={entry,last,ids:ordered.map(p=>p.id),expectedGain:hp-bot.hp,travel,collection};}
  }
  if(choice)this.setGoal(b,'pickup',choice.last,{pickup:choice.last,fragmentCircuit:choice.ids,expectedGain:choice.expectedGain});
 };
 return ()=>{AI.prototype.chooseGoal=original};
}
