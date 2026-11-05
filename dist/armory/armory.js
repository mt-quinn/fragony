import {PARTS,INITIAL_KIT,INITIAL_OWNED,OFFERS,clone,same,resolve} from './model.js';
import {createArmoryState} from './armory-state.js';
import {createViewer} from './viewer.js';

export async function mountArmory(config={}){
const $=id=>document.getElementById(id),slots=['mechanism','barrel','ammo','circuit'];
const ranks=['Common','Rare','Epic','Legendary'],colors=['#d2d4be','#a4d6ed','#d6b6f1','#f4d889'];
const query=new URLSearchParams(location.search),maxed=!!config.complete||query.get('scene')==='maxed',tokens=query.get('scene')==='tokens';
const initialOwned=clone(config.collection?.owned||INITIAL_OWNED),initialKit=clone(config.collection?.kit||INITIAL_KIT);
if(maxed){for(const id of Object.keys(PARTS))initialOwned[id]=3;for(const slot of slots)initialKit[slot].rank=3;}
const initialOffers=config.offers|| (maxed?[]:query.get('scene')==='review'?Object.keys(PARTS).map(id=>({id,rank:3})):tokens?OFFERS:OFFERS.slice(0,3));
const store=createArmoryState(initialKit,initialOwned,initialOffers),{owned,offers,state,effectiveOwned,itemList,previewKit}=store;
if(config.draft){const d=config.draft;if(d.claim&&offers.some(p=>same(p,d.claim))){state.claim=clone(d.claim);const old=d.replaced;state.replaced=old&&initialOwned[old.id]===old.rank?clone(old):clone(initialKit[PARTS[d.claim.id].slot]);}
 const available=effectiveOwned();for(const slot of slots){const p=d.kit?.[slot];if(PARTS[p?.id]?.slot===slot&&available[p.id]===p.rank)state.kit[slot]=clone(p);}
 if(d.mode==='owned'&&slots.includes(d.slot))store.browse(d.slot);if(d.preview&&itemList().some(p=>same(p,d.preview)))state.preview=clone(d.preview);if(d.draftFocus&&offers.some(p=>same(p,d.draftFocus)))state.draftFocus=clone(d.draftFocus);
}
if(config.freeEquip)store.browse('mechanism');
document.querySelector('h1').textContent=config.title||'Round '+(config.round||6);
$('exit-armory').hidden=!config.onExit;$('exit-armory').onclick=()=>config.onExit?.(clone(state));
if(config.muted)$('armory').dataset.muted='true';

const paths={
 automatic:'<path d="M5 12h26m-7-6 7 6-7 6M5 25h26m-7-6 7 6-7 6"/>',semi:'<path d="M7 8h22v9H18l-3 15H7l4-15H7z"/>',burst:'<path d="M6 30V11l4-7 4 7v19zm12 0V11l4-7 4 7v19zm12 0V11l4-7 4 7v19z"/>',charge:'<circle cx="20" cy="20" r="14"/><path d="m22 8-8 14h8l-4 11 10-16h-9z"/>',
 single:'<circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="6"/>',double:'<circle cx="11" cy="20" r="8"/><circle cx="29" cy="20" r="8"/>',huge:'<circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="10"/>',gatling:'<circle cx="20" cy="20" r="16"/><circle cx="20" cy="11" r="3"/><circle cx="28" cy="16" r="3"/><circle cx="28" cy="25" r="3"/><circle cx="20" cy="29" r="3"/><circle cx="12" cy="25" r="3"/><circle cx="12" cy="16" r="3"/>',rails:'<path d="M9 5v30h6V5zm17 0v30h6V5zM19 12h4m-4 8h4m-4 8h4"/>',
 normal:'<path d="M13 33V13l7-10 7 10v20zM13 26h14"/>',pellets:'<circle cx="20" cy="8" r="3"/><circle cx="8" cy="20" r="3"/><circle cx="32" cy="20" r="3"/><circle cx="20" cy="32" r="3"/><circle cx="17" cy="17" r="2"/><circle cx="23" cy="23" r="2"/><circle cx="17" cy="23" r="2"/><circle cx="23" cy="17" r="2"/>',sniper:'<path d="M16 35V14l4-13 4 13v21zM16 29h8M9 35h22"/>',explosive:'<path d="M15 26V13l5-10 5 10v13zM15 20h10M10 29l-6 3 8 1 3 5 5-5 5 5 3-5 8-1-6-3"/>',piercing:'<path d="m3 20 29 0m-7-6 7 6-7 6M10 5v7m0 16v7M19 5v7m0 16v7M28 5v7m0 16v7"/>',duplex:'<path d="M5 33V13l6-10 6 10v20zm18 0V13l6-10 6 10v20zM5 26h12m6 0h12"/>',
 pressure:'<path d="m7 29 13-19 13 19M20 10v25M7 7h26"/>',service:'<path d="M8 14a13 13 0 1 1-1 13M3 9v12h12"/>',momentum:'<path d="m7 6 12 14L7 34m14-28 12 14-12 14"/>',repair:'<path d="M14 4h12v10h10v12H26v10H14V26H4V14h10z"/>',focus:'<circle cx="20" cy="20" r="15"/><path d="M20 10v11l9 5"/>',rebound:'<path d="M4 30 18 8l15 22M3 5h34m-12 18 8 7 1-11"/>',brake:'<path d="M7 6v28m8-28v28m8-28v28m8-28v28"/>',echo:'<path d="M4 15h10v10H4zm11-6h10v22H15zm11-6h10v34H26z"/>',arc:'<path d="m3 27 12-15 7 15L36 6M4 6h7m17 28h8"/>',assayer:'<path d="m20 3 4 11 12 1-9 8 3 13-10-7-10 7 3-13-9-8 12-1z"/>'
};
const icon=id=>`<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]}</svg>`;
const announce=text=>{$('screen-status').textContent=text;};
let viewer=null,lastDetail='',muted=false;
try{muted=localStorage.getItem('armory-preview-muted')==='true';}catch{}
$('armory').dataset.muted=String(muted);$('sound-toggle').setAttribute('aria-pressed',String(muted));$('sound-toggle').setAttribute('aria-label',muted?'Unmute sound':'Mute sound');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function uiSound(type='select'){
 if(muted)return;
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!uiSound.context||uiSound.context.state==='closed'){if(navigator.audioSession)navigator.audioSession.type='ambient';uiSound.context=new C();}const ctx=uiSound.context;if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(type==='equip'?310:560,t);o.frequency.exponentialRampToValueAtTime(type==='equip'?110:300,t+.045);g.gain.setValueAtTime(.018,t);g.gain.exponentialRampToValueAtTime(.0001,t+.055);o.connect(g);g.connect(ctx.destination);o.start();o.stop(t+.06);
 }catch{}
}
const number=n=>Number(n.toFixed(2)).toString();
function circuitStats(id,rank){const u=[1,1.08,1.16,1.25][rank],pct=n=>`+${Number((n*u).toFixed(1))}%`;
 const all={pressure:[['Damage gained',pct(12)]],service:[['Reload speed',pct(25)],['Magazine restored',`${number(20*u)}%`]],momentum:[['Movement speed',pct(6)]],repair:[['Health restored',String(Math.round(35*u))]],focus:[['Slow time refill',String(Math.round(35*u))],['Recovery speed',pct(15)]],rebound:[['Ricochet damage',`${number(60*u)}%`]],brake:[['Enemy speed','−20%'],['Slow duration',`${number(.35*u)} seconds`]],echo:[['Following shot',`${number(40*u)}% damage`]],arc:[['Chain damage',`${number(60*u)}%`]],assayer:[['Upgrade chance',`${30+5*rank}%`]]};
 return [['Kills per reward',String(PARTS[id].interval)],...all[id]];
}
function statRow(label,before,after,{gain=false,cost=false}={}){
 const differs=before!==after;
 return `<div class="stat-row"><dt>${label}</dt><dd aria-label="${differs?`Equipped ${before}. Preview ${after}.`:after}">${differs?`<span class="stat-before">${before}</span><span class="stat-arrow" aria-hidden="true">→</span>`:''}<span class="stat-after ${gain?'is-gain':''} ${cost?'is-cost':''}">${after}</span></dd></div>`;
}
function render(){
 const c=state.preview,kit=previewKit(),changed=slots.some(s=>!same(kit[s],state.kit[s])),current=resolve(state.kit),next=resolve(kit);
 $('armory').dataset.preview=String(changed&&!state.showEquipped);$('armory').dataset.mode=state.mode;
 $('armory').dataset.claim=state.claim?.id||'';
 const detailKey=c?`${c.id}:${c.rank}`:'';
 if(detailKey!==lastDetail&&!reduced.matches){for(const el of [$('detail-name'),$('detail-copy')])el.animate([{opacity:.4,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:160,easing:'ease-out'});}
 lastDetail=detailKey;
 $('slots').innerHTML=slots.map(slot=>{const part=state.kit[slot];return `<button class="fitted-part ${state.mode==='owned'&&state.slot===slot?'is-active':c&&changed&&PARTS[c.id].slot===slot?'is-preview':''}" data-slot="${slot}" data-part="${part.id}" data-rank="${part.rank}" style="--rarity:${colors[part.rank]}" aria-label="${PARTS[part.id].name}, ${ranks[part.rank]}, equipped. Browse owned attachments.">${icon(part.id)}<span class="fitted-name">${PARTS[part.id].name}</span><i class="rarity-dot" aria-hidden="true"></i></button>`;}).join('');
 const list=itemList();
 $('options').innerHTML=list.map(item=>{const part=PARTS[item.id],claimed=same(item,state.claim),fitted=same(item,state.kit[part.slot]);return `<button class="choice ${claimed?'is-claimed':''}" data-id="${item.id}" data-rank="${item.rank}" style="--rarity:${colors[item.rank]}" aria-pressed="${same(item,c)}" aria-label="${part.name}, ${ranks[item.rank]}. ${state.mode==='owned'?(fitted?'Equipped.':'Owned.'):claimed?'Selected for this round.':'Round choice.'}"><span class="choice-icon">${icon(item.id)}</span><span class="choice-name">${part.name}</span><span class="choice-rarity">${ranks[item.rank]}</span></button>`;}).join('');
 $('rail-mode').hidden=state.mode==='draft'||!!config.freeEquip;
 $('part-detail').hidden=!c&&!maxed;
 if(c){
  const p=PARTS[c.id],old=owned[c.id],upgrade=state.mode==='draft'&&old!==undefined&&c.rank>old&&!same(c,state.claim);
  $('part-detail').style.setProperty('--rarity',colors[c.rank]);
  $('detail-rarity').textContent=upgrade?`${ranks[old]} → ${ranks[c.rank]}`:ranks[c.rank];
  $('detail-name').textContent=p.name;$('detail-copy').textContent=p.copy;
  $('comparison').classList.toggle('is-circuit',p.slot==='circuit');
  if(p.slot==='circuit'){
   const oldPart=state.kit.circuit,previous=circuitStats(oldPart.id,oldPart.rank),rows=circuitStats(c.id,c.rank);
   $('comparison').innerHTML=rows.map(([label,value])=>{
    const before=previous.find(([oldLabel])=>oldLabel===label)?.[1]||'—';
    return statRow(label,before,value,{gain:before!==value&&label!=='Kills per reward'});
   }).join('');
  }else{
   const rows=[['Damage per shot',current.damage,next.damage,false],['Shots per second',current.M.count/current.cycle,next.M.count/next.cycle,true],['Shots loaded',current.capacity/current.B.packets,next.capacity/next.B.packets,false]];
   $('comparison').innerHTML=rows.map(([label,a,b,decimal])=>{
    const fmt=n=>decimal?n.toFixed(1):String(Math.round(n)),before=fmt(a),after=fmt(b);
    return statRow(label,before,after,{gain:b>a&&before!==after,cost:b<a&&before!==after});
   }).join('');
  }
  $('claim').classList.toggle('is-undo',state.mode==='draft'&&same(c,state.claim));
  $('claim').disabled=state.mode==='owned'&&same(c,state.kit[p.slot]);
  $('claim').textContent=state.mode==='owned'?($('claim').disabled?'Equipped':'Equip'):same(c,state.claim)?'Undo choice':state.claim?'Replace choice':'Take and equip';
  $('claim').setAttribute('aria-label',$('claim').textContent);$('claim').hidden=false;
 }else if(maxed){$('detail-rarity').textContent='';$('detail-name').textContent='';$('detail-copy').textContent='All attachments are Legendary.';$('comparison').innerHTML='';$('claim').hidden=true;}
 $('play').disabled=!state.claim&&!maxed&&!config.allowContinue;$('play').classList.toggle('is-ready',!$('play').disabled);$('play').setAttribute('aria-label',config.playLabel||($('play').disabled?'Fight. Choose an attachment first.':'Fight with this loadout.'));if(config.playLabel)$('play').textContent=config.playLabel;
 $('compare-view').hidden=!changed;$('compare-view').textContent=state.showEquipped?'Show preview':'Show equipped';
 $('preview-state').textContent=changed&&!state.showEquipped?'Preview':'Equipped';
 viewer?.update(state.showEquipped?state.kit:kit,c&&changed&&!state.showEquipped?PARTS[c.id].slot:null);
 updateOverflow();config.onChange?.(clone(state));
}
function updateOverflow(){requestAnimationFrame(()=>{
 const el=$('options'),items=[...el.children],style=getComputedStyle(el),gap=parseFloat(style.columnGap)||0;
 const needed=items.reduce((sum,item)=>sum+(parseFloat(getComputedStyle(item).minWidth)||0),0)+Math.max(0,items.length-1)*gap;
 const overflow=needed>el.parentElement.clientWidth+2,changed=$('previous-option').hidden===overflow;
 $('previous-option').hidden=!overflow;$('next-options').hidden=!overflow;
 if(changed)requestAnimationFrame(()=>viewer?.refresh());
});}
function centerChoice(){
 const el=$('options'),button=el.querySelector('[aria-pressed="true"]');if(!button)return;
 const left=button.getBoundingClientRect().left-el.getBoundingClientRect().left+el.scrollLeft-(el.clientWidth-button.clientWidth)/2;
 el.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});
}
function select(item){if(!store.select(item))return;uiSound();render();const button=$('options').querySelector(`[data-id="${item.id}"]`);button?.focus({preventScroll:true});requestAnimationFrame(()=>centerChoice());}
$('options').onclick=e=>{const b=e.target.closest('[data-id]');if(b)select({id:b.dataset.id,rank:Number(b.dataset.rank)});};
$('options').onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();step(e.key==='ArrowLeft'?-1:1);};
function step(direction){const list=itemList();if(!list.length)return;const index=list.findIndex(i=>same(i,state.preview));select(list[(index+direction+list.length)%list.length]);}
$('previous-option').onclick=()=>step(-1);$('next-options').onclick=()=>step(1);
$('slots').onclick=e=>{const b=e.target.closest('[data-slot]');if(!b)return;uiSound();store.browse(b.dataset.slot);render();requestAnimationFrame(()=>{centerChoice();$('options').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});});};
$('rail-mode').onclick=()=>{uiSound();store.returnToDraft();render();requestAnimationFrame(()=>{centerChoice();$('options').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});});};
$('compare-view').onclick=()=>{uiSound();state.showEquipped=!state.showEquipped;render();};
$('claim').onclick=()=>{
 const result=store.confirm();if(!result)return;uiSound('equip');
 announce(result.action==='undone'?'Choice undone.':`${PARTS[result.item.id].name} ${result.action==='taken'?'taken and equipped':'equipped'}.`);
 render();viewer?.feedback();if(result.action==='equipped')$('options').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
};
$('play').onclick=()=>{if($('play').disabled)return;if(config.onFight){viewer?.stopTest();config.onFight({kit:clone(state.kit),owned:effectiveOwned(),pick:state.claim});return;}uiSound('equip');viewer?.stopTest();$('launch-build').textContent=slots.map(s=>PARTS[state.kit[s].id].name).join(' · ');$('launch-state').hidden=false;for(const el of document.querySelectorAll('header,.bench,.controls'))el.inert=true;$('back-to-bench').focus();};
$('back-to-bench').onclick=()=>{$('launch-state').hidden=true;for(const el of document.querySelectorAll('header,.bench,.controls'))el.inert=false;$('play').focus();};
$('sound-toggle').onclick=()=>{muted=!muted;try{localStorage.setItem('armory-preview-muted',String(muted));}catch{}$('armory').dataset.muted=String(muted);$('sound-toggle').setAttribute('aria-pressed',String(muted));$('sound-toggle').setAttribute('aria-label',muted?'Unmute sound':'Mute sound');if(!muted)uiSound();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('launch-state').hidden)$('back-to-bench').click();else if(state.mode==='owned')$('rail-mode').click();else config.onExit?.(clone(state));}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)uiSound.context?.suspend().catch(()=>{});});
window.addEventListener('pagehide',()=>uiSound.context?.close().catch(()=>{}),{once:true});
new ResizeObserver(()=>{updateOverflow();requestAnimationFrame(centerChoice);}).observe($('options'));
document.fonts.ready.then(()=>{viewer?.refresh();centerChoice();});
render();
try{const THREE=await import('../vendor/three.module.js');viewer=createViewer(THREE);render();}catch(error){$('gun-viewport').classList.remove('has-webgl');$('armory').classList.remove('has-physical-ui');$('physical-ui').replaceChildren();console.warn('Illustrated gun preview active.',error);}
requestAnimationFrame(()=>requestAnimationFrame(centerChoice));

}

const embedded=new URLSearchParams(location.search).has('embedded');
if(embedded){document.body.hidden=true;let mounted=false;window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||event.data?.scope!=='fragony-armory'||event.data.kind!=='init'||mounted)return;mounted=true;document.body.hidden=false;mountArmory({...event.data.config,onChange:state=>parent.postMessage({scope:'fragony-armory',kind:'change',state},location.origin),onExit:state=>parent.postMessage({scope:'fragony-armory',kind:'exit',state},location.origin),onFight:result=>parent.postMessage({scope:'fragony-armory',kind:'fight',result},location.origin)});});parent.postMessage({scope:'fragony-armory',kind:'ready'},location.origin);}else mountArmory();
