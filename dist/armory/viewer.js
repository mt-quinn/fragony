import {clone} from './model.js';
import {createPhysicalUI} from './physical-ui.js';
import {createHardware} from './hardware.js';
import {createBenchFire} from './bench-fire.js';
const $=id=>document.getElementById(id);
export function createViewer(T){
 const host=$('gun-viewport'),root=$('armory'),renderer=new T.WebGLRenderer({alpha:false,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;
 $('physical-ui').appendChild(renderer.domElement);host.classList.add('has-webgl');
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const hardware=createHardware(T);let environment=hardware.environment(renderer);
 const firePreview=createBenchFire();
 const physical=createPhysicalUI(T,renderer,root,hardware,environment.texture);let rootRect=null,hostRect=null;
 const scene=new T.Scene();scene.environment=environment.texture;const camera=new T.PerspectiveCamera(28,1,.1,30);camera.position.set(2.5,1.4,6.2);camera.zoom=1.72;camera.lookAt(0,-.03,0);
 scene.add(new T.HemisphereLight(0xffffff,0x20313e,1.25));const key=new T.DirectionalLight(0xffead0,2.8);key.position.set(-2,5,5);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2.5;key.shadow.camera.right=2.5;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.camera.near=.1;key.shadow.camera.far=12;key.shadow.bias=-.0003;key.shadow.normalBias=.012;
 const rim=new T.DirectionalLight(0xb4dded,1.5);rim.position.set(3,2,-3);scene.add(rim);
 const rig=new T.Group();scene.add(rig);rig.rotation.set(.02,-.12,-.13);rig.position.set(.10,-.01,0);
 const mats={},geos={},mergedGeometries=[];let fitPoints=[];renderer.info.autoReset=false;let renderCount=0;
 const material=(name,color,metalness=.05,roughness=.65)=>mats[name]??=(new T.MeshStandardMaterial({color,metalness,roughness,flatShading:false}));
 const M={blue:material('blue',0x3f72a2),cream:material('cream',0xe6d9b8),ink:material('ink',0x202b2b,.3,.5),steel:material('steel',0x8f9fb5,.65,.35),coral:material('coral',0xe87844),lime:material('lime',0xd5da9c),pink:material('pink',0xb4a0d9),cyan:material('cyan',0x7fafbf),gold:material('gold',0xdabb76)};
 const rankMat=r=>[M.cream,M.cyan,M.pink,M.gold][r];
 const geo=(id,make)=>geos[id]??=make();
 function box(parent,x,y,z,w,h,d,mat,rz=0){
  const id=`box-${w}-${h}-${d}`;
  const geometry=geo(id,()=>{const c=Math.min(.018,w*.14,h*.14,d*.2),shape=new T.Shape(),a=w/2,b=h/2;shape.moveTo(-a+c,-b);shape.lineTo(a-c,-b);shape.lineTo(a,-b+c);shape.lineTo(a,b-c);shape.lineTo(a-c,b);shape.lineTo(-a+c,b);shape.lineTo(-a,b-c);shape.lineTo(-a,-b+c);shape.closePath();return new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:c*.3,bevelSize:c*.3,bevelSegments:1,steps:1}).translate(0,0,-d/2);});
  const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.rotation.z=rz;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function tube(parent,x,y,z,r,length,mat){const mesh=new T.Mesh(geo('tube-'+r+'-'+length,()=>new T.CylinderGeometry(r,r,length,16)),mat);mesh.rotation.z=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function ring(parent,x,y,z,r,thick,mat){const mesh=new T.Mesh(geo('ring-'+r+'-'+thick,()=>new T.TorusGeometry(r,thick,6,24)),mat);mesh.rotation.y=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function plate(parent,points,depth,mat,name){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geometry=geo(name,()=>new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1}));const mesh=new T.Mesh(geometry,mat);mesh.position.z=-depth/2;parent.add(mesh);return mesh;}
 let model=null,barrelGroup=null,flash=null,currentKit=null,currentSignature='',dirty=true,activeUntil=0,last=0,recoil=0,fireUntil=0,held=false,rotationX=0,rotationY=0;
 let audio=null,pendingShots=0;
 const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
 function batchGroup(group){
  group.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(group.matrixWorld).invert(),byMaterial=new Map(),originals=[];
  const visit=o=>{if(o!==group&&o.userData.rotor)return;if(o.isMesh){if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(o);originals.push(o);}for(const child of o.children)visit(child);};visit(group);
  for(const [material,meshes] of byMaterial){
   const pieces=meshes.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));return g;}),g=new T.BufferGeometry();
   for(const key of ['position','normal','uv']){const length=pieces.reduce((n,g)=>n+g.getAttribute(key).array.length,0),values=new Float32Array(length);let at=0;for(const piece of pieces){const a=piece.getAttribute(key).array;values.set(a,at);at+=a.length;}g.setAttribute(key,new T.BufferAttribute(values,key==='uv'?2:3));}
   g.computeBoundingSphere();pieces.forEach(g=>g.dispose());mergedGeometries.push(g);const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  originals.forEach(mesh=>mesh.removeFromParent());
 }
 function make(kit,previewSlot){
  if(model)rig.remove(model);mergedGeometries.splice(0).forEach(g=>g.dispose());model=new T.Group();rig.add(model);
  const group=slot=>{const g=new T.Group();g.userData.slot=slot;model.add(g);return g;};
  const receiver=group('mechanism'),barrel=group('barrel'),ammo=group('ammo'),circuit=group('circuit');barrelGroup=barrel;
  const main=M.blue;
  plate(receiver,[[-.79,-.02],[-.9,.25],[-.57,.47],[.46,.40],[.66,.14],[.52,-.06]],.42,main,'receiver');
  plate(receiver,[[-.59,.45],[.40,.39],[.49,.29],[-.63,.34]],.46,M.cream,'top-cover');
  box(receiver,-.14,.15,.235,.72,.12,.035,M.ink);box(receiver,-.14,.15,.258,.52,.035,.02,M.cyan);
  plate(receiver,[[-.72,.15],[-1.28,.20],[-1.51,.05],[-1.51,-.16],[-1.16,-.13],[-.70,-.01]],.27,M.ink,'stock');
  box(receiver,-1.48,.01,0,.095,.39,.38,M.cream,-.07);box(receiver,-1.17,.07,0,.13,.13,.32,M.coral);
  plate(receiver,[[-.52,-.04],[-.24,-.04],[-.33,-.59],[-.54,-.51],[-.62,-.32]],.27,M.ink,'grip');
  box(receiver,-.46,-.30,.149,.12,.25,.015,M.cream,-.16);
  box(receiver,-.07,-.10,0,.40,.08,.18,M.ink);box(receiver,.14,-.22,0,.07,.24,.18,M.ink,-.14);box(receiver,-.01,-.31,0,.34,.055,.18,M.ink);
  for(const z of [-.25,.25])for(const x of [-.57,.36]){const bolt=tube(receiver,x,.27,z,.026,.025,M.steel);bolt.rotation.set(Math.PI/2,0,0);}
  if(kit.mechanism.id==='burst')for(let i=0;i<3;i++)box(receiver,-.36+i*.14,.46,0,.075,.055,.16,M.coral);
  if(kit.mechanism.id==='automatic')for(let i=0;i<5;i++)box(receiver,-.42+i*.14,.46,0,.035,.055,.18,M.ink);
  if(kit.mechanism.id==='semi')box(receiver,-.68,.43,0,.13,.16,.16,M.coral,.3);
  if(kit.mechanism.id==='charge'){const cell=tube(receiver,-.03,.40,0,.15,.52,M.ink);for(let i=0;i<4;i++)ring(receiver,-.25+i*.14,.40,0,.15,.02,M.lime);}
  const bm=rankMat(kit.barrel.rank);
  box(barrel,.59,.16,0,.19,.44,.46,M.ink);box(barrel,.64,.22,0,.16,.25,.50,bm);
  if(kit.barrel.id==='rails'){
   for(const z of [-.16,.16]){box(barrel,1.04,.18,z,.93,.095,.085,bm);box(barrel,1.05,.19,z,.85,.023,.10,M.cyan);for(let i=0;i<4;i++)box(barrel,.72+i*.18,.18,z,.05,.18,.14,M.ink);}
   box(barrel,.75,.17,0,.16,.18,.18,M.ink);
  }else if(kit.barrel.id==='gatling'){
   const rotor=new T.Group();rotor.position.y=.17;rotor.userData.rotor=true;barrel.add(rotor);barrelGroup=rotor;
   for(let i=0;i<6;i++){const a=i*Math.PI/3,y=Math.cos(a)*.13,z=Math.sin(a)*.13;tube(rotor,1.02,y,z,.045,.83,M.steel);ring(rotor,1.45,y,z,.047,.013,bm);tube(rotor,1.455,y,z,.032,.012,M.ink);}
   batchGroup(rotor);
   ring(barrel,.82,.17,0,.19,.04,M.ink);ring(barrel,1.22,.17,0,.19,.025,bm);
  }else{
   const offsets=kit.barrel.id==='double'?[-.12,.12]:[0],radius=kit.barrel.id==='huge'?.15:kit.barrel.id==='single'?.075:.065;
   for(const z of offsets){tube(barrel,1.02,.17,z,radius,.85,M.steel);tube(barrel,1.10,.17,z,radius*1.2,.40,M.ink);ring(barrel,1.47,.17,z,radius*1.17,.026,bm);tube(barrel,1.477,.17,z,radius*.85,.012,M.ink);}
   if(kit.barrel.id==='huge'){box(barrel,.86,.17,0,.22,.37,.42,bm);ring(barrel,1.34,.17,0,.19,.035,M.coral);}
   else{box(barrel,.86,.26,0,.36,.055,.39,bm);for(let i=0;i<3;i++)box(barrel,.75+i*.10,.296,.01,.045,.025,.29,M.ink);}
  }
  for(let i=0;i<4;i++)box(receiver,-.55+i*.085,.23,.258,.038,.065,.018,M.ink,-.08);
  box(receiver,.36,.13,.238,.17,.20,.028,M.ink);box(receiver,.36,.16,.26,.11,.035,.025,M.coral);
  box(receiver,-.65,.09,-.23,.18,.12,.025,M.cream);
  for(const x of [-.68,.48]){const bolt=tube(receiver,x,.18,.258,.018,.025,M.steel);bolt.rotation.set(Math.PI/2,0,0);}
  const am=rankMat(kit.ammo.rank);
  plate(ammo,[[.03,-.07],[.34,-.06],[.27,-.57],[.02,-.54]],.27,M.ink,'magazine');
  plate(ammo,[[.08,-.12],[.28,-.11],[.22,-.49],[.07,-.47]],.295,am,'magazine-cover');
  box(ammo,.16,-.58,0,.35,.08,.37,M.cream,.03);
  if(kit.ammo.id==='duplex'){for(const x of [.11,.23]){box(ammo,x,-.29,.162,.045,.20,.02,M.cream,-.1);box(ammo,x+.01,-.18,.164,.045,.035,.022,M.gold);}}
  else if(kit.ammo.id==='pellets'){for(let i=0;i<8;i++)box(ammo,.12+(i%2)*.10,-.20-Math.floor(i/2)*.075,.162,.035,.035,.024,M.cream);}
  else if(kit.ammo.id==='explosive'){box(ammo,.17,-.28,.165,.09,.21,.026,M.coral);box(ammo,.17,-.18,.17,.09,.035,.03,M.gold);}
  else if(kit.ammo.id==='sniper'){box(ammo,.17,-.29,.164,.028,.25,.024,M.gold,-.1);}
  else{for(let i=0;i<3;i++)box(ammo,.08+i*.075,-.29,.163,.024,.18,.022,kit.ammo.id==='piercing'?M.cyan:M.cream,-.1);}
  for(let i=0;i<3;i++)box(ammo,.17,-.36-i*.055,-.165,.16,.015,.012,M.ink);
  const cm=rankMat(kit.circuit.rank);
  box(circuit,-.54,.55,0,.30,.12,.34,M.ink);box(circuit,-.54,.62,0,.26,.025,.29,cm);
  for(let i=0;i<4;i++)box(circuit,-.65+i*.07,.55,.19,.028,.055,.065,M.gold);
  const circuitFace=hardware.part(kit.circuit.id,kit.circuit.rank,.0075);circuitFace.position.set(-.54,.61,.17);circuit.add(circuitFace);
  flash=new T.Group();flash.position.set(1.58,.17,0);model.add(flash);
  const fg=geo('flash',()=>new T.OctahedronGeometry(.15,0)),fm=material('flash',0xffc27a);fm.emissive=new T.Color(0xffa95a);fm.emissiveIntensity=1;
  const f=new T.Mesh(fg,fm);f.scale.set(2.4,.65,.65);flash.add(f);flash.visible=false;
  // New attachments seat into their actual mount; the rest of the gun stays still.
  model.updateMatrixWorld(true);const inv=new T.Matrix4().copy(model.matrixWorld).invert();fitPoints=[];
  model.traverse(mesh=>{if(!mesh.isMesh||mesh.parent===flash)return;mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])fitPoints.push(new T.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv));
  });
  for(const group of [receiver,barrel,ammo,circuit])batchGroup(group);
  if(currentKit&&!prefersReduced.matches)for(const g of model.children){const slot=g.userData.slot;if(slot&&JSON.stringify(currentKit[slot])!==JSON.stringify(kit[slot])){
   if(slot==='barrel')g.userData.seatX=.24;else if(slot==='ammo')g.userData.seatY=-.23;else g.userData.seatY=.13;
  }}
  model.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
  currentKit=clone(kit);firePreview.setKit(kit);pendingShots=0;$('test-status').hidden=true;if(hostRect){fitCamera();physical.sync();}dirty=true;activeUntil=performance.now()+300;
 }
 function fitCamera(){
  camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();rig.updateMatrixWorld(true);
  const min=new T.Vector2(Infinity,Infinity),max=new T.Vector2(-Infinity,-Infinity);
  for(const point of fitPoints){const p=point.clone();rig.localToWorld(p);p.project(camera);min.min(p);max.max(p);}
  camera.zoom=Math.min(2.05,1.76/(max.x-min.x),1.55/(max.y-min.y));camera.updateProjectionMatrix();
  const stock=new T.Vector3(-1.27,-.13,0),front=new T.Vector3(.94,currentKit?.barrel.id==='huge'?-.025:.08,0);
  const points=[stock,front].map(point=>{rig.localToWorld(point);point.project(camera);return{x:hostRect.left-rootRect.left+(point.x+1)*hostRect.width/2,y:rootRect.height-(hostRect.top-rootRect.top+(1-point.y)*hostRect.height/2)};});physical.setMounts(points);
 }
 function resize(){rootRect=root.getBoundingClientRect();hostRect=host.getBoundingClientRect();if(rootRect.width&&rootRect.height&&hostRect.height){renderer.setSize(rootRect.width,rootRect.height,false);camera.aspect=hostRect.width/hostRect.height;camera.fov=28;fitCamera();physical.resize(rootRect.width,rootRect.height);dirty=true;}}
 const floor=new T.Mesh(geo('shadow-floor',()=>new T.PlaneGeometry(4,2)),mats.shadow=new T.ShadowMaterial({opacity:.3,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-.68;floor.receiveShadow=true;scene.add(floor);
 const observer=new ResizeObserver(resize);observer.observe(root);observer.observe(host);
 $('options').addEventListener('scroll',()=>{physical.scroll();dirty=true;},{passive:true});
 let down=null;host.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,rx:rotationX,ry:rotationY};host.setPointerCapture(e.pointerId);});
 host.addEventListener('pointermove',e=>{if(!down)return;rotationY=Math.max(-.9,Math.min(.9,down.ry+(e.clientX-down.x)*.008));rotationX=Math.max(-.35,Math.min(.35,down.rx+(e.clientY-down.y)*.006));dirty=true;});
 const pointerEnd=()=>{down=null;};host.addEventListener('pointerup',pointerEnd);host.addEventListener('pointercancel',pointerEnd);host.addEventListener('lostpointercapture',pointerEnd);
 host.tabIndex=0;host.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotationY=Math.max(-.9,Math.min(.9,rotationY+(e.key==='ArrowLeft'?-.18:.18)));dirty=true;}});
 function sound(){if(root.dataset.muted==='true')return;try{if(!audio){if(navigator.audioSession)navigator.audioSession.type='ambient';audio=new AudioContext();}if(audio.state!=='running')audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(currentKit?.barrel.id==='huge'?105:190,audio.currentTime);o.frequency.exponentialRampToValueAtTime(35,audio.currentTime+.065);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.075);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.08);}catch{}}
 function trigger(){if(!currentKit)return;held=true;const now=performance.now(),sample=firePreview.step(now,true);pendingShots+=sample.shots;activeUntil=Math.max(now+200,sample.nextDeadline+250);dirty=true;$('fire-feedback').textContent='Testing fire.';}
 $('test-fire').addEventListener('pointerdown',e=>{e.preventDefault();$('test-fire').setPointerCapture(e.pointerId);trigger();});
 const release=()=>{held=false;};$('test-fire').addEventListener('pointerup',release);$('test-fire').addEventListener('pointercancel',release);$('test-fire').addEventListener('lostpointercapture',release);window.addEventListener('blur',release);
 $('test-fire').addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!held)trigger();}});$('test-fire').addEventListener('keyup',release);
 $('test-fire').addEventListener('click',e=>{if(e.detail===0){trigger();queueMicrotask(()=>{held=false;});}});
 function loop(now){
  const dt=Math.min(.05,(now-(last||now))/1000);last=now;
  const firing=firePreview.step(now,held);firing.shots+=pendingShots;pendingShots=0;for(let i=0;i<firing.shots;i++)sound();
  if(firing.startedReload){$('test-status').hidden=false;$('fire-feedback').textContent='Reloading.';dirty=true;}
  if(firing.completedReload){$('test-status').hidden=true;dirty=true;}
  if(firing.nextDeadline)activeUntil=Math.max(activeUntil,firing.nextDeadline+250);
  root.dataset.testing=firing.reloading?'reload':held?'fire':'idle';
  if(firing.shots){recoil=Math.min(.13,recoil+.075);fireUntil=now+45;activeUntil=now+450;dirty=true;}
  const animating=now<activeUntil;
  if(dirty||animating||physical.isAnimating()){
   if(model)for(const part of model.children)if(part.userData.slot){part.userData.seatX=(part.userData.seatX||0)*Math.exp(-dt*23);part.userData.seatY=(part.userData.seatY||0)*Math.exp(-dt*23);part.position.x=part.userData.seatX;part.position.y=part.userData.seatY-(part.userData.slot==='ammo'&&firing.reloading&&!prefersReduced.matches?Math.sin(firing.reloadProgress*Math.PI)*.18:0);}
   recoil*=Math.exp(-dt*24);rig.position.x=.12-(prefersReduced.matches?0:recoil);rig.rotation.set(.02+rotationX,-.12+rotationY,-.13+(prefersReduced.matches?0:recoil*.12));
   if(flash)flash.visible=now<fireUntil;if(currentKit?.barrel.id==='gatling'&&barrelGroup&&animating)barrelGroup.rotation.x+=dt*(held?4:.6);
   if(!rootRect||!hostRect)resize();
   renderer.info.reset();renderer.setScissorTest(false);renderer.setViewport(0,0,rootRect.width,rootRect.height);physical.render(dt);
   const x=hostRect.left-rootRect.left,y=rootRect.height-(hostRect.bottom-rootRect.top);
   const auto=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.setViewport(x,y,hostRect.width,hostRect.height);renderer.setScissor(x,y,hostRect.width,hostRect.height);renderer.setScissorTest(true);renderer.render(scene,camera);renderer.setScissorTest(false);renderer.setViewport(0,0,rootRect.width,rootRect.height);renderer.autoClear=auto;root.dataset.renderCalls=String(renderer.info.render.calls);root.dataset.renderCount=String(++renderCount);root.dataset.gpuGeometries=String(renderer.info.memory.geometries);dirty=false;
  }
 }
 renderer.setAnimationLoop(loop);
 document.addEventListener('visibilitychange',()=>{held=false;if(document.hidden){firePreview.stop();pendingShots=0;$('test-status').hidden=true;renderer.setAnimationLoop(null);audio?.suspend().catch(()=>{});}else{dirty=true;last=0;renderer.setAnimationLoop(loop);}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);host.classList.remove('has-webgl');root.classList.remove('has-physical-ui');root.dataset.renderer='fallback';held=false;});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{environment.dispose();environment=hardware.environment(renderer);scene.environment=environment.texture;physical.setEnvironment(environment.texture);host.classList.add('has-webgl');resize();dirty=true;renderer.setAnimationLoop(loop);});
 window.addEventListener('pagehide',e=>{if(e.persisted)return;observer.disconnect();renderer.setAnimationLoop(null);physical.dispose();hardware.dispose();environment.dispose();mergedGeometries.forEach(g=>g.dispose());key.shadow.map?.dispose();Object.values(geos).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());renderer.dispose();audio?.close().catch(()=>{});});
 window.addEventListener('pageshow',e=>{if(e.persisted){resize();dirty=true;last=0;renderer.setAnimationLoop(loop);}});
 return {feedback(){physical.feedback();dirty=true;activeUntil=performance.now()+300;},refresh(){physical.sync();dirty=true;},update(kit,slot){physical.sync();dirty=true;const sig=JSON.stringify(kit);if(sig!==currentSignature){currentSignature=sig;held=false;make(kit,slot);}},stopTest(){held=false;firePreview.stop();$('test-status').hidden=true;}};
}
