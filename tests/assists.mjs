import {createGameHarness} from './harness.mjs';
const h=createGameHarness();h.setup();h.run(`
const target=bots[0], finisher=bots[1], helper=bots[2];
spawnBot(target);matchPoints=matchAssists=matchKills=0;
damageBot(target,25,null);assert.equal(target.damageCredit.get('player'),25);
damageBot(target,100,finisher);assert.equal(matchPoints,25);assert.equal(matchAssists,1);assert.equal(matchKills,0);assert.equal(finisher.score,100);
assert.equal(target.parts.head.children.find(o=>o.userData.healthShell).material.color.getHex(),0x858c88);
damageBot(target,100,finisher);assert.equal(matchAssists,1,'corpse cannot credit twice');
spawnBot(target);damageBot(target,60,null);healBot(target,90);damageBot(target,90,finisher);assert.equal(matchPoints,25,'healing cancels previous damage');
spawnBot(target);damageBot(target,20,helper);damageBot(target,500,null,'head');assert.equal(helper.score,20);assert.equal(helper.assists,1);assert.equal(matchPoints,175,'headshot killer gets full 150');
spawnBot(target);damageBot(target,30,helper);spawnBot(target);damageBot(target,100,null);assert.equal(helper.score,20,'respawn clears credit');
spawnPlayer();damagePlayer(35,helper);damagePlayer(100,finisher);assert.equal(helper.score,55);assert.equal(finisher.score,300);
spawnPlayer();damagePlayer(25,helper);healPlayer(100);damagePlayer(100,finisher);assert.equal(helper.score,55,'player healing clears credit');
spawnBot(target);healBot(target,140);damageBot(target,70,null);damageBot(target,100,finisher);assert.equal(matchPoints,325,'overhealth uses full health capacity');
spawnBot(target);const shell=target.parts.head.children.find(o=>o.userData.healthShell);assert.equal(shell.material.color.getHex(),healthColors[20]);damageBot(target,90,null);assert.equal(shell.material.color.getHex(),healthColors[2]);
`);console.log('Assists: proportional points, full kill/headshot rewards, healing/respawn resets, overhealth, corpse guards and health colors pass.');
