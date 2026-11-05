import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {RESERVOIR} from '../dist/maps/reservoir.js';
import {waterPolygon,createWaterSurface,submergedAt,createWaterState,updateWaterState,swimVertical,swimHorizontal} from '../dist/water.js';
import {buildBrushMap} from '../dist/map-view.js';
import {WaterLayer} from '../dist/water-layer.js';
import {FrameRenderer} from '../dist/presentation.js';
import {ElevatorSystem} from '../dist/elevators.js';
import {moveCharacter,canOccupy} from '../dist/collision.js';
for(const volume of RESERVOIR.water){
 const polygon=waterPolygon(volume);assert.equal(polygon.length,8);
 const m=createWaterSurface(volume),p=m.geometry.attributes.position;assert.equal(p.count,18);assert.equal(m.layers.mask,8);assert.equal(m.material.depthWrite,false);assert.equal(m.material.forceSinglePass,true);
 for(let i=0;i<p.count;i++){assert.equal(p.getY(i),volume.top);for(const [a,b,c,d]of volume.planes)assert.ok(a*p.getX(i)+b*p.getY(i)+c*p.getZ(i)<=d+1e-4)}
 assert.equal(submergedAt({x:volume.x,y:8,z:volume.z},[volume]),1);assert.equal(submergedAt({x:volume.x,y:14,z:volume.z},[volume]),0);assert.equal(submergedAt({x:28,y:8,z:volume.z+13},[volume]),0);
}
const arena=new T.Group(),blocks=[],rays=[];buildBrushMap(arena,RESERVOIR,blocks,rays);assert.equal(arena.children.filter(m=>m.userData.waterSurface).length,2);assert.ok(!rays.some(m=>m.userData.waterSurface));assert.equal(blocks.length,RESERVOIR.brushes.length);
// Water contributes to the world color, not the AO depth buffer or gun pass.
const scene=new T.Scene(),camera=new T.PerspectiveCamera();scene.fog=new T.Fog(0x182127,38,120);const originalFog=scene.fog,originalMask=camera.layers.mask;camera.position.set(0,8,19);
const frame=Object.create(FrameRenderer.prototype),seen=[];Object.assign(frame,{waterState:createWaterState(),pixelForgeIntensity:0,slow:0,forge:{uniforms:{arenaArt:{value:0},arenaRoster:{value:0}}},world:{texture:{}},gun:{},ambientTarget:{},bloomA:{width:10,texture:{}},bloomB:{height:10,texture:{}},output:{uniforms:{pixelForgeAmount:{value:0},displayToneMap:{value:1},toneMappingExposure:{value:1},worldTex:{value:null},underwater:{value:0},slow:{value:0}}},blur:{uniforms:{image:{},direction:{value:new T.Vector2()}}},pass(){},gtao:{render(){assert.equal(camera.layers.mask,1)}},renderer:{shadowMap:{autoUpdate:true},setRenderTarget(){},setClearColor(){},clear(){},render(){seen.push({mask:camera.layers.mask,fog:scene.fog})}}});frame.render(scene,camera,.1,false,RESERVOIR.water);assert.equal(seen[0].mask,13);assert.notEqual(seen[0].fog,originalFog);assert.equal(seen[1].mask,2);assert.equal(seen[1].fog,originalFog);assert.equal(scene.fog,originalFog);assert.equal(camera.layers.mask,originalMask);assert.equal(frame.renderer.shadowMap.autoUpdate,true);
for(const dt of [1/30,1/60,1/144]){
 let feet=13.6,vy=-24,min=feet;const initial=swimVertical(vy,feet,1.9,13.75,dt);assert.ok(initial< -20,'entry preserves fast downward momentum');
 for(let t=0;t<12;t+=dt){vy=swimVertical(vy,feet,1.9,13.75,dt);feet+=vy*dt;min=Math.min(min,feet)}assert.ok(min>5,'fall is slowed before reaching pool bottom');assert.ok(Math.abs(feet-(13.75-1.9*23/32))<.02,'stable immersed float depth');assert.ok(Math.abs(vy)<.03);
 let x=7,z=3;for(let t=0;t<1;t+=dt){({x,z}=swimHorizontal(x,z,0,0,.75,dt))}assert.ok(Math.hypot(x,z)<.04,'released movement stops swimming glide');
 let exited=false;for(let t=0;t<3;t+=dt){vy=swimVertical(vy,feet,1.9,13.75,dt,1);feet+=vy*dt;if(feet>14.1){exited=true;break}}assert.ok(exited,'held jump reaches the landing above water');
}
// A shaft remains sealed when its lift is at the other landing, including edges.
for(const definition of RESERVOIR.elevators){const blocks=RESERVOIR.brushes.map(b=>({...b})),system=new ElevatorSystem([definition],blocks),lift=system.lifts[0];lift.block.top=definition.high;lift.block.bottom=definition.high-.28;
 for(const dx of [-definition.w/2+.1,0,definition.w/2-.1])for(const dz of [-definition.d/2+.1,0,definition.d/2-.1]){let p={x:definition.x+dx,z:definition.z+dz,feet:definition.low+3,radius:.4,height:1.9},v=0;for(let i=0;i<180;i++){v-=23/60;const hit=moveCharacter(blocks,p,{x:0,y:v/60,z:0},{bounds:RESERVOIR.bounds});p=hit;if(hit.grounded){v=0;break}}assert.ok(p.feet>=definition.low-.301,'sealed '+definition.id);assert.ok(canOccupy(blocks,p));}
}
console.log('Water: clean convex surfaces, AO isolation, fog restoration, momentum-preserving entry, stable float depth, swim drag/exit at 30/60/144Hz and sealed lift pits pass.');
// Exercise the actual player update, including water detection and input handling.
const {createGameHarness}=await import('./harness.mjs');const h=createGameHarness(419);h.setup();h.run(`{
 changeArena('reservoir');mode='play';time=90;respawnTime=0;bots=[];opponentAI.brains.clear();keys.clear();playerPos.set(15,13.6+eyeHeight,20);vy=-24;vel.set(8,0,0);grounded=false;playerPadFlight=null;
 updateStep(1/120);assert.ok(vy< -20,'actual entry retains falling velocity');let lowest=100;
 for(let i=0;i<720;i++){updateStep(1/120);lowest=Math.min(lowest,playerPos.y-eyeHeight)}assert.ok(lowest>4);assert.ok(playerPos.y-eyeHeight>11.8&&playerPos.y-eyeHeight<12.8);assert.ok(Math.hypot(vel.x,vel.z)<.05);
 keys.add('Space');let surfaced=false;for(let i=0;i<360;i++){updateStep(1/120);if(playerPos.y-eyeHeight>14.1){surfaced=true;break}}assert.ok(surfaced,'actual held swim exits the water');keys.clear();
}`);
console.log('Player water entry, immersed float, released movement drag and held-jump exit pass through updateStep.');

