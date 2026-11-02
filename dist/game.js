import {drawMapFromBag,validMapRotation,rotationAfterPlayedMap} from './map-rotation.js';
import {waterImmersion,swimVertical,swimHorizontal} from './water.js';
import {createToolWeapon,animateToolWeapon,createToolWorld,disposeToolModel} from './tool-weapons.js';
import {chooseSpawn} from './spawns.js';
import {createNailer,animateNailer,createNailerWorld} from './nailer.js';
import {WEAPON_ORDER,weaponSlot} from './weapon-order.js';
import {healthAfterPickup} from './pickups.js';
import {receiveImpact} from './impact.js';
import {buildBrushMap,dressElevators} from './map-view.js';
import {ElevatorSystem} from './elevators.js';
import * as THREE from 'three';
import {surface, MATERIALS, studioEnvironment, FrameRenderer, dressArena, createMuzzleFlash, smokeMesh} from './presentation.js';
import {createRifle, rifleAttachment, animateRifle} from './rifle.js';
import {createDummyRig, resetDummyRig, animateDummy, fireDummy, beginRagdoll, stepRagdoll, poseDummy} from './characters.js';
import { ArenaAI, buildNavigation,restoreNavigation, nearestNode as nearestAINode, findRoute } from './ai.js';
import { MAP, MAPS, selectMap, ALL_WEAPONS, randomWeaponPair } from './map.js';
import { COLLISION, canOccupy, moveCharacter } from './collision.js';
import { inBlock, blockedAt, surfaceAt, ceilingAt, launchTime,blockSpan } from './geometry.js';
import { GameAudio, AUDIO_TUNING } from './audio.js';
import { ACTIONS, ControlBindings, keyLabel, mouseCode, bindingsHTML, controlsOptionsHTML } from './controls.js';
import { DamageHistory, bodyPartAt, recapHTML } from './recap.js';
import { HurtFeedback, HURT, nearMissSegment } from './hurt.js';
import { FEEL, HANDLING, Spring, accelerate, WeaponMotion, HitFeedback } from './feel.js';
import { resolveDamage, combineOutcomes, recordDamage, clearDamageCredit, takeAssists } from './combat.js';
import { WEAPON_SLOTS, OPTICS, SLOT_LABELS, attachment, fitted, normalizeBuilds, weaponStats, previewBuild, fitAttachment, migrateBuilds, EQUIPMENT, normalizeEquipment } from './loadout.js';
import { loadoutHTML, gunIcon } from './loadout-view.js';
import { createShopOffers, validShopOffers, offeredPart, offeredUpgrade } from './shop.js';
const $=s=>document.getElementById(s), clamp=THREE.MathUtils.clamp;
const weapons=[
 {name:'JACKHAMMER',label:'Assault rifle',damage:24,interval:.13,mag:30,reload:1.35,spread:.008,pellets:1,color:0xe6fa80,kick:.045,price:0,desc:'Accurate automatic fire. 30 rounds.'},
 {name:'NAILER',label:'Hand cannon',damage:83,interval:.53,mag:7,reload:1.6,spread:.004,pellets:1,color:0xe6fa80,kick:.15,price:260,desc:'High damage. Heavy recoil. 7 rounds.'},
 {name:'RATTLER',label:'Submachine gun',damage:13,interval:.055,mag:42,reload:1.05,spread:.033,pellets:1,color:0xe6fa80,kick:.025,price:280,desc:'Very fast fire rate. Wide spread. 42 rounds.'},
 {name:'LANCER',label:'Rail rifle',damage:155,interval:1.35,mag:4,reload:2,spread:0,pellets:1,color:0xe6fa80,kick:.12,price:420,desc:'Instant piercing shot. Slow fire rate. 4 rounds.'},
 {name:'DEMOLISHER',label:'Rocket launcher',damage:110,interval:.85,mag:5,reload:1.8,spread:0,pellets:1,color:0xe6fa80,kick:.16,price:400,desc:'Splash damage and rocket jumps. 5 rockets.'},
 {name:'SLEDGEHAMMER',label:'Pump shotgun',damage:12,interval:.83,mag:8,reload:1.7,spread:.085,pellets:12,color:0xe6fa80,kick:.16,price:300,desc:'12 pellets. Strong up close; tight core retains range.'}
];
let navNodes=[],navigation,opponentAI,playerSpawnAt=0,previewDummy,previewRig,frameRenderer,studioMap;
let scene,camera,renderer,weaponGroup,flash,arena,worldMeshes=[],blocks=[],bots=[],effects=[],rockets=[],pickups=[];
let mode='menu',round=1,credits=0,owned=[0],equipped=0,perks={},time=90,matchKills=0,deathCount=0,streak=0,best=Number(localStorage.getItem('dh-best')||0);
let builds=normalizeBuilds(),equipment=normalizeEquipment(),startingWeapon=0,shopGun=0,shopSlot='optic',shopCandidate='',shopInspect=false,shopMessage='',shopOffers=null,shownReticle=null;
function playerWeapon(i=equipped,state=builds){return weaponStats(weapons[i],i,state)}
function playerHandling(i=equipped){const w=playerWeapon(i),h=HANDLING[i];return {...h,kick:h.kick*w.recoil,aim:h.aim*w.recoil}}
let muzzleTime=0,magazines={},playerPadFlight=null;
const playerHistory=new DamageHistory();let deathView=null;const killerEdges=new Map();
const playerCredit={maxHealth:100};let assistNotice={points:0,count:0,left:0},matchAssists=0;
let matchPoints=0,headshotKills=0,jumpBuffered=0,coyoteTime=0,lastJumpHeld=false,viewHeight=1.7,turnX=0,turnY=0,nearMissCooldown=0,nearWall=0;
const hurtFeedback=new HurtFeedback();
const weaponMotion=new WeaponMotion(),aimSpring=new Spring(),feedback=new HitFeedback();
let settings={motion:.65,guns:1,steps:1,feedback:1,music:1,sensitivity:1,hudScale:1,invertY:false,crouchToggle:false};try{settings={...settings,...JSON.parse(localStorage.getItem('dh-settings')||'{}')}}catch{}
for(const [key,min,max,fallback]of [['hudScale',.5,2,1],['motion',0,1,.65],['guns',0,1,1],['steps',0,1,1],['feedback',0,1,1],['music',0,1,1],['sensitivity',.2,3,1]])settings[key]=Number.isFinite(Number(settings[key]))?clamp(Number(settings[key]),min,max):fallback;
let controls;try{controls=new ControlBindings(JSON.parse(localStorage.getItem('dh-controls')||'null'))}catch{controls=new ControlBindings()}
let bindingPending=null,controlsBack='menu',controlsMessage='',crouchLatch=false,crouched=false,eyeHeight=1.7,headBlocked=false;const physicalKeys=new Set();
let shotsFired=0;
let health=100,focus=100,ammo=30,reloading=0,shotTimer=0,grenades=2,slow=false,locked=false,mouseDown=false,yaw=0,pitch=0,vy=0,grounded=true,recoil=0,moveClock=0,elapsed=0,hitTime=0,respawnTime=0,toastTime=0,streakReady=false;
const playerPos=new THREE.Vector3(0,1.7,15),vel=new THREE.Vector3(),keys=new Set(),up=new THREE.Vector3(0,1,0),ray=new THREE.Raycaster(),aim=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
const gameAudio=new GameAudio();let muted=false,lastHUD=0,dragLook=false,stepDistance=0,reloadStage=0,reloadLength=0,hurtSoundCooldown=0,lastPointer=null;
let spawnPoints=MAP.spawns,elevatorSystem;const arenaCache=new Map(),spawnHistory=new Map();
const botNames=['CINDER','ROOK','VESPER','STATIC','BRICK'];
const inkEdges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));const inkLine=new THREE.LineBasicMaterial({color:0x303b40,transparent:true,opacity:.12});
const shardGeo=new THREE.TetrahedronGeometry(1);
const viewHandGeo=new THREE.SphereGeometry(1,10,6),viewArmGeo=new THREE.CylinderGeometry(.75,1,1,10);
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.IcosahedronGeometry(1,0);
// Stable face values keep corners readable even when two surfaces share a light.
// These face accents remain restrained beneath the physical lighting.
const worldBoxGeo=boxGeo.clone(),faceValues=new Float32Array(worldBoxGeo.attributes.position.count*3);
for(let i=0;i<worldBoxGeo.attributes.normal.count;i++){
 const n=worldBoxGeo.attributes.normal,x=n.getX(i),y=n.getY(i),z=n.getZ(i);
 const value=y>.5?[1,1,.98]:y<-.5?[.60,.67,.67]:x>.5?[.80,.86,.86]:x<-.5?[.89,.92,.92]:z>.5?[.96,.97,.93]:[.84,.90,.91];
 faceValues.set(value,i*3);
}
worldBoxGeo.setAttribute('color',new THREE.BufferAttribute(faceValues,3));
function worldMat(c){return surface(c,true)}
function mat(c){return surface(c)}
function cube(x,y,z,w,h,d,c,parent=arena,solid=false){const m=new THREE.Mesh(solid?worldBoxGeo:boxGeo,solid?worldMat(c):mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=parent!==weaponGroup;m.receiveShadow=true;parent.add(m);if(solid){const edge=new THREE.LineSegments(inkEdges,inkLine);m.add(edge);blocks.push({x,z,w,d,top:y+h/2,bottom:y-h/2});worldMeshes.push(m)}return m}
function label(text,x,y,z,width,height,rotation=0,bg='#182127',fg='#eef0e6'){const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,256);c.fillStyle=fg;c.font='900 170px Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,140,970);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tx}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;arena.add(mesh);return mesh}
function init(){
 selectMap(readMapRotation()?.last||'testworks');spawnPoints=MAP.spawns;
 applyHUDScale();
 gameAudio.visibility=(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z));
 scene=new THREE.Scene();scene.background=new THREE.Color(0x182127);scene.fog=new THREE.Fog(0x182127,38,120);
 camera=new THREE.PerspectiveCamera(85,innerWidth/innerHeight,.07,160);camera.rotation.order='YXZ';
 try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('start').textContent='WEBGL REQUIRED';$('start').disabled=true;return}
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2100000/(innerWidth*innerHeight))));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;studioMap=studioEnvironment(renderer);scene.environment=studioMap.texture;scene.environmentIntensity=.34;frameRenderer=new FrameRenderer(renderer,scene,camera);$('viewport').appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xf7f8f0,0x65717c,1.0));const sun=new THREE.DirectionalLight(0xfff2d6,2.8);sun.position.set(-24,52,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-57,right:57,top:57,bottom:-57,near:1,far:125});sun.shadow.bias=-.003;sun.shadow.normalBias=.08;scene.add(sun);scene.traverse(o=>{if(o.isLight)o.layers.enable(1)});const weaponFill=new THREE.DirectionalLight(0xdde9ef,1.5);weaponFill.position.set(-2,3,1);weaponFill.layers.set(1);camera.add(weaponFill);camera.add(weaponFill.target);weaponFill.target.position.set(0,0,-1);arena=new THREE.Group();scene.add(arena);buildArena();buildNav();buildWeapon();previewRig=createDummy();previewDummy=previewRig.group;camera.add(previewDummy);previewDummy.scale.setScalar(1.55);previewDummy.position.set(1.55,-1.85,-4.6);previewDummy.rotation.y=-.4;
 let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;if(mode==='shop')return;if(mode==='play'&&locked)update(dt);else if(mode==='menu'){previewDummy.visible=true;previewDummy.rotation.y=-.4+Math.sin(elapsed*.3)*.12;previewRig.anim.time+=dt;poseDummy(previewRig,{dt,relaxed:true});camera.fov=65;camera.updateProjectionMatrix();const p=MAP.camera?.position||[43,32,42],t=MAP.camera?.target||[0,0,-3];camera.position.set(p[0]+Math.sin(elapsed*.055)*3,p[1],p[2]);camera.lookAt(...t)}updateEffects(dt*(slow?.25:1));frameRenderer.render(scene,camera,dt,slow,MAP.water||[])});
}
function buildArena(){
 if(MAP.brushes)buildBrushMap(arena,MAP,blocks,worldMeshes);else{
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

 dressArena(arena,MAP.solids,{blocks,worldMeshes});
 }
 for(const p of MAP.pads){const y=p.y||0;cube(p.x,y+.045,p.z,2.7,.09,2.7,0x182127);cube(p.x,y+.11,p.z,2.2,.08,2.2,0xd9ef45);const triangle=new THREE.Mesh(new THREE.ConeGeometry(.65,.07,3),mat(0x182127));triangle.position.set(p.x,y+.2,p.z);triangle.rotation.y=Math.atan2(p.landing.x-p.x,p.landing.z-p.z);arena.add(triangle);pickups.push({...p,kind:'pad',mesh:triangle,timer:0})}
 elevatorSystem=new ElevatorSystem(MAP.elevators||[],blocks);dressElevators(arena,elevatorSystem,worldMeshes);
 for(const p of MAP.pickups){
  const group=new THREE.Group(),small=p.amount===5,major=p.amount===50,healthItem=p.kind==='health',color=major?0xd9ef45:small?0xa9d9c8:0xf1f3e8;
  const size=small?.22:major?.65:.45,m=new THREE.Mesh(healthItem?boxGeo:sphereGeo,mat(healthItem?color:0xd9ef45));m.scale.setScalar(size);group.add(m);
  if(healthItem){for(const side of [-1,1]){cube(0,0,side*(size/2+.008),size*.26,size*.72,.015,0x182127,group);cube(0,0,side*(size/2+.012),size*.72,size*.26,.015,0x182127,group)}}
  group.position.set(p.x,p.y+(small?.8:1.15),p.z);arena.add(group);pickups.push({...p,mesh:group,timer:0,baseY:group.position.y});
  if(!small){const ring=new THREE.Mesh(new THREE.TorusGeometry(major?.85:.55,.025,3,24),mat(major?0xd9ef45:0xa9d9c8));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,p.y+.025,p.z);arena.add(ring)}
 }
 batchArena();
}
function changeArena(id){
 if(id===MAP.id&&arena.children.length)return;
 clearDeathView();for(const r of rockets)scene.remove(r.mesh);rockets=[];for(const e of effects)retireEffect(e);effects=[];
 if(arena.children.length){arenaCache.set(MAP.id,{arena,blocks,worldMeshes,pickups,elevatorSystem,navigation});scene.remove(arena)}
 for(const b of bots){disposeToolModel(b.group);scene.remove(b.group)}bots=[];spawnHistory.clear();selectMap(id);spawnPoints=MAP.spawns;
 const cached=arenaCache.get(MAP.id);if(cached){({arena,blocks,worldMeshes,pickups,elevatorSystem,navigation}=cached);navNodes=navigation.nodes;scene.add(arena)}
 else{arena=new THREE.Group();scene.add(arena);blocks=[];worldMeshes=[];pickups=[];buildArena();buildNav()}
 elevatorSystem.reset();scene.updateMatrixWorld(true);
}
function waterAt(x,y,z){for(const w of MAP.water||[]){const span=blockSpan(w,x,z);if(span&&y>span.bottom&&y<span.top)return span}return null}
function stepElevators(dt){if(!elevatorSystem?.lifts.length)return;const actors=bots.filter(b=>!b.dead).map(b=>({x:()=>b.pos.x,z:()=>b.pos.z,feet:()=>b.pos.y,velocityY:()=>b.vy,height:()=>1.9,carry:dy=>{b.pos.y+=dy;b.vy=0}}));if(respawnTime<=0)actors.push({x:()=>playerPos.x,z:()=>playerPos.z,feet:()=>playerPos.y-eyeHeight,velocityY:()=>vy,height:()=>crouched?COLLISION.crouching:COLLISION.standing,carry:dy=>{playerPos.y+=dy;viewHeight+=dy;vy=0}});elevatorSystem.step(dt,actors)}
function rideElevator(b,brain,dt){
 const ride=brain.liftRide,l=elevatorSystem.lifts.find(l=>l.id===ride?.id);if(!l){brain.liftRide=null;return}
 if(ride.phase==='board'){
  elevatorSystem.request(l,ride.fromY);
  if(Math.abs(l.y-ride.fromY)>.1||Math.abs(l.target-l.y)>.1)return;
  const dx=l.x-b.pos.x,dz=l.z-b.pos.z,d=Math.hypot(dx,dz);if(d>.12)opponentAI.world.move(b,dx/Math.max(d,.01)*Math.min(d,4.5*dt),dz/Math.max(d,.01)*Math.min(d,4.5*dt));
  if(Math.abs(b.pos.y-l.y)<.2&&inBlock(l.block,b.pos.x,b.pos.z,-.45)){ride.phase='ride';elevatorSystem.request(l,ride.to.y)}
 }else if(ride.phase==='ride'){
  elevatorSystem.request(l,ride.to.y);if(Math.abs(l.y-ride.to.y)<.1)ride.phase='exit';
 }else{const dx=ride.to.x-b.pos.x,dz=ride.to.z-b.pos.z,d=Math.hypot(dx,dz);if(d>.1)opponentAI.world.move(b,dx/Math.max(d,.01)*Math.min(d,4.5*dt),dz/Math.max(d,.01)*Math.min(d,4.5*dt));if(!inBlock(l.block,b.pos.x,b.pos.z,.1)){brain.liftRide=null;brain.pathIn=0}}
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
 camera.userData.weaponFovFloor=65;
 if(weaponGroup){disposeToolModel(weaponGroup);camera.remove(weaponGroup);flash?.material.dispose()}
 weaponGroup=new THREE.Group();camera.add(weaponGroup);if(!camera.parent)scene.add(camera);
 const options={attachments:fitted(equipped,state)},hero=equipped===1?createNailer(weaponGroup,options):createToolWeapon(weaponGroup,equipped,options);
 if(equipped===1)weaponGroup.userData.nailer=hero;else weaponGroup.userData.heroTool=hero;
 if(equipped===0)weaponGroup.userData.heroRifle=hero;
 weaponGroup.userData.opticY=hero.sightY;weaponGroup.userData.sightX=hero.sightX||0;
 flash=createMuzzleFlash();flash.position.set(hero.muzzleX||0,hero.muzzleY??.061,hero.muzzleZ);flash.scale.setScalar(.8);flash.visible=false;weaponGroup.add(flash);
 weaponGroup.scale.setScalar(.85);weaponGroup.position.set(.31,-.3,-.5);weaponGroup.visible=false;
 const light=new THREE.PointLight(0xffe5a3,0,2.2,2);light.position.copy(flash.position);light.position.y+=.06;weaponGroup.add(light);weaponGroup.userData.muzzleLight=light;
 weaponGroup.traverse(m=>m.layers.set(1));tintPlayerArms();
}

