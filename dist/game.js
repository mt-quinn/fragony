import {MODULAR_VERSION,MODULAR_SLOTS,PARTS,clone,same,createCollection,normalizeCollection,fullCollection,createLife,gunStats,rewardKill,circuitBonuses,rollShop,migrateModularRun,botTokenSkill} from './modular-gun.js';
import {ModularFire} from './modular-fire.js';
import {ModularProjectiles} from './modular-projectiles.js';
import {sweepMeshes} from './projectile-sweep.js';
import {createModularGun} from './modular-model.js';
import {createChoiceToken} from './modular-tokens.js';
import {openArmoryView} from './armory-host.js';
import {menuRunSummary} from './menu-view.js';
import {settingsWorkspaceHTML,settingsRows,settingsSections,settingID,settingOutputID,settingValueText,SETTINGS_AA_PRESETS} from './settings-workspace.js';
import {BALANCE,toDisplay,fromDisplay,maxHealth,normalizePerks,activePerks,equipPerk,displayedHistory,weaponEngagement} from './balance.js';
import {gameViewportSize,displayReport} from './viewport.js';
import {batchHealthPickups} from './pickup-view.js';
import {MenuStage,MENU_STAGE} from './menu-stage.js';
import {MobileAutoJump} from './mobile-jump.js';
import {CrouchSlide,slideSlope,botSlideChoice} from './slide.js';
import {Minimap} from './minimap.js';
import {createRivals,restoreRivals,settleRivals,placementReward} from './rivals.js';
import {buildTestworks,setArenaAtmosphere} from './testworks.js';
import {modelAttachments,applyAttachmentModels,animateAttachmentModels} from './attachment-models.js';
import {FireControl,FeedSystem,distanceDamage,reloadDuration} from './weapon-cycle.js';
import {traceCartridges} from './ballistics.js';
import {nearbyAutoTarget,autoFirePadding,AUTO_AIM_PADDING} from './mobile-targeting.js';
import {MobileController,wantsTouch,MOBILE_DEFAULTS} from './mobile.js';
import {closestHit,occluded} from './world-query.js';
import {BenchmarkRunner,openBenchmark,benchmarkReportHTML} from './graphics-benchmark.js';
import {graphicsOptions,graphicsRenderOptions,graphicsControlsHTML,EFFECT_PRESETS} from './graphics.js';
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
import {antialiasOptions} from './antialias.js';
import {surface, MATERIALS, studioEnvironment, FrameRenderer, dressArena, createMuzzleFlash, smokeMesh} from './presentation.js';
import {createRifle, rifleAttachment, animateRifle} from './rifle.js';
import {createDummyRig, resetDummyRig, animateDummy, fireDummy, beginRagdoll, stepRagdoll, poseDummy} from './characters.js';
import { ArenaAI, AI_TUNING, buildNavigation,restoreNavigation, nearestNode as nearestAINode, findRoute } from './ai.js';
import { MAP, MAPS, selectMap, ALL_WEAPONS, randomWeaponPair } from './map.js';
import { COLLISION, canOccupy, moveCharacter } from './collision.js';
import { inBlock, blockedAt, surfaceAt, ceilingAt, launchTime,blockSpan } from './geometry.js';
import { GameAudio, AUDIO_TUNING } from './audio.js';
import { ACTIONS, ControlBindings, keyLabel, mouseCode, bindingsHTML, controlsOptionsHTML } from './controls.js';
import { DamageHistory, bodyPartAt, recapHTML } from './recap.js';
import { HurtFeedback, HURT, nearMissSegment } from './hurt.js';
import { FEEL, HANDLING, Spring, accelerate, WeaponMotion, HitFeedback } from './feel.js';
import { bodyDamage, resolveDamage, combineOutcomes, recordDamage, clearDamageCredit, takeAssists } from './combat.js';
import { WEAPON_SLOTS, OPTICS, SLOT_LABELS, attachment, fitted, normalizeBuilds, weaponStats, previewBuild, fitAttachment, migrateBuilds, migrateLoadoutSave, gameplayCount, EQUIPMENT, normalizeEquipment } from './loadout.js';
import { loadoutHTML, gunIcon } from './loadout-view.js';
import { createShopOffers, validShopOffers, offeredPart, offeredUpgrade } from './shop.js';
const $=s=>document.getElementById(s), clamp=THREE.MathUtils.clamp;
const weapons=[
 {name:'JACKHAMMER',label:'Assault rifle',damage:25,interval:0.12,mag:30,reload:1.3,spread:0.008,pellets:1,color:0xe6fa80,kick:.045,price:350,falloff:{close:24,far:40,near:1,farScale:0.7},desc:'Reliable automatic fire. 30 rounds.'},
 {name:'NAILER',label:'Hand cannon',damage:60,interval:0.5,mag:6,reload:1.5,spread:0.004,pellets:1,color:0xe6fa80,kick:.15,price:350,falloff:{close:15,far:30,near:1,farScale:0.7},desc:'Two body hits or one precise headshot against a normal opponent.'},
 {name:'RATTLER',label:'Submachine gun',damage:14,interval:0.055,mag:42,reload:1,spread:0.033,pellets:1,color:0xe6fa80,kick:.025,price:350,falloff:{close:10,far:24,near:1,farScale:0.5},desc:'Fast close-range tracking. 42 rounds.'},
 {name:'LANCER',label:'Rail rifle',damage:75,interval:0.95,mag:4,reload:1.8,spread:0,pellets:1,color:0xe6fa80,kick:.12,price:400,desc:'One precise headshot against normal or armored opponents.'},
 {name:'DEMOLISHER',label:'Rocket launcher',damage:95,interval:1.1,mag:3,reload:1.8,spread:0,pellets:1,color:0xe6fa80,kick:.16,price:400,splashDamage:70,desc:'Direct-hit kills against normal opponents; splash pressure and rocket jumps.'},
 {name:'SLEDGEHAMMER',label:'Pump shotgun',damage:10,interval:0.85,mag:8,reload:1.6,spread:0.085,pellets:12,color:0xe6fa80,kick:.16,price:350,falloff:{close:3,far:12,near:1,farScale:0.5},desc:'A centered close-range shell can kill a normal or armored opponent.'}
];
let minimap=null;
const MELEE={range:2,interval:.5,duration:.24};
let mobileTargetIdle=0,mobileMeleeTarget=false,meleeCooldown=0,meleeSwing=0;
let mobile=null,mobileTargetClock=0,mobileTarget=null,mobileDistance=Infinity,mobileOnTarget=false,mobileAssisted=false,renderSun=null;
let navNodes=[],navigation,opponentAI,playerSpawnAt=0,previewDummy,previewRig,frameRenderer,studioMap,menuStage,menuReturnMapId;
let scene,camera,renderer,weaponGroup,flash,arena,worldMeshes=[],blocks=[],bots=[],effects=[],rockets=[],pickups=[];
let mode='menu',round=1,credits=0,owned=[0],equipped=0,perks={},time=90,matchKills=0,deathCount=0,streak=0,best=Number(localStorage.getItem('dh-best')||0);
let builds=normalizeBuilds(),equipment=normalizeEquipment(),startingWeapon=0,shopGun=0,shopSlot='action',shopCandidate='',shopKit=false,shopInspect=false,shopMessage='',shopOffers=null,shownReticle=null,pinnedOffer=null,starterConversionUsed=false,pendingPart=null,practiceBuilds=null,catalogBuilds=null,shopPreview=null,practiceMode=false,inspection=null;
function resetFireControl(){fireControl.reset();if(chargeVoice){gameAudio.stopVoice(chargeVoice);chargeVoice=null;}}
function isPractice(){return practiceMode||!!mobile?.practice}
function playerWeapon(){return gunStats(activeGunCollection(),playerGunLife,playerGunFire.spool);}
function playerHandling(){const w=playerWeapon(),h=HANDLING[0];return{...h,kick:h.kick*w.recoil,aim:h.aim*w.recoil};}
let muzzleTime=0,magazines={},playerPadFlight=null;
const playerHistory=new DamageHistory();let deathView=null;const killerEdges=new Map();
const playerCredit={maxHealth:BALANCE.playerHP,baseHealth:BALANCE.playerHP};let assistNotice={points:0,count:0,left:0},matchAssists=0;
let matchPoints=0,headshotKills=0,jumpBuffered=0,coyoteTime=0,lastJumpHeld=false,viewHeight=1.7,turnX=0,turnY=0,nearMissCooldown=0,nearWall=0;
const hurtFeedback=new HurtFeedback();
const playerSlide=new CrouchSlide(),mobileAutoJump=new MobileAutoJump();
const weaponMotion=new WeaponMotion(),aimSpring=new Spring(),feedback=new HitFeedback(),fireControl=new FireControl(),feedSystem=new FeedSystem();let triggerRefunded=false,loadedFeedPhases={},lastPayloadFX=-1,chargeVoice=null,payloadText='',payloadTime=0;
let settings={antialias:true,motion:.65,guns:1,steps:1,feedback:1,music:1,sensitivity:1,hudScale:1,minimap:true,minimapNorth:false,minimapScale:1,invertY:false,crouchToggle:false,holdSemi:false};try{settings={...settings,...JSON.parse(localStorage.getItem('dh-settings')||'{}')}}catch{}
const benchmarkToken=typeof location!=='undefined'?new URLSearchParams(location.search).get('benchmark'):null;
const benchmarkChild=!!benchmarkToken&&typeof parent!=='undefined'&&parent!==window;let benchmarkRunner=null,benchmarkOverlay=null;
let legacyGraphics={};try{legacyGraphics=JSON.parse(localStorage.getItem('fg-touch-settings')||'{}')||{}}catch{}
const graphicsContext={touch:typeof wantsTouch==='function'&&wantsTouch(),legacy:legacyGraphics,dpr:typeof devicePixelRatio==='number'?devicePixelRatio:1};
Object.assign(settings,graphicsOptions(settings,graphicsContext));settings.aaStats=settings.aaStats===true;
for(const [key,min,max,fallback]of [['minimapScale',.5,2,1],['hudScale',.5,2,1],['motion',0,1,.65],['guns',0,1,1],['steps',0,1,1],['feedback',0,1,1],['music',0,1,1],['sensitivity',.2,3,1]])settings[key]=Number.isFinite(Number(settings[key]))?clamp(Number(settings[key]),min,max):fallback;
let controls;try{controls=new ControlBindings(JSON.parse(localStorage.getItem('dh-controls')||'null'))}catch{controls=new ControlBindings()}
let bindingPending=null,controlsBack='menu',controlsMessage='',crouchLatch=false,crouched=false,eyeHeight=1.7,headBlocked=false;const physicalKeys=new Set();
let shotsFired=0;
let health=BALANCE.playerHP,focus=100,focusRest=0,specialAttacks=[],ammo=30,reloading=0,shotTimer=0,slow=false,locked=false,mouseDown=false,yaw=0,pitch=0,vy=0,grounded=true,recoil=0,moveClock=0,elapsed=0,hitTime=0,respawnTime=0,toastTime=0,streakReady=false;
for(const [key,fallback]of [['minimap',true],['minimapNorth',false]])if(typeof settings[key]!=='boolean')settings[key]=fallback;
const playerPos=new THREE.Vector3(0,1.7,15),vel=new THREE.Vector3(),keys=new Set(),up=new THREE.Vector3(0,1,0),ray=new THREE.Raycaster(),aim=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
ray.firstHitOnly=true;
const gameAudio=new GameAudio();let muted=false,lastHUD=0,dragLook=false,stepDistance=0,reloadStage=0,reloadLength=0,hurtSoundCooldown=0,lastPointer=null;
let gunCollection=createCollection(),practiceCollection=null,playerGunLife=createLife(1),playerGunFire=new ModularFire(),modularProjectiles=null,modularOutcomes=[],choiceTokens=[],tokenSerial=0,armoryView=null,botFocusOwner=null,botFocusLeft=0,botFocusCooldown=0;
const playerActor={isPlayer:true,name:'YOU',pos:new THREE.Vector3(),get hp(){return health},get dead(){return respawnTime>0||health<=0}};
const playerProxy=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));
weapons[0].name='Modular gun';weapons[0].label='Modular gun';
let spawnPoints=MAP.spawns,elevatorSystem;const arenaCache=new Map(),spawnHistory=new Map();
const botNames=['CINDER','ROOK','VESPER','STATIC','BRICK'];
let rivals=[];
const rollRivals=()=>createRivals(botNames,()=>randomWeaponPair(()=>Math.random()),ALL_WEAPONS);
function rivalKill(){}
const inkEdges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));const inkLine=new THREE.LineBasicMaterial({color:0x303b40,transparent:true,opacity:.12});
const shardGeo=new THREE.TetrahedronGeometry(1),strikeRingGeo=new THREE.RingGeometry(2.35,2.5,32);
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
let bootProgress=0,bootPending=false;
function setBootProgress(value,label){bootProgress=Math.max(bootProgress,Math.min(100,value));$('boot-progress').setAttribute('aria-valuenow',String(Math.round(bootProgress)));$('boot-progress-fill').style.transform='scaleX('+(bootProgress/100)+')';$('boot-status').textContent=label;}
function resetBoot(){bootProgress=0;bootPending=false;$('boot-screen').hidden=false;$('boot-progress').hidden=false;$('retry-menu').hidden=true;$('menu').hidden=true;$('menu-audio').hidden=true;setBootProgress(5,'Loading map');}
function failBoot(message,retry=init){bootPending=false;$('boot-progress').hidden=true;$('boot-status').textContent=message;$('retry-menu').hidden=false;$('retry-menu').onclick=retry;}
function finishBoot(){bootPending=false;setBootProgress(100,'Ready');for(const id of ['continue','start','menu-practice','arsenal','help'])$(id).disabled=false;$('menu').removeAttribute('aria-busy');$('boot-screen').hidden=true;$('menu').hidden=mode!=='menu';$('menu-audio').hidden=mode!=='menu';}
function bootPaint(){return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
async function init(){
 resetBoot();
 const initial=MAPS.find(m=>m.id===MENU_STAGE.mapId);try{if(initial?.load)await initial.load({onProgress:value=>setBootProgress(5+value*70,'Loading map')});else if(initial?.loadRender)await initial.loadRender();}catch(error){console.error('Menu map loading failed',error);failBoot('Menu could not load');return;}
 setBootProgress(78,'Preparing graphics');await bootPaint();
 gameAudio.bindLifecycle();
 menuReturnMapId=practiceMapFromURL()||readMapRotation()?.last||'reservoir';selectMap(MENU_STAGE.mapId);spawnPoints=MAP.spawns;
 if(wantsTouch())setupMobile();else{$('menu-practice').onclick=()=>beginPractice();}

 minimap=new Minimap(mobile?.enabled?mobile.buttons.minimap.querySelector('canvas'):$('minimap-canvas'));
 applyHUDScale();
 gameAudio.visibility=(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z));
 scene=new THREE.Scene();scene.background=new THREE.Color(0x182127);scene.fog=new THREE.Fog(0x182127,38,120);
 camera=new THREE.PerspectiveCamera(settings.fov,gameViewportSize().width/gameViewportSize().height,.07,160);camera.rotation.order='YXZ';
 try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch(e){failBoot('WebGL is required to play',()=>location.reload());return}
 applyGraphicsRendererSettings();
 sizeRenderer();renderer.outputColorSpace=THREE.SRGBColorSpace;applyGraphicsRendererSettings();studioMap=studioEnvironment(renderer);scene.environment=studioMap.texture;scene.environmentIntensity=.34;frameRenderer=new FrameRenderer(renderer,scene,camera,renderOptions());$('viewport').appendChild(renderer.domElement);if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(mobile)mobile.resize();else{sizeRenderer();frameRenderer?.resize();}}).observe($('viewport'));
 setBootProgress(90,'Preparing arena');await bootPaint();
 scene.add(new THREE.HemisphereLight(0xf7f8f0,0x65717c,1.0));const sun=new THREE.DirectionalLight(0xfff2d6,2.8);sun.position.set(-24,52,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-57,right:57,top:57,bottom:-57,near:1,far:125});renderSun=sun;sun.shadow.mapSize.set(shadowSize(),shadowSize());sun.shadow.bias=-.003;sun.shadow.normalBias=.08;scene.add(sun);scene.traverse(o=>{if(o.isLight)o.layers.enable(1)});const weaponFill=new THREE.DirectionalLight(0xdde9ef,1.5);weaponFill.position.set(-2,3,1);weaponFill.layers.set(1);camera.add(weaponFill);camera.add(weaponFill.target);weaponFill.target.position.set(0,0,-1);arena=new THREE.Group();scene.add(arena);buildArena();buildNav();buildWeapon();previewRig=createDummy();previewDummy=previewRig.group;menuStage=new MenuStage(scene,previewRig,createDummy('smg'));prepareMenuStage();
 let last=performance.now();renderer.setAnimationLoop(now=>{if(benchmarkOverlay)return;if(benchmarkChild&&(!benchmarkRunner||!benchmarkRunner.frame(now)))return;updateAAStats(now);const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;mobile?.update(dt);if(document.hidden||mobile?.enabled&&!mobile.landscape&&mode!=='menu')return;if(mode==='inspect'){presentInspection(dt);return;}if(mode==='shop')return;if(mode==='play'&&locked)update(dt);else if(mode==='menu'){menuStage.present(camera,gameViewportSize().width,gameViewportSize().height,dt,settings.motion)}updateEffects(dt*(slow?BALANCE.worldSlow:1));arena.userData.healthBatches?.sync();frameRenderer.render(scene,camera,dt,slow,MAP.water||[]);drawSettingsPreview();if(bootPending)finishBoot();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(mode==='play')pause();mobile?.setFeedback('GRAPHICS PAUSED · RESTORING');});
 setBootProgress(96,'Preparing scene');if(arena.userData.shaderWarmup)await arena.userData.shaderWarmup;bootPending=true;
 if(benchmarkChild)startBenchmarkChild();
 renderer.domElement.addEventListener('webglcontextrestored',()=>{frameRenderer?.dispose();frameRenderer=new FrameRenderer(renderer,scene,camera,renderOptions());if(mobile?.overlay==='pause')mobile.showPause();});
}

