import {partCopy} from './shop-copy.js';
import {WEAPON_SLOTS as LEGACY_SLOTS,OPTICS as LEGACY_OPTICS,attachment as legacyAttachment,migrateBuilds as legacyBuilds} from './legacy-loadout.js';
import {EQUIPMENT,normalizeEquipment} from './legacy-loadout.js';
export {EQUIPMENT,normalizeEquipment};
export const ATTACHMENT_VERSION=2,MAX_PARTS=3;
export const OPTICS=LEGACY_OPTICS.map(a=>({...a,price:0,effects:{}}));
const action=(id,name,price,config)=>({id,name,price,config,desc:'',slot:'action',effects:{},visual:id});
const ammo=(id,name,price,config)=>({id,name,price,config,desc:'',slot:'ammunition',effects:{},visual:id});
const feed=(id,name,price,config,desc)=>({id,name,price,config,desc,slot:'feed',effects:{},visual:id});
// Paired shots share the crosshair; ordinary weapon/pellet spread still applies.
// Ammunition cost, cycle time and damage provide the tradeoffs, not a forced miss.
const actions=[
 [action('overdrive','Overdrive carrier',300,{damage:18,interval:0.06,volley:1,burst:1,recoil:1.5,mode:'auto'}),action('ratchet','Three-round ratchet',300,{damage:32,interval:0.6,volley:1,burst:3,mode:'burst',burstGap:0.07}),action('surveyor','Surveyor receiver',300,{damage:60,interval:0.28,volley:1,burst:1,mode:'semi',spread:0.5,recoil:1.3})],
 [action('riveter','Riveter action',300,{damage:34,interval:0.14,volley:1,burst:1,recoil:0.6,mode:'auto'}),action('twin','Twinstrike block',300,{damage:48,interval:0.9,volley:2,burst:1,mode:'semi',recoil:1.35}),action('hammerfall','Hammerfall action',300,{damage:48,interval:0.6,volley:1,burst:2,mode:'burst',burstGap:0.1})],
 [action('overspeed','Overspeed bolt',300,{damage:9,interval:0.0275,volley:1,burst:1,recoil:1.5,mode:'auto'}),action('cam','Three-round cam',300,{damage:30,interval:0.45,volley:1,burst:3,spread:0.6,mode:'burst',burstGap:0.055}),action('duplex','Duplex feed block',300,{damage:11,interval:0.07,volley:2,burst:1,mode:'auto'})],
 [action('rapid','Rapid-pulse capacitor',300,{damage:55,interval:0.45,volley:1,burst:1,mode:'semi'}),action('split','Split-rail assembly',300,{damage:48,interval:1.45,volley:2,burst:1,mode:'semi'}),action('siege','Siege capacitor',300,{damage:110,interval:1.8,volley:1,burst:1,charge:0.5,mode:'charge'})],
 [action('rotary','Rotary breech',300,{damage:60,interval:0.45,volley:1,burst:1,mode:'auto',recoil:1.4,splashDamage:45,blast:4,projectile:1.0}),action('twin','Twin-launch rack',300,{damage:60,interval:1.5,volley:2,burst:1,mode:'semi',splashDamage:45,blast:4,projectile:1.0}),action('pressure','Pressure chamber',300,{damage:125,interval:1.8,volley:1,burst:1,charge:0.55,mode:'charge',splashDamage:50,blast:2.5,projectile:1.5})],
 [action('slamfire','Slamfire carriage',300,{damage:120,interval:0.42,volley:1,burst:1,pellets:12,recoil:1.7,mode:'auto',slamfire:true}),action('double','Double-strike breech',300,{damage:66,interval:1.1,volley:2,burst:1,pellets:12,mode:'semi',falloff:{close:3,far:16,near:1,farScale:0.5}}),action('precision','Precision pump',300,{damage:120,interval:1,volley:1,burst:1,pellets:8,spread:0.5,mode:'semi',core:0.5,precision:true})]
];
const ammunition=[
 [ammo('demolition','Demolition rounds',250,{payload:'explosive',impact:.65,splash:.35,blast:2.5}),ammo('duplex','Duplex cartridges',250,{payload:'duplex',pellets:2,impact:.6,separation:0,adsSeparation:0}),ammo('through','Through-bolts',250,{payload:'penetrator',impact:1,penetration:[1,.8,.6]})],
 [ammo('caps','Demolition caps',250,{payload:'explosive',impact:.7,splash:.3,blast:2}),ammo('penetrator','Machined penetrators',250,{payload:'penetrator',impact:1,penetration:[1,.75]}),ammo('shatter','Shattershot cartridges',250,{payload:'shatter',pellets:3,impact:1.6/3,cone:7,headMultiplier:1,close:4,far:14,farScale:.5})],
 [ammo('frangible','Frangible rounds',250,{payload:'frangible',close:8,far:18,nearScale:1.3,farScale:1}),ammo('microblast','Microblast rounds',250,{payload:'explosive',impact:.7,splash:.3,blast:1.8}),ammo('needle','Needle rounds',250,{payload:'penetrator',impact:1,penetration:[1,.75]})],
 [ammo('arc','Arc conductor',250,{payload:'arc',impact:.8,arc:[.45,.25],arcRange:4}),ammo('flak','Flak lattice',250,{payload:'flak',pellets:5,impact:.26,cone:6,headMultiplier:1}),ammo('pulse','Shaped pulse',250,{payload:'explosive',impact:.65,splash:.4,blast:3})],
 [ammo('airburst','Airburst fuze',250,{payload:'airburst',peak:.8,blast:4.5,proximity:1,arming:2}),ammo('breach','Breach charge',250,{payload:'breach',impact:1,splash:.35,blast:2}),ammo('skip','Skip casing',250,{payload:'skip',fuse:1.2,bounces:1})],
 [ammo('slug','Machined slugs',250,{payload:'slug',pellets:1,impact:.8,close:12,far:30,nearScale:1,farScale:.5,spread:.003}),ammo('frag','Fragmentation shells',250,{payload:'explosive',pellets:6,impact:.07,splash:.38,blast:3}),ammo('flechette','Breacher flechettes',250,{payload:'penetrator',pellets:8,impact:1/8,penetration:[1,.75],cone:2})]
];
const feeds=[
 [feed('sprint','Fifteen-round sprint magazine',150,{mag:15,reload:0.5},'15 rounds · 0.50 s reload'),feed('box','Sixty-round box',150,{mag:60,reload:2.4},'60 rounds · 2.40 s reload'),feed('reservoir','Service-feed reservoir',150,{mag:45,insert:0.03,feedMode:'individual',first:0.3},'45 rounds · first after 0.30 s, then 0.03 s each · interruptible')],
 [feed('speed','Four-round speed clip',150,{mag:4,reload:0.5},'4 rounds · 0.50 s reload'),feed('extended','Twelve-round magazine',150,{mag:12,reload:2.5},'12 rounds · 2.50 s reload'),feed('empty','Empty-drop loader',150,{mag:6,emptyReload:0.65,reload:1.5},'6 rounds · 1.50 s reload')],
 [feed('quick','Eighteen-round quick magazine',150,{mag:18,reload:0.4},'18 rounds · 0.40 s reload'),feed('drum','Eighty-four-round drum',150,{mag:84,reload:2},'84 rounds · 2.00 s reload'),feed('coupled','Coupled magazines',150,{mag:24,feedMode:'coupled',quickReload:0.25,reload:1.2},'24 rounds · 1.20 s reload')],
 [feed('quick','Single-charge quick cell',150,{mag:1,reload:0.65},'1 rounds · 0.65 s reload'),feed('battery','Eight-charge battery',150,{mag:8,reload:3},'8 rounds · 3.00 s reload'),feed('recuperator','Recuperator bank',150,{mag:3,reload:1.8,refund:true},'Direct headshot kills return one charge per trigger; cycle recovery still applies.')],
 [feed('quick','Two-rocket quick rack',150,{mag:2,reload:0.6},'2 rounds · 0.60 s reload'),feed('cassette','Six-rocket cassette',150,{mag:6,reload:2.5},'6 rounds · 2.50 s reload'),feed('recovery','Recovery loader',150,{mag:3,insert:0.55,feedMode:'recovery',reload:1.8},'Loads one rocket every 0.55 s while the trigger is released.')],
 [feed('speed','Four-shell speed tube',150,{mag:4,reload:0.55},'4 rounds · 0.55 s reload'),feed('carrier','Twelve-shell carrier',150,{mag:12,reload:2.4},'12 rounds · 2.40 s reload'),feed('gate','Individual-shell gate',150,{mag:6,first:0.3,feedMode:'individual',insert:0.2},'6 rounds · first after 0.30 s, then 0.20 s each · interruptible')]
];
export const WEAPON_SLOTS=Array.from({length:6},(_,g)=>({action:actions[g],ammunition:ammunition[g],feed:feeds[g],handling:[
 {id:'entry',name:'Entry rig',slot:'handling',price:200,visual:'entry',effects:{},config:{handling:'entry',ads:.5,switch:.5,adsMove:1.3,recoil:1.25},desc:'Half ADS / swap time · +30% ADS movement · +25% recoil'},
 {id:'anchor',name:'Anchor rig',slot:'handling',price:200,visual:'anchor',effects:{},config:{handling:'anchor',ads:1.2},desc:'Still / crouched for 0.25 s: half recoil and spread · slower ADS'},
 {id:'sling',name:'Service sling',slot:'handling',price:200,visual:'sling',effects:{},config:{handling:'sling',reloadScale:1.15},desc:'Holstered reload after 0.6 s · +15% reload time · not for Recovery loader'}],optic:OPTICS}));
