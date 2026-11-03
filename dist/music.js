export const MUSIC_TRACKS=['./assets/music/horizon-in-fire.mp3','./assets/music/elementary.mp3'];
export const MUSIC_CROSSFADE=4;

// Schedule against the audio clock so transitions survive frame drops and menus.
// Keep music separate from positional effects, slow motion, and round cleanup.
export class MusicPlaylist{
  constructor(context,destination,{fetchAudio=(...args)=>globalThis.fetch(...args),tracks=MUSIC_TRACKS}={}){
    this.context=context;this.destination=destination;this.fetchAudio=fetchAudio;this.tracks=tracks;
    this.buffers=null;this.loading=null;this.started=false;this.disposed=false;this.voices=new Set();
  }
  async start(){
    if(this.started||this.disposed)return;
    if(!this.loading)this.loading=Promise.all(this.tracks.map(async url=>{
      const response=await this.fetchAudio(url);
      if(!response.ok)throw new Error(`Music could not load: ${url} (${response.status})`);
      return this.context.decodeAudioData(await response.arrayBuffer());
    })).catch(error=>{this.loading=null;throw error});
    const buffers=await this.loading;
    if(this.started||this.disposed)return;
    this.buffers=buffers;this.started=true;
    // Both tracks are decoded before playback, avoiding a network gap at handoff.
    this.overlap=Math.min(MUSIC_CROSSFADE,...buffers.map(b=>b.duration/3));
    const first=this.schedule(0,this.context.currentTime+.05,true);
    this.queueAfter(first);
  }
  dispose(){
    this.disposed=true;this.started=false;
    for(const {source,gain}of this.voices){source.onended=null;try{source.stop?.()}catch{}source.disconnect();gain.disconnect()}
    this.voices.clear();this.buffers=null;
  }
  schedule(index,start,first=false){
    const c=this.context,source=c.createBufferSource(),gain=c.createGain(),buffer=this.buffers[index];
    const end=start+buffer.duration,fade=this.overlap;
    source.buffer=buffer;source.connect(gain);gain.connect(this.destination);
    // Complementary linear fades maintain steady combined gain through overlap.
    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(1,start+(first?1:fade));
    gain.gain.setValueAtTime(1,end-fade);
    gain.gain.linearRampToValueAtTime(0,end);
    const voice={source,gain,index,start,end};this.voices.add(voice);
    source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice);if(this.started)this.queueAfter(voice.next)};
    source.start(start);return voice;
  }
  queueAfter(voice){
    voice.next=this.schedule((voice.index+1)%this.buffers.length,Math.max(this.context.currentTime,voice.end-this.overlap));
  }
}
