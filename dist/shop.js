import {WEAPON_SLOTS,attachment,EQUIPMENT} from './loadout.js';
const shuffle=(items,random)=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
export function createShopOffers({round,owned,builds,perks,equipment,weapons,upgrades,pinnedOffer=null,starterConversionUsed=false},random=Math.random){
 const guns=shuffle(weapons.map((_,i)=>i).filter(i=>!owned.includes(i)),random).slice(0,2),parts=[],counts=new Map();
 const available=shuffle(owned.flatMap(g=>Object.values(WEAPON_SLOTS[g]).flat().filter(a=>a.slot!=='optic'&&!builds[g]?.owned.includes(a.id)).map(a=>({gun:g,id:a.id,slot:a.slot}))),random);
 const add=p=>{parts.push({gun:p.gun,id:p.id});counts.set(p.gun,(counts.get(p.gun)||0)+1)};
 const pin=available.find(p=>p.gun===pinnedOffer?.gun&&p.id===pinnedOffer?.id);if(pin){add(pin);if(pinnedOffer.starter&&!starterConversionUsed){parts[0].price=150;parts[0].starter=true;}}
 for(const slots of [['action'],['ammunition'],['feed','handling']]){
  while(parts.filter(p=>slots.includes(attachment(p.gun,p.id).slot)).length<2){const choices=available.filter(p=>slots.includes(p.slot)&&!parts.some(v=>v.gun===p.gun&&v.id===p.id));if(!choices.length)break;choices.sort((a,b)=>(counts.get(a.gun)||0)-(counts.get(b.gun)||0));add(choices[0]);}
 }
 while(parts.length<6){const remaining=available.filter(p=>!parts.some(v=>v.gun===p.gun&&v.id===p.id));if(!remaining.length)break;remaining.sort((a,b)=>(counts.get(a.gun)||0)-(counts.get(b.gun)||0));add(remaining[0]);}
 if(round===1&&!starterConversionUsed){const starter=parts.find(p=>['action','ammunition'].includes(attachment(p.gun,p.id).slot));if(starter){starter.price=150;starter.starter=true;}}
 const perkIds=shuffle(upgrades.filter(u=>u.category==='PERK'&&!perks[u.id]).map(u=>u.id),random).slice(0,2),throwables=[...EQUIPMENT.throwable.filter(x=>!equipment.owned.includes(x.id)).map(x=>'throwable:'+x.id),...(!perks.frags?['perk:frags']:[])],streaks=EQUIPMENT.streak.filter(x=>!equipment.owned.includes(x.id)).map(x=>'streak:'+x.id);
 return{version:2,round,weapons:guns,attachments:parts,perks:perkIds,equipment:[...shuffle(throwables,random).slice(0,1),...shuffle(streaks,random).slice(0,1)]};
}
export function validShopOffers(o,round){return o?.version===2&&o.round===round&&Array.isArray(o.weapons)&&o.weapons.length<=2&&o.weapons.every(g=>Number.isInteger(g)&&g>=0&&g<6)&&Array.isArray(o.attachments)&&o.attachments.length<=6&&o.attachments.every(p=>Number.isInteger(p.gun)&&p.gun>=0&&p.gun<6&&attachment(p.gun,p.id)?.slot!=='optic'&&!!attachment(p.gun,p.id)&&(p.price===undefined||p.starter===true&&p.price===150))&&new Set(o.attachments.map(p=>p.gun+':'+p.id)).size===o.attachments.length&&Array.isArray(o.perks)&&o.perks.length<=2&&o.perks.every(id=>['reload','speed','armor','focus','quickdraw','recovery'].includes(id))&&Array.isArray(o.equipment)&&o.equipment.length<=2&&o.equipment.every(id=>id==='perk:frags'||Object.entries(EQUIPMENT).some(([k,items])=>items.some(a=>k+':'+a.id===id)))}
export function offeredPart(offers,g,id){return offers?.attachments.some(p=>p.gun===g&&p.id===id)||false}
export function offeredUpgrade(offers,id){return id.startsWith('gun')?offers?.weapons.includes(Number(id.slice(3))):id==='frags'?offers?.equipment.includes('perk:frags'):offers?.perks.includes(id)}