for(const [g,slots]of WEAPON_SLOTS.entries())for(const [slot,items]of Object.entries(slots))if(slot!=='optic')for(const a of items){a.key=a.id;a.id=`${g}-${slot}-${a.id}`;if(slot==='action'||slot==='ammunition')a.desc=partCopy(g,a).detail;}
export const SLOT_LABELS={action:'Action',ammunition:'Ammunition',feed:'Feed',handling:'Handling',optic:'Sight'};
export function attachment(g,id){return Object.values(WEAPON_SLOTS[g]||{}).flat().find(a=>a.id===id)||null}
export function gameplayCount(b){return Object.keys(b?.slots||{}).filter(s=>s!=='optic').length}
export function incompatible(g,slots){return attachment(g,slots.feed)?.key==='recovery'&&attachment(g,slots.handling)?.key==='sling'}
export function normalizeBuilds(raw={}){const out={version:2};for(let g=0;g<6;g++){const b=raw?.[g]||{},owned=[...new Set((Array.isArray(b.owned)?b.owned:[]).filter(id=>attachment(g,id)))],slots={};for(const [slot,id]of Object.entries(b.slots||{})){const a=attachment(g,id);if(a?.slot!==slot||slot!=='optic'&&!owned.includes(id))continue;if(slot==='optic'||gameplayCount({slots})<MAX_PARTS)slots[slot]=id;}if(incompatible(g,slots))delete slots.handling;out[g]={owned,slots};}return out;}
export function fitted(g,builds){return Object.values(builds?.[g]?.slots||{}).map(id=>attachment(g,id)).filter(Boolean)}
const statCache=new WeakMap();
export function weaponStats(base,g,builds){
 const signature=Object.values(builds?.[g]?.slots||{}).join('|');let cached=statCache.get(builds);if(cached?.[g]?.base===base&&cached[g].signature===signature)return cached[g].value;
 const parts=fitted(g,builds),kit=Object.fromEntries(parts.map(a=>[a.slot,a])),a=kit.action?.config||{},p=kit.ammunition?.config||{},f=kit.feed?.config||{},h=kit.handling?.config||{};
 const stockBudget=g===5?base.damage*base.pellets:base.damage,budget=a.damage??stockBudget;
 const w={...base,recoil:1,ads:1,move:1,switch:1,core:1,radius:1,projectile:1,selfDamage:1,jump:1,zoom:g===3?2:1,optic:kit.optic||null,reticle:kit.optic?.reticle||null,mode:g===0||g===2?'auto':'semi',burst:1,burstGap:0,volley:1,separation:0,charge:0,damageBudget:budget,stockBudget,actionKey:kit.action?.key||'',handling:h.handling||'',feedMode:f.feedMode||'standard',payload:p.payload||(g===4?'rocket':g===5?'buckshot':'bullet'),penetration:g===3?[1,1,1,1,1,1]:[1],splash:0,blast:g===4?5.5:0,refund:!!f.refund,first:f.first,insert:f.insert,quickReload:f.quickReload,emptyReload:f.emptyReload,slamfire:!!a.slamfire,adsMove:h.adsMove||1,precision:!!a.precision};
 for(const k of ['mode','burst','burstGap','volley','separation','charge','interval'])if(a[k]!==undefined)w[k]=a[k];
 for(const k of ['recoil','ads','move','switch','core','projectile','radius'])w[k]=(a[k]??1)*(f[k]??1)*(h[k]??1);
 w.reload=(f.reload??base.reload)*(h.reloadScale||1);w.emptyReload=f.emptyReload?(f.emptyReload*(h.reloadScale||1)):undefined;w.quickReload=f.quickReload?(f.quickReload*(h.reloadScale||1)):undefined;
 if(w.first!==undefined)w.first*=h.reloadScale||1;if(w.insert!==undefined)w.insert*=h.reloadScale||1;
 w.mag=f.mag??base.mag;w.zoom=kit.optic?.zoom??(g===3?2:1);w.spread=base.spread*(a.spread||1);w.pellets=g===5?(a.pellets||base.pellets):1;w.damage=g===5?budget/w.pellets:budget;
 w.headMultiplier=g===5?1.25:1.5;w.falloff=base.falloff?{...base.falloff}:undefined;if(a.falloff)w.falloff={...a.falloff};
 if(p.payload){w.penetration=p.penetration||[1];w.pellets=p.pellets||1;w.damage=budget*(p.impact??1);w.splash=budget*(p.splash||0);if(p.blast!==undefined)w.blast=p.blast;w.blast*=w.radius;
  if(p.cone)w.spread=Math.tan(p.cone*Math.PI/180)*2*(a.spread||1);if(p.spread!==undefined)w.spread=p.spread*(a.spread||1);
  if(p.payload==='frangible'){w.damage=budget;w.closeBonus={close:p.close,far:p.far,scale:p.nearScale};}
  if(p.headMultiplier!==undefined)w.headMultiplier=p.headMultiplier;
  if(p.payload==='shatter')w.falloff={close:p.close,far:p.far,near:1,farScale:p.farScale};
  if(p.payload==='slug'){w.headMultiplier=1.5;w.falloff={close:a.volley===2?18:p.close,far:a.volley===2?40:p.far,near:1,farScale:p.farScale};}
  if(p.payload==='duplex'){w.payloadSeparation=p.separation;w.adsSeparation=p.adsSeparation;w.spread=base.spread*(a.spread||1);}
  if(p.payload==='arc'){w.arc=p.arc.map(x=>x*budget);w.arcRange=p.arcRange;}
  if(p.payload==='airburst'){w.damage=budget*p.peak;w.proximity=p.proximity;w.arming=p.arming;}
  if(p.payload==='skip'){w.damage=budget;w.fuse=p.fuse;w.bounces=p.bounces;}
 }
 // Shotgun cartridges retain their shared range curve; double-strike extends it.
 // Slugs keep their own, lower direct-hit budget and range curve.
 if(g===5&&p.payload!=='slug')w.falloff=a.falloff||base.falloff||{close:3,far:12,near:1,farScale:.5};
 if(g===4){w.headMultiplier=1;w.blast=p.blast??a.blast??4;w.rocketSplash=a.splashDamage??base.splashDamage??70;if(p.payload==='airburst')w.rocketSplash=w.damage;if(p.payload==='breach')w.rocketSplash=w.splash;}
 // Catalog descriptions never expose internal combat damage units.

 w.ammunition=kit.ammunition?.name||'Standard';w.action=kit.action?.name||'Standard';w.feed=kit.feed?.name||'Standard';w.partCount=parts.filter(x=>x.slot!=='optic').length;
 if(!cached){cached={};statCache.set(builds,cached);}cached[g]={base,signature,value:w};return w;
}
export function previewBuild(builds,g,slot,id){const copy={...builds,[g]:{owned:[...(builds[g]?.owned||[])],slots:{...(builds[g]?.slots||{})}}};if(id){copy[g].slots[slot]=id;if(!copy[g].owned.includes(id))copy[g].owned.push(id)}else delete copy[g].slots[slot];return copy;}
export function fitAttachment(builds,owned,credits,g,slot,id,{replace=null,priceOverride=null}={}){
 if(!owned.includes(g)||!WEAPON_SLOTS[g]?.[slot])return{ok:false,credits,reason:'Weapon or slot unavailable'};const item=id?attachment(g,id):null;if(id&&item?.slot!==slot)return{ok:false,credits,reason:'Unknown part'};
 const b=builds[g]||(builds[g]={owned:[],slots:{}}),slots={...b.slots};if(replace&&replace!==slot&&replace!=='optic')delete slots[replace];if(item)slots[slot]=id;else delete slots[slot];
 if(gameplayCount({slots})>MAX_PARTS)return{ok:false,credits,reason:'Choose a fitted part to remove',needsReplacement:true};if(incompatible(g,slots))return{ok:false,credits,reason:'Service sling cannot be fitted with Recovery loader'};
 const price=item&&!b.owned.includes(id)?(priceOverride??item.price):0;if(credits<price)return{ok:false,credits,reason:'Not enough credits'};
 if(item&&!b.owned.includes(id))b.owned.push(id);b.slots=slots;builds.version=2;return{ok:true,credits:credits-price,price};
}
export function effectLines(a){if(!a)return[];if(a.slot==='optic')return[{text:a.zoom+'× · free sight preference',good:true}];return[{text:a.desc,good:true}];}
// Keep old purchase data solely for idempotent migration; it is not in the new shop.
const feedMap=[{extended:'box',fast:'sprint',drum:'box'},{extended:'extended',fast:'speed',deep:'extended'},{extended:'drum',fast:'quick',drum:'drum'},{extended:'battery',fast:'quick',reserve:'battery'},{extended:'cassette',fast:'quick'},{extended:'carrier',fast:'speed',balanced:'carrier'}];
export function migrateLoadoutSave(saved){
 if(!saved)return saved;
 // Retired gear is stripped and refunded once; the cleaned save is idempotent.
 const retired={frag:0,impact:180,quick:160},gear=saved.equipment||{},oldOwned=Array.isArray(gear.owned)?gear.owned:[];
 if('throwable' in gear||oldOwned.some(id=>id in retired)||'frags' in (saved.perks||{})){
  const refund=[...new Set(oldOwned)].reduce((sum,id)=>sum+(retired[id]||0),0)+(saved.perks?.frags?160:0),perks={...saved.perks};delete perks.frags;
  saved={...saved,perks,equipment:normalizeEquipment(gear),credits:(saved.credits||0)+refund,shopOffers:null,migrationRefund:(saved.migrationRefund||0)+refund};
 }
 if(saved.attachmentVersion===2||saved.builds?.version===2)return saved;
 const raw=saved.builds||{},out=normalizeBuilds(raw);let refund=0;
 for(let g=0;g<6;g++){const b=raw[g]||{},owned=[...new Set(Array.isArray(b.owned)?b.owned:[])];for(const id of owned){const old=legacyAttachment(g,id);if(!old)continue;const k=id.split('-').at(-1),mapped=feedMap[g][k],isFeed=['magazine','loader','tube'].includes(old.slot);
   if(isFeed&&mapped){const a=WEAPON_SLOTS[g].feed.find(x=>x.key===mapped);if(a&&!out[g].owned.includes(a.id))out[g].owned.push(a.id);if(b.slots?.[old.slot]===id)out[g].slots.feed=a.id;}
   else refund+=old.price;
  }
  const optic=b.slots?.optic;if(OPTICS.some(x=>x.id===optic))out[g].slots.optic=optic;
 }
 return{...saved,builds:out,attachmentVersion:2,credits:(saved.credits||0)+refund,shopOffers:null,migrationRefund:refund};
}
export function migrateBuilds(raw,perks,owned){if(raw?.version===2)return normalizeBuilds(raw);const old=legacyBuilds(raw,perks,owned);return migrateLoadoutSave({builds:old,credits:0}).builds;}
