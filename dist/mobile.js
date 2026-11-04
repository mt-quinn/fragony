import {viewportSize,displayReport,syncDisplayMode} from './viewport.js';
import {MOBILE_DEFAULTS,mobileSettings,CONTROL_DEFS,presetLayout,normalizeLayout,controlRect,layoutOverlaps,TouchState,AutoFire,touchLook} from './mobile-core.js';

const paths={
 minimap:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3v3m0 8v3M5 12h3m8 0h3m-4 2-3-7-3 7 3-1Z',
 ads:'M12 2v5m0 10v5M2 12h5m10 0h5M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z',
 fire:'m9 3 3-2 3 2v12H9ZM9 18h6m-6 3h6',
 jump:'m8 21 2-7-3-3 4-5 4 3 4-1M11 6l1-3m-2 11 5 1 2 6M4 5l3-3 3 3M7 2v7',
 crouch:'M13 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 3 4 3 5-1M11 8l-4 6 7 1 3 6M7 14l-3 7h7',
 reload:'m7 5 7-2 4 14-7 2Zm3 1 3 11m-7 4 7-2M3 9V4h5M3 4l3 2',
 grenade:'m10 7 1-4h5l1 2-3 2 1 3c7 5 3 12-3 12S3 15 7 11l2-1V7ZM16 3l4 2',
 focus:'m13 2-9 12h7l-1 8 10-13h-7Z',
 streak:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z',
 swap:'M3 7h16l-4-4m4 14H3l4 4M19 7l-4 4M3 17l4-4',
 pause:'M7 5v14M17 5v14'
};
const icon=id=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[id]||paths.ads}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wantsTouch(){return typeof location!=='undefined'&&new URLSearchParams(location.search).get('touch')==='1'||typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches||typeof navigator!=='undefined'&&/iPhone|iPad|iPod/.test(navigator.userAgent);}
function readStore(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}

