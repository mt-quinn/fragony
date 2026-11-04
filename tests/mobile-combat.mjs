import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONTROL_DEFS,normalizeLayout,TouchState,AutoFire,mobileSettings} from '../dist/mobile-core.js';
import {MobileController} from '../dist/mobile.js';
import {ACTIONS,ControlBindings} from '../dist/controls.js';
import {normalizeEquipment,EQUIPMENT,normalizeBuilds,migrateLoadoutSave} from '../dist/loadout.js';
import {createGameHarness} from './harness.mjs';
assert.ok(!ACTIONS.some(a=>a.id==='grenade'));assert.equal(new ControlBindings({grenade:['KeyG','']}).actionsFor('KeyG').length,0);
const layout=normalizeLayout({jump:{x:.2},grenade:{x:.3},crouch:{x:.4},ads:{x:.8}});for(const key of ['jump','grenade','crouch','ads']){assert.ok(!(key in CONTROL_DEFS));assert.ok(!(key in layout));}
const migratedLayout=normalizeLayout({ads:{x:.88,y:.36},focus:{x:.44,y:.66,scale:1.2}});assert.equal(migratedLayout.focus.x,.44);assert.equal(migratedLayout.focus.scale,1.2);assert.equal(mobileSettings({gyro:'ads'}).gyro,'off','retired ADS-only motion mode does not enable always-on motion');
assert.deepEqual(Object.keys(EQUIPMENT),['streak']);assert.deepEqual(normalizeEquipment({throwable:'quick',owned:['frag','impact','quick','surge'],streak:'surge'}),{streak:'surge',owned:['airstrike','surge']});
const old={attachmentVersion:2,credits:100,perks:{frags:true,armor:true},equipment:{throwable:'quick',owned:['frag','impact','quick','airstrike','surge'],streak:'surge'},builds:normalizeBuilds(),shopOffers:{version:2}};
const migrated=migrateLoadoutSave(old);assert.equal(migrated.credits,600);assert.equal(migrated.perks.armor,true);assert.equal(migrated.perks.frags,undefined);assert.equal(migrated.equipment.throwable,undefined);assert.equal(migrated.equipment.streak,'surge');assert.equal(migrated.shopOffers,null);assert.deepEqual(migrateLoadoutSave(migrated),migrated,'refund is idempotent');
const h=createGameHarness();h.setup();Object.assign(h.context,{TouchState,AutoFire,MobileController,mobileSettings});
h.run(`
mode='play';locked=true;respawnTime=0;health=100;opponentAI=null;pickups=[];worldMeshes=[];blocks=[];MAP.water=[];MAP.bounds={x:30,z:30};delete MAP.killBelow;
const target=bots[0];for(const bot of bots.slice(1))scene.remove(bot.group);bots=[target];target.pos.set(0,0,-12);target.group.position.copy(target.pos);target.dead=0;target.hp=1000000;scene.updateMatrixWorld(true);
playerPos.set(0,1.7,0);viewHeight=1.7;eyeHeight=1.7;yaw=pitch=0;vy=0;grounded=true;vel.set(0,0,0);owned=[0,1,2,3,4,5];
mobile={enabled:true,active:true,state:new TouchState(),auto:new AutoFire(),settings:mobileSettings(),api:{read:()=>mobileGameState},trigger:MobileController.prototype.trigger,practice:true};
const cases=[];
for(let g=0;g<6;g++)for(const action of [null,...WEAPON_SLOTS[g].action]){
 equipped=g;builds=action?previewBuild(normalizeBuilds(),g,'action',action.id):normalizeBuilds();buildWeapon();resetFireControl();mobile.auto.reset();mobileTargetClock=0;feedSystem.reset(owned,i=>playerWeapon(i));ammo=playerWeapon().mag;reloading=shotTimer=0;target.hp=1000000;target.dead=0;target.pos.set(0,0,-12);target.group.position.copy(target.pos);scene.updateMatrixWorld(true);playerPos.set(0,1.7,0);viewHeight=1.7;yaw=pitch=0;vel.set(0,0,0);vy=0;grounded=true;
 const before=shotsFired;for(let i=0;i<210;i++)updateStep(1/120);
 assert.ok(shotsFired>before,weapons[g].name+' '+(action?.name||'stock')+' fires automatically with no touch fire input');
 cases.push([g,action?.id||'stock',shotsFired-before]);
}
assert.equal(cases.length,24);
// Automatic charged rockets discharge at full charge, and cancel on loss of a real target.
equipped=4;builds=previewBuild(normalizeBuilds(),4,'action','4-action-pressure');buildWeapon();resetFireControl();mobile.auto.reset();mobileTargetClock=0;feedSystem.reset(owned,i=>playerWeapon(i));ammo=5;reloading=shotTimer=0;target.hp=1000000;playerPos.set(0,1.7,0);viewHeight=1.7;yaw=pitch=0;scene.updateMatrixWorld(true);
const chargedBefore=shotsFired;for(let i=0;i<35;i++)updateStep(1/120);assert.ok(fireControl.charging);assert.equal(shotsFired,chargedBefore);
bots=[];mobileTargetClock=0;for(let i=0;i<100;i++)updateStep(1/120);assert.equal(shotsFired,chargedBefore,'target loss cannot discharge an automatically charged rocket');assert.equal(fireControl.charging,false);
// No static conversion labels around the reticle.
mobile=null;equipped=1;builds=previewBuild(normalizeBuilds(),1,'action','1-action-twin');buildWeapon();resetFireControl();present(1/60);assert.equal($('weapon-state').textContent,'');
`);
for(const name of ['game.js','mobile.js','loadout-view.js'])assert.ok(!/\bpulls?\b/i.test(fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8')),'player UI never calls shots pulls');
console.log('Mobile combat: all 24 stock/action configurations auto-fire, charged launcher discharge/loss cancellation, retired controls/gear/bindings, idempotent refunds and reticle/shot wording pass.');
