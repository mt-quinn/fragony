import {createGameHarness} from './harness.mjs';
const h=createGameHarness();h.setup();h.run(`{
 const target=bots[0],finisher=bots[1],helper=bots[2];mode='play';
 spawnBot(target);matchPoints=matchAssists=matchKills=0;
 damageBot(target,22.5,null);assert.equal(target.damageCredit.get('player'),22.5);
 damageBot(target,100,finisher);assert.equal(matchPoints,25);assert.equal(matchAssists,1);assert.equal(matchKills,0);assert.equal(finisher.score,100);
 damageBot(target,100,finisher);assert.equal(matchAssists,1,'corpse cannot credit twice');
 spawnBot(target);damageBot(target,45,null);healBot(target,90);damageBot(target,90,finisher);assert.equal(matchPoints,25,'healing cancels previous damage');
 spawnBot(target);damageBot(target,18,helper);damageBot(target,500,null,'head');assert.equal(helper.score,20);assert.equal(helper.assists,1);assert.equal(matchPoints,175);
 spawnBot(target);damageBot(target,30,helper);spawnBot(target);damageBot(target,100,null);assert.equal(helper.score,20,'respawn clears credit');
 spawnPlayer();damagePlayer(70,helper);damagePlayer(200,finisher);assert.equal(helper.score,55);assert.equal(finisher.score,300,'player kill still worth100');
 spawnPlayer();damagePlayer(50,helper);healPlayer(200);damagePlayer(200,finisher);assert.equal(helper.score,55,'player healing clears credit');
 spawnBot(target);healBot(target,140);assert.equal(target.hp,90);assert.equal(target.maxHealth,90,'no overheal cap inflation');
 spawnBot(target);const shell=target.parts.head.children.find(o=>o.userData.healthShell);assert.equal(shell.material.color.getHex(),healthColors[20]);damageBot(target,81,null);assert.equal(shell.material.color.getHex(),healthColors[2]);
}`);console.log('Assists: recipient-relative 100-point credit, actual damage only, fixed kill/headshot rewards, healing/respawn resets, fixed health caps, corpse guards and health colors pass.');
