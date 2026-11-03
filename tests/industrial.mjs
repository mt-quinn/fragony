import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {MAPS} from '../dist/map.js';
import {industrialGroups,industrialDistricts} from '../dist/industrial.js';
import {buildBrushMap} from '../dist/map-view.js';
const triangleArea=(p,i)=>{const ax=p[i+3]-p[i],ay=p[i+4]-p[i+1],az=p[i+5]-p[i+2],bx=p[i+6]-p[i],by=p[i+7]-p[i+1],bz=p[i+8]-p[i+2];return Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2;};
for(const map of MAPS.filter(m=>m.groups)){
 const meshes=industrialGroups(map);assert.ok(meshes.length<=9,map.id+' bounded world material draws');assert.ok(industrialDistricts(map.id).length>=4);
 let source=0,result=0;
 for(const [kind,g]of Object.entries(map.groups))if(kind!=='water')for(let i=0;i<g.p.length;i+=9)source+=triangleArea(g.p,i);
 for(const {geometry}of meshes){for(const a of Object.values(geometry.attributes))assert.ok(a.array.every(Number.isFinite),map.id+' finite buffers');const p=geometry.attributes.position.array,n=geometry.attributes.normal.array;for(let i=0;i<p.length;i+=9){result+=triangleArea(p,i);const a=[p[i+3]-p[i],p[i+4]-p[i+1],p[i+5]-p[i+2]],b=[p[i+6]-p[i],p[i+7]-p[i+1],p[i+8]-p[i+2]],cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=cross.reduce((s,v,k)=>s+v*(n[i+k]+n[i+k+3]+n[i+k+6]),0);assert.ok(dot>=-1e-5,map.id+' winding agrees with authored normals');}geometry.dispose();}
 assert.ok(Math.abs(source-result)<Math.max(1e-3,source*1e-5),map.id+' district cuts retain the complete source surface');
}
// A real ray must travel through the same chainlink holes that the shader shows.
const plane=new THREE.PlaneGeometry(2,2).toNonIndexed(),g={p:plane.attributes.position.array,n:plane.attributes.normal.array,c:new Float32Array(plane.attributes.position.count*3)},arena=new THREE.Group(),world=[];
buildBrushMap(arena,{id:'rust',groups:{fence:g},brushes:[],water:[],lights:[],signs:[]},[],world);arena.updateMatrixWorld(true);const fence=world.find(m=>m.material.userData.alphaAt),ray=new THREE.Raycaster();assert.ok(fence);let holes=0,wires=0;
for(let y=-.91;y<=.91;y+=.087)for(let x=-.91;x<=.91;x+=.087){const expected=fence.material.userData.alphaAt(new THREE.Vector2(x*.45,y*.45));for(const side of [-1,1]){ray.set(new THREE.Vector3(x,y,side),new THREE.Vector3(0,0,-side));ray.far=2;assert.equal(ray.intersectObjects(world,false).length>0,expected,'visible fence holes transmit shot/sight rays in both directions');}expected?wires++:holes++;}
assert.ok(holes>50&&wires>20);
// Text plates and service panels must not paint over real imported openings.
const previous=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,p)=>o[p]||(()=>{})})})};
try{for(const map of MAPS.filter(m=>['reservoir','shipment','nuketown'].includes(m.id))){const a=new THREE.Group(),w=[];buildBrushMap(a,map,[],w);a.updateMatrixWorld(true);const signs=a.children.filter(m=>m.name?.startsWith('industrial-')&&m.geometry?.type==='PlaneGeometry');if(map.id==='reservoir')assert.equal(signs.filter(m=>m.name!=='industrial-service-panel').length,4);else assert.ok(signs.length>=2,map.id+' fitted district signs');for(const sign of signs){const width=sign.geometry.parameters.width,height=sign.geometry.parameters.height,normal=new THREE.Vector3(0,0,1).transformDirection(sign.matrixWorld);for(let iy=0;iy<=6;iy++)for(let ix=0;ix<=10;ix++){const point=new THREE.Vector3((ix/10-.5)*width,(iy/6-.5)*height,0).applyMatrix4(sign.matrixWorld);ray.set(point.clone().addScaledVector(normal,.15),normal.clone().negate());ray.far=.25;const hits=ray.intersectObjects(w,false);assert.ok(hits.some(h=>h.point.distanceTo(point)<.06),sign.name+' has solid backing across its entire face');}}}}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
console.log('Industrial presentation: all source-map surfaces conserved, finite/bounded materials, correct outward lighting, true fence holes, and all imported-map signs fully backed by real walls pass.');
