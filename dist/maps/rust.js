import navigation from './rust-nav.js';
import data from './rust-data.js';
import {healthPickup} from '../pickups.js';
import {canOccupy} from '../collision.js';
import {blockSpan,nearBlocks} from '../geometry.js';
const grounded=({position:[x,y,z]})=>{let floor=0;for(const b of nearBlocks(data.brushes,x,z,.4)){const span=blockSpan(b,x,z,.4);if(span&&span.top<=y+.3)floor=Math.max(floor,span.top);}return[x,floor+.001,z];};
const pads=[
 {id:'rust-south-entry',x:-5,y:1.025556,z:7.5,power:23,triggerRadius:.75,size:1.9,landing:{x:.5,y:8.25,z:3}},
 {id:'rust-north-entry',x:11,y:1.30069,z:-17,power:21,triggerRadius:.75,size:1.9,landing:{x:6,y:8.25,z:-10.5}},
 {id:'rust-crossdeck',x:3,y:8.25,z:2.5,power:18,triggerRadius:.75,size:1.9,landing:{x:1,y:14.375,z:-8.5}},
 {id:'rust-summit',x:4,y:14.375,z:-10,power:17.5,triggerRadius:.75,size:1.9,landing:{x:6,y:20.65625,z:-2.5}}
];
function supported(x,y,z){let best=null,score=Infinity;for(let dx=-3;dx<=3;dx+=.5)for(let dz=-3;dz<=3;dz+=.5){const xx=x+dx,zz=z+dz,near=nearBlocks(data.brushes,xx,zz,.4);let floor=-Infinity;for(const b of near){const span=blockSpan(b,xx,zz,.4);if(span&&span.top<=y+.4)floor=Math.max(floor,span.top);}if(!Number.isFinite(floor)||Math.abs(floor-y)>1.2||!canOccupy(data.brushes,{x:xx,z:zz,feet:floor+.002,height:1.9,radius:.4}))continue;const s=dx*dx+dz*dz+(floor-y)**2*4;if(s<score){score=s;best=[xx,floor+.002,zz];}}if(!best)throw Error('No supported Rust pickup near '+[x,y,z]);return best;}
const pickups=[];
for(const [id,x,y,z,amount]of[['major',1,14.375,-8.5,50],['west',-24,1,1,25],['east',25,1,8,25],['north',10,1,-25,25],['south',6,1,25,25]]){const p=supported(x,y,z);pickups.push(healthPickup('rust-'+id,p[0],p[1],p[2],amount));}
for(const [i,pad]of pads.entries())for(let j=0;j<3;j++){const p=supported(pad.x+(j-1)*.7,pad.y,pad.z+1.5);pickups.push(healthPickup('rust-trail-'+i+'-'+j,p[0],p[1],p[2],5));}
const spawns=data.spawns.map(grounded);
export const RUST={navigation,id:'rust',name:'RUST',description:'Original supplied Rust layout: refinery service yard, process tower and container perimeter.',bounds:{x:39,z:38},floor:{w:80,d:80},maxHeight:40,stepHeight:.57,brushes:data.brushes,groups:data.groups,water:[],stairs:[],solids:[],elevators:[],pads,pickups,spawns,spawnYaws:data.spawns.map(s=>(s.angle-90)*Math.PI/180),areas:[],anchors:[...spawns,...pads.flatMap(p=>[[p.x,p.y,p.z],[p.landing.x,p.landing.y,p.landing.z]]),...pickups.map(p=>[p.x,p.y,p.z])],camera:{position:[51,47,49],target:[2,8,0]}};
export {data as RUST_SOURCE};