export class MobileController{
 constructor(api){
  this.api=api;this.enabled=true;this.settings=mobileSettings(readStore('fg-touch-settings'));this.layouts=readStore('fg-touch-layouts')||{};this.state=new TouchState();this.auto=new AutoFire();this.crouch=false;this.practice=false;this.overlay=null;this.editor=null;this.lastMode='';this.lastInfo=0;this.gyroReady=false;this.gyroBase=null;this.gyroDelta={x:0,y:0};this.target=null;this.targetDistance=Infinity;this.assisted=false;this.wake=null;this.active=false;
  document.body.classList.add('touch-device');syncDisplayMode();
  const root=document.createElement('div');root.id='mobile';root.innerHTML=`
   <div id="touch-controls" hidden><div id="touch-look" aria-label="Swipe to look"></div>
    <div class="touch-top"><button id="touch-score" aria-label="Show scoreboard"><span id="touch-placement">1ST</span><small id="touch-match">ROUND 01</small></button><div class="touch-clock"><strong id="touch-time">1:30</strong><small id="touch-map"></small></div><button id="touch-pause" aria-label="Pause">${icon('pause')}</button></div>
    <div id="touch-acquire" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="acquire-track" cx="32" cy="32" r="25"/><circle class="acquire-fill" cx="32" cy="32" r="25"/></svg><small></small></div>
    <div id="touch-slide" aria-hidden="true">${icon('crouch')}<span>SLIDING</span></div>
    ${Object.entries(CONTROL_DEFS).map(([id,d])=>id==='minimap'?`<div class="touch-control touch-minimap" data-control="minimap" role="img" aria-label="Local minimap. Enemy shots appear briefly in red."><canvas aria-hidden="true"></canvas></div>`:id==='stick'?`<div class="touch-control touch-stick" data-control="stick" aria-label="Movement joystick"><i></i><span>MOVE</span></div>`:`<button class="touch-control" data-control="${id}" aria-label="${d.label}">${icon(id)}<small>${d.label}</small><b></b></button>`).join('')}
    <div class="touch-status"><div class="touch-health"><span>+</span><strong id="touch-hp">100</strong><i><em></em></i></div><button id="touch-weapon" aria-label="Choose weapon"><span id="touch-gun-icon"></span><span><small id="touch-gun-name"></small><small id="touch-gun-mode"></small><b id="touch-ammo"></b></span><em>⌃</em></button></div>
    <div id="touch-feedback" role="status"></div>
   </div>
   <section id="touch-panel" class="touch-panel" hidden></section>
   <section id="touch-editor" hidden></section>
   <div id="touch-rotate" hidden><div class="rotate-phone">↻</div><h2>TURN TO LANDSCAPE</h2><p>A little more room for a lot more chaos.</p><small>Rotate your iPhone to play</small></div>`;
  document.body.append(root);this.root=root;this.controls=root.querySelector('#touch-controls');this.panel=root.querySelector('#touch-panel');this.editRoot=root.querySelector('#touch-editor');this.rotate=root.querySelector('#touch-rotate');this.nodes=Object.fromEntries([...root.querySelectorAll('[id]')].map(n=>[n.id,n]));this.buttons=Object.fromEntries([...root.querySelectorAll('[data-control]')].map(n=>[n.dataset.control,n]));
  this.controls.addEventListener('pointerdown',e=>this.down(e));this.controls.addEventListener('pointermove',e=>this.move(e));for(const name of ['pointerup','pointercancel','lostpointercapture'])this.controls.addEventListener(name,e=>this.up(e,name!=='pointerup'));
  this.controls.addEventListener('contextmenu',e=>e.preventDefault());
  this.nodes['touch-pause'].onclick=()=>this.api.pause();this.nodes['touch-score'].onclick=()=>this.showScores();this.nodes['touch-weapon'].onclick=()=>this.showWeapons();
  this.resizeBound=()=>this.settleResize();window.addEventListener('resize',this.resizeBound);window.visualViewport?.addEventListener('resize',this.resizeBound);window.addEventListener('orientationchange',this.resizeBound);window.addEventListener('pageshow',this.resizeBound);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.interrupt();this.releaseWake();}else{this.gyroBase=null;this.settleResize();}});
  window.addEventListener('pagehide',()=>{this.interrupt();this.releaseWake();});window.addEventListener('blur',()=>this.interrupt());
  window.addEventListener('deviceorientation',e=>this.orientation(e));
  this.installMenu();this.resize();
 }
 installMenu(){
  const nav=document.querySelector('.menu-actions');const practice=document.createElement('button');practice.id='touch-practice';practice.className='menu-secondary';practice.textContent='Practice';practice.onclick=()=>this.beginPractice();nav.append(practice);
  const guide=document.createElement('div');guide.className='touch-menu-note';guide.innerHTML='<b>SIMPLE MODE</b><span>You aim. Your weapon fires.</span>';document.querySelector('.intro').append(guide);
 }
 get layout(){return normalizeLayout(this.layouts[this.settings.preset],this.settings.preset)}
 get viewport(){return viewportSize(this.root)}
 get landscape(){const {width,height}=this.viewport;return width>height;}
 get area(){const s=getComputedStyle(this.root),left=parseFloat(s.paddingLeft)||0,right=parseFloat(s.paddingRight)||0,top=parseFloat(s.paddingTop)||0,bottom=parseFloat(s.paddingBottom)||0;return{x:left+8,y:top+8,w:this.viewport.width-left-right-16,h:this.viewport.height-top-bottom-16};}
 applyLayout(layout=this.layout){
  const area=this.area;
  for(const [id,node]of Object.entries(this.buttons)){const d=layout[id],r=controlRect(id,layout,area,this.settings.controlScale);node.style.left=r.x+'px';node.style.top=r.y+'px';node.style.setProperty('--control-size',r.size+'px');node.style.setProperty('--control-opacity',d.opacity*(id==='minimap'?1:this.settings.controlOpacity));node.hidden=id==='fire'?(this.settings.fireMode==='simple'&&this.api.read().type!=='rocket'&&(d.hidden||!this.settings.manualFire)):d.hidden||id==='minimap'&&this.api.read().minimapEnabled===false;}
 }
 settleResize(){
  this.resize();clearTimeout(this.resizeTimer);clearTimeout(this.resizeTimerLate);const settled=()=>{const size=this.viewport;if(size.width!==this.layoutWidth||size.height!==this.layoutHeight)this.resize();};this.resizeTimer=setTimeout(settled,80);this.resizeTimerLate=setTimeout(settled,300);
 }
 resize(){
  syncDisplayMode();const size=this.viewport;this.layoutWidth=size.width;this.layoutHeight=size.height;const portrait=!this.landscape;this.rotate.hidden=!portrait;document.body.classList.toggle('touch-portrait',portrait);
  if(portrait){this.interrupt();}else this.clear();this.gyroBase=null;this.applyLayout();if(this.editor)this.renderEditorControls();this.api.resize?.();
 }
 clear(){if(this.preparing||this.state.held.has('fire'))this.setFeedback('');this.state.clear();this.preparing=this.cancelGrenade=false;this.crouch=false;this.cancelFire=false;this.auto.reset();this.target=null;this.gyroDelta={x:0,y:0};for(const b of Object.values(this.buttons))b.classList.remove('pressed','selected','cancel');this.buttons.stick.querySelector('i').style.transform='translate(-50%,-50%)';this.api.clear?.();}
 interrupt(){this.clear();if(this.api.read().active)this.api.pause();}
 async requestWake(){if(this.wake||!navigator.wakeLock||document.hidden)return;try{this.wake=await navigator.wakeLock.request('screen');this.wake.addEventListener('release',()=>this.wake=null)}catch{}}
 releaseWake(){this.wake?.release().catch(()=>{});this.wake=null;}
 down(e){
  if(!this.active||this.overlay||this.editor)return;
  if(e.target.closest('#touch-pause,#touch-score,#touch-weapon,[data-control="minimap"]'))return;
  e.preventDefault();const id=e.pointerId,button=e.target.closest('[data-control]');let role=button?.dataset.control||'look';
  const leftHand=this.settings.preset==='left',movementSide=leftHand?e.clientX>this.viewport.width*.65:e.clientX<this.viewport.width*.35;
  if(!button&&movementSide&&e.clientY>this.viewport.height*.35)role='stick';
  if(!this.state.begin(id,role,e.clientX,e.clientY))return;
  this.controls.setPointerCapture(id);this.requestWake();this.api.unlock?.();
  const node=this.buttons[role];node?.classList.add('pressed');
  if(role==='stick'){
   const c=this.state.contacts.get(id),r=controlRect('stick',this.layout,this.area,this.settings.controlScale);
   if(this.settings.stickMode==='fixed'){c.originX=r.x;c.originY=r.y;this.state.moveContact(id,e.clientX,e.clientY,r.size*.43);}else{this.buttons.stick.style.left=e.clientX+'px';this.buttons.stick.style.top=e.clientY+'px';}
  }else if(role==='ads'){this.state.ads=this.settings.adsMode==='toggle'?!this.state.ads:true;}
  else if(role==='focus'){this.state.focus=this.settings.focusMode==='toggle'?!this.state.focus:true;}
  else if(role==='crouch')this.crouch=!this.crouch;
  else if(role==='grenade'){this.preparing=true;this.auto.reset();this.api.action('prepareGrenade',true);this.setFeedback('AIM · RELEASE TO THROW · DRAG TO TOP TO CANCEL',Infinity);}
  else if(['reload','swap','jump','streak'].includes(role))this.api.action(role,true);
 }
 move(e){
  if(!this.state.contacts.has(e.pointerId))return;e.preventDefault();const r=controlRect('stick',this.layout,this.area,this.settings.controlScale),d=this.state.moveContact(e.pointerId,e.clientX,e.clientY,r.size*.43);
  if(!d)return;
  if(d.role==='stick'){const m=this.state.move;this.buttons.stick.querySelector('i').style.transform=`translate(calc(-50% + ${m.x*r.size*.32}px),calc(-50% + ${-m.y*r.size*.32}px))`;}
  else if(d.role==='look'||d.role==='fire'||d.role==='grenade'||d.role==='ads'&&this.settings.adsDrag)this.api.look(d.x,d.y);
  if(d.role==='fire'&&this.api.read().type==='rocket'&&this.api.read().chargeWeapon){this.cancelFire=e.clientY<this.viewport.height*.22;this.setFeedback(this.cancelFire?'RELEASE TO CANCEL':'HOLD TO CHARGE · RELEASE TO LAUNCH',Infinity);}
  if(d.role==='grenade'){this.cancelGrenade=e.clientY<this.viewport.height*.22;this.buttons.grenade.classList.toggle('cancel',this.cancelGrenade);this.setFeedback(this.cancelGrenade?'RELEASE TO CANCEL':'AIM · RELEASE TO THROW · DRAG TO TOP TO CANCEL',Infinity);}
 }
 up(e,cancelled=false){
  const contact=this.state.end(e.pointerId);if(!contact)return;e.preventDefault?.();const role=contact.role;if(!this.state.held.has(role))this.buttons[role]?.classList.remove('pressed');
  if(role==='stick'){this.buttons.stick.querySelector('i').style.transform='translate(-50%,-50%)';this.applyLayout();}
  if(role==='fire'){if(cancelled||this.cancelFire)this.api.action('cancelCharge',true);this.cancelFire=false;this.setFeedback('');}
  if(role==='ads'&&(cancelled||this.settings.adsMode==='hold'))this.state.ads=false;
  if(role==='focus'&&(cancelled||this.settings.focusMode==='hold'))this.state.focus=false;
  if(role==='grenade'){if(!cancelled&&!this.cancelGrenade)this.api.action('grenade',true);this.api.action('prepareGrenade',false);this.preparing=this.cancelGrenade=false;this.setFeedback('');this.buttons.grenade.classList.remove('cancel');}
 }
 setFeedback(text,seconds=5){this.nodes['touch-feedback'].textContent=text;this.feedbackTime=text?seconds:0;}
 update(dt){
  if(this.feedbackTime>0){this.feedbackTime-=dt;if(this.feedbackTime<=0)this.setFeedback('');}
  const g=this.api.read(),visible=g.mode==='play'&&!this.editor;
  this.controls.hidden=!visible;this.active=visible&&g.active&&g.alive&&this.landscape&&!this.overlay;
  this.controls.classList.toggle('inactive',!this.active);document.body.classList.toggle('touch-playing',g.mode==='play');
  if(g.mode!==this.lastMode){this.clear();this.lastMode=g.mode;if(g.mode!=='play'){this.closeOverlay();this.releaseWake();}}
  if(!this.active){this.auto.reset();this.nodes['touch-acquire'].dataset.phase='unavailable';return;}
  this.buttons.ads.classList.toggle('selected',this.state.ads&&!this.state.held.has('fire'));this.buttons.focus.classList.toggle('selected',this.state.focus&&g.focus>0);this.buttons.crouch.classList.toggle('selected',g.crouched);this.nodes['touch-slide'].hidden=!g.sliding;
  if(this.gyroReady&&(this.settings.gyro==='always'||this.settings.gyro==='ads'&&this.state.ads)){this.api.gyro?.(this.gyroDelta.x,this.gyroDelta.y);this.gyroDelta={x:0,y:0};}
  else this.gyroDelta={x:0,y:0};
  const ring=this.nodes['touch-acquire'];ring.dataset.phase=g.charge>0?'acquiring':this.auto.phase;ring.style.setProperty('--acquire',g.charge>0?g.charge:this.auto.progress);ring.querySelector('small').textContent=g.charge>0?'CHARGING '+Math.round(g.charge*100)+'%':g.type==='rocket'?(g.chargeWeapon?'HOLD · RELEASE':'MANUAL'):this.settings.fireMode==='manual'?'MANUAL':'';
  this.lastInfo+=dt;if(this.lastInfo<.08)return;this.lastInfo=0;
  this.nodes['touch-placement'].textContent=g.placement;this.nodes['touch-match'].textContent=this.practice?'PRACTICE':'ROUND '+String(g.round).padStart(2,'0');this.nodes['touch-time'].textContent=this.practice?'∞':g.time;this.nodes['touch-map'].textContent=g.map;
  this.nodes['touch-hp'].textContent=Math.ceil(g.health);this.nodes['touch-hp'].style.color=g.health<35?'#ff8565':'';this.nodes['touch-hp'].nextElementSibling.firstElementChild.style.width=Math.min(100,g.health/g.maxHealth*100)+'%';
  if(this.weapon!==g.equipped){this.weapon=g.equipped;this.nodes['touch-gun-icon'].innerHTML=g.icon;this.nodes['touch-gun-name'].textContent=g.weapon;this.applyLayout();}
  this.nodes['touch-gun-mode'].textContent=g.gunMode+' · '+g.pulls+(g.pulls===1?' PULL':' PULLS');
  this.nodes['touch-ammo'].textContent=g.reloading?'RELOADING':g.ammo+' / ∞';
  this.buttons.grenade.querySelector('b').textContent=g.grenades;this.buttons.grenade.classList.toggle('empty',!g.grenades);this.buttons.streak.querySelector('b').textContent=g.streakReady?'READY':g.streak+'/3';this.buttons.streak.classList.toggle('ready',g.streakReady);this.buttons.focus.querySelector('b').textContent=Math.round(g.focus)+'%';this.buttons.focus.style.setProperty('--charge',g.focus/100);
  if(g.focus<=0)this.state.focus=false;
 }
 trigger(dt,target,distance,blocked,onTarget=true){
  const g=this.api.read(),manual=this.state.held.has('fire');
  const fire=this.settings.fireMode==='simple'&&this.auto.step(dt,{target,weapon:g.type,blocked:blocked||!this.active,onTarget});
  if(this.settings.fireMode!=='simple')this.auto.reset();return this.active&&(manual||fire)&&!this.preparing;
 }
 look(dx,dy){const g=this.api.read();return touchLook(dx,dy,this.viewport.width,this.settings,{ads:this.state.ads&&!this.state.held.has('fire'),zoom:g.zoom,assisted:this.settings.aimAssist&&this.assisted});}
 orientation(e){
  if(!this.gyroReady||!this.active||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma)){this.gyroBase=null;return;}
  const angle=screen.orientation?.angle??window.orientation??90,orientation=angle===-90||angle===270?-1:1;
  if(this.gyroBase){const db=e.beta-this.gyroBase.beta,dg=e.gamma-this.gyroBase.gamma;if(Math.abs(db)<30&&Math.abs(dg)<30){this.gyroDelta.x+=db*orientation;this.gyroDelta.y+=dg*orientation;}}
  this.gyroBase={beta:e.beta,gamma:e.gamma};
 }
 async enableGyro(){try{if(typeof DeviceOrientationEvent==='undefined')throw new Error('unavailable');const result=typeof DeviceOrientationEvent.requestPermission==='function'?await DeviceOrientationEvent.requestPermission():'granted';if(result!=='granted')throw new Error('denied');this.gyroReady=true;this.gyroBase=null;this.settings.gyro=this.settings.gyro==='off'?'ads':this.settings.gyro;this.save();return true;}catch{this.settings.gyro='off';this.gyroReady=false;this.save();return false;}}
 save(){return store('fg-touch-settings',this.settings)&&store('fg-touch-layouts',this.layouts);}
 closeOverlay(){this.panel.hidden=true;this.overlay=null;}
 showPanel(kind,html){this.clear();this.overlay=kind;this.panel.innerHTML=html;this.panel.hidden=false;this.panel.scrollTop=0;this.panel.querySelector('button')?.focus({preventScroll:true});}
 header(title,back='BACK'){return `<header class="touch-panel-header"><div><small>FRAGONY / ${this.practice?'PRACTICE':'TOUCH CONTROLS'}</small><h2>${title}</h2></div><button class="touch-primary" data-close>${back}</button></header>`;}
 back(){this.closeOverlay();if(this.api.read().mode==='play')this.api.resume();}
 showPause(){
  this.showPanel('pause',`${this.header('PAUSED','RESUME')}${this.practice?'<button class="touch-row-action" data-workbench>WEAPON WORKBENCH <span>TRY EVERY ATTACHMENT ↗</span></button><button class="touch-row-action" data-practice-maps>CHANGE PRACTICE MAP <span>EXPLORE ALL MAPS ↗</span></button>':''}<div class="touch-pause-actions"><button data-settings>SETTINGS <span>Controls, audio & visuals</span></button><button data-editor>EDIT HUD <span>Make it yours</span></button><button data-guide>HOW TO PLAY <span>Simple Mode essentials</span></button><button data-exit>${this.practice?'END PRACTICE':'SAVE & MAIN MENU'} <span>${this.practice?'Your run is untouched':'Resume this round from the menu'}</span></button></div>`);
  if(this.practice)this.panel.querySelector('[data-workbench]').onclick=()=>{this.closeOverlay();this.api.workbench();};if(this.practice)this.panel.querySelector('[data-practice-maps]').onclick=()=>this.showPracticeMaps();this.panel.querySelector('[data-close]').onclick=()=>this.back();this.panel.querySelector('[data-settings]').onclick=()=>this.showSettings('play');this.panel.querySelector('[data-editor]').onclick=()=>this.startEditor('pause');this.panel.querySelector('[data-guide]').onclick=()=>this.showGuide('pause');this.panel.querySelector('[data-exit]').onclick=()=>{this.closeOverlay();this.api.menu();};
 }
 showSettings(back='menu'){
  this.settingsBack=back;
  const select=(id,label,choices,hint='')=>`<label class="touch-option"><span>${label}${hint?`<small>${hint}</small>`:''}</span><select data-option="${id}">${choices.map(([v,l])=>`<option value="${v}" ${String(this.settings[id])===v?'selected':''}>${l}</option>`).join('')}</select></label>`;
  const toggle=(id,label,hint)=>`<label class="touch-option"><span>${label}<small>${hint}</small></span><input data-option="${id}" type="checkbox" ${this.settings[id]?'checked':''}></label>`;
  const range=(id,label,min,max,step=0.05)=>`<label class="touch-range"><span>${label}</span><output>${id==='fov'?this.settings[id]+'°':Math.round(this.settings[id]*100)+'%'}</output><input aria-label="${label}" data-range="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${this.settings[id]}"></label>`;
  this.showPanel('settings',`${this.header('SETTINGS',back==='play'?'RESUME':'BACK')}<nav class="touch-tabs" aria-label="Settings categories">${['Controls','Aim','Layout','Audio','Graphics'].map((t,i)=>`<button data-tab="${t.toLowerCase()}" class="${i?'':'selected'}">${t}</button>`).join('')}</nav><div class="touch-settings-body">
   <section data-section="controls"><div class="touch-section-intro"><h3>YOU AIM. WE HANDLE THE TRIGGER.</h3><p>Keep a dummy in your sights. Your weapon fires when it has a clear shot. Rockets are manual.</p></div>${select('fireMode','Firing mode',[['simple','Simple · auto-fire'],['manual','Manual']])}${toggle('manualFire','Manual hip-fire button','Fire on demand, without entering sights.')}${toggle('holdSemi','Hold to repeat semi-auto','Manual hip-fire repeats at the weapon’s legal cadence.')}${select('adsMode','Aim down sights',[['toggle','Tap to toggle'],['hold','Hold']])}${toggle('adsDrag','Aim by dragging the ADS button','Keep tracking without lifting your thumb.')}${select('stickMode','Movement joystick',[['floating','Floating'],['fixed','Fixed']])}${select('focusMode','Slow motion',[['toggle','Tap to toggle'],['hold','Hold']])}<button class="touch-row-action" data-guide>HOW TO PLAY <span>↗</span></button></section>
   <section data-section="aim" hidden>${range('sensitivity','Look sensitivity',.3,2.5)}${range('adsSensitivity','ADS sensitivity',.2,1.5)}${range('scopeSensitivity','Scoped sensitivity',.15,1.2)}${range('vertical','Vertical sensitivity',.5,1.5)}${toggle('aimAssist','Aim slowdown','Slows your swipe near a visible target. You steer.')}${toggle('invertY','Invert vertical aim','Reverse vertical touch movement.')}${select('gyro','Gyroscope',[['off','Off'],['ads','While aiming'],['always','Always']],'Optional fine aiming by tilting your phone.')}${range('gyroSensitivity','Gyro sensitivity',.2,2)}<button class="touch-row-action" data-gyro>${this.gyroReady?'RECENTER GYRO':'ENABLE MOTION ACCESS'} <span>↗</span></button><p class="touch-help" id="gyro-status">${this.gyroReady?'Motion access is enabled.': 'Motion access is optional. Touch aiming always works.'}</p></section>
   <section data-section="layout" hidden>${select('preset','Layout preset',[['thumbs','Two thumbs'],['claw','Four fingers'],['left','Left handed']])}${range('controlScale','Control size',.7,1.4)}${range('controlOpacity','Control opacity',.2,1)}<button class="touch-row-action" data-editor>EDIT INDIVIDUAL CONTROLS <span>↗</span></button><p class="touch-help">Each preset remembers its own positions, sizes and opacity.</p></section>
   <section data-section="audio" hidden>${this.api.audioHTML()}</section>
   <section data-section="graphics" hidden>${this.api.visualHTML()}<p class="touch-help">For more screen space on iPhone: Share → Add to Home Screen → Open as Web App. Playing in Safari works too.</p><button class="touch-row-action" data-display-report>COPY DISPLAY REPORT <span>↗</span></button><pre class="touch-display-report" hidden></pre></section>
   </div><footer class="touch-settings-footer"><span id="touch-settings-status" role="status">SAVED ON THIS DEVICE</span><button data-reset>RESET TOUCH SETTINGS</button></footer>`);
  this.panel.querySelector('[data-close]').onclick=()=>{this.closeOverlay();if(back==='play')this.api.resume();};
  this.panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{this.panel.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('selected',t===b));this.panel.querySelectorAll('[data-section]').forEach(s=>s.hidden=s.dataset.section!==b.dataset.tab);});
  this.panel.querySelectorAll('[data-option]').forEach(input=>input.onchange=async()=>{const id=input.dataset.option;this.settings[id]=input.type==='checkbox'?input.checked:input.value;if(id==='gyro'&&input.value!=='off'&&!this.gyroReady){const ok=await this.enableGyro();input.value=this.settings.gyro;this.panel.querySelector('#gyro-status').textContent=ok?'Motion access enabled. Hold your phone comfortably.':'Motion access unavailable or declined. Touch aiming is ready.';}this.commitSettings();});
  this.panel.querySelectorAll('[data-range]').forEach(input=>input.oninput=()=>{this.settings[input.dataset.range]=Number(input.value);input.previousElementSibling.textContent=input.dataset.range==='fov'?input.value+'°':Math.round(Number(input.value)*100)+'%';this.commitSettings();});
  this.api.bindAudio?.(this.panel);this.panel.querySelector('[data-editor]').onclick=()=>this.startEditor('settings');this.panel.querySelector('[data-guide]').onclick=()=>this.showGuide('settings');this.panel.querySelector('[data-gyro]').onclick=async()=>{const ok=await this.enableGyro();this.panel.querySelector('[data-option=gyro]').value=this.settings.gyro;this.commitSettings();this.panel.querySelector('#gyro-status').textContent=ok?'Recentered. Hold your phone comfortably.':'Motion access unavailable or declined. Touch aiming is ready.';};
  this.panel.querySelector('[data-display-report]').onclick=async()=>{const text=JSON.stringify(displayReport(),null,2),output=this.panel.querySelector('.touch-display-report');try{await navigator.clipboard.writeText(text);this.panel.querySelector('[data-display-report]').textContent='DISPLAY REPORT COPIED';}catch{output.textContent=text;output.hidden=false;}};
  this.panel.querySelector('[data-reset]').onclick=()=>{this.settings={...MOBILE_DEFAULTS};this.commitSettings();this.showSettings(back);};
 }
 commitSettings(){const ok=this.save();this.applyLayout();this.clear();this.api.settingsChanged?.();const status=this.panel.querySelector('#touch-settings-status');if(status)status.textContent=ok?'SAVED ON THIS DEVICE':'STORAGE UNAVAILABLE · SETTINGS ACTIVE FOR THIS SESSION';}
 showGuide(back='menu'){
  this.showPanel('guide',`${this.header('SIMPLE. NEVER EASY.','GOT IT')}<div class="touch-guide-grid"><article><b>01</b><h3>MOVE & TRACK</h3><p>Drag on the ${this.settings.preset==='left'?'right':'left'} to move. Crouch while moving to knee slide. Tap again to stand. Swipe the ${this.settings.preset==='left'?'left':'right'} side to aim.</p></article><article><b>02</b><h3>HOLD YOUR SIGHTS</h3><p>Keep a visible dummy under the crosshair. The ring fills, then your weapon fires. Track through recoil.</p></article><article><b>03</b><h3>TAKE CONTROL</h3><p>Tap Aim to enter sights. Drag that button to keep aiming. Use Hip fire for immediate shots. Rockets always use it.</p></article><article><b>04</b><h3>STAY IN THE FIGHT</h3><p>Reload between fights. Tap Slow time to spend focus. Release a held grenade to throw; drag to the top to cancel.</p></article></div><div class="touch-guide-footer"><span>Crouch while moving to slide. In water, crouch dives and jump rises.</span><button class="touch-primary" data-practice>PRACTICE</button></div>`);
  this.panel.querySelector('[data-close]').onclick=()=>{store('fg-touch-intro',true);if(back==='pause')this.showPause();else if(back==='settings')this.showSettings(this.settingsBack);else{this.closeOverlay();if(this.api.read().mode==='play')this.api.resume();}};this.panel.querySelector('[data-practice]').onclick=()=>this.beginPractice();
 }
 showPracticeMaps(){this.showPanel('maps',`${this.header('PRACTICE MAPS')}<div class="practice-map-grid">${(this.api.maps?.()||[]).map(m=>`<button class="practice-map-card ${m.current?'selected':''}" data-practice-map="${esc(m.id)}"><b>${esc(m.name)}</b><span>${esc(m.description)}</span><small>${m.current?'CURRENT MAP':'ENTER PRACTICE ↗'}</small></button>`).join('')}</div>`);this.panel.querySelector('[data-close]').onclick=()=>this.showPause();this.panel.querySelectorAll('[data-practice-map]').forEach(b=>b.onclick=()=>this.beginPractice(b.dataset.practiceMap));}
 beginPractice(mapId){this.closeOverlay();this.clear();this.practice=true;this.api.practice(mapId);this.setFeedback('PRACTICE · NO DAMAGE · YOUR RUN IS SAFE');}
 showScores(){this.api.suspend();const g=this.api.read();this.showPanel('scores',`${this.header('STANDINGS','RESUME')}<div class="touch-standings">${g.ranks.map((r,i)=>`<div class="${r.player?'you':''}"><span>${i+1}</span><b>${esc(r.name)}</b><strong>${r.score}</strong><small>${r.kills} K / ${r.deaths} D</small></div>`).join('')}</div><p class="touch-help">Finish in the top three to advance. Ties favor fewer deaths.</p>`);this.panel.querySelector('[data-close]').onclick=()=>this.back();}
 showWeapons(){this.api.suspend();const g=this.api.read();this.showPanel('weapons',`${this.header('WEAPONS','RESUME')}<div class="touch-weapons">${g.weapons.map(w=>`<button data-weapon="${w.id}" class="${w.id===g.equipped?'selected':''}">${w.icon}<span><b>${esc(w.name)}</b><small>${esc(w.label)}</small></span><strong>${w.ammo}</strong></button>`).join('')}</div>`);this.panel.querySelector('[data-close]').onclick=()=>this.back();this.panel.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>{this.api.action('weapon',Number(b.dataset.weapon));this.back();});}
 startEditor(back='settings'){
  this.api.suspend();this.clear();this.closeOverlay();this.editor={back,layout:this.layout,selected:'ads'};this.editRoot.hidden=false;this.renderEditor();
 }
 renderEditor(){
  this.editRoot.innerHTML=`<div class="editor-grid"></div><header class="editor-heading"><small>FRAGONY / ${this.settings.preset.toUpperCase()}</small><h2>YOUR HUD. YOUR RULES.</h2><span>Drag a control to reposition it</span></header><div class="editor-buttons"></div><aside class="editor-inspector"><h3></h3><label>Size <output></output><input data-edit="scale" aria-label="Selected control size" type="range" min=".65" max="1.6" step=".05"></label><label>Opacity <output></output><input data-edit="opacity" aria-label="Selected control opacity" type="range" min=".2" max="1" step=".05"></label><div class="editor-nudge"><button data-nudge="-1,0" aria-label="Move control left">←</button><button data-nudge="0,-1" aria-label="Move control up">↑</button><button data-nudge="0,1" aria-label="Move control down">↓</button><button data-nudge="1,0" aria-label="Move control right">→</button></div><label class="editor-hide"><input type="checkbox" data-hide> Hide optional control</label><p class="editor-warning" role="status"></p></aside><footer class="editor-footer"><button data-editor-reset>RESET PRESET</button><button data-editor-cancel>CANCEL</button><button data-editor-test>TRY LAYOUT</button><button class="touch-primary" data-editor-save>SAVE & USE</button></footer>`;
  this.renderEditorControls();this.selectEditor('ads');
  this.editRoot.querySelectorAll('[data-edit]').forEach(input=>input.oninput=()=>{this.editor.layout[this.editor.selected][input.dataset.edit]=Number(input.value);input.previousElementSibling.textContent=Math.round(Number(input.value)*100)+'%';this.renderEditorControls();});
  this.editRoot.querySelector('[data-hide]').onchange=e=>{this.editor.layout[this.editor.selected].hidden=e.target.checked;this.renderEditorControls();};
  this.editRoot.querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.nudge.split(',').map(Number),d=this.editor.layout[this.editor.selected],a=this.area;d.x=Math.max(0,Math.min(1,d.x+x*3/a.w));d.y=Math.max(0,Math.min(1,d.y+y*3/a.h));this.renderEditorControls();});
  this.editRoot.querySelector('[data-editor-reset]').onclick=()=>{this.editor.layout=presetLayout(this.settings.preset);this.renderEditorControls();this.selectEditor(this.editor.selected);};
  this.editRoot.querySelector('[data-editor-cancel]').onclick=()=>this.endEditor(false);
  this.editRoot.querySelector('[data-editor-save]').onclick=()=>this.endEditor(true);
  this.editRoot.querySelector('[data-editor-test]').onclick=()=>{this.endEditor(true);this.beginPractice();};
 }
 renderEditorControls(){
  if(!this.editor)return;const host=this.editRoot.querySelector('.editor-buttons');if(!host)return;host.innerHTML=Object.entries(CONTROL_DEFS).map(([id,d])=>`<button data-edit-control="${id}" aria-label="Move ${d.label}" class="touch-control ${id===this.editor.selected?'selected':''} ${this.editor.layout[id].hidden?'editor-hidden':''}">${id==='stick'?'<i></i>':icon(id)}<small>${d.label}</small></button>`).join('');
  for(const node of host.children){const id=node.dataset.editControl,r=controlRect(id,this.editor.layout,this.area,this.settings.controlScale);node.style.left=r.x+'px';node.style.top=r.y+'px';node.style.setProperty('--control-size',r.size+'px');node.style.setProperty('--control-opacity',this.editor.layout[id].opacity);node.onpointerdown=e=>{e.preventDefault();this.selectEditor(id);node.setPointerCapture(e.pointerId);node.dataset.drag=String(e.pointerId);};node.onpointermove=e=>{if(node.dataset.drag!==String(e.pointerId))return;e.preventDefault();const a=this.area,d=this.editor.layout[id];d.x=Math.max(0,Math.min(1,(e.clientX-a.x)/a.w));d.y=Math.max(0,Math.min(1,(e.clientY-a.y)/a.h));const rect=controlRect(id,this.editor.layout,a,this.settings.controlScale);node.style.left=rect.x+'px';node.style.top=rect.y+'px';};node.onpointerup=node.onpointercancel=e=>{delete node.dataset.drag;this.editorWarning();};}
  this.editorWarning();
 }
 editorWarning(){if(!this.editor)return;const pairs=layoutOverlaps(this.editor.layout,this.area,this.settings.controlScale);this.editRoot.querySelector('.editor-warning').textContent=pairs.length?'Some controls overlap. Leave room for your fingers.':'Positions stay inside the safe area.';}
 selectEditor(id){this.editor.selected=id;this.editRoot.querySelectorAll('[data-edit-control]').forEach(n=>n.classList.toggle('selected',n.dataset.editControl===id));this.editRoot.querySelector('aside h3').textContent=CONTROL_DEFS[id].label;for(const input of this.editRoot.querySelectorAll('[data-edit]')){input.value=this.editor.layout[id][input.dataset.edit];input.previousElementSibling.textContent=Math.round(Number(input.value)*100)+'%';}const hide=this.editRoot.querySelector('[data-hide]');hide.checked=this.editor.layout[id].hidden;hide.disabled=['stick','ads','jump','reload','swap'].includes(id);}
 endEditor(save){const {back,layout}=this.editor;if(save){this.layouts[this.settings.preset]=normalizeLayout(layout,this.settings.preset);this.save();}this.editor=null;this.editRoot.hidden=true;this.applyLayout();if(back==='pause')this.showPause();else this.showSettings(this.settingsBack||'menu');}
}