function playSfx(name,options={}){if(muted)return null;return gameAudio.play(name,{volume:AUDIO_TUNING.volumes.ui,...options})}

function notify(text){$('toast').textContent=text;toastTime=2.3}
function rankList(){return[{name:'YOU',score:matchPoints,kills:matchKills,assists:matchAssists,deaths:deathCount,player:true},...bots.map(b=>({name:b.name,score:b.score,kills:b.frags||0,assists:b.assists||0,deaths:b.deaths,player:false}))].sort((a,b)=>b.score-a.score||a.deaths-b.deaths||Number(b.player)-Number(a.player))}
function rank(){return rankList().findIndex(b=>b.player)+1}
function updateHUD(){
 const ranks=rankList(),r=rank(),bind=a=>keyLabel(controls.bindings[a].find(Boolean)||'');
 $('round').textContent=String(round).padStart(2,'0');$('timer').textContent=`${Math.floor(Math.ceil(time)/60)}:${String(Math.ceil(time)%60).padStart(2,'0')}`;
 $('rank').innerHTML=`<b>${r}${['ST','ND','RD'][r-1]||'TH'}</b><small> / 6</small>`;
 tintPlayerArms();$('health').textContent=Math.ceil(health);$('health-label').textContent=crouched?'CROUCHED':'HEALTH';$('head-blocked').hidden=!headBlocked||respawnTime>0;
 $('healthbar').style.width=`${health/(perks.armor?140:100)*100}%`;$('focusbar').style.width=`${focus}%`;$('slow-key').textContent=bind('slow');$('focuslabel').textContent=slow?'ACTIVE':focus<10?'CHARGING':'READY';
 $('ammo').textContent=reloading>0?'—':ammo;$('weaponname').textContent=weapons[equipped].name;$('weapon-icon').innerHTML=gunIcon(equipped);
 $('loadout').innerHTML=WEAPON_ORDER.filter(i=>owned.includes(i)).map(i=>`<span class="hud-weapon ${i===equipped?'selected':''}"><kbd>${bind('weapon'+weaponSlot(i))}</kbd>${gunIcon(i)}</span>`).join('');
 $('utility').innerHTML=`<span class="hud-gear"><kbd>${bind('grenade')}</kbd><svg viewBox="0 0 24 28" aria-hidden="true"><path d="m10 2 7 2-1 3h-3l-1 3c5 2 7 7 4 12-2 4-8 5-11 1-3-4-2-10 3-13l1-4H7V3Z" fill="currentColor"/></svg><b>${grenades}</b></span><span class="hud-streak ${streakReady?'ready':''}"><kbd>${bind('streak')}</kbd><span>${streakReady?EQUIPMENT.streak.find(x=>x.id===equipment.streak).name: 'STREAK'}</span><b>${streakReady?'READY':streak+' / 3'}</b></span>${reloading>0?'<span class="reload-state">RELOADING</span>':ammo===0?`<span class="reload-state"><kbd>${bind('reload')}</kbd> RELOAD</span>`:''}`;
 $('leaderboard').innerHTML=ranks.map((b,i)=>`<div class="score-row ${b.player?'you':''} ${i===2?'cutoff':''}"><span class="score-place">${i+1}</span><span class="score-name">${b.name}</span><b>${b.score}</b></div>`).join('');
}
function chooseArenaSpawn(exclude=null){
 const actors=bots.filter(b=>b!==exclude&&!b.dead&&b.lifeId).map(b=>({pos:b.pos}));
 if(exclude&&respawnTime<=0)actors.push({pos:{x:playerPos.x,y:playerPos.y-eyeHeight,z:playerPos.z},eye:playerPos});
 return chooseSpawn(spawnPoints,actors,{now:opponentAI?.clock||0,recent:spawnHistory,random:()=>Math.random(),canSee:(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z))});
}
function spawnBot(b){
 const s=chooseArenaSpawn(b);b.lifeId=(b.lifeId||0)+1;b.pos.set(s[0],s[1],s[2]);b.hp=100;b.history=new DamageHistory();b.maxHealth=100;clearDamageCredit(b);b.dead=0;b.hitReact=null;b.impactVector=null;b.deathAge=0;b.crouched=undefined;resetDummyRig(b);b.group.visible=true;b.group.position.copy(b.pos);b.vy=0;
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
 const rig=createDummyRig({mat,target:dummyTarget,weapon});buildDummyGun(rig.parts.rightArm,weapon);return rig;
}
const healthColors=Array.from({length:21},(_,i)=>new THREE.Color().setHSL((i/20)*.32,.78,.48).getHex());
function tintDummy(b){
 const color=b.dead?0x858c88:healthColors[Math.round(clamp(b.hp/(b.maxHealth||100),0,1)*20)];
 b.group.traverse(o=>{if(o.userData.healthShell)o.material=mat(color);if(o.geometry===targetGeo){if(b.dead){o.userData.liveMaterial??=o.material;o.material=mat(0x858c88)}else if(o.userData.liveMaterial)o.material=o.userData.liveMaterial}});
}
function tintPlayerArms(){const color=health<=0?0x858c88:healthColors[Math.round(clamp(health/(perks.armor?140:100),0,1)*20)];weaponGroup?.traverse(m=>{if(m.userData.healthSkin)m.material=mat(color)})}
function healPlayer(value){if(value>health){health=value;tintPlayerArms();playerCredit.maxHealth=Math.max(playerCredit.maxHealth,value);clearDamageCredit(playerCredit);playerHistory.clear()}}
function healBot(b,value){if(value>b.hp){b.hp=value;b.maxHealth=Math.max(b.maxHealth||100,value);clearDamageCredit(b);b.history?.clear();tintDummy(b)}}
function awardAssists(target,killer){for(const a of takeAssists(target,killer)){if(a.id==='player'){matchPoints+=a.points;matchAssists++;if(assistNotice.left<=0)assistNotice={points:0,count:0,left:0};assistNotice.points+=a.points;assistNotice.count++;assistNotice.left=1.5}else{const bot=bots.find(b=>b.name===a.id);if(bot){bot.score+=a.points;bot.assists=(bot.assists||0)+1}}}}
function buildDummyGun(arm,weapon){
 const mount=arm.userData.weaponMount||arm,old=mount.children.find(c=>c.name==='weapon');if(old){disposeToolModel(old);mount.remove(old)}
 const gun=new THREE.Group();gun.name='weapon';mount.add(gun);const i=ALL_WEAPONS.indexOf(weapon),model=i===1?createNailerWorld(gun):createToolWorld(gun,i<0?0:i);
 model.rotation.y=Math.PI;model.scale.setScalar(i===1?.55:.60);model.position.set(0,.06,.04);
 model.traverse(m=>{if(m.isMesh)m.userData.gunVisual=true});
 // Weapon artwork uses a simple arm-hit proxy, keeping shot tests independent
 // of decorative screws, rails and merged material geometry.
 const sizes=[[.22,.30,1.25],[.24,.40,.80],[.22,.34,.85],[.24,.34,1.6],[.50,.45,1.3],[.24,.30,1.4]][i<0?0:i];
 const proxy=new THREE.Mesh(boxGeo,mat(0x182127));proxy.scale.set(...sizes);proxy.position.set(0,-.025,i===1?-.15:i===2?-.16:i===4?-.22:-.34);proxy.visible=false;model.add(proxy);gun.userData.hitProxy=proxy;return gun;
}

