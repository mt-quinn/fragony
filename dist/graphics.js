import {antialiasOptions} from './antialias.js';
export const EFFECT_PRESETS={
 battery:{shadowQuality:'off',shadowFilter:'pcf',aoQuality:'off',aoStrength:.65,bloomStrength:0},
 balanced:{shadowQuality:'medium',shadowFilter:'pcf',aoQuality:'off',aoStrength:.65,bloomStrength:1},
 high:{shadowQuality:'high',shadowFilter:'soft',aoQuality:'high',aoStrength:.65,bloomStrength:1}
};
const choose=(value,choices,fallback)=>choices.includes(value)?value:fallback;
const number=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function graphicsOptions(saved={},context={}){
 const preset=EFFECT_PRESETS[context.legacy?.quality]||EFFECT_PRESETS[context.touch?'balanced':'high'],ratio=context.dpr||1;
 return {...antialiasOptions(saved),resolutionScale:choose(saved.resolutionScale,[.25,.33,.5,.67,.75,1],ratio>=2.5?.5:ratio>=1.5?.75:1),
 shadowQuality:choose(saved.shadowQuality,['off','low','medium','high'],preset.shadowQuality),shadowFilter:choose(saved.shadowFilter,['hard','pcf','soft'],preset.shadowFilter),
 aoQuality:choose(saved.aoQuality,['off','low','medium','high'],preset.aoQuality),aoStrength:number(saved.aoStrength,0,1,preset.aoStrength),bloomStrength:number(saved.bloomStrength,0,2,preset.bloomStrength),
 exposure:number(saved.exposure,.5,1.5,1),toneMap:choose(saved.toneMap,['cinematic','neutral','none'],'cinematic'),vignette:number(saved.vignette,0,2,1),grain:saved.grain!==false,colorGrade:saved.colorGrade!==false,
 fov:number(saved.fov,65,110,context.touch?(context.legacy?.fov||78):85)};
}
export function graphicsRenderOptions(settings){const s=graphicsOptions(settings);return {...s,shadows:s.shadowQuality!=='off',ao:s.aoQuality!=='off'&&s.aoStrength>0,bloom:s.bloomStrength>0};}
export function graphicsControlsHTML(s,aaHTML,resolutionHTML){
 const select=(key,label,choices,hint='')=>`<label class="aa-option"><span>${label}${hint?`<small>${hint}</small>`:''}</span><select data-graphics="${key}" aria-label="${label}">${choices.map(([value,text])=>`<option value="${value}" ${s[key]===value?'selected':''}>${text}</option>`).join('')}</select></label>`;
 const range=(key,label,min,max,step,unit='%')=>`<label class="graphics-range"><span>${label}</span><output data-graphics-value="${key}">${unit==='°'?s[key]:Math.round(s[key]*100)}${unit}</output><input data-graphics="${key}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${s[key]}"></label>`;
 const toggle=(key,label)=>`<label class="minimap-setting"><span>${label}</span><input data-graphics="${key}" type="checkbox" ${s[key]?'checked':''}></label>`;
 const matched=Object.entries(EFFECT_PRESETS).find(([,p])=>Object.entries(p).every(([k,v])=>s[k]===v))?.[0]||'custom';
 return `<div class="graphics-settings"><header class="graphics-intro"><small>FRAGONY / DISPLAY</small><h3>GRAPHICS</h3><p>Changes apply immediately and save on this device.</p></header><div class="graphics-grid"><div class="graphics-group"><h4>RESOLUTION & VIEW</h4>${resolutionHTML}${range('fov','Field of view',65,110,1,'°')}<h4>LIGHTING & EFFECTS</h4><label class="aa-option"><span>Effects preset<small>Leaves resolution and AA alone.</small></span><select data-graphics-preset aria-label="Effects preset">${[['custom','Custom'],['battery','Battery saver'],['balanced','Balanced'],['high','High detail']].map(([v,l])=>`<option value="${v}" ${matched===v?'selected':''}>${l}</option>`).join('')}</select></label>${select('shadowQuality','Shadow detail',[['off','Off'],['low','Low · 512'],['medium','Medium · 1024'],['high','High · 2048']])}${select('shadowFilter','Shadow filtering',[['hard','Hard'],['pcf','Smooth'],['soft','Soft']])}${select('aoQuality','Contact shading',[['off','Off'],['low','Low'],['medium','Medium'],['high','High']],'Ambient occlusion')}${range('aoStrength','Contact shading strength',0,1,.05)}${range('bloomStrength','Bloom',0,2,.05)}</div><div class="graphics-group"><h4>ANTIALIASING</h4>${aaHTML}<h4>IMAGE</h4>${range('exposure','Brightness',.5,1.5,.05)}${select('toneMap','Tone mapping',[['cinematic','Cinematic'],['neutral','Neutral'],['none','Off']])}${range('vignette','Vignette',0,2,.05)}${toggle('grain','Film grain')}${toggle('colorGrade','Color grading')}</div></div><footer class="graphics-footer"><button type="button" data-graphics-reset>RESET GRAPHICS</button><button type="button" data-graphics-benchmark>RUN GRAPHICS BENCHMARK <span>↗</span></button><p>About 45 seconds plus map loading. Three maps, six scenes, live gunfire and effects.</p></footer><div data-benchmark-report></div></div>`;
}
