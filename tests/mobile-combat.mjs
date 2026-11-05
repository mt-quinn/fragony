import assert from 'node:assert/strict';
import {CONTROL_DEFS,normalizeLayout,TouchState,AutoFire,mobileSettings} from '../dist/mobile-core.js';
import {MobileController} from '../dist/mobile.js';
import {ACTIONS} from '../dist/controls.js';
import {createGameHarness} from './harness.mjs';
for(const id of ['grenade','reload','streak','swap']){assert.ok(!CONTROL_DEFS[id]);assert.ok(!(id in normalizeLayout({[id]:{x:.5}})));}assert.ok(!ACTIONS.some(a=>a.id==='streak'||a.id.startsWith('weapon')));
const h=createGameHarness();h.setup();Object.assign(h.context,{TouchState,AutoFire,MobileController,mobileSettings});h.run(`
mode='play';locked=true;time=10000;respawnTime=0;health=200;opponentAI=null;pickups=[];worldMeshes=[];blocks=[];MAP.water=[];MAP.bounds={x:30,z:30};delete MAP.killBelow;settings.motion=0;
const target=bots[0];for(const bot of bots.slice(1))scene.remove(bot.group);bots=[target];target.pos.set(0,0,-12);target.group.position.copy(target.pos);target.dead=0;target.hp=1000000;scene.updateMatrixWorld(true);
mobile={enabled:true,active:true,state:new TouchState(),auto:new AutoFire(),settings:mobileSettings(),api:{read:()=>mobileGameState},trigger:MobileController.prototype.trigger,practice:false};practiceMode=false;
let count=0;for(const mechanism of ['automatic','semi','burst','charge'])for(const barrel of ['single','double','huge','gatling','rails'])for(const ammoType of ['normal','pellets','sniper','explosive','piercing','duplex']){
 gunCollection=createCollection();for(const [slot,id]of [['mechanism',mechanism],['barrel',barrel],['ammo',ammoType]]){gunCollection.owned[id]=0;gunCollection.kit[slot]={id,rank:0};}playerGunFire.reset(playerWeapon(),playerGunLife.id);syncModularAmmo();mobile.auto.reset();mobileTargetClock=0;playerPos.set(0,1.7,0);viewHeight=eyeHeight=1.7;yaw=pitch=0;vel.set(0,0,0);vy=0;grounded=true;weaponMotion.reset();aimSpring.reset();modularProjectiles?.clear();target.hp=1000000;const before=shotsFired;for(let i=0;i<100;i++)updateStep(1/120);assert.ok(shotsFired>before,mechanism+'/'+barrel+'/'+ammoType+' auto-fires');count++;
}assert.equal(count,120);
gunCollection.kit.mechanism={id:'charge',rank:0};gunCollection.kit.barrel={id:'single',rank:0};gunCollection.kit.ammo={id:'normal',rank:0};playerGunFire.reset(playerWeapon(),playerGunLife.id);playerPos.set(0,1.7,0);viewHeight=1.7;yaw=pitch=0;weaponMotion.reset();aimSpring.reset();mobile.auto.reset();mobileTargetClock=0;for(let i=0;i<20;i++)updateStep(1/120);assert.ok(playerGunFire.capacitor<1);const before=shotsFired;bots=[];mobileTargetClock=0;for(let i=0;i<1200;i++)updateStep(1/120);assert.equal(shotsFired,before,'target loss never fires the stored charge');assert.equal(playerGunFire.capacitor,1,'charge stays ready through long target loss');mobile=null;
`,{timeout:180000});
console.log('Mobile combat: all 120 physical combinations auto-fire; long target loss retains charge without firing; retired grenade/reload/streak/swap controls disappear.');
