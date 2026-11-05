import {gunStats,createLife} from './modular-gun.js';
import {ModularFire} from './modular-fire.js';
export function modularRivalCombat(ai,bot,b,dt,actors){
 bot.modularLife??=createLife(bot.lifeId||1);if(!bot.modularFire){bot.modularFire=new ModularFire();bot.modularFire.reset(gunStats(bot.rival.collection,bot.modularLife),bot.lifeId||1);}
 const f=bot.modularFire,getStats=motor=>gunStats(bot.rival.collection,bot.modularLife,motor),w=getStats(f.spool);b.weapon={...b.weapon,native:w,magazine:w.mag,idealRange:w.idealRange,range:90};
 b.cool=Math.max(0,f.nextAction-f.clock);b.rest=0;b.reaction=Math.max(0,b.reaction-dt);
 const memory=b.memory.get(b.target),actor=actors.find(a=>a.id===b.target),origin={x:bot.pos.x,y:bot.pos.y+1.28-(bot.anim?.crouch||0)*.45,z:bot.pos.z};let down=!!(b.visible&&memory&&actor?.alive&&b.swapIn<=0&&b.recover<=0&&b.reaction<=0&&ai.clock-b.spawnAt>=ai.tuning.fairness.spawnGrace);
 if(down){const bearing=Math.atan2(memory.eye.x-origin.x,memory.eye.z-origin.z);down=Math.abs(Math.atan2(Math.sin(bearing-b.facing),Math.cos(bearing-b.facing)))<.25&&ai.world.canSee(origin,actor.eye);}
 if(b.attackTarget!==b.target){ai.attacks.release(bot);b.heavyTicket=null;b.attackTarget=b.target;}
 const committed=f.pending.length>0,distance=memory?Math.hypot(memory.eye.x-origin.x,memory.eye.y-origin.y,memory.eye.z-origin.z):Infinity;
 if(!down&&!committed){ai.attacks.release(bot);b.heavyTicket=null;}
 if(down&&!committed&&b.cool<=0){const reservation=ai.attacks.request(bot,b.target,w,ai.clock,distance);b.heavyTicket=reservation.ticket||null;if(reservation.heavy&&!reservation.allowed)ai.world.telegraph?.(bot,b.aim,dt);if(!reservation.allowed)down=false;}
 if(memory&&b.visible){const desired={x:memory.eye.x,y:memory.eye.y-.42,z:memory.eye.z};if(!b.aimReady){b.aim={...desired};b.aimReady=true;}if(!b.heavyTicket||ai.clock<b.heavyTicket.readyAt-.15){const follow=1-Math.exp(-dt/Math.max(.08,ai.difficulty.reaction*.45));for(const k of ['x','y','z'])b.aim[k]+=(desired[k]-b.aim[k])*follow;}}
 const bearing=memory?Math.atan2(memory.eye.x-origin.x,memory.eye.z-origin.z):Infinity,inCone=!!b.visible&&Math.abs(Math.atan2(Math.sin(bearing-b.facing),Math.cos(bearing-b.facing)))<8*Math.PI/180;
 const events=f.tick(dt,getStats,{down,cone:inCone,blocked:b.swapIn>0||b.recover>0,alive:!bot.dead});
 b.ammo=f.ammo;b.magazines[b.weaponType]=f.ammo;b.reload=f.reloading;b.charge=f.capacitor*w.charge;
 for(const packet of events){if(!b.aimReady)continue;if(b.biasIn<=0){const angle=ai.random()*Math.PI*2,r=.35+ai.random()*.65;b.aimBias={x:Math.cos(angle)*r,y:Math.sin(angle)*r};b.biasIn=.16+ai.random()*.18;}
  const error=ai.difficulty.aimError*distance,dx=b.aim.x-origin.x,dz=b.aim.z-origin.z,flat=Math.max(.01,Math.hypot(dx,dz)),point={x:b.aim.x+b.aimBias.x*error*dz/flat,y:b.aim.y+b.aimBias.y*error*.65,z:b.aim.z-b.aimBias.x*error*dx/flat};
  ai.world.fire(bot,point,{...packet.w,packet,type:'rifle',rounds:1});ai.attacks.fired(bot,b.target,ai.clock);b.heavyTicket=null;ai.stats.shots++;ai.stats.weapons.rifle=(ai.stats.weapons.rifle||0)+1;
 }
}
