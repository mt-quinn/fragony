import fs from 'node:fs';
const root=new URL('./',import.meta.url),dist=new URL('frozen-sim/dist/',root);
for(const name of ['original-blockouts','fragment-agent']){const source=fs.readFileSync(new URL(name+'.mjs',root),'utf8').replace(/from '\.\.\/\.\.\/dist\//g,"from '/research/flow/frozen-sim/dist/");fs.writeFileSync(new URL('browser-'+name+'.mjs',root),source);}
let code=fs.readFileSync(new URL('game.js',dist),'utf8').replace(/from '\.\//g,"from '/research/flow/frozen-sim/dist/");
const extra=`
const navCache=await(await fetch('/research/flow/exercise-cache.json')).json();
for(const m of EXERCISES){m.navigation=navCache[m.id].navigation;MAPS.push(m);const option=document.createElement('option');option.value=m.id;option.textContent=m.name+' · '+m.family;document.getElementById('map-select').appendChild(option);}
installFragmentAgent({AI:ArenaAI,route:findRoute,heal:healthAfterPickup});
init();
const study=document.createElement('aside');study.id='exercise-study';study.style.cssText='position:fixed;top:6px;left:6px;z-index:9999;background:#152127ed;color:#fff;padding:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font:12px system-ui;max-width:95vw';
study.innerHTML='<strong>RESEARCH BLOCKOUT</strong><select id="exercise-choice" aria-label="Research map"></select><select id="exercise-place" aria-label="Research viewpoint"></select><button id="exercise-inspect">Inspect</button><button id="exercise-play">Play</button><button id="exercise-turn">Turn around</button>';
document.body.append(study);const choice=document.getElementById('exercise-choice'),place=document.getElementById('exercise-place');
for(const m of EXERCISES){const op=document.createElement('option');op.value=m.id;op.textContent=m.name;choice.appendChild(op);}
function setExercise(){changeArena(choice.value);document.getElementById('map-select').value=choice.value;place.replaceChildren();for(const[i,p]of MAP.landmarks.entries()){const op=document.createElement('option');op.value=i;op.textContent=p.name;place.appendChild(op)}}
choice.onchange=setExercise;
document.getElementById('exercise-inspect').onclick=()=>{const p=MAP.landmarks[Number(place.value)],major=MAP.pickups.find(p=>p.amount===50);mode='study';locked=false;document.exitPointerLock?.();gameAudio.stopWorld();document.getElementById('menu').hidden=true;document.getElementById('panel').hidden=true;document.getElementById('hud').hidden=true;previewDummy.visible=false;weaponGroup.visible=false;for(const b of bots)b.group.visible=false;camera.fov=85;camera.updateProjectionMatrix();camera.position.set(p.x,p.y+1.7,p.z);const dx=major.x-p.x,dz=major.z-p.z;camera.lookAt(Math.hypot(dx,dz)>.5?major.x:p.x+12,major.y+1.2,Math.hypot(dx,dz)>.5?major.z:p.z-10);};
document.getElementById('exercise-turn').onclick=()=>{camera.rotation.y+=Math.PI;};
document.getElementById('exercise-play').onclick=()=>startMatch();
setExercise();
`;
code="import {EXERCISES} from '/research/flow/browser-original-blockouts.mjs';\nimport {installFragmentAgent} from '/research/flow/browser-fragment-agent.mjs';\n"+code.replace(/\ninit\(\);\s*$/,extra);
fs.writeFileSync(new URL('play-exercises.js',root),code);
let html=fs.readFileSync(new URL('index.html',dist),'utf8').replace('<head>','<head><base href="/dist/">').replace('src="game.js"','src="/research/flow/play-exercises.js"').replaceAll('./vendor/','/research/flow/frozen-sim/dist/vendor/').replace('<title>Fragony</title>','<title>Fragony original map exercises</title>');fs.writeFileSync(new URL('play-exercises.html',root),html);
console.log('Prepared local actual-game entry with six research-only maps and fragment-aware agents.');
