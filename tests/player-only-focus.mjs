import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
const game=createGameHarness(289);game.setup();game.run(`{
 mode='play';round=8;time=90;respawnTime=0;focus=100;keys.clear();
 for(const b of bots){b.focus=100;b.hp=1;b.brain.visible=true;b.brain.recover=0;}
 updateStep(1/120);assert.equal(slow,false,'low-health opponents cannot activate slow time');
 keys.add('KeyQ');updateStep(1/120);assert.equal(slow,true,'player can activate slow time');assert.ok(focus<100);
 keys.delete('KeyQ');updateStep(1/120);assert.equal(slow,false,'time returns to normal when player releases focus');
}`);console.log('Slow time is player-only; eligible rivals cannot activate it, and player activation/release still works.');
