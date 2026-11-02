import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MusicPlaylist,MUSIC_TRACKS,MUSIC_CROSSFADE} from '../dist/music.js';
import {GameAudio,AUDIO_TUNING} from '../dist/audio.js';

class Param{
  constructor(){this.value=0;this.events=[]}
  setValueAtTime(value,time){this.events.push({value,time,type:'set'});this.value=value}
  linearRampToValueAtTime(value,time){this.events.push({value,time,type:'ramp'});this.value=value}
  setTargetAtTime(value){this.value=value}
}
class Node{
  constructor(){for(const key of ['gain','frequency','threshold','knee','ratio','attack','release'])this[key]=new Param()}
  connect(destination){this.destination=destination}
  disconnect(){this.disconnected=true}
  start(time){this.startTime=time}
}
class Context{
  constructor(){this.currentTime=0;this.state='running';this.destination=new Node();this.sources=[]}
  createGain(){return new Node()}
  createBufferSource(){const node=new Node();this.sources.push(node);return node}
  createBiquadFilter(){return new Node()}
  createDynamicsCompressor(){return new Node()}
  async decodeAudioData(data){return {duration:new Uint8Array(data)[0]}}
}
for(const path of MUSIC_TRACKS)assert.ok(fs.statSync(new URL('../dist/'+path,import.meta.url)).size>1000000,'bundled music exists');
let loads=0;
const fetchAudio=async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([loads++?25:30]).buffer});
const context=new Context(),destination=new Node(),music=new MusicPlaylist(context,destination,{fetchAudio});
await Promise.all([music.start(),music.start()]);
assert.equal(loads,2);assert.equal(context.sources.length,2,'concurrent starts do not duplicate music');
let current=[...music.voices][0];
for(let i=0;i<12;i++){
  assert.equal(current.index,i%2,'tracks alternate through repeated loops');
  const next=current.next;
  assert.equal(next.start,current.end-MUSIC_CROSSFADE,'next track overlaps exactly four seconds');
  assert.deepEqual(current.gain.gain.events.slice(-2),[{value:1,time:next.start,type:'set'},{value:0,time:current.end,type:'ramp'}]);
  assert.deepEqual(next.gain.gain.events.slice(0,2),[{value:0,time:next.start,type:'set'},{value:1,time:current.end,type:'ramp'}]);
  context.currentTime=current.end;current.source.onended();
  assert.ok(current.source.disconnected&&current.gain.disconnected,'finished sources released');
  assert.equal(music.voices.size,2,'only playing and upcoming tracks retained');
  current=next;
}
await music.start();assert.equal(loads,2,'round restarts reuse loaded playlist');
let attempts=0;
const retry=new MusicPlaylist(new Context(),destination,{fetchAudio:async()=>{if(!attempts++)throw Error('offline');return {ok:true,arrayBuffer:async()=>new Uint8Array([20]).buffer}}});
await assert.rejects(retry.start(),/offline/);await retry.start();assert.ok(retry.started,'failed loading can retry');
const mix=new GameAudio({createContext:()=>new Context()});mix.unlock();
mix.applySettings({music:.35});assert.equal(mix.musicGain.gain.value,AUDIO_TUNING.music*.35);
mix.musicRequested=true;let restarts=0;mix.music={start:async()=>{restarts++}};
mix.setMuted(true);assert.equal(mix.master.gain.value,0);mix.setMuted(false);assert.equal(restarts,1);
mix.stopWorld();mix.setSlow(true);assert.equal(mix.musicGain.gain.value,AUDIO_TUNING.music*.35,'effects cleanup and slow motion leave music alone');
console.log('Music: bundled tracks, shared loading, four-second crossfades, repeated alternation, source cleanup, load retry, independent volume and mute pass.');
