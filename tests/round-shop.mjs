import assert from 'node:assert/strict';
import {partCopy,supplyCopy} from '../dist/shop-copy.js';
import {WEAPON_SLOTS} from '../dist/loadout.js';
import {createGameHarness} from './harness.mjs';
for(let g=0;g<6;g++)for(const [slot,parts]of Object.entries(WEAPON_SLOTS[g]))for(const a of parts){const copy=partCopy(g,a);assert.ok(copy.title&&copy.hint&&copy.detail);if(slot!=='optic'){assert.notEqual(copy.hint,'Changes weapon behavior',a.id);assert.ok(!/DPS|\d+\.\d+ s|%/.test(copy.detail),a.id);}}
assert.equal(partCopy(5,WEAPON_SLOTS[5].feed[2]).title,'Reload one shell at a time');assert.match(supplyCopy({id:'surge',name:'Surge'}).detail,/three weapon kills, restore.*slow-motion/);
const h=createGameHarness(564);h.setup();await h.run(`(async()=>{
 owned=[0,1,2,3,5];equipped=startingWeapon=0;round=4;credits=1200;perks={};builds=normalizeBuilds();equipment=normalizeEquipment();shopOffers=null;showShop();
 assert.equal(mode,'shop');assert.ok($('panel').className.includes('round-shop-screen'));assert.equal(($('panel').innerHTML.match(/data-start=/g)||[]).length,5);
 const offer=shopOffers.attachments[1],id='part:'+offer.gun+':'+offer.id,stock=JSON.stringify(shopOffers),cash=credits;
 $('panel').querySelectorAll('[data-select-offer]').find(b=>b.dataset.selectOffer===id).onclick();assert.equal(credits,cash,'selecting an offer never purchases it');assert.equal(shopCandidate,id);
 $('panel').querySelectorAll('[data-shop-part]')[0].onclick();assert.equal(credits,cash-(offer.price??attachment(offer.gun,offer.id).price));assert.equal(JSON.stringify(shopOffers),stock);assert.equal(builds[offer.gun].slots[attachment(offer.gun,offer.id).slot],offer.id);
 const balance=credits;$('panel').querySelectorAll('[data-shop-part]')[0].onclick();assert.equal(credits,balance,'repeat purchase cannot charge twice');
 $('open-kit').onclick();assert.ok(shopKit);const saved=localStorage.getItem('dh-run');fitOwnedPart(offer.gun,attachment(offer.gun,offer.id).slot,'');assert.equal(credits,balance);fitOwnedPart(offer.gun,attachment(offer.gun,offer.id).slot,offer.id);assert.equal(credits,balance);
 $('close-kit').onclick();$('panel').querySelectorAll('[data-start]').find(b=>b.dataset.start==='3').onclick();assert.equal(startingWeapon,3);assert.equal(shopCandidate,id,'starting weapon does not filter or replace stock');
 $('continue').onclick();assert.equal(mode,'shop');assert.equal(startingWeapon,3);assert.equal(JSON.stringify(shopOffers),stock);assert.equal(credits,balance);
 await $('nextmatch').onclick();assert.equal(round,5);assert.equal(mode,'play');assert.equal(equipped,3);
 matchPoints=99999;endMatch();assert.equal(mode,'results');assert.ok($('panel').innerHTML.includes('CONTINUE TO SHOP'));assert.ok(!$('panel').innerHTML.includes('id="backmenu"'));assert.ok(!$('panel').innerHTML.includes('id="nextmatch"'));
 const endedRound=round,endedCash=credits;$('resultnext').onclick();assert.equal(mode,'shop');assert.equal(round,endedRound,'entering the shop does not advance the round');assert.equal(credits,endedCash,'entering the shop does not award credits again');
 await $('nextmatch').onclick();assert.equal(round,endedRound+1);assert.equal(mode,'play');
 // No stale cards or missing primary action when every item is owned.
 owned=[0,1,2,3,4,5];builds=normalizeBuilds();for(const g of owned)builds[g].owned=Object.values(WEAPON_SLOTS[g]).flat().map(a=>a.id);perks=Object.fromEntries(upgrades.filter(u=>u.gun===undefined).map(u=>[u.id,true]));equipment.owned=Object.values(EQUIPMENT).flat().map(a=>a.id);shopOffers=null;showShop();
 assert.ok($('panel').innerHTML.includes('All attachment stock is owned'));assert.ok($('panel').innerHTML.includes('id="nextmatch"'));assert.ok(!$('panel').innerHTML.includes('id="buy-offer"'));
 })()`);
console.log('Round shop: complete catalog copy, five-weapon selection, explicit purchases, free swaps, persistent stock/save restore, exhausted stock and scoreboard → shop → next round pass.');