function renderOptions(){return graphicsRenderOptions(settings);}
function sizeRenderer(){
 if(!renderer)return;
 const {width,height}=gameViewportSize();camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setPixelRatio((devicePixelRatio||1)*settings.resolutionScale);renderer.setSize(width,height);
}
function shadowSize(){return {off:512,low:512,medium:1024,high:2048}[settings.shadowQuality]||1024;}
function applyGraphicsRendererSettings(){
 if(!renderer)return;renderer.shadowMap.enabled=settings.shadowQuality!=='off';const filter={hard:THREE.BasicShadowMap,pcf:THREE.PCFShadowMap,soft:THREE.PCFSoftShadowMap}[settings.shadowFilter];
 const changed=renderer.shadowMap.type!==filter;if(changed&&scene)scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.needsUpdate=true;});renderer.shadowMap.type=filter;renderer.toneMapping={cinematic:THREE.ACESFilmicToneMapping,neutral:THREE.NeutralToneMapping,none:THREE.NoToneMapping}[settings.toneMap];renderer.toneMappingExposure=settings.exposure;
 if(renderSun&&(changed||renderSun.shadow.mapSize.x!==shadowSize())){renderSun.shadow.mapSize.set(shadowSize(),shadowSize());renderSun.shadow.map?.dispose();renderSun.shadow.map=null;renderer.shadowMap.needsUpdate=true;}
 document.body.classList.toggle('graphics-no-grain',!settings.grain||(settings.pixelForge&&settings.pixelForgeIntensity>0));
}
function rebuildGraphics(){applyGraphicsRendererSettings();if(!renderer)return;sizeRenderer();frameRenderer?.dispose();frameRenderer=new FrameRenderer(renderer,scene,camera,renderOptions());}
function setupMobile(){
 mobile=new MobileController({
  read:()=>mobileGameState,
  pause, resume:()=>{lock();if(mobile.practice)mobile.setFeedback('PRACTICE · NO DAMAGE · YOUR RUN IS SAFE');},
  suspend:()=>{locked=false;physicalKeys.clear();keys.clear();mouseDown=false;gameAudio.stopWorld();},
  clear:()=>{mobileAutoJump.reset();resetFireControl();physicalKeys.clear();keys.clear();mouseDown=false;mobileTarget=null;mobileTargetClock=0;mobileTargetIdle=0;mobileMeleeTarget=false;},
  menu:()=>{if(!isPractice())saveRun();mainMenu();},
  practice:beginPractice,
  maps:practiceMaps,
  workbench:()=>showShop(false),
  unlock:()=>gameAudio.unlock(),
  look:(dx,dy)=>{if(respawnTime>0)return;const d=mobile.look(dx,dy);yaw+=d.yaw;pitch=clamp(pitch+d.pitch,-1.5,1.5);turnX+=dx*.001;turnY+=dy*.001;mobileTargetClock=0;},
  gyro:(x,y)=>{const gain=THREE.MathUtils.degToRad(mobile.settings.gyroSensitivity)*(keys.has('MouseRight')?mobile.settings.adsSensitivity:1);yaw-=x*gain;pitch=clamp(pitch-y*gain,-1.5,1.5);mobileTargetClock=0;},
  action:touchAction,
  resize:()=>{if(!renderer)return;sizeRenderer();frameRenderer?.resize();},
  settingsChanged:()=>{},
  showSettings:showControls,
  audioHTML:()=>['guns','steps','feedback','music'].map((k,i)=>settingRow(k,['Gunfire','Footsteps','Hit & damage feedback','Music'][i])).join(''),
  visualHTML:()=>graphicsSettingsHTML()+settingRow('motion','Camera motion')+minimapSettingsHTML(false),
  bindAudio:panel=>{bindGraphicsSettings(panel);bindAntialiasSetting(panel);bindMinimapSettings(panel);for(const key of ['guns','steps','feedback','music','motion']){const input=panel.querySelector('#setting-'+key);if(!input)continue;input.oninput=e=>{settings[key]=Number(e.target.value);$('value-'+key).textContent=settingValue(key);e.target.setAttribute('aria-valuetext',settingValue(key));localStorage.setItem('dh-settings',JSON.stringify(settings));gameAudio.applySettings(settings);};}}
 });
}
const mobileGameState={
 get minimapEnabled(){return settings.minimap},get mode(){return mode},get active(){return mode==='play'&&locked},get alive(){return respawnTime<=0},get health(){return Math.min(100,toDisplay(health,BALANCE.playerHP))},get armor(){return Math.max(0,toDisplay(health,BALANCE.playerHP)-100)},get maxHealth(){return 100},get focus(){return focus},get crouched(){return crouched},get sliding(){return playerSlide.active},get type(){return ALL_WEAPONS[equipped]},get zoom(){return playerWeapon().zoom||1},get gunMode(){const w=playerWeapon();return w.charge?'CHARGE':w.mode==='burst'?w.burst+'-BURST':w.mode==='auto'?'AUTO':'SEMI'},get charge(){return playerWeapon().charge&&playerGunFire.capacitor<1?playerGunFire.capacitor:0},get chargeWeapon(){return !!playerWeapon().charge},get shots(){const w=playerWeapon();return Math.floor(ammo/w.volley)},get weapon(){return PARTS[activeGunCollection().kit.mechanism.id].name},get equipped(){return equipped},get icon(){return gunIcon(equipped)},get ammo(){return ammo},get reloading(){return reloading>0},get circuit(){return PARTS[activeGunCollection().kit.circuit.id].name},get tokens(){return activeGunCollection().tokens},get streak(){return playerGunLife.kills},get streakReady(){return false},get round(){return round},get map(){return MAP.name},get time(){return `${Math.floor(Math.ceil(time)/60)}:${String(Math.ceil(time)%60).padStart(2,'0')}`},get placement(){const r=rank();return r+(['ST','ND','RD'][r-1]||'TH')},get ranks(){return rankList()},get weapons(){return WEAPON_ORDER.filter(i=>owned.includes(i)).map(i=>({id:i,name:weapons[i].name,label:weapons[i].label,icon:gunIcon(i),ammo:i===equipped?ammo:magazines[i]??playerWeapon(i).mag}))}
};
function touchAction(action,value){
 if(mode!=='play'||respawnTime>0)return;
 if(action==='cancelCharge')return;
 if(action==='jump')jumpBuffered=FEEL.jumpBuffer;
 if(action==='swap'){const order=WEAPON_ORDER.filter(i=>owned.includes(i));switchWeapon(order[(order.indexOf(equipped)+1)%order.length]);}
 if(action==='weapon')switchWeapon(value);
 if(action==='streak'&&streakReady){streakReady=false;streak=0;activateStreak();}
}
function automaticTouchFire(){return !!(mobile?.enabled&&mobile.settings.fireMode==='simple'&&!mobile.state.held.has('fire'));}
function syncTouchInputs(dt){
 const state=mobile.state;keys.clear();
 if(!mobile.active){mouseDown=false;mobileTargetIdle=0;mobileMeleeTarget=false;return;}
 if(state.ads&&!state.held.has('fire'))keys.add('MouseRight');
 if(state.focus)keys.add('KeyQ');
 mobileTargetClock-=dt;
 if(mobileTargetClock<=0){
  mobileTargetClock=1/60;mobileTarget=null;mobileDistance=Infinity;mobileOnTarget=false;mobileAssisted=false;mobileMeleeTarget=false;
  syncAimCamera();scene.updateMatrixWorld(true);camera.getWorldDirection(aim);ray.set(camera.position,aim);ray.far=90;
  const actorMeshes=botHitMeshes(),hit=closestHit(ray,worldMeshes,actorMeshes),b=hit?.object.userData.bot;
  if(b&&!b.dead&&b.hp>0){mobileTarget=b.name+':'+b.lifeId;mobileDistance=hit.distance;mobileOnTarget=true;mobileAssisted=true;mobileMeleeTarget=hit.distance<=MELEE.range;}
  if(!mobileTarget){const w=playerWeapon(),padding=autoFirePadding(w),nearby=nearbyAutoTarget(ray,actorMeshes,worldMeshes,padding);const proximity=nearby&&w.proximity&&nearby.distance>=w.arming&&ray.ray.distanceToPoint(nearby.bot.pos.clone().add(new THREE.Vector3(0,1,0)))<=w.proximity&&(!hit||hit.distance>=nearby.distance);const detonation=nearby&&padding>AUTO_AIM_PADDING?proximity||hit&&(!hit.object.userData.bot)&&hit.point.distanceTo(nearby.bot.pos.clone().add(new THREE.Vector3(0,1,0)))<w.blast&&blastVisible(hit.point.clone().addScaledVector(aim,-.025),nearby.bot.pos.clone().add(new THREE.Vector3(0,1,0))):true;if(nearby&&detonation){mobileTarget=nearby.bot.name+':'+nearby.bot.lifeId;mobileDistance=nearby.distance;mobileOnTarget=padding>AUTO_AIM_PADDING;}}
  // Slowdown only; never rotate aim or reveal a target through cover.
  if(!mobileAssisted&&mobile.settings.aimAssist){for(const b of bots){if(b.dead||b.hp<=0)continue;tmp.copy(b.pos);tmp.y+=1.1;tmp.sub(camera.position);const d=tmp.length();if(d>.5&&d<55&&tmp.multiplyScalar(1/d).dot(aim)>.997&&visible(camera.position,{x:b.pos.x,y:b.pos.y+1.1,z:b.pos.z})){mobileAssisted=true;break;}}}
  mobile.assisted=mobileAssisted;
 }
 // Close, exact reticle hits take priority over automatic gunfire. The strike
 // rechecks current geometry rather than using the acquisition padding/cache.
 if(mobileMeleeTarget){melee();mobile.auto.reset();mouseDown=false;return;}
 const blocked=respawnTime>0||meleeSwing>0||reloading>0&&!(playerWeapon().feedMode==='individual'&&ammo>0)||shotTimer>.15&&weaponMotion.equip>0;
 mouseDown=mobile.trigger(dt,mobileTarget,mobileDistance,blocked,mobileOnTarget);if(mouseDown){keys.add('MouseLeft');}
}

function buildArena(){mobileAutoJump.reset();frameRenderer?.resetHistory();
 setArenaAtmosphere(scene,MAP);
 if(MAP.brushes)buildBrushMap(arena,MAP,blocks,worldMeshes,renderer);else buildTestworks(arena,MAP,blocks,worldMeshes);

 for(const p of MAP.pads){const y=p.y||0,size=p.size||2.7;cube(p.x,y+.045,p.z,size,.09,size,0x182127);cube(p.x,y+.11,p.z,size*.815,.08,size*.815,0xd9ef45);const triangle=new THREE.Mesh(new THREE.ConeGeometry(.65,.07,3),mat(0x182127));triangle.position.set(p.x,y+.2,p.z);triangle.rotation.y=Math.atan2(p.landing.x-p.x,p.landing.z-p.z);arena.add(triangle);pickups.push({...p,kind:'pad',mesh:triangle,timer:0})}
 elevatorSystem=new ElevatorSystem(MAP.elevators||[],blocks);dressElevators(arena,elevatorSystem,worldMeshes);
 for(const p of MAP.pickups){
  const group=new THREE.Group(),small=p.amount===5,major=p.amount===50,healthItem=p.kind==='health',color=major?0xd9ef45:small?0xa9d9c8:0xf1f3e8;
  const size=small?.22:major?.65:.45,m=new THREE.Mesh(healthItem?boxGeo:sphereGeo,mat(healthItem?color:0xd9ef45));m.scale.setScalar(size);group.add(m);
  if(healthItem){for(const side of [-1,1]){cube(0,0,side*(size/2+.008),size*.26,size*.72,.015,0x182127,group);cube(0,0,side*(size/2+.012),size*.72,size*.26,.015,0x182127,group)}}
  group.position.set(p.x,p.y+(small?.8:1.15),p.z);arena.add(group);pickups.push({...p,mesh:group,timer:0,baseY:group.position.y});
  if(!small){const ring=new THREE.Mesh(new THREE.TorusGeometry(major?.85:.55,.025,3,24),mat(major?0xd9ef45:0xa9d9c8));ring.rotation.x=-Math.PI/2;ring.position.set(p.x,p.y+.025,p.z);ring.userData.healthRing=true;arena.add(ring)}
 }
 batchArena();batchHealthPickups(arena,pickups);
}
function changeArena(id){clearModularRound();
 minimap?.reset();
 if(id===MAP.id&&arena.children.length)return;
 clearDeathView();frameRenderer?.actorBatches?.clear();for(const r of rockets)scene.remove(r.mesh);rockets=[];for(const e of effects)retireEffect(e);effects=[];
 if(arena.children.length){arenaCache.set(MAP.id,{arena,blocks,worldMeshes,pickups,elevatorSystem,navigation});scene.remove(arena)}
 // Bound retained GPU and source data as the larger roster is explored.
 while(arenaCache.size>(mobile?.enabled?0:1)){const key=[...arenaCache.keys()].find(k=>k!==id);if(!key)break;const old=arenaCache.get(key),geometries=new Set();old.arena.userData.staticShadowCache?.dispose();for(const m of old.arena.userData.mapOwnedMaterials||[])m.dispose();old.arena.traverse(o=>{if(o.isInstancedMesh||o.isBatchedMesh)o.dispose();if(o.geometry&&o.geometry!==boxGeo&&o.geometry!==worldBoxGeo&&o.geometry!==sphereGeo)geometries.add(o.geometry);if(o.userData.arenaOwnedMaterial||o.material?.userData.arenaOwnedMaterial){o.material.map?.dispose();o.material.dispose();}});for(const g of old.arena.userData.raycastGeometries||[])geometries.add(g);for(const g of geometries)g.dispose();arenaCache.delete(key);MAPS.find(m=>m.id===key)?.unload?.();}
 for(const b of bots){disposeToolModel(b.group);scene.remove(b.group)}bots=[];spawnHistory.clear();selectMap(id);spawnPoints=MAP.spawns;
 const cached=arenaCache.get(MAP.id);if(cached){arenaCache.delete(MAP.id);({arena,blocks,worldMeshes,pickups,elevatorSystem,navigation}=cached);navNodes=navigation.nodes;scene.add(arena)}
 else{arena=new THREE.Group();scene.add(arena);blocks=[];worldMeshes=[];pickups=[];buildArena();buildNav()}
 setArenaAtmosphere(scene,MAP);elevatorSystem.reset();scene.updateMatrixWorld(true);
 if(renderer?.compileAsync&&!arena.userData.shaderWarmup)arena.userData.shaderWarmup=(frameRenderer?.warmup?frameRenderer.warmup(arena,scene,camera):renderer.compileAsync(arena,camera,scene)).catch(error=>console.warn('Map shader preparation failed',error));
 if(MAP.loadRender&&MAP.id!=='reservoir'){delete MAP.renderChunks;delete MAPS.find(m=>m.id===MAP.id).renderChunks;}
 if(MAP.load){MAP.groups={};const entry=MAPS.find(m=>m.id===MAP.id);if(entry){entry.groups={};delete entry.renderChunks;}delete MAP.renderChunks;}
}
let arenaLoadRequest=0;
function arenaNeedsLoading(entry){return !!entry&&(entry.load?!entry.ready:entry.loadRender?!entry.renderReady:false)}
function prepareArena(id,enter){
 const entry=MAPS.find(m=>m.id===id);if(!arenaNeedsLoading(entry))return enter();
 const request=++arenaLoadRequest;locked=false;mode='loading';mobile?.clear();gameAudio.stopWorld();$('menu').hidden=true;$('hud').hidden=true;weaponGroup.visible=false;
 $('panel').hidden=false;$('panel').className='panel controls-panel';$('panel').innerHTML='<small>FRAGONY / '+entry.name+'</small><h2>PREPARING MAP</h2><p>Getting the arena ready.</p><button id="map-loading-back">BACK TO MENU</button>';
 $('map-loading-back').onclick=()=>{arenaLoadRequest++;mainMenu()};
 return (entry.load?entry.load():entry.loadRender()).then(()=>{if(request!==arenaLoadRequest){if(entry.id!==MAP.id)entry.unload();return;}return enter();}).catch(error=>{if(request!==arenaLoadRequest)return;console.error('Map loading failed',id,error);$('panel').innerHTML='<h2>MAP COULD NOT LOAD</h2><p>Please try again.</p><button id="map-loading-back">BACK TO MENU</button>';$('map-loading-back').onclick=()=>{arenaLoadRequest++;mainMenu()};});
}
function waterAt(x,y,z){for(const w of MAP.water||[]){const span=blockSpan(w,x,z);if(span&&y>span.bottom&&y<span.top)return span}return null}
function stepElevators(dt){if(!elevatorSystem?.lifts.length)return;const actors=bots.filter(b=>!b.dead).map(b=>({x:()=>b.pos.x,z:()=>b.pos.z,feet:()=>b.pos.y,velocityY:()=>b.vy,height:()=>b.crouched?COLLISION.crouching:COLLISION.standing,carry:dy=>{b.pos.y+=dy;b.vy=0}}));if(respawnTime<=0)actors.push({x:()=>playerPos.x,z:()=>playerPos.z,feet:()=>playerPos.y-eyeHeight,velocityY:()=>vy,height:()=>crouched?COLLISION.crouching:COLLISION.standing,carry:dy=>{playerPos.y+=dy;viewHeight+=dy;vy=0}});elevatorSystem.step(dt,actors)}
function rideElevator(b,brain,dt){
 const ride=brain.liftRide,l=elevatorSystem.lifts.find(l=>l.id===ride?.id);if(!l){brain.liftRide=null;return}
 const toY=Math.abs(ride.to.y-l.low)<Math.abs(ride.to.y-l.high)?l.low:l.high;
 if(ride.phase==='board'){
  elevatorSystem.request(l,ride.fromY);
  if(Math.abs(l.y-ride.fromY)>.1||Math.abs(l.target-l.y)>.1)return;
  const dx=l.x-b.pos.x,dz=l.z-b.pos.z,d=Math.hypot(dx,dz);if(d>.12)opponentAI.world.move(b,dx/Math.max(d,.01)*Math.min(d,4.5*dt),dz/Math.max(d,.01)*Math.min(d,4.5*dt));
  if(Math.abs(b.pos.y-l.y)<.2&&inBlock(l.block,b.pos.x,b.pos.z,-.45)&&(!l.boardingRadius||Math.hypot(b.pos.x-l.x,b.pos.z-l.z)<=l.boardingRadius)){ride.phase='ride';elevatorSystem.request(l,toY)}
 }else if(ride.phase==='ride'){
  if(l.boardingRadius){const dx=l.x-b.pos.x,dz=l.z-b.pos.z,d=Math.hypot(dx,dz);if(d>.04)opponentAI.world.move(b,dx/d*Math.min(d,4.5*dt),dz/d*Math.min(d,4.5*dt));}
  elevatorSystem.request(l,toY);if(Math.abs(l.y-toY)<.1)ride.phase='exit';
 }else{const dx=ride.to.x-b.pos.x,dz=ride.to.z-b.pos.z,d=Math.hypot(dx,dz);if(d>.1)opponentAI.world.move(b,dx/Math.max(d,.01)*Math.min(d,4.5*dt),dz/Math.max(d,.01)*Math.min(d,4.5*dt));if(d<.15||!inBlock(l.block,b.pos.x,b.pos.z,.1)){brain.liftRide=null;brain.pathIn=0}}
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
function buildWeapon(){
 camera.userData.weaponFovFloor=65;
 if(weaponGroup){disposeToolModel(weaponGroup);camera.remove(weaponGroup);flash?.material.dispose();}
 weaponGroup=new THREE.Group();camera.add(weaponGroup);if(!camera.parent)scene.add(camera);
 const hands=createRifle(weaponGroup);hands.body.visible=false;hands.magazine.visible=false;weaponGroup.userData.modularHands=hands;
 const model=createModularGun(activeGunCollection().kit);model.root.rotation.y=Math.PI/2;model.root.scale.setScalar(.43);model.root.userData.modularDispose=()=>model.dispose();weaponGroup.add(model.root);weaponGroup.userData.modularModel=model;
 weaponGroup.userData.opticY=.72*.43;weaponGroup.userData.sightX=0;
 flash=createMuzzleFlash();flash.position.set(0,.073,-.68);flash.scale.setScalar(.8);flash.visible=false;weaponGroup.add(flash);
 weaponGroup.scale.setScalar(.85);weaponGroup.position.set(.31,-.3,-.5);weaponGroup.visible=false;
 const light=new THREE.PointLight(0xffe5a3,0,2.2,2);light.position.copy(flash.position);weaponGroup.add(light);weaponGroup.userData.muzzleLight=light;weaponGroup.userData.secondaryFlashes=[];
 weaponGroup.traverse(m=>m.layers.set(1));tintPlayerArms();
}

function playSfx(name,options={}){if(muted)return null;return gameAudio.play(name,{volume:AUDIO_TUNING.volumes.ui,...options})}

function notify(text){$('toast').textContent=text;toastTime=2.3}
function rankList(){return[{name:'YOU',score:matchPoints,kills:matchKills,assists:matchAssists,deaths:deathCount,player:true},...bots.map(b=>({name:b.name,score:b.score,kills:b.frags||0,assists:b.assists||0,deaths:b.deaths,player:false}))].sort((a,b)=>b.score-a.score||a.deaths-b.deaths||Number(b.player)-Number(a.player))}
function rank(){return rankList().findIndex(b=>b.player)+1}
function updateHUD(){
 const ranks=rankList(),place=rank(),w=playerWeapon(),c=activeGunCollection(),circuit=PARTS[c.kit.circuit.id];
 $('round').textContent=String(round).padStart(2,'0');$('timer').textContent=`${Math.floor(Math.ceil(time)/60)}:${String(Math.ceil(time)%60).padStart(2,'0')}`;$('rank').innerHTML=`<b>${place}${['ST','ND','RD'][place-1]||'TH'}</b><small> / 6</small>`;
 tintPlayerArms();$('health').textContent=Math.ceil(toDisplay(health,BALANCE.playerHP));$('health-label').textContent=playerSlide.active?'SLIDING':crouched?'CROUCHED':'HEALTH';$('head-blocked').hidden=!headBlocked||respawnTime>0;$('healthbar').style.width=`${health/BALANCE.playerHP*100}%`;$('focusbar').style.width=`${focus}%`;$('slow-key').textContent=keyLabel(controls.bindings.slow.find(Boolean)||'');$('focuslabel').textContent=slow?'ACTIVE':focus<10?'CHARGING':'READY';
 $('ammo').textContent=reloading?'—':Math.floor(ammo/w.volley);$('weaponname').textContent=PARTS[c.kit.mechanism.id].name;$('weapon-icon').innerHTML=gunIcon(0);$('loadout').innerHTML='';
 $('utility').innerHTML=`<span class="hud-streak"><span>${circuit.name}</span><b>${playerGunLife.kills} kills</b></span><span class="hud-token" title="Collected attachment choices">◈ ${c.tokens}</span>${reloading?'<span class="reload-state">Reloading</span>':''}`;
 $('leaderboard').innerHTML=ranks.map((b,i)=>`<div class="score-row ${b.player?'you':''} ${i===2?'cutoff':''}"><span class="score-place">${i+1}</span><span class="score-name">${b.name}</span><b>${b.score}</b></div>`).join('');
}
function chooseArenaSpawn(exclude=null){
 const actors=bots.filter(b=>b!==exclude&&!b.dead&&b.lifeId).map(b=>({pos:b.pos}));
 if(exclude&&respawnTime<=0)actors.push({pos:{x:playerPos.x,y:playerPos.y-eyeHeight,z:playerPos.z},eye:playerPos});
 return chooseSpawn(spawnPoints,actors,{now:opponentAI?.clock||0,recent:spawnHistory,random:()=>Math.random(),canSee:(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z))});
}
function spawnBot(b){
 const s=chooseArenaSpawn(b);b.lifeId=(b.lifeId||0)+1;b.pos.set(s[0],s[1],s[2]);b.hp=maxHealth(BALANCE.botHP,b.rival?.perks);b.history=new DamageHistory();b.baseHealth=BALANCE.botHP;b.maxHealth=b.hp;clearDamageCredit(b);b.dead=0;b.hitReact=null;b.impactVector=null;b.deathAge=0;b.crouched=undefined;b.grounded=true;resetDummyRig(b);b.group.visible=true;b.group.position.copy(b.pos);b.vy=0;
 opponentAI?.reset(b,botNames.indexOf(b.name));tintDummy(b);
;if(b.rival?.collection){b.modularLife=createLife(b.lifeId);b.modularFire??=new ModularFire();b.modularFire.reset(gunStats(b.rival.collection,b.modularLife),b.lifeId);b.focus=100;b.focusRest=0;}}

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
 const color=b.dead?0x858c88:healthColors[Math.round(clamp(b.hp/(b.maxHealth||BALANCE.botHP),0,1)*20)];
 b.group.traverse(o=>{if(o.userData.healthShell)o.material=mat(color);if(o.geometry===targetGeo){if(b.dead){o.userData.liveMaterial??=o.material;o.material=mat(0x858c88)}else if(o.userData.liveMaterial)o.material=o.userData.liveMaterial}});
}
function tintPlayerArms(){const color=health<=0?0x858c88:healthColors[Math.round(clamp(health/(maxHealth(BALANCE.playerHP,perks)),0,1)*20)];weaponGroup?.traverse(m=>{if(m.userData.healthSkin)m.material=mat(color)})}
function healPlayer(value){if(Math.min(value,maxHealth(BALANCE.playerHP,perks))>health){health=Math.min(maxHealth(BALANCE.playerHP,perks),value);tintPlayerArms();clearDamageCredit(playerCredit);playerHistory.clear()}}
function healBot(b,value){if(Math.min(value,b.maxHealth||BALANCE.botHP)>b.hp){b.hp=Math.min(b.maxHealth||BALANCE.botHP,value);clearDamageCredit(b);b.history?.clear();tintDummy(b)}}
function awardAssists(target,killer){for(const a of takeAssists(target,killer)){if(a.id==='player'){matchPoints+=a.points;matchAssists++;if(assistNotice.left<=0)assistNotice={points:0,count:0,left:0};assistNotice.points+=a.points;assistNotice.count++;assistNotice.left=1.5}else{const bot=bots.find(b=>b.name===a.id);if(bot){bot.score+=a.points;bot.assists=(bot.assists||0)+1;if(bot.rival)bot.rival.credits+=BALANCE.assistCredits}}}}
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
 if(!rivals.length)rivals=rollRivals();
 botNames.forEach((name,i)=>{const rival=rivals[i];const d=createDummy(opponentAI.tuning.profiles[i].weapon);scene.add(d.group);const b={name,rival,loadout:rival.owned.map(g=>ALL_WEAPONS[g]),pos:new THREE.Vector3(),...d,hp:100,score:0,frags:0,headshots:0,deaths:0,dead:0,cool:1,side:i%2?1:-1,phase:Math.random()*7,stuck:0};d.group.traverse(o=>o.userData.bot=b);bots.push(b);spawnBot(b)});
}
function botHitMeshes(){const meshes=[];for(const b of bots)for(const p of Object.values(b.parts)){if(!p.visible)continue;p.traverseVisible(m=>{if(m.userData.hitProxy)meshes.push(m.userData.hitProxy);if(m.isMesh&&!m.userData.gunVisual)meshes.push(m)})}return meshes}
function shatterPart(b,name,point){if(!b.dead)return;const part=b.parts[name]||b.parts.torso;if(!part.visible)return;part.getWorldPosition(tmp);const center=point?point.clone().lerp(tmp,.5):tmp.clone();part.visible=false;for(let i=0;i<15;i++){const m=new THREE.Mesh(shardGeo,mat(i%4===0?0x182127:0x858c88));m.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.25,(Math.random()-.5)*.4,(Math.random()-.5)*.25));m.scale.set(.06+Math.random()*.08,.06+Math.random()*.13,.04+Math.random()*.07);scene.add(m);addEffect({mesh:m,life:.65+Math.random()*.5,max:1.2,vel:new THREE.Vector3((Math.random()-.5)*9,2+Math.random()*6,(Math.random()-.5)*9).addScaledVector(b.impactVector||new THREE.Vector3(),5),spin:new THREE.Vector3(Math.random()*12,Math.random()*10,Math.random()*9)})}playSfx('shatter',{pos:b.pos,volume:.35,curve:'foley',bus:'world',priority:1})}

