import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/vendor/three.module.js';
import {graphicsOptions,graphicsControlsHTML} from '../dist/graphics.js';
import {PixelForgeMask,PIXEL_FORGE_SIZE,pixelForgeGLSL} from '../dist/pixel-forge.js';
import {FrameRenderer} from '../dist/presentation.js';
import {SpatialAA} from '../dist/antialias.js';
import {createDummyRig} from '../dist/characters.js';
import {createGameHarness} from './harness.mjs';

for(const context of [{},{touch:true,dpr:3}]){
 const s=graphicsOptions({},context);assert.equal(s.pixelForge,true);assert.equal(s.pixelForgeIntensity,1);
 assert.equal(graphicsOptions({pixelForge:false,pixelForgeIntensity:.37},context).pixelForge,false);
 assert.equal(graphicsOptions({pixelForgeIntensity:NaN},context).pixelForgeIntensity,1);
 assert.equal(graphicsOptions({pixelForgeIntensity:-3},context).pixelForgeIntensity,0);
 assert.equal(graphicsOptions({pixelForgeIntensity:7},context).pixelForgeIntensity,1);
 const html=graphicsControlsHTML(s,'','');assert.match(html,/data-graphics="pixelForge"/);assert.match(html,/aria-label="Pixel Forge intensity"/);assert.doesNotMatch(html,/data-graphics="pixelForge(Size|Scale)"/);
}
assert.equal(PIXEL_FORGE_SIZE,1.75);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.layers.enable(2);scene.background=new THREE.Color(0xabcdef);
const actor=createDummyRig({mat:c=>new THREE.MeshBasicMaterial({color:c}),target:()=>{}});scene.add(actor.group);assert.equal(actor.group.userData.pixelForgeClean,true);
const attachedGun=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());actor.weaponMount.add(attachedGun);
const wall=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());scene.add(wall);
const smoke=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));scene.add(smoke);
const hidden=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());hidden.visible=false;scene.add(hidden);
const originals=new Map();scene.traverse(o=>{if(o.isMesh)originals.set(o,o.material);});
const mask=new PixelForgeMask(2);mask.resize(800,450);assert.equal(mask.target.width,800);assert.equal(mask.target.samples,2);assert.ok(mask.target.depthTexture?.isDepthTexture);
const background=scene.background,layers=camera.layers.mask,target={};let current=target,color=new THREE.Color(.1,.2,.3),alpha=.4,rendered=0;
const renderer={shadowMap:{autoUpdate:true},getRenderTarget:()=>current,setRenderTarget:v=>current=v,getClearColor:c=>c.copy(color),getClearAlpha:()=>alpha,setClearColor:(c,a)=>{color.set(c);alpha=a;},clear(){},render(){rendered++;assert.equal(wall.material,mask.black);assert.equal(attachedGun.material,mask.white);assert.equal(smoke.visible,false);assert.equal(hidden.visible,false);assert.equal(camera.layers.mask,1);assert.equal(this.shadowMap.autoUpdate,false);}};
mask.render(renderer,scene,camera);assert.equal(rendered,1);assert.equal(current,target);assert.equal(alpha,.4);assert.equal(scene.background,background);assert.equal(camera.layers.mask,layers);assert.equal(smoke.visible,true);for(const [o,m]of originals)assert.equal(o.material,m);
renderer.render=()=>{throw Error('render failure');};assert.throws(()=>mask.render(renderer,scene,camera),/render failure/);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(camera.layers.mask,layers);assert.equal(current,target);for(const [o,m]of originals)assert.equal(o.material,m);
let disposed=0;for(const resource of [mask.target.depthTexture,mask.target,mask.black,mask.white])resource.addEventListener('dispose',()=>disposed++);mask.dispose();assert.equal(disposed,4);

// Exercise the real shared settings binding: slider persists and updates live,
// toggle preserves its intensity, and re-enabling retains the saved amount.
const h=createGameHarness();h.run(`
renderer=null;const uniforms={pixelForgeAmount:{value:1},untonemappedExposure:{},bloomAmount:{},aoAmount:{},vignetteAmount:{},grainAmount:{},gradeAmount:{}};
frameRenderer={output:{uniforms},pixelForgeIntensity:1};
const slider={dataset:{graphics:'pixelForgeIntensity'},type:'range',value:'.42'},toggle={dataset:{graphics:'pixelForge'},type:'checkbox',checked:true};
const panel={querySelectorAll:()=>[slider,toggle],querySelector:()=>null};bindGraphicsSettings(panel);slider.oninput();
assert.equal(settings.pixelForgeIntensity,.42);assert.equal(frameRenderer.pixelForgeIntensity,.42);assert.equal(JSON.parse(localStorage.getItem('dh-settings')).pixelForgeIntensity,.42);
toggle.checked=false;toggle.onchange();assert.equal(settings.pixelForge,false);assert.equal(settings.pixelForgeIntensity,.42);assert.equal(renderOptions().pixelForge,false);
toggle.checked=true;toggle.onchange();assert.equal(renderOptions().pixelForge,true);assert.equal(renderOptions().pixelForgeIntensity,.42);
`);
console.log('Pixel Forge: desktop/mobile defaults, normalization, fixed scale, live saved controls, attached weapon mask, state restoration on success/failure, resize and disposal pass.');

