import {createGameHarness} from './harness.mjs';
const h=createGameHarness();h.setup();h.run(`
showControls('menu');assert.ok($('panel').innerHTML.includes('SETTINGS'));for(const name of ['Controls','Aim','HUD','Graphics','Audio','Help'])assert.ok($('panel').innerHTML.includes('data-settings-category="'+name+'"'));assert.equal(settings.hudScale,1);
const event=value=>({target:{value,style:{setProperty(){}},setAttribute(k,v){this[k]=v}}});
for(const [key,value,text]of [['guns',.35,'35%'],['steps',0,'0%'],['feedback',.75,'75%'],['music',.3,'30%'],['motion',.4,'40%'],['hudScale',2,'200%']]){navigateSettings(key==='motion'?'HUD':key==='hudScale'?'HUD':'Audio',key==='motion'?'Comfort':key==='hudScale'?'Layout':'Mix');const e=event(value);$('setting-'+key).oninput(e);assert.equal($('value-'+key).textContent,text);assert.equal(e.target['aria-valuetext'],text);assert.equal(JSON.parse(localStorage.getItem('dh-settings'))[key],value)}
assert.equal($('hud').style.zoom,'2');assert.equal($('hud').style.width,'50vw');assert.equal($('hud').style.height,'50vh');assert.equal($('hud').className,'hud-compact');
$('setting-hudScale').oninput(event(.5));assert.equal($('hud').style.width,'200vw');assert.equal($('hud').style.zoom,'0.5');assert.equal($('value-hudScale').textContent,'50%');$('setting-hudScale').oninput(event(5));assert.equal(settings.hudScale,2);$('setting-hudScale').oninput(event(.1));assert.equal(settings.hudScale,.5);
showControls('menu');assert.ok($('panel').innerHTML.includes('>50%</output>'),'reopened settings show saved value');assert.equal(JSON.parse(localStorage.getItem('dh-settings')).hudScale,.5);
`);console.log('Settings: visible categories, live values/accessible units, saved volume/motion/HUD scale, 50–200% limits and logical HUD viewport pass.');