function blocked(x,z,feet,r=.4,height=1.7){if(Math.abs(x)>MAP.bounds.x-.5||Math.abs(z)>MAP.bounds.z-.5)return true;return blockedAt(blocks,x,z,feet,r,height)}
function buildNav(){navigation=MAP.navigation?restoreNavigation(MAP.navigation,MAP.elevators,MAP.anchors,MAP.bounds,blocks,MAP.stepHeight,MAP.pads):buildNavigation(blocks,pickups.filter(p=>p.kind==='pad'),MAP.anchors,{bounds:MAP.bounds,maxHeight:MAP.maxHeight,noGround:!!MAP.brushes&&!MAP.navigationGround,stepHeight:MAP.stepHeight,gridStep:MAP.navigationGrid||1,refinement:MAP.navigationRefinement,elevators:MAP.elevators,water:MAP.water});navNodes=navigation.nodes}
function nearestNode(pos){return nearestAINode(navigation,pos)}
function findPath(from,to){return findRoute(navigation,from,to)}

function move(pos,dx,dz,feet,r=.4,height=1.7){if(!blocked(pos.x+dx,pos.z,feet,r,height))pos.x+=dx;if(!blocked(pos.x,pos.z+dz,feet,r,height))pos.z+=dz}
function floorAt(x,z,feet){return surfaceAt(blocks,x,z,feet)}
function visible(a,b){tmp2.copy(b).sub(a);const distance=tmp2.length();ray.set(a,tmp2.normalize());ray.far=distance;return !occluded(ray,worldMeshes)}
function surfaceNormal(hit){if(hit.worldNormal)return hit.normal.clone();
 const normal=new THREE.Vector3(),attribute=hit.object.geometry?.attributes.normal;
 // Imported BSP winding is reversed; its authored vertex normals point out of the solid.
 if(attribute&&hit.face)normal.fromBufferAttribute(attribute,hit.face.a).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));else if(hit.face)normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);else normal.copy(ray.ray.direction).negate();
 return normal.normalize();
}
function blastVisible(a,b){
 tmp2.copy(b).sub(a);const distance=tmp2.length();if(distance<.001)return true;ray.set(a,tmp2.normalize());ray.near=0;ray.far=Math.max(0,distance-.001);
 ray.firstHitOnly=false;try{return !ray.intersectObjects(worldMeshes,false).some(hit=>hit.distance>.003||surfaceNormal(hit).dot(ray.ray.direction)<-1e-5);}finally{ray.firstHitOnly=true;}
}

function readMapRotation(){try{return JSON.parse(localStorage.getItem('dh-map-rotation'))}catch{return null}}
function startRandomMatch(next=false){const draw=drawMapFromBag(MAPS.map(m=>m.id),readMapRotation(),()=>Math.random());return prepareArena(draw.mapId,()=>{changeArena(draw.mapId);localStorage.setItem('dh-map-rotation',JSON.stringify(draw.state));startMatch(next)})}
function restoreMapRotation(){const ids=MAPS.map(m=>m.id);if(!validMapRotation(readMapRotation(),ids))localStorage.setItem('dh-map-rotation',JSON.stringify(rotationAfterPlayedMap(ids,MAP.id,()=>Math.random())))}
function startMatch(next=false){clearModularRound();menuStage?.hide(camera);arena.traverse(o=>{if(o.name==='health-rings')o.visible=true;});minimap?.reset();spawnHistory.clear();elevatorSystem?.reset();$('panel').className='panel';if(!muted){gameAudio.unlock();gameAudio.applySettings(settings);gameAudio.warm()}gameAudio.startMusic();gameAudio.stopWorld();previewDummy.visible=false;for(const r of rockets)scene.remove(r.mesh);rockets=[];for(const e of effects)retireEffect(e);effects=[];feedback.reset();weaponMotion.reset();aimSpring.reset();for(const p of pickups){p.timer=0;p.mesh.visible=true}feeds.length=0;$('killfeed').innerHTML='';if(!next){rivals=rollRivals();round=1;credits=0;gunCollection=createCollection();owned=[0];equipped=startingWeapon=0;builds=normalizeBuilds();equipment=normalizeEquipment();shopOffers=null;pinnedOffer=null;starterConversionUsed=false;perks={};best=Number(localStorage.getItem('dh-best')||0)}else if(owned.includes(startingWeapon))equipped=startingWeapon;buildWeapon();time=90;matchPoints=headshotKills=matchAssists=0;assistNotice={points:0,count:0,left:0};matchKills=deathCount=streak=0;streakReady=false;focus=100;focusRest=0;specialAttacks=[];payloadTime=0;makeBots();spawnPlayer();mode='play';$('menu').hidden=true;$('panel').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');weaponGroup.visible=true;lock();notify(`ROUND ${round} · ${MAP.name}`);saveRun();if(mobile&&!isPractice()&&!localStorage.getItem('fg-touch-intro')){locked=false;mobile.showGuide('start');}}
function lock(){
 if(benchmarkChild){locked=true;return;}
 if(mobile?.enabled){if(!mobile.landscape){pause();return;}locked=true;dragLook=false;mobile.clear();mobile.closeOverlay();gameAudio.unlock();mobile.requestWake();return;}
 lastPointer=null;
 try{if(!renderer.domElement.requestPointerLock){enableDragLook();return}const request=renderer.domElement.requestPointerLock();request?.catch?.(()=>enableDragLook())}catch{enableDragLook()}
}
function enableDragLook(){
 if(mode!=='play')return;dragLook=true;locked=true;lastPointer=null;$('panel').hidden=true;renderer.domElement.style&&(renderer.domElement.style.cursor='none');$('hud').querySelector('.hudhint').textContent=controlHint();
}

function spawnPlayer(){mobileTargetIdle=0;mobileMeleeTarget=false;meleeCooldown=meleeSwing=0;mobileAutoJump.reset();frameRenderer?.resetHistory();playerSlide.reset();resetFireControl();feedSystem.reset(owned,i=>playerWeapon(i),loadedFeedPhases);loadedFeedPhases={};mobile?.clear();mobileTarget=null;headBlocked=false;$('head-blocked').hidden=true;crouched=crouchLatch=false;if(settings.crouchToggle)keys.delete('KeyC');eyeHeight=1.7;clearDeathView();playerHistory.clear();hurtFeedback.reset();$('damage').style.opacity=0;$('healthDanger').style.opacity=0;for(let i=0;i<HURT.maxDirections;i++)$('damageArc'+i).style.opacity=0;weaponMotion.reset();aimSpring.reset();jumpBuffered=coyoteTime=0;lastJumpHeld=false;viewHeight=playerPos.y;stepDistance=0;playerPadFlight=null;magazines=Object.fromEntries(owned.map(i=>[i,playerWeapon(i).mag]));playerSpawnAt=opponentAI?.clock||0;const s=chooseArenaSpawn();playerPos.set(s[0],s[1]+1.7,s[2]);health=maxHealth(BALANCE.playerHP,perks);tintPlayerArms();playerCredit.maxHealth=health;clearDamageCredit(playerCredit);vy=0;vel.set(0,0,0);yaw=MAP.spawnYaws?.[spawnPoints.indexOf(s)]??Math.atan2(playerPos.x,playerPos.z);pitch=0;ammo=playerWeapon().mag;reloading=0;shotTimer=.2;respawnTime=0;viewHeight=playerPos.y;syncAimCamera();focus=100;focusRest=0;playerGunLife=createLife(playerGunLife.id+1);playerGunFire.reset(playerWeapon(),playerGunLife.id);syncModularAmmo();streak=0;}
function shoot(){if(respawnTime>0||meleeSwing>0)return false;stepModularPlayer(0,true);return true;}
function payloadExplosion(pos,damage,radius,{direct=null,selfScale=.4,weapon='Explosive round',rocket=false,jump=1,exclude=null,owner=null,streak=false}={}){
 const outcomes=[];
 for(const b of bots){if(b===exclude||b.dead||b.hp<=0)continue;const center=b.pos.clone().add(new THREE.Vector3(0,1,0)),d=center.distanceTo(pos);if(b!==direct&&(d>=radius||!blastVisible(pos,center)))continue;const amount=damage*(b===direct?1:Math.max(0,1-d/radius));outcomes.push(damageBot(b,amount*(b===owner?selfScale:1),owner,'torso',pos,{defer:true,origin:pos,force:rocket?1.5:1,impactType:'rocket',weapon,streak}));}
 const d=playerPos.distanceTo(pos);if(exclude?.isPlayer!==true&&(direct?.isPlayer||d<radius&&blastVisible(pos,playerPos))){damagePlayer(damage*(owner?1:selfScale)*(direct?.isPlayer?1:1-d/radius),owner,{origin:pos,weapon,part:'torso',streak});if(rocket&&health>0){tmp.copy(playerPos).sub(pos).normalize();vel.addScaledVector(tmp,15*(1-d/radius)*jump);vy=Math.max(vy,(10*(1-d/radius)+3)*jump);}}
 if(rocket||elapsed-lastPayloadFX>.055){lastPayloadFX=elapsed;burst(pos,rocket?0xd9ef45:0xffc56d,rocket?16:8);const m=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:rocket?0xd9ef45:0xffc56d,wireframe:true,transparent:true,opacity:.6,depthWrite:false}));m.position.copy(pos);m.scale.setScalar(Math.min(radius*.18,.55));scene.add(m);addEffect({mesh:m,life:rocket?.28:.22,max:rocket?.28:.22,expand:true,expandRate:Math.min(radius*3,12),ownMat:true});playSfx('explosion',{pos,volume:rocket?.65:.28,curve:'explosion',bus:'explosions',priority:rocket?3:1});}
 return outcomes;
}
// Count active mobile gameplay time only; reacquiring any valid target resets
// the quiet window. Use the same attachment/feed/perk timing as the reload itself.
function stepMobileReload(dt){
 if(!mobile?.enabled||!mobile.active||respawnTime>0)return;
 const w=playerWeapon();
 if(ammo===0&&!mobileMeleeTarget&&meleeSwing<=0&&reloading<=0&&w.feedMode!=='recovery'){reload();mobileTargetIdle=0;return;}
 if(mobileTarget||mouseDown||fireControl.charging||reloading>0||meleeSwing>0||ammo>=w.mag){mobileTargetIdle=0;return;}
 mobileTargetIdle+=dt;
 if(w.feedMode==='recovery')return;
 const wait=2*reloadDuration(w,ammo,feedSystem.state(equipped).fast)*(perks.reload?.75:1);
 if(ammo===0||mobileTargetIdle+1e-7>=wait){reload();mobileTargetIdle=0;}
}
function melee(){
 if(mode!=='play'||!locked||respawnTime>0||meleeCooldown>1e-7)return false;
 meleeCooldown=MELEE.interval;meleeSwing=MELEE.duration;
 resetFireControl();feedSystem.cancel(equipped);playerGunFire.reloadUntil=0;playerGunFire.pending=playerGunFire.pending.filter(e=>e.kind!=='ejection');reloading=0;
 playSfx('melee',{volume:.35,curve:'foley',bus:'self'});
 syncAimCamera();scene.updateMatrixWorld(true);
 const strike=new THREE.Raycaster(camera.position,camera.getWorldDirection(new THREE.Vector3()),0,MELEE.range);
 const hit=closestHit(strike,worldMeshes,botHitMeshes()),b=hit?.object.userData.bot;
 if(!b||b.dead||b.hp<=0)return false;
 damageBot(b,(b.maxHealth||BALANCE.botHP)*.5,null,hit.object.userData.part||'torso',hit.point,{head:false,headKill:false,weapon:'Melee',impactType:'melee',force:1.3,origin:camera.position,modular:true,lifeId:playerGunLife.id});
 playSfx('impact',{pos:hit.point,volume:.3,curve:'foley',bus:'world',priority:2});
 return true;
}
function reload(){if(respawnTime>0||meleeSwing>0)return false;const ok=playerGunFire.manualReload(playerWeapon());if(ok)syncModularAmmo();return ok;}
function stepFeeds(){syncModularAmmo();}
function switchWeapon(){return false;}

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
  b.dead=3;dropChoiceToken(b.pos);b.deathAge=0;b.deaths++;beginRagdoll(b,b.impactVector,part);awardAssists(b,killer?killer.name:'player');tintDummy(b);shatterPart(b,part,point);
  if(killer){killer.score=Math.max(0,killer.score+(killer===b?-100:result.points));if(killer!==b){killer.frags=(killer.frags||0)+1;if(head)killer.headshots=(killer.headshots||0)+1;if(options.modular)modularKill(killer,options.lifeId)}feed(killer.name,b.name)}
  else{matchKills++;matchPoints+=result.points;if(head)headshotKills++;if(options.modular)modularKill(null,options.lifeId);
   feed('YOU',b.name);
  }
  burst(b.pos.clone().add(new THREE.Vector3(0,1,0)),0x858c88,8);
 }
 tintDummy(b);
 const feedbackResult={...result,damage:toDisplay(result.damage,BALANCE.botHP),head:result.killed?head:!!(options.head??part==='head')};
 if(!killer&&!options.defer)confirmOutcomes([feedbackResult]);return feedbackResult;
}
function damagePlayer(dmg,killer,options={}){
 if(isPractice())return;
 if(respawnTime>0||health<=0||!Number.isFinite(dmg)||dmg<=0)return;const before=health;health=Math.max(0,health-dmg);tintPlayerArms();if(killer)recordDamage(playerCredit,killer.name,before-health);
 playerHistory.record(killer?killer.name:'self',killer?killer.name:'YOU',options.weapon||weaponLabel(killer),before-health,options.parts||[{part:options.head?'head':options.part||'torso',damage:before-health}]);
 const source=options.origin||killer?.pos;const bearing=source&&Math.hypot(source.x-playerPos.x,source.z-playerPos.z)>.1?Math.atan2(source.x-playerPos.x,source.z-playerPos.z):null;hurtFeedback.hit(before-health,maxHealth(BALANCE.playerHP,perks),bearing,killer?`${killer.name}:${killer.lifeId||0}`:'blast');
 if(hurtSoundCooldown<=0){playSfx('damage',{volume:.25});hurtSoundCooldown=.15}
 if(killer){weaponMotion.trauma=Math.min(.45,weaponMotion.trauma+.12)}
 if(health<=0&&before>0){mobileAutoJump.reset();playerSlide.reset();resetFireControl();awardAssists(playerCredit,killer?.name);deathCount++;dropChoiceToken(playerPos.clone().add(new THREE.Vector3(0,-eyeHeight,0)));streak=0;respawnTime=2.2;mouseDown=false;keys.delete('MouseRight');beginDeathView(killer,options.weapon);
  if(killer){killer.score+=options.head?150:100;killer.frags=(killer.frags||0)+1;if(options.head)killer.headshots=(killer.headshots||0)+1;if(options.modular)modularKill(killer,options.lifeId);feed(killer.name,'YOU')}else feed('THE ARENA','YOU');
  notify('RESPAWNING');playSfx('damage',{volume:.45});
 }
}

