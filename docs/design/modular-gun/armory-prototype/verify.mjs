import assert from 'node:assert/strict';
import {createArmoryState} from './armory-state.js';
import {createBenchFire} from './bench-fire.js';
import {PARTS,INITIAL_KIT,INITIAL_OWNED,OFFERS,clone,resolve} from './model.js';
let checks=0;
function test(name,fn){fn();checks++;console.log(`✓ ${name}`);}
const fresh=()=>createArmoryState(INITIAL_KIT,INITIAL_OWNED,OFFERS);

test('Previewing an offer changes neither equipment nor ownership',()=>{
 const s=fresh();s.select(OFFERS[2]);assert.deepEqual(s.state.kit,INITIAL_KIT);assert.deepEqual(s.owned,INITIAL_OWNED);assert.equal(s.state.claim,null);assert.equal(s.previewKit().barrel.id,'rails');
});
test('Taking a part equips it and adds one provisional owned copy',()=>{
 const s=fresh();s.confirm();assert.equal(s.state.kit.ammo.id,'duplex');assert.equal(s.effectiveOwned().duplex,2);assert.equal(s.owned.duplex,undefined);
});
test('Replacement preview removes the previous draft part before comparison',()=>{
 const s=fresh();s.confirm();s.select(OFFERS[2]);assert.equal(s.previewKit().ammo.id,'normal');assert.equal(s.previewKit().barrel.id,'rails');assert.equal(s.state.kit.ammo.id,'duplex');
});
test('Replacing a pick leaves only one acquired attachment',()=>{
 const s=fresh();s.confirm();s.select(OFFERS[2]);s.confirm();assert.equal(s.effectiveOwned().duplex,undefined);assert.equal(s.effectiveOwned().rails,3);assert.equal(s.state.kit.ammo.id,'normal');
});
test('Undo restores the prior fitted part and removes the acquisition',()=>{
 const s=fresh();s.confirm();s.confirm();assert.deepEqual(s.state.kit,INITIAL_KIT);assert.deepEqual(s.effectiveOwned(),INITIAL_OWNED);assert.equal(s.state.claim,null);
});
test('Owned equipment is free and does not fulfill the round pick',()=>{
 const s=fresh();s.browse('ammo');s.select({id:'piercing',rank:1});s.confirm();assert.equal(s.state.kit.ammo.id,'piercing');assert.equal(s.state.claim,null);
});
test('Replacement preserves a later free equipment change',()=>{
 const s=fresh();s.confirm();s.browse('ammo');s.select({id:'normal',rank:1});s.confirm();s.returnToDraft();s.select(OFFERS[2]);s.confirm();assert.equal(s.state.kit.ammo.id,'normal');assert.equal(s.state.kit.barrel.id,'rails');assert.equal(s.effectiveOwned().duplex,undefined);
});
test('Rarity upgrade replaces the lower owned version and remains reversible',()=>{
 const s=fresh();s.select(OFFERS[1]);s.confirm();assert.equal(s.effectiveOwned().huge,1);s.browse('barrel');assert.equal(s.itemList().filter(i=>i.id==='huge').length,1);assert.equal(s.select({id:'huge',rank:0}),false);s.returnToDraft();s.confirm();assert.equal(s.effectiveOwned().huge,0);assert.deepEqual(s.state.kit.barrel,INITIAL_KIT.barrel);
});
test('Offer eligibility excludes equal, lower and duplicate identities',()=>{
 const s=createArmoryState(INITIAL_KIT,INITIAL_OWNED,[{id:'normal',rank:0},{id:'normal',rank:1},{id:'normal',rank:2},{id:'normal',rank:3},{id:'huge',rank:0},{id:'huge',rank:1}]);assert.deepEqual(s.offers,[{id:'normal',rank:2},{id:'huge',rank:1}]);
});
test('A completed legendary collection has no eligible upgrades',()=>{
 const owned=Object.fromEntries(Object.keys(PARTS).map(id=>[id,3])),s=createArmoryState(INITIAL_KIT,owned,Object.keys(PARTS).map(id=>({id,rank:3})));assert.equal(s.offers.length,0);assert.equal(s.confirm(),null);
});
test('The state boundary rejects unavailable selections',()=>{
 const s=fresh();assert.equal(s.select({id:'duplex',rank:3}),false);assert.equal(s.select({id:'missing',rank:0}),false);assert.equal(s.browse('missing'),false);
});
const kit=(mechanism='automatic',barrel='single',ammo='normal',rank=0)=>({mechanism:{id:mechanism,rank},barrel:{id:barrel,rank},ammo:{id:ammo,rank},circuit:{id:'momentum',rank}});
test('Automatic preview respects recovery between individual shots',()=>{
 const f=createBenchFire();f.setKit(kit());assert.equal(f.step(0,true).shots,1);assert.equal(f.step(159,true).shots,0);assert.equal(f.step(160,true).shots,1);assert.equal(f.step(10000,false).shots,0);
});
test('Release completes a committed burst and all centered duplex bullets',()=>{
 const k=clone(INITIAL_KIT);k.ammo={id:'duplex',rank:2};const f=createBenchFire();f.setKit(k);const first=f.step(0,true),tail=f.step(500,false);assert.equal(first.shots+tail.shots,12);assert.equal(tail.ammo,resolve(k).capacity-6);assert.equal(f.step(2000,false).shots,0);
});
test('Empty magazine reloads without bypassing an existing recovery deadline',()=>{
 const f=createBenchFire();f.setKit(kit());for(let i=0;i<24;i++)assert.equal(f.step(i*160,true).shots,1);
 assert.equal(f.step(3759,false).reloading,false);assert.equal(f.step(3760,false).startedReload,true);assert.equal(f.step(4759,true).shots,0);const done=f.step(4760,false);assert.equal(done.completedReload,true);assert.equal(done.ammo,24);assert.equal(f.step(4760,true).shots,1);
});
test('Charge starts ready and does not lose charge during a long idle',()=>{
 const f=createBenchFire();f.setKit(kit('charge'));assert.equal(f.step(30000,false).shots,0);assert.equal(f.step(30000,true).shots,1);assert.equal(f.step(30001,true).shots,0);
});
test('Stopping or changing the preview cancels delayed bullets and resets its magazine',()=>{
 const f=createBenchFire();f.setKit(kit('burst','double','duplex'));f.step(0,true);f.stop();assert.equal(f.step(500,false).shots,0);assert.equal(f.step(500,true).shots,1);f.setKit(kit());assert.equal(f.step(500,false).shots,0);assert.equal(f.step(500,true).ammo,23);
});
test('Every physical build and tier produces a complete bounded firing sequence',()=>{
 const mechanisms=Object.keys(PARTS).filter(id=>PARTS[id].slot==='mechanism'),barrels=Object.keys(PARTS).filter(id=>PARTS[id].slot==='barrel'),ammo=Object.keys(PARTS).filter(id=>PARTS[id].slot==='ammo');let builds=0;
 for(const m of mechanisms)for(const b of barrels)for(const a of ammo)for(let r=0;r<4;r++){
  const k=kit(m,b,a,r),w=resolve(k),f=createBenchFire();f.setKit(k);const first=f.step(0,true),rest=f.step(10000,false);
  assert.equal(first.shots+rest.shots,w.M.count*w.B.packets*(a==='duplex'?2:1));assert.ok(w.events.every(t=>t>=0&&t<w.cycle));assert.ok(w.capacity>=2*w.M.count*w.B.packets);assert.ok(w.cycle>0&&Number.isFinite(w.damage));builds++;
 }
 assert.equal(builds,480);
});
console.log(`${checks} interaction/timing checks passed, including 480 weapon previews.`);