function makeBots(){
 bots.forEach(b=>{disposeToolModel(b.group);scene.remove(b.group)});bots=[];opponentAI=createOpponentAI();
 botNames.forEach((name,i)=>{const d=createDummy(opponentAI.tuning.profiles[i].weapon);scene.add(d.group);const b={name,loadout:randomWeaponPair(()=>Math.random()),pos:new THREE.Vector3(),...d,hp:100,score:0,frags:0,headshots:0,deaths:0,dead:0,cool:1,side:i%2?1:-1,phase:Math.random()*7,stuck:0};d.group.traverse(o=>o.userData.bot=b);bots.push(b);spawnBot(b)});
}
function botHitMeshes(){const meshes=[];for(const b of bots)for(const p of Object.values(b.parts)){if(!p.visible)continue;p.traverseVisible(m=>{if(m.userData.hitProxy)meshes.push(m.userData.hitProxy);if(m.isMesh&&!m.userData.gunVisual)meshes.push(m)})}return meshes}
function shatterPart(b,name,point){if(!b.dead)return;const part=b.parts[name]||b.parts.torso;if(!part.visible)return;part.getWorldPosition(tmp);const center=point?point.clone().lerp(tmp,.5):tmp.clone();part.visible=false;for(let i=0;i<15;i++){const m=new THREE.Mesh(shardGeo,mat(i%4===0?0x182127:0x858c88));m.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.25,(Math.random()-.5)*.4,(Math.random()-.5)*.25));m.scale.set(.06+Math.random()*.08,.06+Math.random()*.13,.04+Math.random()*.07);scene.add(m);addEffect({mesh:m,life:.65+Math.random()*.5,max:1.2,vel:new THREE.Vector3((Math.random()-.5)*9,2+Math.random()*6,(Math.random()-.5)*9).addScaledVector(b.impactVector||new THREE.Vector3(),5),spin:new THREE.Vector3(Math.random()*12,Math.random()*10,Math.random()*9)})}playSfx('shatter',{pos:b.pos,volume:.35,curve:'foley',bus:'world',priority:1})}

function blocked(x,z,feet,r=.4,height=1.7){if(Math.abs(x)>MAP.bounds.x-.5||Math.abs(z)>MAP.bounds.z-.5)return true;return blockedAt(blocks,x,z,feet,r,height)}
function buildNav(){navigation=MAP.navigation?restoreNavigation(MAP.navigation,MAP.elevators,MAP.anchors,MAP.bounds,blocks,MAP.stepHeight):buildNavigation(blocks,pickups.filter(p=>p.kind==='pad'),MAP.anchors,{bounds:MAP.bounds,maxHeight:MAP.maxHeight,noGround:!!MAP.brushes,stepHeight:MAP.stepHeight,elevators:MAP.elevators,water:MAP.water});navNodes=navigation.nodes}
function nearestNode(pos){return nearestAINode(navigation,pos)}
function findPath(from,to){return findRoute(navigation,from,to)}