function weaponLabel(){return 'Modular gun';}
function clearDeathView(){if(deathView?.highlight){scene.remove(deathView.highlight);deathView.fill.dispose();deathView.line.dispose()}deathView=null;$('death-recap').hidden=true;$('killer-tag').hidden=true;document.body.classList.remove('respawning')}
function beginDeathView(killer,killingWeapon){
 clearDeathView();const outgoing=killer?.history?.snapshot('player')[0]||null;
 const gun=killingWeapon?weapons.findIndex(w=>w.name===killingWeapon):ALL_WEAPONS.indexOf(killer?.brain?.weaponType);
 const loadout=killer?{weapon:killingWeapon||weapons[gun]?.name||'Weapon',attachments:killer.rival?.collection?MODULAR_SLOTS.map(slot=>({name:PARTS[killer.rival.collection.kit[slot].id].name,slot})):[]}:null;
 const recap={attackers:displayedHistory(playerHistory.snapshot(),BALANCE.playerHP),outgoing:outgoing?displayedHistory([outgoing],BALANCE.botHP)[0]:null,killer:killer?{id:killer.name,name:killer.name,health:Math.min(100,toDisplay(Math.max(0,killer.hp),BALANCE.botHP)),armor:Math.max(0,toDisplay(killer.hp,BALANCE.botHP)-100),loadout}:null};
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
function arcTrail(start,end,player=false){
 const delta=end.clone().sub(start),middle=start.clone().addScaledVector(delta,.5).add(new THREE.Vector3((Math.random()-.5)*.45,.2,(Math.random()-.5)*.45));
 trail(start,middle,0x81e4dd,.23,.035);trail(middle,end,0x81e4dd,.23,.035);burst(end,0x81e4dd,4);playSfx('arc-hit',{pos:end,volume:.3,curve:'weapon',bus:'world'});if(player){payloadText='CHAIN LIGHTNING';payloadTime=.7;}
}
function burst(pos,c,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(sphereGeo,mat(c));m.position.copy(pos);m.scale.setScalar(.05+Math.random()*.08);scene.add(m);addEffect({mesh:m,life:.25+Math.random()*.3,max:.55,vel:new THREE.Vector3((Math.random()-.5)*6,Math.random()*5,(Math.random()-.5)*6)})}}
function stepAttachmentRocket(r,dt){
 const w=r.mods.spec,old=r.firstStep?r.launchOrigin.clone():r.mesh.position.clone();r.firstStep=false;r.life-=dt;r.mesh.position.addScaledVector(r.vel,dt);const pos=r.mesh.position,delta=pos.clone().sub(old),length=delta.length();
 ray.set(old,delta.normalize());ray.near=0;ray.far=length+.005;const actors=r.owner?rivalTargets(r.owner):botHitMeshes().filter(m=>!m.userData.bot?.dead&&m.userData.bot?.hp>0),hit=length>0?closestHit(ray,worldMeshes,actors):null;
 let proximity=false;if(w.proximity&&pos.distanceTo(r.origin)>=w.arming)proximity=[...bots,...(r.owner&&respawnTime<=0?[playerCombatActor()]:[])].some(b=>b!==r.owner&&!b.dead&&b.hp>0&&b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos)<=w.proximity&&visible(pos,b.pos.clone().add(new THREE.Vector3(0,1,0))));
 const wall=hit&&!hit.object.userData.bot;
 if(wall&&r.bounces>0&&r.life>0){const normal=surfaceNormal(hit);r.vel.reflect(normal);pos.copy(hit.point).addScaledVector(normal,.04);r.bounces--;playSfx('bolt',{pos,volume:.25});return false;}
 const solid=blocked(pos.x,pos.z,pos.y-.1,.1)||pos.y<.1;
 if(hit||solid||proximity||r.life<=0){
  const direct=hit?.object.userData.bot||null,point=hit?hit.point.clone().addScaledVector(surfaceNormal(hit),.025):pos.clone(),outcomes=[];
  if(direct&&!direct.dead){const impact=w.payload==='breach'?w.damage+w.splash:w.damage;outcomes.push(damageCombatActor(direct,impact,r.owner,'torso',point,{defer:true,origin:r.origin,weapon:w.weapon,impactType:'rocket',force:1.5,streak:!!w.streak}));}
  const damage=w.rocketSplash??w.damage;outcomes.push(...payloadExplosion(point,damage,w.blast,{direct:null,selfScale:.4,weapon:w.weapon,rocket:true,jump:w.jump,exclude:direct,owner:r.owner,streak:!!w.streak}));if(!r.owner)confirmOutcomes(outcomes);return true;
 }
 r.trail-=dt;if(r.trail<=0){trail(old,pos,w.payload==='airburst'?0x81e4dd:0xd9ef45,.13,.03);r.trail=.045;}return false;
}
function stepLegacyRocket(r,dt){
 const old=r.firstStep?r.launchOrigin.clone():r.mesh.position.clone();r.firstStep=false;r.life-=dt;r.mesh.position.addScaledVector(r.vel,dt);
 const pos=r.mesh.position,delta=pos.clone().sub(old),length=delta.length();ray.set(old,delta.normalize());ray.near=0;ray.far=length+.002;
 const actors=botHitMeshes().filter(m=>m.userData.bot!==r.owner&&!m.userData.bot?.dead&&m.userData.bot?.hp>0),hit=length>0?closestHit(ray,worldMeshes,actors):null;
 let point=hit?hit.point.clone():null,normal=hit?surfaceNormal(hit):null;
 if(r.owner&&respawnTime<=0){const playerBox=new THREE.Box3(new THREE.Vector3(playerPos.x-.35,playerPos.y-eyeHeight+.15,playerPos.z-.35),new THREE.Vector3(playerPos.x+.35,playerPos.y+.12,playerPos.z+.35)),p=ray.ray.intersectBox(playerBox,new THREE.Vector3());if(p&&p.distanceTo(old)<=length&&(!point||p.distanceToSquared(old)<point.distanceToSquared(old))){point=p;normal=r.vel.clone().normalize().negate();}}
 if(point||r.life<=0||pos.y<.1){explode(point?point.addScaledVector(normal,.025):pos,r.owner,r.damageScale,r.mods);return true;}
 r.trail-=dt;if(r.trail<=0){trail(old,pos,0xd9ef45,.15,.035);r.trail=.045;}return false;
}
function launchRocket(pos,dir,owner,damageScale=1,mods={}){const m=new THREE.Mesh(sphereGeo,mat(0xd9ef45));m.scale.setScalar(.13);m.position.copy(pos).addScaledVector(dir,.8);scene.add(m);rockets.push({mesh:m,launchOrigin:pos.clone(),firstStep:true,vel:dir.clone().multiplyScalar(24*(mods.projectile||1)),life:4,owner,damageScale,mods,trail:0})}
function explode(pos,owner,damageScale=1,mods={}){burst(pos,0xd9ef45,25);playSfx('explosion',{pos,volume:.85,curve:'explosion',bus:'explosions',priority:3});const radius=5.5*(mods.radius||1),outcomes=[];weaponMotion.blast(playerPos.distanceTo(pos));for(const b of bots){const d=b.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(pos);if(d<radius&&blastVisible(pos,b.pos.clone().add(new THREE.Vector3(0,1,0)))){if(!b.dead)outcomes.push(damageBot(b,(65*(1-d/radius)+15)*damageScale,owner,'torso',null,{defer:true,origin:pos,force:1.5,impactType:'rocket',weapon:'THUMPER'}));if(b.dead)for(const name of Object.keys(b.parts))if(d<radius*.65)shatterPart(b,name)}}if(!owner)confirmOutcomes(outcomes);for(let i=0;i<5;i++){const smoke=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:i%2?0x182127:0x7b8984,transparent:true,opacity:.25,depthWrite:false}));smoke.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*1.5,Math.random(),(Math.random()-.5)*1.5));smoke.scale.setScalar(.3+Math.random()*.4);scene.add(smoke);addEffect({mesh:smoke,life:.55,max:.55,expand:true,smoke:true,ownMat:true,opacity:.25,vel:new THREE.Vector3(0,.6,0)})}const d=playerPos.distanceTo(pos);if(d<radius&&blastVisible(pos,playerPos)){damagePlayer(60*(1-d/radius)*damageScale*(mods.selfDamage||1),owner,{origin:pos,weapon:'THUMPER',part:'torso'});if(health>0){tmp.copy(playerPos).sub(pos).normalize();vel.addScaledVector(tmp,15*(1-d/radius)*(mods.jump||1));vy=Math.max(vy,(10*(1-d/radius)+3)*(mods.jump||1))}}const m=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:0xd9ef45,wireframe:true,transparent:true,opacity:.7}));m.position.copy(pos);m.scale.setScalar(1);scene.add(m);addEffect({mesh:m,life:.35,max:.35,expand:true,ownMat:true})}
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
function syncAimCamera(){if(deathView&&respawnTime>0){camera.position.copy(deathView.position);return}camera.position.copy(playerPos);camera.position.y=viewHeight+(grounded&&!playerSlide.active?Math.sin(moveClock*1.7)*.025*settings.motion:0);camera.rotation.set(pitch+aimSpring.x,yaw,0);camera.updateMatrixWorld(true)}
function present(dt){
 const w=playerWeapon(),h=playerHandling(),aiming=respawnTime<=0&&keys.has('MouseRight')&&reloading<=0&&meleeSwing<=0;
 weaponMotion.step(dt,h,{aiming,turnX,turnY,adsSpeed:1/(w.ads*(perks.quickdraw?.75:1))});turnX*=Math.exp(-dt*20);turnY*=Math.exp(-dt*20);aimSpring.step(dt,180,25);
 viewHeight=grounded?THREE.MathUtils.damp(viewHeight,playerPos.y,22,dt):playerPos.y;syncAimCamera();updateDeathView(dt);
 const ads=weaponMotion.ads,k=weaponMotion.kick.x,land=weaponMotion.land.x,m=settings.motion,phase=playerSlide.active?0:moveClock*1.7;
 const reloadP=reloading>0?1-reloading/reloadLength:0,reloadPose=Math.sin(reloadP*Math.PI),pump=equipped===5?Math.sin(clamp((weaponMotion.shotAge-.12)/.25,0,1)*Math.PI):0;
 ray.set(camera.position,camera.getWorldDirection(aim));ray.far=1.4;nearWall=THREE.MathUtils.damp(nearWall,closestHit(ray,worldMeshes)?1:0,12,dt);
 weaponGroup.position.set(.31*(1-ads)-(weaponGroup.userData.sightX||0)*.85*ads+Math.sin(phase*.5)*.012*m*(1-ads)-weaponMotion.swayX*m,-.3+(.3-weaponGroup.userData.opticY*.85)*ads+Math.abs(Math.cos(phase))*.012*m*(1-ads)-land*.18-k*h.lift-reloadPose*(weaponGroup.userData.nailer?.065:.055)-weaponMotion.equip*.5,-.5+k*h.back+nearWall*.28);
 weaponGroup.rotation.set(k*h.rx-reloadPose*(weaponGroup.userData.nailer?.24:.25)+nearWall*.55+land*.12, k*h.ry+weaponMotion.swayX*m, k*h.roll+reloadPose*h.reloadRoll);
 const swing=Math.sin(Math.PI*(1-meleeSwing/MELEE.duration))*(meleeSwing>0?1:0);weaponGroup.position.x-=swing*.18;weaponGroup.position.z-=swing*.22;weaponGroup.rotation.x-=swing*.35;weaponGroup.rotation.z+=swing*.55;
 if(weaponGroup.userData.nailer)animateNailer(weaponGroup.userData.nailer,{reload:reloadP,reloading:reloading>0&&w.feedMode!=='individual',shotAge:weaponMotion.shotAge,ammo});
 if(weaponGroup.userData.heroTool)animateToolWeapon(weaponGroup.userData.heroTool,{reload:reloadP,reloading:reloading>0&&w.feedMode!=='individual',shotAge:weaponMotion.shotAge,ammo,charge:fireControl.charge/(w.charge||1)});
 if(weaponGroup.userData.modularHands){const h=weaponGroup.userData.modularHands;animateRifle(h,{reload:reloadP,reloading:reloading>0,shotAge:weaponMotion.shotAge,ammo});h.body.visible=false;h.magazine.visible=false;const m=weaponGroup.userData.modularModel;m.ammo.position.y=reloading>0?-Math.sin(reloadP*Math.PI)*.22:0;if(w.barrel==='gatling')m.barrel.rotation.x+=dt*playerGunFire.spool*7;}
 if(weaponGroup.userData.conversionModels)animateAttachmentModels(weaponGroup.userData.conversionModels,{reload:reloadP,reloading:reloading>0,shotAge:weaponMotion.shotAge,ammo,charge:fireControl.charge/(w.charge||1),heat:fireControl.heat,time:elapsed,anchor:fireControl.anchor>=.25?1:0,feedPhase:feedSystem.state(equipped).fast?0:1});
 weaponGroup.rotation.z+=Math.sin(elapsed*49)*weaponMotion.trauma*.012*m;
 const moving=weaponGroup.userData.moving;if(moving)for(const part of moving){part.mesh.position.copy(part.base);part.mesh.position.y-=reloadPose*part.mag*.25;part.mesh.position.z+=pump*part.pump*.16+Math.max(0,1-weaponMotion.shotAge/.07)*part.slide*.06}
 camera.fov=THREE.MathUtils.damp(camera.fov,settings.fov+((w.optic||equipped===3?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(65)/2)/w.zoom)):h.adsFov)-settings.fov)*ads+(slow?6:0),12,dt);camera.updateProjectionMatrix();camera.getWorldDirection(aim);gameAudio.updateListener(camera.position,aim);gameAudio.setSlow(slow);
 $('weapon-state').textContent=fireControl.charging?'CHARGING '+Math.round(fireControl.charge/(w.charge||1)*100)+'%'+(equipped===4&&!automaticTouchFire()?' · RELEASE TO FIRE':''):w.slamfire&&fireControl.heat>.1?'SLAMFIRE · '+Math.round(fireControl.heat*100)+'% RECOIL':payloadTime>0?payloadText:'';
 weaponGroup.visible=respawnTime<=0;muzzleTime=Math.max(0,muzzleTime-dt);flash.visible=muzzleTime>0&&!reloading;flash.rotation.z=Math.random()*6;flash.scale.setScalar(.65+Math.random()*.45);for(const secondary of weaponGroup.userData.secondaryFlashes||[]){secondary.visible=flash.visible;secondary.scale.copy(flash.scale);secondary.rotation.z=flash.rotation.z;}weaponGroup.userData.muzzleLight.intensity=flash.visible?16:0;
 payloadTime=Math.max(0,payloadTime-dt);feedback.step(dt);toastTime=Math.max(0,toastTime-dt);
 $('hitmarker').className=feedback.kind;$('hitmarker').style.opacity=feedback.left>0?1:0;$('hitmarker').style.transform=`translate(-50%,-50%) scale(${1+(feedback.kind.includes('kill')?.6:0)+Math.max(0,feedback.left/Math.max(.01,feedback.duration))*.14})`;
 $('scorepop').textContent=feedback.points?`+${feedback.points} ${feedback.label}`:'';$('scorepop').style.opacity=Math.min(1,feedback.scoreLeft*5);
 assistNotice.left=Math.max(0,assistNotice.left-dt);$('assistpop').textContent=assistNotice.count?`+${assistNotice.points} ${assistNotice.count>1?assistNotice.count+' ASSISTS':'ASSIST'}`:'';$('assistpop').style.opacity=Math.min(1,assistNotice.left*4);
 const hurt=hurtFeedback.step(dt,health,maxHealth(BALANCE.playerHP,perks),yaw,{alive:respawnTime<=0&&health>0,motion:settings.motion});
 $('damage').style.opacity=hurt.flash*.55;$('healthDanger').style.opacity=hurt.edge;$('healthDanger').className=hurt.critical?'critical':'';
 for(let i=0;i<HURT.maxDirections;i++){const cue=hurt.directions[i],node=$('damageArc'+i);node.style.opacity=cue?cue.opacity:0;if(cue){node.className='damage-arc '+cue.kind;node.style.transform=`rotate(${cue.rotation}rad) scale(${cue.scale})`}}
 $('health').style.color=hurt.critical?'#ff7863':health<=(maxHealth(BALANCE.playerHP,perks))*.55?'#ffc183':'';
 if(hurt.beat)playSfx('heartbeat',{volume:.22,bus:'ui',priority:1});
 $('toast').style.opacity=toastTime>0?1:0;

 drawMinimap();
 lastHUD+=dt;if(lastHUD>.1){lastHUD=0;updateHUD()}
}

function moveBotSlide(bot,b,dt,destination,speed){
 b.slide??=new CrouchSlide();const skill=opponentAI.difficulty.slideSkill,dx=destination.x-bot.pos.x,dz=destination.z-bot.pos.z,d=Math.max(.01,Math.hypot(dx,dz)),water=waterAt(bot.pos.x,bot.pos.y+.12,bot.pos.z);
 let wants=b.slide.active&&b.slide.age<b.slideDuration&&!water&&!b.recover&&!b.flight&&Math.hypot(b.goal.x-bot.pos.x,b.goal.z-bot.pos.z)>1.8;
 const heading=Math.atan2(b.moveZ,b.moveX),desired=Math.atan2(dz,dx),turn=Math.abs(Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading)));
 if(wants&&(turn>1.25||!['walk','drop'].includes(destination.action||'walk')))wants=false;
 if(!b.slide.active&&b.tacticalSlideCooldown<=0&&b.slideTryIn<=0){b.slideTryIn=1.3-skill*.4;const n=b.path[1],corner=n&&Math.abs(Math.atan2(Math.sin(Math.atan2(n.z-destination.z,n.x-destination.x)-desired),Math.cos(Math.atan2(n.z-destination.z,n.x-destination.x)-desired)))>.45;
  const length=2.6+skill*1.5,clear=opponentAI.walkClear(bot.pos,{x:bot.pos.x+dx/d*length,y:bot.pos.y,z:bot.pos.z+dz/d*length}),m=b.memory.get(b.target);
  const plan=botSlideChoice({skill,speed:Math.hypot(b.moveX,b.moveZ),grounded:bot.grounded,swimming:!!water,clear:clear&&turn<.9,precision:b.weapon.native?.charge>0||b.weaponType==='rail'&&b.visible,recover:b.recover>0||b.dodge||b.flight||b.liftRide,goalDistance:Math.hypot(b.goal.x-bot.pos.x,b.goal.z-bot.pos.z),targetDistance:m?Math.hypot(m.pos.x-bot.pos.x,m.pos.z-bot.pos.z):0,preferredRange:b.preferredRange,visible:b.visible,underFire:b.underFire>0,corner,goal:b.goal.type,spawnAge:opponentAI.clock-b.spawnAt},()=>Math.random());
  if(plan){wants=true;b.slideDuration=plan.duration;b.tacticalSlideCooldown=plan.cooldown;b.slideReason=plan.reason;}
 }
 const result=b.slide.step(dt,{vx:b.moveX,vz:b.moveZ,wishX:dx/d*speed,wishZ:dz/d*speed,crouch:!!wants,grounded:bot.grounded,swimming:!!water,slope:slideSlope(blocks,bot.pos,b.moveX,b.moveZ)});
 if(result.entered){opponentAI.stats.slides++;opponentAI.stats.slideReasons[b.slideReason]=(opponentAI.stats.slideReasons[b.slideReason]||0)+1;}
 if(!result.active){bot.crouched=canOccupy(blocks,{x:bot.pos.x,z:bot.pos.z,feet:bot.pos.y,radius:.4,height:COLLISION.standing})?undefined:true;return false;}
 bot.crouched=true;b.moveX=result.x;b.moveZ=result.z;
 const p=moveCharacter(blocks,{x:bot.pos.x,z:bot.pos.z,feet:bot.pos.y,radius:.4,height:COLLISION.crouching},{x:result.x*dt,y:-.01,z:result.z*dt},{grounded:bot.grounded,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step}),distance=Math.hypot(p.x-bot.pos.x,p.z-bot.pos.z);
 bot.pos.set(p.x,p.feet,p.z);bot.grounded=p.grounded;for(const n of p.normals){const into=b.moveX*n.x+b.moveZ*n.z;if(into<0){b.moveX-=n.x*into;b.moveZ-=n.z*into;}}
 if(distance<Math.hypot(result.x,result.z)*dt*.2||Math.hypot(b.moveX,b.moveZ)<2.3){b.slide.stop();b.pathIn=0;}
 opponentAI.setAction(b,'slide',b.slideReason||'momentum');return true;
}

function createOpponentAI(){
 return new ArenaAI({navigation,round,random:()=>Math.random(),world:{
  weapon:(b,type)=>{if(!b.rival?.collection)return null;const native=gunStats(b.rival.collection,b.modularLife||{},b.modularFire?.spool||0);return{...AI_TUNING.weapons.rifle,...weaponEngagement(native,'rifle'),damage:native.damage,interval:native.interval,magazine:native.mag,reload:native.reload,range:90,idealRange:native.idealRange,native};},
  tokens:()=>choiceTokens,
  moveScale:b=>modularMoveScale(b),
  actorTimeScale:b=>b===botFocusOwner?1/BALANCE.worldSlow:1,
  pickups,
  projectiles:()=>rockets.map(r=>({pos:r.mesh.position,velocity:r.vel,owner:r.owner})),
  actors:()=>[
   {id:'player',pos:{x:playerPos.x,y:playerPos.y-eyeHeight,z:playerPos.z},eye:playerPos,hp:toDisplay(health,BALANCE.playerHP),alive:respawnTime<=0,spawnAge:(opponentAI?.clock||0)-playerSpawnAt},
   ...bots.map(b=>({id:b.name,pos:b.pos,eye:{x:b.pos.x,y:b.pos.y+1.65-(b.anim?.crouch||0)*.5,z:b.pos.z},hp:toDisplay(b.hp,BALANCE.botHP),alive:!b.dead,spawnAge:(opponentAI?.clock||0)-(b.brain?.spawnAt||0)}))
  ],
  canSee:(a,b)=>visible(new THREE.Vector3(a.x,a.y,a.z),new THREE.Vector3(b.x,b.y,b.z)),
  elevator:rideElevator,
  swim:(b,destination)=>{b.brain.swimY=destination.y;b.brain.swimUntil=opponentAI.clock+.2},
  slideMove:moveBotSlide,
  move:(b,dx,dz)=>{if(b.crouched){const p=moveCharacter(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:COLLISION.crouching},{x:dx,y:0,z:dz},{grounded:b.grounded,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});b.pos.set(p.x,p.feet,p.z);return;}if(!MAP.brushes){move(b.pos,dx,dz,b.pos.y);return}const p=moveCharacter(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:1.9},{x:dx,y:0,z:dz},{grounded:Math.abs(b.vy)<.1,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});b.pos.set(p.x,p.feet,p.z)},
  physics:(b,brain,dt)=>{
   if(brain.slide&&!brain.slide.active&&b.crouched&&canOccupy(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:COLLISION.standing}))b.crouched=undefined;
   const feet=b.pos.y,fallSpeed=b.vy,water=waterAt(b.pos.x,b.pos.y+.12,b.pos.z);
   if(water)b.vy=swimVertical(b.vy,b.pos.y,1.9,water.top,dt,brain.swimUntil>opponentAI.clock?clamp((brain.swimY-b.pos.y)*.7,-1,1):0);else b.vy-=23*dt;
   const contact=moveCharacter(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y,radius:.4,height:b.crouched?COLLISION.crouching:COLLISION.standing},{x:0,y:b.vy*dt,z:0},{bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});b.pos.y=contact.feet;b.grounded=contact.grounded;
   if(Number.isFinite(MAP.killBelow)&&b.pos.y<MAP.killBelow){damageBot(b,Math.max(1,b.hp),b,'torso',null,{weapon:'Fall',defer:true,head:false});return;}
   if(contact.ceiling&&b.vy>0)b.vy=0;
   if(contact.grounded&&b.vy<=0){if(fallSpeed< -4&&!muted&&!water)gameAudio.footstep(new THREE.Vector3(b.pos.x,contact.feet+.15,b.pos.z),{metal:contact.feet>2,landing:true});if(brain.lastFloor>=2.9&&contact.feet<1)opponentAI.stats.drops++;brain.lastFloor=contact.feet;b.vy=0;if(brain.flight){brain.flight=null;brain.pathIn=0}}
   if(brain.flight){brain.flight.age+=dt;if(brain.flight.age>3){brain.flight=null;brain.pathIn=0}}
   if(!brain.flight)for(const link of navigation.pads)if(Math.abs(b.pos.y-link.y)<.3&&Math.abs(b.vy)<.1&&Math.hypot(b.pos.x-link.x,b.pos.z-link.z)<(link.triggerRadius||1.25)){const target=link.landing||link.to,t=launchTime(link.power,target.y-b.pos.y);brain.flight={vx:(target.x-b.pos.x)/t,vz:(target.z-b.pos.z)/t,age:0};b.vy=link.power;opponentAI.stats.pads++;break}
  },
  fire:fireBotWeapon,
  equip:(b,weapon)=>{if(b.rival?.collection){buildModularDummyGun(b);return;}const gun=buildDummyGun(b.parts.rightArm,weapon);if(b.rival){const g=ALL_WEAPONS.indexOf(weapon),model=gun.children[0];applyAttachmentModels(model,g,fitted(g,b.rival.builds));}gun.traverse(m=>{m.userData.bot=b;m.userData.part='rightArm'})},
  telegraph:(b,point,dt)=>{if(opponentAI.clock-(b.telegraphSoundAt??-Infinity)>.7){b.telegraphSoundAt=opponentAI.clock;playSfx('charge',{pos:b.pos.clone().add(new THREE.Vector3(0,1.3,0)),volume:.4,curve:'weapon',bus:'world',priority:3});}b.laserIn=(b.laserIn||0)-dt;if(b.laserIn<=0){const origin=b.pos.clone().add(new THREE.Vector3(0,1.3,0)),end=new THREE.Vector3(point.x,point.y,point.z);const dir=end.clone().sub(origin).normalize();ray.set(origin,dir);ray.far=origin.distanceTo(end);const hit=closestHit(ray,worldMeshes);trail(origin,hit?.point||end,0xd9ef45,.12,.012);b.laserIn=.1}},
  collect:(b,brain)=>{for(const p of pickups){if(p.kind!=='health'||p.timer>0||Math.hypot(b.pos.x-p.x,b.pos.z-p.z)>(p.amount===5?.65:1.1)||Math.abs(b.pos.y-p.y)>1.1)continue;const hp=healthAfterPickup(b.hp,b.maxHealth||BALANCE.botHP,p,BALANCE.botHP);if(hp===b.hp)continue;healBot(b,hp);p.timer=p.respawn;p.mesh.visible=false;brain.thinkIn=0;opponentAI.stats.pickups++}},
  animate:(b,brain,dt)=>{
   animateDummy(b,brain,dt,floorAt);
   if(b.modularModel){const m=b.modularModel,w=brain.weapon.native;b.modularMuzzleTime=Math.max(0,(b.modularMuzzleTime||0)-dt);m.flash.visible=b.modularMuzzleTime>0;if(w?.barrel==='gatling')m.barrel.rotation.x+=dt*(b.modularFire?.spool||0)*7;const f=b.modularFire,progress=f?.reloading?Math.max(0,Math.min(1,(f.clock-f.reloadStart)/(f.reloadUntil-f.reloadStart))):0;m.ammo.position.y=-Math.sin(progress*Math.PI)*.22;}

   if(b.anim.footfall&&b.vy===0){const pos=b.pos.clone().add(new THREE.Vector3(0,.15,0));if(!muted)gameAudio.footstep(pos,{metal:b.pos.y>2,quiet:b.anim.crouch>.5});opponentAI.hear(pos,b,b.anim.crouch>.5?5:10)}
   if(brain.reload>0&&!brain.wasReloading)playSfx('reload-out',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});
   if(brain.reload<=0&&brain.wasReloading)playSfx('bolt',{pos:b.pos.clone().add(new THREE.Vector3(0,1.2,0)),volume:.35,curve:'foley',bus:'world',priority:1});brain.wasReloading=brain.reload>0;
   brain.previous={x:b.pos.x,y:b.pos.y,z:b.pos.z};
  }

 }});
}
// Present the player to the shared ballistic resolver through the same actor contract.
function playerCombatActor(){return {isPlayer:true,name:'YOU',pos:new THREE.Vector3(playerPos.x,playerPos.y-eyeHeight,playerPos.z),hp:health,dead:respawnTime>0};}
function rivalTargets(owner){
 const targets=botHitMeshes().filter(m=>m.userData.bot!==owner&&!m.userData.bot.dead),actor=playerCombatActor();
 if(!actor.dead&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace){
  const proxy=new THREE.Object3D(),box=new THREE.Box3(new THREE.Vector3(playerPos.x-.35,playerPos.y-eyeHeight+.15,playerPos.z-.35),new THREE.Vector3(playerPos.x+.35,playerPos.y+.12,playerPos.z+.35));proxy.userData.bot=actor;
  proxy.raycast=(caster,hits)=>{const point=caster.ray.intersectBox(box,new THREE.Vector3());if(!point)return;const distance=point.distanceTo(caster.ray.origin);if(distance<caster.near||distance>caster.far)return;const object={userData:{bot:actor,part:bodyPartAt(point,playerPos,yaw,eyeHeight)}};hits.push({point,distance,object});};targets.push(proxy);
 }
 return targets;
}
function damageCombatActor(actor,damage,owner,part,point,options={}){if(actor.isPlayer){damagePlayer(damage,owner,{...options,part,head:options.headKill??part==='head'});return {killed:health<=0};}return damageBot(actor,damage,owner,part,point,options);}
function fireRivalWeapon(b,point,w){
 minimap?.shot(b.name,b.pos);
 fireDummy(b,w.type);const origin=b.pos.clone().add(new THREE.Vector3(0,1.28-(b.anim?.crouch||0)*.45,0)),direction=new THREE.Vector3(point.x,point.y,point.z).sub(origin).normalize();opponentAI.hear(b.pos,b);if(!muted)gameAudio.weapon(w.type,{pos:origin,spec:w});
 if(w.type==='rocket'){
  const right=new THREE.Vector3().crossVectors(direction,up).normalize();for(let i=0;i<w.rounds;i++){const dir=direction.clone().addScaledVector(right,Math.tan(THREE.MathUtils.degToRad((i-(w.rounds-1)/2)*w.separation))).normalize();launchRocket(origin,dir,b,1,{spec:{...w,weapon:weaponLabel(b)},projectile:w.projectile,radius:w.radius,selfDamage:w.selfDamage,jump:w.jump});const r=rockets.at(-1);r.mesh.position.copy(origin).addScaledVector(dir,.12);r.origin=origin.clone();r.bounces=w.bounces||0;r.life=w.fuse||4;}return;
 }
 scene.updateMatrixWorld(true);const targets=rivalTargets(b),anchor=w.handling==='anchor'&&b.brain.fireControl?.anchor>=.25;
 const result=traceCartridges(w,origin,direction,[...worldMeshes,...targets],{rounds:w.rounds,ads:true,spreadScale:(anchor?.5:1)*(w.slamfire?1+(w.heat||0)*3.5:1),random:()=>Math.random()});
 for(const t of result.traces){if(t.wall&&t.pellet===0)impactEffect(t.hit,w.type==='rail'?1.5:1);if(!t.wall&&(t.pellet===0||w.type==='shotgun'&&t.pellet%4===0))trail(origin,t.point,w.color,w.type==='rail'?.2:.055,w.type==='rail'?.035:.012);}
 for(const [actor,hit]of result.hits){const headKill=hit.headDamage>0&&hit.damage-hit.headDamage<actor.hp,outcome=damageCombatActor(actor,hit.damage,b,headKill?'head':hit.part,hit.point,{head:hit.headDamage>0,headKill,parts:hit.parts,weapon:weaponLabel(b),impactType:w.type,origin});if(outcome?.killed&&headKill&&w.refund&&!b.brain.refunded){b.brain.refunded=true;b.brain.feeds.state(w.type).ammo=Math.min(w.mag,b.brain.feeds.state(w.type).ammo+1);}}
 for(const blast of result.blasts){blast.point.addScaledVector(origin.clone().sub(blast.point).normalize(),.025);payloadExplosion(blast.point,blast.damage,blast.radius,{direct:blast.bot,owner:b,weapon:weaponLabel(b)});}
 for(const arc of result.arcs){const visited=new Set([b,arc.bot]);let previous=arc.bot;for(const damage of arc.damage){const start=previous.pos.clone().add(new THREE.Vector3(0,1,0)),next=[...bots,playerCombatActor()].filter(a=>!a.dead&&a.hp>0&&!visited.has(a)&&!(a.isPlayer&&[...visited].some(v=>v.isPlayer))&&a.pos.clone().add(new THREE.Vector3(0,1,0)).distanceTo(start)<=arc.range&&visible(start,a.pos.clone().add(new THREE.Vector3(0,1,0)))).sort((a,c)=>a.pos.distanceToSquared(start)-c.pos.distanceToSquared(start))[0];if(!next)break;visited.add(next);const end=next.pos.clone().add(new THREE.Vector3(0,1,0));arcTrail(start,end);damageCombatActor(next,damage,b,'torso',end,{origin:start,weapon:weaponLabel(b),impactType:'rail'});previous=next;}}
 if(!result.hits.size&&respawnTime<=0){for(const t of result.traces){const near=nearMissSegment(origin,t.point,playerPos,1.5,crouched?.35:.65);if(!near)continue;hurtFeedback.nearMiss(Math.atan2(origin.x-playerPos.x,origin.z-playerPos.z),`${b.name}:${b.lifeId||0}`);if(nearMissCooldown<=0){nearMissCooldown=.2;playSfx('whiz',{pos:near.point,volume:.35,bus:'world',priority:4});}break;}}
}

