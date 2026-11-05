// Design calculator only. Not imported by the game and not a combat simulation.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const mechanisms={
 automatic:{damage:24,cycle:.16,count:1,gap:0,charge:0},
 semi:{damage:68,cycle:.50,count:1,gap:0,charge:0},
 burst:{damage:24,cycle:.50,count:3,gap:.06,charge:0},
 charge:{damage:80,cycle:.60,count:1,gap:0,charge:.40}
};
export const barrels={
 single:{damage:1,cycle:1,packets:1,capacity:24,reload:1,blast:1},
 double:{damage:1.5,cycle:1.45,packets:2,capacity:24,reload:1.1,blast:1},
 huge:{damage:1.5,cycle:1.6,packets:1,capacity:12,reload:.85,blast:1.35},
 gatling:{damage:.65,cycle:.55,packets:1,capacity:48,reload:1.25,blast:.8},
 rails:{damage:1.25,cycle:1.2,packets:1,capacity:18,reload:1.1,blast:.85}
};
export const ammunition={
 normal:{damage:1,cycle:1,capacity:1,head:1.25,projectiles:1,range:[22,45,.75]},
 pellets:{damage:1.35,cycle:1,capacity:1,head:1.1,projectiles:8,range:[8,24,.75]},
 sniper:{damage:1.25,cycle:1.25,capacity:.75,head:1.3,projectiles:1,range:[40,70,.9]},
 explosive:{damage:1.05,cycle:1.1,capacity:.85,head:1,projectiles:1,range:[90,90,1]},
 piercing:{damage:1,cycle:1.1,capacity:1,head:1.25,projectiles:1,range:[22,45,.8]},
 duplex:{damage:1.5,cycle:1.4,capacity:.75,head:1.1,projectiles:2,range:[22,45,.75]}
};
export const circuits={
 pressure:{interval:1},service:{interval:1},momentum:{interval:1},repair:{interval:2},
 focus:{interval:2},rebound:{interval:2},brake:{interval:2},echo:{interval:3},arc:{interval:3},assayer:{interval:3}
};
export const rarityU=[1,1.08,1.16,1.25],rarityP=[1,.92,.84,.75];
export function rankedComponents(m,b,a,mr=0,br=0,ar=0){
 const M={...mechanisms[m]},B={...barrels[b]},A={...ammunition[a]},mu=rarityU[mr],mp=rarityP[mr],bu=rarityU[br],bp=rarityP[br],au=rarityU[ar],ap=rarityP[ar];
 if(m==='automatic')M.cycle/=(1+.03*mr);
 if(m==='semi'||m==='burst'){M.cycle=.16+(M.cycle-.16)*mp;M.gap*=mp;}
 if(m==='charge'){M.charge*=mp;M.cycle=.60*mp;M.radiusBonus=.05*mu;}
 B.cycle=b==='gatling'?Math.max(.5,1-(1-B.cycle)*bu):1+(B.cycle-1)*bp;
 if(b==='gatling')B.damage=1-(1-B.damage)*bp;
 B.capacity=b==='single'?24*bu:b==='huge'||b==='rails'?24-(24-B.capacity)*bp:b==='gatling'?24+(B.capacity-24)*bu:B.capacity;
 B.reload=b==='single'?bp:B.reload<1?1-(1-B.reload)*bu:1+(B.reload-1)*bp;
 B.blast=B.blast<1?1-(1-B.blast)*bp:1+(B.blast-1)*bu;
 B.spin=.35*bp;B.pairDelay=.065*bp;
 A.cycle=1+(A.cycle-1)*ap;A.capacity=1-(1-A.capacity)*ap;A.head=1+(A.head-1)*au;
 A.range=[Math.min(90,A.range[0]*au),Math.min(90,A.range[1]*au),1-(1-A.range[2])*ap];A.blast=2.4*au;
 return {M,B,A,quality:1+.04*(mr+br+ar)};
}
const falloff=(a,d)=>{const [start,end,floor]=a.range;return start===end?1:1+(floor-1)*Math.max(0,Math.min(1,(d-start)/(end-start)));};
export function resolve(m,b,a,{mechanismRank=0,barrelRank=0,ammoRank=0}={}){
 const {M,B,A,quality}=rankedComponents(m,b,a,mechanismRank,barrelRank,ammoRank),cost=B.packets,groupCost=cost*M.count;
 const capacity=Math.max(groupCost*2,Math.floor(B.capacity*A.capacity/groupCost)*groupCost);
 const windup=M.charge?Math.max(.18,Math.min(.6,M.charge*B.cycle)):0;
 const cycle=M.charge?windup+(M.cycle-M.charge)*B.cycle*A.cycle:M.cycle*B.cycle*A.cycle;
 return {m,b,a,M,B,A,cost,capacity,damage:M.damage*B.damage*A.damage*quality,cycle,
  projectiles:B.packets*A.projectiles,head:A.head,gap:M.gap*B.cycle*A.cycle,
  charge:windup,blast:a==='explosive'?A.blast*B.blast*(m==='charge'?1.25:1):0};
}
// Gatling scale is sampled at action start. It spins from .9 to .55 in .35s.
// For these continuously firing trials the motor never decays, including reloads.
function* events(w,{warm=false,missEvery=0,missFirst=false,prepared=false}={}){
 let start=0,ammo=w.capacity,eventIndex=0;
 for(let action=0;action<10000;action++){
  const motor=w.b==='gatling'?(warm?w.B.cycle:.9-(.9-w.B.cycle)*Math.min(1,start/w.B.spin)):w.B.cycle;
  const scale=motor*w.A.cycle;
  const windup=w.M.charge&&!(prepared&&action===0)?Math.max(.18,Math.min(.6,w.M.charge*motor)):0;
  const cycle=w.M.charge?windup+(w.M.cycle-w.M.charge)*scale:w.M.cycle*scale;
  const G=w.M.count>1?w.M.gap*scale:cycle;
  const barrelDelay=w.B.packets===2?Math.min(w.B.pairDelay,.4*G):0;
  const pairDelay=w.a==='duplex'?Math.min(.035,.4*(barrelDelay?Math.min(barrelDelay,G-barrelDelay):G)):0;
  const scheduled=[];
  for(let j=0;j<w.M.count;j++){
   const t=start+windup+j*w.M.gap*scale;
   if(ammo<w.cost)throw new Error('Incomplete design group');
   ammo-=w.cost;eventIndex++;
   const hit=!(missFirst&&eventIndex===1)&&(!missEvery||eventIndex%missEvery!==0);
   for(let barrel=0;barrel<w.B.packets;barrel++)for(let pair=0;pair<(w.a==='duplex'?2:1);pair++)
    scheduled.push({t:t+barrel*barrelDelay+pair*pairDelay,hit,fraction:1/w.B.packets/(w.a==='duplex'?2:1)});
  }
  scheduled.sort((a,b)=>a.t-b.t);
  for(const event of scheduled)yield event;
  const next=start+cycle;
  if(ammo===0){
   const last=scheduled.at(-1).t;
   const nextMotor=w.B.cycle;
   const nextWindup=w.M.charge?Math.max(.18,Math.min(.6,w.M.charge*nextMotor)):0;
   start=Math.max(next,last+w.B.reload-nextWindup);ammo=w.capacity;
  }else start=next;
 }
}
export function killTime(w,{health=100,distance=5,fraction=1,warm=false,missEvery=0,missFirst=false,prepared=false,head=false,splashOnly=false}={}){
 let total=0;
 for(const e of events(w,{warm,missEvery,missFirst,prepared})){
  const multiplier=head?w.head:1;
  const damage=w.damage*falloff(w.A,distance)*fraction*multiplier*(splashOnly?.35:1);
  if(e.hit)total+=damage*e.fraction;
  if(total+1e-8>=health)return +e.t.toFixed(4);
 }
 throw new Error('No kill');
}
const rows=[];
for(const m of Object.keys(mechanisms))for(const b of Object.keys(barrels))for(const a of Object.keys(ammunition)){
 const w=resolve(m,b,a),sequence=w.damage*w.M.count*w.head;
 if(w.projectiles>16||w.capacity/w.cost<2*w.M.count||w.cycle>1.200001||sequence*.9>=180)throw new Error('Design bound failed '+[m,b,a]);
 if(w.M.count>1&&w.gap*(w.M.count-1)>=w.cycle)throw new Error('Burst overlap');
 const distantFraction=a==='pellets'?.5:1;
 rows.push({mechanism:m,barrel:b,ammo:a,bodyDamage:+w.damage.toFixed(3),cycle:+w.cycle.toFixed(4),
  projectilesPerEjection:w.projectiles,capacity:w.capacity,reload:w.B.reload,
  warmBodyDPS:+(w.damage*w.M.count/w.cycle).toFixed(2),
  closeCold:killTime(w),closeWarm:killTime(w,{warm:true}),closePrepared:killTime(w,{prepared:true}),armoredCold:killTime(w,{health:120}),
  missThirdCold:killTime(w,{missEvery:3}),missFirstCold:killTime(w,{missFirst:true}),
  mediumPartial:killTime(w,{distance:25,fraction:distantFraction}),
  longPartial:killTime(w,{distance:45,fraction:distantFraction}),
  maxSequenceInternal:+(sequence*.9).toFixed(4),
  blastRadius:+w.blast.toFixed(3)});
}
fs.writeFileSync(path.join(here,'combinations.csv'),Object.keys(rows[0]).join(',')+'\n'+rows.map(r=>Object.values(r).join(',')).join('\n')+'\n');
const range=key=>({min:Math.min(...rows.map(r=>r[key])),max:Math.max(...rows.map(r=>r[key]))});
const worst=key=>[...rows].sort((a,b)=>b[key]-a[key]).slice(0,5).map(r=>({build:[r.mechanism,r.barrel,r.ammo].join('/'),[key]:r[key]}));
const rewardRows=[];
for(const r of rows)for(const [c,C]of Object.entries(circuits))for(const kills of [0,1,2,3,6,9,12,18,30]){
 const w=resolve(r.mechanism,r.barrel,r.ammo),n=Math.floor(kills/C.interval),primary=c==='pressure'?1+.12*n:1;
 const conditional=c==='echo'?.4*n:c==='arc'||c==='rebound'?.6*n:0;
 const echoBundles=c==='echo'?Math.min(4,n):0;
 const resolvedPaths=w.projectiles+(c==='echo'?echoBundles*w.A.projectiles:c==='rebound'&&n?w.projectiles:0);
 const row={mechanism:r.mechanism,barrel:r.barrel,ammo:r.ammo,circuit:c,kills,stacks:n,
  primaryDamage:+(w.damage*primary).toFixed(4),conditionalExtraDamage:+(w.damage*conditional).toFixed(4),
  reload:+(w.B.reload/(c==='service'?1+.25*n:1)).toFixed(4),
  cartridgesReturnedPerKill:c==='service'?Math.floor(.2*w.capacity):0,
  speedFactor:c==='momentum'?+(1+.06*n).toFixed(3):1,
  totalHealingOffered:c==='repair'?35*n:0,totalFocusOffered:c==='focus'?35*n:0,
  focusRegenFactor:c==='focus'?+(1+.15*n).toFixed(3):1,
  slowDuration:c==='brake'?+(.35*n).toFixed(3):0,shopPromotionPasses:c==='assayer'?n:0,
  resolvedTrajectoryBundlesPerEjection:resolvedPaths,
  peakAllHeadSequenceInternal:+(w.damage*(primary+conditional)*w.head*w.M.count*.9).toFixed(4)};
 // Arc has no precision multiplier, and its target must differ from the primary.
 if(c==='arc')row.peakAllHeadSequenceInternal=+(w.damage*(primary*w.head+conditional)*w.M.count*.9).toFixed(4);
 if(!Object.values(row).every(v=>typeof v!=='number'||Number.isFinite(v)))throw new Error('Non-finite circuit stats');
 if(resolvedPaths>48||row.primaryDamage<w.damage-1e-8||row.reload<=0||row.speedFactor<1)throw new Error('Circuit viability bound');
 rewardRows.push(row);
}
fs.writeFileSync(path.join(here,'reward-audit.csv'),Object.keys(rewardRows[0]).join(',')+'\n'+rewardRows.map(r=>Object.values(r).join(',')).join('\n')+'\n');
const summary={physicalBuilds:rows.length,loadouts:rows.length*Object.keys(circuits).length,circuitStatesAudited:rewardRows.length,
 mechanicalTimingNote:'Excludes acquisition, flight, aim correction, target motion and secondary circuit geometry. A zero denotes a first-ejection kill.',
 closeCold:range('closeCold'),closeWarm:range('closeWarm'),closePrepared:range('closePrepared'),armoredCold:range('armoredCold'),missThirdCold:range('missThirdCold'),missFirstCold:range('missFirstCold'),mediumPartial:range('mediumPartial'),longPartial:range('longPartial'),warmBodyDPS:range('warmBodyDPS'),maxSequenceInternal:range('maxSequenceInternal'),
 capacityMinCompleteActions:Math.min(...rows.map(r=>r.capacity/(barrels[r.barrel].packets*mechanisms[r.mechanism].count))),
 maxBaseCycle:Math.max(...rows.map(r=>r.cycle)),maxBaseReload:Math.max(...rows.map(r=>r.reload)),
 maxBaseEjectionTrajectories:Math.max(...rows.map(r=>r.projectilesPerEjection)),
 maxCircuitTrajectoryBundles:Math.max(...rewardRows.map(r=>r.resolvedTrajectoryBundlesPerEjection)),
 worstClose:worst('closeCold'),worstMedium:worst('mediumPartial'),worstLong:worst('longPartial')};
fs.writeFileSync(path.join(here,'audit-summary.json'),JSON.stringify(summary,null,2)+'\n');
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(summary,null,2));
