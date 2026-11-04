// Combat uses internal durability; all presentation and scoring use base-100 units.
export const BALANCE=Object.freeze({playerHP:200,botHP:90,armor:1.2,maxPerks:2,killCredits:10,assistCredits:5,focusKill:8,focusDrain:40,focusRegen:8,focusDelay:2,worldSlow:.5});
export const PERK_IDS=['reload','speed','armor','focus','quickdraw','recovery'];
export const toDisplay=(amount,base=100)=>amount*100/base;
export const fromDisplay=(amount,base=100)=>amount*base/100;
export const maxHealth=(base,perks={})=>base*(perks.armor?BALANCE.armor:1);
export const activePerks=perks=>PERK_IDS.filter(id=>perks?.[id]===true);
// False means purchased but inactive. Retain old saves without stacking six effects.
export function normalizePerks(raw={}){const out={};let active=0;for(const id of PERK_IDS)if(id in raw){out[id]=raw[id]===true&&active<BALANCE.maxPerks;if(out[id])active++;}return out;}
export function equipPerk(perks,id){if(!PERK_IDS.includes(id))return null;const active=activePerks(perks);let removed=null;if(!perks[id]&&active.length>=BALANCE.maxPerks){removed=active[0];perks[removed]=false;}perks[id]=true;return removed;}
export function displayedHistory(rows,base){return rows.map(row=>({...row,damage:toDisplay(row.damage,base),parts:Object.fromEntries(Object.entries(row.parts).map(([k,v])=>[k,toDisplay(v,base)])),weapons:Object.fromEntries(Object.entries(row.weapons).map(([k,v])=>[k,toDisplay(v,base)]))}));}
export function weaponEngagement(w,type){
 let ideal={rifle:16,pistol:12,smg:9,rail:25,rocket:15,shotgun:5}[type]||12;
 if(w.payload==='slug')ideal=14;if(['shatter','flak'].includes(w.payload))ideal=6;
 if(w.mode==='charge')ideal=Math.max(ideal,18);if(w.actionKey==='surveyor')ideal=23;
 if(type==='shotgun'&&w.actionKey==='double'&&w.payload!=='slug')ideal=8;
 const range=w.falloff?.far||({rail:90,rocket:40}[type]||40);
 return{idealRange:ideal,range,burst:type==='rifle'?2:type==='smg'?4:1,rest:.5};
}
