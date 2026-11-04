import assert from'node:assert/strict';import{MAPS}from'../dist/map.js';import{moveCharacter,canOccupy}from'../dist/collision.js';
for(const m of MAPS)assert.equal(m.stepHeight,.6,m.id+' native source riser clearance');
for(const fps of[30,60,144])for(const angle of[0,.37,Math.PI/4,Math.PI/2,2.1])for(const lateral of[-.7,0,.7])for(const rise of[.25,.5,.59]){
 const c=Math.cos(angle),s=Math.sin(angle),n=15,depth=.32,length=n*depth,blocks=[];
 const box=(x,w,top)=>({x:c*x,z:-s*x,w,d:3,bottom:0,top,yaw:angle});for(let i=0;i<n;i++)blocks.push(box((i+.5)*depth,depth,(i+1)*rise));blocks.push(box(length+1,2,n*rise));
 const point=x=>({x:c*x+s*lateral,z:-s*x+c*lateral});let p={...point(-1),feet:0,radius:.4,height:1.9},vy=0,grounded=true;
 for(const [x,height]of[[length+1,n*rise],[-1,0]]){const target=point(x);let reached=false;for(let frame=0;frame<fps*8;frame++){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);vy-=23/fps;p=moveCharacter(blocks,p,{x:dx/Math.max(d,.001)*Math.min(d,4/fps),z:dz/Math.max(d,.001)*Math.min(d,4/fps),y:vy/fps},{grounded,stepHeight:.6});grounded=p.grounded;if(p.grounded||p.ceiling)vy=0;assert.ok(canOccupy(blocks,p),'stair body stays clear');assert.ok(grounded,'walking follows each tread without airborne bouncing');if(d<.08&&Math.abs(p.feet-height)<.01){reached=true;break;}}assert.ok(reached,'complete staircase '+fps+'fps '+angle+' height '+height);}
}
const obstacle=[{x:0,z:0,w:1,d:3,bottom:0,top:.75}];let p={x:-2,z:0,feet:0,radius:.4,height:1.9};for(let i=0;i<100;i++)p=moveCharacter(obstacle,p,{x:.05,y:-.01,z:0},{grounded:p.grounded??true,stepHeight:.6});assert.ok(p.x<-.89&&p.feet===0,'full obstacles retain their height');
const low=[{x:0,z:0,w:2,d:3,bottom:0,top:.55},{x:0,z:0,w:2,d:3,bottom:2.25,top:3}];p={x:-2,z:0,feet:0,radius:.4,height:1.9};for(let i=0;i<80;i++)p=moveCharacter(low,p,{x:.05,y:-.01,z:0},{grounded:p.grounded??true,stepHeight:.6});assert.ok(p.x< -1.39,'low soffit prevents unsafe standing step');
console.log('Stairs: all20 map riser limits;135 full stair flights up/down at30/60/144Hz, oblique approaches, continuous tread contact, obstacle heights and soffit safety pass.');
// Native sloping treads can have adjacent support heights within the skin.
// Losing grounding here used to disable step-up indefinitely, even under gravity.
const native=MAPS.find(m=>m.id==='firingrange');await native.load();
for(const start of[{x:13.43581447077,z:24.000006769615,feet:.59375,direction:-1},{x:-16.5011115937,z:6.0012413838,feet:2.96875,direction:-1}]){
 let p={...start,radius:.4,height:1.9},grounded=false,vy=0;for(let i=0;i<24;i++){vy-=23/60;p=moveCharacter(native.brushes,p,{x:start.direction*.05,y:vy/60,z:0},{grounded,stepHeight:.6});grounded=p.grounded;if(grounded||p.ceiling)vy=0;assert.ok(canOccupy(native.brushes,p));}assert.ok(Math.abs(p.x-start.x)>.7,'native seam resumes walking without a jump');
}
console.log('Native Firing Range seams: initially ungrounded players regain tread contact and walk up both formerly stuck approaches.');