function move(pos,dx,dz,feet,r=.4,height=1.7){if(!blocked(pos.x+dx,pos.z,feet,r,height))pos.x+=dx;if(!blocked(pos.x,pos.z+dz,feet,r,height))pos.z+=dz}
function floorAt(x,z,feet){return surfaceAt(blocks,x,z,feet)}
function visible(a,b){tmp2.copy(b).sub(a);const distance=tmp2.length();ray.set(a,tmp2.normalize());ray.far=distance;return ray.intersectObjects(worldMeshes,false).length===0}
function readMapRotation(){try{return JSON.parse(localStorage.getItem('dh-map-rotation'))}catch{return null}}
function startRandomMatch(next=false){const draw=drawMapFromBag(MAPS.map(m=>m.id),readMapRotation(),()=>Math.random());changeArena(draw.mapId);localStorage.setItem('dh-map-rotation',JSON.stringify(draw.state));startMatch(next)}
function restoreMapRotation(){const ids=MAPS.map(m=>m.id);if(!validMapRotation(readMapRotation(),ids))localStorage.setItem('dh-map-rotation',JSON.stringify(rotationAfterPlayedMap(ids,MAP.id,()=>Math.random())))}
function startMatch(next=false){spawnHistory.clear();elevatorSystem?.reset();$('panel').className='panel';if(!muted){gameAudio.unlock();gameAudio.applySettings(settings);gameAudio.warm()}gameAudio.startMusic();gameAudio.stopWorld();previewDummy.visible=false;for(const r of rockets)scene.remove(r.mesh);rockets=[];for(const e of effects)retireEffect(e);effects=[];feedback.reset();weaponMotion.reset();aimSpring.reset();for(const p of pickups){p.timer=0;p.mesh.visible=true}feeds.length=0;$('killfeed').innerHTML='';if(!next){round=1;credits=0;owned=randomWeaponPair(()=>Math.random()).map(w=>ALL_WEAPONS.indexOf(w));equipped=owned[0];startingWeapon=equipped;builds=normalizeBuilds();equipment=normalizeEquipment();shopOffers=null;perks={};best=Number(localStorage.getItem('dh-best')||0)}else if(owned.includes(startingWeapon))equipped=startingWeapon;buildWeapon();time=90;matchPoints=headshotKills=matchAssists=0;assistNotice={points:0,count:0,left:0};matchKills=deathCount=streak=0;streakReady=false;grenades=perks.frags?4:2;focus=100;makeBots();spawnPlayer();mode='play';$('menu').hidden=true;$('panel').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');weaponGroup.visible=true;lock();notify(`ROUND ${round} · ${MAP.name}`);saveRun()}
function lock(){
 lastPointer=null;
 try{if(!renderer.domElement.requestPointerLock){enableDragLook();return}const request=renderer.domElement.requestPointerLock();request?.catch?.(()=>enableDragLook())}catch{enableDragLook()}
}
function enableDragLook(){
 if(mode!=='play')return;dragLook=true;locked=true;lastPointer=null;$('panel').hidden=true;renderer.domElement.style&&(renderer.domElement.style.cursor='none');$('hud').querySelector('.hudhint').textContent=controlHint();
}

function spawnPlayer(){headBlocked=false;$('head-blocked').hidden=true;crouched=crouchLatch=false;if(settings.crouchToggle)keys.delete('KeyC');eyeHeight=1.7;clearDeathView();playerHistory.clear();hurtFeedback.reset();$('damage').style.opacity=0;$('healthDanger').style.opacity=0;for(let i=0;i<HURT.maxDirections;i++)$('damageArc'+i).style.opacity=0;weaponMotion.reset();aimSpring.reset();jumpBuffered=coyoteTime=0;lastJumpHeld=false;viewHeight=playerPos.y;stepDistance=0;playerPadFlight=null;magazines=Object.fromEntries(owned.map(i=>[i,playerWeapon(i).mag]));playerSpawnAt=opponentAI?.clock||0;const s=chooseArenaSpawn();playerPos.set(s[0],s[1]+1.7,s[2]);health=perks.armor?140:100;tintPlayerArms();playerCredit.maxHealth=health;clearDamageCredit(playerCredit);vy=0;vel.set(0,0,0);yaw=MAP.spawnYaws?.[spawnPoints.indexOf(s)]??Math.atan2(playerPos.x,playerPos.z);pitch=0;ammo=playerWeapon().mag;reloading=0;shotTimer=.2;respawnTime=0;viewHeight=playerPos.y;syncAimCamera()}
function shoot(){
 const w=playerWeapon(),handling=playerHandling();
 if(shotTimer>1e-7||reloading>0||respawnTime>0)return false;if(ammo<=0){reload();return false}
 syncAimCamera();scene.updateMatrixWorld(true);camera.getWorldDirection(aim);const origin=camera.position.clone();
 opponentAI?.hear(playerPos,'player');ammo--;magazines[equipped]=ammo;shotsFired++;
 shotTimer=Math.max(-.1,shotTimer)+w.interval;weaponMotion.fire(handling);aimSpring.impulse(handling.aim*28);muzzleTime=equipped===2?.025:.045;flash.visible=true;flash.rotation.z=Math.random()*6;
 if(!muted)gameAudio.weapon(ALL_WEAPONS[equipped]);if(ammo<=Math.max(1,Math.floor(w.mag*.15)))playSfx('low-ammo',{volume:.16});
 if(equipped!==4)ejectCasing(origin);if(equipped===0&&shotsFired%3===0){const mist=smokeMesh(flash.getWorldPosition(new THREE.Vector3()),0xb8c2b2,.09);scene.add(mist);addEffect({mesh:mist,life:.24,max:.24,smoke:true,billboard:true,expand:true,expandRate:.35,ownMat:true,opacity:.16,vel:new THREE.Vector3(0,.1,0)})}
 if(equipped===4){launchRocket(origin,aim.clone(),null,false,w.damage/weapons[equipped].damage,{radius:w.radius,projectile:w.projectile,selfDamage:w.selfDamage,jump:w.jump});return true}
 const traceOrigin=flash.getWorldPosition(new THREE.Vector3());const targets=[...worldMeshes,...botHitMeshes()],hits=new Map(),outcomes=[];let beamEnd=origin.clone().addScaledVector(aim,80);
 for(let p=0;p<w.pellets;p++){
  const spread=(equipped===5&&p<4?.016*w.core:w.spread)*(keys.has('MouseRight')?.72:1);
  const direction=aim.clone().add(new THREE.Vector3((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread)).normalize();ray.set(origin,direction);ray.far=90;
  const seen=new Set(),intersections=ray.intersectObjects(targets,false);let endpoint=origin.clone().addScaledVector(direction,70);
  for(const hit of intersections){
   endpoint=hit.point;const b=hit.object.userData.bot;
   if(!b){if(p===0||equipped===5&&p===6)impactEffect(hit,equipped===3?1.5:1);break}
   if(seen.has(b))continue;seen.add(b);const part=hit.object.userData.part||'torso',head=part==='head',damage=w.damage*(head?1.5:1);
   const packet=hits.get(b)||{damage:0,headDamage:0,part,point:hit.point.clone(),headPoint:null,parts:[]};packet.parts.push({part,damage});packet.damage+=damage;if(head){packet.headDamage+=damage;packet.headPoint=hit.point.clone()}packet.part=part;hits.set(b,packet);
   if(equipped!==3)break;
  }
  if(p===0)beamEnd=endpoint;if(equipped===5&&p%4===0)trail(origin.distanceTo(endpoint)<1.5?origin:traceOrigin,endpoint,w.color,.055);
 }
 trail(origin.distanceTo(beamEnd)<1.5?origin:traceOrigin,beamEnd,w.color,equipped===3?.27:.045,equipped===3?.035:.012);
 for(const [b,hit]of hits){
  const headKill=hit.headDamage>0&&hit.damage-hit.headDamage<b.hp;
  outcomes.push(damageBot(b,hit.damage,null,headKill?'head':hit.part,headKill?hit.headPoint:hit.point,{parts:hit.parts,weapon:weapons[equipped].name,impactType:ALL_WEAPONS[equipped],head:hit.headDamage>0,headKill,defer:true,origin,force:equipped===1?1.6:equipped===5?1.9:equipped===3?1.5:1}));
 }
 confirmOutcomes(outcomes);return true;
}

function reload(){if(reloading>0||ammo===playerWeapon().mag)return;if(weaponGroup.userData.heroRifle)weaponGroup.userData.heroRifle.emptyReload=ammo===0;if(weaponGroup.userData.nailer)weaponGroup.userData.nailer.emptyReload=ammo===0;if(weaponGroup.userData.heroTool)weaponGroup.userData.heroTool.emptyReload=ammo===0;reloading=playerWeapon().reload*(perks.reload?.65:1);reloadLength=reloading;reloadStage=0;playSfx('reload-out',{volume:.45})}
function switchWeapon(i){if(!owned.includes(i)||equipped===i)return;magazines[equipped]=ammo;equipped=i;ammo=magazines[i]??playerWeapon(i).mag;reloading=0;shotTimer=.22*playerWeapon(i).switch*(perks.quickdraw?.65:1);weaponMotion.switch();aimSpring.reset();buildWeapon();weaponGroup.visible=true;playSfx('equip',{volume:.4})}
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
 b.history??=new DamageHistory();b.history.record(killer?killer.name:'player',killer?killer.name:'YOU',options.weapon||weaponLabel(killer),result.damage,options.parts||[{part,damage:dmg}]);
 if(killer!==b)recordDamage(b,killer?killer.name:'player',result.damage);
 const origin=options.origin||(killer?killer.pos:playerPos);b.impactVector=b.pos.clone().sub(origin);b.impactVector.y=.15;b.impactVector.normalize().multiplyScalar(options.force||1);
 if(!result.killed){
  const impact=receiveImpact(b,{weapon:options.impactType||killer?.brain?.weaponType||ALL_WEAPONS[equipped],damage:result.damage,part,direction:b.impactVector.clone().normalize(),point});
  opponentAI?.damaged(b,killer?{id:killer.name,pos:killer.pos}:{id:'player',pos:playerPos},{...impact,damage:result.damage});
 }
 burst(point||b.pos.clone().add(new THREE.Vector3(0,1.3,0)),0xeef0e6,part==='head'?4:2);
 if(result.killed){
  b.dead=3;b.deathAge=0;b.deaths++;beginRagdoll(b,b.impactVector,part);awardAssists(b,killer?killer.name:'player');tintDummy(b);shatterPart(b,part,point);
  if(killer){killer.score=Math.max(0,killer.score+(killer===b?-100:result.points));if(killer!==b){killer.frags=(killer.frags||0)+1;if(head)killer.headshots=(killer.headshots||0)+1}feed(killer.name,b.name)}
  else{matchKills++;matchPoints+=result.points;if(head)headshotKills++;streak++;focus=Math.min(100,focus+18);credits+=25;if(perks.recovery&&respawnTime<=0)healPlayer(Math.max(health,Math.min(perks.armor?140:100,health+20)));
   if(streak>=3&&!streakReady){streakReady=true;notify(EQUIPMENT.streak.find(x=>x.id===equipment.streak).name.toUpperCase()+' READY · '+keyLabel(controls.bindings.streak.find(Boolean)||'' ))}
   feed('YOU',b.name);
  }
  burst(b.pos.clone().add(new THREE.Vector3(0,1,0)),0x858c88,8);
 }
 tintDummy(b);
 const feedbackResult={...result,head:result.killed?head:!!(options.head??part==='head')};
 if(!killer&&!options.defer)confirmOutcomes([feedbackResult]);return feedbackResult;
}
function damagePlayer(dmg,killer,options={}){
 if(respawnTime>0||health<=0||!Number.isFinite(dmg)||dmg<=0)return;const before=health;health=Math.max(0,health-dmg);tintPlayerArms();if(killer)recordDamage(playerCredit,killer.name,before-health);
 playerHistory.record(killer?killer.name:'self',killer?killer.name:'YOU',options.weapon||weaponLabel(killer),before-health,options.parts||[{part:options.head?'head':options.part||'torso',damage:before-health}]);
 const source=options.origin||killer?.pos;const bearing=source&&Math.hypot(source.x-playerPos.x,source.z-playerPos.z)>.1?Math.atan2(source.x-playerPos.x,source.z-playerPos.z):null;hurtFeedback.hit(before-health,perks.armor?140:100,bearing,killer?`${killer.name}:${killer.lifeId||0}`:'blast');
 if(hurtSoundCooldown<=0){playSfx('damage',{volume:.25});hurtSoundCooldown=.15}
 if(killer){weaponMotion.trauma=Math.min(.45,weaponMotion.trauma+.12)}
 if(health<=0&&before>0){awardAssists(playerCredit,killer?.name);deathCount++;streak=0;respawnTime=2.2;mouseDown=false;keys.delete('MouseRight');beginDeathView(killer);
  if(killer){killer.score+=options.head?150:100;killer.frags=(killer.frags||0)+1;if(options.head)killer.headshots=(killer.headshots||0)+1;feed(killer.name,'YOU')}else feed('THE ARENA','YOU');
  notify('RESPAWNING');playSfx('damage',{volume:.45});
 }
}

function weaponLabel(bot){return bot?weapons[ALL_WEAPONS.indexOf(bot.brain?.weaponType)]?.name||'Weapon':weapons[equipped].name}
function clearDeathView(){if(deathView?.highlight){scene.remove(deathView.highlight);deathView.fill.dispose();deathView.line.dispose()}deathView=null;$('death-recap').hidden=true;$('killer-tag').hidden=true;document.body.classList.remove('respawning')}
function beginDeathView(killer){
 clearDeathView();const outgoing=killer?.history?.snapshot('player')[0]||null;
 const recap={attackers:playerHistory.snapshot(),outgoing,killer:killer?{id:killer.name,name:killer.name,health:Math.max(0,killer.hp)}:null};
 deathView={position:playerPos.clone(),killer,lifeId:killer?.lifeId,recap,pairs:[],lastTarget:killer?.pos.clone().add(new THREE.Vector3(0,1.1,0))};
 $('death-recap').innerHTML=recapHTML(recap);$('death-recap').hidden=false;document.body.classList.add('respawning');
 if(!killer)return;
 const highlight=new THREE.Group(),fill=new THREE.MeshBasicMaterial({color:0xd9ef45,transparent:true,opacity:.12,depthTest:false,depthWrite:false}),line=new THREE.LineBasicMaterial({color:0xeaff67,transparent:true,opacity:1,depthTest:false,depthWrite:false});
 Object.assign(deathView,{highlight,fill,line});killer.group.traverse(o=>{if(!o.isMesh||!o.userData.healthShell)return;if(!killerEdges.has(o.geometry))killerEdges.set(o.geometry,new THREE.EdgesGeometry(o.geometry,30));const ghost=new THREE.Mesh(o.geometry,fill),edge=new THREE.LineSegments(killerEdges.get(o.geometry),line);ghost.matrixAutoUpdate=edge.matrixAutoUpdate=false;ghost.renderOrder=990;edge.renderOrder=991;highlight.add(ghost,edge);deathView.pairs.push({original:o,ghost,edge})});scene.add(highlight);$('killer-tag').textContent=killer.name;$('killer-tag').hidden=false;
}
function updateDeathView(dt){
 if(!deathView||respawnTime<=0)return;const d=deathView,b=d.killer,valid=b&&b.lifeId===d.lifeId;
 if(valid){if(b.dead&&b.ragdoll)d.lastTarget.copy(b.ragdoll.nodes.chest.p);else d.lastTarget.copy(b.pos).add(new THREE.Vector3(0,1.1,0))}
 camera.position.copy(d.position);
 if(d.lastTarget){const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(d.position,d.lastTarget,up));camera.quaternion.slerp(q,1-Math.exp(-dt*12));camera.updateMatrixWorld(true)}
 if(d.highlight){d.highlight.visible=!!valid;if(valid){b.group.updateMatrixWorld(true);for(const p of d.pairs){let visible=true;for(let o=p.original;o&&o!==b.group.parent;o=o.parent)visible=visible&&o.visible;p.ghost.visible=p.edge.visible=visible;p.ghost.matrix.copy(p.original.matrixWorld);p.edge.matrix.copy(p.original.matrixWorld)}const screen=b.pos.clone().add(new THREE.Vector3(0,2.12,0)).project(camera);$('killer-tag').hidden=screen.z>1||screen.z< -1;$('killer-tag').style.left=`${(screen.x*.5+.5)*100}%`;$('killer-tag').style.top=`${(-screen.y*.5+.5)*100}%`}else $('killer-tag').hidden=true}
 $('recap-countdown').textContent=Math.max(0,respawnTime).toFixed(1);$('recap-progress').style.width=`${respawnTime/2.2*100}%`;
}

