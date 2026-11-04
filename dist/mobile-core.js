// Touch tuning is in CSS-pixel / screen-relative units, independent of render resolution.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MOBILE_DEFAULTS={fireMode:'simple',holdSemi:true,manualFire:true,adsMode:'toggle',adsDrag:true,stickMode:'floating',sensitivity:1,adsSensitivity:.7,scopeSensitivity:.45,vertical:1,aimAssist:true,invertY:false,gyro:'off',gyroSensitivity:1,quality:'balanced',fov:78,focusMode:'toggle',preset:'thumbs',controlScale:1,controlOpacity:.65};
export function mobileSettings(saved={}){
 const s={...MOBILE_DEFAULTS};
 for(const k of ['holdSemi','manualFire','adsDrag','aimAssist','invertY'])if(typeof saved?.[k]==='boolean')s[k]=saved[k];
 for(const [k,choices]of Object.entries({fireMode:['simple','manual'],adsMode:['toggle','hold'],stickMode:['floating','fixed'],gyro:['off','ads','always'],quality:['battery','balanced','high'],focusMode:['toggle','hold'],preset:['thumbs','claw','left']}))if(choices.includes(saved?.[k]))s[k]=saved[k];
 for(const [k,min,max]of [['sensitivity',.3,2.5],['adsSensitivity',.2,1.5],['scopeSensitivity',.15,1.2],['vertical',.5,1.5],['gyroSensitivity',.2,2],['fov',65,95],['controlScale',.7,1.4],['controlOpacity',.2,1]])if(Number.isFinite(saved?.[k]))s[k]=clamp(saved[k],min,max);
 return s;
}
export const CONTROL_DEFS={
 minimap:{label:'Minimap',size:130,x:.13,y:.30,passive:true},
 stick:{label:'Move',size:112,x:.13,y:.72},ads:{label:'Aim',size:62,x:.88,y:.36},fire:{label:'Hip fire',size:72,x:.78,y:.57},jump:{label:'Jump',size:54,x:.94,y:.56},crouch:{label:'Crouch / slide',size:54,x:.90,y:.78},reload:{label:'Reload',size:50,x:.79,y:.80},grenade:{label:'Grenade',size:48,x:.69,y:.78},focus:{label:'Slow time',size:56,x:.28,y:.77},streak:{label:'Streak',size:48,x:.37,y:.82},swap:{label:'Switch',size:48,x:.62,y:.85}
};
export function presetLayout(preset='thumbs'){
 const layout=Object.fromEntries(Object.entries(CONTROL_DEFS).map(([id,d])=>[id,{x:d.x,y:d.y,scale:1,opacity:1,hidden:false}]));
 if(preset==='claw'){Object.assign(layout.minimap,{x:.33,y:.28});Object.assign(layout.fire,{x:.14,y:.22});Object.assign(layout.ads,{x:.87,y:.23});Object.assign(layout.jump,{x:.93,y:.48});}
 if(preset==='left')for(const d of Object.values(layout))d.x=1-d.x;
 return layout;
}
export function normalizeLayout(saved,preset='thumbs'){
 const result=presetLayout(preset);
 for(const [id,d]of Object.entries(result)){
  const v=saved?.[id];if(!v||typeof v!=='object')continue;
  for(const [k,min,max]of [['x',0,1],['y',0,1],['scale',.65,1.6],['opacity',.2,1]])if(Number.isFinite(v[k]))d[k]=clamp(v[k],min,max);
  d.hidden=!!v.hidden&&!['stick','ads','jump','reload','swap'].includes(id);
 }
 return result;
}
export function controlRect(id,layout,area,scale=1){
 const v=layout[id],requested=CONTROL_DEFS[id].size*v.scale*scale,size=CONTROL_DEFS[id].passive?Math.min(requested,area.w,area.h):requested;
 const width=Math.max(44,size),height=width;
 return {x:area.x+clamp(v.x*area.w,width/2,Math.max(width/2,area.w-width/2)),y:area.y+clamp(v.y*area.h,height/2,Math.max(height/2,area.h-height/2)),size,width,height};
}
export function layoutOverlaps(layout,area,scale=1){
 const ids=Object.keys(CONTROL_DEFS).filter(id=>!layout[id].hidden),pairs=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=controlRect(ids[i],layout,area,scale),b=controlRect(ids[j],layout,area,scale);
  if(Math.hypot(a.x-b.x,a.y-b.y)<(a.width+b.width)*.38)pairs.push([ids[i],ids[j]]);
 }
 return pairs;
}
export function stickVector(dx,dy,radius=48,dead=.12){
 const distance=Math.hypot(dx,dy),m=clamp((distance/radius-dead)/(1-dead),0,1);
 return {x:distance?dx/distance*m:0,y:distance?-dy/distance*m:0,magnitude:m};
}
// Pointer roles are fixed on contact. Crossing another control never steals a gesture.
export class TouchState{
 constructor(){this.contacts=new Map();this.clear();}
 clear(){this.contacts.clear();this.move={x:0,y:0,magnitude:0};this.held=new Set();this.ads=false;this.focus=false;}
 begin(id,role,x,y){if(this.contacts.has(id)||[...this.contacts.values()].some(c=>c.role===role))return false;this.contacts.set(id,{role,x,y,originX:x,originY:y});this.held.add(role);return true;}
 moveContact(id,x,y,radius=48){const c=this.contacts.get(id);if(!c)return null;const delta={x:x-c.x,y:y-c.y,role:c.role};c.x=x;c.y=y;if(c.role==='stick')this.move=stickVector(x-c.originX,y-c.originY,radius);return delta;}
 end(id){const c=this.contacts.get(id);if(!c)return null;this.contacts.delete(id);if(![...this.contacts.values()].some(p=>p.role===c.role))this.held.delete(c.role);if(c.role==='stick'){this.move={x:0,y:0,magnitude:0};}return c;}
}
// Evidence-informed approximation, deliberately separate from weapon fire intervals.
// Mobile targeting delay only; mechanical fire/charge/reload timing is separate.
export const AUTO_FIRE={rifle:{acquire:.06},pistol:{acquire:.08},smg:{acquire:.045},rail:{acquire:.12},rocket:{manual:true,acquire:.1},shotgun:{acquire:.075}};
export const AUTO_FIRE_DRAIN=.18;
export class AutoFire{
 constructor(){this.reset();}
 reset(){this.target=null;this.age=0;this.progress=0;this.phase='searching';this.reason='no-target';}
 step(dt,{target=null,weapon='rifle',blocked=false,manual=false,onTarget=true}={}){
  const profile=AUTO_FIRE[weapon]||AUTO_FIRE.rifle;
  if(blocked||profile.manual){this.reset();this.phase='unavailable';this.reason=blocked?'blocked':'manual-weapon';return false;}
  if(!target){
   this.age=Math.max(0,this.age-clamp(dt,0,.05)*profile.acquire/AUTO_FIRE_DRAIN);this.progress=clamp(this.age/profile.acquire,0,1);this.phase=this.progress>0?'draining':'searching';this.reason='no-target';if(!this.age)this.target=null;return false;
  }
  if(target!==this.target){this.target=target;this.age=0;}
  this.age=Math.min(profile.acquire,this.age+clamp(dt,0,.05));this.progress=clamp(this.age/profile.acquire,0,1);this.phase=this.progress>=1&&onTarget?'firing':'acquiring';this.reason='';
  return manual||onTarget&&this.progress>=1;
 }
}
export function touchLook(dx,dy,width,settings,{ads=false,zoom=1,assisted=false}={}){
 const context=ads?(zoom>1?settings.scopeSensitivity:settings.adsSensitivity):1;
 const gain=Math.PI*1.25/Math.max(320,width)*settings.sensitivity*context*(assisted?.6:1);
 return {yaw:-dx*gain,pitch:-dy*gain*settings.vertical*(settings.invertY?-1:1)};
}
export const MOBILE_QUALITY={battery:{shadows:false,bloom:false,ao:false},balanced:{shadows:true,bloom:true,ao:false},high:{shadows:true,bloom:true,ao:true}};
