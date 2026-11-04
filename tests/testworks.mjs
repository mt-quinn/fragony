import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {TEST_WORKS} from './fixtures/testworks-map.js';
import {MAP,selectMap} from '../dist/map.js';
import {buildTestworks,setArenaAtmosphere,TESTWORKS_AREAS,testworksArea} from '../dist/testworks.js';
import {createGameHarness} from './harness.mjs';
import {launchTime} from '../dist/geometry.js';
Object.keys(MAP).forEach(key=>delete MAP[key]);Object.assign(MAP,TEST_WORKS);const arena=new THREE.Group(),blocks=[],world=[];buildTestworks(arena,MAP,blocks,world);arena.updateMatrixWorld(true);
for(const b of MAP.solids){const c=blocks.find(c=>c.id===b.id);assert.ok(c,b.id);for(const [key,value]of Object.entries({x:b.x,z:b.z,w:b.w,d:b.d,bottom:b.y-b.h/2,top:b.y+b.h/2,yaw:b.yaw||0}))assert.equal(c[key],value,b.id+' retains '+key);}
const overhead=blocks.filter(b=>!MAP.solids.some(s=>s.id===b.id));assert.ok(overhead.length>6);for(const b of overhead)assert.ok(b.bottom>10.5,'new structures are above fighting and movement space');
// Every original jump-pad arc, including a standing body, clears the new roof and services.
for(const pad of MAP.pads){const t=launchTime(pad.power,pad.landing.y-pad.y);for(let time=0;time<=t;time+=1/240){const p={x:pad.x+(pad.landing.x-pad.x)*time/t,z:pad.z+(pad.landing.z-pad.z)*time/t,y:pad.y+pad.power*time-11.5*time*time};for(const b of overhead)if(p.x>b.x-b.w/2-.4&&p.x<b.x+b.w/2+.4&&p.z>b.z-b.d/2-.4&&p.z<b.z+b.d/2+.4)assert.ok(p.y+1.9<b.bottom||p.y>b.top,'pad clears new structure: '+pad.id+' / '+b.id);}}
const renderMeshes=arena.children.filter(m=>m.isMesh&&m.visible);const triangles=renderMeshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);assert.ok(renderMeshes.length<50,'bounded static draws');assert.ok(triangles<22000,'bounded geometry');
for(const mesh of renderMeshes){for(const name of ['position','normal','uv'])assert.ok(mesh.geometry.attributes[name].array.every(Number.isFinite));}
assert.equal(new Set(TESTWORKS_AREAS.map(a=>a.floor)).size,5);for(const [x,z,id]of[[-26,0,'fabrication'],[0,0,'process'],[26,0,'pumps'],[0,-28,'electrical'],[0,28,'dispatch']])assert.equal(testworksArea(x,z).id,id);
assert.equal(arena.userData.testworks.landmarks.length,4);
// The exact cover ray remains blocked; the adjacent opening stays open.
const ray=new THREE.Raycaster(new THREE.Vector3(-26,2,10),new THREE.Vector3(0,0,-1),0,20);assert.ok(ray.intersectObjects(world,false).some(h=>h.object.name==='press-machine-a'));ray.set(new THREE.Vector3(-18,2,3),new THREE.Vector3(0,0,-1));ray.far=8;assert.equal(ray.intersectObjects(world,false).length,0);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0,1,2);const hemi=new THREE.HemisphereLight(),sun=new THREE.DirectionalLight();sun.castShadow=true;scene.add(hemi,sun);setArenaAtmosphere(scene,MAP);assert.ok(scene.background.isDataTexture);assert.equal(scene.background.image.width,1024);assert.equal(hemi.intensity,1.35);setArenaAtmosphere(scene,{id:'unskinned'});assert.ok(scene.background.isColor);assert.equal(scene.background.getHex(),0x182127);assert.equal(hemi.intensity,1);assert.equal(sun.shadow.normalBias,.08);
console.log('Testworks: unchanged cover bounds, all jump arcs clear, real roof/cover shot collision, five material districts, finite geometry, '+renderMeshes.length+' static draws / '+triangles+' triangles, and map-specific sky/lighting restoration pass.');

const h=createGameHarness(187);h.setup();h.context.location={search:'?touch=1&practice=testworks'};h.context.URLSearchParams=URLSearchParams;h.run(`
changeArena('reservoir');mode='play';saveRun();const campaignBefore=localStorage.getItem('dh-run'),rotationBefore=localStorage.getItem('dh-map-rotation');beginPractice();assert.equal(MAP.id,'reservoir');assert.ok(scene.background.isDataTexture);assert.equal(localStorage.getItem('dh-run'),campaignBefore);assert.equal(localStorage.getItem('dh-map-rotation'),rotationBefore);mainMenu();$('continue').onclick();assert.equal(MAP.id,'reservoir');assert.ok(scene.background.isDataTexture);changeArena('testworks');assert.ok(scene.background.isDataTexture);changeArena('reservoir');assert.ok(scene.background.isDataTexture);console.log('Testworks practice link leaves campaign/rotation untouched; cached map switches restore the correct sky.');
`);

// An equirectangular sky must wrap seamlessly and contain broad structure.
const skyScene=new THREE.Scene();setArenaAtmosphere(skyScene,{id:'shipment'});const {data,width,height}=skyScene.background.image;let variations=new Set();for(let y=0;y<height;y++){for(let c=0;c<3;c++)assert.ok(Math.abs(data[(y*width)*4+c]-data[(y*width+width-1)*4+c])<=1,'sky longitude seam');}for(let x=0;x<width;x+=8){const i=(Math.floor(height*.68)*width+x)*4;variations.add([data[i],data[i+1],data[i+2]].join(','));}assert.ok(variations.size>6,'cloud shapes survive as broad tonal structure');console.log('Sky: seamless longitude wrap, layered cloud formations and visible tonal variation pass.');
