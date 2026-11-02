import {createGameHarness} from './harness.mjs';
const {setup,run}=createGameHarness(12);setup();
run(`
mode='play';locked=true;dragLook=true;yaw=0;pitch=0;
events.get('mousemove')({movementX:30,movementY:10,clientX:300,clientY:200,buttons:0});assert.ok(yaw<0&&pitch<0,'fallback mouse aiming must work without held buttons');
const priorYaw=yaw;events.get('mousemove')({movementX:0,movementY:0,clientX:330,clientY:200,buttons:0});assert.ok(yaw<priorYaw,'absolute pointer deltas work when browser movementX is zero');
document.pointerLockElement=renderer.domElement;events.get('pointerlockchange')();assert.equal(dragLook,false);assert.equal(locked,true,'successful mouse capture must exit fallback');
let retries=0;dragLook=true;renderer.domElement.requestPointerLock=()=>{retries++};lock();assert.equal(retries,1,'resume must retry capture after fallback');
renderer.domElement.requestPointerLock=()=>{throw new Error('Not supported')};lock();assert.equal(locked,true);assert.equal(dragLook,true,'synchronous capture failure must leave aiming usable');
console.log('Controls: mouse movement works in fallback without clicking; capture recovery, retry and unsupported capture cases pass.');
`);
