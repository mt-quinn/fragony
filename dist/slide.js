import {blockSpan,nearBlocks} from './geometry.js';
export const SLIDE={entrySpeed:3,boost:.6,flatDrag:.65,uphillDrag:2.4,downhillPull:8,steering:1.05,brake:1.5,minSpeed:2.3,duration:3.4,downhillDuration:5.5,buffer:.24,airGrace:.2,cooldown:.65};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class CrouchSlide{
 constructor(){this.reset();}
 reset(){this.active=false;this.age=0;this.cooldown=0;this.buffer=0;this.lastCrouch=false;this.air=0;this.startSpeed=0;}
 stop(){if(this.active)this.cooldown=SLIDE.cooldown;this.active=false;this.age=0;this.air=0;this.buffer=0;}
 start(vx,vz){const speed=Math.hypot(vx,vz);if(this.cooldown>0||speed<SLIDE.entrySpeed)return false;this.active=true;this.age=this.air=0;this.startSpeed=speed;return true;}
 step(dt,{vx,vz,wishX=0,wishZ=0,crouch=false,grounded=true,swimming=false,slope=0}={}){
  this.cooldown=Math.max(0,this.cooldown-dt);if(crouch&&!this.lastCrouch)this.buffer=SLIDE.buffer;this.lastCrouch=crouch;this.buffer=Math.max(0,this.buffer-dt);
  let entered=false;if(swimming){this.stop();return{x:vx,z:vz,active:false,entered};}
  if(!this.active&&crouch&&grounded&&this.buffer>0&&this.start(vx,vz)){entered=true;const speed=Math.hypot(vx,vz),boost=Math.min(SLIDE.boost,speed*.08);vx*=1+boost/speed;vz*=1+boost/speed;this.buffer=0;}
  if(!this.active)return{x:vx,z:vz,active:false,entered};
  this.age+=dt;this.air=grounded?0:this.air+dt;
  const speed=Math.hypot(vx,vz),limit=slope<-.08?SLIDE.downhillDuration:SLIDE.duration;
  if(!crouch||this.age>limit||speed<SLIDE.minSpeed||this.air>SLIDE.airGrace){this.stop();return{x:vx,z:vz,active:false,entered};}
  let angle=Math.atan2(vz,vx),braking=false;
  if(Math.hypot(wishX,wishZ)>.1){const target=Math.atan2(wishZ,wishX),delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));braking=Math.abs(delta)>2;angle+=clamp(delta,-SLIDE.steering*dt,SLIDE.steering*dt);}
  const grade=grounded?clamp(slope,-.8,.8):0,drag=SLIDE.flatDrag+Math.max(0,grade)*SLIDE.uphillDrag+(braking?SLIDE.brake:0),pull=Math.max(0,-grade)*SLIDE.downhillPull;
  // External rocket/pad momentum is retained; a slide never creates that speed.
  const cap=Math.max(this.startSpeed+3.5,this.startSpeed*1.35),next=Math.max(0,Math.min(Math.max(speed,cap),speed+(pull-drag)*dt));
  return{x:Math.cos(angle)*next,z:Math.sin(angle)*next,active:true,entered};
 }
}
// Sample actual support in the direction of travel. Reject abrupt drops/walls so
// stairs remain traversable and stepping off a balcony cannot grant a speed boost.
export function slideSlope(blocks,pos,vx,vz){const speed=Math.hypot(vx,vz);if(speed<.1)return 0;const r=.32,dx=vx/speed*r,dz=vz/speed*r;
 const height=(x,z)=>{let h=0;for(const b of nearBlocks(blocks,x,z,.1)){const span=blockSpan(b,x,z);if(span&&span.top<=pos.y+.55&&span.top>h)h=span.top;}return h;};
 const ahead=height(pos.x+dx,pos.z+dz),behind=height(pos.x-dx,pos.z-dz);return Math.abs(ahead-pos.y)>.55||Math.abs(behind-pos.y)>.55?0:clamp((ahead-behind)/(r*2),-.8,.8);
}
export function botSlideChoice({skill=0,speed=0,grounded=false,swimming=false,clear=false,precision=false,recover=false,goalDistance=0,targetDistance=0,preferredRange=10,visible=false,underFire=false,corner=false,goal='rotate',spawnAge=0},random=Math.random){
 if(speed<SLIDE.entrySpeed||!grounded||swimming||!clear||precision||recover||spawnAge<1.5||goalDistance<3)return null;
 const reason=underFire&&goalDistance>5?'cross exposed ground':visible&&targetDistance>preferredRange+4?'close distance':corner?'clear corner low':!visible&&['rotate','flank','search','reposition'].includes(goal)&&goalDistance>10?'cross open route':null;
 if(!reason||random()>.13+skill*.45+(underFire?.12:0)+(corner?.08:0))return null;
 return{reason,duration:1.05+skill*.9,cooldown:7.5-skill*2+random()*2};
}
