// One action clock for player and bots. Events preserve their scheduled time;
// only their live origin/aim is supplied by the actor at discharge.
export class ModularFire{
 constructor(){this.reset({mag:24,charge:0},1);}
 reset(w,lifeId=1){this.clock=0;this.ammo=w.mag;this.nextAction=0;this.reloadUntil=0;this.reloadStart=0;this.capacity=w.mag;this.pending=[];this.capacitor=1;this.capRecovery=0;this.capPreparation=w.charge||0;this.spool=0;this.idle=0;this.lastDown=false;this.actionId=0;this.lifeId=lifeId;}
 get reloading(){return this.reloadUntil>this.clock?Math.max(0,this.reloadUntil-this.clock):0;}
 manualReload(w){if(this.reloadUntil>this.clock||this.ammo>=w.mag)return false;this.pending=this.pending.filter(e=>e.kind!=='ejection');this.reloadStart=this.clock;this.reloadUntil=this.clock+w.reload;return true;}
 returnAmmo(amount,w){this.ammo=Math.min(w.mag,this.ammo+Math.max(0,Math.floor(amount)));if(this.ammo>=w.volley)this.reloadUntil=0;}
 schedulePacket(w,time,budget,ejection,secondary=false,weight=1){const split=w.ammoType==='duplex'?2:1;for(let k=0;k<split;k++)this.pending.push({kind:'packet',time:time+k*w.tandem,w,budget:budget/split,ejection,secondary,weight,lifeId:this.lifeId});}
 begin(w,time){const id=++this.actionId;this.nextAction=time+w.cycle;if(w.charge){this.capacitor=0;this.capRecovery=time+w.recovery;this.capPreparation=0;}
  for(let i=0;i<w.burst;i++)this.pending.push({kind:'ejection',time:time+i*w.burstGap,w,actionId:id,index:i});
 }
 tick(dt,getStats,{down=false,cone=false,blocked=false,alive=true}={}){
  const before=this.clock;this.clock+=Math.max(0,dt);let w=typeof getStats==='function'?getStats(this.spool):getStats;this.capacity=w.mag;
  if(!alive){this.pending=[];this.lastDown=false;return[];}
  if(this.reloadUntil&&this.clock>=this.reloadUntil){this.ammo=w.mag;this.reloadUntil=0;}
  if(!this.reloading){if(down||cone){this.idle=0;this.spool=Math.min(1,this.spool+dt/Math.max(.01,w.spinUp));}else{this.idle+=dt;if(this.idle>.25)this.spool=Math.max(0,this.spool-dt/.5);}}
  if(w.charge&&this.capacitor<1&&this.clock>this.capRecovery){if(!this.capPreparation){w=typeof getStats==='function'?getStats(this.spool):getStats;this.capPreparation=w.charge;}this.capacitor=Math.min(1,this.capacitor+(this.clock-Math.max(before,this.capRecovery))/Math.max(.001,this.capPreparation));}
  w=typeof getStats==='function'?getStats(this.spool):getStats;
  if(!blocked&&!this.reloading&&down&&this.ammo>=w.volley&&this.clock+1e-8>=this.nextAction&&(!w.charge||this.capacitor>=1-1e-8))this.begin(w,this.lastDown?Math.max(before,this.nextAction):this.clock);
  this.lastDown=down;const emitted=[];
  for(let guard=0;guard<256;guard++){
   this.pending.sort((a,b)=>a.time-b.time);const event=this.pending[0];if(!event||event.time>this.clock+1e-8)break;this.pending.shift();
   if(event.kind==='packet'){emitted.push(event);continue;}
   const s=event.w;if(this.ammo<s.volley){this.pending=this.pending.filter(e=>e.kind!=='ejection');continue;}
   this.ammo-=s.volley;
   const ejection={id:`${this.lifeId}:${event.actionId}:${event.index}`,hits:new Map(),direct:new Map(),arcDone:false,w:s,lifeId:this.lifeId};
   for(let j=0;j<s.volley;j++)this.schedulePacket(s,event.time+j*s.pairDelay,s.damageBudget/s.volley,ejection);
   if(s.bonus.echo){const G=s.burst>1?s.burstGap:s.cycle,W=Math.min(.12,.30*G);for(let i=0;i<4;i++){const count=Math.floor((s.bonus.echo+3-i)/4);if(count>0)this.schedulePacket(s,event.time+W*(i+1)/4,s.baseDamage*s.bonus.echoScale*count,ejection,true,count);}}
  }
  if(this.ammo<w.volley&&!this.reloadUntil&&!this.pending.some(e=>e.kind==='ejection')){const last=Math.max(this.clock,...this.pending.filter(e=>e.kind==='packet').map(e=>e.time));this.reloadStart=last;this.reloadUntil=last+w.reload;}
  return emitted;
 }
}
