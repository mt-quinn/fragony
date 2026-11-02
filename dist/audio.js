// Mono source effects -> occlusion EQ -> HRTF position -> category bus -> limiter.
// Distance attenuation is applied exactly once, by these editable game curves.
export const AUDIO_TUNING={
  master:.7,
  volumes:{selfWeapon:.68,enemyWeapon:.7,enemyFootstep:.95,selfFootstep:.22,explosion:.85,ui:.42,foley:.5},
  curves:{
    footstep:[[0,1],[2,1],[5,.8],[10,.38],[17,.1],[23,0]],
    weapon:[[0,1],[4,1],[12,.62],[24,.28],[42,.05],[52,0]],
    explosion:[[0,1],[5,1],[16,.6],[32,.2],[55,0]],
    foley:[[0,1],[2,1],[7,.45],[15,0]]
  },
  occlusion:{gain:.55,cutoff:1500},
  limits:{world:14,gunfire:12,steps:8,self:8,ui:7,explosions:4,total:40}
};
export function attenuation(distance,curve){
  if(distance<=curve[0][0])return curve[0][1];
  for(let i=1;i<curve.length;i++)if(distance<=curve[i][0]){const t=(distance-curve[i-1][0])/(curve[i][0]-curve[i-1][0]);return curve[i-1][1]+(curve[i][1]-curve[i-1][1])*t}
  return 0;
}
const lengths={rifle:.24,pistol:.38,smg:.14,rail:.42,rocket:.5,shotgun:.65,explosion:.85,'step-solid':.15,'step-metal':.21,'land-solid':.25,'land-metal':.3,'reload-out':.12,'reload-in':.14,bolt:.12,equip:.12,frag:.13,hit:.055,kill:.22,pickup:.25,pad:.38,shatter:.2,damage:.14,heartbeat:.34,charge:.5,'slow-on':.26,'slow-off':.22,'confirm-hit':.075,'confirm-head':.105,'confirm-kill':.24,'confirm-headkill':.28,whiz:.14,'low-ammo':.045,impact:.08,stinger:.36};
// Deterministic, original layered effects. No continuous buzz/sawtooth waveform.
export function synthesize(name,sampleRate=32000,seed=17){
  const out=new Float32Array(Math.ceil((lengths[name]||.2)*sampleRate));
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
  const noise=(start,duration,amplitude,cutoff=4000,attack=.001)=>{
    const offset=Math.floor(start*sampleRate),count=Math.min(Math.ceil(duration*sampleRate),out.length-offset),alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);let low=0;
    for(let i=0;i<count;i++){const t=i/sampleRate;low+=alpha*(rand()-low);const envelope=(1-Math.exp(-t/attack))*Math.exp(-t/duration*6);out[offset+i]+=low*envelope*amplitude}
  };
  const body=(start,duration,amplitude,f0,f1,attack=.001)=>{
    let phase=0;const offset=Math.floor(start*sampleRate),count=Math.min(Math.ceil(duration*sampleRate),out.length-offset);
    for(let i=0;i<count;i++){const t=i/sampleRate,u=t/duration;phase+=2*Math.PI*(f1+(f0-f1)*Math.exp(-u*5))/sampleRate;const env=(1-Math.exp(-t/attack))*Math.exp(-u*5);out[offset+i]+=(Math.sin(phase)+.13*Math.sin(phase*2.02))*env*amplitude}
  };
  const metallic=()=>{noise(0,.025,.8,5200);for(const [f,a]of [[820,.22],[1370,.15],[2190,.08]])body(.004,.21,a,f,f*.985,.0007)};
  const wet=()=>{noise(0,.07,1.4,1350);body(0,.065,.4,260,45,.001);noise(.012,.035,.6,3300)};
  const clack=(t,a=.4)=>{noise(t,.025,a,3300);body(t,.035,a*.3,480,170)};
  if(name.startsWith('confirm-')){noise(0,.035,.9,4100);body(0,.035,.16,1400,620);if(name.includes('kill'))metallic();if(name.includes('head'))wet()}
  else if(name==='whiz'){noise(0,.13,.55,3700,.014);body(0,.1,.12,620,210,.01)}
  else if(name==='low-ammo'){clack(0,.25)}
  else if(name==='impact'){noise(0,.055,.6,2500);body(0,.065,.25,250,90)}
  else if(name==='stinger'){body(0,.16,.32,290,285);body(.085,.18,.27,435,430);body(.17,.18,.23,580,575)}
  else if(name==='rifle'){noise(0,.047,1.8,5300);body(0,.17,.85,180,65);noise(.018,.16,.55,1600);clack(.065,.22)}
  else if(name==='pistol'){noise(0,.065,2.1,4700);body(0,.29,1.2,130,37);noise(.025,.26,.8,1000);clack(.1,.32)}
  else if(name==='smg'){noise(0,.026,1.2,4000);body(0,.085,.65,205,92);clack(.033,.15)}
  else if(name==='rail'){noise(0,.035,1.7,6500);body(0,.25,.95,160,48);body(.012,.2,.32,560,210);noise(.035,.28,.9,1900);clack(.23,.25)}
  else if(name==='rocket'){body(0,.34,1.35,95,30);noise(0,.09,1.5,2300);noise(.035,.42,1.35,1400)}
  else if(name==='shotgun'){noise(0,.09,2.9,5000);body(0,.32,1.3,140,35);noise(.03,.29,1.1,1300);clack(.28,.6);clack(.43,.8);body(.43,.09,.28,230,85)}
  else if(name==='explosion'){body(0,.65,1.65,85,24);noise(0,.17,2.6,3300);noise(.035,.72,1.6,850);noise(.11,.34,.8,2000)}
  else if(name.startsWith('step-')||name.startsWith('land-')){const metal=name.endsWith('metal'),land=name.startsWith('land');body(0,land?.21:.1,land?.85:.46,metal?155:115,metal?65:43);noise(0,land?.12:.065,land?1.3:.75,metal?3400:2200);noise(.023,.07,.35,1300);if(metal)body(.009,.17,.13,480,320)}
  else if(name==='reload-out'){clack(0,.6);noise(.025,.07,.38,1800)}
  else if(name==='reload-in'){body(0,.06,.5,240,75);clack(.004,.9);clack(.043,.35)}
  else if(name==='bolt'){clack(0,.6);clack(.04,.8);body(.04,.06,.35,210,70)}
  else if(name==='equip'||name==='frag'){clack(0,.5);noise(.02,.07,.28,1600)}
  else if(name==='hit'){noise(0,.035,.5,3200);body(0,.04,.16,900,550)}
  else if(name==='kill'){body(0,.1,.3,300,290);body(.07,.13,.24,450,440);clack(0,.18)}
  else if(name==='pickup'){body(0,.16,.28,350,345);body(.065,.18,.25,525,520)}
  else if(name==='pad'){noise(0,.28,.6,1600);body(0,.32,.4,140,350)}
  else if(name==='shatter'){clack(0,.5);clack(.035,.35);clack(.08,.25);noise(.015,.15,.4,2700)}
  else if(name==='heartbeat'){body(0,.1,.55,85,48);body(.16,.12,.35,74,42)}
  else if(name==='damage'){body(0,.13,.5,105,45);noise(0,.05,.45,1600)}
  else if(name==='charge'){noise(0,.48,.32,2100,.12);body(0,.48,.12,180,350,.14)}
  else if(name==='slow-on'||name==='slow-off'){noise(0,.18,.3,1500);body(0,.22,.28,name==='slow-on'?260:100,name==='slow-on'?80:280,.008)}
  // A tiny room slap adds size without masking the next attack or footsteps.
  if(['rifle','pistol','rail','shotgun'].includes(name)){const dry=out.slice();for(const [delay,gain]of[[.041,.12],[.077,.055]])for(let i=Math.floor(delay*sampleRate);i<out.length;i++)out[i]+=dry[i-Math.floor(delay*sampleRate)]*gain}
  let mean=0;for(const v of out)mean+=v;mean/=out.length;let peak=0;
  for(let i=0;i<out.length;i++){out[i]=Math.tanh((out[i]-mean)*1.1);peak=Math.max(peak,Math.abs(out[i]))}
  // Preserve category loudness rather than peak-normalizing footsteps to gunshots.
  const target=name.startsWith('confirm')?.68:name.startsWith('step')?.45:name.startsWith('land')?.62:['hit','kill','pickup','damage','heartbeat','shatter','charge'].includes(name)?.42:.88;
  const gain=Math.min(1.6,target/Math.max(.001,peak));const fade=Math.floor(sampleRate*.006);
  for(let i=0;i<out.length;i++)out[i]*=gain*Math.min(1,i/Math.max(1,fade*.15),(out.length-1-i)/fade);
  return out;
}
export class GameAudio{
  constructor({createContext=null,visibility=null}={}){
    this.createContext=createContext||(()=>{const Context=globalThis.AudioContext||globalThis.webkitAudioContext;return Context?new Context({latencyHint:'interactive'}):null});this.visibility=visibility;this.context=null;this.cache=new Map();this.voices=new Set();this.listener={x:0,y:0,z:0};this.muted=false;this.slow=false;this.stepIndex=0;this.feedbackIndex=0;this.levels={guns:1,steps:1,feedback:1};this.warmed=false;
  }
  unlock(){
    if(!this.context){let c;try{c=this.createContext()}catch{return}if(!c)return;this.context=c;this.master=c.createGain();this.master.gain.value=AUDIO_TUNING.master;
      const highpass=c.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=32;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=4;limiter.ratio.value=12;limiter.attack.value=.002;limiter.release.value=.13;
      this.buses={};for(const key of ['self','world','gunfire','steps','ui','explosions']){this.buses[key]=c.createGain();this.buses[key].connect(highpass)}highpass.connect(limiter);limiter.connect(this.master);this.master.connect(c.destination);this.applySettings(this.levels);
    }
    if(this.context.state==='suspended')this.context.resume()?.catch?.(()=>{});
  }
  buffer(name,variant=0){const key=name+variant;if(!this.cache.has(key)){const data=synthesize(name,this.context.sampleRate,17+variant*991),buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.cache.set(key,buffer)}return this.cache.get(key)}
  warm(){if(!this.context||this.warmed)return;this.warmed=true;for(const name of ['rifle','pistol','smg','rail','rocket','shotgun','explosion','reload-out','reload-in','bolt','impact','whiz','low-ammo','charge','stinger','slow-on','slow-off'])this.buffer(name);for(let i=0;i<4;i++)for(const name of ['confirm-hit','confirm-head','confirm-kill','confirm-headkill','step-solid','step-metal'])this.buffer(name,i)}
  applySettings(levels){this.levels={...this.levels,...levels};if(!this.context)return;for(const [bus,value]of Object.entries({self:this.levels.guns,gunfire:this.levels.guns,steps:this.levels.steps,ui:this.levels.feedback,explosions:this.levels.guns}))this.buses[bus].gain.setTargetAtTime(value,this.context.currentTime,.02)}
  duck(bus,factor=.7,duration=.1){if(!this.context)return;const t=this.context.currentTime,g=this.buses[bus].gain,base=bus==='self'||bus==='gunfire'?this.levels.guns:1;g.cancelScheduledValues(t);g.setTargetAtTime(base*factor,t,.005);g.setTargetAtTime(base,t+duration,.055)}
  confirmation(kind){this.duck('gunfire',kind.includes('kill')?.62:.84,kind.includes('kill')?.14:.06);return this.play('confirm-'+kind,{volume:kind.includes('kill')?.62:.47,bus:'ui',priority:kind.includes('kill')?9:6,variant:this.feedbackIndex++%4})}
  setMuted(muted){this.muted=muted;if(this.master)this.master.gain.setTargetAtTime(muted?0:AUDIO_TUNING.master,this.context.currentTime,.015);if(muted)this.stopWorld()}
  setSlow(slow){if(this.slow===slow)return;this.slow=slow;for(const v of this.voices)v.source.playbackRate.setTargetAtTime(v.rate*(slow?(v.bus==='self'?.92:v.bus==='ui'?1:.78):1),this.context.currentTime,.07)}
  updateListener(pos,forward){
    this.listener={x:pos.x,y:pos.y,z:pos.z};if(!this.context)return;const l=this.context.listener,c=this.context,t=c.currentTime;
    if(l.positionX){for(const k of ['X','Y','Z'])l['position'+k].setValueAtTime(pos[k.toLowerCase()],t);for(const k of ['X','Y','Z']){l['forward'+k].setValueAtTime(forward[k.toLowerCase()],t);l['up'+k].setValueAtTime(k==='Y'?1:0,t)}}else{l.setPosition(pos.x,pos.y,pos.z);l.setOrientation(forward.x,forward.y,forward.z,0,1,0)}
    // Keep remaining tails spatially correct while the listener moves/turns.
    for(const v of this.voices)if(v.pos)this.spatialGain(v);
  }
  spatialGain(v){
    const distance=Math.hypot(v.pos.x-this.listener.x,v.pos.y-this.listener.y,v.pos.z-this.listener.z),gain=attenuation(distance,AUDIO_TUNING.curves[v.curve]);
    v.gain.gain.setTargetAtTime(v.volume*gain*(1-v.occlusion*(1-AUDIO_TUNING.occlusion.gain)),this.context.currentTime,.025);
  }
  play(name,{pos=null,volume=1,curve='foley',bus='ui',priority=1,occlusion=true,variant=0,pan=0}={}){
    if(this.muted)return null;this.unlock();const c=this.context;if(!c)return null;
    const d=pos?Math.hypot(pos.x-this.listener.x,pos.y-this.listener.y,pos.z-this.listener.z):0,falloff=pos?attenuation(d,AUDIO_TUNING.curves[curve]):1;if(falloff<=.002)return null;
    const importance=priority*falloff,category=[...this.voices].filter(v=>v.bus===bus);if(category.length>=AUDIO_TUNING.limits[bus]||this.voices.size>=AUDIO_TUNING.limits.total){const pool=category.length>=AUDIO_TUNING.limits[bus]?category:[...this.voices],lowest=pool.sort((a,b)=>a.importance-b.importance||a.started-b.started)[0];if(lowest&&lowest.importance>importance)return null;if(lowest)this.stopVoice(lowest)}
    const source=c.createBufferSource(),gain=c.createGain(),filter=c.createBiquadFilter();source.buffer=this.buffer(name,variant);filter.type='lowpass';
    let obscured=0;if(pos&&occlusion&&this.visibility){let clear=0;for(const x of [-.3,0,.3])if(this.visibility(this.listener,{x:pos.x+x,y:pos.y+.12,z:pos.z}))clear++;obscured=1-clear/3}
    filter.frequency.value=Math.max(900,(obscured?AUDIO_TUNING.occlusion.cutoff:15000)/(1+d*.018));filter.Q.value=.5;
    source.connect(filter);filter.connect(gain);let panner=null;
    if(pos){panner=c.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=1;panner.rolloffFactor=0;panner.maxDistance=100;panner.coneInnerAngle=panner.coneOuterAngle=360;panner.coneOuterGain=1;
      if(panner.positionX){panner.positionX.value=pos.x;panner.positionY.value=pos.y;panner.positionZ.value=pos.z}else panner.setPosition(pos.x,pos.y,pos.z);gain.connect(panner);panner.connect(this.buses[bus]);
    }else if(pan&&c.createStereoPanner){panner=c.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(this.buses[bus])}else gain.connect(this.buses[bus]);
    const rate=1+(Math.random()-.5)*.04,voice={source,gain,filter,panner,pos:pos?{x:pos.x,y:pos.y,z:pos.z}:null,curve,bus,volume,occlusion:obscured,importance,started:c.currentTime,rate};
    gain.gain.value=volume*falloff*(1-obscured*(1-AUDIO_TUNING.occlusion.gain));source.playbackRate.value=rate*(this.slow?(bus==='self'?.92:bus==='ui'?1:.78):1);
    this.voices.add(voice);source.onended=()=>this.release(voice);source.start();return voice;
  }
  release(v){if(v.released)return;v.released=true;this.voices.delete(v);for(const n of [v.source,v.gain,v.filter,v.panner])try{n?.disconnect()}catch{}}
  stopVoice(v){try{v.gain.gain.setTargetAtTime(0,this.context.currentTime,.005);v.source.stop(this.context.currentTime+.025)}catch{}this.voices.delete(v)}
  stopWorld(){for(const v of [...this.voices])this.stopVoice(v)}
  weapon(type,{pos=null}={}){return this.play(type,{pos,volume:pos?AUDIO_TUNING.volumes.enemyWeapon:AUDIO_TUNING.volumes.selfWeapon,curve:'weapon',bus:pos?'gunfire':'self',priority:pos?2:5})}
  footstep(pos,{self=false,metal=false,landing=false}={}){
    const index=this.stepIndex++;
    if(!self&&Math.hypot(pos.x-this.listener.x,pos.z-this.listener.z)<8&&this.context){this.duck('self',.82,.1)}
    return this.play((landing?'land-':'step-')+(metal?'metal':'solid'),{pos:self?null:pos,volume:self?AUDIO_TUNING.volumes.selfFootstep:AUDIO_TUNING.volumes.enemyFootstep,curve:'footstep',bus:'steps',priority:self?.8:4,variant:index%4,pan:self?(index%2?.12:-.12):0});
  }
}
