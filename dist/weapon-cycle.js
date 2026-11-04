const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Input scheduling is separate from the physical shot, recoil and hit resolution.
export class FireControl{
 constructor(){this.reset()}
 reset(){this.lastDown=false;this.pending=0;this.until=0;this.charge=0;this.charging=false;this.heat=0;this.anchor=0;}
 tick(dt,w,{down=false,repeat=false,cooldown=0,blocked=false,cancelOnLoss=false,chargeOnRelease=false}={}){
  dt=clamp(dt,0,.1);const rising=down&&!this.lastDown,falling=!down&&this.lastDown;this.lastDown=down;
  if(!down)this.heat=Math.max(0,this.heat-dt/.08);
  if(blocked){const cancelled=this.charging;this.pending=0;this.charging=false;this.charge=0;return{cancelled};}
  if(this.pending){if(cancelOnLoss&&!down){this.pending=0;return{};}this.until-=dt;if(this.until<=1e-7){this.pending--;this.until+=w.burstGap;return{fire:true,continuation:true};}return{};}
  if(w.charge){
   if(!this.charging&&down&&cooldown<=1e-7&&(rising||repeat||chargeOnRelease)){this.charging=true;this.charge=0;}
   if(this.charging){
    if(!down){const fire=chargeOnRelease&&falling&&this.charge>=w.charge-1e-7;this.charging=false;this.charge=0;return fire?{fire:true,charged:true}:{cancelled:true};}
    this.charge=Math.min(w.charge,this.charge+dt);
    if(!chargeOnRelease&&this.charge>=w.charge-1e-7){this.charging=false;this.charge=0;return{fire:true,charged:true};}
   }
   return{};
  }
  if(cooldown>1e-7||!down||!(rising||repeat||w.mode==='auto'))return{};
  if(w.burst>1){this.pending=w.burst-1;this.until=w.burstGap;}
  return{fire:true};
 }
 shot(w){if(w.slamfire)this.heat=Math.min(1,this.heat+.28)}
}
export function distanceDamage(w,distance){const bonus=w.closeBonus?1+(w.closeBonus.scale-1)*(1-clamp((distance-w.closeBonus.close)/(w.closeBonus.far-w.closeBonus.close),0,1)):1;if(!w.falloff)return bonus;const f=w.falloff,t=clamp((distance-f.close)/(f.far-f.close),0,1);return (f.near+(f.farScale-f.near)*t)*bonus;}
export function damagePerCartridge(w){return w.damage*w.pellets+w.splash;}
export function reloadDuration(w,ammo,fast=true){return w.feedMode==='coupled'&&fast?w.quickReload:ammo===0&&w.emptyReload?w.emptyReload:w.reload;}
export class FeedSystem{
 constructor(){this.states={};}
 state(g,ammo=0){return this.states[g]??= {ammo,fast:true,reload:null,holster:0,passive:0};}
 reset(owned,stats,phases={}){this.states={};for(const g of owned){const s=this.state(g,stats(g).mag);s.fast=phases[g]?.fast??true;}}
 phases(){return Object.fromEntries(Object.entries(this.states).map(([g,s])=>[g,{fast:s.fast}]))}
 start(g,w,scale=1){const s=this.state(g);if(s.reload||s.ammo>=w.mag||w.feedMode==='recovery')return false;
  if(s.pausedReload){s.reload=s.pausedReload;s.pausedReload=null;if(s.reload.individual)s.reload.left=s.reload.next+Math.max(0,w.mag-s.ammo-1)*s.reload.insert;return true;}
  const total=w.feedMode==='individual'?((w.first||.35)+Math.max(0,w.mag-s.ammo-1)*(w.insert||.22))*scale:reloadDuration(w,s.ammo,s.fast)*scale;
  s.reload={left:total,total,next:(w.first||.35)*scale,insert:(w.insert||.22)*scale,individual:w.feedMode==='individual',scale};return true;
 }
 step(g,w,dt,{active=false,trigger=false,scale=1}={}){
  const s=this.state(g);s.ammo=clamp(s.ammo,0,w.mag);s.holster=active?0:s.holster+dt;
  if(w.feedMode==='recovery'){
   s.reload=null;if(trigger||s.ammo>=w.mag){s.passive=0;return s;}
   s.passive+=dt;while(s.passive>=(w.insert||.6)&&s.ammo<w.mag){s.ammo++;s.passive-=w.insert||.6;}return s;
  }
  if(!active&&w.handling==='sling'&&s.holster>=.6&&!s.reload)this.start(g,w,scale);
  if(!active&&(w.handling!=='sling'||s.holster<.6))return s;
  const r=s.reload;if(!r)return s;r.left=Math.max(0,r.left-dt);
  if(r.individual){r.next-=dt;while(r.next<=1e-7&&s.ammo<w.mag){s.ammo++;r.next+=r.insert;}}
  if(r.left<=1e-7){s.ammo=w.mag;s.reload=null;if(w.feedMode==='coupled')s.fast=!s.fast;}
  return s;
 }
 cancel(g){this.state(g).reload=null;}
}
