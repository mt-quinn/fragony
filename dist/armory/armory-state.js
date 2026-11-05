import {PARTS,clone,same} from './model.js';

// The draft stays reversible until the player leaves the armory. Owned equipment
// changes are independent of the round's one provisional acquisition.
export function createArmoryState(initialKit,initialOwned,initialOffers){
 const owned=clone(initialOwned),seen=new Set();
 const offers=initialOffers.filter(item=>{
  if(!Object.hasOwn(PARTS,item.id)||!Number.isInteger(item.rank)||item.rank<0||item.rank>3||seen.has(item.id)||(owned[item.id]??-1)>=item.rank)return false;
  seen.add(item.id);return true;
 }).map(clone);
 const state={kit:clone(initialKit),preview:offers.length?clone(offers[0]):null,draftFocus:offers.length?clone(offers[0]):null,mode:'draft',slot:null,claim:null,replaced:null,showEquipped:false};
 const effectiveOwned=()=>({...owned,...(state.claim?{[state.claim.id]:state.claim.rank}:{})});
 const itemList=()=>state.mode==='draft'?offers:Object.entries(effectiveOwned()).filter(([id])=>PARTS[id].slot===state.slot).map(([id,rank])=>({id,rank}));
 function previewKit(){const kit=clone(state.kit),c=state.preview;if(!c)return kit;
  if(state.mode==='draft'&&state.claim&&!same(c,state.claim)&&same(kit[PARTS[state.claim.id].slot],state.claim))kit[PARTS[state.claim.id].slot]=clone(state.replaced);
  kit[PARTS[c.id].slot]=clone(c);return kit;
 }
 function select(item){if(!itemList().some(i=>same(i,item)))return false;state.preview=clone(item);state.showEquipped=false;if(state.mode==='draft')state.draftFocus=clone(item);return true;}
 function browse(slot){if(!state.kit[slot])return false;state.mode='owned';state.slot=slot;state.preview=clone(state.kit[slot]);state.showEquipped=false;return true;}
 function returnToDraft(){state.mode='draft';state.slot=null;state.preview=state.draftFocus||state.claim||offers[0]||null;state.showEquipped=false;}
 function undo(){if(state.claim&&same(state.kit[PARTS[state.claim.id].slot],state.claim))state.kit[PARTS[state.claim.id].slot]=clone(state.replaced);state.claim=null;state.replaced=null;}
 function confirm(){const c=state.preview;if(!c||!itemList().some(i=>same(i,c)))return null;const slot=PARTS[c.id].slot;let action;
  if(state.mode==='owned'){state.kit[slot]=clone(c);action='equipped';}
  else if(same(c,state.claim)){undo();action='undone';}
  else{undo();state.replaced=clone(state.kit[slot]);state.claim=clone(c);state.kit[slot]=clone(c);action='taken';}
  state.showEquipped=false;return{action,item:clone(c)};
 }
 return{owned,offers,state,effectiveOwned,itemList,previewKit,select,browse,returnToDraft,confirm};
}
