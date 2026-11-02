// Executed only inside the local game harness. No production instrumentation.
(()=>{
 changeArena(studyConfig.map);botNames.push('SIXTH');startMatch();if(studyConfig.round){round=studyConfig.round;opponentAI.difficulty=difficultyForRound(round);}
 // Six autonomous combatants remove the earlier stationary-player confound.
 respawnTime=1e6;playerPos.set(1000,1000,1000);
 const nativeActors=opponentAI.world.actors;opponentAI.world.actors=()=>nativeActors().filter(a=>a.id!=='player');
 if(studyConfig.disableMajor)for(const p of pickups)if(p.amount===50){p.timer=1e6;p.mesh.visible=false;}
 const events=[],snapshots=[],key=b=>b.name+':'+b.lifeId,position=b=>b.pos.toArray(),clock=()=>opponentAI.clock;
 const initial=bots.map(b=>({id:b.name,life:key(b),position:position(b),loadout:[...b.loadout]}));
 if(studyConfig.telemetry===false){
  const inventory=pickups.filter(p=>p.kind==='health').map(p=>({id:p.id,amount:p.amount,x:p.x,y:p.y,z:p.z,respawn:p.respawn}));
  for(let i=0;i<2700&&mode==='play';i++){scene.updateMatrixWorld(true);updateStep(1/30);}
  const final={time,clock:clock(),stats:JSON.parse(JSON.stringify(opponentAI.stats)),bots:bots.map(b=>({name:b.name,life:b.lifeId,hp:b.hp,frags:b.frags,deaths:b.deaths,score:b.score,position:position(b)})),pickups:pickups.map(p=>({id:p.id,timer:p.timer}))};
  return {config:studyConfig,initial,inventory,events:[],snapshots:[],final};
 }

 for(const b of bots)events.push({type:'spawn',t:clock(),actor:key(b),position:position(b)});
 const originalSpawn=spawnBot;spawnBot=function(b){originalSpawn(b);events.push({type:'spawn',t:clock(),actor:key(b),position:position(b)})};
 const originalDamage=damageBot;damageBot=function(b,...args){const before=b.hp,alive=!b.dead,attacker=args[1];const out=originalDamage(b,...args);if(alive&&b.hp<before){events.push({type:'damage',t:clock(),actor:key(b),attacker:attacker?key(attacker):'player',damage:before-b.hp,position:position(b),attackerPosition:attacker?position(attacker):null,weapon:args[4]?.weapon||null});if(b.dead)events.push({type:'death',t:clock(),actor:key(b),attacker:attacker?key(attacker):'player',position:position(b)})}return out};
 const originalFire=opponentAI.world.fire;opponentAI.world.fire=(b,point,w)=>{events.push({type:'shot',t:clock(),actor:key(b),position:position(b),target:b.brain.target,weapon:b.brain.weaponType,aim:{...point}});return originalFire(b,point,w)};
 const originalCollect=opponentAI.world.collect;opponentAI.world.collect=(b,brain)=>{const before=b.hp,available=pickups.map(p=>p.timer<=0);originalCollect(b,brain);let hp=before;for(let i=0;i<pickups.length;i++){const p=pickups[i];if(p.kind!=='health'||!available[i]||p.timer<=0)continue;const after=healthAfterPickup(hp,100,p);events.push({type:'pickup',t:clock(),actor:key(b),id:p.id,amount:p.amount,gain:after-hp,hpBefore:hp,hpAfter:after,position:position(b),goal:brain.goal?.type});hp=after}if(Math.abs(hp-b.hp)>1e-6)throw Error('Pickup attribution mismatch');};
 const inventory=pickups.filter(p=>p.kind==='health').map(p=>({id:p.id,amount:p.amount,x:p.x,y:p.y,z:p.z,respawn:p.respawn}));
 for(let i=0;i<2700&&mode==='play';i++){
  scene.updateMatrixWorld(true);updateStep(1/30);
  if(studyConfig.telemetry!==false&&i%6===0){
   const live=bots.filter(b=>!b.dead),contacts=[];
   for(let a=0;a<live.length;a++)for(let b=a+1;b<live.length;b++){
    const x=live[a],y=live[b],distance=x.pos.distanceTo(y.pos);if(distance>35)continue;
    const los=opponentAI.world.canSee({x:x.pos.x,y:x.pos.y+1.65,z:x.pos.z},{x:y.pos.x,y:y.pos.y+1.65,z:y.pos.z});
    if(los){const bearing=(a,b)=>Math.atan2(b.pos.x-a.pos.x,b.pos.z-a.pos.z),inView=(a,b)=>Math.abs(Math.atan2(Math.sin(bearing(a,b)-a.brain.facing),Math.cos(bearing(a,b)-a.brain.facing)))<=110*Math.PI/180;contacts.push({a:key(x),b:key(y),distance,fovA:inView(x,y),fovB:inView(y,x),rangeA:distance<=x.brain.weapon.range,rangeB:distance<=y.brain.weapon.range});}
   }
   snapshots.push({t:clock(),actors:bots.map(b=>({id:b.name,life:key(b),alive:!b.dead,position:position(b),hp:b.hp,goal:b.brain.goal?{type:b.brain.goal.type,x:b.brain.goal.x,y:b.brain.goal.y,z:b.brain.goal.z,pickup:b.brain.goal.pickup?.id,fragmentCircuit:b.brain.goal.fragmentCircuit,expectedGain:b.brain.goal.expectedGain}:null,target:b.brain.target,perceived:b.brain.visible,facing:b.brain.facing,pathAction:b.brain.path[0]?.action,lift:b.brain.liftRide?{...b.brain.liftRide}:null,reload:b.brain.reload})),contacts,pickups:pickups.filter(p=>p.kind==='health').map(p=>({id:p.id,timer:p.timer}))});
  }
 }
 const final={time,clock:clock(),stats:JSON.parse(JSON.stringify(opponentAI.stats)),bots:bots.map(b=>({name:b.name,life:b.lifeId,hp:b.hp,frags:b.frags,deaths:b.deaths,score:b.score,position:position(b)})),pickups:pickups.map(p=>({id:p.id,timer:p.timer}))};
 return {config:studyConfig,initial,inventory,events,snapshots,final};
})()
