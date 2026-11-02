// Real-time feedback: independent of simulation slow motion and damage cadence.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
export const HURT={directionLife:1.25,maxDirections:3,lowHealth:.55,criticalHealth:.25};
export class HurtFeedback{
 constructor(){this.reset()}
 reset(){this.directions=[];this.flash=0;this.low=0;this.clock=0;this.beatIn=0}
 hit(damage,maxHealth,bearing=null){
  this.flash=Math.max(this.flash,clamp(.25+damage/maxHealth,0,.75));
  if(!Number.isFinite(bearing))return;
  let cue=this.directions.find(c=>Math.abs(angle(c.bearing-bearing))<.4);
  if(!cue){cue={bearing,life:0,strength:0};this.directions.push(cue)}
  cue.bearing=bearing;cue.life=HURT.directionLife;cue.strength=Math.max(cue.strength,clamp(damage/maxHealth*2,.35,1));
  if(this.directions.length>HURT.maxDirections)this.directions.splice(this.directions.indexOf(this.directions.reduce((a,b)=>a.life<b.life?a:b)),1);
 }
 step(dt,health,maxHealth,yaw,{alive=true,motion=1}={}){
  if(!alive){this.reset();return{directions:[],edge:0,flash:0,critical:false,beat:false,pulse:0}}
  const ratio=clamp(health/maxHealth),severity=clamp((HURT.lowHealth-ratio)/HURT.lowHealth),critical=ratio<=HURT.criticalHealth;
  this.clock+=dt;this.flash=Math.max(0,this.flash-dt*2.1);
  // Recovery fades quickly; damage gets a crisp but non-flashing response.
  this.low+=(severity-this.low)*(1-Math.exp(-dt*(severity>this.low?12:7)));
  this.directions=this.directions.filter(c=>(c.life-=dt)>0);
  this.beatIn-=dt;let beat=false;
  if(critical&&this.beatIn<=0){beat=true;this.beatIn=.85+ratio*1.4}
  if(!critical)this.beatIn=0;
  const pulse=critical?(1+Math.sin(this.clock*5.5))*.5:0;
  return{directions:this.directions.map(c=>({rotation:angle(yaw-c.bearing+Math.PI),opacity:Math.min(1,c.life/.5)*(.7+c.strength*.3)})),edge:clamp(this.low*(.6+pulse*.1*motion),0,.65),flash:this.flash,critical,beat,pulse};
 }
}
