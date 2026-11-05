import {damagePerCartridge,distanceDamage} from './weapon-cycle.js';
// Reservations are tied to the intended victim, including projectiles still in flight.
// They limit attack decisions, never alter the damage of a shot that has been fired.
export class AttackCoordinator{
 constructor(){this.targets=new Map();}
 state(target){if(!this.targets.has(target))this.targets.set(target,{heavy:null,quietUntil:0,lastImpact:-Infinity,ordinary:new Map()});return this.targets.get(target);}
 release(owner){for(const state of this.targets.values()){state.ordinary.delete(owner);if(state.heavy?.owner===owner&&!state.heavy.fired)state.heavy=null;}}
 request(owner,target,w,now,distance){
  const s=this.state(target);for(const [id,until]of s.ordinary)if(until<=now)s.ordinary.delete(id);
  if(s.heavy&&s.heavy.until<=now)s.heavy=null;
  const sequence=w.modular?w.damageBudget*w.burst+w.baseDamage*w.bonus.echo*w.bonus.echoScale*w.burst:damagePerCartridge(w)*distanceDamage(w,Math.min(distance,w.falloff?.close??distance))*w.volley*w.burst;
  const heavy=w.modular?sequence>=40-1e-7:sequence>=90-1e-7||sequence/Math.max(1,w.burst)>=60;
  if(heavy){
   if(s.heavy?.owner===owner&&!s.heavy.fired)return{allowed:now>=s.heavy.readyAt-(w.modular?0:w.charge||0),heavy:true,ticket:s.heavy};
   if(s.heavy||now<s.quietUntil||s.ordinary.size>0)return{allowed:false,heavy:true};
   const travel=w.modular?(w.instant?0:Math.min(distance,90)/w.velocity):['rocket','airburst','breach','skip'].includes(w.payload)?distance/(24*w.projectile):0;
   const readyAt=Math.max(now+(w.modular&&sequence*(w.headMultiplier||1)>=100?.9:.65),s.lastImpact+.85-travel),impactAt=readyAt+travel;
   s.heavy={owner,readyAt,impactAt,until:impactAt+.6,fired:false};
   return{allowed:now>=readyAt-(w.modular?0:w.charge||0),heavy:true,ticket:s.heavy};
  }
  if(s.heavy||now<s.quietUntil)return{allowed:false,heavy:false};
  if(!s.ordinary.has(owner)&&s.ordinary.size>=2)return{allowed:false,heavy:false};
  s.ordinary.set(owner,now+.25);return{allowed:true,heavy:false};
 }
 fired(owner,target,now){const s=this.state(target);if(s.heavy?.owner===owner){s.heavy.fired=true;s.lastImpact=s.heavy.impactAt;s.quietUntil=s.heavy.until;}else s.ordinary.set(owner,now+.25);}
}
