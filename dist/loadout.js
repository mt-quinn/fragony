import {WEAPON_SLOTS as LEGACY_SLOTS,OPTICS as LEGACY_OPTICS,attachment as legacyAttachment,migrateBuilds as legacyBuilds} from './legacy-loadout.js';
export {EQUIPMENT,normalizeEquipment} from './legacy-loadout.js';
export const ATTACHMENT_VERSION=2,MAX_PARTS=3;
export const OPTICS=LEGACY_OPTICS.map(a=>({...a,price:0,effects:{}}));
const action=(id,name,price,config,desc)=>({id,name,price,config,desc,slot:'action',effects:{},visual:id});
const ammo=(id,name,price,config,desc)=>({id,name,price,config,desc,slot:'ammunition',effects:{},visual:id});
const feed=(id,name,price,config,desc)=>({id,name,price,config,desc,slot:'feed',effects:{},visual:id});
// Paired shots share the crosshair; ordinary weapon/pellet spread still applies.
// Ammunition cost, cycle time and damage provide the tradeoffs, not a forced miss.
const actions=[
 [action('overdrive','Overdrive carrier',380,{mode:'auto',interval:.065,damage:17,recoil:1.5},'Double fire rate · 17 damage · +50% recoil'),action('ratchet','Three-round ratchet',400,{mode:'burst',burst:3,burstGap:.11,interval:.48,damage:28},'3 × 28 damage · 0.11 s shot spacing · 0.48 s burst cycle'),action('surveyor','Surveyor receiver',340,{mode:'semi',damage:58,interval:.25,spread:.5,recoil:1.3},'58 damage · semi-auto · half spread · +30% recoil')],
 [action('riveter','Riveter action',320,{mode:'auto',interval:.2,damage:33,recoil:.6},'300 RPM automatic · 33 damage · −40% recoil'),action('twin','Twinstrike block',360,{mode:'semi',volley:2,separation:0,damage:32,interval:.7,recoil:1.35},'2 × 32 simultaneous damage · uses 2 rounds · +35% recoil'),action('hammerfall','Hammerfall action',380,{mode:'burst',burst:2,burstGap:.18,damage:45,interval:.75,recoil:1.2},'2 × 45 burst · 0.18 s shot spacing · 0.75 s cycle')],
 [action('overspeed','Overspeed bolt',360,{mode:'auto',interval:.0275,damage:9,recoil:1.5},'Double fire rate · 9 damage · +50% recoil'),action('cam','Three-round cam',340,{mode:'burst',burst:3,burstGap:.08,interval:.3,damage:18,spread:.6},'3 × 18 burst · 0.08 s spacing · 0.30 s burst cycle'),action('duplex','Duplex feed block',360,{mode:'auto',volley:2,separation:0,damage:10,interval:.07},'2 × 10 simultaneous damage · uses 2 rounds · shared aim point')],
 [action('rapid','Rapid-pulse capacitor',380,{mode:'semi',interval:.675,damage:70},'Double fire rate · 70 body / 105 head damage'),action('split','Split-rail assembly',400,{mode:'semi',volley:2,separation:0,interval:1.6,damage:40},'2 × 40 simultaneous rails · uses 2 charges · 1.60 s cycle'),action('siege','Siege capacitor',420,{mode:'charge',charge:.45,interval:1.8,damage:90,recoil:1.5},'0.45 s charge · 90 body / 135 head damage · 1.80 s total cycle')],
 [action('rotary','Rotary breech',400,{mode:'auto',interval:.425,damage:60,recoil:1.4},'Double fire rate · 60 peak damage · +40% recoil'),action('twin','Twin-launch rack',400,{mode:'semi',volley:2,separation:0,interval:1.25,damage:40},'2 × 40 rockets · uses 2 rounds · 1.25 s cycle'),action('pressure','Pressure chamber',420,{mode:'charge',charge:.4,interval:1.4,damage:90,projectile:1.5,radius:.8},'Hold / release · 0.40 s charge · 90 damage · smaller blast')],
 [action('slamfire','Slamfire carriage',380,{mode:'auto',interval:.415,slamfire:true,recoil:1.7},'Double fire rate · full shell damage · recoil / spread build while firing; release to recover'),action('double','Double-strike breech',380,{mode:'semi',volley:2,separation:0,interval:1.1,damage:54},'2 shells at once · 108 total close damage · shared aim point'),action('precision','Precision pump',300,{mode:'semi',interval:1.05,damage:108,pellets:8,spread:.5,core:.5,precision:true},'8 × 13.5 tight-core pellets · half spread · slower pump')]
];
const ammunition=[
 [ammo('demolition','Demolition rounds',300,{payload:'explosive',impact:.65,splash:.35,blast:1.5},'65% impact + 35% splash · 1.5 m blast'),ammo('duplex','Duplex cartridges',280,{payload:'duplex',pellets:2,impact:.5,separation:0,adsSeparation:0},'Two bullets per cartridge · each deals 50% damage · shared aim point'),ammo('through','Through-bolts',260,{payload:'penetrator',impact:1,penetration:[1,.7,.4]},'Full first-target damage · pierces 3 opponents: 100 / 70 / 40%')],
 [ammo('caps','Demolition caps',280,{payload:'explosive',impact:.7,splash:.3,blast:1.25},'70% impact + 30% splash · 1.25 m blast'),ammo('penetrator','Machined penetrators',240,{payload:'penetrator',impact:1,penetration:[1,.6]},'Full first-target damage · second opponent takes 60%'),ammo('shatter','Shattershot cartridges',280,{payload:'shatter',pellets:3,impact:.3,cone:7},'Three fragments at 30% damage each · 7° cone')],
 [ammo('frangible','Frangible rounds',250,{payload:'frangible',close:8,far:18,nearScale:1.35,farScale:.55},'+35% damage inside 8 m · falls to 55% damage at 18 m'),ammo('microblast','Microblast rounds',300,{payload:'explosive',impact:.7,splash:.3,blast:.8},'70% impact + 30% splash · 0.8 m blast'),ammo('needle','Needle rounds',240,{payload:'penetrator',impact:1,penetration:[1,.6]},'Full first-target damage · second opponent takes 60%')],
 [ammo('arc','Arc conductor',340,{payload:'arc',impact:.75,arc:[.3,.15],arcRange:3},'75% direct · jumps to 2 visible opponents for 30 / 15%'),ammo('flak','Flak lattice',300,{payload:'flak',pellets:5,impact:.2,cone:6},'5 flechettes at 20% damage each · replaces piercing'),ammo('pulse','Shaped pulse',320,{payload:'explosive',impact:.65,splash:.4,blast:2.25},'65% impact + 40% splash · 2.25 m blast · no piercing')],
 [ammo('airburst','Airburst fuze',320,{payload:'airburst',peak:.8,blast:4.5,proximity:1,arming:2},'Proximity detonation after 2 m · 80% peak · 4.5 m blast'),ammo('breach','Breach charge',300,{payload:'breach',impact:.9,splash:.2,blast:2},'90% direct contact + 20% splash · 2 m blast'),ammo('skip','Skip casing',280,{payload:'skip',fuse:1.2,bounces:1},'Bounces off first wall · detonates on next contact / 1.2 s fuse')],
 [ammo('slug','Machined slugs',280,{payload:'slug',pellets:1,impact:.8,close:12,far:30,nearScale:1,farScale:.65,spread:.003},'One accurate slug · 86.4 stock damage to 12 m, 56.2 at 30 m'),ammo('frag','Fragmentation shells',320,{payload:'explosive',pellets:6,impact:.07,splash:.31,blast:2},'6 fragments + one blast per shell · ~79 stock total'),ammo('flechette','Breacher flechettes',280,{payload:'penetrator',pellets:8,impact:1/8,penetration:[1,.6],cone:2},'Full 108 close-range shell budget · tight flechettes · second target takes 60%')]
];
const feeds=[
 [feed('sprint','Fifteen-round sprint magazine',150,{mag:15,reload:.55},'15 rounds · 0.55 s reload'),feed('box','Sixty-round box',210,{mag:60,reload:2.4,move:.9},'60 rounds · 2.40 s reload · −10% movement'),feed('reservoir','Service-feed reservoir',200,{mag:45,reload:2.025,feedMode:'individual',first:.45,insert:.035},'45 rounds · 0.45 s start then 0.035 s per round · interruptible')],
 [feed('speed','Four-round speed clip',150,{mag:4,reload:.55},'4 rounds · 0.55 s reload'),feed('extended','Twelve-round magazine',200,{mag:12,reload:2.2,ads:1.2},'12 rounds · 2.20 s reload · +20% aim time'),feed('empty','Empty-drop loader',180,{mag:7,reload:1.9,emptyReload:.75},'7 rounds · 0.75 s empty / 1.90 s tactical reload')],
 [feed('quick','Twelve-round quick magazine',140,{mag:12,reload:.35},'12 rounds · 0.35 s reload'),feed('drum','Ninety-six-round drum',220,{mag:96,reload:2.2,move:.88,ads:1.25},'96 rounds · 2.20 s reload · −12% movement · slower ADS'),feed('coupled','Coupled magazines',190,{mag:24,reload:1.4,feedMode:'coupled',quickReload:.25},'24 rounds · alternates 0.25 / 1.40 s reloads')],
 [feed('quick','Single-charge quick cell',160,{mag:1,reload:.75},'1 charge · 0.75 s reload · cycle recovery still applies'),feed('battery','Eight-charge battery',220,{mag:8,reload:3.4,move:.9,ads:1.2},'8 charges · 3.40 s reload · slower movement / ADS'),feed('recuperator','Recuperator bank',220,{mag:3,reload:2,refund:true},'3 charges · direct headshot kill returns 1 charge per trigger')],
 [feed('quick','Two-rocket quick rack',160,{mag:2,reload:.65},'2 rockets · 0.65 s reload'),feed('cassette','Eight-rocket cassette',220,{mag:8,reload:3,move:.85},'8 rockets · 3.00 s reload · −15% movement'),feed('recovery','Recovery loader',220,{mag:3,reload:1.8,feedMode:'recovery',insert:.6},'3 rockets · loads one every 0.60 s while trigger released')],
 [feed('speed','Four-shell speed tube',150,{mag:4,reload:.65},'4 shells · 0.65 s reload'),feed('carrier','Twelve-shell carrier',210,{mag:12,reload:2.4,move:.92},'12 shells · 2.40 s reload · −8% movement'),feed('gate','Individual-shell gate',180,{mag:6,reload:1.45,feedMode:'individual',first:.35,insert:.22},'6 shells · 0.35 s first shell, then 0.22 s each · interruptible')]
];
export const WEAPON_SLOTS=Array.from({length:6},(_,g)=>({action:actions[g],ammunition:ammunition[g],feed:feeds[g],handling:[
 {id:'entry',name:'Entry rig',slot:'handling',price:200,visual:'entry',effects:{},config:{handling:'entry',ads:.5,switch:.5,adsMove:1.3,recoil:1.3},desc:'Half ADS / swap time · +30% ADS movement · +30% recoil'},
 {id:'anchor',name:'Anchor rig',slot:'handling',price:180,visual:'anchor',effects:{},config:{handling:'anchor',ads:1.2},desc:'Still / crouched for 0.25 s: half recoil and spread · slower ADS'},
 {id:'sling',name:'Service sling',slot:'handling',price:240,visual:'sling',effects:{},config:{handling:'sling',reloadScale:1.2},desc:'Holstered reload after 1 s · +20% reload time · not for Recovery loader'}],optic:OPTICS}));
