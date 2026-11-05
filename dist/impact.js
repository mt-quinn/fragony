// Resolved shots, including grouped pellets, produce one physical response.
// Visual recoil and the short gameplay interruption are deliberately separate.
export const IMPACT = {
 melee:{duration:.2,strength:.35,heavy:45},
 pistol:{duration:.18,strength:.30,heavy:28}, rifle:{duration:.12,strength:.13,heavy:65},
 smg:{duration:.095,strength:.085,heavy:85}, shotgun:{duration:.25,strength:.40,heavy:30},
 rail:{duration:.19,strength:.32,heavy:40}, rocket:{duration:.28,strength:.44,heavy:32},
 cooldown:.85, recovery:.23, accumulation:.18
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function resetImpact(bot){bot.impacts=[];bot.impactLoad=0;bot.impactCooldown=0;bot.hitReact=null}
export function receiveImpact(bot,{weapon='rifle',damage=0,part='torso',direction={x:0,z:1},point=null}={}){
 const profile=IMPACT[weapon]||IMPACT.rifle,scale=clamp(Math.sqrt(Math.max(0,damage)/35),.35,1.2);
 bot.impacts??=[];bot.impactLoad=Math.min(100,(bot.impactLoad||0)+damage*(weapon==='smg'?.45:weapon==='rifle'?.65:1));
 const stagger=(bot.impactCooldown||0)<=0&&bot.impactLoad>=profile.heavy;
 if(stagger){bot.impactCooldown=IMPACT.cooldown;bot.impactLoad=0}
 // Keep the dominant recovery intact while fresh light contact remains visible.
 if(bot.impacts.length>=4)bot.impacts.splice(bot.impacts.reduce((best,h,i,a)=>h.strength*h.left<a[best].strength*a[best].left?i:best,0),1);
 const yaw=bot.group?.rotation.y||0,c=Math.cos(yaw),s=Math.sin(yaw),px=point?point.x-bot.pos.x:0,pz=point?point.z-bot.pos.z:0;
 const contactX=clamp(c*px-s*pz,-.4,.4),contactZ=clamp(s*px+c*pz,-.3,.3);
 const hit={weapon,part,strength:profile.strength*scale,duration:profile.duration,left:profile.duration,
  direction:{x:direction.x,z:direction.z},torque:clamp(contactX*(s*direction.x+c*direction.z)-contactZ*(c*direction.x-s*direction.z),-.35,.35),stagger};
 bot.impacts.push(hit);bot.hitReact=hit;
 return {stagger,duration:stagger?IMPACT.recovery:0,strength:hit.strength};
}
export function stepImpact(bot,dt){
 bot.impactCooldown=Math.max(0,(bot.impactCooldown||0)-dt);bot.impactLoad=(bot.impactLoad||0)*Math.exp(-dt/IMPACT.accumulation);
 if(!bot.impacts)return;
 for(const hit of bot.impacts)hit.left-=dt;
 for(let i=bot.impacts.length-1;i>=0;i--)if(bot.impacts[i].left<=0)bot.impacts.splice(i,1);
 bot.hitReact=bot.impacts[bot.impacts.length-1]||null;
}
export function impactPose(bot,out){
 out.x=out.z=out.twist=out.head=out.leftArm=out.rightArm=out.leftLeg=out.rightLeg=out.balance=0;
 const yaw=bot.group.rotation.y,c=Math.cos(yaw),s=Math.sin(yaw);
 for(const h of bot.impacts||[]){
  const age=h.duration-h.left,attack=Math.min(1,age/.018),release=Math.exp(-age/(h.duration*.32)),pulse=h.strength*attack*release*1.5;
  out.x+=(c*h.direction.x-s*h.direction.z)*pulse;out.z+=(s*h.direction.x+c*h.direction.z)*pulse;out.twist+=h.torque*pulse*2;
  if(h.part in out)out[h.part]+=pulse;
  if(h.stagger)out.balance+=pulse;
 }
 for(const k of Object.keys(out))out[k]=clamp(out[k],-.48,.48);
 return out;
}
