import assert from 'node:assert/strict';
import {createGameHarness} from './harness.mjs';
import {TouchState,AutoFire,mobileSettings,CONTROL_DEFS,normalizeLayout} from '../dist/mobile-core.js';
import {MobileController} from '../dist/mobile.js';
import {ControlBindings} from '../dist/controls.js';
assert.ok(!CONTROL_DEFS.reload);assert.ok(!('reload' in normalizeLayout({reload:{x:.4,y:.6}})),'old saved reload buttons disappear');
assert.equal(new ControlBindings().actionsFor('KeyV')[0].id,'melee');
assert.equal(new ControlBindings({weapon1:['KeyV','']}).actionsFor('KeyV')[0].id,'melee','retired gun bindings no longer suppress melee');
const h=createGameHarness();h.setup();Object.assign(h.context,{TouchState,AutoFire,MobileController,mobileSettings});
h.run(`
mode='play';locked=true;respawnTime=0;opponentAI=null;pickups=[];worldMeshes=[];blocks=[];MAP.water=[];MAP.bounds={x:30,z:30};delete MAP.killBelow;
const enemy=bots[0];for(const b of bots.slice(1))scene.remove(b.group);bots=[enemy];owned=[0,1,2,3,4,5];
function ready(z=-1.5,hp=100){
 enemy.dead=0;enemy.hp=enemy.maxHealth=hp;enemy.baseHealth=100;resetDummyRig(enemy);enemy.group.visible=true;enemy.pos.set(0,0,z);enemy.group.position.copy(enemy.pos);enemy.group.rotation.set(0,0,0);scene.updateMatrixWorld(true);
 playerPos.set(0,1.7,0);viewHeight=eyeHeight=1.7;yaw=pitch=recoil=recoilX=0;vy=0;grounded=true;vel.set(0,0,0);meleeCooldown=meleeSwing=0;mobileTargetIdle=0;mobileTargetClock=0;mobileMeleeTarget=false;mobileTarget=null;mouseDown=false;keys.clear();worldMeshes=[];
 equipped=0;builds=normalizeBuilds();perks=normalizePerks();buildWeapon();resetFireControl();feedSystem.reset(owned,i=>playerWeapon(i));playerGunFire.reset(playerWeapon(),playerGunLife.id);syncModularAmmo();reloading=shotTimer=0;
}
// Exact percent of maximum, independent of hit region, armor and weapon damage.
mobile=null;ready();const heads=headshotKills,kills=matchKills;const rounds=ammo;
assert.equal(melee(),true);assert.equal(enemy.hp,50);assert.equal(ammo,rounds);assert.equal(headshotKills,heads);assert.equal(melee(),false);assert.equal(enemy.hp,50,'cooldown prevents duplicate hits');
for(let i=0;i<60;i++)updateStep(1/120);assert.equal(melee(),true);assert.ok(enemy.dead>0);assert.equal(matchKills,kills+1);assert.equal(headshotKills,heads,'a head contact is not a headshot bonus');
ready(-1.5,150);melee();assert.equal(enemy.hp,75,'armored maximum uses the same 50% rule');
ready(-3);assert.equal(melee(),false);assert.equal(enemy.hp,100,'out of reach');
ready();const wall=new THREE.Mesh(new THREE.BoxGeometry(3,3,.12),new THREE.MeshBasicMaterial());wall.position.set(0,1.5,-.7);wall.updateMatrixWorld(true);worldMeshes=[wall];assert.equal(melee(),false);assert.equal(enemy.hp,100,'solid cover blocks melee');
ready();respawnTime=1;assert.equal(melee(),false);respawnTime=0;locked=false;assert.equal(melee(),false);locked=true;mode='menu';assert.equal(melee(),false);mode='play';
ready();playerGunFire.ammo=10;syncModularAmmo();reload();assert.ok(reloading>0);assert.equal(melee(),true);assert.equal(reloading,0);assert.equal(feedSystem.state(equipped).reload,null);assert.equal(shoot(),false,'melee swing prevents simultaneous firearm discharge');
// Desktop primary/secondary rebind and key-repeat protection.
ready();physicalKeys.clear();inputPress('KeyV',{preventDefault(){}});assert.equal(enemy.hp,50);inputPress('KeyV',{preventDefault(){}});assert.equal(enemy.hp,50);physicalKeys.clear();meleeCooldown=meleeSwing=0;controls.assign('melee',1,'KeyB');inputPress('KeyB',{preventDefault(){}});assert.ok(enemy.dead>0);physicalKeys.clear();
// Both touch firing modes melee continuously, without firing a round.
for(const fireMode of ['simple','manual']){
 ready();mobile={enabled:true,active:true,state:new TouchState(),auto:new AutoFire(),settings:mobileSettings({fireMode}),api:{read:()=>mobileGameState},trigger:MobileController.prototype.trigger,practice:true};
 const fired=shotsFired;updateStep(1/120);assert.equal(enemy.hp,50);for(let i=0;i<45;i++)updateStep(1/120);assert.equal(enemy.hp,50);for(let i=0;i<20;i++)updateStep(1/120);assert.ok(enemy.dead>0);assert.equal(shotsFired,fired,'nearby automatic melee takes priority over gunfire');
 ready();mobileTargetClock=0;updateStep(1/120);assert.equal(enemy.hp,50);yaw=Math.PI;mobileTargetClock=0;for(let i=0;i<90;i++)updateStep(1/120);assert.equal(enemy.hp,50,'losing aim immediately stops repeat melee');
}
// Quiet reload uses each modular build's actual reload duration.
ready(-12);mobile.active=true;mobile.state.clear();mobile.settings.fireMode='manual';mobileTarget=null;mouseDown=false;
for(const mechanism of ['automatic','semi','burst','charge'])for(const barrel of ['single','double','huge','gatling','rails']){
 practiceCollection=fullCollection();practiceCollection.kit.mechanism={id:mechanism,rank:2};practiceCollection.kit.barrel={id:barrel,rank:1};buildWeapon();playerGunFire.reset(playerWeapon(),playerGunLife.id);playerGunFire.ammo=playerWeapon().mag-2;syncModularAmmo();reloading=meleeSwing=0;mobileTargetIdle=0;const wait=2*playerWeapon().reload;stepMobileReload(wait-.001);assert.equal(reloading,0);stepMobileReload(.0011);assert.ok(reloading>0);assert.ok(Math.abs(reloadLength-wait/2)<1e-6);
}
ready(-12);mobileTarget=null;playerGunFire.ammo=12;syncModularAmmo();const wait=2*playerWeapon().reload;stepMobileReload(wait*.75);mobileTarget='enemy';stepMobileReload(wait*3);assert.equal(reloading,0,'maintained targeting prevents a tactical reload');assert.equal(mobileTargetIdle,0);mobileTarget=null;stepMobileReload(wait-.001);assert.equal(reloading,0);stepMobileReload(.002);assert.ok(reloading>0,'target acquisition resets the entire quiet window');
ready(-12);playerGunFire.ammo=10;syncModularAmmo();stepMobileReload(.7);assert.equal(equipped,0,'there is one gun');mobileTargetIdle=0;
ready(-12);playerGunFire.ammo=10;syncModularAmmo();mouseDown=true;stepMobileReload(20);assert.equal(reloading,0,'manual fire prevents an idle reload');mouseDown=false;
ready(-12);playerGunFire.ammo=0;syncModularAmmo();mobileTarget='enemy';stepMobileReload(.001);assert.ok(reloading>0,'empty gun still reloads immediately while targeting');
ready(-12);playerGunFire.ammo=10;syncModularAmmo();mobile.active=false;stepMobileReload(20);assert.equal(reloading,0);mobile.active=true;mobile=null;stepMobileReload(20);assert.equal(reloading,0,'desktop retains manual reload');
`);
console.log('Close combat: max-health damage, reach/cover/lifecycle/cooldown, rebound desktop key, automatic mobile repeats/aim loss, no firearm overlap, retired reload layout and exact per-feed/perk quiet reload timing pass.');
