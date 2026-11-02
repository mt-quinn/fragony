import assert from 'node:assert/strict';
import { AUDIO_TUNING, attenuation, synthesize, GameAudio } from '../dist/audio.js';
for(const curve of Object.values(AUDIO_TUNING.curves)){let prior=Infinity;for(let d=0;d<70;d+=.1){const value=attenuation(d,curve);assert.ok(value>=0&&value<=1&&value<=prior+1e-8);prior=value}assert.equal(attenuation(100,curve),0)}
const hashes=new Set();
for(const name of ['rifle','pistol','smg','rail','rocket','shotgun','step-solid','step-metal','explosion','confirm-hit','confirm-head','confirm-kill','confirm-headkill','whiz','impact','low-ammo','stinger','heartbeat']){
 const a=synthesize(name);let peak=0,power=0,hash=0;for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));peak=Math.max(peak,Math.abs(a[i]));power+=a[i]*a[i];if(i%32===0)hash+=a[i]*i}
 assert.ok(peak>.05&&peak<=.9);assert.equal(Math.abs(a[0]),0);assert.equal(Math.abs(a.at(-1)),0);assert.ok(power/a.length>.00001);hashes.add(hash.toFixed(4));
}assert.equal(hashes.size,18,'all effects differ');
class Param{constructor(){this.value=0}setValueAtTime(v){this.value=v}setTargetAtTime(v){this.value=v}cancelScheduledValues(){}}
class Node{constructor(){this.connections=[];for(const k of ['gain','frequency','Q','threshold','knee','ratio','attack','release','playbackRate','positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ','pan'])this[k]=new Param()}connect(n){this.connections.push(n);return n}disconnect(){this.connections=[]}start(){}stop(){this.onended?.()}}
class Context{constructor(){this.currentTime=0;this.sampleRate=32000;this.state='running';this.destination=new Node();this.listener=new Node()}createGain(){return new Node()}createBiquadFilter(){return new Node()}createDynamicsCompressor(){return new Node()}createPanner(){return new Node()}createStereoPanner(){return new Node()}createBufferSource(){return new Node()}createBuffer(channels,length){assert.equal(channels,1,'positional samples must be mono');return{length,copyToChannel(){}}}resume(){return Promise.resolve()}}
const audio=new GameAudio({createContext:()=>new Context(),visibility:()=>true});audio.unlock();audio.updateListener({x:0,y:1.7,z:0},{x:0,y:0,z:-1});
const clear=audio.footstep({x:-4,y:.2,z:-3});assert.equal(clear.panner.panningModel,'HRTF');assert.equal(clear.panner.positionX.value,-4);assert.equal(clear.panner.rolloffFactor,0,'do not apply distance falloff twice');assert.equal(clear.panner.coneOuterGain,1,'rear sources remain audible');assert.ok(clear.gain.gain.value>0);
audio.visibility=()=>false;const blocked=audio.footstep({x:-4,y:.2,z:-3});assert.ok(blocked.gain.gain.value<clear.gain.gain.value);assert.ok(blocked.filter.frequency.value<clear.filter.frequency.value);
assert.equal(audio.footstep({x:30,y:0,z:0}),null,'out-of-range footsteps are culled');
audio.updateListener({x:5,y:2,z:1},{x:1,y:0,z:0});assert.equal(audio.context.listener.positionX.value,5);assert.equal(audio.context.listener.forwardX.value,1);
for(let i=0;i<40;i++)audio.play('rifle',{bus:'world',priority:.1});assert.ok([...audio.voices].filter(v=>v.bus==='world').length<=AUDIO_TUNING.limits.world);
const close=audio.footstep({x:5,y:1.5,z:2});assert.ok(close,'nearby step survives distant gun clutter');audio.setMuted(true);assert.equal(audio.voices.size,0);assert.equal(audio.play('rifle'),null);
console.log('Audio: finite click-free mono effects, monotonic falloff and hard culling, HRTF direction, no rear-volume cone, single attenuation pass, wall filtering, camera listener, priority limits and mute cleanup pass.');

const mix=new GameAudio({createContext:()=>new Context()});mix.unlock();mix.applySettings({guns:.4,steps:.7,feedback:.9});assert.equal(mix.buses.gunfire.gain.value,.4);assert.equal(mix.buses.steps.gain.value,.7);mix.confirmation('headkill');assert.equal(mix.buses.steps.gain.value,.7);assert.ok([...mix.voices].some(v=>v.bus==='ui'&&v.importance>=9));mix.warm();assert.ok(mix.warmed);
