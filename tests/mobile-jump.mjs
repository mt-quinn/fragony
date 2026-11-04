import assert from 'node:assert/strict';
import {MobileAutoJump,AUTO_JUMP} from '../dist/mobile-jump.js';
import {createGameHarness} from './harness.mjs';
const blocked={enabled:true,grounded:true,wishX:0,wishZ:-7.5,movedX:0,movedZ:0,normals:[{x:0,z:1}]};
for(const fps of [30,60,120,144]){
 const jump=new MobileAutoJump();let elapsed=0,fired=false;
 while(!fired&&elapsed<1){fired=jump.step(1/fps,blocked);elapsed+=1/fps;}
 assert.ok(elapsed>=AUTO_JUMP.delay-1e-8&&elapsed<AUTO_JUMP.delay+1/fps+1e-8);
 for(let i=0;i<5;i++)assert.equal(jump.step(1/fps,blocked),false,'cooldown suppresses immediate repeats');
}
for(const change of [{enabled:false},{grounded:false},{ceiling:true},{launched:true},{wishZ:0},{wishZ:-.2}]){
 const waterJump=new MobileAutoJump();for(let i=0;i<20;i++)waterJump.step(1/120,{...blocked,grounded:false,swimming:true});assert.ok(waterJump.hold>0,'blocked swimmers initiate a held jump');
const jump=new MobileAutoJump();for(let i=0;i<12;i++)jump.step(1/120,blocked);
 assert.equal(jump.step(1/120,{...blocked,...change}),false);assert.equal(jump.age,0);
 for(let i=0;i<8;i++)assert.equal(jump.step(1/120,blocked),false,'state transitions cannot bank an old jump');
}
const jump=new MobileAutoJump();for(let i=0;i<12;i++)jump.step(1/120,blocked);
assert.equal(jump.step(1/120,{...blocked,wishX:7.5,wishZ:0,normals:[{x:-1,z:0}]}),false,'turning restarts the timer');assert.ok(jump.age<.02);
jump.reset();for(let i=0;i<120;i++)assert.equal(jump.step(1/120,{...blocked,movedZ:-7.5/120,normals:[]}),false,'free movement never auto-jumps');
for(let i=0;i<120;i++)assert.equal(jump.step(1/120,{...blocked,wishX:7.5,movedX:7.5/120}),false,'useful tangential wall sliding never auto-jumps');
assert.equal(jump.step(1,blocked),false,'a stalled frame cannot trigger a jump');
const h=createGameHarness();h.setup();h.run(`
mode='play';locked=true;opponentAI=null;bots=[];pickups=[];worldMeshes=[];equipped=0;owned=[0];builds=normalizeBuilds();health=100;respawnTime=0;reloading=shotTimer=0;
MAP.bounds={x:20,z:20};MAP.stepHeight=.3;delete MAP.killBelow;blocks=[{x:0,z:-1,w:8,d:1,bottom:0,top:5}];
playerPos.set(0,1.7,.05);viewHeight=1.7;eyeHeight=1.7;vy=0;vel.set(0,0,0);grounded=true;yaw=pitch=0;playerSlide.reset();mobileAutoJump.reset();
mobile={enabled:true,active:true,state:{move:{x:0,y:1},held:new Set(),ads:false,focus:false},settings:{fireMode:'simple',holdSemi:true,aimAssist:false},trigger:()=>false};
let peak=1.7,jumped=false;for(let i=0;i<105;i++){updateStep(1/120);if(vy===FEEL.jumpSpeed)jumped=true;peak=Math.max(peak,playerPos.y);}
assert.ok(jumped,'native obstruction detection applies the full existing jump impulse');assert.ok(peak-1.7>1.48&&peak-1.7<1.61,'auto-jump reaches full normal height');
// Held jump lasts at least half a second even if movement releases after triggering.
mobileAutoJump.reset();mobileAutoJump.hold=.5;mobile.state.move.y=0;let heldTime=0;for(let i=0;i<61;i++){updateStep(1/120);if(keys.has('Space'))heldTime+=1/120;}assert.ok(heldTime>=.5-1e-8,'native jump input is held for at least 500 ms');
// Release and free movement clear the timer; desktop remains manual.
mobile.state.move.y=0;updateStep(1/120);assert.equal(mobileAutoJump.age,0);
mobileAutoJump.reset();mobile=null;keys.clear();keys.add('KeyW');playerPos.set(0,1.7,.05);viewHeight=1.7;vy=0;vel.set(0,0,0);grounded=true;
for(let i=0;i<70;i++)updateStep(1/120);assert.equal(grounded,true);assert.equal(vy,0,'desktop obstruction never auto-jumps');
keys.add('Space');updateStep(1/120);assert.ok(vy>8,'desktop jump remains available');
`);
console.log('Auto-jump: 30/60/120/144 FPS delay, stable direction, obstruction/progress, cooldown/reset guards, native full-height jump and manual desktop controls pass.');
h.run(`
mode='play';locked=true;respawnTime=0;health=100;keys.clear();bots=[];opponentAI=null;pickups=[];worldMeshes=[];rockets=[];
mobile={enabled:true,active:true,state:{move:{x:0,y:1},held:new Set(),ads:false,focus:false},settings:{fireMode:'simple',holdSemi:true,aimAssist:false},trigger:()=>false};
MAP.water=[{x:0,z:4,w:10,d:9,bottom:-1,top:1.6}];MAP.bounds={x:20,z:20};MAP.stepHeight=.3;blocks=[{x:0,z:-1,w:8,d:1,bottom:0,top:1.3}];
playerPos.set(0,1.7,.05);viewHeight=1.7;eyeHeight=1.7;vy=0;vel.set(0,0,0);grounded=true;yaw=pitch=0;lastJumpHeld=false;playerSlide.reset();mobileAutoJump.reset();
let waterHeld=0;for(let i=0;i<360;i++){updateStep(1/120);if(keys.has('Space'))waterHeld+=1/120;}
assert.ok(waterHeld>=.5-1e-8,'water exit receives sustained upward input');assert.ok(playerPos.z<-.7,'native held auto-jump climbs out over a 1.3m bank');
`);
console.log('Water exit: native buoyancy, sustained jump input and forward movement clear a raised bank without a jump button.');
