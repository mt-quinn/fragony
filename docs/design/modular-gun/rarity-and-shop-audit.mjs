// Offline design arithmetic and eligibility audit. No runtime gameplay import.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mechanisms,barrels,ammunition,circuits,resolve,killTime,rarityU} from './audit.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),names=['Common','Rare','Epic','Legendary'];
const parts=[...Object.keys(mechanisms).map(id=>'mechanism:'+id),...Object.keys(barrels).map(id=>'barrel:'+id),...Object.keys(ammunition).map(id=>'ammo:'+id),...Object.keys(circuits).map(id=>'circuit:'+id)];
const assert=(x,message)=>{if(!x)throw Error(message)};
export function rarityDistribution(passes=0,promotionChance=.30){
 let p=[.55,.25,.15,.05];
 for(let i=0;i<passes;i++)p=[p[0]*(1-promotionChance),p[1]*(1-promotionChance)+p[0]*promotionChance,p[2]*(1-promotionChance)+p[1]*promotionChance,p[3]+p[2]*promotionChance];
 return p;
}
const weighted=(weights,random)=>{let v=random()*weights.reduce((s,x)=>s+x,0);for(let i=0;i<weights.length;i++){v-=weights[i];if(v<0)return i;}return weights.length-1;};
export function offers(owned,count,{passes=0,assayerRank=0,random=Math.random}={}){
 const distribution=rarityDistribution(passes,.30+.05*assayerRank),shown=new Set(),out=[];
 for(let choice=0;choice<count;choice++){
  const eligible=names.map((_,rank)=>parts.filter(id=>!shown.has(id)&&rank>(owned[id]??-1)));
  const weights=distribution.map((p,t)=>eligible[t].length?p:0);
  if(!weights.some(Boolean))break;
  const rank=weighted(weights,random),ids=eligible[rank],id=ids[Math.floor(random()*ids.length)];
  shown.add(id);out.push({id,rank});
 }
 return out;
}
const rankedRows=[],lookup=new Map();
for(const m of Object.keys(mechanisms))for(const b of Object.keys(barrels))for(const a of Object.keys(ammunition))for(let mr=0;mr<4;mr++)for(let br=0;br<4;br++)for(let ar=0;ar<4;ar++){
 const w=resolve(m,b,a,{mechanismRank:mr,barrelRank:br,ammoRank:ar}),fraction=a==='pellets'?.5:1;
 const row={mechanism:m,barrel:b,ammo:a,mechanismRank:mr,barrelRank:br,ammoRank:ar,
  damage:+w.damage.toFixed(5),cycle:+w.cycle.toFixed(6),capacity:w.capacity,reload:+w.B.reload.toFixed(6),head:+w.head.toFixed(6),
  readyClose:killTime(w,{prepared:true}),unpreparedClose:killTime(w),ready45:killTime(w,{prepared:true,distance:45,fraction}),
  warmDPS:+(w.damage*w.M.count/w.cycle).toFixed(5),bodySequenceInternal:+(w.damage*w.M.count*.9).toFixed(5),headSequenceInternal:+(w.damage*w.M.count*w.head*.9).toFixed(5),blast:+w.blast.toFixed(6)};
 assert(w.capacity>=3*w.cost*w.M.count,'Too few complete actions');
 assert(Object.values(row).every(x=>typeof x!=='number'||Number.isFinite(x)),'Nonfinite part stat');
 lookup.set([m,b,a,mr,br,ar].join('/'),row);rankedRows.push(row);
}
let upgradesChecked=0;
for(const r of rankedRows)for(const slot of ['mechanismRank','barrelRank','ammoRank']){
 if(r[slot]===3)continue;
 const next={...r,[slot]:r[slot]+1},n=lookup.get([r.mechanism,r.barrel,r.ammo,next.mechanismRank,next.barrelRank,next.ammoRank].join('/'));
 for(const field of ['damage','capacity','head','warmDPS'])assert(n[field]>=r[field]-1e-5,'Rarity weakened '+field+' '+JSON.stringify(r));
 for(const field of ['cycle','reload','readyClose','unpreparedClose','ready45'])assert(n[field]<=r[field]+1e-5,'Rarity worsened '+field+' '+JSON.stringify(r));
 upgradesChecked++;
}
const rewardCheckKills=[0,1,2,3,6,9,12,18,30];let circuitStatesChecked=0,maxBundles=0;
for(const r of rankedRows)for(const [c,C]of Object.entries(circuits))for(let cr=0;cr<4;cr++)for(const kills of rewardCheckKills){
 const n=Math.floor(kills/C.interval),u=rarityU[cr],main=c==='pressure'?1+.12*u*n:1;
 const extra=c==='echo'?.4*u*n:c==='arc'||c==='rebound'?.6*u*n:0;
 const damage=r.damage*(main+extra),reload=r.reload/(c==='service'?1+.25*u*n:1),speed=c==='momentum'?1+.06*u*n:1;
 const basePaths=barrels[r.barrel].packets*ammunition[r.ammo].projectiles;
 const bundles=basePaths+(c==='echo'?Math.min(4,n)*ammunition[r.ammo].projectiles:c==='rebound'&&n?basePaths:0);
 assert(Number.isFinite(damage)&&damage>=r.damage&&reload>0&&speed>=1,'Invalid circuit state');
 assert(bundles<=48,'Unbounded secondary bundles');maxBundles=Math.max(maxBundles,bundles);circuitStatesChecked++;
}
let seed=0x51a19;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const starter={'mechanism:automatic':0,'barrel:single':0,'ammo:normal':0,'circuit:pressure':0};
let shopsChecked=0,selected=0;
for(let run=0;run<100;run++){
 const owned={...starter};
 for(let round=0;round<120;round++){
  const count=3+Math.floor(rng()*7),cards=offers(owned,count,{passes:Math.floor(rng()*5),assayerRank:Math.floor(rng()*4),random:rng});
  assert(new Set(cards.map(x=>x.id)).size===cards.length,'Duplicate shop identity');
  for(const card of cards)assert(card.rank>(owned[card.id]??-1),'Forbidden lower/equal offer');
  if(cards.length){const pick=cards[Math.floor(rng()*cards.length)];owned[pick.id]=pick.rank;selected++;}
  else assert(parts.every(id=>owned[id]===3),'Stopped before collection complete');
  shopsChecked++;
 }
}
assert(offers(Object.fromEntries(parts.map(id=>[id,3])),20,{random:rng}).length===0,'Completed collection must have no upgrades');
assert(offers(Object.fromEntries(parts.map(id=>[id,2])),20,{random:rng}).every(x=>x.rank===3),'Epic ownership should offer only Legendary');
const qualityTables=[0,1,2,3].map(passes=>({passes,probabilities:rarityDistribution(passes)}));
for(const q of qualityTables)assert(Math.abs(q.probabilities.reduce((a,b)=>a+b,0)-1)<1e-10,'Bad rarity probability sum');
const max=(key)=>Math.max(...rankedRows.map(r=>r[key]));
const summary={partIdentities:parts.length,identityTierVersions:parts.length*4,identityLoadouts:120*Object.keys(circuits).length,
 tieredPhysicalGuns:rankedRows.length,tieredLoadouts:rankedRows.length*Object.keys(circuits).length*4,
 adjacentPhysicalRarityUpgradesChecked:upgradesChecked,circuitStatesChecked,maxTrajectoryBundles:maxBundles,
 shopsChecked,selectedUpgradesChecked:selected,baseRarityProbabilities:rarityDistribution(),commonAssayerTables:qualityTables,
 maxReadyClose:max('readyClose'),maxUnpreparedClose:max('unpreparedClose'),maxReady45HalfPellets:max('ready45'),
 maxBodySequenceInternal:max('bodySequenceInternal'),maxHeadSequenceInternal:max('headSequenceInternal'),
 note:'Damage/timing and shop arithmetic only. No simulation of human aim, moving geometry, bot decisions, token pickup or attack-warning readability.'};
fs.writeFileSync(path.join(here,'rarity-builds.csv'),Object.keys(rankedRows[0]).join(',')+'\n'+rankedRows.map(r=>Object.values(r).join(',')).join('\n')+'\n');
fs.writeFileSync(path.join(here,'rarity-and-shop-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
