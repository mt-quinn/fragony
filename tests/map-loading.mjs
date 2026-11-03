import {createGameHarness} from './harness.mjs';
const h=createGameHarness(78,{legacyFixtures:false});h.setup();await h.run(`(async()=>{
const entry=MAPS.find(m=>m.id==='shoothouse'),originalLoad=entry.load,wasReady=entry.ready,bag=localStorage.getItem('dh-map-rotation');let release,entered=false;entry.ready=false;entry.load=()=>new Promise(resolve=>{release=resolve});
const pending=prepareArena(entry.id,()=>{entered=true});assert.equal(mode,'loading');assert.ok($('panel').innerHTML.includes('PREPARING MAP'));$('map-loading-back').onclick();release();await pending;assert.equal(mode,'menu');assert.equal(entered,false);assert.equal(MAP.id,'reservoir');assert.equal(localStorage.getItem('dh-map-rotation'),bag);
entry.load=()=>Promise.reject(new Error('Simulated unavailable map'));const log=console.error;console.error=()=>{};try{await prepareArena(entry.id,()=>{entered=true});}finally{console.error=log}assert.equal(entered,false);assert.ok($('panel').innerHTML.includes('MAP COULD NOT LOAD'));assert.equal(localStorage.getItem('dh-map-rotation'),bag);$('map-loading-back').onclick();assert.equal(mode,'menu');
entry.load=originalLoad;entry.ready=wasReady;
})()`);console.log('Map loading: cancelled or failed downloads keep the current map and rotation, expose a usable return to menu, and never enter an incomplete arena.');
