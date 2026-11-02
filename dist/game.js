import * as THREE from 'three';
import { ArenaAI, buildNavigation, nearestNode as nearestAINode, findRoute } from './ai.js';
import { MAP, ALL_WEAPONS, randomWeaponPair } from './map.js';
import { inBlock, blockedAt, surfaceAt, ceilingAt, launchTime } from './geometry.js';
import { GameAudio, AUDIO_TUNING } from './audio.js';
import { FEEL, HANDLING, Spring, accelerate, WeaponMotion, HitFeedback } from './feel.js';
import { resolveDamage, combineOutcomes, recordDamage, clearDamageCredit, takeAssists } from './combat.js';
import { WEAPON_SLOTS, OPTICS, SLOT_LABELS, attachment, fitted, normalizeBuilds, weaponStats, previewBuild, fitAttachment, migrateBuilds, EQUIPMENT, normalizeEquipment } from './loadout.js';
import { loadoutHTML } from './loadout-view.js';
import { createShopOffers, validShopOffers, offeredPart, offeredUpgrade } from './shop.js';
const $=s=>document.getElementById(s), clamp=THREE.MathUtils.clamp;
const weapons=[
 {name:'AR-9',label:'Assault rifle',damage:24,interval:.13,mag:30,reload:1.35,spread:.008,pellets:1,color:0xe6fa80,kick:.045,price:0,desc:'Accurate automatic fire. 30 rounds.'},
 {name:'IRON .50',label:'Hand cannon',damage:83,interval:.53,mag:7,reload:1.6,spread:.004,pellets:1,color:0xe6fa80,kick:.15,price:260,desc:'High damage. Heavy recoil. 7 rounds.'},
 {name:'WASP',label:'Submachine gun',damage:13,interval:.055,mag:42,reload:1.05,spread:.033,pellets:1,color:0xe6fa80,kick:.025,price:280,desc:'Very fast fire rate. Wide spread. 42 rounds.'},
 {name:'LONGSHOT',label:'Rail rifle',damage:155,interval:1.35,mag:4,reload:2,spread:0,pellets:1,color:0xe6fa80,kick:.12,price:420,desc:'Instant piercing shot. Slow fire rate. 4 rounds.'},
 {name:'THUMPER',label:'Rocket launcher',damage:110,interval:.85,mag:5,reload:1.8,spread:0,pellets:1,color:0xe6fa80,kick:.16,price:400,desc:'Splash damage and rocket jumps. 5 rockets.'},
 {name:'DOORBREAKER',label:'Pump shotgun',damage:12,interval:.83,mag:8,reload:1.7,spread:.085,pellets:12,color:0xe6fa80,kick:.16,price:300,desc:'12 pellets. Strong up close; tight core retains range.'}
];
let navNodes=[],navigation,opponentAI,playerSpawnAt=0,previewDummy;
let scene,camera,renderer,weaponGroup,flash,arena,worldMeshes=[],blocks=[],bots=[],effects=[],rockets=[],pickups=[];
let mode='menu',round=1,credits=0,owned=[0],equipped=0,perks={},time=90,matchKills=0,deathCount=0,streak=0,best=Number(localStorage.getItem('dh-best')||0);
let builds=normalizeBuilds(),equipment=normalizeEquipment(),startingWeapon=0,shopGun=0,shopSlot='optic',shopCandidate='',shopInspect=false,shopMessage='',shopOffers=null,shownReticle=null;
function playerWeapon(i=equipped,state=builds){return weaponStats(weapons[i],i,state)}
function playerHandling(i=equipped){const w=playerWeapon(i),h=HANDLING[i];return {...h,kick:h.kick*w.recoil,aim:h.aim*w.recoil}}
let muzzleTime=0,magazines={},playerPadFlight=null;
const playerCredit={maxHealth:100};let assistNotice={points:0,count:0,left:0},matchAssists=0;
let matchPoints=0,headshotKills=0,jumpBuffered=0,coyoteTime=0,lastJumpHeld=false,viewHeight=1.7,turnX=0,turnY=0,nearMissCooldown=0,damageBearing=0,nearWall=0;
const weaponMotion=new WeaponMotion(),aimSpring=new Spring(),feedback=new HitFeedback();
let settings={motion:.65,guns:1,steps:1,feedback:1};try{settings={...settings,...JSON.parse(localStorage.getItem('dh-settings')||'{}')}}catch{}
let shotsFired=0;
let health=100,focus=100,ammo=30,reloading=0,shotTimer=0,grenades=2,slow=false,locked=false,mouseDown=false,yaw=0,pitch=0,vy=0,grounded=true,recoil=0,moveClock=0,elapsed=0,hitTime=0,damageTime=0,respawnTime=0,toastTime=0,streakReady=false;
const playerPos=new THREE.Vector3(0,1.7,15),vel=new THREE.Vector3(),keys=new Set(),up=new THREE.Vector3(0,1,0),ray=new THREE.Raycaster(),aim=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
const gameAudio=new GameAudio();let muted=false,lastHUD=0,dragLook=false,stepDistance=0,reloadStage=0,reloadLength=0,hurtSoundCooldown=0,lastPointer=null;
const spawnPoints=MAP.spawns;
const botNames=['CINDER','ROOK','VESPER','STATIC','BRICK'];
const toonRamp=new THREE.DataTexture(new Uint8Array([70,70,70,255,160,160,160,255,245,245,245,255]),3,1);toonRamp.minFilter=toonRamp.magFilter=THREE.NearestFilter;toonRamp.needsUpdate=true;
const inkEdges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));const inkLine=new THREE.LineBasicMaterial({color:0x303b40,transparent:true,opacity:.45});
const matCache=new Map();const botTorsoGeo=new THREE.CylinderGeometry(.85,.72,1,6),botLimbGeo=new THREE.CylinderGeometry(.85,1,1,6),dummyHeadGeo=new THREE.IcosahedronGeometry(1,1),shardGeo=new THREE.TetrahedronGeometry(1);
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.IcosahedronGeometry(1,0);
// Stable face values keep corners readable even when two surfaces share a light.
// This shared geometry/material cache adds no lights or post-processing passes.
const worldBoxGeo=boxGeo.clone(),faceValues=new Float32Array(worldBoxGeo.attributes.position.count*3);
for(let i=0;i<worldBoxGeo.attributes.normal.count;i++){
 const n=worldBoxGeo.attributes.normal,x=n.getX(i),y=n.getY(i),z=n.getZ(i);
 const value=y>.5?[1,1,.96]:y<-.5?[.38,.46,.46]:x>.5?[.56,.68,.72]:x<-.5?[.76,.83,.84]:z>.5?[.91,.94,.89]:[.67,.76,.79];
 faceValues.set(value,i*3);
}
worldBoxGeo.setAttribute('color',new THREE.BufferAttribute(faceValues,3));
const worldMatCache=new Map();
function worldMat(c){if(!worldMatCache.has(c))worldMatCache.set(c,new THREE.MeshToonMaterial({color:c,gradientMap:toonRamp,vertexColors:true}));return worldMatCache.get(c)}
function mat(c){if(!matCache.has(c))matCache.set(c,new THREE.MeshToonMaterial({color:c,gradientMap:toonRamp}));return matCache.get(c)}
function cube(x,y,z,w,h,d,c,parent=arena,solid=false){const m=new THREE.Mesh(solid?worldBoxGeo:boxGeo,solid?worldMat(c):mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=parent!==weaponGroup;m.receiveShadow=true;parent.add(m);if(solid){const edge=new THREE.LineSegments(inkEdges,inkLine);m.add(edge);blocks.push({x,z,w,d,top:y+h/2,bottom:y-h/2});worldMeshes.push(m)}return m}
function label(text,x,y,z,width,height,rotation=0,bg='#182127',fg='#eef0e6'){const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,256);c.fillStyle=fg;c.font='900 170px Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,140,970);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tx}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;arena.add(mesh);return mesh}
function init(){
 gameAudio.visibility=(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z));
 scene=new THREE.Scene();scene.background=new THREE.Color(0x182127);scene.fog=new THREE.Fog(0x182127,38,120);
 camera=new THREE.PerspectiveCamera(85,innerWidth/innerHeight,.07,160);camera.rotation.order='YXZ';
 try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch(e){$('start').textContent='WEBGL REQUIRED';$('start').disabled=true;return}
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;$('viewport').appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xf7f8f0,0x65717c,.95));const sun=new THREE.DirectionalLight(0xffffff,2.0);sun.position.set(-24,52,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-57,right:57,top:57,bottom:-57,near:1,far:125});sun.shadow.bias=-.003;sun.shadow.normalBias=.08;scene.add(sun);arena=new THREE.Group();scene.add(arena);buildArena();buildNav();buildWeapon();previewDummy=createDummy().group;camera.add(previewDummy);previewDummy.scale.setScalar(1.55);previewDummy.position.set(1.55,-1.85,-4.6);previewDummy.rotation.y=-.4;
 let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;if(mode==='shop')return;if(mode==='play'&&locked)update(dt);else if(mode==='menu'){previewDummy.visible=true;previewDummy.rotation.y=-.4+Math.sin(elapsed*.3)*.12;camera.fov=65;camera.updateProjectionMatrix();camera.position.set(43+Math.sin(elapsed*.055)*3,32,42);camera.lookAt(0,0,-3)}updateEffects(dt*(slow?.25:1));renderer.render(scene,camera)});
}
function buildArena(){
 const floor=new THREE.Mesh(new THREE.BoxGeometry(MAP.floor.w,1,MAP.floor.d),mat(0x94a69e));floor.position.y=-.5;floor.receiveShadow=true;arena.add(floor);worldMeshes.push(floor);
 const colors={chalk:0xdce2d5,ink:0x182127,stair:0xb5c3bb,deck:0xa3b8b2};
 for(const a of MAP.areas){const tint=new THREE.Mesh(boxGeo,mat(a.color));tint.position.set(a.x,.008,a.z);tint.scale.set(a.w,.012,a.d);arena.add(tint)}
 for(const b of MAP.solids){
  const m=cube(b.x,b.y,b.z,b.w,b.h,b.d,colors[b.style],arena,true);m.rotation.y=b.yaw||0;blocks.at(-1).yaw=b.yaw||0;
  const base=b.y-b.h/2,top=b.y+b.h/2;
  if(b.style==='stair'){const trim=cube(b.x,top+.008,b.z,b.w,.016,.045,0x344e4b);trim.rotation.y=b.yaw||0}
  else if(b.style==='deck'){
   for(const side of [-1,1])cube(b.x,top+.018,b.z+side*(b.d/2-.06),b.w,.035,.12,0xd9ef45);
   cube(b.x,base-.04,b.z,b.w+.02,.08,b.d+.02,0x182127);
  }else{const plinth=cube(b.x,base+.1,b.z,b.w+.015,.2,b.d+.015,0x354b49);plinth.rotation.y=b.yaw||0}
 }
 const gridVertices=[];for(let x=-36;x<=36;x+=4)gridVertices.push(x,.024,-33,x,.024,33);for(let z=-32;z<=32;z+=4)gridVertices.push(-37,.024,z,37,.024,z);
 const gridGeo=new THREE.BufferGeometry();gridGeo.setAttribute('position',new THREE.Float32BufferAttribute(gridVertices,3));arena.add(new THREE.LineSegments(gridGeo,new THREE.LineBasicMaterial({color:0x3b5753,transparent:true,opacity:.15,depthWrite:false})));
 // Press silhouettes, calibration faces, lane markings and room numbers give place.
 for(const [x,z,h]of[[-26,-5,7],[-22,6,5.5]]){cube(x,h+.4,z,6,.8,5.6,0xb7c9bb);for(const side of [-1,1])cube(x+side*1.85,h/2,z+2.52,.23,h,.07,0xd9ef45);cube(x,h*.65,z+2.56,2.5,.15,.08,0xd9ef45)}
 for(const side of [-1,1]){const target=new THREE.Mesh(targetGeo,calibration());target.position.set(-5,5.7,side*2.02);target.scale.setScalar(1.1);if(side<0)target.rotation.y=Math.PI;arena.add(target)}
 const crown=new THREE.Mesh(new THREE.TorusGeometry(2.1,.1,4,32),mat(0xd9ef45));crown.position.set(-5,10.5,0);arena.add(crown);const second=crown.clone();second.rotation.y=Math.PI/2;arena.add(second);
 label('PRESS',-37.92,7,-5,13,1.8,Math.PI/2);label('CORE',-5,8,-20.1,8,1.6,0,'#d9ef45','#182127');label('RANGE',37.92,8,-4,12,2,-Math.PI/2);label('CONTROL',25,11,-33.92,17,2);label('ASSEMBLY',0,7,33.92,20,2,Math.PI);
 for(const [number,x]of[['01',19],['02',26],['03',33]]){label(number,x,3,-20.1,2.3,2.3,0,'#182127','#d9ef45');const target=new THREE.Mesh(targetGeo,calibration());target.position.set(x,1.7,-20.04);target.scale.setScalar(.55);arena.add(target)}
 for(const x of [19,26,33])cube(x,.03,3,.1,.025,27,0x526b5b);
 for(const [x,z,w,d]of[[-26,14,10,.16],[0,15,10,.16],[26,16,10,.16],[-9,-28,.16,6],[11,29,6,.16]])cube(x,.035,z,w,.03,d,0xd9ef45);
 for(const p of MAP.pads){const y=p.y||0;cube(p.x,y+.045,p.z,2.7,.09,2.7,0x182127);cube(p.x,y+.11,p.z,2.2,.08,2.2,0xd9ef45);const triangle=new THREE.Mesh(new THREE.ConeGeometry(.65,.07,3),mat(0x182127));triangle.position.set(p.x,y+.2,p.z);triangle.rotation.y=Math.atan2(p.landing.x-p.x,p.landing.z-p.z);arena.add(triangle);pickups.push({...p,kind:'pad',mesh:triangle,timer:0})}
 for(const p of MAP.pickups){const group=new THREE.Group(),m=new THREE.Mesh(p.kind==='health'?boxGeo:sphereGeo,mat(p.kind==='health'?0xf1f3e8:0xd9ef45));m.scale.setScalar(.5);group.add(m);if(p.kind==='health'){cube(0,0,.26,.15,.4,.025,0x182127,group);cube(0,0,.26,.4,.15,.025,0x182127,group)}group.position.set(p.x,p.y+1.15,p.z);arena.add(group);pickups.push({...p,mesh:group,timer:0});const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.035,3,24),mat(0xd9ef45));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,p.y+.02,p.z);arena.add(ring)}
 batchArena();
}
function batchArena(){
 const groups=new Map(),edgePositions=[];
 // Hidden originals retain precise raycasts; shared instances render static blocks.
 for(const m of [...arena.children])if(m.isMesh&&(m.geometry===worldBoxGeo||m.geometry===boxGeo)){
  const key=m.material;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);m.updateMatrix();
  if(m.geometry===worldBoxGeo){const a=inkEdges.attributes.position;for(let i=0;i<a.count;i++){tmp.fromBufferAttribute(a,i).applyMatrix4(m.matrix);edgePositions.push(tmp.x,tmp.y,tmp.z)}}
 }
 for(const meshes of groups.values())for(const geo of [boxGeo,worldBoxGeo]){const group=meshes.filter(m=>m.geometry===geo);if(!group.length)continue;const batch=new THREE.InstancedMesh(geo,group[0].material,group.length);for(let i=0;i<group.length;i++){batch.setMatrixAt(i,group[i].matrix);group[i].visible=false}batch.castShadow=batch.receiveShadow=true;arena.add(batch)}
 const edgeGeo=new THREE.BufferGeometry();edgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(edgePositions,3));arena.add(new THREE.LineSegments(edgeGeo,inkLine));
}

