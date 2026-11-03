import assert from 'node:assert/strict';
import {AutoFire,TouchState,mobileSettings,presetLayout,normalizeLayout,controlRect,stickVector,touchLook,MOBILE_QUALITY,AUTO_FIRE} from '../dist/mobile-core.js';
import {nearbyAutoTarget} from '../dist/mobile-targeting.js';
import * as THREE from '../dist/vendor/three.module.js';
import {createGameHarness} from './harness.mjs';
const auto=new AutoFire(),frame={target:'bot:1',weapon:'rifle',distance:8};
for(let i=0;i<3;i++)assert.equal(auto.step(1/60,frame),false);
assert.equal(auto.step(1/60,frame),true,'acquisition precedes automatic fire');
assert.equal(auto.step(1/60,{...frame,target:'bot:2'}),false,'new targets reacquire');
assert.equal(auto.step(.05,{...frame,blocked:true}),false);assert.equal(auto.progress,0);
for(let i=0;i<5;i++)auto.step(.05,frame);
assert.equal(auto.step(.02,{...frame,target:null}),false,'target loss immediately releases fire');
assert.ok(auto.progress>0&&auto.progress<1,'lost aim drains instead of resetting');const retained=auto.progress;assert.equal(auto.phase,'draining');
auto.step(1/120,frame);assert.ok(auto.progress>retained,'same target resumes retained progress');
for(let i=0;i<4;i++)auto.step(.05,{...frame,target:null});assert.equal(auto.progress,0);assert.equal(auto.target,null,'full charge drains within 180 ms');
for(let i=0;i<20;i++)auto.step(.05,{...frame,onTarget:false});assert.equal(auto.progress,1);auto.step(.02,{...frame,target:null});assert.ok(auto.progress<1,'holding a target never banks excess acquisition');
assert.equal(auto.step(.02,{...frame,onTarget:false}),false,'padding charges without expanding real shot eligibility');assert.equal(auto.step(.05,frame),true,'actual crosshair can fire immediately from a precharged margin');
assert.equal(auto.step(.05,{...frame,distance:85,ads:false,limitHipRange:true}),true,'distant hip fire has no range gate, even with a legacy saved limiter');
for(let i=0;i<4;i++)auto.step(.05,{...frame,distance:40,ads:true});assert.equal(auto.phase,'firing','ADS remains optional for distant auto-fire');
assert.equal(auto.step(.05,{...frame,weapon:'rocket'}),false,'explosives require intentional manual fire');
auto.reset();auto.step(2,frame);assert.ok(auto.progress<1,'tab stalls cannot skip acquisition');
const oldAcquire={rifle:.12,pistol:.16,smg:.09,rail:.24,rocket:.2,shotgun:.15};
for(const [weapon,prior]of Object.entries(oldAcquire)){assert.ok(AUTO_FIRE[weapon].acquire<=prior/2,weapon+' acquisition is at least halved');if(weapon==='rocket')continue;for(const ads of [false,true]){const tracker=new AutoFire(),target={target:'distant:1',weapon,ads,distance:85,limitHipRange:true},frames=Math.ceil(AUTO_FIRE[weapon].acquire/.001);for(let i=0;i<frames-1;i++)assert.equal(tracker.step(.001,target),false,weapon+' does not fire before acquisition');assert.equal(tracker.step(.001001,target),true,weapon+' fires at half its prior delay at long range');assert.equal(tracker.step(.001,{...target,blocked:true}),false,'cover still cancels fire');}}
assert.equal(mobileSettings({limitHipRange:true}).limitHipRange,undefined,'retired saved range setting cannot re-enable the limit');
const state=new TouchState();assert.ok(state.begin(1,'stick',80,220));assert.ok(state.begin(2,'look',500,180));assert.ok(state.begin(3,'ads',700,100));assert.equal(state.begin(4,'stick',100,240),false);
state.moveContact(1,80,172);assert.equal(state.move.magnitude,1);assert.equal(state.moveContact(2,40,210).role,'look','crossing the joystick never changes ownership');
state.end(2);assert.equal(state.move.magnitude,1);state.clear();assert.equal(state.contacts.size,0);assert.equal(state.move.magnitude,0);assert.equal(state.held.size,0);
assert.equal(stickVector(2,1).magnitude,0);assert.ok(stickVector(20,0).magnitude<1);
const settings=mobileSettings({sensitivity:Infinity,quality:'ultra',fov:900,adsMode:'hold'});assert.equal(settings.fov,95);assert.equal(settings.quality,'balanced');assert.equal(settings.adsMode,'hold');
const layout=normalizeLayout({stick:{x:-9,y:9,hidden:true},fire:{scale:.01}});assert.equal(layout.stick.hidden,false);assert.equal(layout.stick.x,0);assert.equal(layout.stick.y,1);
for(const preset of ['thumbs','claw','left'])for(const id of Object.keys(layout)){
 const r=controlRect(id,presetLayout(preset),{x:52,y:8,w:564,h:304},.7);assert.ok(r.width>=44);assert.ok(r.x-r.width/2>=52&&r.x+r.width/2<=616);assert.ok(r.y-r.height/2>=8&&r.y+r.height/2<=312);
}
const normal=touchLook(100,10,844,settings),aimed=touchLook(100,10,844,settings,{ads:true});assert.ok(Math.abs(aimed.yaw)<Math.abs(normal.yaw));assert.ok(MOBILE_QUALITY.battery.pixels<MOBILE_QUALITY.high.pixels);
const h=createGameHarness(32);h.setup();h.context.TouchState=TouchState;h.context.AutoFire=AutoFire;h.context.nearbyAutoTarget=nearbyAutoTarget;
h.run(`
mode='play';locked=true;respawnTime=0;reloading=0;shotTimer=0;equipped=0;yaw=0;pitch=0;playerPos.set(0,1.7,0);recoil=0;recoilX=0;bots=[];worldMeshes=[];
const touchState=new TouchState(),triggerState=new AutoFire();
mobile={enabled:true,active:true,state:touchState,settings:{aimAssist:false},crouch:false,auto:triggerState,trigger(dt,target,distance,blocked){return this.state.held.has('fire')||this.auto.step(dt,{target,distance,blocked,weapon:'rifle',ads:this.state.ads})}};
const dummy={name:'target',lifeId:1,hp:100,dead:0},proxy=new THREE.Mesh(new THREE.BoxGeometry(2,3,1),new THREE.MeshBasicMaterial());proxy.position.set(0,1.7,-8);proxy.userData.bot=dummy;scene.add(proxy);worldMeshes.push(proxy);scene.updateMatrixWorld(true);
for(let i=0;i<12;i++)syncTouchInputs(1/60);assert.equal(mouseDown,true,'native sensor acquires visible live actor');assert.ok(keys.has('MouseLeft'));
proxy.position.z=-60;proxy.updateMatrixWorld(true);triggerState.reset();mobileTargetClock=0;for(let i=0;i<3;i++){syncTouchInputs(1/60);assert.equal(mouseDown,false);}syncTouchInputs(1/60);assert.equal(mouseDown,true,'real distant hip-fire sensor reaches the halved acquisition threshold without ADS');proxy.position.z=-8;proxy.updateMatrixWorld(true);mobileTargetClock=0;
const wall=new THREE.Mesh(new THREE.BoxGeometry(3,4,.5),new THREE.MeshBasicMaterial());wall.position.set(0,1.7,-4);scene.add(wall);worldMeshes.push(wall);scene.updateMatrixWorld(true);mobileTargetClock=0;syncTouchInputs(1/60);assert.equal(mouseDown,false,'cover cancels automatic fire');
worldMeshes.pop();scene.remove(wall);dummy.dead=1;mobileTargetClock=0;syncTouchInputs(1/60);assert.equal(mouseDown,false,'corpses cannot acquire');dummy.dead=0;
touchState.ads=true;syncTouchInputs(1/60);assert.ok(keys.has('MouseRight'));touchState.held.add('fire');syncTouchInputs(1/60);assert.equal(keys.has('MouseRight'),false,'manual button is hip fire');assert.equal(mouseDown,true);
touchState.held.clear();touchState.focus=true;mobile.crouch=true;syncTouchInputs(1/60);assert.ok(keys.has('KeyQ')&&keys.has('KeyC'));assert.equal(keys.has('ShiftLeft'),false,'sprint action is removed');touchState.ads=false;mobile.crouch=false;worldMeshes=[];mobileTargetClock=0;syncTouchInputs(1/60);assert.ok(!keys.has('ShiftLeft'),'full forward stick never sprints');
reloading=1;syncTouchInputs(1/60);assert.equal(mouseDown,false,'reload resets acquisition');reloading=0;mobile.active=false;syncTouchInputs(1/60);assert.equal(keys.size,0);assert.equal(mouseDown,false,'suspended touch state cannot fire or move');
`);
console.log('Mobile: acquisition, loss, cover, corpses, range, weapon exceptions, manual hip fire, ADS, multi-pointer ownership, cancellation, layout bounds, tuning and native input integration pass.');
// Exercise the actual browser controller's event handlers with concurrent contacts.
const {MobileController}=await import('../dist/mobile.js');
const attrs=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},querySelector:()=>({style:{}})});
const buttons=Object.fromEntries(Object.keys(presetLayout()).map(id=>[id,attrs()]));
const actions=[],controller=Object.create(MobileController.prototype);
Object.assign(controller,{state:new TouchState(),auto:new AutoFire(),settings:mobileSettings(),active:true,buttons,controls:{setPointerCapture(){}},nodes:{'touch-feedback':{textContent:''}},api:{read:()=>({type:'rifle'}),action:(...a)=>actions.push(a),look:(...a)=>actions.push(['look',...a]),clear(){}},layouts:{},requestWake(){},applyLayout(){}});
Object.defineProperties(controller,{area:{value:{x:8,y:8,w:828,h:374}},layout:{value:presetLayout()}});
globalThis.innerWidth=844;globalThis.innerHeight=390;
const event=(pointerId,role,x,y)=>({pointerId,clientX:x,clientY:y,preventDefault(){},target:{closest:selector=>selector==='[data-control]'&&role?{dataset:{control:role}}:null}});
controller.down(event(10,'stick',110,280));controller.down(event(11,null,530,160));controller.move(event(10,null,110,225));controller.move(event(11,null,560,160));
assert.equal(controller.state.move.magnitude,1);assert.equal(controller.state.sprinting,undefined);assert.deepEqual(actions.at(-1),['look',30,0]);
controller.down(event(12,'ads',710,125));controller.up(event(12,'ads',710,125));assert.equal(controller.state.ads,true);assert.equal(controller.state.contacts.size,2);
controller.down(event(13,'fire',650,220));assert.ok(controller.state.held.has('fire'));controller.up(event(13,'fire',650,220),true);assert.ok(!controller.state.held.has('fire'));assert.equal(controller.state.ads,true);
controller.down(event(14,'grenade',580,300));controller.move(event(14,null,580,20));controller.up(event(14,null,580,20));assert.ok(!actions.some(a=>a[0]==='grenade'),'cancel zone suppresses grenade release');
controller.down(event(15,'grenade',580,300));controller.clear();assert.equal(controller.preparing,false);assert.equal(controller.nodes['touch-feedback'].textContent,'');assert.equal(controller.state.contacts.size,0);assert.equal(controller.state.move.magnitude,0);
controller.settings.adsMode='hold';controller.down(event(16,'ads',710,125));controller.up(event(16,'ads',710,125),true);assert.equal(controller.state.ads,false);
delete globalThis.innerWidth;delete globalThis.innerHeight;
console.log('Controller: simultaneous movement/look/ADS/fire, fixed finger ownership, grenade cancellation and interrupted gesture cleanup pass.');
h.run(`
localStorage.setItem('dh-run','existing-run');mobile.practice=true;saveRun();assert.equal(localStorage.getItem('dh-run'),'existing-run','practice cannot replace saved progression');health=100;damagePlayer(90,null);assert.equal(health,100,'practice ignores incoming damage');time=2;mobile.active=false;updateStep(1/120);assert.equal(time,90,'practice never runs out of time');assert.equal(localStorage.getItem('dh-run'),'existing-run');
`);
console.log('Practice: saved progression, invulnerability and unlimited round time pass.');
// The padded region follows the hitbox's transform, but does not change shot geometry.
const body=new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.4),new THREE.MeshBasicMaterial());
const actor={name:'edge',lifeId:1,hp:100,dead:0};body.userData.bot=actor;body.position.set(.33,1.7,-8);body.updateMatrixWorld(true);
const aimRay=new THREE.Raycaster(new THREE.Vector3(0,1.7,0),new THREE.Vector3(0,0,-1),0,90);
assert.equal(aimRay.intersectObject(body).length,0,'original hitbox is outside crosshair');assert.equal(nearbyAutoTarget(aimRay,[body],[])?.bot,actor,'three cm near miss starts acquisition');
body.position.x=.38;body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(aimRay,[body],[]),null,'eight cm near miss stays outside the small margin');
body.scale.set(2,.75,1);body.position.x=.63;body.updateMatrixWorld(true);assert.ok(nearbyAutoTarget(aimRay,[body],[]),'padding stays in world units under scaling');
body.position.x=.68;body.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(aimRay,[body],[]),null,'scaling cannot double the world margin');
body.scale.set(1,1,1);body.rotation.y=Math.PI/2;body.position.x=.23;body.updateMatrixWorld(true);assert.ok(nearbyAutoTarget(aimRay,[body],[]),'rotated hitbox acquires a tiny near miss');
const cover=new THREE.Mesh(new THREE.BoxGeometry(2,4,.5),new THREE.MeshBasicMaterial());cover.position.set(0,1.7,-4);cover.updateMatrixWorld(true);assert.equal(nearbyAutoTarget(aimRay,[body],[cover]),null,'padding never acquires through cover');
actor.dead=1;assert.equal(nearbyAutoTarget(aimRay,[body],[]),null,'dead hitboxes do not start acquisition');actor.dead=0;actor.hp=0;assert.equal(nearbyAutoTarget(aimRay,[body],[]),null);
h.run(`
mobile.active=true;mobile.practice=false;mobile.settings.aimAssist=false;touchState.clear();triggerState.reset();reloading=shotTimer=0;mobile.crouch=false;mobileTargetClock=0;playerPos.set(0,1.7,0);yaw=pitch=recoil=recoilX=0;
mobile.trigger=function(dt,target,distance,blocked,onTarget){return this.auto.step(dt,{target,distance,blocked,onTarget,weapon:'rifle'})};
dummy.dead=0;dummy.pos=proxy.position;dummy.parts={body:proxy};bots=[dummy];worldMeshes=[];proxy.position.set(1.03,1.7,-8);scene.updateMatrixWorld(true);
for(let i=0;i<12;i++)syncTouchInputs(1/60);assert.equal(triggerState.progress,1,'native padded sensor starts and completes the timer');assert.equal(mouseDown,false,'near miss prepares the trigger without altering real hit requirements');
proxy.position.x=0;scene.updateMatrixWorld(true);mobileTargetClock=0;syncTouchInputs(1/60);assert.equal(mouseDown,true,'crosshair entry fires immediately from retained charge');
worldMeshes=[wall];scene.add(wall);scene.updateMatrixWorld(true);mobileTargetClock=0;syncTouchInputs(1/60);assert.equal(mouseDown,false);assert.equal(triggerState.phase,'draining');assert.ok(triggerState.progress>0,'occlusion immediately prevents shots while charge drains');
`);
console.log('Acquisition margin: near misses, distance cutoff, rotated/scaled hitboxes, cover/corpses and native precharge/real-hit/drain integration pass.');

controller.api.read=()=>({type:'rocket',chargeWeapon:true});globalThis.innerWidth=844;globalThis.innerHeight=390;controller.down(event(25,'fire',650,220));controller.move(event(25,null,650,20));controller.up(event(25,null,650,20));assert.ok(actions.some(a=>a[0]==='cancelCharge'),'dragging a charged launcher to the top cancels launch');delete globalThis.innerWidth;delete globalThis.innerHeight;
