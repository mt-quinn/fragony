import {WEAPON_SLOTS,OPTICS,attachment,EQUIPMENT} from './loadout.js';
const shuffle=(items,random)=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
export function createShopOffers({round,owned,builds,perks,equipment,weapons,upgrades},random=Math.random){
 const guns=shuffle(weapons.map((_,i)=>i).filter(i=>!owned.includes(i)),random).slice(0,2);
 const mods=shuffle(owned.flatMap(gun=>Object.values(WEAPON_SLOTS[gun]).flat().filter(a=>!builds[gun]?.owned.includes(a.id)).map(a=>({gun,id:a.id,slot:a.slot}))),random),parts=[],slots=new Set(),counts=new Map();
 const add=p=>{parts.push({gun:p.gun,id:p.id});slots.add(p.gun+':'+p.slot);counts.set(p.gun,(counts.get(p.gun)||0)+1)};
 const optic=mods.find(p=>p.slot==='optic');if(optic)add(optic);
 while(parts.length<4){const eligible=mods.filter(p=>!slots.has(p.gun+':'+p.slot));if(!eligible.length)break;eligible.sort((a,b)=>(counts.get(a.gun)||0)-(counts.get(b.gun)||0));add(eligible[0])}
 const perkIds=shuffle(upgrades.filter(u=>u.category==='PERK'&&!perks[u.id]).map(u=>u.id),random).slice(0,2);
 const throwables=[...EQUIPMENT.throwable.filter(x=>!equipment.owned.includes(x.id)).map(x=>'throwable:'+x.id),...(!perks.frags?['perk:frags']:[])];
 const streaks=EQUIPMENT.streak.filter(x=>!equipment.owned.includes(x.id)).map(x=>'streak:'+x.id);
 return{version:1,round,weapons:guns,attachments:parts,perks:perkIds,equipment:[...shuffle(throwables,random).slice(0,1),...shuffle(streaks,random).slice(0,1)]};
}
export function validShopOffers(o,round){return o?.version===1&&o.round===round&&Array.isArray(o.weapons)&&o.weapons.length<=2&&o.weapons.every(g=>Number.isInteger(g)&&g>=0&&g<6)&&Array.isArray(o.attachments)&&o.attachments.length<=4&&o.attachments.every(p=>Number.isInteger(p.gun)&&p.gun>=0&&p.gun<6&&attachment(p.gun,p.id))&&Array.isArray(o.perks)&&o.perks.length<=2&&o.perks.every(id=>['reload','speed','armor','focus','quickdraw','recovery'].includes(id))&&Array.isArray(o.equipment)&&o.equipment.length<=2&&o.equipment.every(id=>id==='perk:frags'||Object.entries(EQUIPMENT).some(([k,items])=>items.some(a=>k+':'+a.id===id)))}
export function offeredPart(offers,gun,id){return offers?.attachments.some(p=>p.gun===gun&&p.id===id)||false}
export function offeredUpgrade(offers,id){return id.startsWith('gun')?offers?.weapons.includes(Number(id.slice(3))):id==='frags'?offers?.equipment.includes('perk:frags'):offers?.perks.includes(id)}
