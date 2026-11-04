import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {FrameRenderer} from '../dist/presentation.js';
import {antialiasOptions,supportedSamples,TemporalAA} from '../dist/antialias.js';
import {MOBILE_QUALITY} from '../dist/mobile-core.js';
import {createGameHarness} from './harness.mjs';
// The official SMAA lookup textures load in a browser; unit tests inspect allocation/lifecycle.
globalThis.Image=class{set src(value){this.value=value}};
assert.deepEqual(antialiasOptions({msaa:99,aaFilter:'bogus',taa:'yes'}),{antialias:true,msaa:2,aaFilter:'none',taa:false});
const renderer={extensions:{has:()=>false},capabilities:{maxSamples:4},getDrawingBufferSize:v=>v.set(640,360)};
let allocations=0,disposals=0;
for(const quality of [{},...Object.values(MOBILE_QUALITY)])for(const antialias of [true,false])for(const msaa of [0,2,4])for(const aaFilter of ['none','fxaa','smaa'])for(const taa of [false,true]){
 const frame=new FrameRenderer(renderer,new THREE.Scene(),new THREE.PerspectiveCamera(),{...quality,antialias,msaa,aaFilter,taa});
 assert.equal(frame.world.samples,antialias?msaa:0);assert.equal(frame.gun.samples,antialias?msaa:0);
 assert.equal(!!frame.temporal,antialias&&taa);assert.equal(!!frame.spatial,antialias&&aaFilter!=='none');
 assert.equal(!!frame.world.depthTexture,antialias&&taa);
 const targets=[frame.waterLayer.target,frame.styledInput,frame.cleanActors.target,frame.world,frame.gun,frame.ambientTarget,frame.bloomA,frame.bloomB,...(frame.temporal?.targets||[]),...(frame.spatial?[frame.spatial.input,frame.spatial.filtered,...(frame.spatial.smaa?[frame.spatial.smaa._edgesRT,frame.spatial.smaa._weightsRT]:[])]:[])];
 
 renderer.getDrawingBufferSize=v=>v.set(800,450);frame.resize();assert.equal(frame.world.width,800);assert.equal(frame.temporal?.targets[0].height??450,450);assert.equal(frame.spatial?.filtered.width??800,800);
 for(const target of targets){allocations++;target.addEventListener('dispose',()=>disposals++);}
 frame.dispose();renderer.getDrawingBufferSize=v=>v.set(640,360);
}
assert.equal(allocations,disposals,'all allocated targets disposed');
assert.equal(supportedSamples({...renderer,getContext:()=>({RENDERBUFFER:1,RGBA8:2,RGBA16F:3,SAMPLES:4,getInternalformatParameter:()=>new Int32Array([4])})},THREE.HalfFloatType,2),4);
const temporal=new TemporalAA(THREE.HalfFloatType),camera=new THREE.PerspectiveCamera(78,16/9,.07,160);temporal.resize(640,360);camera.updateMatrixWorld();const projection=camera.projectionMatrix.clone();
temporal.begin(camera,1/60);assert.notDeepEqual(camera.projectionMatrix.elements,projection.elements);assert.equal(temporal.material.uniforms.historyWeight.value,0);temporal.restore(camera);assert.deepEqual(camera.projectionMatrix.elements,projection.elements);
temporal.resolve(camera,{texture:{},depthTexture:{}},()=>{});temporal.begin(camera,1/60);assert.ok(temporal.material.uniforms.historyWeight.value>0);temporal.restore(camera);
camera.position.x=20;temporal.begin(camera,1/60);assert.equal(temporal.material.uniforms.historyWeight.value,0,'teleport rejects history');temporal.restore(camera);temporal.dispose();
const h=createGameHarness();h.context.MOBILE_QUALITY=MOBILE_QUALITY;
h.run(`
assert.equal(settings.antialias,true);assert.equal(renderOptions().msaa,2);
const inputs=Object.fromEntries(['antialias','msaa','aaFilter','taa','aaPreset','aaStats'].map(key=>[key,{checked:key==='antialias',value:key==='msaa'?'2':'none'}]));
const panel={querySelector:selector=>selector==='#aa-summary'?{}:inputs[selector.replace('#setting-','')]};
bindAntialiasSetting(panel);
inputs.antialias.checked=false;inputs.antialias.onchange();assert.equal(renderOptions().antialias,false);assert.equal(inputs.msaa.disabled,true);
inputs.aaPreset.value='hybrid';inputs.aaPreset.onchange();assert.equal(settings.antialias,true);assert.equal(renderOptions().msaa,2);assert.equal(renderOptions().aaFilter,'smaa');
inputs.msaa.value='4';inputs.msaa.onchange();inputs.taa.checked=true;inputs.taa.onchange();
assert.equal(renderOptions().msaa,4);assert.equal(renderOptions().taa,true);assert.equal(inputs.aaPreset.value,'custom');
for(const quality of ['battery','balanced','high']){mobile={enabled:true,settings:{quality}};assert.equal(renderOptions().msaa,4);assert.equal(renderOptions().aaFilter,'smaa');assert.equal(renderOptions().taa,true);}
assert.equal(JSON.parse(localStorage.getItem('dh-settings')).taa,true);
inputs.antialias.checked=false;inputs.antialias.onchange();inputs.antialias.checked=true;inputs.antialias.onchange();assert.equal(settings.msaa,4);assert.equal(settings.aaFilter,'smaa');
`);
console.log('AA: all 144 preset/combinations, normalization, supported samples, allocations/disposal, resize, temporal jitter/reprojection/reset, independent controls and persistence pass.');
