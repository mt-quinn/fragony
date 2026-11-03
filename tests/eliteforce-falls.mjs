import{createGameHarness}from'./harness.mjs';
const h=createGameHarness(57,{legacyFixtures:false});h.setup();await h.run(`(async()=>{
await beginPractice('ef-showdown');playerPos.set(0,eyeHeight+.1,0);vy=-1;updateStep(1/60);assert.ok(playerPos.y-eyeHeight>MAP.killBelow,'practice fall returns to a real source start');assert.equal(respawnTime,0);
practiceMode=false;startMatch(false);mode='play';locked=true;time=90;health=100;respawnTime=0;playerPos.set(0,eyeHeight+.1,0);vy=-1;updateStep(1/60);assert.ok(respawnTime>0);assert.equal(health,0,'campaign void is a fall, not an invisible floor');
const b=bots[0],before=matchKills;b.dead=0;b.hp=100;b.pos.set(0,.1,0);b.vy=-1;opponentAI.world.physics(b,b.brain,1/60);assert.ok(b.dead>0);assert.equal(matchKills,before,'falling bot is not a player frag');
await beginPractice('reservoir');assert.equal(MAP.killBelow,undefined,'existing maps keep their floor rules');
})()`);console.log('EF voids: safe practice reset, campaign death/respawn, bot self-fall and unchanged existing-map floor rules pass.');
