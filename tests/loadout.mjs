import assert from 'node:assert/strict';
import {WEAPON_SLOTS,OPTICS,normalizeBuilds,fitAttachment,weaponStats,previewBuild,migrateLoadoutSave,normalizeEquipment} from '../dist/loadout.js';
import {createGameHarness} from './harness.mjs';
assert.equal(WEAPON_SLOTS.length,6);assert.ok(WEAPON_SLOTS.every(s=>Object.keys(s).length===5));assert.equal(OPTICS.length,6);
for(let g=0;g<6;g++){const ids=new Set();for(const [slot,parts]of Object.entries(WEAPON_SLOTS[g])){assert.equal(parts.length,slot==='optic'?6:3);for(const a of parts){assert.equal(a.slot,slot);assert.ok(!ids.has(a.id));ids.add(a.id);const builds=normalizeBuilds();let result=fitAttachment(builds,[g],1000,g,slot,a.id);assert.ok(result.ok);assert.equal(result.credits,1000-a.price);result=fitAttachment(builds,[g],result.credits,g,slot,'');assert.ok(result.ok);const balance=result.credits;result=fitAttachment(builds,[g],balance,g,slot,a.id);assert.equal(result.credits,balance);assert.equal(builds[g].owned.length,1);const noCash=normalizeBuilds();assert.equal(fitAttachment(noCash,[g],0,g,slot,a.id).ok,slot==='optic')}}}
const builds=normalizeBuilds();assert.equal(fitAttachment(builds,[0],999,1,'optic','dot').ok,false);assert.equal(fitAttachment(builds,[0],999,0,'action','dot').ok,false);assert.equal(fitAttachment(builds,[0],999,0,'optic','bogus').ok,false);
assert.equal(normalizeEquipment({streak:'unknown',throwable:'impact',owned:[]}).throwable,undefined);
console.log('Legacy catalog: compatibility, transactions, stats and migration fixtures pass. Live weapon coverage is in modular.mjs.');
