export const BENCHMARK_SCENES=['reservoir','killhouse','shoothouse'].flatMap(map=>[{map,view:0,name:'Crossfire',heavy:false},{map,view:1,name:'Explosions',heavy:true}]);
export function frameStatistics(intervals){
 const sorted=intervals.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);if(!sorted.length)throw Error('No frames were sampled.');
 const mean=sorted.reduce((a,b)=>a+b,0)/sorted.length,quantile=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)];
 const slow=sorted.slice(-Math.max(1,Math.ceil(sorted.length*.01)));
 return {frames:sorted.length,durationMs:sorted.reduce((a,b)=>a+b,0),averageFPS:1000/mean,medianMs:quantile(.5),p95Ms:quantile(.95),p99Ms:quantile(.99),low1FPS:1000/(slow.reduce((a,b)=>a+b,0)/slow.length),over33ms:sorted.filter(v=>v>1000/30).length};
}
export class BenchmarkRunner{
 constructor(api,{warmup=3000,sample=4000,scenes=BENCHMARK_SCENES}={}){this.api=api;this.warmup=warmup;this.sample=sample;this.scenes=scenes;this.results=[];this.index=-1;this.loading=true;this.done=false;}
 async next(){
  this.loading=true;this.index++;
  if(this.index===this.scenes.length){this.done=true;this.api.complete(this.results);return;}
  const scene=this.scenes[this.index];this.api.progress({phase:'loading',index:this.index,total:this.scenes.length,scene});
  try{await this.api.prepare(scene,this.index);this.start=null;this.last=null;this.samples=[];this.baseline=null;this.loading=false;}
  catch(error){this.done=true;this.api.error(error.message||String(error));}
 }
 frame(now){
  if(this.loading||this.done)return false;
  if(this.start===null)this.start=now;const elapsed=now-this.start;
  if(this.last!==null&&this.last-this.start>=this.warmup)this.samples.push(now-this.last);
  this.last=now;
  if(elapsed>=this.warmup&&!this.baseline)this.baseline=this.api.metrics?.()||{};
  if(elapsed>=this.warmup+this.sample){
   const metrics=this.api.metrics?.()||{},scene=this.scenes[this.index];
   this.results.push({...scene,...frameStatistics(this.samples),shots:(metrics.shots||0)-(this.baseline?.shots||0),peakEffects:this.peakEffects||0});this.peakEffects=0;this.next();return false;
  }
  this.peakEffects=Math.max(this.peakEffects||0,this.api.metrics?.().effects||0);
  this.api.stage(this.scenes[this.index],elapsed/1000);
  this.api.progress({phase:elapsed<this.warmup?'warming':'sampling',index:this.index,total:this.scenes.length,scene:this.scenes[this.index],progress:Math.min(1,elapsed/(this.warmup+this.sample))});
  return true;
 }
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function benchmarkReportHTML(report){
 const rows=report.results||[],frames=rows.reduce((n,r)=>n+r.frames,0),duration=rows.reduce((n,r)=>n+r.durationMs,0);
 return `<section class="benchmark-report"><small>GRAPHICS BENCHMARK / ${escape(new Date(report.date).toLocaleString())}</small><h3>${duration?Math.round(frames*1000/duration):'—'} <span>AVERAGE FPS</span></h3><p>${escape(report.summary)}<br>Resolution ${Math.round(report.settings.resolutionScale*100)}% · Shadows ${escape(report.settings.shadowQuality)} · Contact shading ${escape(report.settings.aoQuality)} · Bloom ${Math.round(report.settings.bloomStrength*100)}%<br>Brightness ${Math.round(report.settings.exposure*100)}% · Tone mapping ${escape(report.settings.toneMap)} · Field of view ${report.settings.fov}°</p><div class="benchmark-table-wrap"><table><thead><tr><th>Map / scene</th><th>Avg FPS</th><th>1% low</th><th>Median</th><th>95th</th><th>99th</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${escape(r.mapName||r.map)}<small>${escape(r.name)} · ${r.shots} rounds · ${r.peakEffects} peak effects</small></th><td>${r.averageFPS.toFixed(1)}</td><td>${r.low1FPS.toFixed(1)}</td><td>${r.medianMs.toFixed(1)} ms</td><td>${r.p95Ms.toFixed(1)} ms</td><td>${r.p99Ms.toFixed(1)} ms</td></tr>`).join('')}</tbody></table></div><p class="benchmark-note">Lower frame times are better. The 95th/99th columns show slower frames. Loading and warm-up are excluded. Results include browser scheduling and may be limited by display refresh rate. Keep orientation and window size unchanged; compare runs on the same device.</p></section>`;
}

// The live game stays paused underneath an isolated, full-size benchmark game.
export function openBenchmark({settings,summary,onClose}){
 const previous=document.activeElement,root=document.createElement('div');root.className='benchmark-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Graphics benchmark');
 root.innerHTML='<iframe title="Benchmark gameplay" tabindex="-1"></iframe><header><div><strong>GRAPHICS BENCHMARK</strong><output aria-live="polite">Preparing…</output></div><button type="button">CANCEL</button></header><div class="benchmark-results" hidden></div>';
 document.body.append(root);const iframe=root.querySelector('iframe'),status=root.querySelector('output'),button=root.querySelector('button'),results=root.querySelector('.benchmark-results');
 const token=crypto.randomUUID(),url=new URL(location.href);url.searchParams.set('benchmark',token);url.searchParams.delete('practice');
 let finished=false,lastMessage=performance.now();
 const close=()=>{clearInterval(watchdog);window.removeEventListener('message',receive);document.removeEventListener('keydown',keys,true);document.removeEventListener('visibilitychange',visibility);root.remove();onClose?.();previous?.focus?.();};
 const failure=message=>{if(finished)return;finished=true;iframe.remove();status.textContent=message;button.textContent='CLOSE';};
 const receive=event=>{
  if(event.source!==iframe.contentWindow||event.origin!==location.origin||event.data?.token!==token)return;lastMessage=performance.now();const data=event.data;
  if(data.type==='progress'){const p=data.progress;status.textContent=`${p.index+1} / ${p.total} · ${p.scene.map.toUpperCase()} · ${p.scene.name} · ${p.phase==='loading'?'Loading map':p.phase==='warming'?'Warming up':'Sampling '+Math.round((p.progress||0)*100)+'%'}`;}
  if(data.type==='error')failure(data.message);
  if(data.type==='complete'){
   finished=true;const report={date:new Date().toISOString(),settings:{...settings},summary,...data.report};
   try{localStorage.setItem('dh-graphics-benchmark',JSON.stringify(report));}catch{}
   iframe.remove();status.textContent='COMPLETE · Results saved on this device';button.textContent='BACK TO GRAPHICS';results.hidden=false;results.innerHTML=benchmarkReportHTML(report)+'<button class="benchmark-download" type="button">DOWNLOAD REPORT</button>';
   results.querySelector('button').onclick=()=>{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='fragony-graphics-benchmark.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);};
  }
 };
 const keys=event=>{if(event.key==='Escape'){event.stopImmediatePropagation();event.preventDefault();close();}else if(event.key==='Tab'){const focusable=[...root.querySelectorAll('button')];if(focusable.length){event.preventDefault();const index=focusable.indexOf(document.activeElement);focusable[(index+(event.shiftKey?-1:1)+focusable.length)%focusable.length].focus();}}};
 const visibility=()=>{if(document.hidden)failure('Benchmark interrupted. Keep the game visible and run again.');};
 const watchdog=setInterval(()=>{if(!finished&&performance.now()-lastMessage>120000)failure('Benchmark could not finish loading. Please try again.');},1000);
 button.onclick=close;window.addEventListener('message',receive);document.addEventListener('keydown',keys,true);document.addEventListener('visibilitychange',visibility);iframe.src=url.href;button.focus();
 return {close};
}
