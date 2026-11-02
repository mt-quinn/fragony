import fs from'node:fs';
const dist=new URL('../dist/',import.meta.url);let source=fs.readFileSync(new URL('game.js',dist),'utf8');
const extra=`
init();
const review=document.createElement('aside');review.style.cssText='position:fixed;top:6px;left:6px;z-index:10000;background:#152127ed;color:#fff;padding:8px;display:flex;gap:6px;align-items:center;font:12px system-ui';
review.innerHTML='<strong>MAP REVIEW</strong><select id="review-map" aria-label="Review map"></select><select id="review-place" aria-label="Review place"></select><button id="review-inspect">Inspect</button><button id="review-turn">Turn</button><button id="review-play">Play</button>';
document.body.append(review);const choice=document.getElementById('review-map'),place=document.getElementById('review-place');for(const m of MAPS.filter(m=>m.landmarks)){const o=new Option(m.name,m.id);choice.appendChild(o)}
function refresh(){changeArena(choice.value);place.replaceChildren();for(const [i,p]of MAP.landmarks.entries())place.appendChild(new Option(p.name,i));}choice.onchange=refresh;
document.getElementById('review-inspect').onclick=()=>{mode='review';locked=false;document.exitPointerLock();gameAudio.stopWorld();for(const id of ['menu','hud','panel'])document.getElementById(id).hidden=true;previewDummy.visible=false;weaponGroup.visible=false;for(const b of bots)b.group.visible=false;const p=MAP.landmarks[Number(place.value)],major=MAP.pickups.find(p=>p.amount===50);camera.fov=85;camera.updateProjectionMatrix();camera.position.set(p.x,p.y+1.7,p.z);camera.lookAt(Math.hypot(major.x-p.x,major.z-p.z)<1?p.x+10:major.x,Math.abs(major.y-p.y)<4?major.y+1.3:p.y+1.3,Math.hypot(major.x-p.x,major.z-p.z)<1?p.z-10:major.z);};
document.getElementById('review-turn').onclick=()=>camera.rotation.y+=Math.PI;document.getElementById('review-play').onclick=()=>startMatch();refresh();
`;
source=source.replace(/\ninit\(\);\s*$/,extra);fs.writeFileSync(new URL('__arena-review.js',dist),source);fs.writeFileSync(new URL('__arena-review.html',dist),fs.readFileSync(new URL('index.html',dist),'utf8').replace('src="game.js"','src="__arena-review.js"'));