function fireBotWeapon(b,point,w){
 if(w.packet)return emitModularPacket(b,point,w.packet);
 if(b.rival&&w.damageBudget!==undefined)return fireRivalWeapon(b,point,w);
 minimap?.shot(b.name,b.pos);
 fireDummy(b,w.type);
 const origin=b.pos.clone().add(new THREE.Vector3(0,1.28-(b.anim?.crouch||0)*.45,0)),aimPoint=new THREE.Vector3(point.x,point.y,point.z);
 opponentAI.hear(b.pos,b);!muted&&gameAudio.weapon(w.type,{pos:origin,spec:w});
 if(w.type==='rocket'){aimPoint.y-=.65;launchRocket(origin,aimPoint.sub(origin).normalize(),b,w.splashScale);return}
 scene.updateMatrixWorld(true);const targets=botHitMeshes().filter(m=>m.userData.bot!==b),playerBox=new THREE.Box3(new THREE.Vector3(playerPos.x-.35,playerPos.y-eyeHeight+.15,playerPos.z-.35),new THREE.Vector3(playerPos.x+.35,playerPos.y+.12,playerPos.z+.35));
 const dir=aimPoint.sub(origin).normalize(),hits=new Map();let playerHits=0,playerHead=false,nearShot=null;const playerParts=[];
 for(let i=0;i<(w.pellets||1);i++){
  const shot=dir.clone().add(new THREE.Vector3((Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread)).normalize();ray.set(origin,shot);ray.far=w.range;
  const hit=closestHit(ray,worldMeshes,targets),playerPoint=respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace?ray.ray.intersectBox(playerBox,new THREE.Vector3()):null;
  const pd=playerPoint?origin.distanceTo(playerPoint):Infinity,hitDistance=hit?origin.distanceTo(hit.point):Infinity;let end=origin.clone().addScaledVector(shot,w.range);
  if(pd<=w.range&&pd<hitDistance){playerHits++;const part=bodyPartAt(playerPoint,playerPos,yaw,eyeHeight);playerParts.push({part,damage:bodyDamage(w.damage,part)});playerHead=playerHead||part==='head';end=playerPoint}else if(hit){end=hit.point;const victim=hit.object.userData.bot;if(victim){const head=hit.object.userData.part==='head',entry=hits.get(victim)||{damage:0,headDamage:0,part:hit.object.userData.part,point:hit.point,parts:[]};const damage=bodyDamage(w.damage,hit.object.userData.part);entry.parts.push({part:hit.object.userData.part,damage});entry.damage+=damage;if(head){entry.headDamage+=damage;entry.part='head'}hits.set(victim,entry)}else impactEffect(hit,w.type==='rail'?2:1)}
  if(respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace){const near=nearMissSegment(origin,end,playerPos,1.5,crouched?.35:.65);if(near&&(!nearShot||near.distance<nearShot.distance))nearShot=near}
  if(i===0||w.type==='shotgun'&&i===4)trail(origin,end,0xe9f69a,w.type==='rail'?.23:.07,w.type==='rail'?.035:.012);
 }
 if(playerHits)damagePlayer(playerParts.reduce((n,p)=>n+p.damage,0),b,{head:playerHead,parts:playerParts,weapon:weaponLabel(b)});else if(nearShot&&respawnTime<=0){
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
 meleeCooldown=Math.max(0,meleeCooldown-dt);meleeSwing=Math.max(0,meleeSwing-dt);
 minimap?.step(dt);
 if(mobile?.enabled&&!benchmarkChild)syncTouchInputs(dt);
 if(mobile?.enabled&&mobile.active&&mobileAutoJump.hold>0)keys.add('Space');
 hurtSoundCooldown=Math.max(0,hurtSoundCooldown-dt);
 const realDt=dt,playerSlow=keys.has('KeyQ')&&focus>0&&respawnTime<=0;stepBotFocus(realDt,playerSlow);slow=playerSlow||!!botFocusOwner;const worldDt=realDt*(slow?BALANCE.worldSlow:1);if(playerSlow)focusRest=BALANCE.focusDelay;else focusRest=Math.max(0,focusRest-dt);focus=clamp(focus+(playerSlow?-BALANCE.focusDrain:focusRest<=0?BALANCE.focusRegen*circuitBonuses(activeGunCollection(),playerGunLife).focusRegen:0)*dt,0,100);if(focus<=0){keys.delete('KeyQ');if(mobile?.state)mobile.state.focus=false;}$('slowTint').style.opacity=slow?1:0;dt=playerSlow?realDt:worldDt;
 stepElevators(worldDt);
 if(respawnTime<=0){yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.7;pitch=clamp(pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.4,-1.5,1.5)}
 time=isPractice()?90:Math.max(0,time-realDt);if(time===0){endMatch();return}shotTimer-=dt;if(!mouseDown)shotTimer=Math.max(0,shotTimer);nearMissCooldown=Math.max(0,nearMissCooldown-dt);stepFeeds(dt);
 if(respawnTime>0){respawnTime-=dt;if(respawnTime<=0)spawnPlayer()}else{
 updateStance();
 const swimming=waterAt(playerPos.x,playerPos.y-eyeHeight+.12,playerPos.z);
 const forward=mobile?.enabled?mobile.state.move.y:(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=mobile?.enabled?mobile.state.move.x:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),speed=(swimming?5.2:crouched?3.7:7.5)*playerWeapon().move*modularMoveScale()*(keys.has('MouseRight')?playerWeapon().adsMove:1)*(slow?.85:1);let ix=side*Math.cos(yaw)-forward*Math.sin(yaw),iz=-side*Math.sin(yaw)-forward*Math.cos(yaw);const len=mobile?.enabled?Math.max(1,Math.hypot(ix,iz)):(Math.hypot(ix,iz)||1);ix=ix/len*speed;iz=iz/len*speed;if(swimming){playerPadFlight=null;playerSlide.stop();}if(playerPadFlight){playerPadFlight.age+=dt;vel.x=playerPadFlight.vx+ix*.15;vel.z=playerPadFlight.vz+iz*.15;if(playerPadFlight.age>3)playerPadFlight=null}else{const sliding=playerSlide.step(dt,{vx:vel.x,vz:vel.z,wishX:ix,wishZ:iz,crouch:keys.has('KeyC'),grounded,swimming:!!swimming,slope:slideSlope(blocks,{x:playerPos.x,y:playerPos.y-eyeHeight,z:playerPos.z},vel.x,vel.z)});const next=sliding.active?sliding:swimming?swimHorizontal(vel.x,vel.z,ix,iz,waterImmersion(playerPos.y-eyeHeight,crouched?COLLISION.crouching:COLLISION.standing,swimming.top),dt):accelerate(vel.x,vel.z,ix,iz,dt,grounded,perks.speed?1.1:1);vel.x=next.x;vel.z=next.z;}const previousX=playerPos.x,previousZ=playerPos.z;
 coyoteTime=grounded?FEEL.coyote:Math.max(0,coyoteTime-dt);jumpBuffered=Math.max(0,jumpBuffered-dt);if(keys.has('Space')&&!lastJumpHeld)jumpBuffered=FEEL.jumpBuffer;lastJumpHeld=keys.has('Space');if(!swimming&&jumpBuffered>0&&coyoteTime>0){playerSlide.stop();vy=FEEL.jumpSpeed;grounded=false;coyoteTime=jumpBuffered=0}const fallSpeed=vy;if(swimming)vy=swimVertical(vy,playerPos.y-eyeHeight,crouched?COLLISION.crouching:COLLISION.standing,swimming.top,dt,keys.has('Space')?1:keys.has('KeyC')?-1:0);else vy-=23*dt;const contact=moveCharacter(blocks,{x:playerPos.x,z:playerPos.z,feet:playerPos.y-eyeHeight,radius:COLLISION.radius,height:crouched?COLLISION.crouching:COLLISION.standing},{x:vel.x*dt,y:vy*dt,z:vel.z*dt},{grounded,bounds:MAP.bounds,stepHeight:MAP.stepHeight??COLLISION.step});
 playerPos.set(contact.x,contact.feet+eyeHeight,contact.z);for(const normal of contact.normals){const into=vel.x*normal.x+vel.z*normal.z;if(into<0){vel.x-=normal.x*into;vel.z-=normal.z*into}}
 if(Number.isFinite(MAP.killBelow)&&contact.feet<MAP.killBelow){if(isPractice())spawnPlayer();else damagePlayer(Math.max(1,health),null,{weapon:'Fall'});}
 if(playerSlide.active&&Math.hypot(vel.x,vel.z)<2.3)playerSlide.stop();
 if(contact.ceiling&&vy>0)vy=0;grounded=contact.grounded;if(grounded){if(fallSpeed< -4)weaponMotion.landed(fallSpeed);if(fallSpeed< -4&&!muted)gameAudio.footstep(new THREE.Vector3(playerPos.x,contact.feet+.1,playerPos.z),{self:true,metal:contact.feet>2,landing:true});vy=0;playerPadFlight=null}const travelled=Math.hypot(playerPos.x-previousX,playerPos.z-previousZ);

 const autoJump=mobileAutoJump.step(dt,{enabled:!!(mobile?.enabled&&mobile.active&&locked&&mode==='play'&&respawnTime<=0&&!crouched&&!playerSlide.active),grounded,swimming:!!swimming,ceiling:contact.ceiling,launched:!!playerPadFlight,wishX:ix,wishZ:iz,movedX:contact.x-previousX,movedZ:contact.z-previousZ,normals:contact.normals});
 if(autoJump){if(swimming)keys.add('Space');else if(canOccupy(blocks,{x:playerPos.x,z:playerPos.z,feet:contact.feet+.2,radius:COLLISION.radius,height:COLLISION.standing})){keys.add('Space');playerSlide.stop();vy=FEEL.jumpSpeed;grounded=false;coyoteTime=jumpBuffered=0;}else mobileAutoJump.hold=0;}

 if(grounded&&!swimming){stepDistance+=travelled;if(stepDistance>(playerSlide.active?3.8:2.05)){stepDistance=0;if(!muted)gameAudio.footstep(playerPos,{self:true,metal:playerPos.y>3.7,quiet:crouched});opponentAI?.hear(playerPos,'player',playerSlide.active?12:crouched?4:9)}}else stepDistance=0;
 stepMobileReload(dt);
 stepModularPlayer(dt);
 moveClock+=travelled;for(const p of pickups){if(p.kind==='pad'){if(Math.hypot(playerPos.x-p.x,playerPos.z-p.z)<(p.triggerRadius||1.4)&&grounded&&Math.abs(playerPos.y-eyeHeight-p.y)<.3){const t=launchTime(p.power,p.landing.y-(playerPos.y-eyeHeight));playerPadFlight={vx:(p.landing.x-playerPos.x)/t,vz:(p.landing.z-playerPos.z)/t,age:0};vy=p.power;grounded=false;playSfx('pad',{volume:.5})}}else if(p.timer<=0&&Math.hypot(playerPos.x-p.x,playerPos.z-p.z)<(p.amount===5?.65:1.1)&&Math.abs(playerPos.y-eyeHeight-p.y)<1.1){
  if(p.kind==='focus'){if(focus>=100)continue;focus=100;notify('SLOW MOTION RECHARGED')}
  else{const hp=healthAfterPickup(health,maxHealth(BALANCE.playerHP,perks),p,BALANCE.playerHP);if(hp===health)continue;const gain=Math.round(toDisplay(hp-health,BALANCE.playerHP));healPlayer(hp);notify(`+${gain} HEALTH`)}
  p.timer=p.respawn||15;p.mesh.visible=false;playSfx('pickup',{volume:p.amount===5?.22:.4});
 }}
 }
 updateBots(worldDt);scene.updateMatrixWorld(true);if(modularProjectiles){modularProjectiles.step(worldDt);if(modularOutcomes.length){confirmOutcomes(modularOutcomes);modularOutcomes=[];}}stepChoiceTokens(worldDt);
 if(rockets.length)scene.updateMatrixWorld(true);
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];if((r.mods.spec?stepAttachmentRocket(r,worldDt):stepLegacyRocket(r,worldDt))){scene.remove(r.mesh);rockets.splice(i,1);}}

 for(const p of pickups){if(p.kind==='pad')continue;if(p.timer>0){p.timer-=worldDt;if(p.timer<=0)p.mesh.visible=true}p.mesh.rotation.y+=worldDt;p.mesh.position.y=p.baseY+Math.sin(elapsed*2)*.06}

}
function activateStreak(){return false;}
function stepSpecialAttacks(){}
const upgrades=[
 ...weapons.map((w,j)=>({id:`gun${j}`,category:w.label.toUpperCase()+' / '+weaponSlot(j),name:w.name,desc:w.desc,price:w.price||220,gun:j})),
 {id:'reload',category:'PERK',name:'Sleight of hand',desc:'25% shorter reloads.',price:350},
 {id:'speed',category:'PERK',name:'Lightweight',desc:'10% faster movement.',price:350},
 {id:'armor',category:'PERK',name:'Juggernaut',desc:'Spawn with 100 health plus 20 armor.',price:350},
 {id:'focus',category:'PERK',name:'Deep focus',desc:'25% faster slow-motion recharge.',price:350},
 {id:'quickdraw',category:'PERK',name:'Quickdraw',desc:'25% shorter aiming and weapon switching.',price:350},
 {id:'recovery',category:'PERK',name:'Recovery',desc:'Weapon kills restore 20 health, up to your starting health and armor.',price:350}
];
function saveRun(){if(isPractice())return;localStorage.setItem('dh-run',JSON.stringify({modularVersion:MODULAR_VERSION,collection:gunCollection,rivals,mapId:MAP.id,round,credits:0,owned:[0],equipped:0,phase:mode==='shop'||mode==='results'?'shop':'match'}));}
function endMatch(){
 mobile?.clear();mobile?.closeOverlay();clearDeathView();const place=rank(),survived=place<=3;mode='results';locked=false;gameAudio.stopWorld();mouseDown=false;slow=false;document.exitPointerLock?.();$('hud').hidden=true;weaponGroup.visible=false;$('slowTint').style.opacity=0;$('damage').style.opacity=0;
 settleRivals(rivals,rankList(),round,weapons,upgrades,()=>Math.random());best=Math.max(best,round);localStorage.setItem('dh-best',best);if(survived)saveRun();else localStorage.removeItem('dh-run');
 $('panel').hidden=false;$('panel').className='panel results-panel';$('panel').innerHTML=`<div class="results-shell"><div class="results-title"><span>ROUND ${String(round).padStart(2,'0')}</span><h2>${survived?'ROUND COMPLETE':'RUN OVER'}</h2></div><div class="results-summary"><strong>${place}<small>${['ST','ND','RD'][place-1]||'TH'}</small></strong><span>${matchKills}<small>KILLS</small></span></div><div class="result-table" role="table" aria-label="Match results"><div class="result-row result-head"><span>PLACE</span><span>PLAYER</span><span>POINTS</span><span>KILLS</span><span>ASSISTS</span><span>DEATHS</span></div>${rankList().map((b,i)=>`<div class="result-row ${b.player?'you':''}"><span>${i+1}</span><b>${b.name}</b><strong>${b.score}</strong><span>${b.kills}</span><span>${b.assists}</span><span>${b.deaths}</span></div>`).join('')}</div><div class="panel-actions"><button class="primary" id="resultnext">${survived?'CHOOSE ATTACHMENT':'NEW RUN'}</button><button class="textbutton" id="backmenu">MAIN MENU</button></div></div>`;$('resultnext').onclick=()=>survived?showShop():startRandomMatch();$('backmenu').onclick=mainMenu;
}
function practiceMapFromURL(){if(typeof location==='undefined')return null;const id=new URLSearchParams(location.search).get('practice');return MAPS.some(m=>m.id===id)?id:null;}
function practiceMaps(){const descriptions={reservoir:'Pumping, filtration and deep waterworks.',rust:'Refinery tower, pipe racks and service yard.',shipment:'Stock container yard, open cargo and crossing lanes.',nuketown:'Operations houses, garden flanks and a vehicle crossing.'};return MAPS.map(m=>({id:m.id,name:m.name,description:descriptions[m.id]||m.description,current:m.id===MAP.id}));}
function showPracticeMaps(){
 if(mobile?.enabled){mobile.showPracticeMaps();return;}
 $('panel').hidden=false;$('panel').className='panel controls-panel settings-panel';$('panel').innerHTML='<div class="controls-heading"><div><small>FRAGONY / PRACTICE</small><h2>PRACTICE MAPS</h2></div><button id="practice-maps-back">BACK</button></div><div class="practice-map-grid">'+practiceMaps().map(m=>'<button class="practice-map-card '+(m.current?'selected':'')+'" data-practice-map="'+m.id+'"><b>'+m.name+'</b><span>'+m.description+'</span><small>'+(m.current?'CURRENT MAP':'ENTER PRACTICE ↗')+'</small></button>').join('')+'</div>';$('practice-maps-back').onclick=renderControls;$('panel').querySelectorAll('[data-practice-map]').forEach(b=>b.onclick=()=>beginPractice(b.dataset.practiceMap));
}
function beginPractice(mapId){const wanted=typeof mapId==='string'?mapId:practiceMapFromURL()||menuReturnMapId,entry=MAPS.find(m=>m.id===wanted);if(arenaNeedsLoading(entry))return prepareArena(wanted,()=>beginPractice(wanted));if(entry)changeArena(entry.id);practiceMode=true;if(mobile)mobile.practice=true;practiceCollection??=fullCollection();startMatch(false);owned=[0];equipped=0;buildWeapon();playerGunFire.reset(playerWeapon(),playerGunLife.id);syncModularAmmo();if(mobile){mobile.weapon=null;mobile.applyLayout();}notify('PRACTICE · NO DAMAGE');}
function returnToPractice(){owned=[0];equipped=0;mode='play';$('panel').hidden=true;$('hud').hidden=false;buildWeapon();playerGunFire.reset(playerWeapon(),playerGunLife.id);syncModularAmmo();weaponGroup.visible=true;lock();}
function ensureShopOffers(){return rollShop(gunCollection,round);}
function showShop(inspect=false){
 mobile?.clear();mobile?.closeOverlay();mouseDown=false;locked=false;document.exitPointerLock?.();gameAudio.stopWorld();$('menu').hidden=true;$('hud').hidden=true;$('panel').hidden=true;weaponGroup.visible=false;shopInspect=inspect;mode='shop';armoryView?.close();
 const practice=isPractice(),collection=inspect?fullCollection():activeGunCollection(),shop=inspect||practice?{choices:[],draft:null,committed:true}:rollShop(collection,round),complete=Object.keys(PARTS).every(id=>collection.owned[id]===3);
 if(!inspect&&!practice)saveRun();
 armoryView=openArmoryView({collection,offers:shop.committed?[]:shop.choices,draft:shop.draft,round:round+1,title:inspect?'Arsenal':practice?'Practice':undefined,freeEquip:inspect||practice||shop.committed,complete,allowContinue:inspect||practice||shop.committed||!shop.choices.length,playLabel:inspect?'Back':practice?'Return to practice':undefined,muted},
 {change:draft=>{if(!inspect&&!practice){shop.draft=draft;saveRun();}else if(practice)practiceCollection=normalizeCollection({...collection,kit:draft.kit});},
  exit:draft=>{if(!inspect&&!practice){shop.draft=draft;saveRun();}armoryView?.close();armoryView=null;if(practice)returnToPractice();else mainMenu();},
  fight:result=>{
   if(mode!=='shop')return;
   if(inspect){armoryView?.close();armoryView=null;mainMenu();return;}
   if(practice){practiceCollection=normalizeCollection({...collection,kit:result.kit});armoryView?.close();armoryView=null;returnToPractice();return;}
   if(!shop.committed&&shop.choices.length&&(!result.pick||!shop.choices.some(p=>same(p,result.pick))))return;
   const allowed={...collection.owned};if(!shop.committed&&result.pick)allowed[result.pick.id]=result.pick.rank;
   for(const slot of MODULAR_SLOTS){const p=result.kit?.[slot];if(PARTS[p?.id]?.slot!==slot||allowed[p.id]!==p.rank)return;}
   collection.owned=allowed;collection.kit=clone(result.kit);shop.committed=true;shop.pick=result.pick;shop.draft=null;saveRun();armoryView?.close();armoryView=null;round++;return startRandomMatch(true);
  }});
}
function renderLoadout(){showShop(shopInspect);}
function fitCatalogPart(g,id,replace=null){
 const a=attachment(g,id);if(!a)return false;const result=fitAttachment(catalogBuilds,WEAPON_ORDER,1e9,g,a.slot,id,{replace,priceOverride:0});
 if(!result.ok){shopMessage=result.reason;if(result.needsReplacement)pendingPart={gun:g,id};renderLoadout();return false;}pendingPart=null;shopPreview=null;shopGun=g;renderLoadout();return true;
}
function buyPart(g,id,replace=null){
 if(mode!=='shop'||shopInspect||!owned.includes(g))return false;const a=attachment(g,id);if(!a)return false;
 const bought=builds[g]?.owned.includes(id),free=isPractice()||a.slot==='optic';if(!free&&!bought&&!offeredPart(ensureShopOffers(),g,id))return false;
 const offer=shopOffers?.attachments.find(p=>p.gun===g&&p.id===id),result=fitAttachment(builds,owned,credits,g,a.slot,id,{replace,priceOverride:free?0:offer?.price??null});
 if(!result.ok){shopMessage=result.reason;if(result.needsReplacement)pendingPart={gun:g,id};renderLoadout();return false;}
 if(!bought&&offer?.starter&&!free)starterConversionUsed=true;if(pinnedOffer?.gun===g&&pinnedOffer?.id===id)pinnedOffer=null;credits=result.credits;shopGun=g;pendingPart=null;shopPreview=null;shopMessage=weapons[g].name+' / '+a.name+' fitted';commitLoadout();return true;
}
function fitOwnedPart(g,slot,id){
 if(mode!=='shop'||!WEAPON_SLOTS[g]?.[slot])return false;if(id){if(shopInspect)return fitCatalogPart(g,id);if(!isPractice()&&slot!=='optic'&&!builds[g]?.owned.includes(id))return false;return buyPart(g,id);}
 const target=shopInspect?catalogBuilds:builds;delete target[g].slots[slot];pendingPart=null;shopPreview=null;shopMessage='Standard '+SLOT_LABELS[slot].toLowerCase()+' fitted';if(shopInspect)renderLoadout();else commitLoadout();return true;
}
function equipGear(key,id){if(mode!=='shop'||shopInspect||!EQUIPMENT[key])return false;const item=EQUIPMENT[key].find(x=>x.id===id);if(!item)return false;const bought=equipment.owned.includes(id);if(!bought&&!ensureShopOffers().equipment.includes(key+':'+id))return false;const price=bought?0:item.price;if(credits<price)return false;credits-=price;if(!bought)equipment.owned.push(id);equipment[key]=id;shopMessage=item.name+' equipped';commitLoadout();return true}
function buyUpgrade(id){if(mode!=='shop'||shopInspect||!offeredUpgrade(ensureShopOffers(),id))return false;const u=upgrades.find(x=>x.id===id);if(!u||credits<u.price||(u.gun!==undefined?owned.includes(u.gun):u.id in perks))return false;credits-=u.price;if(u.gun!==undefined){owned.push(u.gun);shopGun=u.gun;shopMessage=u.name+' added'}else{perks[u.id]=false;shopMessage=u.name+' purchased. Choose up to two active perks in Your kit.';if(activePerks(perks).length<2){equipPerk(perks,u.id);shopMessage=u.name+' active';}else shopKit=true;}commitLoadout();return true}
function commitLoadout(){playSfx('equip',{volume:.35});if(isPractice())practiceBuilds=builds;saveRun();renderLoadout()}
function inspectWeapon(){
 menuStage?.hide(camera);
 inspection={returnEquipped:equipped,returnFov:camera.fov,yaw:2.3,pitch:-.06,demo:false,age:10,clock:0,cooldown:0,controller:new FireControl(),scroll:$('panel').scrollTop,builds:shopPreview||(shopInspect?catalogBuilds:builds)};equipped=shopGun;buildWeapon(inspection.builds);mode='inspect';weaponGroup.visible=true;previewDummy.visible=false;camera.position.set(0,0,0);camera.rotation.set(0,0,0);camera.fov=52;camera.updateProjectionMatrix();
 const hero=weaponGroup.userData.nailer||weaponGroup.userData.heroTool;for(const part of [hero?.left,hero?.right,hero?.arm,hero?.supportArm,hero?.rightArm,...(hero?.arms||[])]){const node=part?.mesh||part;if(node?.isObject3D)node.visible=false;}weaponGroup.traverse(m=>{if(m.userData.healthSkin)m.visible=false});
 weaponGroup.updateWorldMatrix(true,true);const bounds=new THREE.Box3(),partBounds=new THREE.Box3();weaponGroup.traverseVisible(m=>{if(m.isMesh){if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();partBounds.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);bounds.union(partBounds);}});inspection.center=weaponGroup.worldToLocal(bounds.getCenter(new THREE.Vector3()));
 inspection.light=new THREE.DirectionalLight(0xe6eee2,2);inspection.light.position.set(0,2,2);inspection.light.layers.set(1);camera.add(inspection.light);camera.add(inspection.light.target);
 $('panel').className='panel weapon-inspect';$('panel').innerHTML=`<header><div><small>FRAGONY / COMPONENT INSPECTION</small><h2>${weapons[equipped].name}</h2></div><button id="close-inspect">BACK TO WORKBENCH</button></header><div id="inspect-stage" aria-label="Drag to rotate weapon"></div><footer><span>${fitted(equipped,inspection.builds).map(a=>a.name).join(' · ')||'STANDARD BUILD'}</span><div><button id="inspect-left">ROTATE LEFT</button><button id="inspect-demo">CYCLE ACTION</button><button id="inspect-right">ROTATE RIGHT</button></div><small>Drag to rotate · this inspection does not use ammunition</small></footer>`;
 $('close-inspect').onclick=closeInspection;$('inspect-left').onclick=()=>inspection.yaw-=.3;$('inspect-right').onclick=()=>inspection.yaw+=.3;$('inspect-demo').onclick=()=>{inspection.demo=!inspection.demo;inspection.controller.reset();inspection.cooldown=0;$('inspect-demo').textContent=inspection.demo?'STOP CYCLING':'CYCLE ACTION';};
 const stage=$('inspect-stage');let drag=null;stage.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId)};stage.onpointermove=e=>{if(drag?.id!==e.pointerId)return;inspection.yaw+=(e.clientX-drag.x)*.008;inspection.pitch=clamp(inspection.pitch+(e.clientY-drag.y)*.006,-.55,.55);drag.x=e.clientX;drag.y=e.clientY;};stage.onpointerup=stage.onpointercancel=()=>drag=null;
}
function closeInspection(){if(!inspection)return;equipped=inspection.returnEquipped;camera.fov=inspection.returnFov;camera.updateProjectionMatrix();const backScroll=inspection.scroll;camera.remove(inspection.light,inspection.light.target);inspection.light.dispose();inspection=null;mode='shop';weaponGroup.visible=false;gameAudio.stopWorld();renderLoadout();$('panel').scrollTop=backScroll;}
function presentInspection(dt){
 if(!inspection)return;const w=playerWeapon(equipped,inspection.builds);inspection.age+=dt;inspection.clock+=dt;inspection.cooldown-=dt;
 const event=inspection.controller.tick(dt,w,{down:inspection.demo,repeat:true,cooldown:inspection.cooldown});if(event.fire){inspection.age=0;inspection.controller.shot(w);if(!event.continuation)inspection.cooldown=w.interval-w.charge;if(!muted)gameAudio.play(ALL_WEAPONS[equipped],{volume:.18,bus:'self',priority:1});}
 weaponGroup.rotation.set(inspection.pitch,inspection.yaw,0);const center=inspection.center.clone().multiply(weaponGroup.scale).applyEuler(weaponGroup.rotation);weaponGroup.position.set(0,.09,-1.4).sub(center);
 const pose={shotAge:inspection.age,ammo:w.mag,reload:0,reloading:false,charge:inspection.controller.charge/(w.charge||1),heat:inspection.controller.heat,time:elapsed};
 if(weaponGroup.userData.nailer)animateNailer(weaponGroup.userData.nailer,pose);if(weaponGroup.userData.heroTool)animateToolWeapon(weaponGroup.userData.heroTool,pose);
 if(weaponGroup.userData.conversionModels)animateAttachmentModels(weaponGroup.userData.conversionModels,pose);
 flash.visible=inspection.age<.04;for(const secondary of weaponGroup.userData.secondaryFlashes||[])secondary.visible=flash.visible;if(weaponGroup.userData.muzzleLight)weaponGroup.userData.muzzleLight.intensity=flash.visible?16:0;camera.position.set(0,0,0);camera.rotation.set(0,0,0);camera.updateMatrixWorld(true);frameRenderer.renderWeaponOnly(scene,camera);
}