const barrelGeo=new THREE.CylinderGeometry(1,1,1,8),muzzleRingGeo=new THREE.TorusGeometry(1,.14,4,8);
function buildWeapon(state=builds){
 if(weaponGroup){camera.remove(weaponGroup);flash?.material.dispose()}
 weaponGroup=new THREE.Group();camera.add(weaponGroup);if(!camera.parent)scene.add(camera);
 weaponGroup.userData.moving=[];const i=equipped,ink=0x152127,chalk=0xe1e5dc,signal=0xd9ef45;
 const part=(x,y,z,w,h,d,c=ink)=>cube(x,y,z,w,h,d,c,weaponGroup);
 const barrel=(x,y,z,r,length,c=ink)=>{const m=new THREE.Mesh(barrelGeo,mat(c));m.position.set(x,y,z);m.scale.set(r,length,r);m.rotation.x=Math.PI/2;weaponGroup.add(m);return m};
 let muzzle=-.9;
 if(i===0){
  part(0,0,-.13,.19,.2,.55,chalk);part(0,-.15,.03,.14,.3,.16);part(0,-.19,-.2,.14,.3,.17);part(0,.13,-.22,.06,.045,.4);part(0,0,-.55,.18,.16,.3);barrel(0,0,-.83,.04,.3);part(.1,.02,-.13,.025,.12,.2,signal);for(let j=0;j<4;j++)part(.095,.01,-.45-j*.06,.02,.07,.025,chalk);muzzle=-1;
 }else if(i===1){
  part(0,.015,-.19,.21,.22,.57,chalk);part(0,-.17,.02,.15,.3,.17);part(0,.145,-.34,.045,.055,.09);part(0,.145,.06,.14,.035,.06);barrel(0,.02,-.48,.082,.08);part(0,-.005,-.525,.11,.1,.015);part(.11,.015,-.12,.015,.12,.11,signal);muzzle=-.54;
 }else if(i===2){
  part(0,0,-.17,.16,.16,.4);part(0,.1,-.14,.13,.04,.34,chalk);part(0,-.14,0,.12,.26,.15);const magazine=part(0,-.21,-.18,.11,.31,.13,chalk);magazine.rotation.x=-.22;barrel(0,0,-.48,.075,.26);part(0,-.13,-.4,.1,.16,.12,signal);part(.09,0,-.12,.02,.065,.21,signal);muzzle=-.64;
 }else if(i===3){
  part(0,-.02,-.18,.24,.2,.55);part(0,-.18,.08,.15,.3,.2);part(0,-.14,-.18,.15,.2,.15,chalk);for(const side of [-1,1]){part(side*.08,.01,-.74,.065,.13,.84,chalk);part(side*.08,.025,-.68,.07,.03,.58,signal)}barrel(0,.01,-.6,.045,.55);part(0,.16,-.14,.14,.1,.19,chalk);barrel(0,.2,-.25,.08,.22);const optic=new THREE.Mesh(muzzleRingGeo,mat(signal));optic.position.set(0,.2,-.365);optic.scale.setScalar(.075);weaponGroup.add(optic);muzzle=-1.18;
 }else if(i===4){
  barrel(0,.02,-.26,.23,.95);barrel(0,.02,-.65,.26,.16,chalk);barrel(0,.02,-.74,.22,.025);const rim=new THREE.Mesh(muzzleRingGeo,mat(signal));rim.position.set(0,.02,-.765);rim.scale.setScalar(.235);weaponGroup.add(rim);part(0,-.25,.03,.16,.3,.19,chalk);part(.25,.1,-.28,.07,.12,.45,signal);part(0,.28,-.22,.06,.04,.26,chalk);muzzle=-.83;
 }else{
  part(0,0,-.15,.23,.2,.5,chalk);part(0,-.17,.08,.15,.29,.2);barrel(0,.025,-.73,.073,.75);barrel(0,-.09,-.65,.06,.55);part(0,-.08,-.58,.23,.16,.32,signal);for(let j=0;j<5;j++)part(0,-.08,-.46-j*.055,.24,.17,.014);for(let j=0;j<3;j++)barrel(-.14,.02,-.04-j*.08,.025,.055,signal);part(0,.14,-.23,.04,.04,.24);muzzle=-1.12;
 }
 const moving=weaponGroup.userData.moving;
 for(const mesh of weaponGroup.children){if(mesh.geometry!==boxGeo)continue;const mag=mesh.position.y<-.14&&mesh.position.z<0?1:0,slide=i===1&&mesh.position.y>0?1:0,pump=i===5&&mesh.position.z<-.4&&mesh.position.y<0?1:0;if(mag||slide||pump)moving.push({mesh,base:mesh.position.clone(),mag,slide,pump})}
 const kit=fitted(i,state);weaponGroup.userData.opticY=.3;
 for(const a of kit){
  if(a.slot==='optic'){
   const y=.3,z=i===1?-.17:-.2;part(0,.16,z,.07,.12,.15,ink);
   if(a.shape==='open'||a.shape==='box'){const w=a.shape==='open'?.22:.25;part(-w/2,y,z,.025,.17,.075,chalk);part(w/2,y,z,.025,.17,.075,chalk);part(0,y+.085,z,w,.025,.075,chalk);part(0,y-.085,z,w,.025,.075,signal)}
   else{for(const dz of a.shape==='tube'?[-.09,.09]:[0]){const ring=new THREE.Mesh(muzzleRingGeo,mat(chalk));ring.position.set(0,y,z+dz);ring.scale.setScalar(.11);weaponGroup.add(ring)}}
  }else if(a.slot==='barrel'){
   const extension=a.visual==='long'?.24:a.visual==='short'?.04:.1;barrel(0,.01,muzzle-extension*.4,a.visual==='heavy'?.1:.065,extension,signal);muzzle-=extension*.7;
  }else if(['muzzle','choke'].includes(a.slot)){
   barrel(0,0,muzzle-.035,a.visual==='comp'?.11:.09,a.visual==='choke'?.17:.12,signal);for(const x of [-.09,.09])part(x,.01,muzzle-.03,.02,.08,.04,ink);muzzle-=.08;
  }else if(['magazine','tube','loader'].includes(a.slot)){
   if(a.visual==='drum'){const m=new THREE.Mesh(barrelGeo,mat(signal));m.position.set(0,-.3,-.15);m.rotation.z=Math.PI/2;m.scale.set(.17,.17,.17);weaponGroup.add(m)}
   else part(0,i===5?-.13:-.3,i===5?-.6:-.15,.12,a.visual==='fast'?.12:.28,i===5?.7:.17,signal);
  }else if(a.slot==='stock'){part(0,-.03,.22,.15,.16,a.visual==='light'?.2:.38,signal);if(a.visual==='brace')part(0,-.13,.34,.2,.3,.12,ink)}
  else if(a.slot==='capacitor'){part(.16,0,-.32,.11,.15,.28,signal);for(let j=0;j<3;j++)part(.22,.01,-.23-j*.08,.02,.11,.02,ink)}
  else if(a.slot==='motor'){barrel(0,.02,.22,.25,.22,signal)}
  else if(a.slot==='warhead'){barrel(0,.02,-.77,.17,.12,signal)}
  else if(a.slot==='trigger'){part(.11,-.14,-.03,.04,.06,.14,signal)}
  else if(a.slot==='pump'){part(0,-.09,-.58,.27,.19,.25,signal)}
  else{part(-.08,-.2,-.42,.09,.23,.12,signal)}
 }
 if(![1,4].includes(i)){part(0,-.01,.25,.14,.13,.35,chalk);part(0,-.05,.42,.18,.25,.075,ink)}
 // The player's yellow shell and black wrist joints match the opponents.
 const hand=new THREE.Mesh(dummyHeadGeo,mat(signal));hand.position.set(.015,-.29,.07);hand.scale.set(.115,.15,.13);hand.userData.hand=true;weaponGroup.add(hand);part(.02,-.43,.19,.17,.18,.23).userData.hand=true;part(.02,-.52,.27,.19,.17,.27,signal).userData.hand=true;
 if(i!==1){const support=new THREE.Mesh(dummyHeadGeo,mat(signal));support.position.set(-.03,-.18,i===4?-.41:-.43);support.scale.set(.12,.1,.15);support.userData.hand=true;weaponGroup.add(support)}
 flash=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:0xf4ffb2}));flash.position.set(0,0,muzzle);flash.scale.set(.18,.15,.3);flash.visible=false;weaponGroup.add(flash);weaponGroup.scale.setScalar(.85);weaponGroup.position.set(.31,-.3,-.5);weaponGroup.visible=false;
}

