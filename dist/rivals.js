import {normalizeBuilds,normalizeEquipment,attachment,fitAttachment,gameplayCount} from './loadout.js';
import {createShopOffers} from './shop.js';
import {FireControl,FeedSystem} from './weapon-cycle.js';
export const placementReward=place=>[250,190,150][place-1]||0;
export function createRivals(names,roll,weaponIds){return names.map(name=>({name,credits:0,owned:roll().map(w=>weaponIds.indexOf(w)),builds:normalizeBuilds(),equipment:normalizeEquipment(),perks:{},settledRound:0,starterConversionUsed:false}));}
export function restoreRivals(raw,names,roll,weaponIds){
 const fresh=createRivals(names,roll,weaponIds);
 return fresh.map(r=>{const s=Array.isArray(raw)?raw.find(s=>s?.name===r.name):null;if(!s)return r;const owned=Array.isArray(s.owned)?[...new Set(s.owned.filter(g=>Number.isInteger(g)&&g>=0&&g<6))]:[];return {...r,credits:Math.max(0,Number(s.credits)||0),owned:owned.length?owned:r.owned,builds:normalizeBuilds(s.builds),equipment:normalizeEquipment(s.equipment),perks:{...s.perks},settledRound:s.settledRound||0,starterConversionUsed:!!s.starterConversionUsed};});
}
// Same stock, prices, discounts, affordability and fitting rules as the player's shop.
// Personal preferences make some rivals save for guns while others invest in parts/perks.
export function settleRivals(roster,standings,round,weapons,upgrades,random=Math.random){
 for(const [index,r] of roster.entries()){
  if(r.settledRound>=round)continue;
  const place=standings.findIndex(s=>s.name===r.name)+1;r.credits+=placementReward(place);
  const offers=createShopOffers({...r,round,weapons,upgrades},random),choices=[];
  for(const g of offers.weapons)choices.push({kind:'gun',g,price:upgrades.find(u=>u.gun===g).price,weight:(r.owned.length<3?2:1)+(g===[2,0,3,5,4][index%5]?2:0)+random()*2});
  for(const p of offers.attachments){const a=attachment(p.gun,p.id);choices.push({kind:'part',...p,price:p.price??a.price,weight:(a.slot==='action'?1.4:a.slot==='ammunition'?1.1:.8)+random()*2});}
  // Focus and extra grenades are deliberately passed over: these rivals prioritize
  // gunfights, rather than buying abilities they don't use.
  for(const id of offers.perks.filter(id=>id!=='focus')){const u=upgrades.find(u=>u.id===id);choices.push({kind:'perk',id,price:u.price,weight:(Object.keys(r.perks).length<2?2:1)+(id==='armor'?.8:0)+random()*2});}
  choices.sort((a,b)=>b.weight-a.weight);
  for(const c of choices){if(r.credits<c.price)break;
   if(c.kind==='gun'){r.owned.push(c.g);r.credits-=c.price;}
   else if(c.kind==='perk'){r.perks[c.id]=true;r.credits-=c.price;}
   else{const a=attachment(c.gun,c.id),slots=r.builds[c.gun].slots,replace=gameplayCount(r.builds[c.gun])>=3&&!slots[a.slot]?Object.keys(slots).find(s=>s!=='optic'):null;
    const result=fitAttachment(r.builds,r.owned,r.credits,c.gun,a.slot,c.id,{replace,priceOverride:c.price});if(result.ok){r.credits=result.credits;if(c.starter)r.starterConversionUsed=true;}}
  }
  r.settledRound=round;
 }
}
// A native opponent uses exactly the player's trigger and magazine simulation.
export function rivalCombat(ai,bot,b,dt,actors){
 const w=b.weapon.native;if(b.fireWeapon!==b.weaponType){b.fireControl?.reset();b.fireWeapon=b.weaponType;}if(!b.fireControl){b.fireControl=new FireControl();b.feeds=new FeedSystem();b.feeds.reset(b.loadout,type=>ai.world.weapon(bot,type).native);}
 b.cool=Math.max(0,b.cool-dt);b.rest=Math.max(0,b.rest-dt);b.reaction=Math.max(0,b.reaction-dt);
 const memory=b.memory.get(b.target),actor=actors.find(a=>a.id===b.target),origin={x:bot.pos.x,y:bot.pos.y+1.28-(bot.anim?.crouch||0)*.45,z:bot.pos.z};
 const distance=memory?Math.hypot(memory.eye.x-origin.x,memory.eye.y-origin.y,memory.eye.z-origin.z):Infinity;
 let down=!!(b.visible&&memory&&actor&&actor.alive&&b.swapIn<=0&&b.recover<=0&&b.reaction<=0&&b.rest<=0&&ai.clock-b.spawnAt>=ai.tuning.fairness.spawnGrace&&distance<=b.weapon.range&&(b.weaponType!=='rocket'||distance>=6));
 if(down){const bearing=Math.atan2(memory.eye.x-origin.x,memory.eye.z-origin.z);down=Math.abs(Math.atan2(Math.sin(bearing-b.facing),Math.cos(bearing-b.facing)))<.25&&ai.world.canSee(origin,actor.eye);}
 if(down){const desired={x:memory.eye.x,y:memory.eye.y-.42,z:memory.eye.z};if(!b.aimReady){b.aim={...desired};b.aimReady=true;}
  const follow=1-Math.exp(-dt/(Math.max(.035,ai.difficulty.reaction*.45)*w.ads*(bot.rival.perks.quickdraw?.8:1)));for(const k of ['x','y','z'])b.aim[k]+=(desired[k]-b.aim[k])*follow;}
 b.fireControl.anchor=Math.hypot(b.moveX,b.moveZ)<.1?b.fireControl.anchor+dt:0;
 const scale=bot.rival.perks.reload?.65:1;
 for(const type of b.loadout){const spec=ai.world.weapon(bot,type).native,state=b.feeds.step(type,spec,dt,{active:type===b.weaponType,trigger:down&&type===b.weaponType,scale});b.magazines[type]=state.ammo;}
 const feed=b.feeds.state(b.weaponType);b.ammo=feed.ammo;
 if(b.ammo<=0)b.feeds.start(b.weaponType,w,scale);
 b.reload=feed.reload?.left||0;
 // Individual feeds can be interrupted as soon as a cartridge is ready.
 if(down&&feed.reload?.individual&&feed.ammo>0)b.feeds.cancel(b.weaponType);
 const event=b.fireControl.tick(dt,w,{down,repeat:true,cooldown:b.cool,blocked:!!feed.reload||b.ammo<=0||b.swapIn>0||b.recover>0,cancelOnLoss:true});b.charge=b.fireControl.charge;
 if(down&&w.charge)ai.world.telegraph?.(bot,b.aim,dt);
 if(!memory||!down)return;

 if(!event.fire)return;
 if(b.biasIn<=0){const angle=ai.random()*Math.PI*2,r=.35+ai.random()*.65;b.aimBias={x:Math.cos(angle)*r,y:Math.sin(angle)*r};b.biasIn=.16+ai.random()*.18;}
 const error=ai.difficulty.aimError*distance*w.recoil*(w.handling==='anchor'&&b.fireControl.anchor>=.25?.5:1),dx=b.aim.x-origin.x,dz=b.aim.z-origin.z,flat=Math.max(.01,Math.hypot(dx,dz));
 const point={x:b.aim.x+b.aimBias.x*error*dz/flat,y:b.aim.y+b.aimBias.y*error*.65,z:b.aim.z-b.aimBias.x*error*dx/flat},rounds=Math.min(feed.ammo,w.volley);
 if(!event.continuation){b.refunded=false;b.cool=Math.max(.01,w.interval-(event.charged?w.charge:0));}
 feed.ammo-=rounds;ai.world.fire(bot,point,{...w,type:b.weaponType,rounds,heat:b.fireControl.heat});b.fireControl.shot(w);b.ammo=feed.ammo;b.magazines[b.weaponType]=b.ammo;ai.stats.shots++;ai.stats.weapons[b.weaponType]=(ai.stats.weapons[b.weaponType]||0)+rounds;
 b.burst++;if(b.burst>=Math.max(w.burst,b.weapon.burst)){b.burst=0;b.rest=b.weapon.rest*ai.difficulty.rest*(.85+ai.random()*.3);}
 if(feed.ammo===0)b.feeds.start(b.weaponType,w,scale);
}
