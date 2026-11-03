import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MAPS,MAP,selectMap} from '../dist/map.js';
import {drawMapFromBag} from '../dist/map-rotation.js';
import {createGameHarness} from './harness.mjs';
const retired=['testworks','tidal-lock','parallax','foundry'];
assert.deepEqual(MAPS.map(m=>m.id),['reservoir','rust','shipment','nuketown','killhouse','vacant','showdown','firingrange','hijacked','summit','shoothouse','siege','mutiny','bravery','ef-showdown','delta-station','beta-station','forge2','forge1','blast-radius']);
for(const id of retired){selectMap(id);assert.equal(MAP.id,'reservoir');}
const source=fs.readFileSync(new URL('../dist/map.js',import.meta.url),'utf8');assert.ok(!source.includes('original-arenas'));
for(const id of retired){const result=drawMapFromBag(MAPS.map(m=>m.id),{roster:[id,'reservoir'],remaining:[id],last:'rust'},()=>.3);assert.ok(MAPS.some(m=>m.id===result.mapId));assert.ok(!result.state.remaining.some(id=>retired.includes(id)));}
const h=createGameHarness(412,{legacyFixtures:false});h.setup();
h.run(`
assert.equal(MAP.id,'reservoir');showPracticeMaps();assert.equal($('panel').querySelectorAll('[data-practice-map]').length,MAPS.length);
for(const id of ['testworks','tidal-lock','parallax','foundry']){assert.ok(!practiceMaps().some(m=>m.id===id));assert.ok(!MAPS.some(m=>m.id===id));}
practiceMode=false;startMatch(false);saveRun();const baseSave=JSON.parse(localStorage.getItem('dh-run'));
for(const id of ['testworks','tidal-lock','parallax','foundry']){localStorage.setItem('dh-run',JSON.stringify({...baseSave,mapId:id,round:3,credits:777,phase:'shop'}));mainMenu();$('continue').onclick();assert.equal(MAP.id,'reservoir');assert.equal(round,3);assert.equal(credits,777);assert.equal(mode,'shop');}
`);
console.log('Production roster: twenty active maps, distinct CoD/Elite Force Showdown identities, retired maps absent from chooser/bag/imports and safe fallback.');