const feeds=[];function feed(a,b){feeds.unshift(`${a} &nbsp;›&nbsp; ${b}`);feeds.length=Math.min(4,feeds.length);$('killfeed').innerHTML=feeds.join('<br>')}
function trail(a,b,c,life=.1,width=.015){const d=b.clone().sub(a),m=new THREE.Mesh(boxGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(width>=.03?4:1.1),transparent:true,opacity:1}));m.position.copy(a).addScaledVector(d,.5);m.scale.set(width,width,d.length());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());scene.add(m);addEffect({mesh:m,life,max:life,vel:null,ownMat:true})}
function burst(pos,c,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(sphereGeo,mat(c));m.position.copy(pos);m.scale.setScalar(.05+Math.random()*.08);scene.add(m);addEffect({mesh:m,life:.25+Math.random()*.3,max:.55,vel:new THREE.Vector3((Math.random()-.5)*6,Math.random()*5,(Math.random()-.5)*6)})}}
function launchRocket(pos,dir,owner,grenade=false,damageScale=1,mods={}){const m=new THREE.Mesh(sphereGeo,mat(grenade?0x202a30:0xd9ef45));m.scale.setScalar(grenade?.16:.13);m.position.copy(pos).addScaledVector(dir,.8);scene.add(m);rockets.push({mesh:m,vel:dir.clone().multiplyScalar(grenade?(equipment.throwable==='quick'&&!owner?12:15):24*(mods.projectile||1)).add(new THREE.Vector3(0,grenade?5:0,0)),life:grenade?(equipment.throwable==='quick'&&!owner?.85:1.6):4,owner,grenade,damageScale,mods,impact:grenade&&!owner&&equipment.throwable==='impact',trail:0})}
function explode(pos,owner,grenade=false,damageScale=1,mods={}){burst(pos,0xd9ef45,25);playSfx('explosion',{pos,volume:.85,curve:'explosion',bus:'explosions',priority:3});const radius=(grenade?7:5.5)*(mods.radius||1),outcomes=[];weaponMotion.blast(playerPos.distanceTo(pos));for(const b of bots){const d=b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos);if(d<radius&&visible(pos,b.pos.clone().add(new THREE.Vector3(0,1,0)))){if(!b.dead)outcomes.push(damageBot(b,((grenade?150:135)*(1-d/radius)+15)*damageScale,owner,'torso',null,{defer:true,origin:pos,force:1.5,impactType:'rocket',weapon:grenade?'Grenade':'THUMPER'}));if(b.dead)for(const name of Object.keys(b.parts))if(d<radius*.65)shatterPart(b,name)}}if(!owner)confirmOutcomes(outcomes);for(let i=0;i<5;i++){const smoke=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:i%2?0x182127:0x7b8984,transparent:true,opacity:.25,depthWrite:false}));smoke.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.5,Math.random(),(Math.random()-.5)*1.5));smoke.scale.setScalar(.3+Math.random()*.4);scene.add(smoke);addEffect({mesh:smoke,life:.55,max:.55,expand:true,smoke:true,ownMat:true,opacity:.25,vel:new THREE.Vector3(0,.6,0)})}const d=playerPos.distanceTo(pos);if(d<radius&&visible(pos,playerPos)){damagePlayer((grenade?90:60)*(1-d/radius)*damageScale*(mods.selfDamage||1),owner,{origin:pos,weapon:grenade?'Grenade':'THUMPER',part:'torso'});if(!grenade&&health>0){tmp.copy(playerPos).sub(pos).normalize();vel.addScaledVector(tmp,15*(1-d/radius)*(mods.jump||1));vy=Math.max(vy,(10*(1-d/radius)+3)*(mods.jump||1))}}const m=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:0xd9ef45,wireframe:true,transparent:true,opacity:.7}));m.position.copy(pos);m.scale.setScalar(1);scene.add(m);addEffect({mesh:m,life:.35,max:.35,expand:true,ownMat:true})}
function retireEffect(e){scene.remove(e.mesh);if(e.ownMat)e.mesh.material.dispose()}
function addEffect(e){
 if(e.decal){const decals=effects.filter(f=>f.decal);if(decals.length>=FEEL.maxDecals){const old=decals[0];retireEffect(old);effects.splice(effects.indexOf(old),1)}}
 if(effects.length>=FEEL.maxEffects)retireEffect(effects.shift());effects.push(e);
}
function impactEffect(hit,scale=1){
 if(!hit.face)return;const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld),m=new THREE.Mesh(targetGeo,new THREE.MeshBasicMaterial({color:0x182127,transparent:true,opacity:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 m.position.copy(hit.point).addScaledVector(normal,.012);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);m.scale.setScalar(.035*scale+Math.random()*.025);scene.add(m);addEffect({mesh:m,life:7,max:7,decal:true,ownMat:true,opacity:.6});const dark=(hit.object.material?.color?.getHSL({}).l??.6)<.2;for(let i=0;i<4;i++){const spark=dark&&i<2,chip=new THREE.Mesh(spark?boxGeo:shardGeo,spark?new THREE.MeshBasicMaterial({color:new THREE.Color(3.5,2.5,1),transparent:true,depthWrite:false}):mat(0xb3bdb0));chip.position.copy(hit.point).addScaledVector(normal,.025);chip.scale.set(spark?.008:.025,spark?.008:.018,spark?.10:.035);scene.add(chip);const direction=normal.clone().multiplyScalar(1.5+Math.random()*2).add(new THREE.Vector3((Math.random()-.5)*2,Math.random()*1.5,(Math.random()-.5)*2));addEffect({mesh:chip,life:spark?.12:.35,max:spark?.12:.35,vel:direction,spin:spark?null:new THREE.Vector3(9,13,3),ownMat:spark,streak:spark})}if(!dark){const dust=smokeMesh(hit.point.clone().addScaledVector(normal,.04),0xaeb9ac,.14);scene.add(dust);addEffect({mesh:dust,life:.28,max:.28,vel:normal.clone().multiplyScalar(.25),smoke:true,billboard:true,expand:true,expandRate:.45,ownMat:true,opacity:.14})}playSfx('impact',{pos:hit.point,volume:.1,curve:'foley',bus:'world',priority:.4});
}
function ejectCasing(){if(equipped===4||equipped===3)return;const m=new THREE.Mesh(barrelGeo,MATERIALS.casing);m.scale.set(.011,equipped===5?.075:.045,.011);weaponGroup.updateWorldMatrix(true,false);m.position.set(.13,equipped===1?.096:.05,-.11).applyMatrix4(weaponGroup.matrixWorld);scene.add(m);const v=new THREE.Vector3(2.4+Math.random(),1.0,-.35).applyQuaternion(camera.quaternion);addEffect({mesh:m,life:1.1,max:1.1,vel:v,spin:new THREE.Vector3(13,7,11),casing:true})}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.life<=0){retireEffect(e);effects.splice(i,1);continue}if(e.vel){e.vel.y-=(e.smoke?-1:14)*dt;e.mesh.position.addScaledVector(e.vel,dt);if(e.casing){const floor=floorAt(e.mesh.position.x,e.mesh.position.z,e.mesh.position.y);if(e.mesh.position.y<floor+.035){e.mesh.position.y=floor+.035;e.vel.y=Math.abs(e.vel.y)*.25;e.vel.x*=.65;e.vel.z*=.65}}}if(e.streak&&e.vel){e.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tmp.copy(e.vel).normalize());e.mesh.scale.z=Math.max(.035,e.vel.length()*.035)}if(e.spin){e.mesh.rotation.x+=e.spin.x*dt;e.mesh.rotation.y+=e.spin.y*dt;e.mesh.rotation.z+=e.spin.z*dt}if(e.billboard)e.mesh.quaternion.copy(camera.quaternion);if(e.expand)e.mesh.scale.addScalar((e.expandRate??(e.smoke?2:16))*dt);if(e.ownMat)e.mesh.material.opacity=(e.opacity??1)*Math.min(1,e.life/(e.decal?1:e.max))}}
function syncAimCamera(){if(deathView&&respawnTime>0){camera.position.copy(deathView.position);return}camera.position.copy(playerPos);camera.position.y=viewHeight+(grounded?Math.sin(moveClock*1.7)*.025*settings.motion:0);camera.rotation.set(pitch+aimSpring.x,yaw,0);camera.updateMatrixWorld(true)}
function present(dt){
 const w=playerWeapon(),h=playerHandling(),aiming=respawnTime<=0&&keys.has('MouseRight')&&reloading<=0,sprinting=!crouched&&keys.has('ShiftLeft')&&Math.hypot(vel.x,vel.z)>2&&!aiming&&!mouseDown;
 weaponMotion.step(dt,h,{aiming,sprinting,turnX,turnY,adsSpeed:1/(w.ads*(perks.quickdraw?.8:1))});turnX*=Math.exp(-dt*20);turnY*=Math.exp(-dt*20);aimSpring.step(dt,180,25);
 viewHeight=grounded?THREE.MathUtils.damp(viewHeight,playerPos.y,22,dt):playerPos.y;syncAimCamera();updateDeathView(dt);
 const ads=weaponMotion.ads,k=weaponMotion.kick.x,land=weaponMotion.land.x,m=settings.motion,phase=moveClock*1.7;
 const reloadP=reloading>0?1-reloading/reloadLength:0,reloadPose=Math.sin(reloadP*Math.PI),pump=equipped===5?Math.sin(clamp((weaponMotion.shotAge-.12)/.25,0,1)*Math.PI):0;
 ray.set(camera.position,camera.getWorldDirection(aim));ray.far=1.4;nearWall=THREE.MathUtils.damp(nearWall,ray.intersectObjects(worldMeshes,false)[0]?1:0,12,dt);
 weaponGroup.position.set(.31*(1-ads)-(weaponGroup.userData.sightX||0)*.85*ads+Math.sin(phase*.5)*.012*m*(1-ads)-weaponMotion.swayX*m,-.3+(.3-weaponGroup.userData.opticY*.85)*ads+Math.abs(Math.cos(phase))*.012*m*(1-ads)-land*.18-k*h.lift-reloadPose*(weaponGroup.userData.nailer?.065:.055)-weaponMotion.equip*.5,-.5+k*h.back+nearWall*.28);
 weaponGroup.rotation.set(k*h.rx-reloadPose*(weaponGroup.userData.nailer?.24:.25)+weaponMotion.sprint*.16+nearWall*.55+land*.12, k*h.ry+weaponMotion.swayX*m, k*h.roll+reloadPose*h.reloadRoll+weaponMotion.sprint*.12);
 if(weaponGroup.userData.nailer)animateNailer(weaponGroup.userData.nailer,{reload:reloadP,reloading:reloading>0,shotAge:weaponMotion.shotAge,ammo});
 if(weaponGroup.userData.heroTool)animateToolWeapon(weaponGroup.userData.heroTool,{reload:reloadP,reloading:reloading>0,shotAge:weaponMotion.shotAge,ammo});
 weaponGroup.rotation.z+=Math.sin(elapsed*49)*weaponMotion.trauma*.012*m;
 const moving=weaponGroup.userData.moving;if(moving)for(const part of moving){part.mesh.position.copy(part.base);part.mesh.position.y-=reloadPose*part.mag*.25;part.mesh.position.z+=pump*part.pump*.16+Math.max(0,1-weaponMotion.shotAge/.07)*part.slide*.06}
 camera.fov=THREE.MathUtils.damp(camera.fov,85+((w.optic||equipped===3?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(65)/2)/w.zoom)):h.adsFov)-85)*ads+(slow?6:0)+weaponMotion.sprint*3,12,dt);camera.updateProjectionMatrix();camera.getWorldDirection(aim);gameAudio.updateListener(camera.position,aim);gameAudio.setSlow(slow);
 weaponGroup.visible=respawnTime<=0;muzzleTime=Math.max(0,muzzleTime-dt);flash.visible=muzzleTime>0&&!reloading;flash.rotation.z=Math.random()*6;flash.scale.setScalar(.65+Math.random()*.45);weaponGroup.userData.muzzleLight.intensity=flash.visible?16:0;
 feedback.step(dt);toastTime=Math.max(0,toastTime-dt);
 $('hitmarker').className=feedback.kind;$('hitmarker').style.opacity=feedback.left>0?1:0;$('hitmarker').style.transform=`translate(-50%,-50%) scale(${1+(feedback.kind.includes('kill')?.6:0)+Math.max(0,feedback.left/Math.max(.01,feedback.duration))*.14})`;
 $('scorepop').textContent=feedback.points?`+${feedback.points} ${feedback.label}`:'';$('scorepop').style.opacity=Math.min(1,feedback.scoreLeft*5);
 assistNotice.left=Math.max(0,assistNotice.left-dt);$('assistpop').textContent=assistNotice.count?`+${assistNotice.points} ${assistNotice.count>1?assistNotice.count+' ASSISTS':'ASSIST'}`:'';$('assistpop').style.opacity=Math.min(1,assistNotice.left*4);
 const hurt=hurtFeedback.step(dt,health,perks.armor?140:100,yaw,{alive:respawnTime<=0&&health>0,motion:settings.motion});
 $('damage').style.opacity=hurt.flash*.55;$('healthDanger').style.opacity=hurt.edge;$('healthDanger').className=hurt.critical?'critical':'';
 for(let i=0;i<HURT.maxDirections;i++){const cue=hurt.directions[i],node=$('damageArc'+i);node.style.opacity=cue?cue.opacity:0;if(cue){node.className='damage-arc '+cue.kind;node.style.transform=`rotate(${cue.rotation}rad) scale(${cue.scale})`}}
 $('health').style.color=hurt.critical?'#ff7863':health<=(perks.armor?140:100)*.55?'#ffc183':'';
 if(hurt.beat)playSfx('heartbeat',{volume:.22,bus:'ui',priority:1});
 $('toast').style.opacity=toastTime>0?1:0;

 lastHUD+=dt;if(lastHUD>.1){lastHUD=0;updateHUD()}
}
function createOpponentAI(){
 return new ArenaAI({navigation,round,random:()=>Math.random(),world:{
  pickups,
  projectiles:()=>rockets.map(r=>({pos:r.mesh.position,velocity:r.vel,owner:r.owner,grenade:r.grenade})),
  actors:()=>[
   {id:'player',pos:{x:playerPos.x,y:playerPos.y-eyeHeight,z:playerPos.z},eye:playerPos,hp:health,alive:respawnTime<=0,spawnAge:(opponentAI?.clock||0)-playerSpawnAt},
   ...bots.map(b=>({id:b.name,pos:b.pos,eye:{x:b.pos.x,y:b.pos.y+1.65-(b.anim?.crouch||0)*.5,z:b.pos.z},hp:b.hp,alive:!b.dead,spawnAge:(opponentAI?.clock||0)-(b.brain?.spawnAt||0)}))
  ],
  canSee:(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z)),
  elevator:rideElevator,
  swim:(b,destination)=>{b.brain.swimY=destination.y;b.brain.swimUntil=opponentAI.clock+.2},
  move:(b,dx,dz)=>{if(!MAP.brushes){move(b.pos,dx,dz,b.pos.y);return}const p=moveCharacter(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:1.9},{x:dx,y:0,z:dz},{grounded:Math.abs(b.vy)<.1,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});b.pos.set(p.x,p.feet,p.z)},
  physics:(b,brain,dt)=>{
   const feet=b.pos.y,fallSpeed=b.vy,water=waterAt(b.pos.x,b.pos.y+.12,b.pos.z);
   if(water)b.vy=swimVertical(b.vy,b.pos.y,1.9,water.top,dt,brain.swimUntil>opponentAI.clock?clamp((brain.swimY-b.pos.y)*.7,-1,1):0);else b.vy-=23*dt;
   const contact=moveCharacter(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:1.9},{x:0,y:b.vy*dt,z:0},{bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});b.pos.y=contact.feet;
   if(contact.ceiling&&b.vy>0)b.vy=0;
   if(contact.grounded&&b.vy<=0){if(fallSpeed< -4&&!muted&&!water)gameAudio.footstep(new THREE.Vector3(b.pos.x,contact.feet+.15,b.pos.z),{metal:contact.feet>2,landing:true});if(brain.lastFloor>=2.9&&contact.feet<1)opponentAI.stats.drops++;brain.lastFloor=contact.feet;b.vy=0;if(brain.flight){brain.flight=null;brain.pathIn=0}}
   if(brain.flight){brain.flight.age+=dt;if(brain.flight.age>3){brain.flight=null;brain.pathIn=0}}
   if(!brain.flight)for(const link of navigation.pads)if(Math.abs(b.pos.y-link.y)<.3&&Math.abs(b.vy)<.1&&Math.hypot(b.pos.x-link.x,b.pos.z-link.z)<1.25){const t=launchTime(link.power,link.to.y-b.pos.y);brain.flight={vx:(link.to.x-b.pos.x)/t,vz:(link.to.z-b.pos.z)/t,age:0};b.vy=link.power;opponentAI.stats.pads++;break}
  },
  fire:fireBotWeapon,
  equip:(b,weapon)=>{const gun=buildDummyGun(b.parts.rightArm,weapon);gun.traverse(m=>{m.userData.bot=b;m.userData.part='rightArm'})},
  telegraph:(b,point,dt)=>{if(b.brain.charge<=dt*1.5)playSfx('charge',{pos:b.pos.clone().add(new THREE.Vector3(0,1.3,0)),volume:.4,curve:'weapon',bus:'world',priority:3});b.laserIn=(b.laserIn||0)-dt;if(b.laserIn<=0){const origin=b.pos.clone().add(new THREE.Vector3(0,1.3,0)),end=new THREE.Vector3(point.x,point.y,point.z);const dir=end.clone().sub(origin).normalize();ray.set(origin,dir);ray.far=origin.distanceTo(end);const hit=ray.intersectObjects(worldMeshes,false)[0];trail(origin,hit?.point||end,0xd9ef45,.12,.012);b.laserIn=.1}},
  collect:(b,brain)=>{for(const p of pickups){if(p.kind!=='health'||p.timer>0||Math.hypot(b.pos.x-p.x,b.pos.z-p.z)>(p.amount===5?.65:1.1)||Math.abs(b.pos.y-p.y)>1.1)continue;const hp=healthAfterPickup(b.hp,100,p);if(hp===b.hp)continue;healBot(b,hp);p.timer=p.respawn;p.mesh.visible=false;brain.thinkIn=0;opponentAI.stats.pickups++}},
  animate:(b,brain,dt)=>{
   animateDummy(b,brain,dt,floorAt);
   if(b.anim.footfall&&b.vy===0){const pos=b.pos.clone().add(new THREE.Vector3(0,.15,0));if(!muted)gameAudio.footstep(pos,{metal:b.pos.y>2,quiet:b.anim.crouch>.5});opponentAI.hear(pos,b,b.anim.crouch>.5?5:10)}
   if(brain.reload>0&&!brain.wasReloading)playSfx('reload-out',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});
   if(brain.reload<=0&&brain.wasReloading)playSfx('bolt',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});brain.wasReloading=brain.reload>0;
   brain.previous={x:b.pos.x,y:b.pos.y,z:b.pos.z};
  }

 }});
}
function fireBotWeapon(b,point,w){
 fireDummy(b,w.type);
 const origin=b.pos.clone().add(new THREE.Vector3(0,1.28-(b.anim?.crouch||0)*.45,0)),aimPoint=new THREE.Vector3(point.x,point.y,point.z);
 opponentAI.hear(b.pos,b);!muted&&gameAudio.weapon(w.type,{pos:origin});
 if(w.type==='rocket'){aimPoint.y-=.65;launchRocket(origin,aimPoint.sub(origin).normalize(),b,false,w.splashScale);return}
 scene.updateMatrixWorld(true);const targets=botHitMeshes().filter(m=>m.userData.bot!==b),playerBox=new THREE.Box3(new THREE.Vector3(playerPos.x-.35,playerPos.y-eyeHeight+.15,playerPos.z-.35),new THREE.Vector3(playerPos.x+.35,playerPos.y+.12,playerPos.z+.35));
 const dir=aimPoint.sub(origin).normalize(),hits=new Map();let playerHits=0,playerHead=false,nearShot=null;const playerParts=[];
 for(let i=0;i<(w.pellets||1);i++){
  const shot=dir.clone().add(new THREE.Vector3((Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread)).normalize();ray.set(origin,shot);ray.far=w.range;
  const hit=ray.intersectObjects([...worldMeshes,...targets],false)[0],playerPoint=respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace?ray.ray.intersectBox(playerBox,new THREE.Vector3()):null;
  const pd=playerPoint?origin.distanceTo(playerPoint):Infinity,hitDistance=hit?origin.distanceTo(hit.point):Infinity;let end=origin.clone().addScaledVector(shot,w.range);
  if(pd<=w.range&&pd<hitDistance){playerHits++;const part=bodyPartAt(playerPoint,playerPos,yaw,eyeHeight);playerParts.push({part,damage:w.damage*(part==='head'?1.5:1)});playerHead=playerHead||part==='head';end=playerPoint}else if(hit){end=hit.point;const victim=hit.object.userData.bot;if(victim){const head=hit.object.userData.part==='head',entry=hits.get(victim)||{damage:0,headDamage:0,part:hit.object.userData.part,point:hit.point,parts:[]};const damage=w.damage*(head?1.5:1);entry.parts.push({part:hit.object.userData.part,damage});entry.damage+=damage;if(head){entry.headDamage+=damage;entry.part='head'}hits.set(victim,entry)}else impactEffect(hit,w.type==='rail'?2:1)}
  if(respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace){const near=nearMissSegment(origin,end,playerPos,1.5,crouched?.35:.65);if(near&&(!nearShot||near.distance<nearShot.distance))nearShot=near}
  if(i===0||w.type==='shotgun'&&i===4)trail(origin,end,0xe9f69a,w.type==='rail'?.23:.07,w.type==='rail'?.035:.012);
 }
 if(playerHits)damagePlayer(w.damage*playerHits*(playerHead?1.5:1),b,{head:playerHead,parts:playerParts,weapon:weaponLabel(b)});else if(nearShot&&respawnTime<=0){
  hurtFeedback.nearMiss(Math.atan2(origin.x-playerPos.x,origin.z-playerPos.z),`${b.name}:${b.lifeId||0}`);
  if(nearMissCooldown<=0){nearMissCooldown=.2;playSfx('whiz',{pos:nearShot.point,volume:.35,bus:'world',priority:4})}
 }for(const [victim,hit]of hits)damageBot(victim,hit.damage,b,hit.part,hit.point,{head:hit.headDamage>0,headKill:hit.headDamage>0&&hit.damage-hit.headDamage<victim.hp,origin,parts:hit.parts,weapon:weaponLabel(b),impactType:w.type});
 const discharge=createMuzzleFlash();discharge.position.copy(origin).addScaledVector(dir,.45);discharge.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),dir);discharge.scale.setScalar(.5);scene.add(discharge);addEffect({mesh:discharge,life:.045,max:.045,ownMat:true});
}
function updateBots(dt){
 for(const b of bots)if(b.dead){b.dead-=dt;b.deathAge+=dt;stepRagdoll(b,dt,blocks);if(b.dead<=0)spawnBot(b)}
 opponentAI?.update(dt);
}

