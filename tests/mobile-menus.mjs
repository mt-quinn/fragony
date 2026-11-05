import {createGameHarness} from './harness.mjs';
const h=createGameHarness(716);h.setup();h.run(`
round=8;mobile={enabled:true,clear(){},closeOverlay(){},applyLayout(){},practice:false};gunCollection.tokens=2;showShop();assert.equal(mode,'shop');assert.equal(armorySession.config.offers.length,5);assert.equal(armorySession.config.round,9);assert.equal($('panel').hidden,true);const saved=localStorage.getItem('dh-run');showShop(true);assert.equal(armorySession.config.title,'Arsenal');assert.equal(armorySession.config.freeEquip,true);assert.equal(localStorage.getItem('dh-run'),saved);mobile=null;
`);console.log('Mobile armory: shared embedded screen, token-expanded choices, next-round label and campaign-safe Arsenal pass.');
