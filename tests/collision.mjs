import assert from 'node:assert/strict';
import {COLLISION,bodyContacts,canOccupy,moveCharacter,recoverBody} from '../dist/collision.js';
import {createGameHarness} from './harness.mjs';
const solid=(x,z,w,d,bottom=0,top=4,yaw=0)=>({x,z,w,d,bottom,top,yaw});
const body=(x,z,feet=0,height=1.9)=>({x,z,feet,height,radius:.4});
const move=(blocks,p,x,z,y=-.01,grounded=true)=>moveCharacter(blocks,p,{x,y,z},{grounded});
let p=body(-2,0),wall=[solid(0,0,1,12)];for(let i=0;i<240;i++){p=move(wall,p,.07,.03);assert.ok(canOccupy(wall,p))}assert.ok(p.z>6,'diagonal input slides along and past wall');
p=body(-2,-2);const corner=[solid(0,0,1,7),solid(-2,2,5,1)];for(let i=0;i<80;i++){p=move(corner,p,.08,.08);assert.ok(canOccupy(corner,p))}const trapped={...p};for(let i=0;i<35;i++)p=move(corner,p,-.08,-.08);assert.ok(Math.hypot(p.x-trapped.x,p.z-trapped.z)>2,'reverse input always leaves an inside corner');
// Legacy overlap at a floor / wall seam resolves locally instead of resetting position.
const seam=[solid(0,0,2,6),solid(2,0,4,6,0,.25)];p=body(-1.35,0);assert.ok(bodyContacts(seam,p).length);const recovered=recoverBody(seam,p);assert.ok(canOccupy(seam,recovered));assert.ok(Math.hypot(recovered.x-p.x,recovered.feet-p.feet,recovered.z-p.z)<.1);
// A step cannot raise the player's head into a ceiling at the same corner.
const low=[solid(0,0,3,4,0,.25),solid(0,0,3,4,2.02,2.4)];p=body(-2.1,0);for(let i=0;i<90;i++){p=move(low,p,.05,.01);assert.ok(canOccupy(low,p))}assert.ok(p.x< -1.8,'step with insufficient headroom is blocked');for(let i=0;i<30;i++)p=move(low,p,-.05,0);assert.ok(p.x< -3,'can back away from step/ceiling corner');
// Thin floors and ceilings cannot be skipped by fast rocket/jump-pad displacement.
p=moveCharacter([solid(0,0,10,10,3,3.05)],body(0,0,9),{x:0,y:-15,z:0});assert.ok(Math.abs(p.feet-3.05)<.002);assert.ok(p.grounded);
p=moveCharacter([solid(0,0,10,10,3,3.05)],body(0,0),{x:0,y:14,z:0});assert.ok(p.feet+1.9<=3.001);assert.ok(p.ceiling);
p=move([solid(0,0,.04,8)],body(-5,0),15,0,0,false);assert.ok(p.x<0,'high-speed movement cannot tunnel through thin wall');
// Rounded footprint and rotated colliders share contact normals with slide resolution.
const angled=[solid(0,0,1,14,0,5,Math.PI/4)];p=body(-4,-4);for(let i=0;i<300;i++){p=move(angled,p,.05,.03);assert.ok(canOccupy(angled,p))}
// Actual map traversal: stairs, undersides and corners sampled across all tiers.
const h=createGameHarness();h.setup();const data=h.run('({blocks:JSON.parse(JSON.stringify(blocks)),stairs:MAP.stairs,bounds:MAP.bounds,spawns:MAP.spawns})');
for(const stair of data.stairs){p=body(stair.start.x,stair.start.z,stair.start.y);let vy=0;for(let i=0;i<650;i++){const dx=stair.end.x-p.x,dz=stair.end.z-p.z,l=Math.hypot(dx,dz);vy-=23/120;p=moveCharacter(data.blocks,p,{x:dx/Math.max(l,1)*.055,y:vy/120,z:dz/Math.max(l,1)*.055},{grounded:p.grounded??true,bounds:data.bounds});if(p.grounded||p.ceiling)vy=0;assert.ok(canOccupy(data.blocks,p),'stair traversal never embeds player');if(l<.1)break}assert.ok(Math.abs(p.feet-stair.end.y)<.05,'player climbs complete real staircase')}
let seed=12;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};let checks=0;
for(const spawn of data.spawns){p=body(spawn[0],spawn[2],spawn[1]);let vy=0,dx=0,dz=0;for(let i=0;i<1200;i++){if(i%30===0){const a=rand()*Math.PI*2;dx=Math.sin(a)*.12;dz=Math.cos(a)*.12;if(rand()<.25&&p.grounded)vy=9}vy-=23/120;p=moveCharacter(data.blocks,p,{x:dx,y:vy/120,z:dz},{grounded:p.grounded??true,bounds:data.bounds});if(p.grounded||p.ceiling)vy=0;assert.ok(canOccupy(data.blocks,p),'random full-map movement remains outside solids');checks++}}
h.run(`
mode='play';locked=true;opponentAI=null;bots=[];pickups=[];rockets=[];crouched=true;eyeHeight=.95;playerPos.set(0,.95,0);keys.clear();blocks=[{x:0,z:0,w:4,d:4,bottom:1.3,top:2}];updateStance();assert.equal(crouched,true);assert.equal(headBlocked,true);assert.equal($('head-blocked').hidden,false);assert.equal(playerPos.y,.95);blocks=[];updateStance();assert.equal(crouched,false);assert.equal(headBlocked,false);assert.equal($('head-blocked').hidden,true);assert.equal(playerPos.y,1.7);
`);
h.run(`
// A ceiling corner inside the body's radius must block standing, even outside the old smaller head margin.
crouched=true;eyeHeight=.95;playerPos.set(.2,.95,0);keys.clear();blocks=[{x:.76,z:0,w:.4,d:2,bottom:1.4,top:2}];updateStance();assert.ok(headBlocked);assert.ok(crouched);
`);
const pads=createGameHarness();pads.setup();pads.run(`mode='play';muted=true;opponentAI=null;bots=[];keys.clear();mouseDown=false;
for(const p of MAP.pads){eyeHeight=1.7;crouched=false;playerPos.set(p.x,(p.y||0)+1.7,p.z);viewHeight=playerPos.y;grounded=true;vy=0;vel.set(0,0,0);playerPadFlight=null;let landed=false;for(let i=0;i<450;i++){updateStep(1/120);assert.ok(canOccupy(blocks,{x:playerPos.x,z:playerPos.z,feet:playerPos.y-eyeHeight,radius:COLLISION.radius,height:1.9}));if(i>5&&grounded&&!playerPadFlight){landed=true;break}}assert.ok(landed);assert.ok(Math.abs(playerPos.y-eyeHeight-p.landing.y)<.05);assert.ok(Math.hypot(playerPos.x-p.landing.x,playerPos.z-p.landing.z)<.3,'real player pad lands on intended platform')}
`);
console.log(`Collision: wall/corner sliding and escape, local seam recovery, headroom-safe steps/uncrouch, thin surfaces at high speed, rotated walls, all real staircases and ${checks} full-map trajectory steps pass.`);
