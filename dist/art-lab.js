import * as THREE from './vendor/three.module.js';
import {MAPS} from './map.js';
import {buildBrushMap} from './map-view.js';
import {studioEnvironment} from './presentation.js';
import {setArenaAtmosphere} from './testworks.js';
import {createDummyRig,poseDummy} from './characters.js';
import {createRifle} from './rifle.js';
import {looks,vertex,fragment} from './art-lab-shaders.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.toneMapping=THREE.NoToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('viewport').append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Live Three.js shader experiment using FRAGONY game assets');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(70,1,.05,220);scene.add(camera);
const environment=studioEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.34;
scene.add(new THREE.HemisphereLight(0xf7f8f0,0x65717c,1));
const sun=new THREE.DirectionalLight(0xfff2d6,2.8);sun.position.set(-24,52,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:150});sun.shadow.bias=-.003;sun.shadow.normalBias=.08;scene.add(sun);
const gun=new THREE.Group();createRifle(gun);gun.position.set(.25,-.26,-.56);gun.rotation.y=-.015;camera.add(gun);
// Render weapon after the world, with a fresh depth buffer, as in an FPS viewmodel pass.
const weaponScene=new THREE.Scene();weaponScene.environment=environment.texture;weaponScene.environmentIntensity=.5;
weaponScene.add(new THREE.HemisphereLight(0xf7f8f0,0x65717c,2));const gunLight=new THREE.DirectionalLight(0xfff2d6,3);gunLight.position.set(-2,4,1);weaponScene.add(gunLight);
const weaponCamera=new THREE.PerspectiveCamera(70,1,.02,10);weaponScene.add(weaponCamera);weaponCamera.add(gun);
const source=new THREE.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
// Keep scene depth intact while rendering the first-person weapon separately.
// Reconstruct surface positions from it for the world-anchored texture study.
source.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
const gunTarget=new THREE.WebGLRenderTarget(1,1,{type:source.texture.type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
// A depth-tested actor mask preserves occlusion by walls and cover.
const protectedTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
const maskBlack=new THREE.MeshBasicMaterial({color:0x000000,fog:false,toneMapped:false});
const maskWhite=new THREE.MeshBasicMaterial({color:0xffffff,fog:false,toneMapped:false});
const uniforms={grounded:{value:params.get('texture')==='screen'?0:1},worldDepth:{value:source.depthTexture},gunImage:{value:gunTarget.texture},inverseProjection:{value:camera.projectionMatrixInverse},cameraWorld:{value:camera.matrixWorld},protectedTex:{value:protectedTarget.texture},protect:{value:1},image:{value:source.texture},resolution:{value:new THREE.Vector2(1,1)},time:{value:7.5},amount:{value:1},scale:{value:.5},split:{value:params.get('compare')==='1'?1:0},clean:{value:0},mode:{value:0}};
const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false,toneMapped:false});
const postScene=new THREE.Scene(),postCamera=new THREE.Camera(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quad.frustumCulled=false;postScene.add(quad);
let arena=null,actors=[],ready=false,selected=Math.max(0,Math.min(7,Number(params.get('look'))||0)),animated=true,elapsed=7.5,dirty=true,thumbnailPending=false,sceneId='rust',yawOffset=0,pitchOffset=0,baseRotation=new THREE.Quaternion(),loadToken=0;
const sceneCache=new Map();
const views={rust:{pos:[7.21875,3.44,18],target:[0,6,0],actors:[[-.78,1.176,6.06],[6,1.306,-8.03],[-15.34,1.042,18.28]]},shipment:{pos:[4.78125,1.775,20.84375],target:[4.9,1.8,-10],actors:[[4.94,.146,-20.47],[-5.72,.093,17.81],[20.875,.026,5.125]]},reservoir:{pos:[-19.75,38.7,-47.5],target:[0,38,-47.5],actors:[[0,37,-47.5],[20,37,-47.5],[20,37,-40.25]]},portrait:{pos:[0,1.45,3.2],target:[0,1.1,0],actors:[[0,0,0]]}};
function setView(){const v=views[sceneId];camera.position.fromArray(v.pos);camera.lookAt(new THREE.Vector3(...v.target));baseRotation.copy(camera.quaternion);yawOffset=pitchOffset=0;}
async function loadScene(id){const token=++loadToken;ready=false;document.getElementById('exported-board')?.remove();$('status').textContent='Loading '+id+'…';try{
 const map=MAPS.find(m=>m.id===id);if(map){if(map.load&&!map.ready)await map.load({navigation:false});else if(map.loadRender&&!map.renderReady)await map.loadRender();}
 if(token!==loadToken)return;
 if(arena){sceneCache.set(sceneId,{arena,actors});scene.remove(arena);}
 sceneId=id;
 if(map)setArenaAtmosphere(scene,map);else{scene.background=new THREE.Color(0x586a60);scene.fog=new THREE.Fog(0x586a60,10,40);}
 const cached=sceneCache.get(id);
 if(cached){arena=cached.arena;actors=cached.actors;scene.add(arena);}else{
 arena=new THREE.Group();scene.add(arena);actors=[];
 if(map)buildBrushMap(arena,map,[],[]);else{const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x657266,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;arena.add(floor);}
 for(const [i,p] of views[id].actors.entries()){const rig=createDummyRig({mat:c=>new THREE.MeshStandardMaterial({color:c,roughness:.65}),target:()=>{}});rig.group.traverse(o=>o.layers.enable(1));rig.group.position.fromArray(p);rig.group.rotation.y=id==='portrait'?-.15:Math.PI/3+i*.7;arena.add(rig.group);actors.push(rig);poseDummy(rig,{crouch:i===2?.5:0});}
 }
 gun.visible=$('weapon').checked&&id!=='portrait';setView();$('scene-label').textContent=id==='portrait'?'DUMMY / SPECIMEN PORTRAIT':id.toUpperCase()+' / '+(id==='rust'?'PROCESS TOWER':id==='shipment'?'CROSSING':'FILTRATION HALL');ready=true;dirty=true;thumbnailPending=true;$('status').textContent='LIVE / ACTUAL GAME ASSETS';
 }catch(error){$('status').textContent='Could not load scene: '+error.message;console.error(error);}}
function resize(){const rect=$('viewport').getBoundingClientRect(),w=Math.max(1,Math.round(Math.min(rect.width,1440))),h=Math.max(1,Math.round(w*rect.height/rect.width));renderer.setSize(w,h,false);source.setSize(w,h);gunTarget.setSize(w,h);protectedTarget.setSize(w,h);uniforms.resolution.value.set(w,h);camera.aspect=weaponCamera.aspect=w/h;camera.updateProjectionMatrix();weaponCamera.updateProjectionMatrix();dirty=true;thumbnailPending=true;}
new ResizeObserver(resize).observe($('viewport'));
function choose(i){selected=i;uniforms.mode.value=i;const look=looks[i];$('split-label').textContent=i===0?'Compare with previous Pixel Forge':'Compare with clean render';$('compare-line').dataset.label=i===0?'PREVIOUS ← → SURFACE':'CLEAN ← → TREATED';$('grounded-option').hidden=i!==0;
$('category').textContent=String(i+1).padStart(2,'0')+' / '+look.tag;$('title').textContent=look.name;$('description').textContent=look.description;$('note').textContent=look.note;$('cost').textContent=look.cost;$('frame-label').textContent=String(i+1).padStart(2,'0')+' / '+look.name.toUpperCase();document.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.look===i)));dirty=true;const url=new URL(location.href);url.searchParams.set('look',i);history.replaceState(null,'',url);}
const thumbs=[],galleryImages=[];
looks.forEach((look,i)=>{const b=document.createElement('button');b.dataset.look=i;b.innerHTML=`<img alt="${look.name} treatment preview"><span>${String(i+1).padStart(2,'0')} / ${look.name}</span><small>${look.short}</small>`;b.onclick=()=>choose(i);$('looks').append(b);thumbs.push(b.querySelector('img'));const f=document.createElement('figure');f.innerHTML=`<img alt="${look.name} applied to the game scene"><figcaption><b>${String(i+1).padStart(2,'0')} / ${look.name}</b><span>${look.short}</span></figcaption>`;$('gallery').append(f);galleryImages.push(f.querySelector('img'));});
function renderWorld(){renderer.setRenderTarget(source);renderer.setClearColor(scene.background||0x182127,1);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(gunTarget);renderer.setClearColor(0,0);renderer.clear();if(gun.visible)renderer.render(weaponScene,weaponCamera);renderer.setRenderTarget(null);}
function renderProtectedMask(){
 const background=scene.background,fog=scene.fog,mask=camera.layers.mask,shadowUpdate=renderer.shadowMap.autoUpdate;
 renderer.setRenderTarget(protectedTarget);renderer.setClearColor(0,1);renderer.clear();
 renderer.shadowMap.autoUpdate=false;scene.background=null;scene.fog=null;
 try{
  // Black world and actors establish the exact visible depth, then white actors
  // pass only where their surfaces match that depth (never through cover).
  scene.overrideMaterial=maskBlack;renderer.render(scene,camera);
  renderer.autoClear=false;scene.overrideMaterial=maskWhite;camera.layers.set(1);renderer.render(scene,camera);
  if(gun.visible){renderer.clearDepth();weaponScene.overrideMaterial=maskWhite;renderer.render(weaponScene,weaponCamera);}
 }finally{scene.overrideMaterial=null;weaponScene.overrideMaterial=null;scene.background=background;scene.fog=fog;camera.layers.mask=mask;renderer.autoClear=true;renderer.shadowMap.autoUpdate=shadowUpdate;renderer.setRenderTarget(null);}
}
function renderPost(target=null){renderer.setRenderTarget(target);renderer.render(postScene,postCamera);renderer.setRenderTarget(null);}
function snapshot(i,w=640,h=400){const target=new THREE.WebGLRenderTarget(w,h,{depthBuffer:false});const oldMode=uniforms.mode.value,oldSplit=uniforms.split.value,oldClean=uniforms.clean.value,oldRes=uniforms.resolution.value.clone();uniforms.mode.value=i;uniforms.split.value=uniforms.clean.value=0;uniforms.resolution.value.set(w,h);renderPost(target);const bytes=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,bytes);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),data=ctx.createImageData(w,h);for(let y=0;y<h;y++)data.data.set(bytes.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(data,0,0);target.dispose();uniforms.mode.value=oldMode;uniforms.split.value=oldSplit;uniforms.clean.value=oldClean;uniforms.resolution.value.copy(oldRes);return canvas;}
function updateThumbnails(){for(let i=0;i<looks.length;i++){const url=snapshot(i).toDataURL('image/jpeg',.88);thumbs[i].src=galleryImages[i].src=url;}thumbnailPending=false;}
$('scene').onchange=()=>{const url=new URL(location.href);url.searchParams.set('scene',$('scene').value);history.replaceState(null,'',url);loadScene($('scene').value);};
for(const [id,key,factor,suffix]of[['amount','amount',.01,'%'],['scale','scale',.01,'×']]){$(id).oninput=()=>{uniforms[key].value=+$(id).value*factor;$(id+'-label').textContent=id==='amount'?$(id).value+suffix:(+$(id).value*.01).toFixed(1)+suffix;dirty=true;};$(id).onchange=()=>thumbnailPending=true;}
$('protect').checked=params.get('protect')!=='0';uniforms.protect.value=$('protect').checked?1:0;
$('protect').onchange=()=>{uniforms.protect.value=$('protect').checked?1:0;dirty=true;thumbnailPending=true;const url=new URL(location.href);url.searchParams.set('protect',$('protect').checked?'1':'0');history.replaceState(null,'',url);};
$('grounded').checked=uniforms.grounded.value>0;$('grounded').onchange=()=>{uniforms.grounded.value=$('grounded').checked?1:0;dirty=true;thumbnailPending=true;const url=new URL(location.href);url.searchParams.set('texture',$('grounded').checked?'world':'screen');history.replaceState(null,'',url);};
$('split').checked=uniforms.split.value>0;$('compare-line').hidden=!$('split').checked;
$('split').onchange=()=>{uniforms.split.value=$('split').checked?1:0;$('compare-line').hidden=!$('split').checked;dirty=true;};
$('motion').onchange=()=>{animated=$('motion').checked;dirty=true;};$('weapon').onchange=()=>{gun.visible=$('weapon').checked&&sceneId!=='portrait';dirty=true;thumbnailPending=true;};
$('clean').onpointerdown=e=>{$('clean').setPointerCapture(e.pointerId);uniforms.clean.value=1;dirty=true;};for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('clean').addEventListener(ev,()=>{uniforms.clean.value=0;dirty=true;});$('clean').onkeydown=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();uniforms.clean.value=1;dirty=true;}};$('clean').onkeyup=()=>{uniforms.clean.value=0;dirty=true;};$('clean').onblur=()=>{uniforms.clean.value=0;dirty=true;};
$('overview').onclick=()=>{$('sheet').hidden=!$('sheet').hidden;if(!$('sheet').hidden)$('sheet').scrollIntoView({behavior:'smooth',block:'start'});};
function download(canvas,name){document.getElementById('exported-board')?.remove();const box=document.createElement('div');box.id='exported-board';const a=document.createElement('a');a.download=name;a.href=canvas.toDataURL('image/png');a.textContent='Download this board ↗';const img=document.createElement('img');img.src=a.href;img.alt=selected===0?'Previous and surface-anchored Pixel Forge comparison':'Exported eight-treatment comparison board';img.style.cssText='width:100%;height:auto;display:block;margin:16px 0 30px';box.append(a,img);$('sheet').prepend(box);$('sheet').hidden=false;box.scrollIntoView({behavior:'smooth',block:'start'});}
$('export').onclick=()=>{if(!ready)return;renderWorld();renderProtectedMask();if(selected===0){
 const c=document.createElement('canvas');c.width=1312;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#e9e5db';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#282d29';ctx.font='bold 26px sans-serif';ctx.fillText('PIXEL FORGE / SURFACE TEXTURE STUDY',24,38);ctx.font='14px sans-serif';ctx.fillText('Same palette, pixel size and edge treatment · '+sceneId.toUpperCase()+' · '+Math.round(uniforms.amount.value*100)+'% intensity',24,64);
 const previous=uniforms.grounded.value;for(let i=0;i<2;i++){uniforms.grounded.value=i;ctx.drawImage(snapshot(0,620,388),24+i*644,83);ctx.fillStyle='#282d29';ctx.font='bold 18px sans-serif';ctx.fillText(i?'SURFACE-ANCHORED TEXTURE':'PREVIOUS / SCREEN-LOCKED DITHER',24+i*644,498);}uniforms.grounded.value=previous;download(c,'pixel-forge-surface-comparison.png');dirty=true;return;
 }const c=document.createElement('canvas');c.width=1600;c.height=2200;const ctx=c.getContext('2d');ctx.fillStyle='#e9e5db';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#282d29';ctx.font='bold 42px sans-serif';ctx.fillText('FRAGONY / SIGNAL & SURFACE',32,58);ctx.font='16px sans-serif';ctx.fillText('Eight real-time shader studies · '+sceneId.toUpperCase()+' · Original game assets · 04 NOV 2026',32,88);for(let i=0;i<8;i++){const x=32+(i%2)*784,y=115+Math.floor(i/2)*510;ctx.drawImage(snapshot(i,752,470),x,y,752,470);ctx.fillStyle='#282d29';ctx.font='bold 17px sans-serif';ctx.fillText(String(i+1).padStart(2,'0')+' / '+looks[i].name,x,y+494);}download(c,'fragony-shader-studies-'+sceneId+'.png');dirty=true;};
let drag=null;renderer.domElement.style.touchAction='none';renderer.domElement.onpointerdown=e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;yawOffset-=(e.clientX-drag[0])*.003;pitchOffset-=(e.clientY-drag[1])*.003;pitchOffset=Math.max(-.8,Math.min(.8,pitchOffset));drag=[e.clientX,e.clientY];dirty=true;};renderer.domElement.onpointerup=()=>{drag=null;thumbnailPending=true;};renderer.domElement.onpointercancel=()=>drag=null;renderer.domElement.ondblclick=()=>{setView();dirty=true;thumbnailPending=true;};
let previous=0;renderer.setAnimationLoop(now=>{const dt=Math.min((now-previous)/1000,.05);previous=now;if(!ready)return;if(animated){elapsed+=dt;dirty=true;}if(!dirty&&!thumbnailPending)return;uniforms.time.value=elapsed;const offset=new THREE.Euler(pitchOffset,yawOffset+(animated?Math.sin(elapsed*.18)*.025:0),0,'YXZ');camera.quaternion.copy(baseRotation).multiply(new THREE.Quaternion().setFromEuler(offset));for(const [i,rig]of actors.entries())poseDummy(rig,{dt,dx:animated?Math.sin(elapsed+i)*.08:0,dz:0,speed:0,crouch:i===2?.5:0,pitch:Math.sin(elapsed*.6+i)*.06});gun.position.y=-.26+(animated?Math.sin(elapsed*1.8)*.003:0);renderWorld();renderProtectedMask();if(thumbnailPending)updateThumbnails();renderPost();dirty=false;});
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);const geometries=new Set(),materials=new Set();for(const entry of [...sceneCache.values(),{arena}])entry.arena?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}source.depthTexture.dispose();source.dispose();gunTarget.dispose();protectedTarget.dispose();maskBlack.dispose();maskWhite.dispose();material.dispose();quad.geometry.dispose();environment.dispose();renderer.dispose();});
choose(selected);const initial=views[params.get('scene')]?params.get('scene'):'rust';$('scene').value=initial;resize();loadScene(initial);
