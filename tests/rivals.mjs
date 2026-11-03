import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
import {difficultyForRound} from '../dist/ai.js';
const {run,setup}=createGameHarness(546);setup();
run(`{
 const initial=JSON.stringify(rivals.map(r=>r.owned));makeBots();assert.equal(JSON.stringify(rivals.map(r=>r.owned)),initial,'same rivals and guns across matches');
 const b=bots[0];b.rival.perks={armor:true,reload:true,speed:true,recovery:true,quickdraw:true};spawnBot(b);assert.equal(b.hp,140);assert.equal(b.maxHealth,140);b.hp=70;rivalKill(b);assert.equal(b.hp,90);assert.equal(b.rival.credits,25);
 b.rival.owned=[0,1,2,3,4,5];b.loadout=ALL_WEAPONS.slice();
 for(let g=0;g<6;g++){const w=opponentAI.world.weapon(b,ALL_WEAPONS[g]);assert.equal(w.damage,weapons[g].damageBudget??weaponStats(weapons[g],g,b.rival.builds).damage);assert.equal(w.magazine,weapons[g].mag);assert.equal(w.interval,weapons[g].interval);
  for(const a of Object.values(WEAPON_SLOTS[g]).flat().filter(a=>a.slot!=='optic')){b.rival.builds=normalizeBuilds();assert.ok(fitAttachment(b.rival.builds,b.rival.owned,9999,g,a.slot,a.id).ok);const spec=opponentAI.world.weapon(b,ALL_WEAPONS[g]).native;assert.equal(JSON.stringify(spec),JSON.stringify(weaponStats(weapons[g],g,b.rival.builds)));}
 }
 b.rival.builds=normalizeBuilds();
 const saved=JSON.parse(JSON.stringify(rivals)),restored=restoreRivals(saved,botNames,()=>['rifle','pistol'],ALL_WEAPONS);assert.equal(JSON.stringify(restored),JSON.stringify(saved));
 const ranks=botNames.map((name,i)=>({name,score:500-i*100}));
 const poor=rollRivals();settleRivals(poor,ranks,1,weapons,upgrades,()=>.5);
 for(let i=0;i<poor.length;i++){const r=poor[i];assert.ok(r.credits>=0);assert.equal(r.settledRound,1);if(i>=3){assert.equal(r.credits,0);assert.equal(Object.keys(r.perks).length,0);assert.equal(Object.values(r.builds).filter(v=>Array.isArray(v?.owned)&&v.owned.length).length,0);}}
 const once=JSON.stringify(poor);settleRivals(poor,ranks,1,weapons,upgrades,()=>.1);assert.equal(JSON.stringify(poor),once,'settlement cannot repeat payouts or reroll shops');
 for(let round=2;round<=25;round++){for(const r of poor)r.credits+=25*5;const before=JSON.parse(JSON.stringify(poor));settleRivals(poor,ranks,round,weapons,upgrades,()=>.4);
  for(let i=0;i<poor.length;i++){const r=poor[i],old=before[i];let cost=r.owned.filter(g=>!old.owned.includes(g)).reduce((n,g)=>n+upgrades.find(u=>u.gun===g).price,0);cost+=Object.keys(r.perks).filter(id=>!old.perks[id]).reduce((n,id)=>n+upgrades.find(u=>u.id===id).price,0);for(let g=0;g<6;g++)cost+=r.builds[g].owned.filter(id=>!old.builds[g].owned.includes(id)).reduce((n,id)=>n+attachment(g,id).price,0);assert.equal(r.credits,old.credits+placementReward(i+1)-cost,'wallet conserves actual shop prices, including the 220-credit rifle');}
 }
 for(const r of poor){assert.ok(r.owned.length>2);assert.ok(Object.keys(r.perks).length>0);assert.ok(r.credits>=0);for(let g=0;g<6;g++){assert.ok(gameplayCount(r.builds[g])<=3);for(const id of Object.values(r.builds[g].slots))assert.ok(r.builds[g].owned.includes(id));}}
 rivals=restored;saveRun();const s=JSON.parse(localStorage.getItem('dh-run'));assert.equal(JSON.stringify(s.rivals),JSON.stringify(rivals),'roster serialized in player save');
 console.log('Rivals: stable identity, all 72 shared attachment stats, armor/recovery, wallet, save round-trip, shared shop limits, finite credit, repeated-round settlement and 25-round purchases pass.');
}`);
// Empty room: the actual shared ballistic path must damage both bots and the player,
// respect cover, count kills once, and attribute explosive/rocket/arc payloads.
run(`{
 blocks=[];worldMeshes=[];mode='play';respawnTime=0;playerSpawnAt=-10;opponentAI.clock=20;perks={};health=100;playerPos.set(0,1.7,10);yaw=0;
 for(const b of bots){b.dead=100;b.group.visible=false;}
 const b=bots[0];b.dead=0;b.pos.set(0,0,0);b.rival.owned=[0,1,2,3,4,5];b.loadout=ALL_WEAPONS.slice();b.rival.builds=normalizeBuilds();opponentAI.reset(b,0);
 const w=opponentAI.world.weapon(b,'rifle').native,before=b.rival.credits;
 fireRivalWeapon(b,{x:0,y:1.25,z:10},{...w,type:'rifle',rounds:1});assert.equal(health,76,'same 24 torso damage as player rifle');
 health=10;fireRivalWeapon(b,{x:0,y:1.25,z:10},{...w,type:'rifle',rounds:1});assert.equal(health,0);assert.equal(b.rival.credits,before+25,'player kill awards 25');
 respawnTime=0;health=100;const wall=cube(0,1.5,5,4,3,1,0,arena,true);scene.updateMatrixWorld(true);fireRivalWeapon(b,{x:0,y:1.25,z:10},{...w,type:'rifle',rounds:1});assert.equal(health,100,'wall stops hostile fire');worldMeshes=[];blocks=[];arena.remove(wall);
 const proxy=playerCombatActor();payloadExplosion(playerPos.clone(),30,2,{direct:proxy,owner:b});assert.equal(health,70,'enemy splash attributed at full damage');
 const r=opponentAI.world.weapon(b,'rocket').native;fireRivalWeapon(b,{x:0,y:1.2,z:10},{...r,type:'rocket',rounds:1});const rocket=rockets.at(-1);let exploded=false;for(let i=0;i<60&&!exploded;i++)exploded=stepAttachmentRocket(rocket,1/60);assert.ok(exploded,'hostile native rocket sweeps player');assert.ok(health<70,'native rocket damages player');
 respawnTime=0;health=100;const victim=bots[1];victim.dead=0;victim.hp=10;victim.maxHealth=100;victim.pos.set(0,0,10);victim.group.position.copy(victim.pos);victim.group.visible=true;resetDummyRig(victim);scene.updateMatrixWorld(true);playerPos.set(20,1.7,10);const money=b.rival.credits;fireRivalWeapon(b,{x:0,y:1.25,z:10},{...w,type:'rifle',rounds:1});assert.ok(victim.dead);assert.equal(b.rival.credits,money+25,'bot kill awards identical income');
 console.log('Native rival fire: full player damage, cover, kill credits, hostile payload ownership and swept player rocket collision pass.');
}`);
// Record actual combat scheduling with shared feeds/triggers, without rendering.
run(`{
 const bot=bots[0];bot.dead=0;bot.loadout=['rifle'];bot.rival.owned=[0];bot.rival.builds=normalizeBuilds();bot.rival.perks={reload:true};bot.pos.set(0,0,0);let shots=[];
 const actor={id:'player',pos:{x:0,y:0,z:10},eye:{x:0,y:1.7,z:10},hp:100,alive:true,spawnAge:100};
 const ai=new ArenaAI({navigation,round:17,random:()=>.5,world:{weapon:opponentAI.world.weapon,actors:()=>[actor],canSee:()=>true,move(){},physics(){},fire:(b,p,w)=>shots.push({at:ai.clock,w,p})}});const b=ai.reset(bot,0);ai.clock=2;b.visible=true;b.target='player';b.facing=0;b.memory.set('player',{pos:actor.pos,eye:actor.eye,at:2});b.reaction=ai.difficulty.reaction;
 for(let i=0;i<180;i++){ai.clock+=1/60;ai.combat(bot,b,1/60,[actor]);}assert.ok(shots.length>=12,'round 17 provides sustained full-strength pressure');assert.equal(shots[0].w.damage,24);assert.ok(shots[0].at>=2+ai.difficulty.reaction);
 b.feeds.state('rifle').ammo=0;ai.combat(bot,b,1/60,[actor]);assert.ok(b.feeds.state('rifle').reload.total<1,'reload perk affects actual feed');
 const count=shots.length;b.visible=false;for(let i=0;i<120;i++)ai.combat(bot,b,1/60,[actor]);assert.equal(shots.length,count,'never fires with lost sight, even pending bursts');
 console.log('Native rival scheduling: round-17 sustained fire, reaction floor, full damage, shared reload perk and lost-sight cancellation pass.');
}`);
const r17=difficultyForRound(17),r31=difficultyForRound(31);
assert.ok(r17.reaction<.21);assert.ok(r17.aimError<.02);assert.ok(r31.reaction<r17.reaction);assert.ok(r31.aimError>0);
console.log('Difficulty:',JSON.stringify({round1:difficultyForRound(1),round17:r17,round31:r31}));
