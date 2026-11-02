import { createGameHarness } from './harness.mjs';
const {context,run}=createGameHarness();
run(`
muted=true;scene=new THREE.Scene();arena=new THREE.Group();scene.add(arena);camera=new THREE.PerspectiveCamera(85,1,.07,160);scene.add(camera);renderer={domElement:{requestPointerLock(){}}};previewDummy=new THREE.Group();buildArena();buildNav();buildWeapon();makeBots();
startMatch();assert.equal(owned.length,2);assert.equal(new Set(owned).size,2);assert.ok(bots.every(b=>b.loadout.length===2&&new Set(b.loadout).size===2));
const rolled=bots[0].loadout.join(',');spawnBot(bots[0]);assert.equal(bots[0].loadout.join(','),rolled,'respawning preserves bot weapon pair');
const runPair=owned.join(',');spawnPlayer();assert.equal(owned.join(','),runPair,'respawning preserves player pair');
results.push('Player rolls two weapons per run; bots roll two per match; respawns retain each pair.');
owned=[0,1];equipped=0;ammo=3;magazines={0:3,1:7};switchWeapon(1);switchWeapon(0);assert.equal(ammo,3);ammo=0;magazines[0]=0;switchWeapon(1);switchWeapon(0);assert.equal(ammo,0);reload();assert.ok(reloading>0);reloading=0;
results.push('Switching preserves partial and empty magazines; empty weapons still require reloads.');
for(const a of spawnPoints)assert.equal(blocked(a[0],a[2],a[1]),false,'spawns must not intersect cover');
for(const a of spawnPoints)for(const b of spawnPoints){if(a===b)continue;assert.ok(findPath({x:a[0],z:a[2]},{x:b[0],z:b[2]}).length,'spawn routes connect')}
results.push('All 56 spawn-to-spawn routes connect.');
let dummy=bots[0];let initial=matchKills;
damageBot(dummy,10,null,'leftArm');assert.equal(dummy.parts.leftArm.visible,true);assert.equal(dummy.dead,0);
damageBot(dummy,200,null,'leftArm');assert.equal(dummy.parts.leftArm.visible,false);assert.equal(dummy.parts.torso.visible,true);assert.ok(dummy.dead>0);assert.equal(matchKills,initial+1);
damageBot(dummy,10,null,'rightLeg');assert.equal(dummy.parts.rightLeg.visible,false);assert.equal(matchKills,initial+1);spawnBot(dummy);assert.ok(Object.values(dummy.parts).every(p=>p.visible));
results.push('Living limbs remain intact; lethal limb and post-mortem limb shatter; respawn restores all parts; no duplicate kills.');
const arenaMeshes=worldMeshes;worldMeshes=[];bots.forEach(b=>scene.remove(b.group));bots=[];
function targetAt(z){const d=createDummy();const b={...d,name:'TEST',pos:new THREE.Vector3(0,0,z),hp:100000,score:0,deaths:0,dead:0};b.group.position.copy(b.pos);b.group.traverse(m=>m.userData.bot=b);scene.add(b.group);bots.push(b);return b}
playerPos.set(0,1.12,0);camera.position.copy(playerPos);camera.lookAt(0,1.12,-30);yaw=pitch=0;viewHeight=playerPos.y;aimSpring.reset();equipped=0;ammo=30;reloading=0;shotTimer=0;respawnTime=0;let one=targetAt(-8);scene.updateMatrixWorld(true);shoot();assert.equal(one.hp,99976);assert.equal(ammo,29);
results.push('Rifle consumes one round and applies one torso hit.');
let two=targetAt(-16);one.hp=two.hp=100;equipped=3;ammo=4;shotTimer=0;scene.updateMatrixWorld(true);const beforeRail=matchKills;aimSpring.reset();shoot();assert.equal(matchKills,beforeRail+2);assert.ok(one.dead&&two.dead);
results.push('Rail shot pierces two opponents and awards exactly two kills.');
bots.forEach(b=>scene.remove(b.group));bots=[];
function shotgunAt(distance){bots.forEach(b=>scene.remove(b.group));bots=[];const b=targetAt(-distance);equipped=5;let total=0;for(let i=0;i<100;i++){b.hp=100000;aimSpring.reset();shotTimer=0;ammo=8;scene.updateMatrixWorld(true);shoot();total+=100000-b.hp}return total/100}
const near=shotgunAt(3),mid=shotgunAt(22),far=shotgunAt(55);assert.ok(near>mid&&mid>far&&far>0);results.push('Shotgun mean damage (3m / 22m / 55m): '+near.toFixed(0)+' / '+mid.toFixed(0)+' / '+far.toFixed(0)+'.');
bots.forEach(b=>scene.remove(b.group));bots=[];playerPos.set(0,1.7,0);health=100;respawnTime=0;vy=0;explode(new THREE.Vector3(0,.1,0),null);assert.ok(vy>3);assert.ok(health>0&&health<100);results.push('Rocket splash causes self-damage and upward rocket-jump impulse.');
const shelter=cube(0,1.5,2,4,3,1,0xe1e5dc,arena);worldMeshes=[shelter];bots.forEach(b=>scene.remove(b.group));bots=[];const protectedBot=targetAt(3.5);playerPos.set(20,1.7,20);scene.updateMatrixWorld(true);explode(new THREE.Vector3(0,.2,0),null);assert.equal(protectedBot.hp,100000,'solid cover blocks splash damage');arena.remove(shelter);bots.forEach(b=>scene.remove(b.group));bots=[];results.push('Solid cover protects opponents from rocket splash.');
worldMeshes=arenaMeshes;effects.forEach(e=>{scene.remove(e.mesh);if(e.ownMat)e.mesh.material.dispose()});effects=[];
credits=500;owned=[0];equipped=0;round=1;perks={};showShop();buyUpgrade('gun5');assert.ok(owned.includes(5));assert.equal(credits,200);assert.equal(JSON.parse(localStorage.getItem('dh-run')).phase,'shop');$('nextmatch').onclick();assert.equal(round,2);assert.ok(owned.includes(5));assert.equal(grenades,2);assert.equal(JSON.parse(localStorage.getItem('dh-run')).phase,'match');
results.push('Shop purchase deducts credits, persists weapon, and carries loadout into the next round.');
mode='play';locked=true;for(let i=0;i<2701&&mode==='play';i++){scene.updateMatrixWorld(true);update(1/30)}assert.equal(mode,'results');assert.ok(bots.reduce((s,b)=>s+b.score,0)>0);results.push('Full 90-second match completes; opponents fight, score, and respawn.');
matchPoints=99999;endMatch();assert.equal(mode,'results');assert.ok(localStorage.getItem('dh-run'));matchPoints=0;bots.forEach(b=>b.score=100);endMatch();assert.equal(localStorage.getItem('dh-run'),null);results.push('Top-three finish saves progression; bottom-three finish ends the run.');
`);
console.log(context.results.join('\n'));
