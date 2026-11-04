import assert from 'node:assert/strict';
import {menuRunSummary} from '../dist/menu-view.js';
import {createGameHarness} from './harness.mjs';
for(const value of [null,'bad','{}','null',JSON.stringify({round:2,credits:5,owned:[]}),JSON.stringify({round:-1,credits:5,owned:[0]}),JSON.stringify({round:2,credits:'500',owned:[0]})])assert.equal(menuRunSummary(value),null);
const run=JSON.stringify({round:4,credits:425,owned:[0,2],mapId:'rust',phase:'shop'});assert.equal(menuRunSummary(run),'ROUND 04 · 425 CR');
const h=createGameHarness();h.setup();h.context.savedRun=run;h.run(`
 assert.equal($('menu').dataset.run,'new');assert.equal($('continue').hidden,true);
 localStorage.setItem('dh-run',savedRun);updateMainMenu();assert.equal($('menu').dataset.run,'saved');assert.equal($('continue').hidden,false);assert.equal($('menu-run-summary').textContent,'ROUND 04 · 425 CR');assert.equal(localStorage.getItem('dh-run'),savedRun,'displaying the menu never rewrites the run');
 localStorage.setItem('dh-run','bad');updateMainMenu();assert.equal($('menu').dataset.run,'new');assert.equal($('continue').hidden,true);assert.equal(localStorage.getItem('dh-run'),'bad','invalid saves are not deleted');
`);
const logged=[];h.context.console={...console,error:message=>logged.push(message)};
await h.run(`(async()=>{const entry=MAPS.find(m=>m.id===MENU_STAGE.mapId),load=entry.load;entry.load=async()=>{throw Error('simulated unavailable map')};try{await init();assert.equal($('panel').hidden,false);assert.ok($('panel').innerHTML.includes('MENU COULD NOT LOAD'));assert.equal(typeof $('retry-menu').onclick,'function');}finally{entry.load=load}})()`);
assert.deepEqual(logged,['Menu map loading failed']);
console.log('Main menu: fresh/saved states, exact round/credit summary, malformed saves and read-only campaign presentation and failed-load retry pass.');
