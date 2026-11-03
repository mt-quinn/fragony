import assert from'node:assert/strict';import{drawMapFromBag,rotationAfterPlayedMap}from'../dist/map-rotation.js';import{MAPS}from'../dist/map.js';import{createGameHarness}from'./harness.mjs';
const ids=MAPS.map(m=>m.id);assert.equal(ids.length,11);
for(const random of [()=>0,()=>.999999,()=>.37]){let state=null,last=null;for(let cycle=0;cycle<20;cycle++){const seen=[];for(let i=0;i<ids.length;i++){const draw=drawMapFromBag(ids,JSON.parse(JSON.stringify(state)),random);assert.notEqual(draw.mapId,last,'no immediate repeat at a bag boundary');last=draw.mapId;state=draw.state;seen.push(draw.mapId);}assert.deepEqual([...seen].sort(),[...ids].sort());}}
let old=rotationAfterPlayedMap(ids,'reservoir',()=>.3);for(let i=0;i<ids.length-1;i++){const d=drawMapFromBag(ids,old,()=>.4);assert.notEqual(d.mapId,'reservoir','legacy saved match counts as already seen');old=d.state;}
for(const invalid of [{remaining:['missing']},{roster:ids,remaining:[ids[0],ids[0]],last:ids[1]},null])assert.ok(ids.includes(drawMapFromBag(ids,invalid,()=>.5).mapId));
const h=createGameHarness(7);h.setup();await h.run(`(async()=>{
const played=[];for(let i=0;i<MAPS.length*2;i++){await $('start').onclick();played.push(MAP.id);assert.equal(JSON.parse(localStorage.getItem('dh-run')).mapId,MAP.id);}
for(let i=0;i<MAPS.length*2;i+=MAPS.length)assert.equal(new Set(played.slice(i,i+MAPS.length)).size,MAPS.length,'new runs keep the global bag');for(let i=1;i<MAPS.length*2;i++)assert.notEqual(played[i],played[i-1]);
const bagBefore=localStorage.getItem('dh-map-rotation'),active=MAP.id;saveRun();mainMenu();await $('continue').onclick();assert.equal(MAP.id,active);assert.equal(localStorage.getItem('dh-map-rotation'),bagBefore,'continuing an active match does not draw');
showShop();saveRun();mainMenu();await $('continue').onclick();assert.equal(mode,'shop');assert.equal(localStorage.getItem('dh-map-rotation'),bagBefore,'continuing the shop does not draw');
await $('nextmatch').onclick();assert.equal(round,2);assert.notEqual(MAP.id,active);assert.notEqual(localStorage.getItem('dh-map-rotation'),bagBefore,'advancing draws once');
const map=MAP.id;saveRun();mainMenu();await $('continue').onclick();assert.equal(MAP.id,map,'resume the drawn round');
localStorage.removeItem('dh-map-rotation');saveRun();await $('continue').onclick();const migrated=JSON.parse(localStorage.getItem('dh-map-rotation'));assert.equal(migrated.last,MAP.id);assert.equal(migrated.remaining.length,MAPS.length-1);assert.ok(!migrated.remaining.includes(MAP.id));
})()` ,{timeout:180000});
console.log('Map bag: all eleven before repeats, boundary protection, persistence across new runs, active/shop continue, one next-round draw, malformed state and legacy save migration pass.');
