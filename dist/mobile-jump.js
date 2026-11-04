// Sustain an obstructed movement intent before requesting one full normal jump.
// World-space intent, collision normals and actual progress prevent accidental hops.
export const AUTO_JUMP={delay:.14,directionCosine:.9,minIntentSpeed:1.5,maxProgress:.35,grace:.035,cooldown:.3,hold:.5};
export class MobileAutoJump{
 constructor(){this.reset();}
 reset(){this.age=0;this.gap=0;this.x=0;this.z=0;this.cooldown=0;this.hold=0;}
 step(dt,{enabled=false,grounded=false,swimming=false,ceiling=false,launched=false,wishX=0,wishZ=0,movedX=0,movedZ=0,normals=[]}={}){
  if(!Number.isFinite(dt)||dt<=0||dt>.05){this.reset();return false;}
  this.cooldown=Math.max(0,this.cooldown-dt);this.hold=Math.max(0,this.hold-dt);
  if(!enabled){this.reset();return false;}
  const speed=Math.hypot(wishX,wishZ);
  if((!grounded&&!swimming)||ceiling||launched||speed<AUTO_JUMP.minIntentSpeed){this.age=this.gap=0;return false;}
  const x=wishX/speed,z=wishZ/speed;
  if(this.age&&this.x*x+this.z*z<AUTO_JUMP.directionCosine)this.age=this.gap=0;
  const colliding=normals.some(n=>n.x*x+n.z*z<-.25),progress=(movedX*x+movedZ*z)/(speed*dt);
  if(!colliding||progress>AUTO_JUMP.maxProgress){this.gap+=dt;if(this.gap>AUTO_JUMP.grace)this.age=0;return false;}
  this.gap=0;if(!this.age){this.x=x;this.z=z;}
  if(this.cooldown||this.hold>0)return false;
  this.age+=dt;if(this.age+1e-9<AUTO_JUMP.delay)return false;
  this.age=0;this.cooldown=AUTO_JUMP.cooldown;this.hold=AUTO_JUMP.hold;return true;
 }
}
