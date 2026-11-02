import fs from 'node:fs';
import {MAP} from '../dist/map.js';
const scale=8.4,originY=118,px=(x,ox)=>ox+(x+39)*scale,pz=z=>originY+(z+35)*scale;
const rect=(b,ox,fill,extra='')=>`<rect x="${px(b.x-b.w/2,ox)}" y="${pz(b.z-b.d/2)}" width="${b.w*scale}" height="${b.d*scale}" fill="${fill}" stroke="#182127" stroke-width=".7" transform="rotate(${-(b.yaw||0)*180/Math.PI},${px(b.x,ox)},${pz(b.z)})" ${extra}/>`;
const text=(x,z,t,ox,extra='')=>`<text x="${px(x,ox)}" y="${pz(z)}" ${extra}>${t}</text>`;
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="835" viewBox="0 0 1500 835"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="#667b55"/></marker></defs><rect width="1500" height="835" fill="#eef0e6"/><style>text{font-family:Arial,sans-serif;fill:#182127}.title{font-size:42px;font-weight:900;letter-spacing:-1px}.label{font-size:14px;font-weight:800;letter-spacing:1px}.small{font-size:12px}.room{font-size:12px;font-weight:800;letter-spacing:1px;paint-order:stroke;stroke:#eef0e6;stroke-width:4px;stroke-linejoin:round}</style><text x="40" y="55" class="title">TEST WORKS</text><text x="410" y="51" class="label">DEAD HEAT / ARENA GEOMETRY</text><text x="40" y="87" class="small">76 × 68 m interior · 14 spawn positions · 4 stairs · 4 jump pads · Ground / +4 m / +8 m</text>`;
for(const [ox,upper,title]of[[40,false,'GROUND / SHELTERED CIRCUITS'],[790,true,'GANTRIES + CONTROL / EXPOSED SHORTCUTS']]){
 svg+=`<text x="${ox}" y="113" class="label">${title}</text>`;
 svg+=rect({x:0,z:0,w:78,d:70},ox,upper?'#e5e9df':'#dce2d5');
 for(const a of MAP.areas)if(!upper)svg+=rect({x:a.x,z:a.z,w:a.w,d:a.d},ox,'#'+a.color.toString(16),'opacity=".18"');
 for(const b of MAP.solids){const bottom=b.y-b.h/2,top=b.y+b.h/2;
  if(b.style==='deck')svg+=rect(b,ox,upper?(top>7?'#d9ef45':'#b5c7a9'):'none',upper?'':'stroke-dasharray="4 3" opacity=".45"');
  else if(upper?top>4.1&&(bottom<5.9||bottom>=7.5&&top<=11):bottom<.1&&top>.2)svg+=rect(b,ox,b.style==='stair'?'#b1c6bb':top<1.5?'#a7b6a4':'#3f514b',upper&&bottom<.1?'opacity=".5"':'');
 }
 for(const p of MAP.pads){if(upper&&p.y===0)continue;svg+=rect({x:p.x,z:p.z,w:2.3,d:2.3},ox,'#d9ef45');svg+=`<path d="M${px(p.x,ox)} ${pz(p.z)}L${px(p.landing.x,ox)} ${pz(p.landing.z)}" stroke="#667b55" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#arrow)"/>`}
 for(const p of MAP.pickups){if(upper?p.y<3:p.y>1)continue;svg+=`<circle cx="${px(p.x,ox)}" cy="${pz(p.z)}" r="10" fill="#d9ef45" stroke="#182127" stroke-width="1.5"/>`+text(p.x,p.z+.5,p.kind==='health'?'+':p.kind==='armor'?'A':'Q',ox,'text-anchor="middle" font-size="15" font-weight="800"')}
 for(const [x,y,z]of MAP.spawns){if(upper?y<3:y>1)continue;svg+=`<circle cx="${px(x,ox)}" cy="${pz(z)}" r="3.5" fill="#eef0e6" stroke="#182127" stroke-width="1.2"/>`}
 for(const [x,z,name]of[[-26,14,'PRESS'],[-5,12,'CORE'],[25,16,'RANGE'],[-9,-32,'CONTROL'],[-6,32,'ASSEMBLY']])svg+=text(x,z,name,ox,'class="room" text-anchor="middle"');
 if(upper){svg+=text(29,-30,'+8 m',ox,'class="room" text-anchor="middle"');svg+=text(-27,-18,'+4 m',ox,'class="room" text-anchor="middle"');svg+=text(24,-6,'+4 m',ox,'class="room" text-anchor="middle"')}
}
svg+=`<text x="40" y="755" class="label">PRESS</text><text x="40" y="777" class="small">Twin presses, close turns, rim above a low route.</text><text x="40" y="800" class="small">Health below. Upper connection to the core.</text><text x="420" y="755" class="label">CORE</text><text x="420" y="777" class="small">Cross gantry over a real ground passage.</text><text x="420" y="800" class="small">Contested armor. Four directions to leave.</text><text x="800" y="755" class="label">RANGE + CONTROL</text><text x="800" y="777" class="small">Longer interrupted lanes and an exposed upper room.</text><text x="800" y="800" class="small">Armor high; health distributed elsewhere.</text><text x="1210" y="755" class="label">ASSEMBLY</text><text x="1210" y="777" class="small">Angled screens and recovery bays.</text><text x="1210" y="800" class="small">A return route around the core fight.</text><text x="40" y="826" class="small">A: ARMOR · +: HEALTH · Q: SLOW MOTION · WHITE DOT: SPAWN · DASHED OUTLINE: FLOOR ABOVE · DASHED ARROW: PAD FLIGHT</text></svg>`;
fs.writeFileSync(new URL('../docs/test-works-layout.svg',import.meta.url),svg);