function updateMainMenu(){let summary=null;try{summary=menuRunSummary(localStorage.getItem('dh-run'))}catch{}$('continue').hidden=!summary;$('menu').dataset.run=summary?'saved':'new';$('menu-run-summary').textContent=summary||'';$('start').querySelector?.('.menu-arrow')?.toggleAttribute?.('hidden',!!summary);}
function prepareMenuStage(){
 if(!menuStage)return;
 changeArena(MENU_STAGE.mapId);
 for(const b of bots)b.group.visible=false;
 for(const p of pickups)if(p.kind!=='pad')p.mesh.visible=false;arena.traverse(o=>{if(o.name==='health-rings')o.visible=false;});
 for(const r of rockets)scene.remove(r.mesh);rockets=[];
 for(const e of effects)retireEffect(e);effects=[];
}
function mainMenu(){armoryView?.close();armoryView=null;mobileAutoJump.reset();if(menuStage){if(mode==='play'||mode==='results'||mode==='shop'&&!shopInspect)menuReturnMapId=MAP.id;if(arenaNeedsLoading(MAPS.find(m=>m.id===MENU_STAGE.mapId)))return prepareArena(MENU_STAGE.mapId,mainMenu);prepareMenuStage();}practiceMode=false;mobile?.clear();mobile?.closeOverlay();if(mobile)mobile.practice=false;clearDeathView();hurtFeedback.reset();$('damage').style.opacity=0;$('panel').className='panel';buildWeapon();gameAudio.stopWorld();mode='menu';document.exitPointerLock?.();$('panel').hidden=true;$('hud').hidden=true;$('menu').hidden=false;document.body.classList.remove('playing');weaponGroup.visible=false;updateMainMenu()}
function pause(){mobileAutoJump.reset();if(mode!=='play')return;playerSlide.buffer=0;resetFireControl();locked=false;mobile?.clear();physicalKeys.clear();keys.clear();mouseDown=false;slow=false;$('damage').style.opacity=0;$('slowTint').style.opacity=0;gameAudio.stopWorld();if(mobile?.enabled)mobile.showPause();else showControls('play')}
const settingsUI={category:'Controls',sections:{},input:null,preview:false,report:false,detail:null,displayReport:'',undo:null,scroll:{},message:''};
let settingsPreviewPending=false;
function settingsHost(){return mobile?.enabled&&mobile.panel?mobile.panel:$('panel')}
function settingsVisible(){const host=settingsHost();return !!host&&!host.hidden&&host.className.includes('settings-host')}
function settingsSection(){const sections=settingsSections(settingsUI.category,settingsUI.input);return sections.includes(settingsUI.sections[settingsUI.category])?settingsUI.sections[settingsUI.category]:sections[0]}
function rememberSettingsScroll(){if(!settingsVisible())return;const body=settingsHost().querySelector('.sw-content');if(body)settingsUI.scroll[settingsUI.category+':'+settingsSection()+':'+settingsUI.input]=body.scrollTop||0;}
function navigateSettings(category,section=null){rememberSettingsScroll();settingsUI.category=category;if(section)settingsUI.sections[category]=section;settingsUI.report=false;settingsUI.detail=null;settingsUI.preview=false;bindingPending=null;renderControls()}
function settingsSnapshot(){let benchmark=null;try{benchmark=JSON.parse(localStorage.getItem('dh-graphics-benchmark')||'null');if(!benchmark?.settings||!Array.isArray(benchmark.results))benchmark=null}catch{}return{...settingsUI,section:settingsSection(),settings,touchSettings:mobile?.settings||MOBILE_DEFAULTS,touch:!!mobile?.enabled,practice:isPractice(),back:controlsBack,controls,bindingPending,gyroReady:mobile?.gyroReady,aaSummary:frameRenderer?.aaSummary?.(),benchmark};}
function showControls(back=controlsBack){controlsBack=back==='play'?'play':'menu';if(mobile)mobile.settingsBack=controlsBack;if(settingsUI.input===null)settingsUI.input=mobile?.enabled?'Touch':'Keyboard';bindingPending=null;controlsMessage='';settingsUI.message='';renderControls()}
function saveControls(){try{localStorage.setItem('dh-controls',JSON.stringify(controls.bindings));localStorage.setItem('dh-settings',JSON.stringify(settings));return true}catch{return false}}
function settingsStatus(message){settingsUI.message=message;const status=$('settings-status');if(status)status.textContent=message;}
function settingsSaved(ok=true){settingsStatus(ok?'Saved on this device':'Storage unavailable · active for this session');}
function closeSettings(){bindingPending=null;settingsPreviewPending=false;if(mobile?.enabled)mobile.closeOverlay();$('panel').className='panel';$('panel').hidden=true;if(controlsBack==='play')lock();}
function requestSettingsPreview(){settingsPreviewPending=true;}
function drawSettingsPreview(){
 if(!settingsPreviewPending||!settingsVisible())return;const canvas=$('settings-preview-canvas');if(!canvas?.getContext||!renderer?.domElement)return;
 const ctx=canvas.getContext('2d');if(!ctx?.drawImage)return;try{ctx.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);settingsPreviewPending=false;}catch{settingsPreviewPending=false;}
}
function renderControls(){
 if(settingsUI.input===null)settingsUI.input=mobile?.enabled?'Touch':'Keyboard';settingsUI.sections[settingsUI.category]=settingsSection();
 const state=settingsSnapshot(),host=settingsHost(),html=settingsWorkspaceHTML(state);
 if(mobile?.enabled&&mobile.showPanel){mobile.showPanel('settings',html);host.classList.add('settings-host');}else{host.hidden=false;host.className='panel settings-host';host.innerHTML=html;}
 const on=(id,fn)=>{const node=$(id);if(node)node.onclick=fn;};
 host.querySelectorAll('[data-settings-category]').forEach(b=>b.onclick=()=>navigateSettings(b.dataset.settingsCategory));
 host.querySelectorAll('[data-settings-section]').forEach(b=>b.onclick=()=>navigateSettings(settingsUI.category,b.dataset.settingsSection));
 host.querySelectorAll('[data-settings-input]').forEach(b=>b.onclick=()=>{rememberSettingsScroll();if(b.dataset.settingsInput==='Touch'&&!mobile?.enabled)return;settingsUI.input=b.dataset.settingsInput;settingsUI.preview=false;bindingPending=null;renderControls()});
 host.querySelectorAll('[data-settings-action]').forEach(b=>b.onclick=()=>settingsAction(b.dataset.settingsAction));
 host.querySelectorAll('[data-binding]').forEach(b=>b.onclick=()=>{const [id,slot]=b.dataset.binding.split(':');rememberSettingsScroll();bindingPending={id,slot:Number(slot)};renderControls();});
 const rows=settingsRows(settingsUI.category,settingsSection(),settingsUI.input);
 for(const row of rows){if(row.type==='action')continue;const input=$(settingID(row));if(!input)continue;
  const change=async event=>{const value=row.type==='toggle'?event.target.checked:row.type==='range'?Number(event.target.value):event.target.value;
   await changeWorkspaceSetting(row,value,event.target);
  };if(row.type==='range'){input.oninput=change;input.onchange=()=>{if(row.key==='aoStrength')rebuildGraphics();requestSettingsPreview();};}else input.onchange=change;
 }
 on('controls-back',closeSettings);on('settings-preview-toggle',()=>{rememberSettingsScroll();settingsUI.preview=!settingsUI.preview;renderControls()});
 on('settings-reset',()=>resetSettingsSection());on('settings-undo',undoSettingsReset);
 if(bindingPending){on('bind-escape',()=>commitBinding('Escape'));on('bind-cancel',()=>{bindingPending=null;renderControls()});on('bind-clear',()=>commitBinding(''));if(bindingPending.code)on('bind-replace',()=>commitBinding(bindingPending.code,true));}
 const body=host.querySelector('.sw-content');if(body)body.scrollTop=settingsUI.scroll[settingsUI.category+':'+settingsSection()+':'+settingsUI.input]||0;
 host.querySelector('[data-settings-category="'+settingsUI.category+'"]')?.focus?.({preventScroll:true});
 host.onkeydown=event=>{if(event.key!=='Tab'||bindingPending)return;const nodes=[...host.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea,a[href]')].filter(node=>node.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};requestSettingsPreview();
}
function updateWorkspaceGraphics(key,range=false){
 if(!range){rebuildGraphics();requestSettingsPreview();return;}
 applyGraphicsRendererSettings();const f=frameRenderer,u=f?.output?.uniforms;
 if(f&&u){f.pixelForgeIntensity=settings.pixelForge?settings.pixelForgeIntensity:0;f.bloomEnabled=settings.bloomStrength>0;
  const values={pixelForgeAmount:f.pixelForgeIntensity,untonemappedExposure:settings.toneMap==='none'?settings.exposure:1,bloomAmount:settings.bloomStrength,aoAmount:f.gtao?settings.aoStrength:0,vignetteAmount:settings.vignette,grainAmount:settings.grain?1:0,gradeAmount:settings.colorGrade?1:0};
  for(const [name,value]of Object.entries(values))if(u[name])u[name].value=value;
 }
 if(key==='fov'&&camera){camera.fov=settings.fov;camera.updateProjectionMatrix();frameRenderer?.resetHistory();}requestSettingsPreview();
}
async function changeWorkspaceSetting(row,value,input=null){
 settingsUI.undo=null;const undo=$('settings-undo');if(undo)undo.hidden=true;
 if(row.type==='range')value=clamp(Number.isFinite(value)?value:row.min,row.min,row.max);
 if(row.type==='select'&&!row.choices.some(([v])=>String(v)===String(value)))return false;
 if(row.scope==='touch'){
  if(!mobile)return false;mobile.settings[row.key]=value;
  if(row.key==='gyro'&&value!=='off'&&!mobile.gyroReady){const ok=await mobile.enableGyro();if(!ok){settingsStatus('Motion access unavailable or declined. Touch aiming still works.');renderControls();return false;}}
  const ok=mobile.commitSettings();settingsSaved(ok);if(row.key==='gyro'||row.key==='preset'){rememberSettingsScroll();renderControls();$(settingID(row))?.focus?.({preventScroll:true});}
 }else{
  if(row.scope==='effects'){const preset=EFFECT_PRESETS[value];if(!preset)return false;Object.assign(settings,preset);}
  else if(row.key==='aaPreset'){if(!SETTINGS_AA_PRESETS[value])return false;Object.assign(settings,SETTINGS_AA_PRESETS[value],{antialias:true});}
  else settings[row.key]=row.key==='crouchToggle'?value==='toggle':['msaa','resolutionScale'].includes(row.key)?Number(value):value;
  Object.assign(settings,graphicsOptions(settings,graphicsContext));settingsSaved(saveControls());
  if(['graphics','aa','effects'].includes(row.scope))updateWorkspaceGraphics(row.key,row.type==='range');
  if(row.key==='hudScale')applyHUDScale();if(['minimap','minimapNorth','minimapScale'].includes(row.key))applyMinimapSettings();
  if(['guns','steps','feedback','music'].includes(row.key))gameAudio.applySettings(settings);
  if(row.key==='crouchToggle'){crouchLatch=false;physicalKeys.clear();keys.clear();}
  if(row.key==='aaStats'&&!settings.aaStats&&aaStatsClock.node)aaStatsClock.node.hidden=true;
  if(row.scope==='effects'||row.key==='aaPreset'||row.key==='antialias'){rememberSettingsScroll();renderControls();$(settingID(row))?.focus?.({preventScroll:true});}
 }
 if(row.type==='range'){
  const text=settingValueText(row,value),output=$(settingOutputID(row));if(output)output.textContent=text;input?.setAttribute?.('aria-valuetext',text);input?.style?.setProperty?.('--fill',(value-row.min)/(row.max-row.min)*100+'%');
 }
 return true;
}
function defaultGameSettings(){return {...graphicsOptions({},{...graphicsContext,legacy:{}}),motion:.65,guns:1,steps:1,feedback:1,music:1,sensitivity:1,hudScale:1,minimap:true,minimapNorth:false,minimapScale:1,invertY:false,crouchToggle:false,holdSemi:false,aaStats:false}}
function resetWorkspaceValues(gameKeys=[],touchKeys=[],actions=[]){
 const defaults=defaultGameSettings(),defaultBindings=new ControlBindings();
 settingsUI.undo={game:Object.fromEntries(gameKeys.map(k=>[k,settings[k]])),touch:Object.fromEntries(touchKeys.map(k=>[k,mobile?.settings[k]])),bindings:Object.fromEntries(actions.map(id=>[id,[...controls.bindings[id]]]))};
 for(const key of gameKeys)settings[key]=defaults[key];if(mobile)for(const key of touchKeys)mobile.settings[key]=MOBILE_DEFAULTS[key];for(const id of actions)controls.bindings[id]=[...defaultBindings.bindings[id]];
 const ok=persistWorkspaceReset(settingsUI.undo);settingsStatus(ok?'Defaults restored · Undo is available':'Storage unavailable · defaults active for this session');renderControls();
}
function resetSettingsSection(){
 const section=settingsSection();if(settingsUI.category==='Controls'&&settingsUI.input==='Keyboard'&&section!=='General')return resetWorkspaceValues([],[],ACTIONS.filter(a=>a.group===section).map(a=>a.id));
 const game=new Set(),touch=new Set();for(const row of settingsRows(settingsUI.category,section,settingsUI.input)){
  if(row.type==='action')continue;if(row.scope==='effects'){for(const key of Object.keys(EFFECT_PRESETS.balanced))game.add(key);}else if(row.key==='aaPreset'){for(const key of ['msaa','aaFilter','taa'])game.add(key);}else (row.scope==='touch'?touch:game).add(row.key);
 }
 resetWorkspaceValues([...game],[...touch]);
}
function persistWorkspaceReset(changes){
 Object.assign(settings,graphicsOptions(settings,graphicsContext));const changedKeys=Object.keys(changes.game),touchChanged=Object.keys(changes.touch).length>0;
 const ok=saveControls(),touchOK=touchChanged?(mobile?.commitSettings?.()??true):true;
 if(changedKeys.some(k=>['guns','steps','feedback','music'].includes(k)))gameAudio.applySettings(settings);
 if(changedKeys.some(k=>['hudScale','minimap','minimapNorth','minimapScale'].includes(k)))applyHUDScale();
 if(changedKeys.some(k=>k in graphicsOptions({}))){rebuildGraphics();if(camera){camera.fov=settings.fov;camera.updateProjectionMatrix();}}
 if(changedKeys.includes('aaStats')&&!settings.aaStats&&aaStatsClock.node)aaStatsClock.node.hidden=true;
 crouchLatch=false;bindingPending=null;physicalKeys.clear();keys.clear();requestSettingsPreview();return ok&&touchOK;
}
function undoSettingsReset(){const undo=settingsUI.undo;if(!undo)return;Object.assign(settings,undo.game);if(mobile)Object.assign(mobile.settings,undo.touch);for(const [id,keys]of Object.entries(undo.bindings))controls.bindings[id]=[...keys];settingsUI.undo=null;const ok=persistWorkspaceReset(undo);settingsStatus(ok?'Reset undone':'Storage unavailable · reset undone for this session');renderControls();}
async function settingsAction(action){
 if(action==='bindings'){settingsUI.input='Keyboard';navigateSettings('Controls','Movement');return;}
 if(action==='smoothing'){navigateSettings('Graphics','Smoothing');return;}
 if(action==='close-detail'){settingsUI.report=false;settingsUI.detail=null;renderControls();return;}
 if(action==='editor'||action==='editor-minimap'){if(!mobile)return;rememberSettingsScroll();mobile.startEditor('settings');if(action==='editor-minimap')mobile.selectEditor('minimap');return;}
 if(action==='gyro'){if(!mobile)return;const ok=await mobile.enableGyro();mobile.commitSettings();settingsStatus(ok?'Recentered. Hold your phone comfortably.':'Motion access unavailable or declined. Touch aiming still works.');renderControls();return;}
 if(action==='benchmark'){settingsUI.sections.Graphics='Performance';settingsUI.category='Graphics';startGraphicsBenchmark();return;}
 if(action==='report'){settingsUI.report=true;renderControls();return;}
 if(action==='download-report'){const report=settingsSnapshot().benchmark;if(!report)return;const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='fragony-graphics-benchmark.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 if(action==='guide'){if(mobile)mobile.showGuide('settings');else{settingsUI.detail='guide';renderControls();}return;}
 if(action==='display-report'){const text=JSON.stringify(displayReport(),null,2);try{await navigator.clipboard.writeText(text);settingsStatus('Display report copied');}catch{settingsUI.displayReport=text;settingsUI.detail='display';renderControls();}return;}
 if(action==='install'){settingsUI.detail='install';renderControls();return;}
 if(action==='practice'){
  rememberSettingsScroll();if(!isPractice()&&mode==='play')saveRun();if(isPractice()){closeSettings();return;}mobile?.closeOverlay();$('panel').hidden=true;return beginPractice();
 }
 if(action==='maps'&&isPractice()){if(mobile)mobile.showPracticeMaps();else showPracticeMaps();return;}
 if(action==='workbench'&&isPractice()){mobile?.closeOverlay();showShop(false);return;}
 if(action==='end-practice'&&isPractice()){mobile?.closeOverlay();mainMenu();return;}
 if(action==='reset-touch'&&mobile){resetWorkspaceValues([],Object.keys(MOBILE_DEFAULTS));return;}
 if(action==='reset-graphics'){resetWorkspaceValues([...Object.keys(graphicsOptions({})), 'aaStats']);return;}
 if(action==='reset-bindings'){resetWorkspaceValues([],[],ACTIONS.map(a=>a.id));}
}

function commitBinding(code,replace=false){const p=bindingPending,result=controls.assign(p.id,p.slot,code,replace);if(Array.isArray(result)&&result.length){bindingPending={...p,code,conflicts:result};renderControls();return}controlsMessage=ACTIONS.find(a=>a.id===p.id).label+': '+keyLabel(code);settingsUI.undo=null;bindingPending=null;settingsSaved(saveControls());if(settingsUI.message==='Saved on this device')settingsUI.message=controlsMessage;physicalKeys.clear();keys.clear();mouseDown=false;renderControls()}
function captureBinding(code,e){if(!bindingPending)return false;if((code.startsWith('Mouse')||code.startsWith('Wheel'))&&e?.target?.closest?.('button,input,select,a')&&!e.target.closest('[data-binding-capture]'))return false;e?.preventDefault?.();if(bindingPending.code)return true;if(code==='Escape'){bindingPending=null;renderControls();return true}commitBinding(code);return true}
function syncInputs(){keys.clear();for(const a of ACTIONS)if(controls.bindings[a.id].some(c=>c&&physicalKeys.has(c)))keys.add(a.code);if(settings.crouchToggle){keys.delete('KeyC');if(crouchLatch)keys.add('KeyC')}mouseDown=keys.has('MouseLeft');$('leaderboard').style.fontSize=keys.has('Tab')?'22px':''}
function inputPress(code,e){if(mode==='inspect'&&code==='Escape'){closeInspection();return;}if(captureBinding(code,e))return;if(code==='Escape'&&settingsVisible()&&e?.target?.tagName!=='SELECT'){e?.preventDefault?.();closeSettings();return;}if(mobile?.enabled){if(code==='Escape'&&mode==='play')pause();return;}if(mode!=='play'||!locked)return;e?.preventDefault?.();const fresh=!physicalKeys.has(code);physicalKeys.add(code);const actions=controls.actionsFor(code);if(fresh){for(const a of actions){if(a.id==='pause'){locked=false;document.exitPointerLock?.();pause();return}if(a.id==='crouch'&&settings.crouchToggle)crouchLatch=!crouchLatch;if(respawnTime>0)continue;if(a.id==='jump')jumpBuffered=FEEL.jumpBuffer;if(a.id==='fire'&&code.startsWith('Wheel')&&!playerWeapon().charge)shoot();if(a.id==='reload')reload();if(a.id==='melee')melee();if(a.id==='streak'&&streakReady){streakReady=false;streak=0;activateStreak()}if(a.id.startsWith('weapon'))switchWeapon(WEAPON_ORDER[Number(a.id.slice(6))-1]);if(a.id==='previous'||a.id==='next'){const order=WEAPON_ORDER.filter(g=>owned.includes(g)),i=order.indexOf(equipped);switchWeapon(order[(i+(a.id==='next'?1:order.length-1))%order.length])}}}syncInputs()}
function updateStance(){
 const feet=playerPos.y-eyeHeight,wants=keys.has('KeyC'),clear=canOccupy(blocks,{x:playerPos.x,z:playerPos.z,feet,radius:COLLISION.radius,height:COLLISION.standing});
 headBlocked=crouched&&!wants&&!clear;const next=wants||crouched&&!clear;
 if(next!==crouched){crouched=next;eyeHeight=next?.95:1.7;playerPos.y=feet+eyeHeight}
 $('head-blocked').hidden=!headBlocked;
}

function controlHint(){return [['forward','MOVE'],['jump','JUMP'],['crouch','CROUCH / SLIDE'],['melee','MELEE'],['slow','SLOW TIME'],['pause','PAUSE']].map(([a,l])=>`${keyLabel(controls.bindings[a].find(Boolean)||'')} ${l}`).join(' · ')}

function minimapSettingsHTML(desktop=true){const rows=`<label class="minimap-setting"><span>Show minimap</span><input id="setting-minimap" type="checkbox" ${settings.minimap?'checked':''}></label><label class="minimap-setting"><span>Lock minimap north</span><input id="setting-minimapNorth" type="checkbox" ${settings.minimapNorth?'checked':''}></label>${desktop?settingRow('minimapScale','Minimap scale',.5,2,.05):'<p class="touch-help">Move and resize the minimap in Edit HUD.</p>'}`;return desktop?`<section class="settings-category"><h3>MINIMAP</h3>${rows}<p class="minimap-help">Scale changes its size on screen. Map range stays the same.</p></section>`:`<h3 class="minimap-settings-heading">MINIMAP</h3>${rows}`;}
function applyMinimapSettings(){const size=160*settings.minimapScale;$('minimap-module').hidden=!settings.minimap;$('minimap-module').style.width=size+'px';$('minimap-module').style.height=size+'px';$('hud').style.setProperty('--minimap-offset',settings.minimap?size+16+'px':'0px');mobile?.applyLayout?.();}
function bindMinimapSettings(panel){for(const key of ['minimap','minimapNorth','minimapScale']){const input=panel.querySelector('#setting-'+key);if(!input)continue;const change=e=>{settings[key]=key==='minimapScale'?clamp(Number(e.target.value),.5,2):e.target.checked;if(key==='minimapScale'){panel.querySelector('#value-'+key).textContent=settingValue(key);e.target.setAttribute('aria-valuetext',settingValue(key));e.target.style.setProperty('--fill',(settings[key]-.5)/1.5*100+'%');}localStorage.setItem('dh-settings',JSON.stringify(settings));applyMinimapSettings();drawMinimap();};if(key==='minimapScale')input.oninput=change;else input.onchange=change;}}
function drawMinimap(){const layout=mobile?.enabled?mobile.layout:null;if(!minimap||!settings.minimap||layout?.minimap.hidden)return;const feet=playerPos.y-eyeHeight,size=layout?130*layout.minimap.scale*mobile.settings.controlScale:160*settings.minimapScale*settings.hudScale;minimap.draw({map:MAP,player:{x:playerPos.x,y:feet,z:playerPos.z},level:floorAt(playerPos.x,playerPos.z,feet),yaw,north:settings.minimapNorth,pickups:[...pickups,...choiceTokens],elevators:elevatorSystem?.lifts||[],pixelSize:size*Math.min(window.devicePixelRatio||1,2)});}

function settingValue(key){return Math.round(settings[key]*100)+'%'}
function settingRow(key,label,min=0,max=1,step=.05){const percent=(settings[key]-min)/(max-min)*100;return `<div class="setting-row"><label for="setting-${key}">${label}</label><output id="value-${key}" for="setting-${key}">${settingValue(key)}</output><input id="setting-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${settings[key]}" aria-valuetext="${settingValue(key)}" style="--fill:${percent}%">${key==='hudScale'?'<span class="range-limits"><span>50%</span><span>200%</span></span>':''}</div>`}
function settingsHTML(){return `<section class="settings-category"><h3>AUDIO</h3>${[['guns','Guns'],['steps','Footsteps'],['feedback','Hit & damage feedback'],['music','Music']].map(([key,label])=>settingRow(key,label)).join('')}</section><section class="settings-category"><h3>VISUALS</h3><button type="button" class="graphics-open" id="open-graphics">GRAPHICS & PERFORMANCE <span>↗</span></button>${settingRow('motion','Camera motion')}${settingRow('hudScale','HUD scale',.5,2,.05)}</section>${minimapSettingsHTML(true)}`}
function applyHUDScale(){const scale=mobile?.enabled?1:settings.hudScale;$('hud').style.zoom=String(scale);$('hud').style.width=(100/scale)+'vw';$('hud').style.height=(100/scale)+'vh';$('hud').style.setProperty('--hud-scale',scale);$('hud').className=innerWidth/scale<850?'hud-compact':'hud-wide';applyMinimapSettings()}
function bindSettings(){const graphics=$('panel').querySelector('#open-graphics');if(graphics)graphics.onclick=showGraphicsSettings;bindAntialiasSetting($('panel'));bindMinimapSettings($('panel'));for(const key of ['motion','guns','steps','feedback','music','hudScale'])$('setting-'+key).oninput=e=>{const min=key==='hudScale'?.5:0,max=key==='hudScale'?2:1;settings[key]=clamp(Number(e.target.value),min,max);$('value-'+key).textContent=settingValue(key);e.target.setAttribute('aria-valuetext',settingValue(key));e.target.style.setProperty('--fill',(settings[key]-min)/(max-min)*100+'%');localStorage.setItem('dh-settings',JSON.stringify(settings));if(key==='hudScale')applyHUDScale();else gameAudio.applySettings(settings)}}
$('arsenal').onclick=()=>showShop(true);$('start').onclick=()=>startRandomMatch();updateMainMenu();$('continue').onclick=()=>{try{const raw=localStorage.getItem('dh-run'),parsed=JSON.parse(raw),saved=migrateModularRun(parsed);if(!saved){notify('Saved run could not load');return;}const target=MAPS.find(m=>m.id===saved.mapId);if(arenaNeedsLoading(target))return prepareArena(saved.mapId,()=>{$('continue').onclick()});if(parsed.modularVersion!==MODULAR_VERSION&&!localStorage.getItem('dh-run-v2-backup'))localStorage.setItem('dh-run-v2-backup',raw);gunCollection=normalizeCollection(saved.collection);round=saved.round;owned=[0];equipped=startingWeapon=0;perks={};builds=normalizeBuilds();equipment=normalizeEquipment();rivals=restoreRivals(saved.rivals,botNames,()=>[],ALL_WEAPONS);changeArena(saved.mapId||'reservoir');restoreMapRotation();localStorage.setItem('dh-run',JSON.stringify({...saved,collection:gunCollection}));$('menu').hidden=true;document.body.classList.add('playing');saved.phase==='shop'?showShop():startMatch(true);}catch(error){console.error('Run restore failed',error);notify('Saved run could not load');}};
$('help').onclick=e=>{e.preventDefault();showControls('menu')};
$('sound').onclick=()=>{muted=!muted;gameAudio.setMuted(muted);if(!muted)gameAudio.unlock();$('sound').innerHTML=`AUDIO <span>${muted?'OFF':'ON'}</span>`};
document.addEventListener('pointerlockchange',()=>{
 if(mobile?.enabled)return;
 const captured=document.pointerLockElement===renderer.domElement;
 if(captured){dragLook=false;locked=true;lastPointer=null;if(mode==='play'){$('panel').hidden=true;$('hud').querySelector('.hudhint').textContent=controlHint()}}
 else if(!dragLook){locked=false;if(mode==='play')pause()}
});
document.addEventListener('pointerlockerror',enableDragLook);
document.addEventListener('mousemove',e=>{
 if(mobile?.enabled||!locked||mode!=='play'||respawnTime>0)return;
 let dx=e.movementX,dy=e.movementY;
 if(dragLook){if(lastPointer){dx=e.clientX-lastPointer.x;dy=e.clientY-lastPointer.y}else{dx=Number.isFinite(dx)?dx:0;dy=Number.isFinite(dy)?dy:0}lastPointer={x:e.clientX,y:e.clientY}}
 const sense=(keys.has('MouseRight')?.001/playerWeapon().zoom:.002)*(settings.sensitivity||1);yaw-=dx*sense;pitch=clamp(pitch-dy*sense*(settings.invertY?-1:1),-1.5,1.5);turnX+=dx*.001;turnY+=dy*.001;
});

document.addEventListener('mousedown',e=>inputPress(mouseCode(e.button),e));document.addEventListener('mouseup',e=>{physicalKeys.delete(mouseCode(e.button));if(mode==='play'&&locked&&!mobile?.enabled)syncInputs()});document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>inputPress(e.code,e));document.addEventListener('keyup',e=>{physicalKeys.delete(e.code);if(mode==='play'&&locked&&!mobile?.enabled)syncInputs()});window.addEventListener('blur',()=>{physicalKeys.clear();keys.clear();mouseDown=false;if(locked){if(mobile?.enabled||dragLook){locked=false;pause()}else document.exitPointerLock()}});document.addEventListener('wheel',e=>{const code=e.deltaY>0?'WheelDown':'WheelUp';if(captureBinding(code,e))return;if(mode==='play'&&locked){inputPress(code,e);physicalKeys.delete(code);syncInputs()}},{passive:false});window.addEventListener('resize',()=>{applyHUDScale();if(!renderer)return;sizeRenderer();frameRenderer?.resize()});


function startGraphicsBenchmark(){
 if(benchmarkOverlay||benchmarkChild)return;
 if(mobile?.enabled&&!mobile.landscape){mobile.setFeedback('TURN TO LANDSCAPE TO BENCHMARK');return;}
 benchmarkOverlay=openBenchmark({settings:{...graphicsOptions(settings),motion:settings.motion},summary:frameRenderer?.aaSummary?.()||'',onClose:()=>{benchmarkOverlay=null;frameRenderer?.resetHistory();settingsUI.category='Graphics';settingsUI.sections.Graphics='Performance';settingsUI.report=!!settingsSnapshot().benchmark;renderControls();}});
}
function startBenchmarkChild(){
 muted=true;gameAudio.setMuted(true);settings.aaStats=false;let anchor=null,baseYaw=0,lastEffect=-1,lastProjectile=-1,lastProgress=0,progressPhase='';
 const send=(type,payload)=>parent.postMessage({token:benchmarkToken,type,...payload},location.origin);
 const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 benchmarkRunner=new BenchmarkRunner({
  prepare:async(test,index)=>{
   Math.random=seeded(74291+index);mode='loading';locked=false;
   const entry=MAPS.find(m=>m.id===test.map);if(!entry)throw Error('Benchmark map unavailable: '+test.map);
   if(arenaNeedsLoading(entry))await(entry.load?entry.load():entry.loadRender());
   beginPractice(test.map);if(MAP.id!==test.map)throw Error('Benchmark map did not load.');
   equipped=0;builds=normalizeBuilds();buildWeapon();feedSystem.reset(owned,i=>playerWeapon(i));ammo=playerWeapon().mag;
   const point=spawnPoints[test.view?Math.floor(spawnPoints.length/2):0];anchor=new THREE.Vector3(point[0],point[1]+1.7,point[2]);playerPos.copy(anchor);viewHeight=anchor.y;vel.set(0,0,0);vy=0;grounded=true;
   baseYaw=MAP.spawnYaws?.[spawnPoints.indexOf(point)]??Math.atan2(point[0],point[2]);yaw=baseYaw;pitch=0;lastEffect=lastProjectile=-1;locked=true;mobile?.closeOverlay();frameRenderer.resetHistory();
   if(mobile){mobile.settings.fireMode='manual';mobile.settings.holdSemi=true;}settings.holdSemi=true;
  },
  stage:(test,seconds)=>{
   // Fixed camera path at a valid map spawn, with the full native AI and combat simulation.
   playerPos.copy(anchor);viewHeight=anchor.y;vel.set(0,0,0);vy=0;keys.clear();yaw=baseYaw+Math.sin(seconds*.55)*.5;pitch=Math.sin(seconds*.4)*.08;mouseDown=true;locked=true;health=100;
   if(reloading>0||ammo<3){reloading=0;ammo=playerWeapon().mag;feedSystem.state(equipped).ammo=ammo;}
   const cadence=test.heavy?.45:1.25,tick=Math.floor(seconds/cadence);
   if(tick!==lastEffect){lastEffect=tick;camera.getWorldDirection(tmp);const point=anchor.clone().addScaledVector(tmp,5).add(new THREE.Vector3(Math.sin(seconds)*1.5,-.4,0));if(test.heavy)explode(point,null,.001);else burst(point,0xd9ef45,8);}
   if(test.heavy&&Math.floor(seconds/.8)!==lastProjectile){lastProjectile=Math.floor(seconds/.8);camera.getWorldDirection(tmp);launchRocket(anchor,tmp,null,.001);}
  },
  metrics:()=>({shots:shotsFired,effects:effects.length}),
  progress:progress=>{const now=performance.now(),phase=progress.index+':'+progress.phase;if(phase!==progressPhase||now-lastProgress>=250){progressPhase=phase;lastProgress=now;send('progress',{progress});}},
  error:message=>send('error',{message:'Benchmark stopped: '+message}),
  complete:results=>{locked=false;send('complete',{report:{results:results.map(r=>({...r,mapName:MAPS.find(m=>m.id===r.map)?.name||r.map})),width:frameRenderer.world.width,height:frameRenderer.world.height,devicePixelRatio:devicePixelRatio||1,userAgent:navigator.userAgent,summary:frameRenderer.aaSummary()}});}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!benchmarkRunner.done){benchmarkRunner.done=true;send('error',{message:'Benchmark interrupted. Keep the game visible and run again.'});}});
 window.addEventListener('resize',()=>{if(!benchmarkRunner.done){benchmarkRunner.done=true;send('error',{message:'Screen size changed. Run again without rotating or resizing.'});}});
 benchmarkRunner.next();
}

function graphicsSettingsHTML(){return graphicsControlsHTML(settings,antialiasSettingHTML(),resolutionSettingHTML());}
function showGraphicsSettings(){navigateSettings('Graphics','Quality')}
function bindGraphicsSettings(panel){
 const persist=()=>{Object.assign(settings,graphicsOptions(settings,graphicsContext));localStorage.setItem('dh-settings',JSON.stringify(settings));};
 const summary=()=>{const output=panel.querySelector('#aa-summary');if(output)output.textContent=frameRenderer?.aaSummary?.()||'';};
 panel.querySelectorAll('[data-graphics]').forEach(input=>{
  const key=input.dataset.graphics;
  const change=()=>{settings[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;persist();
   if(input.type==='range'){
    const output=panel.querySelector(`[data-graphics-value="${key}"]`);if(output)output.textContent=key==='fov'?settings[key]+'°':Math.round(settings[key]*100)+'%';
    applyGraphicsRendererSettings();if(frameRenderer){frameRenderer.pixelForgeIntensity=settings.pixelForge?settings.pixelForgeIntensity:0;frameRenderer.output.uniforms.pixelForgeAmount.value=frameRenderer.pixelForgeIntensity;frameRenderer.bloomEnabled=settings.bloomStrength>0;frameRenderer.output.uniforms.untonemappedExposure.value=settings.toneMap==='none'?settings.exposure:1;frameRenderer.output.uniforms.bloomAmount.value=settings.bloomStrength;frameRenderer.output.uniforms.aoAmount.value=frameRenderer.gtao?settings.aoStrength:0;frameRenderer.output.uniforms.vignetteAmount.value=settings.vignette;frameRenderer.output.uniforms.grainAmount.value=settings.grain?1:0;frameRenderer.output.uniforms.gradeAmount.value=settings.colorGrade?1:0;}
   }else rebuildGraphics();
   if(key==='fov'&&camera){camera.fov=settings.fov;camera.updateProjectionMatrix();frameRenderer?.resetHistory();}
   const preset=panel.querySelector('[data-graphics-preset]');if(preset)preset.value='custom';summary();
  };if(input.type==='range'){input.oninput=change;input.onchange=()=>{if(key==='aoStrength')rebuildGraphics();summary();};}else input.onchange=change;
 });
 const preset=panel.querySelector('[data-graphics-preset]');if(preset)preset.onchange=()=>{const chosen=EFFECT_PRESETS[preset.value];if(!chosen)return;Object.assign(settings,chosen);persist();rebuildGraphics();refresh();};
 const refresh=()=>{if(mobile?.enabled){const section=panel.querySelector('.graphics-settings');if(section){section.outerHTML=graphicsSettingsHTML();bindAntialiasSetting(panel);bindGraphicsSettings(panel);}}else showGraphicsSettings();};
 const reset=panel.querySelector('[data-graphics-reset]');if(reset)reset.onclick=()=>{Object.assign(settings,graphicsOptions({},{...graphicsContext,legacy:{}}),{aaStats:false});persist();rebuildGraphics();if(camera){camera.fov=settings.fov;camera.updateProjectionMatrix();}refresh();};
 const report=panel.querySelector('[data-benchmark-report]');if(report){try{const saved=JSON.parse(localStorage.getItem('dh-graphics-benchmark')||'null');if(saved)report.innerHTML=benchmarkReportHTML(saved);}catch{}}
 const benchmark=panel.querySelector('[data-graphics-benchmark]');if(benchmark)benchmark.onclick=()=>startGraphicsBenchmark();
}

const AA_PRESETS={standard:{msaa:2,aaFilter:'none',taa:false},high:{msaa:4,aaFilter:'none',taa:false},smaa:{msaa:0,aaFilter:'smaa',taa:false},hybrid:{msaa:2,aaFilter:'smaa',taa:false},fxaa:{msaa:0,aaFilter:'fxaa',taa:false},temporal:{msaa:0,aaFilter:'none',taa:true}};
function resolutionSettingHTML(){return `<div class="resolution-settings"><label class="aa-option"><span>Render resolution</span><select id="setting-resolutionScale">${[[.25,'25%'],[.33,'33%'],[.5,'50%'],[.67,'67%'],[.75,'75%'],[1,'Native (100%)']].map(([value,label])=>`<option value="${value}" ${settings.resolutionScale===value?'selected':''}>${label}</option>`).join('')}</select></label><p class="aa-help">Percentage of your screen’s native width and height. Lower values improve performance. HUD and text stay sharp. Effects quality and antialiasing are independent.</p></div>`;}
function antialiasSettingHTML(){
 const option=(key,label,values)=>`<label class="aa-option"><span>${label}</span><select id="setting-${key}" ${settings.antialias?'':'disabled'}>${values.map(([value,text])=>`<option value="${value}" ${String(settings[key])===String(value)?'selected':''}>${text}</option>`).join('')}</select></label>`;
 return `<div class="aa-settings"><label class="minimap-setting"><span>Antialiasing</span><input id="setting-antialias" type="checkbox" ${settings.antialias?'checked':''}></label><label class="aa-option"><span>Quick comparison</span><select id="setting-aaPreset"><option value="custom">Choose a combination…</option><option value="standard">2× MSAA (default)</option><option value="high">4× MSAA</option><option value="smaa">SMAA only</option><option value="hybrid">2× MSAA + SMAA</option><option value="fxaa">FXAA only</option><option value="temporal">TAA only (experimental)</option></select></label>${option('msaa','Geometry samples',[[0,'Off'],[2,'2× MSAA'],[4,'4× MSAA']])}${option('aaFilter','Finishing filter',[['none','Off'],['fxaa','FXAA'],['smaa','SMAA']])}<label class="minimap-setting"><span>Temporal AA <small>Experimental</small></span><input id="setting-taa" type="checkbox" ${settings.taa?'checked':''} ${settings.antialias?'':'disabled'}></label><p class="aa-help">Combine geometry samples, a finishing filter and temporal AA. Resolution stays unchanged. Temporal AA stabilizes the world; moving characters may trail. Sights and HUD stay outside temporal history.</p><output id="aa-summary" class="aa-summary" aria-live="polite">${frameRenderer?.aaSummary?.()||'2× MSAA'}</output><label class="minimap-setting"><span>Show performance</span><input id="setting-aaStats" type="checkbox" ${settings.aaStats?'checked':''}></label></div>`;
}
function bindAntialiasSetting(panel){
 const get=key=>panel.querySelector('#setting-'+key),master=get('antialias');if(!master)return;
 const apply=()=>{
  Object.assign(settings,antialiasOptions(settings));localStorage.setItem('dh-settings',JSON.stringify(settings));
  if(renderer)rebuildGraphics();
  for(const key of ['msaa','aaFilter','taa']){const input=get(key);if(input){input.disabled=!settings.antialias;if(key==='taa')input.checked=settings.taa;else input.value=String(settings[key]);}}
  master.checked=settings.antialias;const summary=panel.querySelector('#aa-summary');if(summary)summary.textContent=frameRenderer?.aaSummary?.()||'AA settings saved';
  aaStatsClock.last=0;aaStatsClock.frames=0;aaStatsClock.elapsed=0;
 };
 master.onchange=()=>{settings.antialias=master.checked;apply();};
 for(const key of ['msaa','aaFilter','taa']){const input=get(key);if(input)input.onchange=()=>{settings[key]=key==='taa'?input.checked:key==='msaa'?Number(input.value):input.value;const preset=get('aaPreset');if(preset)preset.value='custom';apply();};}
 const preset=get('aaPreset');if(preset)preset.onchange=()=>{if(!AA_PRESETS[preset.value])return;Object.assign(settings,AA_PRESETS[preset.value],{antialias:true});apply();};
 const resolution=get('resolutionScale');if(resolution)resolution.onchange=()=>{const value=Number(resolution.value);if(![.25,.33,.5,.67,.75,1].includes(value))return;settings.resolutionScale=value;apply();};
 const stats=get('aaStats');if(stats)stats.onchange=()=>{settings.aaStats=stats.checked;localStorage.setItem('dh-settings',JSON.stringify(settings));if(!settings.aaStats&&aaStatsClock.node)aaStatsClock.node.hidden=true;};
}
const aaStatsClock={last:0,elapsed:0,frames:0,node:null};
function updateAAStats(now){
 const state=aaStatsClock;if(!settings.aaStats){state.last=0;if(state.node)state.node.hidden=true;return;}
 if(!state.node){state.node=document.createElement('output');state.node.id='aa-performance';state.node.setAttribute('aria-label','Rendering performance');document.body.appendChild(state.node);}
 state.node.hidden=false;const dt=state.last?(now-state.last):0;state.last=now;
 if(dt<=0||dt>250){state.elapsed=0;state.frames=0;return;}
 state.elapsed+=dt;state.frames++;
 if(state.elapsed>=500){state.node.textContent=`${Math.round(state.frames*1000/state.elapsed)} FPS · ${(state.elapsed/state.frames).toFixed(1)} ms/frame\n${frameRenderer?.aaSummary?.()||''}`;state.elapsed=0;state.frames=0;}
}

function activeGunCollection(){return isPractice()?(practiceCollection??=fullCollection()):gunCollection;}
function syncModularAmmo(){ammo=playerGunFire.ammo;magazines[0]=ammo;feedSystem.state(0,ammo).ammo=ammo;const before=reloading;reloading=playerGunFire.reloading;if(reloading){reloadLength=playerGunFire.reloadUntil-playerGunFire.reloadStart;if(!before)playSfx('reload-out',{volume:.45});}else if(before)playSfx('reload-in',{volume:.4});}
function modularAimCone(){syncAimCamera();const direction=camera.getWorldDirection(new THREE.Vector3());for(const b of bots){if(b.dead)continue;const point=b.pos.clone().add(new THREE.Vector3(0,1.2,0)),delta=point.clone().sub(camera.position);if(delta.lengthSq()>8100)continue;if(delta.normalize().dot(direction)>Math.cos(8*Math.PI/180)&&visible(camera.position,point))return true;}return false;}
function stepModularPlayer(dt,down=mouseDown){
 const events=playerGunFire.tick(dt,motor=>gunStats(activeGunCollection(),playerGunLife,motor),{down,cone:playerWeapon().barrel==='gatling'&&modularAimCone(),blocked:meleeSwing>0,alive:respawnTime<=0&&health>0});
 fireControl.charge=playerGunFire.capacitor*(playerWeapon().charge||0);fireControl.charging=!!playerWeapon().charge&&playerGunFire.capacitor<1;fireControl.heat=playerGunFire.spool;
 shotTimer=Math.max(0,playerGunFire.nextAction-playerGunFire.clock);
 for(const packet of events)emitModularPacket(null,null,packet);syncModularAmmo();return events.length>0;
}
function modularActors(){playerActor.pos.set(playerPos.x,playerPos.y-eyeHeight,playerPos.z);return [...bots,playerActor];}
function ensureModularProjectiles(){if(modularProjectiles)return modularProjectiles;
 return modularProjectiles=new ModularProjectiles({scene,actors:modularActors,
  trace:(origin,direction,length,radius,owner,seen)=>{const meshes=botHitMeshes().filter(m=>m.userData.bot!==owner&&!m.userData.bot.dead);if(owner&&respawnTime<=0&&opponentAI.clock-playerSpawnAt>=opponentAI.tuning.fairness.spawnGrace){playerActor.pos.set(playerPos.x,playerPos.y-eyeHeight,playerPos.z);playerProxy.position.set(playerPos.x,playerPos.y-eyeHeight+(eyeHeight+.27)/2,playerPos.z);playerProxy.scale.set(.7,Math.max(.5,eyeHeight-.03),.7);playerProxy.userData.bot=playerActor;playerProxy.updateMatrixWorld(true);meshes.push(playerProxy);}return sweepMeshes(origin,direction,length,radius,[...worldMeshes,...meshes],{exclude:owner,seen});},
  playerPart:point=>bodyPartAt(point,playerPos,yaw,eyeHeight),visible:blastVisible,
  damage:(actor,amount,owner,part,point,options)=>{if(actor.isPlayer){const before=health;damagePlayer(fromDisplay(amount,BALANCE.playerHP),owner,{...options,part,head:part==='head'});return{damage:toDisplay(before-health,BALANCE.playerHP),killed:before>0&&health<=0};}
   const result=damageBot(actor,fromDisplay(amount,BALANCE.botHP),owner,part,point,{...options,defer:true,head:part==='head',headKill:part==='head'});if(!owner)modularOutcomes.push(result);return result;},
  slow:(actor,duration)=>{const life=actor.isPlayer?playerGunLife:actor.modularLife;if(life)life.slowUntil=Math.max(life.slowUntil,modularProjectiles.clock+duration);},
  impact:(hit,w)=>impactEffect(hit,w.instant?1.5:1),
  explosion:(point,radius)=>{burst(point,0xffb774,7);playSfx('explosion',{pos:point,volume:.22,curve:'explosion',bus:'explosions',priority:1});},
  arc:(a,b,owner)=>arcTrail(a,b,!owner)
 });
}
function emitModularPacket(owner,point,packet){
 if(owner?.dead||!owner&&(respawnTime>0||health<=0))return;
 let origin,direction;
 if(owner){origin=owner.pos.clone().add(new THREE.Vector3(0,1.28-(owner.anim?.crouch||0)*.45,0));direction=new THREE.Vector3(point.x,point.y,point.z).sub(origin).normalize();minimap?.shot(owner.name,owner.pos);owner.modularMuzzleTime=.05;fireDummy(owner,'rifle');opponentAI?.hear(owner.pos,owner);}
 else{syncAimCamera();origin=camera.position.clone();direction=camera.getWorldDirection(new THREE.Vector3());weaponMotion.fire(playerHandling());aimSpring.impulse(playerHandling().aim*20);muzzleTime=.04;shotsFired++;opponentAI?.hear(playerPos,'player');}
 scene.updateMatrixWorld(true);ensureModularProjectiles().emit(packet,origin,direction,owner);
 if(!muted)gameAudio.weapon(packet.w.instant?'rail':packet.w.ammoType==='explosive'?'rocket':packet.w.ammoType==='pellets'?'shotgun':'rifle',{...(owner?{pos:origin}:{}),spec:packet.w});
}
function modularKill(owner,lifeId){
 const collection=owner?owner.rival?.collection:activeGunCollection(),life=owner?owner.modularLife:playerGunLife;if(!collection||!life||life.id!==lifeId||(owner?owner.dead:respawnTime>0||health<=0))return;
 const reward=rewardKill(collection,life);if(owner){const w=gunStats(collection,life,owner.modularFire?.spool||0);if(reward.health)healBot(owner,owner.hp+fromDisplay(reward.health,BALANCE.botHP));owner.focus=Math.min(100,(owner.focus||0)+BALANCE.focusKill+reward.focus);owner.modularFire?.returnAmmo(reward.ammoFraction*w.mag,w);}
 else{streak=life.kills;focus=Math.min(100,focus+BALANCE.focusKill+reward.focus);if(reward.health)healPlayer(health+fromDisplay(reward.health,BALANCE.playerHP));playerGunFire.returnAmmo(reward.ammoFraction*playerWeapon().mag,playerWeapon());}
}
function modularMoveScale(actor=null){const life=actor?actor.modularLife:playerGunLife;return life?.slowUntil>(modularProjectiles?.clock||0)?0.8:1;}
function dropChoiceToken(position){if(isPractice()||Math.random()>=.2)return null;const point=position.clone();if(!Number.isFinite(point.y)||point.y<(MAP.killBelow??-20)){const n=nearestAINode(navigation,position);if(n)point.set(n.x,n.y,n.z);else return null;}const token=createChoiceToken(++tokenSerial,point);token.createdAt=opponentAI?.clock||0;scene.add(token.mesh);choiceTokens.push(token);if(round>1)for(const b of bots)if(b.brain&&!b.dead)b.brain.thinkIn=Math.min(b.brain.thinkIn,botTokenSkill(round).reaction);return token;}
function stepChoiceTokens(dt){
 for(const token of choiceTokens){if(token.collected)continue;token.age=(token.age||0)+dt;const floor=floorAt(token.x,token.z,token.y+.2);if(Number.isFinite(floor)&&token.y>floor){token.vy=(token.vy||0)-18*dt;token.y=Math.max(floor,token.y+token.vy*dt);}token.mesh.rotation.y+=dt*2;token.mesh.position.y=token.y+.48+Math.sin(elapsed*3)*.08;
  if(token.age<.25)continue;const candidates=[];if(respawnTime<=0&&health>0){const distance=Math.hypot(playerPos.x-token.x,playerPos.y-eyeHeight-token.y,playerPos.z-token.z);if(distance<=1.1)candidates.push({id:'player',distance,collection:activeGunCollection()});}
  for(const b of bots)if(!b.dead&&b.hp>0){const distance=b.pos.distanceTo(new THREE.Vector3(token.x,token.y,token.z));if(distance<=1.1)candidates.push({id:b.name,distance,collection:b.rival.collection});}
  candidates.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));const winner=candidates[0];if(!winner)continue;token.collected=true;token.mesh.removeFromParent();winner.collection.tokens++;if(winner.id==='player'){notify('+1 shop choice');playSfx('pickup',{volume:.35});}
  for(const b of bots)if(b.brain?.goal?.token===token){b.brain.goal=null;b.brain.pathIn=b.brain.thinkIn=0;}
 }
 choiceTokens=choiceTokens.filter(t=>!t.collected);
}
function clearModularRound(){botFocusOwner=null;botFocusLeft=0;botFocusCooldown=0;for(const token of choiceTokens)token.mesh.removeFromParent();choiceTokens=[];modularProjectiles?.clear();modularOutcomes=[];}
function buildModularDummyGun(b){const mount=b.parts.rightArm.userData.weaponMount||b.parts.rightArm,signature=JSON.stringify(b.rival.collection.kit),old=mount.children.find(c=>c.name==='weapon');if(old?.userData.modularSignature===signature)return old;if(old){disposeToolModel(old);mount.remove(old);}const gun=new THREE.Group();gun.name='weapon';gun.userData.modularSignature=signature;const model=createModularGun(b.rival.collection.kit);model.root.rotation.y=-Math.PI/2;model.root.scale.setScalar(.29);model.root.position.set(0,.06,.04);model.root.userData.modularDispose=()=>model.dispose();b.modularModel=model;gun.add(model.root);mount.add(gun);gun.traverse(o=>{o.userData.bot=b;o.userData.part='rightArm';if(o.isMesh)o.userData.gunVisual=true;});return gun;}

