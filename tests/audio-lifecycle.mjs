import assert from 'node:assert/strict';
import {GameAudio,AUDIO_TUNING} from '../dist/audio.js';
import {MusicPlaylist} from '../dist/music.js';
class Events{
 constructor(){this.listeners=new Map()}
 addEventListener(type,fn,options){const list=this.listeners.get(type)||[];list.push({fn,options});this.listeners.set(type,list)}
 emit(type,event={isTrusted:true}){for(const {fn}of this.listeners.get(type)||[])fn(event)}
}
class Param{constructor(){this.value=0}setValueAtTime(v){this.value=v}setTargetAtTime(v){this.value=v}linearRampToValueAtTime(v){this.value=v}cancelScheduledValues(){}}
class Node{
 constructor(){for(const key of ['gain','frequency','Q','threshold','knee','ratio','attack','release','playbackRate'])this[key]=new Param()}
 connect(){}disconnect(){this.disconnected=true}start(){this.started=true}stop(){this.stopped=true;this.onended?.()}
}
let type='auto',writes=0,created=0;
const session={get type(){return type},set type(value){type=value;writes++}};
const priorNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{audioSession:session}});
class Context extends Events{
 constructor(){super();assert.equal(type,'ambient','mixing must be configured before context creation');created++;this.state='suspended';this.currentTime=0;this.sampleRate=44100;this.destination=new Node();this.sources=[];this.resumeCalls=0;this.reject=false;this.pending=false}
 createGain(){return new Node()}createBiquadFilter(){return new Node()}createDynamicsCompressor(){return new Node()}
 createBufferSource(){const n=new Node();this.sources.push(n);return n}createBuffer(){return{copyToChannel(){}}}
 resume(){this.resumeCalls++;if(this.pending)return new Promise(()=>{});if(this.reject)return Promise.reject(Error('gesture required'));this.state='running';return Promise.resolve()}
}
try{
 const doc=new Events(),win=new Events();doc.hidden=false;
 const audio=new GameAudio({createContext:()=>new Context()});
 audio.bindLifecycle(doc,win);audio.bindLifecycle(doc,win);
 assert.equal(created,0,'page load does not acquire audio before interaction');assert.equal(type,'ambient');assert.equal(doc.listeners.get('pointerdown').length,1,'bindings are installed once');
 assert.equal(doc.listeners.get('touchend')[0].options.capture,true,'touch-end recovery precedes prevented touch handlers');
 doc.emit('pointerdown');await Promise.resolve();const context=audio.context;
 assert.equal(context.state,'running');assert.equal(context.sources.length,1);assert.equal(context.sources[0].buffer!==null,true,'prime the destination in the gesture');
 for(let i=0;i<10;i++){doc.emit('pointerdown');doc.emit('touchend');}assert.equal(created,1);assert.equal(context.sources.length,1,'running context is retained without repeated silent sources');assert.equal(writes,1,'do not churn audio session category');
 doc.hidden=true;doc.emit('visibilitychange');assert.equal(audio.master.gain.value,0);assert.equal(audio.play('rifle'),null,'background effects never build a backlog');
 context.state='interrupted';context.emit('statechange');doc.hidden=false;doc.emit('visibilitychange');await Promise.resolve();assert.equal(context.state,'running');assert.equal(audio.context,context);assert.equal(audio.master.gain.value,AUDIO_TUNING.master);
 context.state='interrupted';context.emit('statechange');context.reject=true;doc.emit('touchend');await Promise.resolve();assert.equal(audio.resumePending,null,'rejected resume can retry');assert.equal(audio.play('rifle'),null,'blocked context never queues shots');
 context.reject=false;doc.emit('touchend');await Promise.resolve();assert.equal(context.state,'running');assert.equal(created,1);
 context.state='suspended';context.pending=true;audio.unlock();const before=context.resumeCalls;audio.unlock();assert.equal(context.resumeCalls,before,'ordinary sound requests share pending resume');context.pending=false;doc.emit('touchend');await Promise.resolve();assert.equal(context.resumeCalls,before+1,'fresh gesture retries even while earlier resume is unresolved');assert.equal(context.state,'running');
 let disposed=0,musicStarts=0;audio.musicRequested=true;audio.music={dispose(){disposed++},start:async()=>{musicStarts++}};
 audio.startMusic=()=>musicStarts++;
 context.state='closed';doc.emit('pointerdown');await Promise.resolve();assert.equal(created,2);assert.notEqual(audio.context,context);assert.equal(disposed,1);assert.ok(musicStarts>0,'music intent survives context replacement');assert.equal(audio.context.state,'running');
 audio.setMuted(true);win.emit('pagehide');win.emit('pageshow');assert.equal(audio.master.gain.value,0,'foreground recovery respects mute');
 audio.setMuted(false);assert.equal(audio.master.gain.value,AUDIO_TUNING.master);
 const pendingContext=new Context();pendingContext.state='running';let release;
 const playlist=new MusicPlaylist(pendingContext,new Node(),{tracks:['test'],fetchAudio:()=>new Promise(resolve=>release=resolve)});
 pendingContext.decodeAudioData=async()=>({duration:20});const start=playlist.start();playlist.dispose();release({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await start;assert.equal(pendingContext.sources.length,0,'late music load cannot revive a disposed context');
 const live=new MusicPlaylist(pendingContext,new Node(),{tracks:['test'],fetchAudio:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});await live.start();const sources=[...live.voices];live.dispose();assert.equal(live.voices.size,0);assert.ok(sources.every(v=>v.source.stopped&&v.source.disconnected&&v.gain.disconnected&&!v.source.onended));
 // Missing or rejected Audio Session API must leave normal Web Audio functional.
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{get audioSession(){throw Error('unsupported')}}});audio.configureSession();
 console.log('Audio lifecycle: ambient mixing before acquisition, one shared context, repeated gesture unlock, interruptions/rejected/pending resumes, foreground/mute, closed-context/music recovery and async playlist disposal pass.');
}finally{if(priorNavigator)Object.defineProperty(globalThis,'navigator',priorNavigator);else delete globalThis.navigator;}