// Isolated water retains time/shoreline uniforms, uses opaque depth for cover,
// and restores source materials/render state even if a render fails.
const layer=new WaterLayer(2),waterScene=new T.Scene(),waterCamera=new T.PerspectiveCamera(),waterMesh=createWaterSurface(RESERVOIR.water[0]);waterScene.add(waterMesh);waterScene.background=new T.Color(0xabcdef);waterCamera.layers.enable(1);
const rawMaterial=waterMesh.material,background=waterScene.background,layerMask=waterCamera.layers.mask,depth={},oldTarget={};let target=oldTarget,clearAlpha=.7,draws=0;
const waterRenderer={toneMapping:T.ACESFilmicToneMapping,toneMappingExposure:1,shadowMap:{autoUpdate:true},getRenderTarget:()=>target,setRenderTarget:v=>target=v,getClearColor:c=>c.set(0x123456),getClearAlpha:()=>clearAlpha,setClearColor:(c,a)=>clearAlpha=a,clear(){},render(){draws++;assert.equal(waterCamera.layers.mask,8);assert.notEqual(waterMesh.material,rawMaterial);assert.equal(waterMesh.material.depthTest,false);assert.equal(waterMesh.material.uniforms.opaqueDepth.value,depth);}};
layer.resize(640,360);assert.equal(layer.target.depthBuffer,false);assert.equal(layer.target.samples,0);layer.render(waterRenderer,waterScene,waterCamera,depth);
assert.equal(draws,1);assert.equal(layer.cache.get(rawMaterial).uniforms.time,rawMaterial.uniforms.time);assert.equal(waterMesh.material,rawMaterial);assert.equal(waterCamera.layers.mask,layerMask);assert.equal(waterScene.background,background);assert.equal(target,oldTarget);assert.equal(clearAlpha,.7);
waterRenderer.render=()=>{throw Error('water render failure');};assert.throws(()=>layer.render(waterRenderer,waterScene,waterCamera,depth),/water render failure/);assert.equal(waterMesh.material,rawMaterial);assert.equal(waterRenderer.shadowMap.autoUpdate,true);assert.equal(waterCamera.layers.mask,layerMask);
let disposed=0;layer.target.addEventListener('dispose',()=>disposed++);layer.cache.get(rawMaterial).addEventListener('dispose',()=>disposed++);layer.dispose();assert.equal(disposed,2);
console.log('Water layering: smooth translucent pass, depth occlusion input, shared ripple clock, state restoration on failure, resolution and disposal pass.');