// One bot may spend focus at a time. Player activation takes priority. The
// owner keeps its own action clock; every other actor and projectile slows.
function stepBotFocus(dt,playerSlow){
 botFocusCooldown=Math.max(0,botFocusCooldown-dt);
 for(const b of bots){if(b.dead||!b.rival?.collection)continue;
  if(b===botFocusOwner&&!playerSlow){b.focus=Math.max(0,b.focus-BALANCE.focusDrain*dt);b.focusRest=BALANCE.focusDelay;}
  else{b.focusRest=Math.max(0,(b.focusRest||0)-dt);if(!b.focusRest)b.focus=Math.min(100,(b.focus||0)+BALANCE.focusRegen*circuitBonuses(b.rival.collection,b.modularLife).focusRegen*dt);}
 }
 if(botFocusOwner){botFocusLeft-=dt;if(playerSlow||botFocusOwner.dead||botFocusOwner.focus<=0||botFocusLeft<=0){botFocusOwner=null;botFocusCooldown=6;} }
 if(playerSlow||botFocusOwner||botFocusCooldown||round<3||isPractice())return;
 const candidate=bots.filter(b=>!b.dead&&b.focus>=55&&b.brain?.visible&&b.brain.recover<=0&&(toDisplay(b.hp,BALANCE.botHP)<45||b.rival.collection.kit.circuit.id==='focus'&&b.modularLife.stacks>0)).sort((a,b)=>a.hp-b.hp||a.name.localeCompare(b.name))[0];
 if(candidate){botFocusOwner=candidate;botFocusLeft=1.2;notify(candidate.name+' · Slow time');}
}

init();
