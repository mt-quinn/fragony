import assert from 'node:assert/strict';
import {TriangleCollision} from '../dist/maps/triangle-collision.js';
import {nearBlocks} from '../dist/geometry.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
const pack=(values,T)=>Buffer.from(new T(values).buffer).toString('base64'),decode=(s,T)=>{const b=Uint8Array.from(Buffer.from(s,'base64'));return new T(b.buffer)};
const model={p:pack([-10,3,-10,10,3,-10,10,3,10,-10,3,10,2,3,-3,2,7,-3,2,7,3,2,3,3],Float32Array),i:pack([0,2,1,0,3,2,4,5,6,4,6,7],Uint32Array),b:pack([-10,3,-10,10,7,10],Float32Array),l:pack([-1,4],Int32Array)};
const mesh=new TriangleCollision({models:[model],instances:[{proto:0,matrix:[[1,0,0,0],[0,1,0,0],[0,0,1,0]],inverse:[[1,0,0,0],[0,1,0,0],[0,0,1,0]],bounds:[-10,3,-10,10,7,10]}]},decode),blocks=[];blocks.triangleCollision=mesh;
assert.ok(nearBlocks(blocks,0,0,.4,2.9,3.1).length,'native floor found through the spatial index');
assert.equal(nearBlocks(blocks,40,40,.4).length,0,'remote geometry excluded');
assert.ok(canOccupy(blocks,{x:0,z:0,feet:3.005,height:1.9,radius:.4}));
assert.ok(!canOccupy(blocks,{x:2,z:0,feet:3.005,height:1.9,radius:.4}),'native wall face blocks standing body');
let p=moveCharacter(blocks,{x:0,z:0,feet:3.005,height:1.9,radius:.4},{x:4,y:0,z:0},{grounded:true});assert.ok(p.x>1.5&&p.x<1.61,'native wall stops continuous motion at the actual surface');
p={x:0,z:0,feet:8,height:1.9,radius:.4};let vy=0;for(let i=0;i<240;i++){vy-=23/120;p=moveCharacter(blocks,p,{x:0,y:vy/120,z:0});if(p.grounded){vy=0;break;}}assert.ok(p.grounded&&Math.abs(p.feet-3)<.02,'real source floor supports a gravity-driven landing above the engine hard floor');
assert.ok(mesh.faces.size<=16000&&mesh.queries.size<=96,'native query caches stay bounded');
console.log('Native collision BVH: exact wall contact, source floor landing, clearance, range rejection and bounded caches pass.');
// Imported convex cover uses one transformed plane set, without expanding its
// source hull into hundreds of thin face prisms.
const encodeFloats=v=>Buffer.from(new Float32Array(v).buffer).toString('base64'),decodeFloats=(s,T)=>{const b=Buffer.from(s,'base64');return new T(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))};
const hullData={models:[{h:encodeFloats([1,0,0,1,-1,0,0,1,0,1,0,3,0,-1,0,0,0,0,1,1,0,0,-1,1])}],instances:[{proto:0,matrix:[[2,0,0,4],[0,1,0,0],[0,0,.5,0]],inverse:[[.5,0,0,-2],[0,1,0,0],[0,0,2,0]],bounds:[2,0,-.5,6,3,.5]}]};
const convexBlocks=[];convexBlocks.triangleCollision=new TriangleCollision(hullData,decodeFloats);assert.equal(convexBlocks.triangleCollision.query(2,0,1).length,1);assert.equal(canOccupy(convexBlocks,{x:4,z:0,feet:1,height:1.9,radius:.4}),false);assert.equal(canOccupy(convexBlocks,{x:1.5,z:0,feet:0,height:1.9,radius:.4}),true);let hullBody={x:4,z:0,feet:5,height:1.9,radius:.4};for(let i=0;i<120;i++)hullBody=moveCharacter(convexBlocks,hullBody,{x:0,y:-.05,z:0});assert.ok(hullBody.grounded&&Math.abs(hullBody.feet-3)<.01);assert.equal(convexBlocks.triangleCollision.query(-20,0,.4).length,0);console.log('Instanced convex source cover: nonuniform transforms, solid interiors, exact bounds and native upper-face landing pass.');