// Pixel Forge is last: all spatial AA must complete before quantization.
const renderStub={extensions:{has:()=>false},getDrawingBufferSize:v=>v.set(320,180),toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1,setRenderTarget(){},setClearColor(){},clear(){}};
const frame=new FrameRenderer(renderStub,new THREE.Scene(),new THREE.PerspectiveCamera(),{antialias:false,ao:false,bloom:false});
const historical=JSON.parse(fs.readFileSync(new URL('fixtures/pixel-forge-world-space.json',import.meta.url)));
assert.equal(PIXEL_FORGE_SIZE,historical.pixelSize);assert.equal(pixelForgeGLSL,historical.helpers);assert.equal(frame.forge.fragmentShader,historical.fragmentShader,'exact historical world-space shader including water composition');
assert.equal(frame.forge.uniforms.waterTex.value,frame.waterLayer.target.texture);
for(const file of ['water.js','water-layer.js'])assert.equal(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),historical.waterFiles[file],'historical water handler '+file);
console.log('Exact historical world-space shader and water handlers match '+historical.revision+'.');
let order=[];frame.pass=(m,target)=>{order.push(m===frame.forge?'forge':'display');if(m===frame.forge)assert.equal(target,null);};
frame.finish();assert.deepEqual(order,['display','forge']);
frame.spatial={input:{},render(r,pass,display,target){assert.equal(display,true);assert.equal(target,frame.styledInput);order.push('aa');},dispose(){}};
order=[];frame.finish();assert.deepEqual(order,['display','aa','forge']);
frame.output.uniforms.pixelForgeAmount.value=0;frame.spatial.render=(r,pass,display,target)=>{assert.equal(target,null);order.push('aa');};order=[];frame.finish();assert.deepEqual(order,['display','aa']);frame.dispose();
const spatial=new SpatialAA('fxaa',THREE.UnsignedByteType),destination={};let lastTarget;spatial.render(renderStub,(material,target)=>{assert.equal(material,spatial.fxaa);lastTarget=target;},true,destination);assert.equal(lastTarget,destination);spatial.dispose();
console.log('Pixel Forge ordering: final after display conversion and all spatial AA; disabled path bypasses styling.');

// The surface coordinates use the unjittered camera, including when TAA is on.
const surfaceRenderer={...renderStub,capabilities:{maxSamples:4},shadowMap:{autoUpdate:true},getRenderTarget:()=>null,getClearColor:c=>c.set(0),getClearAlpha:()=>1,render(){}};
const surfaceCamera=new THREE.PerspectiveCamera(85,16/9,.07,160);surfaceCamera.position.set(8,3,-5);surfaceCamera.lookAt(1,2,4);surfaceCamera.updateMatrixWorld();
const surfaceFrame=new FrameRenderer(surfaceRenderer,new THREE.Scene(),surfaceCamera,{ao:false,bloom:false,taa:true});
const inverse=surfaceCamera.projectionMatrixInverse.clone(),world=surfaceCamera.matrixWorld.clone();surfaceFrame.render(new THREE.Scene(),surfaceCamera,1/60);
assert.deepEqual(surfaceFrame.forge.uniforms.inverseProjection.value.elements,inverse.elements);
assert.deepEqual(surfaceFrame.forge.uniforms.cameraWorld.value.elements,world.elements);
assert.equal(surfaceFrame.forge.uniforms.worldDepth.value,surfaceFrame.cleanActors.target.depthTexture);surfaceFrame.dispose();
h.run(`
let grainHidden;document.body.classList.toggle=(name,value)=>{if(name==='graphics-no-grain')grainHidden=value;};
renderer={shadowMap:{type:THREE.PCFSoftShadowMap}};Object.assign(settings,{grain:true,pixelForge:true,pixelForgeIntensity:1});applyGraphicsRendererSettings();assert.equal(grainHidden,true);
settings.pixelForgeIntensity=0;applyGraphicsRendererSettings();assert.equal(grainHidden,false);
settings.pixelForge=false;settings.pixelForgeIntensity=1;applyGraphicsRendererSettings();assert.equal(grainHidden,false);renderer=null;
`);
console.log('Surface texture: unjittered world reconstruction with TAA, mask depth reuse, and removal of screen-fixed grain while styling is active pass.');

// Fences must occlude only their wires, preserving clean health colors through holes.
const cutoutMask=new PixelForgeMask(),alphaMap=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1),fenceMaterial=new THREE.MeshStandardMaterial({alphaMap,alphaTest:.5,side:THREE.DoubleSide});
const fenceBlack=cutoutMask.maskMaterial(fenceMaterial,false),fenceWhite=cutoutMask.maskMaterial(fenceMaterial,true);assert.notEqual(fenceBlack,cutoutMask.black);assert.equal(fenceBlack.alphaMap,alphaMap);assert.equal(fenceBlack.alphaTest,.5);assert.equal(fenceBlack.color.getHex(),0);assert.equal(fenceWhite.color.getHex(),0xffffff);assert.equal(cutoutMask.maskMaterial(fenceMaterial,false),fenceBlack);
let cutoutsDisposed=0;for(const m of [fenceBlack,fenceWhite])m.addEventListener('dispose',()=>cutoutsDisposed++);cutoutMask.dispose();assert.equal(cutoutsDisposed,2);fenceMaterial.dispose();alphaMap.dispose();console.log('Actor masks preserve fence cutouts and dispose cached materials without owning their shared textures.');
