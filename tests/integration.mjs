import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
const nodes=new Map(),storage=new Map();
function element(id){if(!nodes.has(id))nodes.set(id,{style:{},hidden:false,textContent:'',innerHTML:'',querySelector(){return element(id+'child')},querySelectorAll(){this.buttons=[...this.innerHTML.matchAll(/data-buy="([^"]+)"/g)].map(m=>({dataset:{buy:m[1]}}));return this.buttons;}});return nodes.get(id)}
const drawing=new Proxy({},{get:(o,p)=>o[p]||(()=>{})});
const context=vm.createContext({THREE,console,assert,results:[],innerWidth:1280,innerHeight:800,performance,
 document:{body:{classList:{add(){},remove(){}}},getElementById:element,createElement:()=>({getContext:()=>drawing}),addEventListener(){},exitPointerLock(){}},
 window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
let source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8').replace(/^import .*?;\n/,'').replace(/\ninit\(\);\s*$/,'');
vm.runInContext(source,context);
vm.runInContext(`
muted=true;scene=new THREE.Scene();arena=new THREE.Group();scene.add(arena);camera=new THREE.PerspectiveCamera(85,1,.07,160);scene.add(camera);renderer={domElement:{requestPointerLock(){}}};previewDummy=new THREE.Group();buildArena();buildNav();buildWeapon();makeBots();
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
playerPos.set(0,1.12,0);camera.position.copy(playerPos);camera.lookAt(0,1.12,-30);equipped=0;ammo=30;reloading=0;shotTimer=0;respawnTime=0;let one=targetAt(-8);scene.updateMatrixWorld(true);shoot();assert.equal(one.hp,99976);assert.equal(ammo,29);
results.push('Rifle consumes one round and applies one torso hit.');
let two=targetAt(-16);one.hp=two.hp=100;equipped=3;ammo=4;shotTimer=0;scene.updateMatrixWorld(true);const beforeRail=matchKills;shoot();assert.equal(matchKills,beforeRail+2);assert.ok(one.dead&&two.dead);
results.push('Rail shot pierces two opponents and awards exactly two kills.');
bots.forEach(b=>scene.remove(b.group));bots=[];
function shotgunAt(distance){bots.forEach(b=>scene.remove(b.group));bots=[];const b=targetAt(-distance);equipped=5;let total=0;for(let i=0;i<100;i++){b.hp=100000;shotTimer=0;ammo=8;scene.updateMatrixWorld(true);shoot();total+=100000-b.hp}return total/100}
const near=shotgunAt(3),mid=shotgunAt(22),far=shotgunAt(55);assert.ok(near>mid&&mid>far&&far>0);results.push('Shotgun mean damage (3m / 22m / 55m): '+near.toFixed(0)+' / '+mid.toFixed(0)+' / '+far.toFixed(0)+'.');
bots.forEach(b=>scene.remove(b.group));bots=[];playerPos.set(0,1.7,0);health=100;respawnTime=0;vy=0;explode(new THREE.Vector3(0,.1,0),null);assert.ok(vy>3);assert.ok(health>0&&health<100);results.push('Rocket splash causes self-damage and upward rocket-jump impulse.');
worldMeshes=arenaMeshes;effects.forEach(e=>{scene.remove(e.mesh);if(e.ownMat)e.mesh.material.dispose()});effects=[];
credits=500;owned=[0];equipped=0;round=1;perks={};showShop();const buy=$('panel').buttons.find(b=>b.dataset.buy==='gun5');buy.onclick();assert.ok(owned.includes(5));assert.equal(credits,200);assert.equal(JSON.parse(localStorage.getItem('dh-run')).phase,'shop');$('nextmatch').onclick();assert.equal(round,2);assert.ok(owned.includes(5));assert.equal(grenades,2);assert.equal(JSON.parse(localStorage.getItem('dh-run')).phase,'match');
results.push('Shop purchase deducts credits, persists weapon, and carries loadout into the next round.');
mode='play';locked=true;for(let i=0;i<2701&&mode==='play';i++){scene.updateMatrixWorld(true);update(1/30)}assert.equal(mode,'results');assert.ok(bots.reduce((s,b)=>s+b.score,0)>0);results.push('Full 90-second match completes; opponents fight, score, and respawn.');
matchKills=999;endMatch();assert.equal(mode,'results');assert.ok(localStorage.getItem('dh-run'));matchKills=0;bots.forEach(b=>b.score=100);endMatch();assert.equal(localStorage.getItem('dh-run'),null);results.push('Top-three finish saves progression; bottom-three finish ends the run.');
`,context,{timeout:30000});
console.log(context.results.join('\n'));