function playSfx(name,options={}){if(muted)return null;return gameAudio.play(name,{volume:AUDIO_TUNING.volumes.ui,...options})}

function notify(text){$('toast').textContent=text;toastTime=2.3}
function rankList(){return[{name:'YOU',score:matchPoints,kills:matchKills,assists:matchAssists,deaths:deathCount,player:true},...bots.map(b=>({name:b.name,score:b.score,kills:b.frags||0,assists:b.assists||0,deaths:b.deaths,player:false}))].sort((a,b)=>b.score-a.score||a.deaths-b.deaths||Number(b.player)-Number(a.player))}
function rank(){return rankList().findIndex(b=>b.player)+1}
function updateHUD(){const ranks=rankList(),r=rank();$('round').textContent=String(round).padStart(2,'0');$('timer').textContent=`${Math.floor(Math.ceil(time)/60)}:${String(Math.ceil(time)%60).padStart(2,'0')}`;$('rank').textContent=`${r}${['ST','ND','RD'][r-1]||'TH'} / 6`;$('health').textContent=Math.ceil(health);$('healthbar').style.width=`${health/(perks.armor?140:100)*100}%`;$('focusbar').style.width=`${focus}%`;$('focuslabel').textContent=slow?'ACTIVE':focus<10?'CHARGING':'READY';$('ammo').textContent=reloading>0?'—':ammo;$('loadout').textContent=owned.map(i=>`${i+1} ${weapons[i].label}`).join(' · ');$('weaponname').textContent=`${weapons[equipped].name} / ${weapons[equipped].label.toUpperCase()}`;$('utility').textContent=`R RELOAD · G GRENADE ×${grenades} · F ${streakReady?EQUIPMENT.streak.find(x=>x.id===equipment.streak).name.toUpperCase()+' READY':`${streak}/3 STREAK`}`;$('leaderboard').innerHTML='<div class="score-heading">POINTS</div>'+ranks.map((b,i)=>`<div class="score-row ${b.player?'you':''} ${i===2?'cutoff':''}"><span>${i+1} &nbsp;${b.name}</span><b>${b.score}</b></div>`).join('')}
function spawnBot(b){
 const candidates=spawnPoints.map(s=>{const p=new THREE.Vector3(s[0],s[1],s[2]);let safety=Infinity;for(const other of bots)if(other!==b&&!other.dead)safety=Math.min(safety,p.distanceTo(other.pos));if(respawnTime<=0)safety=Math.min(safety,p.distanceTo(playerPos));return{s,safety:safety+Math.random()*2}}).sort((a,b)=>b.safety-a.safety);
 const s=candidates[0].s;b.lifeId=(b.lifeId||0)+1;b.pos.set(s[0],s[1],s[2]);b.hp=100;b.maxHealth=100;clearDamageCredit(b);b.dead=0;b.hitReact=null;b.impactVector=null;b.deathAge=0;b.group.rotation.set(0,0,0);for(const p of Object.values(b.parts))p.rotation.set(0,0,0);b.group.visible=true;b.group.position.copy(b.pos);for(const p of Object.values(b.parts))p.visible=true;b.vy=0;
 opponentAI?.reset(b,botNames.indexOf(b.name));tintDummy(b);
}

let calibrationMaterial;
function calibration(){
 if(calibrationMaterial)return calibrationMaterial;
 const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.fillStyle='#d9ef45';c.fillRect(0,0,128,128);c.translate(64,64);
 for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,0);c.arc(0,0,55,i*Math.PI/2,(i+1)*Math.PI/2);c.closePath();c.fillStyle=i%2?'#d9ef45':'#152127';c.fill()}
 c.strokeStyle='#152127';c.lineWidth=7;c.beginPath();c.arc(0,0,57,0,Math.PI*2);c.stroke();const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
 calibrationMaterial=new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide});return calibrationMaterial;
}
const targetGeo=new THREE.CircleGeometry(1,24);
function dummyTarget(parent,x,y,z,size,ry=0){const m=new THREE.Mesh(targetGeo,calibration());m.position.set(x,y,z);m.scale.setScalar(size);m.rotation.y=ry;parent.add(m)}
function createDummy(weapon='rifle'){
 const g=new THREE.Group(),parts={},legs=[];
 const bodyPart=(name,x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);p.userData.part=name;g.add(p);parts[name]=p;return p};
 const shell=(parent,geometry,x,y,z,sx,sy,sz,c=0xd9ef45)=>{const m=new THREE.Mesh(geometry,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;m.userData.healthShell=c===0xd9ef45;parent.add(m);return m};
 const torso=bodyPart('torso',0,1.12,0);shell(torso,botTorsoGeo,0,0,0,.48,.67,.3);dummyTarget(torso,0,.12,.268,.15);cube(0,-.18,.26,.26,.035,.035,0x182127,torso);cube(0,-.25,.26,.16,.025,.035,0x182127,torso);
 const pelvis=bodyPart('pelvis',0,.7,0);shell(pelvis,botTorsoGeo,0,0,0,.36,.26,.26);cube(0,.15,0,.42,.13,.3,0x182127,pelvis);
 const head=bodyPart('head',0,1.71,0);shell(head,dummyHeadGeo,0,.03,0,.255,.32,.245);shell(head,botLimbGeo,0,-.29,0,.12,.14,.12,0x182127);
 // A blank molded face, a nose, and the unmistakable quartered temple targets.
 shell(head,shardGeo,0,.02,.255,.065,.085,.06);cube(0,-.11,.23,.12,.018,.022,0x182127,head);dummyTarget(head,-.239,.04,0,.12,-Math.PI/2);dummyTarget(head,.239,.04,0,.12,Math.PI/2);
 for(const side of [-1,1]){
  const leg=bodyPart(side<0?'leftLeg':'rightLeg',side*.205,.64,0);legs.push(leg);
  shell(leg,botLimbGeo,0,-.1,0,.175,.31,.18);shell(leg,sphereGeo,0,-.29,0,.12,.12,.12,0x182127);shell(leg,botLimbGeo,0,-.45,.015,.135,.25,.14);cube(0,-.6,.08,.22,.12,.34,0x182127,leg);dummyTarget(leg,0,-.08,.16,.07);
  const arm=bodyPart(side<0?'leftArm':'rightArm',side*.46,1.34,0);shell(arm,sphereGeo,0,0,0,.13,.13,.13,0x182127);shell(arm,botLimbGeo,side*.025,-.18,0,.13,.28,.13);shell(arm,sphereGeo,side*.025,-.34,0,.105,.105,.105,0x182127);const forearm=shell(arm,botLimbGeo,side*.015,-.35,.17,.11,.29,.11);forearm.rotation.x=-Math.PI/2;shell(arm,dummyHeadGeo,side*.015,-.35,.36,.1,.1,.13);
 }
 buildDummyGun(parts.rightArm,weapon);
 for(const [name,p]of Object.entries(parts))p.traverse(o=>o.userData.part=name);
 return {group:g,parts,legs};
}
const healthColors=Array.from({length:21},(_,i)=>new THREE.Color().setHSL((i/20)*.32,.78,.48).getHex());
function tintDummy(b){
 const color=b.dead?0x858c88:healthColors[Math.round(clamp(b.hp/(b.maxHealth||100),0,1)*20)];
 b.group.traverse(o=>{if(o.userData.healthShell)o.material=mat(color);if(o.geometry===targetGeo){if(b.dead){o.userData.liveMaterial??=o.material;o.material=mat(0x858c88)}else if(o.userData.liveMaterial)o.material=o.userData.liveMaterial}});
}
function healPlayer(value){if(value>health){health=value;playerCredit.maxHealth=Math.max(playerCredit.maxHealth,value);clearDamageCredit(playerCredit)}}
function healBot(b,value){if(value>b.hp){b.hp=value;b.maxHealth=Math.max(b.maxHealth||100,value);clearDamageCredit(b);tintDummy(b)}}
function awardAssists(target,killer){for(const a of takeAssists(target,killer)){if(a.id==='player'){matchPoints+=a.points;matchAssists++;if(assistNotice.left<=0)assistNotice={points:0,count:0,left:0};assistNotice.points+=a.points;assistNotice.count++;assistNotice.left=1.5}else{const bot=bots.find(b=>b.name===a.id);if(bot){bot.score+=a.points;bot.assists=(bot.assists||0)+1}}}}
function buildDummyGun(arm,weapon){
 const old=arm.children.find(c=>c.name==='weapon');if(old)arm.remove(old);const gun=new THREE.Group();gun.name='weapon';arm.add(gun);
 if(weapon==='pistol'){cube(0,-.28,.45,.15,.16,.34,0xe1e5dc,gun);cube(0,-.38,.35,.1,.17,.12,0x182127,gun)}
 else if(weapon==='rocket'){const tube=new THREE.Mesh(barrelGeo,mat(0x182127));tube.position.set(0,-.26,.48);tube.rotation.x=Math.PI/2;tube.scale.set(.17,.68,.17);tube.castShadow=true;gun.add(tube);cube(.18,-.2,.5,.05,.08,.35,0xd9ef45,gun)}
 else if(weapon==='rail'){cube(0,-.29,.47,.16,.16,.5,0x182127,gun);for(const side of [-1,1])cube(side*.065,-.28,.92,.045,.08,.65,0xeef0e6,gun);cube(0,-.16,.5,.11,.1,.24,0x182127,gun)}
 else if(weapon==='shotgun'){cube(0,-.29,.47,.18,.17,.65,0x182127,gun);cube(0,-.32,.86,.13,.15,.4,0x182127,gun);cube(0,-.34,.64,.2,.12,.22,0xd9ef45,gun)}
 else{cube(0,-.29,.43,.15,.17,weapon==='smg'?.4:.64,0x182127,gun);cube(0,-.2,.43,.045,.04,.22,0xeef0e6,gun);if(weapon==='smg')cube(0,-.44,.45,.1,.22,.13,0xeef0e6,gun)}
 return gun;
}
function makeBots(){
 bots.forEach(b=>scene.remove(b.group));bots=[];opponentAI=createOpponentAI();
 botNames.forEach((name,i)=>{const d=createDummy(opponentAI.tuning.profiles[i].weapon);scene.add(d.group);const b={name,loadout:randomWeaponPair(()=>Math.random()),pos:new THREE.Vector3(),...d,hp:100,score:0,frags:0,headshots:0,deaths:0,dead:0,cool:1,side:i%2?1:-1,phase:Math.random()*7,stuck:0};d.group.traverse(o=>o.userData.bot=b);bots.push(b);spawnBot(b)});
}
function botHitMeshes(){const meshes=[];for(const b of bots)for(const p of Object.values(b.parts)){if(!p.visible)continue;p.traverse(m=>{if(m.isMesh&&m.visible)meshes.push(m)})}return meshes}
function shatterPart(b,name,point){if(!b.dead)return;const part=b.parts[name]||b.parts.torso;if(!part.visible)return;part.getWorldPosition(tmp);const center=point?point.clone().lerp(tmp,.5):tmp.clone();part.visible=false;for(let i=0;i<15;i++){const m=new THREE.Mesh(shardGeo,mat(i%4===0?0x182127:0x858c88));m.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.25,(Math.random()-.5)*.4,(Math.random()-.5)*.25));m.scale.set(.06+Math.random()*.08,.06+Math.random()*.13,.04+Math.random()*.07);scene.add(m);addEffect({mesh:m,life:.65+Math.random()*.5,max:1.2,vel:new THREE.Vector3((Math.random()-.5)*9,2+Math.random()*6,(Math.random()-.5)*9).addScaledVector(b.impactVector||new THREE.Vector3(),5),spin:new THREE.Vector3(Math.random()*12,Math.random()*10,Math.random()*9)})}playSfx('shatter',{pos:b.pos,volume:.35,curve:'foley',bus:'world',priority:1})}