function update(dt){for(let left=Math.min(dt,.15);left>1e-7&&mode==='play';){const h=Math.min(left,FEEL.tick);updateStep(h);left-=h}if(mode==='play')present(dt)}
function updateStep(dt){
 hurtSoundCooldown=Math.max(0,hurtSoundCooldown-dt);
 slow=keys.has('KeyQ')&&focus>0&&respawnTime<=0;const worldDt=dt*(slow?.22:1);focus=clamp(focus+(slow?-29:perks.focus?15:10)*dt,0,100);if(focus<=0)keys.delete('KeyQ');$('slowTint').style.opacity=slow?1:0;
 stepElevators(worldDt);
 if(respawnTime<=0){yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.7;pitch=clamp(pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.4,-1.5,1.5)}
 time=Math.max(0,time-dt);if(time===0){endMatch();return}shotTimer-=dt*(slow?.8:1);if(!mouseDown)shotTimer=Math.max(0,shotTimer);nearMissCooldown=Math.max(0,nearMissCooldown-dt);if(reloading>0){reloading-=dt;if(reloadStage===0&&reloading<reloadLength*.45){reloadStage=1;playSfx('reload-in',{volume:.45})}if(reloading<=0){reloading=0;ammo=playerWeapon().mag;magazines[equipped]=ammo;playSfx('bolt',{volume:.45})}}
 if(respawnTime>0){respawnTime-=dt;if(respawnTime<=0)spawnPlayer()}else{
 updateStance();
 const swimming=waterAt(playerPos.x,playerPos.y-eyeHeight+.12,playerPos.z);
 const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),speed=(swimming?5.2:crouched?3.7:keys.has('ShiftLeft')?11:7.5)*(perks.speed?1.2:1)*playerWeapon().move*(slow?.85:1);let ix=side*Math.cos(yaw)-forward*Math.sin(yaw),iz=-side*Math.sin(yaw)-forward*Math.cos(yaw);const len=Math.hypot(ix,iz)||1;ix=ix/len*speed;iz=iz/len*speed;if(swimming)playerPadFlight=null;if(playerPadFlight){playerPadFlight.age+=dt;vel.x=playerPadFlight.vx+ix*.15;vel.z=playerPadFlight.vz+iz*.15;if(playerPadFlight.age>3)playerPadFlight=null}else{const next=swimming?swimHorizontal(vel.x,vel.z,ix,iz,waterImmersion(playerPos.y-eyeHeight,crouched?COLLISION.crouching:COLLISION.standing,swimming.top),dt):accelerate(vel.x,vel.z,ix,iz,dt,grounded,perks.speed?1.2:1);vel.x=next.x;vel.z=next.z;}const previousX=playerPos.x,previousZ=playerPos.z;
 coyoteTime=grounded?FEEL.coyote:Math.max(0,coyoteTime-dt);jumpBuffered=Math.max(0,jumpBuffered-dt);if(keys.has('Space')&&!lastJumpHeld)jumpBuffered=FEEL.jumpBuffer;lastJumpHeld=keys.has('Space');if(!swimming&&jumpBuffered>0&&coyoteTime>0){vy=FEEL.jumpSpeed;grounded=false;coyoteTime=jumpBuffered=0}const fallSpeed=vy;if(swimming)vy=swimVertical(vy,playerPos.y-eyeHeight,crouched?COLLISION.crouching:COLLISION.standing,swimming.top,dt,keys.has('Space')?1:keys.has('KeyC')?-1:0);else vy-=23*dt;const contact=moveCharacter(blocks,{x:playerPos.x,z:playerPos.z,feet:playerPos.y-eyeHeight,radius:COLLISION.radius,height:crouched?COLLISION.crouching:COLLISION.standing},{x:vel.x*dt,y:vy*dt,z:vel.z*dt},{grounded,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});
 playerPos.set(contact.x,contact.feet+eyeHeight,contact.z);for(const normal of contact.normals){const into=vel.x*normal.x+vel.z*normal.z;if(into<0){vel.x-=normal.x*into;vel.z-=normal.z*into}}
 if(contact.ceiling&&vy>0)vy=0;grounded=contact.grounded;if(grounded){if(fallSpeed< -4)weaponMotion.landed(fallSpeed);if(fallSpeed< -4&&!muted)gameAudio.footstep(new THREE.Vector3(playerPos.x,contact.feet+.1,playerPos.z),{self:true,metal:contact.feet>2,landing:true});vy=0;playerPadFlight=null}const travelled=Math.hypot(playerPos.x-previousX,playerPos.z-previousZ);

 if(grounded&&!swimming){stepDistance+=travelled;if(stepDistance>(keys.has('ShiftLeft')?2.45:2.05)){stepDistance=0;if(!muted)gameAudio.footstep(playerPos,{self:true,metal:playerPos.y>3.7,quiet:crouched});opponentAI?.hear(playerPos,'player',crouched?4:keys.has('ShiftLeft')?14:9)}}else stepDistance=0;
 if(mouseDown&&shotTimer<=0)shoot();moveClock+=travelled;for(const p of pickups){if(p.kind==='pad'){if(Math.hypot(playerPos.x-p.x,playerPos.z-p.z)<1.4&&grounded&&Math.abs(playerPos.y-eyeHeight-p.y)<.3){const t=launchTime(p.power,p.landing.y-(playerPos.y-eyeHeight));playerPadFlight={vx:(p.landing.x-playerPos.x)/t,vz:(p.landing.z-playerPos.z)/t,age:0};vy=p.power;grounded=false;playSfx('pad',{volume:.5})}}else if(p.timer<=0&&Math.hypot(playerPos.x-p.x,playerPos.z-p.z)<(p.amount===5?.65:1.1)&&Math.abs(playerPos.y-eyeHeight-p.y)<1.1){
  if(p.kind==='focus'){if(focus>=100)continue;focus=100;notify('SLOW MOTION RECHARGED')}
  else{const hp=healthAfterPickup(health,perks.armor?140:100,p);if(hp===health)continue;const gain=hp-health;healPlayer(hp);notify(`+${gain} HEALTH`)}
  p.timer=p.respawn||15;p.mesh.visible=false;playSfx('pickup',{volume:p.amount===5?.22:.4});
 }}
 }
 updateBots(worldDt);
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.life-=worldDt;const old=r.mesh.position.clone();if(r.grenade)r.vel.y-=15*worldDt;r.mesh.position.addScaledVector(r.vel,worldDt);r.trail-=worldDt;if(r.trail<0){trail(old,r.mesh.position,0xd9ef45,.18,.04);r.trail=.04}const pos=r.mesh.position;const contact=blocked(pos.x,pos.z,pos.y-.1,.1)||pos.y<.15||(r.owner&&respawnTime<=0&&playerPos.clone().add(new THREE.Vector3(0,-.45,0)).distanceTo(pos)<.7)||bots.some(b=>b!==r.owner&&!b.dead&&b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos)<.65);if(r.life<=0||contact){if(r.grenade&&!r.impact&&r.life>0){r.mesh.position.copy(old);r.vel.multiplyScalar(.55);r.vel.y=Math.abs(r.vel.y)+2}else{explode(contact&&(!r.grenade||r.impact)?old:pos,r.owner,r.grenade,r.damageScale,r.mods);scene.remove(r.mesh);rockets.splice(i,1)}}}
 for(const p of pickups){if(p.kind==='pad')continue;if(p.timer>0){p.timer-=worldDt;if(p.timer<=0)p.mesh.visible=true}p.mesh.rotation.y+=worldDt;p.mesh.position.y=p.baseY+Math.sin(elapsed*2)*.06}

}
function activateStreak(){const kind=equipment.streak;notify(EQUIPMENT.streak.find(x=>x.id===kind).name.toUpperCase());if(kind==='surge'){healPlayer(Math.max(health,perks.armor?140:100));focus=100;playSfx('pickup',{volume:.6})}else if(kind==='barrage'){playSfx('rocket',{volume:.5,bus:'self'});syncAimCamera();camera.getWorldDirection(aim);for(const angle of [-.15,0,.15])launchRocket(camera.position,aim.clone().applyAxisAngle(up,angle),null)}else for(const b of bots.filter(b=>!b.dead))explode(b.pos.clone().add(new THREE.Vector3(0,.5,0)),null)}
const upgrades=[
 ...weapons.map((w,j)=>({id:`gun${j}`,category:w.label.toUpperCase()+' / '+weaponSlot(j),name:w.name,desc:w.desc,price:w.price||220,gun:j})),
 {id:'reload',category:'PERK',name:'Sleight of hand',desc:'35% faster reloads.',price:180},
 {id:'speed',category:'PERK',name:'Lightweight',desc:'20% faster movement.',price:220},
 {id:'armor',category:'PERK',name:'Juggernaut',desc:'Spawn with 140 health.',price:240},
 {id:'focus',category:'PERK',name:'Deep focus',desc:'50% faster slow-motion recharge.',price:200},
 {id:'frags',category:'THROWABLE',name:'Bandolier',desc:'4 grenades per round.',price:160},
 {id:'quickdraw',category:'PERK',name:'Quickdraw',desc:'20% faster aiming. 35% faster weapon switching.',price:180},
 {id:'recovery',category:'PERK',name:'Recovery',desc:'Kills restore 20 health, up to your spawn health.',price:210}
];
function saveRun(){localStorage.setItem('dh-run',JSON.stringify({mapId:MAP.id,round,credits,owned,equipped,perks,builds,equipment,startingWeapon,shopOffers,phase:mode==='shop'||mode==='results'?'shop':'match'}))}
function endMatch(){$('panel').className='panel';clearDeathView();const r=rank();mode='results';gameAudio.stopWorld();mouseDown=false;slow=false;document.exitPointerLock?.();$('hud').hidden=true;weaponGroup.visible=false;$('slowTint').style.opacity=0;$('damage').style.opacity=0;const survived=r<=3;const reward=[250,190,150][r-1]||0;if(survived)credits+=reward;best=Math.max(best,round);localStorage.setItem('dh-best',best);if(survived)saveRun();else localStorage.removeItem('dh-run');$('panel').hidden=false;$('panel').className='panel results-panel';$('panel').innerHTML=`<div class="results-shell"><div class="results-title"><span>ROUND ${String(round).padStart(2,'0')}</span><h2>${survived?'ROUND COMPLETE':'RUN OVER'}</h2></div><div class="results-summary"><strong>${r}<small>${['ST','ND','RD'][r-1]||'TH'}</small></strong><span>${survived?`+${reward}<small>CREDITS</small>`:`${best}<small>BEST ROUND</small>`}</span></div><div class="result-table" role="table" aria-label="Match results"><div class="result-row result-head" role="row"><span>PLACE</span><span>PLAYER</span><span>POINTS</span><span>KILLS</span><span>ASSISTS</span><span>DEATHS</span></div>${rankList().map((b,i)=>`<div class="result-row ${b.player?'you':''} ${i===2?'cutoff':''}" role="row"><span>${i+1}</span><b>${b.name}</b><strong>${b.score}</strong><span>${b.kills}</span><span>${b.assists}</span><span>${b.deaths}</span></div>`).join('')}</div><div class="panel-actions"><button class="primary" id="resultnext">${survived?'LOADOUT':'NEW RUN'}</button><button class="textbutton" id="backmenu">MAIN MENU</button></div></div>`;$('resultnext').onclick=()=>survived?showShop():startRandomMatch();$('backmenu').onclick=mainMenu}
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
 on('nextmatch',()=>{if(shopInspect)return;round++;startRandomMatch(true)});
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
function mainMenu(){clearDeathView();hurtFeedback.reset();$('damage').style.opacity=0;$('panel').className='panel';buildWeapon();gameAudio.stopWorld();mode='menu';document.exitPointerLock?.();$('panel').hidden=true;$('hud').hidden=true;$('menu').hidden=false;document.body.classList.remove('playing');weaponGroup.visible=false;$('continue').hidden=!localStorage.getItem('dh-run')}
function pause(){if(mode!=='play')return;locked=false;physicalKeys.clear();keys.clear();mouseDown=false;slow=false;$('damage').style.opacity=0;$('slowTint').style.opacity=0;gameAudio.stopWorld();showControls('play')}
function showControls(back=controlsBack){controlsBack=back;bindingPending=null;controlsMessage='';renderControls()}
function saveControls(){localStorage.setItem('dh-controls',JSON.stringify(controls.bindings));localStorage.setItem('dh-settings',JSON.stringify(settings))}
function renderControls(){
 $('panel').hidden=false;$('panel').className='panel controls-panel settings-panel';$('panel').innerHTML=`<div class="controls-heading"><div><small>${controlsBack==='play'?'PAUSED':''}</small><h2>SETTINGS</h2></div><div class="controls-heading-actions"><button id="reset-controls">RESET CONTROLS</button><button class="primary" id="controls-back">${controlsBack==='play'?'RESUME':'BACK'}</button></div></div><div class="settings-overview"><section class="settings-category"><h3>CONTROLS</h3>${controlsOptionsHTML(settings)}</section>${settingsHTML()}</div><section class="settings-bindings"><h3>KEY BINDINGS</h3>${bindingsHTML(controls,settings,bindingPending,controlsMessage,false)}</section>`;
 $('panel').querySelectorAll('[data-binding]').forEach(b=>b.onclick=()=>{const[id,slot]=b.dataset.binding.split(':');bindingPending={id,slot:Number(slot)};renderControls()});
 $('controls-back').onclick=()=>{bindingPending=null;$('panel').className='panel';if(controlsBack==='play')lock();else $('panel').hidden=true};
 $('reset-controls').onclick=()=>{controls=new ControlBindings();settings.sensitivity=1;settings.invertY=settings.crouchToggle=false;saveControls();controlsMessage='Default controls restored.';renderControls()};
 $('control-sensitivity').oninput=e=>{settings.sensitivity=Number(e.target.value);e.target.setAttribute('aria-valuetext',settings.sensitivity.toFixed(2)+'×');e.target.style.setProperty('--fill',(settings.sensitivity-.2)/2.8*100+'%');saveControls();e.target.nextElementSibling&&(e.target.nextElementSibling.textContent=settings.sensitivity.toFixed(2)+'×')};
 $('control-invert').onchange=e=>{settings.invertY=e.target.checked;saveControls()};$('control-crouch').onchange=e=>{settings.crouchToggle=e.target.value==='toggle';crouchLatch=false;saveControls()};
 if(bindingPending){$('bind-escape').onclick=()=>commitBinding('Escape');$('bind-cancel').onclick=()=>{bindingPending=null;renderControls()};if($('bind-clear'))$('bind-clear').onclick=()=>commitBinding('');if(bindingPending.code)$('bind-replace').onclick=()=>commitBinding(bindingPending.code,true)}bindSettings();
}
function commitBinding(code,replace=false){const p=bindingPending,result=controls.assign(p.id,p.slot,code,replace);if(Array.isArray(result)&&result.length){bindingPending={...p,code,conflicts:result};renderControls();return}controlsMessage=ACTIONS.find(a=>a.id===p.id).label+': '+keyLabel(code);bindingPending=null;saveControls();physicalKeys.clear();keys.clear();mouseDown=false;renderControls()}
function captureBinding(code,e){if(!bindingPending)return false;if(e?.target?.id==='bind-cancel'||e?.target?.id==='bind-clear'||e?.target?.id==='bind-replace'||e?.target?.id==='bind-escape')return false;e?.preventDefault?.();if(bindingPending.code)return true;if(code==='Escape'){bindingPending=null;renderControls();return true}commitBinding(code);return true}
function syncInputs(){keys.clear();for(const a of ACTIONS)if(controls.bindings[a.id].some(c=>c&&physicalKeys.has(c)))keys.add(a.code);if(settings.crouchToggle){keys.delete('KeyC');if(crouchLatch)keys.add('KeyC')}mouseDown=keys.has('MouseLeft');$('leaderboard').style.fontSize=keys.has('Tab')?'22px':''}
function inputPress(code,e){if(captureBinding(code,e))return;if(mode!=='play'||!locked)return;e?.preventDefault?.();const fresh=!physicalKeys.has(code);physicalKeys.add(code);const actions=controls.actionsFor(code);if(fresh){for(const a of actions){if(a.id==='pause'){locked=false;document.exitPointerLock?.();pause();return}if(a.id==='crouch'&&settings.crouchToggle)crouchLatch=!crouchLatch;if(respawnTime>0)continue;if(a.id==='jump')jumpBuffered=FEEL.jumpBuffer;if(a.id==='fire'&&code.startsWith('Wheel'))shoot();if(a.id==='reload')reload();if(a.id==='grenade'&&grenades>0){grenades--;syncAimCamera();camera.getWorldDirection(aim);launchRocket(playerPos,aim,null,true,equipment.throwable==='impact'?.85:1,{radius:equipment.throwable==='impact'?5/7:1});playSfx('frag',{volume:.4})}if(a.id==='streak'&&streakReady){streakReady=false;streak=0;activateStreak()}if(a.id.startsWith('weapon'))switchWeapon(WEAPON_ORDER[Number(a.id.slice(6))-1]);if(a.id==='previous'||a.id==='next'){const order=WEAPON_ORDER.filter(g=>owned.includes(g)),i=order.indexOf(equipped);switchWeapon(order[(i+(a.id==='next'?1:order.length-1))%order.length])}}}syncInputs()}
function updateStance(){
 const feet=playerPos.y-eyeHeight,wants=keys.has('KeyC'),clear=canOccupy(blocks,{x:playerPos.x,z:playerPos.z,feet,radius:COLLISION.radius,height:COLLISION.standing});
 headBlocked=crouched&&!wants&&!clear;const next=wants||crouched&&!clear;
 if(next!==crouched){crouched=next;eyeHeight=next?.95:1.7;playerPos.y=feet+eyeHeight}
 $('head-blocked').hidden=!headBlocked;
}

