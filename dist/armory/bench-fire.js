import {ModularFire} from '../modular-fire.js';
import {gunStats,createLife} from '../modular-gun.js';
// The bench runs the same action, capacitor, magazine and motor as live combat.
export function createBenchFire(){
 const fire=new ModularFire();let collection=null,last=null,wasReloading=false;
 function setKit(kit){collection={kit};fire.reset(gunStats(collection),1);last=null;wasReloading=false;}
 function step(now,held=false){if(!collection)return{shots:0,nextDeadline:now};const dt=last===null?0:Math.max(0,(now-last)/1000);last=now;const events=fire.tick(dt,motor=>gunStats(collection,createLife(),motor),{down:held}),reloading=!!fire.reloading,startedReload=reloading&&!wasReloading,completedReload=wasReloading&&!reloading;wasReloading=reloading;
 return{shots:events.length,ammo:fire.ammo,reloading,startedReload,completedReload,reloadProgress:reloading?Math.max(0,Math.min(1,(fire.clock-fire.reloadStart)/(fire.reloadUntil-fire.reloadStart))):0,nextDeadline:now+Math.max(0,fire.reloadUntil-fire.clock,...fire.pending.map(e=>e.time-fire.clock))*1000};}
 function stop(){if(collection)fire.reset(gunStats(collection),1);last=null;wasReloading=false;}
 return{setKit,step,stop};
}
