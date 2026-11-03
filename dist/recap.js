export const BODY_PARTS=['head','torso','pelvis','leftArm','rightArm','leftLeg','rightLeg'];
const emptyParts=()=>Object.fromEntries(BODY_PARTS.map(p=>[p,0]));
export class DamageHistory{
 constructor(){this.clear()}
 clear(){this.sources=new Map()}
 record(id,name,weapon,amount,parts=[{part:'torso',damage:amount}]){
  if(!(amount>0))return;let row=this.sources.get(id);if(!row){row={id,name,damage:0,hits:0,parts:emptyParts(),weapons:{}};this.sources.set(id,row)}
  const total=parts.reduce((n,p)=>n+p.damage,0)||amount;row.damage+=amount;row.hits+=parts.length;row.weapons[weapon]=(row.weapons[weapon]||0)+amount;
  for(const p of parts)row.parts[BODY_PARTS.includes(p.part)?p.part:'torso']+=p.damage/total*amount;
 }
 snapshot(id){const rows=[...this.sources.values()].filter(r=>id==null||r.id===id);return rows.map(r=>({...r,parts:{...r.parts},weapons:{...r.weapons}}))}
}
export function bodyPartAt(point,eye,yaw,eyeHeight=1.7){const h=(point.y-(eye.y-eyeHeight))/(eyeHeight+.12)*1.82,x=(point.x-eye.x)*Math.cos(yaw)-(point.z-eye.z)*Math.sin(yaw);return h>1.48?'head':h<.72?(x<0?'leftLeg':'rightLeg'):h<.88?'pelvis':Math.abs(x)>.23?(x<0?'leftArm':'rightArm'):'torso'}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.round(v||0);
export function paperdoll(parts={},outgoing=false){
 const shapes={head:'<circle cx="44" cy="13" r="10"/>',torso:'<path d="M32 28 56 28 59 65 29 65Z"/>',pelvis:'<path d="M29 69H59L55 84H33Z"/>',leftArm:'<rect x="14" y="29" width="12" height="47" rx="5"/>',rightArm:'<rect x="62" y="29" width="12" height="47" rx="5"/>',leftLeg:'<rect x="29" y="88" width="13" height="51" rx="5"/>',rightLeg:'<rect x="46" y="88" width="13" height="51" rx="5"/>'},labels={head:[44,16],torso:[44,50],pelvis:[44,79],leftArm:[20,54],rightArm:[68,54],leftLeg:[35,117],rightLeg:[52,117]},max=Math.max(1,...Object.values(parts));
 return `<svg viewBox="0 0 88 146" role="img" aria-label="${outgoing?'Your hits on killer':'Hits on you'}">${BODY_PARTS.map(part=>`<g class="${parts[part]>0?'struck':''}" style="--part-color:${outgoing?'#d9ef45':`hsl(${40-36*(parts[part]||0)/max} 92% 65%)`}">${shapes[part]}${parts[part]>0?`<text x="${labels[part][0]}" y="${labels[part][1]}">${n(parts[part])}</text>`:''}</g>`).join('')}</svg>`;
}
export function recapHTML(recap){
 const parts=emptyParts();for(const a of recap.attackers)for(const p of BODY_PARTS)parts[p]+=a.parts[p]||0;
 const kit=recap.killer?.loadout;
 const loadout=kit?`<section class="recap-loadout" aria-label="Killer's weapon loadout"><div><small>KILLER’S GUN</small><strong>${escape(kit.weapon)}</strong></div><ul>${kit.attachments.length?kit.attachments.map(a=>`<li><small>${escape(a.slot)}</small> ${escape(a.name)}</li>`).join(''):'<li class="recap-stock">Stock · no attachments</li>'}</ul></section>`:'';
 const outgoing=recap.outgoing||{damage:0,hits:0,parts:emptyParts(),weapons:{}};
 return `<div class="recap-heading"><span>${recap.killer?'KILLED BY':'ELIMINATED'}</span><strong>${escape(recap.killer?.name||'THE ARENA')}</strong><span class="recap-timer">RESPAWN <b id="recap-countdown">2.2</b></span></div><div class="recap-body"><div class="recap-doll"><b>YOU</b>${paperdoll(parts)}<small>HITS TAKEN</small></div><div class="recap-details"><div class="recap-table-head"><span>ATTACKERS · ${recap.attackers.length}</span><span>DMG</span><span>HITS</span></div>${recap.attackers.sort((a,b)=>Number(b.id===recap.killer?.id)-Number(a.id===recap.killer?.id)||b.damage-a.damage).map(a=>`<div class="recap-attacker ${a.id===recap.killer?.id?'final-hit':''}"><div><b>${a.id===recap.killer?.id?'◆ ':''}${escape(a.name)}</b><small>${escape(Object.keys(a.weapons).join(' / '))}</small></div><strong>${n(a.damage)}</strong><span>${a.hits}</span></div>`).join('')}<div class="recap-return"><small>YOU → ${escape(recap.killer?.name||'ARENA')}</small><strong>${n(outgoing.damage)} <small>DMG</small> &nbsp; ${outgoing.hits} <small>HITS</small></strong><span>${escape(Object.keys(outgoing.weapons).join(' / '))}</span></div></div><div class="recap-doll killer"><b>${recap.killer?'KILLER':'—'}</b>${paperdoll(outgoing.parts,true)}<small>${recap.killer?`${n(recap.killer.health)} HP`:''}</small></div></div>${loadout}<div class="recap-progress"><i id="recap-progress"></i></div>`;
}