function controlHint(){return [['forward','MOVE'],['jump','JUMP'],['crouch','CROUCH'],['slow','SLOW TIME'],['pause','PAUSE']].map(([a,l])=>`${keyLabel(controls.bindings[a].find(Boolean)||'')} ${l}`).join(' · ')}
function settingValue(key){return Math.round(settings[key]*100)+'%'}
function settingRow(key,label,min=0,max=1,step=.05){const percent=(settings[key]-min)/(max-min)*100;return `<div class="setting-row"><label for="setting-${key}">${label}</label><output id="value-${key}" for="setting-${key}">${settingValue(key)}</output><input id="setting-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${settings[key]}" aria-valuetext="${settingValue(key)}" style="--fill:${percent}%">${key==='hudScale'?'<span class="range-limits"><span>50%</span><span>200%</span></span>':''}</div>`}
function settingsHTML(){return `<section class="settings-category"><h3>AUDIO</h3>${[['guns','Guns'],['steps','Footsteps'],['feedback','Hit & damage feedback'],['music','Music']].map(([key,label])=>settingRow(key,label)).join('')}</section><section class="settings-category"><h3>VISUALS</h3>${settingRow('motion','Camera motion')}${settingRow('hudScale','HUD scale',.5,2,.05)}</section>`}
function applyHUDScale(){const scale=settings.hudScale;$('hud').style.zoom=String(scale);$('hud').style.width=(100/scale)+'vw';$('hud').style.height=(100/scale)+'vh';$('hud').style.setProperty('--hud-scale',scale);$('hud').className=innerWidth/scale<850?'hud-compact':'hud-wide'}
function bindSettings(){for(const key of ['motion','guns','steps','feedback','music','hudScale'])$('setting-'+key).oninput=e=>{const min=key==='hudScale'?.5:0,max=key==='hudScale'?2:1;settings[key]=clamp(Number(e.target.value),min,max);$('value-'+key).textContent=settingValue(key);e.target.setAttribute('aria-valuetext',settingValue(key));e.target.style.setProperty('--fill',(settings[key]-min)/(max-min)*100+'%');localStorage.setItem('dh-settings',JSON.stringify(settings));if(key==='hudScale')applyHUDScale();else gameAudio.applySettings(settings)}}
$('arsenal').onclick=()=>showShop(true);$('start').onclick=()=>startRandomMatch();$('continue').hidden=!localStorage.getItem('dh-run');$('continue').onclick=()=>{try{const s=JSON.parse(localStorage.getItem('dh-run'));changeArena(s.mapId||'testworks');restoreMapRotation();round=s.round;credits=s.credits;owned=s.owned;equipped=s.equipped;perks=s.perks||{};builds=migrateBuilds(s.builds,perks,owned);delete perks.grip;delete perks.damage;delete perks.rapid;equipment=normalizeEquipment(s.equipment);shopOffers=validShopOffers(s.shopOffers,s.round)?s.shopOffers:null;startingWeapon=owned.includes(s.startingWeapon)?s.startingWeapon:equipped;buildWeapon();$('menu').hidden=true;document.body.classList.add('playing');s.phase==='shop'?showShop():startMatch(true)}catch{startRandomMatch()}};
$('help').onclick=e=>{e.preventDefault();showControls('menu')};
$('sound').onclick=()=>{muted=!muted;gameAudio.setMuted(muted);if(!muted)gameAudio.unlock();$('sound').innerHTML=`AUDIO <span>${muted?'OFF':'ON'}</span>`};
document.addEventListener('pointerlockchange',()=>{
 const captured=document.pointerLockElement===renderer.domElement;
 if(captured){dragLook=false;locked=true;lastPointer=null;if(mode==='play'){$('panel').hidden=true;$('hud').querySelector('.hudhint').textContent=controlHint()}}
 else if(!dragLook){locked=false;if(mode==='play')pause()}
});
document.addEventListener('pointerlockerror',enableDragLook);
document.addEventListener('mousemove',e=>{
 if(!locked||mode!=='play'||respawnTime>0)return;
 let dx=e.movementX,dy=e.movementY;
 if(dragLook){if(lastPointer){dx=e.clientX-lastPointer.x;dy=e.clientY-lastPointer.y}else{dx=Number.isFinite(dx)?dx:0;dy=Number.isFinite(dy)?dy:0}lastPointer={x:e.clientX,y:e.clientY}}
 const sense=(keys.has('MouseRight')?.001/playerWeapon().zoom:.002)*(settings.sensitivity||1);yaw-=dx*sense;pitch=clamp(pitch-dy*sense*(settings.invertY?-1:1),-1.5,1.5);turnX+=dx*.001;turnY+=dy*.001;
});

document.addEventListener('mousedown',e=>inputPress(mouseCode(e.button),e));document.addEventListener('mouseup',e=>{physicalKeys.delete(mouseCode(e.button));if(mode==='play'&&locked)syncInputs()});document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>inputPress(e.code,e));document.addEventListener('keyup',e=>{physicalKeys.delete(e.code);if(mode==='play'&&locked)syncInputs()});window.addEventListener('blur',()=>{physicalKeys.clear();keys.clear();mouseDown=false;if(locked){if(dragLook){locked=false;pause()}else document.exitPointerLock()}});document.addEventListener('wheel',e=>{const code=e.deltaY>0?'WheelDown':'WheelUp';if(captureBinding(code,e))return;if(mode==='play'&&locked){inputPress(code,e);physicalKeys.delete(code);syncInputs()}},{passive:false});window.addEventListener('resize',()=>{applyHUDScale();if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(2100000/(innerWidth*innerHeight))));renderer.setSize(innerWidth,innerHeight);frameRenderer?.resize()});


init();