for(const [g,slots]of WEAPON_SLOTS.entries())for(const [slot,items]of Object.entries(slots))if(slot!=='optic')for(const a of items){a.key=a.id;a.id=`${g}-${slot}-${a.id}`;}
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
 const w={...base,recoil:1,ads:1,move:1,switch:1,core:1,radius:1,projectile:1,selfDamage:1,jump:1,zoom:g===3?2:1,optic:kit.optic||null,reticle:kit.optic?.reticle||null,mode:g===0||g===2?'auto':'semi',burst:1,burstGap:0,volley:1,separation:0,charge:0,damageBudget:budget,stockBudget,handling:h.handling||'',feedMode:f.feedMode||'standard',payload:p.payload||(g===4?'rocket':g===5?'buckshot':'bullet'),penetration:g===3?[1,1,1,1,1,1]:[1],splash:0,blast:g===4?5.5:0,refund:!!f.refund,first:f.first,insert:f.insert,quickReload:f.quickReload,emptyReload:f.emptyReload,slamfire:!!a.slamfire,adsMove:h.adsMove||1,precision:!!a.precision};
 for(const k of ['mode','burst','burstGap','volley','separation','charge','interval'])if(a[k]!==undefined)w[k]=a[k];
 for(const k of ['recoil','ads','move','switch','core','projectile','radius'])w[k]=(a[k]??1)*(f[k]??1)*(h[k]??1);
 w.reload=(f.reload??base.reload)*(h.reloadScale||1);w.emptyReload=f.emptyReload?(f.emptyReload*(h.reloadScale||1)):undefined;w.quickReload=f.quickReload?(f.quickReload*(h.reloadScale||1)):undefined;
 if(w.first!==undefined)w.first*=h.reloadScale||1;if(w.insert!==undefined)w.insert*=h.reloadScale||1;
 w.mag=f.mag??base.mag;w.zoom=kit.optic?.zoom??(g===3?2:1);w.spread=base.spread*(a.spread||1);w.pellets=g===5?(a.pellets||base.pellets):1;w.damage=g===5?budget/w.pellets:budget;
 if(p.payload){w.penetration=p.penetration||[1];w.pellets=p.pellets||1;w.damage=budget*(p.impact??1);w.splash=budget*(p.splash||0);if(p.blast!==undefined)w.blast=p.blast;w.blast*=w.radius;
  if(p.cone)w.spread=Math.tan(p.cone*Math.PI/180)*2*(a.spread||1);if(p.spread!==undefined)w.spread=p.spread*(a.spread||1);
  if(p.payload==='frangible'){w.damage=budget;w.falloff={close:p.close,far:p.far,near:p.nearScale,farScale:p.farScale};}
  if(p.payload==='slug')w.falloff={close:p.close,far:p.far,near:1,farScale:p.farScale};
  if(p.payload==='duplex'){w.payloadSeparation=p.separation;w.adsSeparation=p.adsSeparation;w.spread=base.spread*(a.spread||1);}
  if(p.payload==='arc'){w.arc=p.arc.map(x=>x*budget);w.arcRange=p.arcRange;}
  if(p.payload==='airburst'){w.damage=budget*p.peak;w.proximity=p.proximity;w.arming=p.arming;}
  if(p.payload==='skip'){w.damage=budget;w.fuse=p.fuse;w.bounces=p.bounces;}
 }
 // Shotgun shell budgets fall from 108 at 2 m to 64.8 at 12 m.
 // Slugs keep their own, lower direct-hit budget and range curve.
 if(g===5&&p.payload!=='slug')w.falloff={close:2,far:12,near:1,farScale:.6};
 if(g===4&&!p.payload){w.damage=budget;w.blast=5.5*w.radius;}
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
 if(!saved||saved.attachmentVersion===2||saved.builds?.version===2)return saved;
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
