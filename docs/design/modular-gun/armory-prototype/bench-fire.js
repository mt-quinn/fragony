import {resolve} from './model.js';

// Deterministic firing preview. Time is supplied by the view so sequences,
// reloads and delayed duplex bullets can be verified without a browser clock.
export function createBenchFire(){
 let weapon=null,ammo=0,nextAction=0,reloadStart=0,reloadEnd=0,queue=[],wasReloading=false;
 function setKit(kit){weapon=resolve(kit);ammo=weapon.capacity;nextAction=reloadStart=reloadEnd=0;queue=[];wasReloading=false;}
 function step(now,held=false){
  let completedReload=false;
  if(reloadEnd&&now>=reloadEnd){ammo=weapon.capacity;reloadStart=reloadEnd=0;completedReload=true;}
  if(held&&weapon&&now>=nextAction&&!reloadEnd){
   const cost=weapon.M.count*weapon.B.packets;
   if(ammo>=cost){
    queue.push(...weapon.events.map(t=>now+t*1000));ammo-=cost;nextAction=now+weapon.cycle*1000;
    if(ammo<cost){reloadStart=now+weapon.events.at(-1)*1000+80;reloadEnd=reloadStart+weapon.reload*1000;nextAction=Math.max(nextAction,reloadEnd);}
   }
  }
  let shots=0;while(queue.length&&queue[0]<=now){queue.shift();shots++;}
  const reloading=!!reloadEnd&&now>=reloadStart,startedReload=reloading&&!wasReloading;wasReloading=reloading;
  return{shots,ammo,reloading,startedReload,completedReload,reloadProgress:reloading?Math.min(1,(now-reloadStart)/(reloadEnd-reloadStart)):0,nextDeadline:Math.max(queue.at(-1)||0,reloadEnd||0)};
 }
 function stop(){ammo=weapon?.capacity||0;nextAction=0;queue=[];reloadStart=reloadEnd=0;wasReloading=false;}
 return{setKit,step,stop};
}
