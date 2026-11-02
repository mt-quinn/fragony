// Small, explicit tuning surface for response, movement, and weapon identity.
export const FEEL={
  tick:1/120,jumpBuffer:.12,coyote:.085,jumpSpeed:8.5,gravity:23,
  groundAcceleration:68,groundFriction:14,airAcceleration:17,airSpeedCap:14.5,
  marker:{hit:.115,head:.145,kill:.26,headkill:.31},
  score:{kill:100,headshot:150},maxEffects:190,maxDecals:72
};
export const HANDLING=[
 {name:'rifle',stiffness:310,damping:29,kick:.78,aim:.009,rx:.065,ry:-.012,roll:.018,back:.065,lift:.01,adsY:.13,adsFov:65,reloadRoll:-.35},
 {name:'pistol',stiffness:180,damping:19,kick:1,aim:.032,rx:.3,ry:-.045,roll:-.1,back:.105,lift:.045,adsY:-.12,adsFov:66,reloadRoll:-.6},
 {name:'smg',stiffness:510,damping:36,kick:.63,aim:.004,rx:.045,ry:.018,roll:.025,back:.034,lift:.005,adsY:-.095,adsFov:68,reloadRoll:-.45},
 {name:'rail',stiffness:190,damping:23,kick:1,aim:.018,rx:.1,ry:.012,roll:-.035,back:.14,lift:.016,adsY:-.17,adsFov:35,reloadRoll:-.25},
 {name:'rocket',stiffness:155,damping:21,kick:1,aim:.02,rx:.13,ry:-.025,roll:.055,back:.17,lift:.035,adsY:-.12,adsFov:72,reloadRoll:.42},
 {name:'shotgun',stiffness:205,damping:24,kick:1,aim:.026,rx:.16,ry:-.02,roll:-.055,back:.13,lift:.025,adsY:-.11,adsFov:66,reloadRoll:-.32}
];
export class Spring{
 constructor(){this.x=0;this.v=0}
 impulse(value){this.v+=value}
 step(dt,k=250,d=25){for(let left=dt;left>1e-8;){const h=Math.min(left,1/240);this.v+=(-k*this.x-d*this.v)*h;this.x+=this.v*h;left-=h}return this.x}
 reset(){this.x=this.v=0}
}
export function accelerate(vx,vz,wx,wz,dt,grounded,speedScale=1){
 const speed=Math.hypot(wx,wz);
 if(grounded){
  if(speed<.001){const friction=Math.exp(-FEEL.groundFriction*dt);return{x:vx*friction,z:vz*friction}}
  const dx=wx-vx,dz=wz-vz,d=Math.hypot(dx,dz),step=Math.min(d,FEEL.groundAcceleration*speedScale*dt);
  return d>0?{x:vx+dx/d*step,z:vz+dz/d*step}:{x:vx,z:vz};
 }
 if(speed>.001){const x=wx/speed,z=wz/speed,add=Math.max(0,Math.min(speed-(vx*x+vz*z),FEEL.airAcceleration*speedScale*dt));vx+=x*add;vz+=z*add}
 const cap=FEEL.airSpeedCap*speedScale,total=Math.hypot(vx,vz);if(total>cap){vx*=cap/total;vz*=cap/total}return{x:vx,z:vz};
}
export class WeaponMotion{
 constructor(){this.kick=new Spring();this.land=new Spring();this.equip=0;this.ads=0;this.sprint=0;this.swayX=0;this.swayY=0;this.shotAge=10;this.trauma=0}
 fire(profile){this.kick.impulse(20*profile.kick);this.shotAge=0}
 landed(speed){this.land.impulse(Math.min(1.8,Math.abs(speed)*.1));this.trauma=Math.min(.4,this.trauma+Math.abs(speed)*.012)}
 blast(distance){this.trauma=Math.min(.8,this.trauma+Math.max(0,1-distance/15)*.5)}
 switch(){this.equip=1;this.kick.reset();this.ads=0}
 reset(){this.kick.reset();this.land.reset();this.ads=this.sprint=this.trauma=0;this.equip=0;this.shotAge=10}
 step(dt,p,{aiming=false,sprinting=false,turnX=0,turnY=0,adsSpeed=1}={}){
  this.shotAge+=dt;this.kick.step(dt,p.stiffness,p.damping);this.land.step(dt,210,24);
  const blend=1-Math.exp(-dt*15*adsSpeed);this.ads+=((aiming?1:0)-this.ads)*blend;this.sprint+=((sprinting?1:0)-this.sprint)*blend;
  this.swayX+=(Math.max(-.045,Math.min(.045,turnX)) - this.swayX)*(1-Math.exp(-dt*12));
  this.swayY+=(Math.max(-.03,Math.min(.03,turnY)) - this.swayY)*(1-Math.exp(-dt*12));
  this.equip=Math.max(0,this.equip-dt*5);this.trauma=Math.max(0,this.trauma-dt*1.8);
 }
}
export class HitFeedback{
 constructor(){this.kind='hit';this.left=0;this.duration=0;this.serial=0;this.points=0;this.label='';this.scoreLeft=0}
 resolve({damage=0,killed=false,head=false,points=0}={}){
  if(damage<=0)return false;
  const next=killed?(head?'headkill':'kill'):(head?'head':'hit');
  // A kill remains legible while subsequent bullets hit another live opponent.
  if(!(this.left>0&&this.kind.includes('kill')&&!killed)){this.kind=next;this.duration=FEEL.marker[next];this.left=this.duration;this.serial++}
  if(killed){this.points+=points;this.label=head?'HEADSHOT':'KILL';this.scoreLeft=.85}return true;
 }
 step(dt){this.left=Math.max(0,this.left-dt);this.scoreLeft=Math.max(0,this.scoreLeft-dt);if(!this.scoreLeft)this.points=0}
 reset(){this.left=0;this.scoreLeft=0;this.points=0}
}