function blocked(x,z,feet,r=.4){if(Math.abs(x)>MAP.bounds.x-.5||Math.abs(z)>MAP.bounds.z-.5)return true;return blockedAt(blocks,x,z,feet,r)}
function buildNav(){navigation=buildNavigation(blocks,pickups.filter(p=>p.kind==='pad'),MAP.anchors,{bounds:MAP.bounds,maxHeight:MAP.maxHeight});navNodes=navigation.nodes}
function nearestNode(pos){return nearestAINode(navigation,pos)}
function findPath(from,to){return findRoute(navigation,from,to)}

function move(pos,dx,dz,feet,r=.4){if(!blocked(pos.x+dx,pos.z,feet,r))pos.x+=dx;if(!blocked(pos.x,pos.z+dz,feet,r))pos.z+=dz}
function floorAt(x,z,feet){return surfaceAt(blocks,x,z,feet)}
function visible(a,b){tmp2.copy(b).sub(a);const distance=tmp2.length();ray.set(a,tmp2.normalize());ray.far=distance;return ray.intersectObjects(worldMeshes,false).length===0}
function startMatch(next=false){$('panel').className='panel';if(!muted){gameAudio.unlock();gameAudio.applySettings(settings);gameAudio.warm()}gameAudio.stopWorld();previewDummy.visible=false;for(const r of rockets)scene.remove(r.mesh);rockets=[];for(const e of effects)retireEffect(e);effects=[];feedback.reset();weaponMotion.reset();aimSpring.reset();for(const p of pickups){p.timer=0;p.mesh.visible=true}feeds.length=0;$('killfeed').innerHTML='';if(!next){round=1;credits=0;owned=randomWeaponPair(()=>Math.random()).map(w=>ALL_WEAPONS.indexOf(w));equipped=owned[0];startingWeapon=equipped;builds=normalizeBuilds();equipment=normalizeEquipment();shopOffers=null;perks={};best=Number(localStorage.getItem('dh-best')||0)}else if(owned.includes(startingWeapon))equipped=startingWeapon;buildWeapon();time=90;matchPoints=headshotKills=matchAssists=0;assistNotice={points:0,count:0,left:0};matchKills=deathCount=streak=0;streakReady=false;grenades=perks.frags?4:2;focus=100;makeBots();spawnPlayer();mode='play';$('menu').hidden=true;$('panel').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');weaponGroup.visible=true;lock();notify(`ROUND ${String(round).padStart(2,'0')} · FINISH TOP 3`);saveRun()}
function lock(){
 lastPointer=null;
 try{if(!renderer.domElement.requestPointerLock){enableDragLook();return}const request=renderer.domElement.requestPointerLock();request?.catch?.(()=>enableDragLook())}catch{enableDragLook()}
}
function enableDragLook(){
 if(mode!=='play')return;dragLook=true;locked=true;lastPointer=null;$('panel').hidden=true;renderer.domElement.style&&(renderer.domElement.style.cursor='none');notify('MOUSE AIM · ARROWS TURN');$('hud').querySelector('.hudhint').textContent='WASD MOVE · MOUSE AIM · ARROWS TURN · CLICK FIRE · Q SLOW MOTION · ESC PAUSE';
}

function spawnPlayer(){weaponMotion.reset();aimSpring.reset();jumpBuffered=coyoteTime=0;lastJumpHeld=false;viewHeight=playerPos.y;stepDistance=0;playerPadFlight=null;magazines=Object.fromEntries(owned.map(i=>[i,playerWeapon(i).mag]));playerSpawnAt=opponentAI?.clock||0;let s=spawnPoints[4];for(const test of [...spawnPoints].sort(()=>Math.random()-.5)){if(bots.every(b=>b.pos.distanceTo(new THREE.Vector3(test[0],0,test[2]))>8)){s=test;break}}playerPos.set(s[0],s[1]+1.7,s[2]);health=perks.armor?140:100;playerCredit.maxHealth=health;clearDamageCredit(playerCredit);vy=0;vel.set(0,0,0);yaw=Math.atan2(playerPos.x,playerPos.z);pitch=0;ammo=playerWeapon().mag;reloading=0;shotTimer=.2;respawnTime=0;viewHeight=playerPos.y;syncAimCamera()}
function shoot(){
 const w=playerWeapon(),handling=playerHandling();
 if(shotTimer>1e-7||reloading>0||respawnTime>0)return false;if(ammo<=0){reload();return false}
 syncAimCamera();scene.updateMatrixWorld(true);camera.getWorldDirection(aim);const origin=camera.position.clone();
 opponentAI?.hear(playerPos,'player');ammo--;magazines[equipped]=ammo;shotsFired++;
 shotTimer=Math.max(-.1,shotTimer)+w.interval;weaponMotion.fire(handling);aimSpring.impulse(handling.aim*28);muzzleTime=equipped===2?.025:.045;flash.visible=true;flash.rotation.z=Math.random()*6;
 if(!muted)gameAudio.weapon(ALL_WEAPONS[equipped]);if(ammo<=Math.max(1,Math.floor(w.mag*.15)))playSfx('low-ammo',{volume:.16});
 if(equipped!==4)ejectCasing(origin);
 if(equipped===4){launchRocket(origin,aim.clone(),null,false,w.damage/weapons[equipped].damage,{radius:w.radius,projectile:w.projectile,selfDamage:w.selfDamage,jump:w.jump});return true}
 const targets=[...worldMeshes,...botHitMeshes()],hits=new Map(),outcomes=[];let beamEnd=origin.clone().addScaledVector(aim,80);
 for(let p=0;p<w.pellets;p++){
  const spread=(equipped===5&&p<4?.016*w.core:w.spread)*(keys.has('MouseRight')?.72:1);
  const direction=aim.clone().add(new THREE.Vector3((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread)).normalize();ray.set(origin,direction);ray.far=90;
  const seen=new Set(),intersections=ray.intersectObjects(targets,false);let endpoint=origin.clone().addScaledVector(direction,70);
  for(const hit of intersections){
   endpoint=hit.point;const b=hit.object.userData.bot;
   if(!b){if(p===0||equipped===5&&p===6)impactEffect(hit,equipped===3?1.5:1);break}
   if(seen.has(b))continue;seen.add(b);const part=hit.object.userData.part||'torso',head=part==='head',damage=w.damage*(head?1.5:1);
   const packet=hits.get(b)||{damage:0,headDamage:0,part,point:hit.point.clone(),headPoint:null};packet.damage+=damage;if(head){packet.headDamage+=damage;packet.headPoint=hit.point.clone()}packet.part=part;hits.set(b,packet);
   if(equipped!==3)break;
  }
  if(p===0)beamEnd=endpoint;if(equipped===5&&p%4===0)trail(origin,endpoint,w.color,.055);
 }
 trail(origin,beamEnd,w.color,equipped===3?.27:.045,equipped===3?.035:.012);
 for(const [b,hit]of hits){
  const headKill=hit.headDamage>0&&hit.damage-hit.headDamage<b.hp;
  outcomes.push(damageBot(b,hit.damage,null,headKill?'head':hit.part,headKill?hit.headPoint:hit.point,{head:hit.headDamage>0,headKill,defer:true,origin,force:equipped===1?1.6:equipped===5?1.9:equipped===3?1.5:1}));
 }
 confirmOutcomes(outcomes);return true;
}

function reload(){if(reloading>0||ammo===playerWeapon().mag)return;reloading=playerWeapon().reload*(perks.reload?.65:1);reloadLength=reloading;reloadStage=0;playSfx('reload-out',{volume:.45})}
function switchWeapon(i){if(!owned.includes(i)||equipped===i)return;magazines[equipped]=ammo;equipped=i;ammo=magazines[i]??playerWeapon(i).mag;reloading=0;shotTimer=.22*playerWeapon(i).switch*(perks.quickdraw?.65:1);weaponMotion.switch();aimSpring.reset();buildWeapon();weaponGroup.visible=true;playSfx('equip',{volume:.4});notify(`${weapons[i].name} · ${weapons[i].label.toUpperCase()}`)}
function confirmOutcomes(outcomes){
 const event=combineOutcomes(outcomes);if(!feedback.resolve(event))return;
 if(event.kills>1)feedback.label=event.kills+' KILLS';
 const kind=event.killed?(event.head?'headkill':'kill'):(event.head?'head':'hit');
 if(!muted)gameAudio.confirmation(kind);
 if(event.killed&&streak>1&&streak%2===0)playSfx('stinger',{volume:.22});
}
function damageBot(b,dmg,killer,part='torso',point=null,options={}){
 if(b.dead||b.hp<=0){shatterPart(b,part,point);return{damage:0,killed:false,head:false,points:0}}
 const head=options.headKill??(options.head??part==='head'),result=resolveDamage(b,dmg,{head});
 if(!result.damage)return result;
 if(killer!==b)recordDamage(b,killer?killer.name:'player',result.damage);
 const origin=options.origin||(killer?killer.pos:playerPos);b.impactVector=b.pos.clone().sub(origin);b.impactVector.y=.15;b.impactVector.normalize().multiplyScalar(options.force||1);
 b.hitReact={part,strength:Math.min(.24,result.damage*.003),left:.17,direction:b.impactVector.clone()};
 if(!result.killed)opponentAI?.damaged(b,killer?{id:killer.name,pos:killer.pos}:{id:'player',pos:playerPos});
 burst(point||b.pos.clone().add(new THREE.Vector3(0,1.3,0)),0xeef0e6,part==='head'?4:2);
 if(result.killed){
  b.dead=3;b.deathAge=0;b.deaths++;awardAssists(b,killer?killer.name:'player');tintDummy(b);shatterPart(b,part,point);
  if(killer){killer.score=Math.max(0,killer.score+(killer===b?-100:result.points));if(killer!==b){killer.frags=(killer.frags||0)+1;if(head)killer.headshots=(killer.headshots||0)+1}feed(killer.name,b.name)}
  else{matchKills++;matchPoints+=result.points;if(head)headshotKills++;streak++;focus=Math.min(100,focus+18);credits+=25;if(perks.recovery&&respawnTime<=0)healPlayer(Math.max(health,Math.min(perks.armor?140:100,health+20)));
   if(streak>=3&&!streakReady){streakReady=true;notify(EQUIPMENT.streak.find(x=>x.id===equipment.streak).name.toUpperCase()+' READY · F')}
   feed('YOU',b.name);
  }
  burst(b.pos.clone().add(new THREE.Vector3(0,1,0)),0x858c88,8);
 }
 tintDummy(b);
 const feedbackResult={...result,head:result.killed?head:!!(options.head??part==='head')};
 if(!killer&&!options.defer)confirmOutcomes([feedbackResult]);return feedbackResult;
}
function damagePlayer(dmg,killer,options={}){
 if(respawnTime>0||health<=0||!Number.isFinite(dmg)||dmg<=0)return;const before=health;health=Math.max(0,health-dmg);if(killer)recordDamage(playerCredit,killer.name,before-health);
 if(hurtSoundCooldown<=0){playSfx('damage',{volume:.25});hurtSoundCooldown=.15}damageTime=.3;
 if(killer){damageBearing=Math.atan2(killer.pos.x-playerPos.x,killer.pos.z-playerPos.z);weaponMotion.trauma=Math.min(.45,weaponMotion.trauma+.12)}
 if(health<=0&&before>0){awardAssists(playerCredit,killer?.name);deathCount++;streak=0;respawnTime=2.2;mouseDown=false;
  if(killer){killer.score+=options.head?150:100;killer.frags=(killer.frags||0)+1;if(options.head)killer.headshots=(killer.headshots||0)+1;feed(killer.name,'YOU')}else feed('THE ARENA','YOU');
  notify('RESPAWNING');playSfx('damage',{volume:.45});
 }
}

const feeds=[];function feed(a,b){feeds.unshift(`${a} &nbsp;›&nbsp; ${b}`);feeds.length=Math.min(4,feeds.length);$('killfeed').innerHTML=feeds.join('<br>')}
function trail(a,b,c,life=.1,width=.015){const d=b.clone().sub(a),m=new THREE.Mesh(boxGeo,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:1}));m.position.copy(a).addScaledVector(d,.5);m.scale.set(width,width,d.length());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());scene.add(m);addEffect({mesh:m,life,max:life,vel:null,ownMat:true})}
function burst(pos,c,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(sphereGeo,mat(c));m.position.copy(pos);m.scale.setScalar(.05+Math.random()*.08);scene.add(m);addEffect({mesh:m,life:.25+Math.random()*.3,max:.55,vel:new THREE.Vector3((Math.random()-.5)*6,Math.random()*5,(Math.random()-.5)*6)})}}
function launchRocket(pos,dir,owner,grenade=false,damageScale=1,mods={}){const m=new THREE.Mesh(sphereGeo,mat(grenade?0x202a30:0xd9ef45));m.scale.setScalar(grenade?.16:.13);m.position.copy(pos).addScaledVector(dir,.8);scene.add(m);rockets.push({mesh:m,vel:dir.clone().multiplyScalar(grenade?(equipment.throwable==='quick'&&!owner?12:15):24*(mods.projectile||1)).add(new THREE.Vector3(0,grenade?5:0,0)),life:grenade?(equipment.throwable==='quick'&&!owner?.85:1.6):4,owner,grenade,damageScale,mods,impact:grenade&&!owner&&equipment.throwable==='impact',trail:0})}
function explode(pos,owner,grenade=false,damageScale=1,mods={}){burst(pos,0xd9ef45,25);playSfx('explosion',{pos,volume:.85,curve:'explosion',bus:'explosions',priority:3});const radius=(grenade?7:5.5)*(mods.radius||1),outcomes=[];weaponMotion.blast(playerPos.distanceTo(pos));for(const b of bots){const d=b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos);if(d<radius&&visible(pos,b.pos.clone().add(new THREE.Vector3(0,1,0)))){if(!b.dead)outcomes.push(damageBot(b,((grenade?150:135)*(1-d/radius)+15)*damageScale,owner,'torso',null,{defer:true,origin:pos,force:1.5}));if(b.dead)for(const name of Object.keys(b.parts))if(d<radius*.65)shatterPart(b,name)}}if(!owner)confirmOutcomes(outcomes);for(let i=0;i<5;i++){const smoke=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:i%2?0x182127:0x7b8984,transparent:true,opacity:.25,depthWrite:false}));smoke.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.5,Math.random(),(Math.random()-.5)*1.5));smoke.scale.setScalar(.3+Math.random()*.4);scene.add(smoke);addEffect({mesh:smoke,life:.55,max:.55,expand:true,smoke:true,ownMat:true,opacity:.25,vel:new THREE.Vector3(0,.6,0)})}const d=playerPos.distanceTo(pos);if(d<radius&&visible(pos,playerPos)){damagePlayer((grenade?90:60)*(1-d/radius)*damageScale*(mods.selfDamage||1),owner);if(!grenade&&health>0){tmp.copy(playerPos).sub(pos).normalize();vel.addScaledVector(tmp,15*(1-d/radius)*(mods.jump||1));vy=Math.max(vy,(10*(1-d/radius)+3)*(mods.jump||1))}}const m=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:0xd9ef45,wireframe:true,transparent:true,opacity:.7}));m.position.copy(pos);m.scale.setScalar(1);scene.add(m);addEffect({mesh:m,life:.35,max:.35,expand:true,ownMat:true})}
function retireEffect(e){scene.remove(e.mesh);if(e.ownMat)e.mesh.material.dispose()}
function addEffect(e){
 if(e.decal){const decals=effects.filter(f=>f.decal);if(decals.length>=FEEL.maxDecals){const old=decals[0];retireEffect(old);effects.splice(effects.indexOf(old),1)}}
 if(effects.length>=FEEL.maxEffects)retireEffect(effects.shift());effects.push(e);
}
function impactEffect(hit,scale=1){
 if(!hit.face)return;const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld),m=new THREE.Mesh(targetGeo,new THREE.MeshBasicMaterial({color:0x182127,transparent:true,opacity:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 m.position.copy(hit.point).addScaledVector(normal,.012);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);m.scale.setScalar(.035*scale+Math.random()*.025);scene.add(m);addEffect({mesh:m,life:7,max:7,decal:true,ownMat:true,opacity:.6});burst(hit.point,0xb5c3bb,2);playSfx('impact',{pos:hit.point,volume:.1,curve:'foley',bus:'world',priority:.4});
}
function ejectCasing(){if(equipped===4||equipped===3)return;const m=new THREE.Mesh(boxGeo,mat(0xd9ef45));m.scale.set(.025,.025,equipped===5?.095:.055);m.position.set(.38,-.2,-.65).applyMatrix4(camera.matrixWorld);scene.add(m);const v=new THREE.Vector3(2+Math.random(),1.5,-.5).applyQuaternion(camera.quaternion);addEffect({mesh:m,life:1.1,max:1.1,vel:v,spin:new THREE.Vector3(13,7,11),casing:true})}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){retireEffect(e);effects.splice(i,1);continue}if(e.vel){e.vel.y-=(e.smoke?-1:14)*dt;e.mesh.position.addScaledVector(e.vel,dt);if(e.casing){const floor=floorAt(e.mesh.position.x,e.mesh.position.z,e.mesh.position.y);if(e.mesh.position.y<floor+.035){e.mesh.position.y=floor+.035;e.vel.y=Math.abs(e.vel.y)*.25;e.vel.x*=.65;e.vel.z*=.65}}}if(e.spin){e.mesh.rotation.x+=e.spin.x*dt;e.mesh.rotation.y+=e.spin.y*dt;e.mesh.rotation.z+=e.spin.z*dt}if(e.expand)e.mesh.scale.addScalar((e.smoke?2:16)*dt);if(e.ownMat)e.mesh.material.opacity=(e.opacity??1)*Math.min(1,e.life/(e.decal?1:e.max))}}
function syncAimCamera(){camera.position.copy(playerPos);camera.position.y=viewHeight+(grounded?Math.sin(moveClock*1.7)*.025*settings.motion:0);camera.rotation.set(pitch+aimSpring.x,yaw,0);camera.updateMatrixWorld(true)}
function present(dt){
 const w=playerWeapon(),h=playerHandling(),aiming=keys.has('MouseRight')&&reloading<=0,sprinting=keys.has('ShiftLeft')&&Math.hypot(vel.x,vel.z)>2&&!aiming&&!mouseDown;
 weaponMotion.step(dt,h,{aiming,sprinting,turnX,turnY,adsSpeed:1/(w.ads*(perks.quickdraw?.8:1))});turnX*=Math.exp(-dt*20);turnY*=Math.exp(-dt*20);aimSpring.step(dt,180,25);
 viewHeight=grounded?THREE.MathUtils.damp(viewHeight,playerPos.y,22,dt):playerPos.y;syncAimCamera();
 const ads=weaponMotion.ads,k=weaponMotion.kick.x,land=weaponMotion.land.x,m=settings.motion,phase=moveClock*1.7;
 const reloadP=reloading>0?1-reloading/reloadLength:0,reloadPose=Math.sin(reloadP*Math.PI),pump=equipped===5?Math.sin(clamp((weaponMotion.shotAge-.12)/.25,0,1)*Math.PI):0;
 ray.set(camera.position,camera.getWorldDirection(aim));ray.far=1.4;nearWall=THREE.MathUtils.damp(nearWall,ray.intersectObjects(worldMeshes,false)[0]?1:0,12,dt);
 weaponGroup.position.set(.31*(1-ads)+Math.sin(phase*.5)*.012*m*(1-ads)-weaponMotion.swayX*m,-.3+(w.optic?(.3-weaponGroup.userData.opticY*.85):h.adsY)*ads+Math.abs(Math.cos(phase))*.012*m-land*.18-k*h.lift-reloadPose*.16-weaponMotion.equip*.5,-.5+k*h.back+nearWall*.28);
 weaponGroup.rotation.set(k*h.rx-reloadPose*.55+weaponMotion.sprint*.16+nearWall*.55+land*.12, k*h.ry+weaponMotion.swayX*m, k*h.roll+reloadPose*h.reloadRoll+weaponMotion.sprint*.12);
 weaponGroup.rotation.z+=Math.sin(elapsed*49)*weaponMotion.trauma*.012*m;
 const moving=weaponGroup.userData.moving;if(moving)for(const part of moving){part.mesh.position.copy(part.base);part.mesh.position.y-=reloadPose*part.mag*.25;part.mesh.position.z+=pump*part.pump*.16+Math.max(0,1-weaponMotion.shotAge/.07)*part.slide*.06}
 camera.fov=THREE.MathUtils.damp(camera.fov,85+((w.optic||equipped===3?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(65)/2)/w.zoom)):h.adsFov)-85)*ads+(slow?6:0)+weaponMotion.sprint*3,12,dt);camera.updateProjectionMatrix();camera.getWorldDirection(aim);gameAudio.updateListener(camera.position,aim);gameAudio.setSlow(slow);
 weaponGroup.visible=respawnTime<=0;muzzleTime=Math.max(0,muzzleTime-dt);flash.visible=muzzleTime>0&&!reloading;flash.rotation.z=Math.random()*6;flash.scale.setScalar(.12+Math.random()*.12);
 feedback.step(dt);damageTime=Math.max(0,damageTime-dt);toastTime=Math.max(0,toastTime-dt);
 $('hitmarker').className=feedback.kind;$('hitmarker').style.opacity=feedback.left>0?1:0;$('hitmarker').style.transform=`translate(-50%,-50%) scale(${1+(feedback.kind.includes('kill')?.6:0)+Math.max(0,feedback.left/Math.max(.01,feedback.duration))*.14})`;
 $('scorepop').textContent=feedback.points?`+${feedback.points} ${feedback.label}`:'';$('scorepop').style.opacity=Math.min(1,feedback.scoreLeft*5);
 assistNotice.left=Math.max(0,assistNotice.left-dt);$('assistpop').textContent=assistNotice.count?`+${assistNotice.points} ${assistNotice.count>1?assistNotice.count+' ASSISTS':'ASSIST'}`:'';$('assistpop').style.opacity=Math.min(1,assistNotice.left*4);
 $('damage').style.opacity=damageTime*2;$('damageDirection').style.opacity=damageTime>0?1:0;$('damageDirection').style.transform=`translate(-50%,-50%) rotate(${yaw-damageBearing+Math.PI}rad)`;$('toast').style.opacity=toastTime>0?1:0;
 lastHUD+=dt;if(lastHUD>.1){lastHUD=0;updateHUD()}
}
function createOpponentAI(){
 return new ArenaAI({navigation,round,random:()=>Math.random(),world:{
  pickups,
  projectiles:()=>rockets.map(r=>({pos:r.mesh.position,velocity:r.vel,owner:r.owner,grenade:r.grenade})),
  actors:()=>[
   {id:'player',pos:{x:playerPos.x,y:playerPos.y-1.7,z:playerPos.z},eye:playerPos,hp:health,alive:respawnTime<=0,spawnAge:(opponentAI?.clock||0)-playerSpawnAt},
   ...bots.map(b=>({id:b.name,pos:b.pos,eye:{x:b.pos.x,y:b.pos.y+1.65,z:b.pos.z},hp:b.hp,alive:!b.dead,spawnAge:(opponentAI?.clock||0)-(b.brain?.spawnAt||0)}))
  ],
  canSee:(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z)),
  move:(b,dx,dz)=>move(b.pos,dx,dz,b.pos.y),
  physics:(b,brain,dt)=>{
   const feet=b.pos.y,fallSpeed=b.vy;b.vy-=23*dt;b.pos.y+=b.vy*dt;const ceiling=ceilingAt(blocks,b.pos.x,b.pos.z,feet,b.pos.y,1.9);if(ceiling!==null){b.pos.y=ceiling;b.vy=0}const floor=floorAt(b.pos.x,b.pos.z,Math.max(feet,b.pos.y));
   if(b.pos.y<=floor&&b.vy<=0){if(fallSpeed< -4&&!muted)gameAudio.footstep(new THREE.Vector3(b.pos.x,floor+.15,b.pos.z),{metal:floor>2,landing:true});if(brain.lastFloor>=2.9&&floor<1)opponentAI.stats.drops++;brain.lastFloor=floor;b.pos.y=floor;b.vy=0;if(brain.flight){brain.flight=null;brain.pathIn=0}}
   if(brain.flight){brain.flight.age+=dt;if(brain.flight.age>3){brain.flight=null;brain.pathIn=0}}
   if(!brain.flight)for(const link of navigation.pads)if(Math.abs(b.pos.y-link.y)<.3&&Math.abs(b.vy)<.1&&Math.hypot(b.pos.x-link.x,b.pos.z-link.z)<1.25){const t=launchTime(link.power,link.to.y-b.pos.y);brain.flight={vx:(link.to.x-b.pos.x)/t,vz:(link.to.z-b.pos.z)/t,age:0};b.vy=link.power;opponentAI.stats.pads++;break}
  },
  fire:fireBotWeapon,
  equip:(b,weapon)=>{const gun=buildDummyGun(b.parts.rightArm,weapon);gun.traverse(m=>{m.userData.bot=b;m.userData.part='rightArm'})},
  telegraph:(b,point,dt)=>{if(b.brain.charge<=dt*1.5)playSfx('charge',{pos:b.pos.clone().add(new THREE.Vector3(0,1.3,0)),volume:.4,curve:'weapon',bus:'world',priority:3});b.laserIn=(b.laserIn||0)-dt;if(b.laserIn<=0){const origin=b.pos.clone().add(new THREE.Vector3(0,1.3,0)),end=new THREE.Vector3(point.x,point.y,point.z);const dir=end.clone().sub(origin).normalize();ray.set(origin,dir);ray.far=origin.distanceTo(end);const hit=ray.intersectObjects(worldMeshes,false)[0];trail(origin,hit?.point||end,0xd9ef45,.12,.012);b.laserIn=.1}},
  collect:(b,brain)=>{for(const p of pickups){if(p.kind==='pad'||p.kind==='focus'||p.timer>0||b.pos.clone().add(new THREE.Vector3(0,1.15,0)).distanceTo(p.mesh.position)>1.25)continue;if(p.kind==='health'&&b.hp>=100||p.kind==='armor'&&b.hp>=140)continue;healBot(b,Math.max(b.hp,Math.min(p.kind==='health'?100:140,b.hp+(p.kind==='health'?50:40))));p.timer=opponentAI.tuning.navigation.pickupRespawn;p.mesh.visible=false;brain.thinkIn=0;opponentAI.stats.pickups++}},
  animate:(b,brain,dt)=>{
   b.phase+=dt;b.group.position.copy(b.pos);b.group.rotation.y=brain.facing;b.group.rotation.z=Math.sin(b.phase*9)*.025;
   const distance=Math.hypot(b.pos.x-brain.previous.x,b.pos.z-brain.previous.z),moving=distance>.005;
   for(let i=0;i<b.legs.length;i++)b.legs[i].rotation.x=moving&&b.vy===0?Math.sin(b.phase*10+i*Math.PI)*.45:0;
   if(b.vy===0){brain.stepDistance=(brain.stepDistance||0)+distance;if(brain.stepDistance>1.85){brain.stepDistance=0;const pos=b.pos.clone().add(new THREE.Vector3(0,.15,0));if(!muted)gameAudio.footstep(pos,{metal:b.pos.y>2});opponentAI.hear(pos,b,10)}}else brain.stepDistance=0;
   if(brain.reload>0&&!brain.wasReloading)playSfx('reload-out',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});
   if(brain.reload<=0&&brain.wasReloading)playSfx('bolt',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});brain.wasReloading=brain.reload>0;
   brain.previous={x:b.pos.x,y:b.pos.y,z:b.pos.z};b.parts.rightArm.rotation.x=brain.reload>0?-.7:brain.charge>0?-.15:0;for(const name of ['head','torso','leftArm'])b.parts[name].rotation.x=0;if(b.hitReact){b.hitReact.left-=dt;const p=b.parts[b.hitReact.part]||b.parts.torso;p.rotation.x=-Math.sin(clamp(b.hitReact.left/.17,0,1)*Math.PI)*b.hitReact.strength;if(b.hitReact.left<=0)b.hitReact=null;}
  }

 }});
}
function fireBotWeapon(b,point,w){
 const origin=b.pos.clone().add(new THREE.Vector3(0,1.28,0)),aimPoint=new THREE.Vector3(point.x,point.y,point.z);
 opponentAI.hear(b.pos,b);!muted&&gameAudio.weapon(w.type,{pos:origin});
 if(w.type==='rocket'){aimPoint.y-=.65;launchRocket(origin,aimPoint.sub(origin).normalize(),b,false,w.splashScale);return}
 scene.updateMatrixWorld(true);const targets=botHitMeshes().filter(m=>m.userData.bot!==b),playerBox=new THREE.Box3(new THREE.Vector3(playerPos.x-.35,playerPos.y-1.55,playerPos.z-.35),new THREE.Vector3(playerPos.x+.35,playerPos.y+.12,playerPos.z+.35));
 const dir=aimPoint.sub(origin).normalize(),hits=new Map();let playerHits=0,playerHead=false;
 for(let i=0;i<(w.pellets||1);i++){
  const shot=dir.clone().add(new THREE.Vector3((Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread)).normalize();ray.set(origin,shot);ray.far=w.range;
  const hit=ray.intersectObjects([...worldMeshes,...targets],false)[0],playerPoint=respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace?ray.ray.intersectBox(playerBox,new THREE.Vector3()):null;
  const pd=playerPoint?origin.distanceTo(playerPoint):Infinity,hitDistance=hit?origin.distanceTo(hit.point):Infinity;let end=origin.clone().addScaledVector(shot,w.range);
  if(pd<=w.range&&pd<hitDistance){playerHits++;playerHead=playerHead||playerPoint.y>playerPos.y-.22;end=playerPoint}else if(hit){end=hit.point;const victim=hit.object.userData.bot;if(victim){const head=hit.object.userData.part==='head',entry=hits.get(victim)||{damage:0,headDamage:0,part:hit.object.userData.part,point:hit.point};const damage=w.damage*(head?1.5:1);entry.damage+=damage;if(head){entry.headDamage+=damage;entry.part='head'}hits.set(victim,entry)}else impactEffect(hit,w.type==='rail'?2:1)}
  if(i===0||w.type==='shotgun'&&i===4)trail(origin,end,0xe9f69a,w.type==='rail'?.23:.07,w.type==='rail'?.035:.012);
 }
 if(playerHits)damagePlayer(w.damage*playerHits*(playerHead?1.5:1),b,{head:playerHead});else if(nearMissCooldown<=0&&respawnTime<=0){const toPlayer=playerPos.clone().sub(origin),along=toPlayer.dot(dir),miss=origin.clone().addScaledVector(dir,along).distanceTo(playerPos);if(along>0&&along<w.range&&miss<1.8&&visible(origin,playerPos)){nearMissCooldown=.3;playSfx('whiz',{pos:playerPos.clone().addScaledVector(dir,-.8),volume:.35,bus:'world',priority:4})}}for(const [victim,hit]of hits)damageBot(victim,hit.damage,b,hit.part,hit.point,{head:hit.headDamage>0,headKill:hit.headDamage>0&&hit.damage-hit.headDamage<victim.hp,origin});
 burst(origin,0xf4ffb2,2);
}
function updateBots(dt){
 for(const b of bots)if(b.dead){b.dead-=dt;b.deathAge+=dt;b.group.rotation.z=THREE.MathUtils.damp(b.group.rotation.z,(b.impactVector?.x||.5)*.65,7,dt);b.group.position.y=b.pos.y-Math.min(.35,b.deathAge*.4);if(b.dead<=0)spawnBot(b)}
 opponentAI?.update(dt);
}

function update(dt){for(let left=Math.min(dt,.15);left>1e-7&&mode==='play';){const h=Math.min(left,FEEL.tick);updateStep(h);left-=h}if(mode==='play')present(dt)}
function updateStep(dt){
 hurtSoundCooldown=Math.max(0,hurtSoundCooldown-dt);
 slow=keys.has('KeyQ')&&focus>0&&respawnTime<=0;const worldDt=dt*(slow?.22:1);focus=clamp(focus+(slow?-29:perks.focus?15:10)*dt,0,100);if(focus<=0)keys.delete('KeyQ');$('slowTint').style.opacity=slow?1:0;
 if(dragLook){yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.7;pitch=clamp(pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.4,-1.5,1.5)}
 time=Math.max(0,time-dt);if(time===0){endMatch();return}shotTimer-=dt*(slow?.8:1);if(!mouseDown)shotTimer=Math.max(0,shotTimer);nearMissCooldown=Math.max(0,nearMissCooldown-dt);if(reloading>0){reloading-=dt;if(reloadStage===0&&reloading<reloadLength*.45){reloadStage=1;playSfx('reload-in',{volume:.45})}if(reloading<=0){reloading=0;ammo=playerWeapon().mag;magazines[equipped]=ammo;playSfx('bolt',{volume:.45})}}
 if(respawnTime>0){respawnTime-=dt;if(respawnTime<=0)spawnPlayer()}else{
 const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),speed=(keys.has('ShiftLeft')?11:7.5)*(perks.speed?1.2:1)*playerWeapon().move*(slow?.85:1);let ix=side*Math.cos(yaw)-forward*Math.sin(yaw),iz=-side*Math.sin(yaw)-forward*Math.cos(yaw);const len=Math.hypot(ix,iz)||1;ix=ix/len*speed;iz=iz/len*speed;if(playerPadFlight){playerPadFlight.age+=dt;vel.x=playerPadFlight.vx+ix*.15;vel.z=playerPadFlight.vz+iz*.15;if(playerPadFlight.age>3)playerPadFlight=null}else{const next=accelerate(vel.x,vel.z,ix,iz,dt,grounded,perks.speed?1.2:1);vel.x=next.x;vel.z=next.z;}const previousX=playerPos.x,previousZ=playerPos.z;move(playerPos,vel.x*dt,vel.z*dt,playerPos.y-1.7);const travelled=Math.hypot(playerPos.x-previousX,playerPos.z-previousZ);
 coyoteTime=grounded?FEEL.coyote:Math.max(0,coyoteTime-dt);jumpBuffered=Math.max(0,jumpBuffered-dt);if(keys.has('Space')&&!lastJumpHeld)jumpBuffered=FEEL.jumpBuffer;lastJumpHeld=keys.has('Space');if(jumpBuffered>0&&coyoteTime>0){vy=FEEL.jumpSpeed;grounded=false;coyoteTime=jumpBuffered=0}const feet=playerPos.y-1.7,fallSpeed=vy;vy-=23*dt;playerPos.y+=vy*dt;const ceiling=ceilingAt(blocks,playerPos.x,playerPos.z,feet,playerPos.y-1.7,1.9);if(ceiling!==null){playerPos.y=ceiling+1.7;vy=0}const floor=floorAt(playerPos.x,playerPos.z,Math.max(feet,playerPos.y-1.7));if(playerPos.y-1.7<=floor&&vy<=0){if(fallSpeed< -4)weaponMotion.landed(fallSpeed);if(fallSpeed< -4&&!muted)gameAudio.footstep(new THREE.Vector3(playerPos.x,floor+.1,playerPos.z),{self:true,metal:floor>2,landing:true});playerPos.y=floor+1.7;vy=0;grounded=true;playerPadFlight=null}else grounded=false;
 if(grounded){stepDistance+=travelled;if(stepDistance>(keys.has('ShiftLeft')?2.45:2.05)){stepDistance=0;if(!muted)gameAudio.footstep(playerPos,{self:true,metal:playerPos.y>3.7});opponentAI?.hear(playerPos,'player',keys.has('ShiftLeft')?14:9)}}else stepDistance=0;
 if(mouseDown&&shotTimer<=0)shoot();moveClock+=travelled;for(const p of pickups){if(p.kind==='pad'){if(Math.hypot(playerPos.x-p.x,playerPos.z-p.z)<1.4&&grounded&&Math.abs(playerPos.y-1.7-p.y)<.3){const t=launchTime(p.power,p.landing.y-(playerPos.y-1.7));playerPadFlight={vx:(p.landing.x-playerPos.x)/t,vz:(p.landing.z-playerPos.z)/t,age:0};vy=p.power;grounded=false;playSfx('pad',{volume:.5});notify('JUMP PAD')}}else if(p.timer<=0&&playerPos.distanceTo(p.mesh.position)<1.6){if(p.kind==='health'&&health>=(perks.armor?140:100)||p.kind==='focus'&&focus>=100||p.kind==='armor'&&health>=180)continue;p.timer=15;p.mesh.visible=false;if(p.kind==='health')healPlayer(Math.max(health,Math.min(perks.armor?140:100,health+50)));if(p.kind==='armor')healPlayer(Math.min(180,health+40));if(p.kind==='focus')focus=100;playSfx('pickup',{volume:.4});notify(p.kind==='health'?'+50 HEALTH':p.kind==='armor'?'+40 OVERHEALTH':'SLOW MOTION RECHARGED')}}
 }
 updateBots(worldDt);
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.life-=worldDt;const old=r.mesh.position.clone();if(r.grenade)r.vel.y-=15*worldDt;r.mesh.position.addScaledVector(r.vel,worldDt);r.trail-=worldDt;if(r.trail<0){trail(old,r.mesh.position,0xd9ef45,.18,.04);r.trail=.04}const pos=r.mesh.position;const contact=blocked(pos.x,pos.z,pos.y-.1,.1)||pos.y<.15||(r.owner&&respawnTime<=0&&playerPos.clone().add(new THREE.Vector3(0,-.45,0)).distanceTo(pos)<.7)||bots.some(b=>b!==r.owner&&!b.dead&&b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos)<.65);if(r.life<=0||contact){if(r.grenade&&!r.impact&&r.life>0){r.mesh.position.copy(old);r.vel.multiplyScalar(.55);r.vel.y=Math.abs(r.vel.y)+2}else{explode(contact&&(!r.grenade||r.impact)?old:pos,r.owner,r.grenade,r.damageScale,r.mods);scene.remove(r.mesh);rockets.splice(i,1)}}}
 for(const p of pickups){if(p.kind==='pad')continue;if(p.timer>0){p.timer-=worldDt;if(p.timer<=0)p.mesh.visible=true}p.mesh.rotation.y+=worldDt;p.mesh.position.y+=(Math.sin(elapsed*2)*.002)}

}
function activateStreak(){const kind=equipment.streak;notify(EQUIPMENT.streak.find(x=>x.id===kind).name.toUpperCase());if(kind==='surge'){healPlayer(Math.max(health,perks.armor?140:100));focus=100;playSfx('pickup',{volume:.6})}else if(kind==='barrage'){playSfx('rocket',{volume:.5,bus:'self'});syncAimCamera();camera.getWorldDirection(aim);for(const angle of [-.15,0,.15])launchRocket(camera.position,aim.clone().applyAxisAngle(up,angle),null)}else for(const b of bots.filter(b=>!b.dead))explode(b.pos.clone().add(new THREE.Vector3(0,.5,0)),null)}
const upgrades=[
 ...weapons.map((w,j)=>({id:`gun${j}`,category:w.label.toUpperCase()+' / '+(j+1),name:w.name,desc:w.desc,price:w.price||220,gun:j})),
 {id:'reload',category:'PERK',name:'Sleight of hand',desc:'35% faster reloads.',price:180},
 {id:'speed',category:'PERK',name:'Lightweight',desc:'20% faster movement.',price:220},
 {id:'armor',category:'PERK',name:'Juggernaut',desc:'Spawn with 140 health.',price:240},
 {id:'focus',category:'PERK',name:'Deep focus',desc:'50% faster slow-motion recharge.',price:200},
 {id:'frags',category:'THROWABLE',name:'Bandolier',desc:'4 grenades per round.',price:160},
 {id:'quickdraw',category:'PERK',name:'Quickdraw',desc:'20% faster aiming. 35% faster weapon switching.',price:180},
 {id:'recovery',category:'PERK',name:'Recovery',desc:'Kills restore 20 health, up to your spawn health.',price:210}
];
function saveRun(){localStorage.setItem('dh-run',JSON.stringify({round,credits,owned,equipped,perks,builds,equipment,startingWeapon,shopOffers,phase:mode==='shop'||mode==='results'?'shop':'match'}))}
function endMatch(){const r=rank();mode='results';gameAudio.stopWorld();mouseDown=false;slow=false;document.exitPointerLock?.();$('hud').hidden=true;weaponGroup.visible=false;$('slowTint').style.opacity=0;$('damage').style.opacity=0;const survived=r<=3;const reward=[250,190,150][r-1]||0;if(survived)credits+=reward;best=Math.max(best,round);localStorage.setItem('dh-best',best);if(survived)saveRun();else localStorage.removeItem('dh-run');$('panel').hidden=false;$('panel').innerHTML=`<div class="topline"><span>ROUND ${String(round).padStart(2,'0')} / MATCH REPORT</span><span>${survived?'QUALIFIED':'RUN TERMINATED'}</span></div><h2>${survived?'ROUND COMPLETE':'RUN OVER'}</h2><p>${survived?`Placed ${r} of 6. +${reward} credits. ${matchKills} kills.`:`Placed ${r} of 6. Finish in the top 3 to advance. Best round: ${best}.`}</p><div class="result-table">${rankList().map((b,i)=>`<div class="score-row ${b.player?'you':''}"><span>${String(i+1).padStart(2,'0')} &nbsp; ${b.name} ${i<3?'↗':''}</span><span>${b.score} PTS &nbsp; / &nbsp; ${b.kills} KILLS &nbsp; / &nbsp; ${b.assists} ASSISTS &nbsp; / &nbsp; ${b.deaths} DEATHS</span></div>`).join('')}</div><div class="panel-actions"><button class="primary" id="resultnext">${survived?'LOADOUT':'NEW RUN'} <span>↗</span></button><button class="textbutton" id="backmenu">MAIN MENU</button></div>`;$('resultnext').onclick=()=>survived?showShop():startMatch();$('backmenu').onclick=mainMenu}
function ensureShopOffers(){if(!validShopOffers(shopOffers,round))shopOffers=createShopOffers({round,owned,builds,perks,equipment,weapons,upgrades});return shopOffers}
function showShop(inspect=false){
 shopInspect=inspect;shopGun=owned.includes(equipped)?equipped:owned[0]||0;shopSlot='optic';shopCandidate='';shopMessage='';mode='shop';locked=false;gameAudio.stopWorld();$('menu').hidden=true;$('hud').hidden=true;weaponGroup.visible=false;if(!inspect){ensureShopOffers();saveRun()}renderLoadout();$('panel').scrollTop=0;
}
function renderLoadout(){
 const on=(id,handler)=>{const el=$(id);if(el)el.onclick=handler},active=document.activeElement;
 const attributes=['data-gun','data-start','data-shop-gun','data-shop-part','data-buy','data-gear','data-owned-slot','data-owned-gear'];
 const focusKey=attributes.find(k=>active?.hasAttribute?.(k)),focusValue=focusKey?active.getAttribute(focusKey):null;
 const scroll=$('panel').scrollTop,heights=new Map([...$('panel').querySelectorAll('[data-shop-part]')].filter(b=>b.getBoundingClientRect).map(b=>[b.dataset.shopPart,b.getBoundingClientRect().height]));
 $('panel').hidden=false;$('panel').className='panel loadout-screen';
 $('panel').innerHTML=loadoutHTML({weapons,owned,builds,credits,perks,equipment,round,gun:shopGun,slot:shopSlot,inspect:shopInspect,starting:startingWeapon,upgrades,message:shopMessage,offers:shopInspect?null:ensureShopOffers()});
 $('panel').querySelectorAll('[data-gun]').forEach(btn=>btn.onclick=()=>{shopGun=Number(btn.dataset.gun);if(!WEAPON_SLOTS[shopGun][shopSlot])shopSlot='optic';renderLoadout()});
 $('panel').querySelectorAll('[data-start]').forEach(btn=>btn.onclick=()=>{if(shopInspect)return;const g=Number(btn.dataset.start);if(!owned.includes(g))return;startingWeapon=equipped=g;shopMessage=weapons[g].name+' starts next round';commitLoadout()});
 $('panel').querySelectorAll('[data-shop-gun]').forEach(btn=>btn.onclick=()=>{const g=Number(btn.dataset.shopGun);if(owned.includes(g)){shopGun=g;renderLoadout()}else buyUpgrade('gun'+g)});
 $('panel').querySelectorAll('[data-shop-part]').forEach(btn=>btn.onclick=()=>{const [g,id]=btn.dataset.shopPart.split(':');buyPart(Number(g),id)});
 $('panel').querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>buyUpgrade(btn.dataset.buy));
 $('panel').querySelectorAll('[data-gear]').forEach(btn=>btn.onclick=()=>{const [key,id]=btn.dataset.gear.split(':');equipGear(key,id)});
 $('panel').querySelectorAll('[data-owned-slot]').forEach(select=>select.onchange=()=>fitOwnedPart(shopGun,select.dataset.ownedSlot,select.value));
 $('panel').querySelectorAll('[data-owned-gear]').forEach(select=>select.onchange=()=>equipGear(select.dataset.ownedGear,select.value));
 const catalog=$('catalog-slot');if(catalog)catalog.onchange=()=>{shopSlot=catalog.value;renderLoadout()};
 on('reset-build',()=>{if(shopInspect||!owned.includes(shopGun))return;builds[shopGun].slots={};shopMessage=weapons[shopGun].name+' / Standard parts fitted';commitLoadout()});
 on('nextmatch',()=>{if(shopInspect)return;round++;startMatch(true)});
 on('savequit',()=>{if(!shopInspect)saveRun();mainMenu()});
 for(const b of $('panel').querySelectorAll('[data-shop-part]'))if(heights.has(b.dataset.shopPart)&&b.style)b.style.minHeight=heights.get(b.dataset.shopPart)+'px';
 $('panel').scrollTop=scroll||0;
 if(focusKey){const node=$('panel').querySelector('['+focusKey+'="'+focusValue+'"]');if(node&&!node.disabled)node.focus?.({preventScroll:true});else $('loadout-status')?.focus?.({preventScroll:true})}
}
function buyPart(gun,id){if(mode!=='shop'||shopInspect||!owned.includes(gun))return false;const a=attachment(gun,id);if(!a)return false;const bought=builds[gun]?.owned.includes(id);if(!bought&&!offeredPart(ensureShopOffers(),gun,id))return false;const result=fitAttachment(builds,owned,credits,gun,a.slot,id);if(!result.ok)return false;credits=result.credits;shopGun=gun;shopMessage=weapons[gun].name+' / '+a.name+' fitted';commitLoadout();return true}
function fitOwnedPart(gun,slot,id){if(mode!=='shop'||shopInspect||!owned.includes(gun)||id&&!builds[gun]?.owned.includes(id))return false;const result=fitAttachment(builds,owned,credits,gun,slot,id);if(!result.ok)return false;shopMessage=weapons[gun].name+' / '+(attachment(gun,id)?.name||'Standard')+' fitted';commitLoadout();return true}
function equipGear(key,id){if(mode!=='shop'||shopInspect||!EQUIPMENT[key])return false;const item=EQUIPMENT[key].find(x=>x.id===id);if(!item)return false;const bought=equipment.owned.includes(id);if(!bought&&!ensureShopOffers().equipment.includes(key+':'+id))return false;const price=bought?0:item.price;if(credits<price)return false;credits-=price;if(!bought)equipment.owned.push(id);equipment[key]=id;shopMessage=item.name+' equipped';commitLoadout();return true}
function buyUpgrade(id){if(mode!=='shop'||shopInspect||!offeredUpgrade(ensureShopOffers(),id))return false;const u=upgrades.find(x=>x.id===id);if(!u||credits<u.price||(u.gun!==undefined?owned.includes(u.gun):perks[u.id]))return false;credits-=u.price;if(u.gun!==undefined){owned.push(u.gun);shopGun=u.gun;shopMessage=u.name+' added'}else{perks[u.id]=true;shopMessage=u.name+' active'}commitLoadout();return true}
function commitLoadout(){playSfx('equip',{volume:.35});saveRun();renderLoadout()}
function mainMenu(){$('panel').className='panel';buildWeapon();gameAudio.stopWorld();mode='menu';document.exitPointerLock?.();$('panel').hidden=true;$('hud').hidden=true;$('menu').hidden=false;document.body.classList.remove('playing');weaponGroup.visible=false;$('continue').hidden=!localStorage.getItem('dh-run')}
function pause(){if(mode!=='play')return;gameAudio.stopWorld();mouseDown=false;keys.clear();slow=false;$('slowTint').style.opacity=0;$('panel').hidden=false;$('panel').innerHTML=`<div class="topline"><span>DEAD HEAT / ROUND ${round}</span><span>PAUSED</span></div><h2>PAUSED</h2><p></p>${controlsHTML()}${settingsHTML()}<div class="panel-actions"><button class="primary" id="resume">RESUME <span>↗</span></button><button class="textbutton" id="quit">END RUN</button></div>`;bindSettings();$('resume').onclick=()=>{lock()};$('quit').onclick=()=>{localStorage.removeItem('dh-run');mainMenu()}}
function settingsHTML(){return `<div class="settings">${[['motion','CAMERA MOTION'],['guns','GUN VOLUME'],['steps','FOOTSTEP VOLUME'],['feedback','FEEDBACK VOLUME']].map(([id,label])=>`<label for="setting-${id}">${label}<input id="setting-${id}" type="range" min="0" max="1" step=".05" value="${settings[id]}"></label>`).join('')}</div>`}
function bindSettings(){for(const key of ['motion','guns','steps','feedback'])$('setting-'+key).oninput=e=>{settings[key]=clamp(Number(e.target.value),0,1);localStorage.setItem('dh-settings',JSON.stringify(settings));gameAudio.applySettings(settings)}}
function controlsHTML(){return '<dl class="controls"><dt>W A S D</dt><dd>Move · Shift to sprint</dd><dt>MOUSE</dt><dd>Look · Left click to fire · Right click to aim</dd><dt>SPACE</dt><dd>Jump · Yellow pads launch you to upper lanes</dd><dt>HOLD Q</dt><dd>Slow time · Recharges while inactive</dd><dt>R / G / F</dt><dd>Reload / Throw grenade / Activate killstreak</dd><dt>1 – 6 / WHEEL</dt><dd>Switch owned weapons</dd><dt>ESC / TAB</dt><dd>Pause / Show scoreboard</dd></dl>'}
$('arsenal').onclick=()=>showShop(true);$('start').onclick=()=>startMatch();$('continue').hidden=!localStorage.getItem('dh-run');$('continue').onclick=()=>{try{const s=JSON.parse(localStorage.getItem('dh-run'));round=s.round;credits=s.credits;owned=s.owned;equipped=s.equipped;perks=s.perks||{};builds=migrateBuilds(s.builds,perks,owned);delete perks.grip;delete perks.damage;delete perks.rapid;equipment=normalizeEquipment(s.equipment);shopOffers=validShopOffers(s.shopOffers,s.round)?s.shopOffers:null;startingWeapon=owned.includes(s.startingWeapon)?s.startingWeapon:equipped;buildWeapon();$('menu').hidden=true;document.body.classList.add('playing');s.phase==='shop'?showShop():startMatch(true)}catch{startMatch()}};
$('help').onclick=e=>{e.preventDefault();$('panel').hidden=false;$('panel').innerHTML=`<div class="topline"><span>CONTROLS</span><span></span></div><h2>CONTROLS</h2><p>Two random weapons per run. Buy more between rounds. 90-second free-for-all. Finish in the top 3 to advance. Kills score 100 points; headshot kills score 150. Points determine placement; ties favor fewer deaths. Deaths respawn you. Get 3 kills without dying to earn your selected killstreak.</p>${controlsHTML()}<p>Rockets deal splash damage and propel you upward: jump, look down, fire. Rail shots pierce contenders. The shotgun keeps four pellets tight for range and spreads eight for close encounters.</p><p class="warning">Mouse and keyboard recommended. Click Enter the Arena to capture your mouse. Escape releases it.</p><button class="primary" id="closehelp">BACK <span>↗</span></button>`;$('closehelp').onclick=()=>{$('panel').hidden=true}};
$('sound').onclick=()=>{muted=!muted;gameAudio.setMuted(muted);if(!muted)gameAudio.unlock();$('sound').innerHTML=`SOUND <span>${muted?'OFF':'ON'} ↗</span>`};
document.addEventListener('pointerlockchange',()=>{
 const captured=document.pointerLockElement===renderer.domElement;
 if(captured){dragLook=false;locked=true;lastPointer=null;if(mode==='play'){$('panel').hidden=true;$('hud').querySelector('.hudhint').textContent='WASD MOVE · MOUSE AIM · CLICK FIRE · Q SLOW MOTION · ESC PAUSE'}}
 else if(!dragLook){locked=false;if(mode==='play')pause()}
});
document.addEventListener('pointerlockerror',enableDragLook);
document.addEventListener('mousemove',e=>{
 if(!locked||mode!=='play')return;
 let dx=e.movementX,dy=e.movementY;
 if(dragLook){if(lastPointer){dx=e.clientX-lastPointer.x;dy=e.clientY-lastPointer.y}else{dx=Number.isFinite(dx)?dx:0;dy=Number.isFinite(dy)?dy:0}lastPointer={x:e.clientX,y:e.clientY}}
 const sense=keys.has('MouseRight')?.001/playerWeapon().zoom:.002;yaw-=dx*sense;pitch=clamp(pitch-dy*sense,-1.5,1.5);turnX+=dx*.001;turnY+=dy*.001;
});

