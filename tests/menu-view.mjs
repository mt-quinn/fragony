import assert from 'node:assert/strict';
import fs from 'node:fs';
import {menuRunSummary} from '../dist/menu-view.js';
import {createGameHarness} from './harness.mjs';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/<main id="menu"[^>]* hidden/,'initial HTML hides the nonfunctional menu');assert.match(html,/<section id="boot-screen"[^>]*>/);assert.ok(html.indexOf('id="boot-screen"')<html.indexOf('src="game.js"'),'loading UI exists before module execution');
for(const value of [null,'bad','{}','null',JSON.stringify({round:2,credits:5,owned:[]}),JSON.stringify({round:-1,credits:5,owned:[0]})])assert.equal(menuRunSummary(value),null);
const run=JSON.stringify({round:4,credits:425,owned:[0,2],mapId:'rust',phase:'shop'});assert.equal(menuRunSummary(run),'ROUND 04');
const h=createGameHarness();h.setup();h.context.savedRun=run;h.run(`
 assert.equal($('menu').dataset.run,'new');assert.equal($('continue').hidden,true);
 localStorage.setItem('dh-run',savedRun);updateMainMenu();assert.equal($('menu').dataset.run,'saved');assert.equal($('continue').hidden,false);assert.equal($('menu-run-summary').textContent,'ROUND 04');assert.equal(localStorage.getItem('dh-run'),savedRun,'displaying the menu never rewrites the run');
 localStorage.setItem('dh-run','bad');updateMainMenu();assert.equal($('menu').dataset.run,'new');assert.equal($('continue').hidden,true);assert.equal(localStorage.getItem('dh-run'),'bad','invalid saves are not deleted');
`);
h.run(`resetBoot();setBootProgress(40,'Loading map');setBootProgress(20,'Loading map');assert.equal(bootProgress,40);assert.equal($('boot-progress')['aria-valuenow'],'40');assert.equal($('menu').hidden,true);finishBoot();assert.equal($('boot-screen').hidden,true);assert.equal($('menu').hidden,false);assert.equal($('menu-audio').hidden,false);assert.equal(bootProgress,100);resetBoot();assert.equal(bootProgress,5);mode='play';finishBoot();assert.equal($('menu').hidden,true,'benchmark/gameplay startup never reveals the menu');mode='menu';`);
const logged=[];h.context.console={...console,error:message=>logged.push(message)};
await h.run(`(async()=>{const entry=MAPS.find(m=>m.id===MENU_STAGE.mapId),load=entry.load;entry.load=async()=>{throw Error('simulated unavailable map')};try{await init();assert.equal($('boot-screen').hidden,false);assert.equal($('menu').hidden,true);assert.equal($('boot-status').textContent,'Menu could not load');assert.equal($('retry-menu').hidden,false);assert.equal(typeof $('retry-menu').onclick,'function');}finally{entry.load=load}})()`);
assert.deepEqual(logged,['Menu map loading failed']);
console.log('Main menu: fresh/saved states, round summary, malformed saves and read-only campaign presentation and failed-load retry pass.');
