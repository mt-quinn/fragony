import assert from 'node:assert/strict';
import {DamageHistory,bodyPartAt,recapHTML} from '../dist/recap.js';
import {createGameHarness} from './harness.mjs';
const ledger=new DamageHistory();ledger.record('a','A','Rifle',20,[{part:'head',damage:30},{part:'torso',damage:10}]);let snap=ledger.snapshot();assert.equal(snap[0].hits,2);assert.equal(snap[0].parts.head,15);ledger.record('a','A','Rifle',10);assert.equal(snap[0].damage,20,'snapshots cannot change after later hits');ledger.clear();assert.equal(ledger.snapshot().length,0);
assert.equal(bodyPartAt({x:0,y:1.65,z:0},{x:0,y:1.7,z:0},0),'head');assert.equal(bodyPartAt({x:.3,y:1.1,z:0},{x:0,y:1.7,z:0},0),'rightArm');assert.equal(bodyPartAt({x:-.1,y:.4,z:0},{x:0,y:1.7,z:0},0),'leftLeg');
const h=createGameHarness();h.setup();h.run(`
mode='play';locked=true;spawnPlayer();const killer=bots[0],helper=bots[1];killer.hp=90;
damageBot(killer,27,null,'leftArm',null,{weapon:'AR-9'});damageBot(killer,13,null,'torso',null,{weapon:'AR-9'});damagePlayer(50,helper,{part:'leftLeg',weapon:'WASP'});damagePlayer(150,killer,{head:true,weapon:'IRON .50'});
assert.equal(respawnTime,2.2);assert.equal(deathView.recap.attackers.length,2);assert.equal(deathView.recap.killer.health,50/90*100);assert.equal(deathView.recap.outgoing.parts.leftArm,30);assert.equal(deathView.recap.outgoing.damage,40/90*100);assert.equal($('death-recap').hidden,false);assert.equal($('killer-tag').hidden,false);assert.ok(deathView.pairs.length>0);assert.equal(deathView.line.depthTest,false);assert.equal(deathView.fill.depthTest,false);
const frozen=JSON.stringify(deathView.recap),origin=deathView.position.clone();killer.pos.x+=8;updateDeathView(.2);assert.equal(camera.position.distanceTo(origin),0,'death camera cannot translate');const direction=camera.getWorldDirection(new THREE.Vector3());assert.ok(direction.dot(killer.pos.clone().add(new THREE.Vector3(0,1.1,0)).sub(origin).normalize())>.9,'camera turns toward killer');killer.hp=5;killer.history.clear();assert.equal(JSON.stringify(deathView.recap),frozen,'killer health/history snapshot stays frozen');
const highlight=deathView.highlight;opponentAI=null;pickups=[];rockets=[];for(let i=0;i<131;i++)updateStep(1/60);assert.ok(respawnTime>0,'no early respawn');updateStep(1/60);updateStep(1/60);assert.equal(respawnTime,0);assert.equal(deathView,null);assert.equal($('death-recap').hidden,true);assert.equal($('killer-tag').hidden,true);assert.ok(!scene.children.includes(highlight));assert.equal(health,200);
// Arena and self deaths have no invented attacker tracking.
damagePlayer(200,null,{weapon:'Grenade'});assert.equal(deathView.killer,null);assert.equal($('killer-tag').hidden,true);spawnPlayer();
`);
console.log('Death recap: actual limb/hit totals, multiple attackers, frozen return damage and killer health, stationary tracking camera, through-wall highlight and unchanged 2.2s respawn cleanup pass.');
const loadoutHarness=createGameHarness(92);loadoutHarness.setup();loadoutHarness.run(`
mode='play';spawnPlayer();const killer=bots[0];killer.rival.owned=[0,1];killer.loadout=['rifle','pistol'];killer.rival.builds=normalizeBuilds();
const parts=[WEAPON_SLOTS[1].action[0],WEAPON_SLOTS[1].ammunition[0],WEAPON_SLOTS[1].feed[0],OPTICS[1]];
for(const a of parts)assert.ok(fitAttachment(killer.rival.builds,killer.rival.owned,9999,1,a.slot,a.id).ok);
killer.brain.weaponType='rifle';damagePlayer(200,killer,{weapon:weapons[1].name});
const kit=deathView.recap.killer.loadout;assert.equal(kit.weapon,weapons[1].name);assert.equal(kit.attachments.length,4);assert.equal(kit.attachments[0].name,parts[0].name);assert.ok($('death-recap').innerHTML.includes(parts[0].name));assert.ok(!$('death-recap').innerHTML.includes('no attachments'));
const snapshot=JSON.stringify(kit);killer.rival.builds=normalizeBuilds();killer.brain.weaponType='smg';assert.equal(JSON.stringify(deathView.recap.killer.loadout),snapshot,'gun and attachments frozen even after switching or loadout changes');
spawnPlayer();damagePlayer(200,killer,{weapon:weapons[0].name});assert.ok($('death-recap').innerHTML.includes('Stock · no attachments'));spawnPlayer();damagePlayer(200,null,{weapon:'Grenade'});assert.ok(!$('death-recap').innerHTML.includes('KILLER’S GUN'));
`);
const escaped=recapHTML({attackers:[],killer:{name:'A',loadout:{weapon:'<gun>',attachments:[{slot:'<slot>',name:'<part>'}]}}});assert.ok(escaped.includes('&lt;part&gt;'));assert.ok(!escaped.includes('<part>'));
console.log('Killer loadout: killing weapon rather than switched gun, all fitted parts and free optic, frozen snapshot, stock/self fallback and escaped names pass.');
