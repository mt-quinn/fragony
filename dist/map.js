import {RUST} from './maps/rust.js';
import {SHIPMENT} from './maps/shipment.js';
import {ORIGINAL_ARENAS} from './maps/original-arenas.js';
import {RESERVOIR} from './maps/reservoir.js';
import {healthPickup} from './pickups.js';
// TEST WORKS — three interlocking circuits, stacked circulation, distinct combat rooms.
// Original geometry, informed by direct slices of Q3DM7/Q3DM17 example brush maps.
const solids=[];
const box=(id,x,y,z,w,h,d,style='chalk',yaw=0)=>{const b={id,x,y,z,w,h,d,style,yaw};solids.push(b);return b};
const wall=(id,x,z,w,d,h=10,style='chalk',yaw=0)=>box(id,x,h/2,z,w,h,d,style,yaw);
const deck=(id,x,z,w,d,top=4)=>box(id,x,top-.35,z,w,.7,d,'deck');
const stairs=[];
function stair(id,x,z,dx,dz,base=0,rise=4,width=4.5){const count=Math.round(rise/.25),run=1;for(let i=0;i<count;i++){const h=(i+1)*.25;box(id+'-'+i,x+dx*i*run,base+h/2,z+dz*i*run,dx?run:width,h,dx?width:run,'stair')}stairs.push({id,points:Array.from({length:count},(_,i)=>({x:x+dx*i*run,y:base+(i+1)*.25,z:z+dz*i*run,action:'walk'})),start:{x:x-dx*1.2,y:base,z:z-dz*1.2},end:{x:x+dx*(count-1)*run,y:base+rise,z:z+dz*(count-1)*run}})}
// 76 × 68 m interior. Filled corner cuts eliminate empty perimeter pockets.
wall('north',0,-34.7,78,1.4,13,'ink');wall('south',0,34.7,78,1.4,11,'ink');wall('west',-38.7,0,1.4,69.4,11,'ink');wall('east',38.7,0,1.4,69.4,13,'ink');
wall('corner-nw',-37,-33,8,8,12,'ink',Math.PI/4);wall('corner-ne',37,-33,8,8,13,'ink',Math.PI/4);wall('corner-sw',-37,33,8,8,10,'ink',Math.PI/4);wall('corner-se',37,33,8,8,10,'ink',Math.PI/4);
// Room partitions use offset, generous portals, not a regular grid of crate lanes.
// West press-room portals at Z=-12 and Z=7; north and south circuits stay independent.
wall('press-partition-n',-13,-17,1.6,6,9);wall('press-partition-mid',-13,-3,1.6,10,9);wall('press-partition-s',-13,14,1.6,6,9);
// East range has two offset mouths and a large blind wall between them.
wall('range-partition-n',14,-15.5,1.6,9,10);wall('range-partition-mid',14,3,1.6,10,10);wall('range-partition-s',14,16.5,1.6,3,10);
// North service circuit: three room mouths, offset from its rear cross-route.
wall('north-partition-w',-35,-21,6,1.6,9);wall('north-partition-a',-15,-21,14,1.6,9);wall('north-partition-b',11,-21,10,1.6,8);wall('north-partition-e',35,-21,6,1.6,11);
// South assembly route: three entrances. No single center sightline sees the exits.
wall('south-partition-w',-37,18,2,1.6,9);wall('south-partition-a',-15,18,12,1.6,9);wall('south-partition-b',10,18,12,1.6,9);wall('south-partition-e',37,18,2,1.6,9);
// Lintels turn portals into legible room thresholds while keeping two-tier doors open.
box('press-door-high',-13,7.75,-12,1.6,2.5,6);box('press-door-low',-13,6.8,7,1.6,4.4,10);
box('range-door-high',14,8.25,-6,1.6,3.5,9);box('range-door-low',14,7.3,11.5,1.6,5.4,7);
box('control-door-west',-27,7.75,-21,10,2.5,1.6);box('control-door-core',-1,7.75,-21,14,2.5,1.6);box('control-door-range',24,12,-21,16,2,1.6);
box('assembly-door-west',-28.5,7,18,15,4,1.6);box('assembly-door-core',-2.5,7,18,13,4,1.6);box('assembly-door-east',26,7,18,20,4,1.6);
// PRESS: close/medium around a twin press, plus a high L-shaped rim and a low bypass.
deck('press-west-rim',-34,-6,6,29);deck('press-north-rim',-26,-17,22,6);deck('press-core-link',-11,-13,12,7);
wall('press-machine-a',-26,-5,4,5,7,'ink');wall('press-machine-b',-22,6,4,4,5.5,'ink');
wall('press-angle',-21,-14,5,1.6,2.4,'chalk',-.35);stair('press-stairs',-34,23,0,-1);
// CORE: vertical hub. A cross gantry passes OVER a genuine ground route.
deck('core-spine',0,-7.5,5,29);deck('core-west-arm',-5,-12,10,5);deck('core-range-arm',10,-6,20,5);
wall('core-test-column',-5,0,4,4,10,'ink');wall('core-east-screen',7,7,2.2,6,3.1,'chalk',-.3);
wall('core-pier-n',0,-15,1.2,1.2,3.3,'ink');wall('core-pier-s',0,5,1.2,1.2,3.3,'ink');
box('core-armor-dais',-4,.25,7,4,.5,4,'ink');
// RANGE: a long but interrupted duel lane; upper side balcony has exposed crossings.
deck('range-east-rim',33,-2,7,29);deck('range-bridge',24,-6,16,5);
wall('range-test-block',25,2,4,8,3.1,'ink');wall('range-target-screen',22,-15,6,1.5,6,'chalk',.25);wall('range-lower-cover',20,13,4,2,1.1);
stair('range-stairs',34,27,0,-1);
// CONTROL: north circuit at floor and 4 m, with a small 8 m observation room.
// The upper room overlooks only the range mouth; its walls block a map-wide perch.
deck('control-lower',11,-26,42,8);deck('control-upper',26,-29,18,8,8);
wall('control-west-baffle',-22,-27,2,8,6,'ink');wall('control-floor-baffle',4,-29,2,6,3,'ink');
box('control-upper-blind',20,9.5,-31,1.5,3,4,'ink');box('control-upper-cover',28,8.55,-24.5,7,1.1,1,'chalk');
stair('control-stairs',3,-30,1,0,4);stair('core-control-stairs',4,-7,0,-1);
// ASSEMBLY: outer return circuit, two angled screening walls and a sheltered health bay.
wall('assembly-west-baffle',-19,27,2,10,4.5,'ink',-.35);wall('assembly-east-baffle',15,26,2,9,4.5,'chalk',.4);
wall('assembly-center-block',-1,25,7,3,3.1,'ink');wall('assembly-west-low',-29,29,3,2,1.1);wall('assembly-east-low',27,29,4,2,1.1);
const TEST_WORKS={
 id:'testworks',elevators:[],
 name:'TEST WORKS',bounds:{x:38,z:34},floor:{w:78,d:70},maxHeight:8,stairs,solids,
 areas:[
  {name:'PRESS',x:-25,z:-3,w:24,d:34,y:0,color:0xb2c4bb},
  {name:'CORE',x:0,z:-1,w:25,d:37,y:0,color:0x94a69e},
  {name:'RANGE',x:26,z:-1,w:23,d:37,y:0,color:0xacb7ac},
  {name:'CONTROL',x:0,z:-28,w:74,d:12,y:0,color:0x819c98},
  {name:'ASSEMBLY',x:0,z:26,w:74,d:15,y:0,color:0x9ca799}
 ],
 pads:[
  {id:'press-lift',x:-27,y:0,z:-11,power:16.5,landing:{x:-29,y:4,z:-17}},
  {id:'core-lift',x:-3,y:0,z:11,power:16.5,landing:{x:0,y:4,z:2}},
  {id:'range-lift',x:27,y:0,z:13,power:16.5,landing:{x:33,y:4,z:1}},
  {id:'control-lift',x:8,y:4,z:-25,power:16.5,landing:{x:23,y:8,z:-29}}
 ],
 pickups:[
  healthPickup('core-major',-4,.5,7,50),
  healthPickup('control-health-upper',28,8,-29,25),
  healthPickup('press-health',-33,0,4,25),
  healthPickup('assembly-health',-28,0,25,25),
  healthPickup('range-health',34,4,8,25),
  healthPickup('control-health',-30,0,-29,25),
  ...[-1.5,-.5,.5,1.5].map((n,i)=>healthPickup('press-trail-'+i,-34,4,-10+n,5)),
  ...[-1.5,-.5,.5,1.5].map((n,i)=>healthPickup('range-trail-'+i,23+n,4,-6,5)),
  ...[-1.5,-.5,.5,1.5].map((n,i)=>healthPickup('assembly-trail-'+i,6+n,0,29,5)),
  {id:'assembly-focus',kind:'focus',x:28,y:0,z:27},
  {id:'core-focus',kind:'focus',x:0,y:4,z:-12}
 ],
 spawns:[[-30,0,12],[-18,0,-2],[-31,4,-18],[-30,0,-28],[-5,0,-29],[12,4,-26],[30,8,-29],[34,4,-11],[33,0,10],[21,0,-13],[29,0,26],[6,0,30],[-10,0,23],[-30,0,26]],
 anchors:[[-30,0,12],[-19,0,6],[-30,4,-17],[-30,0,-28],[-5,0,-28],[11,4,-25],[28,8,-29],[22,8,-26],[33,8,-26],[33,4,-10],[33,4,8],[33,0,10],[21,0,-13],[28,0,27],[6,0,30],[-10,0,23],[-28,0,28],[-4,.5,7],[0,4,-12],[0,4,3],[20,4,-6],[7,0,-14],[7,0,12],[-7,0,-8]]
};
export const MAPS=[TEST_WORKS,RESERVOIR,...ORIGINAL_ARENAS,RUST,SHIPMENT];
// Keep a stable object so gameplay, tests and preview tools share the selected map.
export const MAP={...TEST_WORKS};
export function selectMap(id){const chosen=MAPS.find(m=>m.id===id)||TEST_WORKS;for(const key of Object.keys(MAP))delete MAP[key];Object.assign(MAP,chosen);return MAP}
export const ALL_WEAPONS=['rifle','pistol','smg','rail','rocket','shotgun'];
export function randomWeaponPair(random=Math.random){const first=Math.floor(random()*ALL_WEAPONS.length);let second=Math.floor(random()*(ALL_WEAPONS.length-1));if(second>=first)second++;return[ALL_WEAPONS[first],ALL_WEAPONS[second]]}
