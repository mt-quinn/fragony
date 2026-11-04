import assert from 'node:assert/strict';
import {graphicsOptions,graphicsRenderOptions,EFFECT_PRESETS} from '../dist/graphics.js';
import {frameStatistics,BenchmarkRunner,BENCHMARK_SCENES,benchmarkReportHTML} from '../dist/graphics-benchmark.js';
import {createGameHarness} from './harness.mjs';
const mobile=graphicsOptions({},{touch:true,dpr:3,legacy:{quality:'high',fov:90}});assert.equal(mobile.resolutionScale,.5);assert.equal(mobile.shadowQuality,'high');assert.equal(mobile.fov,90);
const s=graphicsOptions({resolutionScale:1,msaa:4,taa:true,aaFilter:'smaa'});
for(const p of Object.values(EFFECT_PRESETS)){const q=graphicsRenderOptions({...s,...p});assert.equal(q.resolutionScale,1);assert.equal(q.msaa,4);assert.equal(q.taa,true);assert.equal(q.aaFilter,'smaa');}
const invalid=graphicsOptions({exposure:Infinity,bloomStrength:99,fov:5,shadowQuality:'ultra',aoQuality:'broken'});assert.equal(invalid.exposure,1);assert.equal(invalid.bloomStrength,2);assert.equal(invalid.fov,65);assert.equal(invalid.shadowQuality,'high');
const stats=frameStatistics([10,10,10,10,60]);assert.equal(stats.averageFPS,50);assert.equal(stats.medianMs,10);assert.equal(stats.p95Ms,60);assert.equal(stats.low1FPS,1000/60);assert.equal(stats.over33ms,1);
let complete,prepared=[],shots=0;
const runner=new BenchmarkRunner({prepare:async scene=>prepared.push(scene.map),progress(){},stage(){shots++;},metrics:()=>({shots,effects:20}),complete:result=>complete=result,error:message=>{throw Error(message);}},{warmup:20,sample:50,scenes:BENCHMARK_SCENES});
await runner.next();let now=0;
while(!runner.done){if(runner.loading)await Promise.resolve();else{runner.frame(now);now+=10;}}
assert.equal(prepared.length,6);assert.equal(complete.length,6);assert.equal(new Set(prepared).size,3);assert.ok(complete.every(r=>r.frames>=4&&r.shots>0&&r.peakEffects===20));
const report=benchmarkReportHTML({date:new Date().toISOString(),summary:'2× MSAA',width:640,height:360,settings:s,results:complete});assert.ok(report.includes('95th'));assert.ok(report.includes('Crossfire'));assert.ok(report.includes('Explosions'));
const h=createGameHarness();h.run(`
camera=new THREE.PerspectiveCamera();const old=graphicsOptions(settings);Object.assign(settings,{resolutionScale:.5,shadowQuality:'off',aoQuality:'off',msaa:4,aaFilter:'smaa'});
let ratio,size;renderer={setPixelRatio:v=>ratio=v,setSize:(w,h)=>size=[w,h]};devicePixelRatio=3;sizeRenderer();assert.equal(ratio,1.5);assert.deepEqual(size,[1280,800]);
Object.assign(settings,EFFECT_PRESETS.high);sizeRenderer();assert.equal(ratio,1.5);assert.equal(renderOptions().msaa,4);assert.equal(renderOptions().aaFilter,'smaa');renderer=null;
assert.ok(graphicsSettingsHTML().includes('RUN GRAPHICS BENCHMARK'));Object.assign(settings,old);
`);
console.log('Graphics: migration, independent resolution/effects/AA, normalization, native pixel ratio, benchmark statistics, six scenes, warm-up exclusion and report pass.');