document.addEventListener('mousedown',e=>{if(mode!=='play'||!locked)return;if(e.button===0)mouseDown=true;if(e.button===2)keys.add('MouseRight')});document.addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;if(e.button===2)keys.delete('MouseRight')});document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(mode!=='play'||!locked)return;if(e.code==='Escape'&&dragLook){locked=false;pause();return}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab','KeyQ'].includes(e.code))e.preventDefault();if(e.code==='Tab')$('leaderboard').style.fontSize='16px';if(!e.repeat){if(e.code==='KeyR')reload();if(e.code==='KeyG'&&grenades>0&&respawnTime<=0){grenades--;syncAimCamera();camera.getWorldDirection(aim);launchRocket(playerPos,aim,null,true,equipment.throwable==='impact'?.85:1,{radius:equipment.throwable==='impact'?5/7:1});playSfx('frag',{volume:.4})}if(e.code==='KeyF'&&streakReady&&respawnTime<=0){streakReady=false;streak=0;activateStreak()}const n=Number(e.key)-1;if(n>=0&&n<6)switchWeapon(n)}keys.add(e.code)});
document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Tab')$('leaderboard').style.fontSize='11px'});window.addEventListener('blur',()=>{keys.clear();mouseDown=false;if(locked){if(dragLook){locked=false;pause()}else document.exitPointerLock()}});document.addEventListener('wheel',e=>{if(mode==='play'&&locked){const idx=owned.indexOf(equipped);switchWeapon(owned[(idx+(e.deltaY>0?1:owned.length-1))%owned.length])}},{passive:true});window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});


init();
