import assert from 'node:assert/strict';
import {settingsRows,settingsSections,settingsWorkspaceHTML,SETTINGS_CATEGORIES,SETTINGS_SECTIONS,settingID,SETTINGS_AA_PRESETS} from '../dist/settings-workspace.js';
import {graphicsOptions,EFFECT_PRESETS} from '../dist/graphics.js';
import {ControlBindings,ACTIONS} from '../dist/controls.js';
import {MOBILE_DEFAULTS} from '../dist/mobile-core.js';
import {createGameHarness} from './harness.mjs';
const all=[];
for(const input of ['Touch','Keyboard'])for(const category of SETTINGS_CATEGORIES)for(const section of settingsSections(category,input)){
 const rows=settingsRows(category,section,input);all.push(...rows);const ids=rows.filter(r=>r.type!=='action').map(settingID);assert.equal(new Set(ids).size,ids.length,`${category}/${section} has unique input IDs`);
}
const keys=new Set(all.filter(r=>r.type!=='action').map(r=>r.scope+':'+r.key));
for(const key of ['fireMode','manualFire','stickMode','focusMode','sensitivity','vertical','aimAssist','invertY','gyro','gyroSensitivity','preset','controlScale','controlOpacity'])assert.ok(keys.has('touch:'+key),'touch '+key);
for(const key of ['sensitivity','invertY','crouchToggle','hudScale','motion','minimap','minimapNorth','minimapScale','guns','steps','feedback','music'])assert.ok(keys.has('game:'+key),'game '+key);
for(const key of ['shadowQuality','shadowFilter','aoQuality','aoStrength','bloomStrength','pixelForge','pixelForgeIntensity','exposure','toneMap','vignette','grain','colorGrade','fov'])assert.ok(keys.has('graphics:'+key),'graphics '+key);
for(const key of ['resolutionScale','antialias','aaPreset','msaa','aaFilter','taa','aaStats'])assert.ok(keys.has('aa:'+key),'AA '+key);
assert.equal(Object.keys(SETTINGS_AA_PRESETS).length,6);
const actions=new Set(all.filter(r=>r.type==='action').map(r=>r.key));for(const key of ['bindings','editor','editor-minimap','gyro','benchmark','report','display-report','guide','install','practice','maps','workbench','end-practice','reset-touch','reset-graphics','reset-bindings'])assert.ok(actions.has(key),key);
const base={category:'Graphics',section:'Smoothing',input:'Touch',settings:graphicsOptions({}),touchSettings:MOBILE_DEFAULTS,touch:true,controls:new ControlBindings(),back:'play'};
for(const category of SETTINGS_CATEGORIES)for(const section of settingsSections(category,'Keyboard')){const html=settingsWorkspaceHTML({...base,category,section,input:'Keyboard'});assert.ok(html.includes('Settings categories'));assert.ok(html.includes('id="controls-back"'));assert.equal((html.match(/data-settings-category=/g)||[]).length,6);}
assert.ok(settingsWorkspaceHTML({...base,settings:{...base.settings,antialias:false}}).includes('disabled'));
assert.ok(!settingsWorkspaceHTML({...base,category:'Controls',section:'Weapons',input:'Keyboard'}).includes('Demolisher'));
const h=createGameHarness();h.setup();h.run(`renderer=null;showControls('menu');assert.equal(settingsUI.input,'Keyboard');assert.equal(settingsSection(),'General');`);
await h.run(`(async()=>{
 navigateSettings('Audio','Mix');const range=settingsRows('Audio','Mix').find(r=>r.key==='guns');
 await changeWorkspaceSetting(range,.35,{setAttribute(k,v){this[k]=v},style:{setProperty(){}}});assert.equal(settings.guns,.35);assert.equal($('value-guns').textContent,'35%');assert.equal(JSON.parse(localStorage.getItem('dh-settings')).guns,.35);
 resetSettingsSection();assert.equal(settings.guns,1);assert.ok(settingsUI.undo);navigateSettings('HUD','Comfort');undoSettingsReset();assert.equal(settings.guns,.35,'undo only restores reset keys across navigation');
 navigateSettings('HUD','Layout');await changeWorkspaceSetting(settingsRows('HUD','Layout','Keyboard')[0],2);assert.equal($('hud').style.zoom,'2');assert.equal($('hud').style.width,'50vw');
 navigateSettings('Graphics','Quality');const quality=settingsRows('Graphics','Quality');await changeWorkspaceSetting(quality.find(r=>r.key==='resolutionScale'),'0.5');
 const before={msaa:settings.msaa,filter:settings.aaFilter,resolution:settings.resolutionScale};await changeWorkspaceSetting(quality.find(r=>r.scope==='effects'),'battery');assert.equal(settings.resolutionScale,before.resolution);assert.equal(settings.msaa,before.msaa);assert.equal(settings.aaFilter,before.filter);assert.equal(settings.shadowQuality,'off');
 navigateSettings('Graphics','Smoothing');const aa=settingsRows('Graphics','Smoothing');await changeWorkspaceSetting(aa.find(r=>r.key==='aaPreset'),'hybrid');assert.equal(settings.msaa,2);assert.equal(settings.aaFilter,'smaa');assert.equal(settings.resolutionScale,.5);
 await changeWorkspaceSetting(aa.find(r=>r.key==='antialias'),false);assert.equal(settings.antialias,false);assert.equal(settings.aaFilter,'smaa');await changeWorkspaceSetting(aa.find(r=>r.key==='antialias'),true);assert.equal(settings.aaFilter,'smaa');
 resetSettingsSection();assert.equal(settings.aaFilter,'none');assert.equal(settings.resolutionScale,.5,'smoothing reset never changes resolution');undoSettingsReset();assert.equal(settings.aaFilter,'smaa');
 navigateSettings('Controls','Movement');bindingPending={id:'jump',slot:1};commitBinding('KeyW');assert.equal(bindingPending.conflicts[0].id,'forward');commitBinding('KeyW',true);assert.equal(controls.bindings.forward[0],'');assert.equal(controls.bindings.jump[1],'KeyW');assert.equal(JSON.parse(localStorage.getItem('dh-controls')).jump[1],'KeyW');
 resetSettingsSection();assert.equal(controls.bindings.forward[0],'KeyW');undoSettingsReset();assert.equal(controls.bindings.forward[0],'');
 navigateSettings('Controls','Movement');bindingPending={id:'jump',slot:1};const event={target:{closest:selector=>selector!=='[data-binding-capture]'},preventDefault(){throw Error('navigation must not be captured')}};assert.equal(captureBinding('MouseLeft',event),false);bindingPending={id:'jump',slot:1};let captured=false;captureBinding('KeyI',{target:{id:'bind-clear'},preventDefault(){captured=true}});assert.ok(captured);assert.equal(controls.bindings.jump[1],'KeyI','keyboard input works while a prompt button has focus');
 navigateSettings('Graphics','Image');navigateSettings('Audio','Mix');navigateSettings('Graphics');assert.equal(settingsSection(),'Image','last subpage is remembered');
 const campaign=JSON.stringify({round:4,credits:777});localStorage.setItem('dh-run',campaign);
 const touchSaved=[];mobile={enabled:true,settings:{...MOBILE_DEFAULTS,sensitivity:1.7},settingsBack:'menu',save(){return true},commitSettings(){touchSaved.push(JSON.stringify(this.settings));return true},applyLayout(){},clear(){},closeOverlay(){}};settingsUI.input='Touch';navigateSettings('Aim','General');
 await changeWorkspaceSetting(settingsRows('Aim','General','Touch').find(r=>r.key==='sensitivity'),1.3);assert.equal(mobile.settings.sensitivity,1.3);assert.equal(settings.sensitivity,1,'touch sensitivity stays separate');assert.equal(localStorage.getItem('dh-run'),campaign);
 await settingsAction('reset-touch');assert.equal(mobile.settings.sensitivity,1);undoSettingsReset();assert.equal(mobile.settings.sensitivity,1.3);assert.ok(touchSaved.length>=3);
 navigateSettings('Help','Support');await settingsAction('display-report');assert.equal(settingsUI.detail,'display');assert.ok(settingsHost().innerHTML.includes('readonly'),'clipboard failure has readable fallback');
 localStorage.setItem('dh-graphics-benchmark','{}');settingsUI.detail=null;await settingsAction('report');assert.ok(settingsHost().innerHTML.includes('No saved benchmark'));
 mobile=null;
})()`);
console.log(`Settings workspace: ${keys.size} preference controls, all device options/actions, six AA presets, complete binding groups/conflicts, saved values, independent touch/desktop tuning, scoped reset/undo, display fallback, malformed report, category memory and unchanged campaign data pass.`);
