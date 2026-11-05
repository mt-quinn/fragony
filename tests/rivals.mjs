import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
import {difficultyForRound} from '../dist/ai.js';
const h=createGameHarness(546);h.setup();h.run(`
startMatch(false);const initial=JSON.stringify(rivals.map(r=>r.collection));spawnBot(bots[0]);assert.equal(JSON.stringify(rivals.map(r=>r.collection)),initial);assert.ok(bots.every(b=>b.loadout.length===1));
const rankings=rankList();for(let n=1;n<=30;n++){for(const r of rivals)r.collection.tokens=n%5;settleRivals(rivals,rankings,n,weapons,upgrades,()=>.4);for(const r of rivals){assert.equal(r.credits,0);assert.equal(JSON.stringify(r.owned),'[0]');assert.equal(r.settledRound,n);assert.ok(r.collection.shop.committed);assert.equal(r.collection.shop.choices.length,Math.min(3+n%5,Object.keys(PARTS).filter(id=>(r.collection.owned[id]??-1)<3).length+1));}const once=JSON.stringify(rivals);settleRivals(rivals,rankings,n,weapons,upgrades,()=>.1);assert.equal(JSON.stringify(rivals),once);}
const restored=restoreRivals(JSON.parse(JSON.stringify(rivals)),botNames,()=>[],ALL_WEAPONS);assert.equal(JSON.stringify(restored.map(r=>r.collection)),JSON.stringify(rivals.map(r=>r.collection)));
round=8;makeBots();locked=true;mode='play';time=10000;for(let i=0;i<2400;i++)updateStep(1/120);assert.ok(opponentAI.stats.shots>0);assert.ok(bots.every(b=>b.modularFire.ammo>=0));
` ,{timeout:180000});
assert.equal(difficultyForRound(31).reaction,difficultyForRound(17).reaction);assert.ok(difficultyForRound(31).aimError>0);console.log('Bots: one persistent gun, thirty exact-once upgrade rounds, token choices, save restoration and live upgraded combat pass; late aim/reaction limits retained.');
