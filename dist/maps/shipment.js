import navigation from './shipment-nav.js';
import data from './shipment-data.js';
import {healthPickup} from '../pickups.js';
import {supportedPosition} from './imported-placements.js';
import {blockSpan} from '../geometry.js';
// Exact supplied Shipment2 layout; industrial materials and jump pads are an
// adaptation layered on the original playable geometry, never a hand remake.
const spawns=data.spawns.map(({position:[x,y,z]})=>{let floor=0;for(const b of data.brushes){const span=blockSpan(b,x,z,.4);if(span&&span.top<=y+.3&&span.top>floor)floor=span.top;}return[x,floor,z]});
const pads=[
 {id:'shipment-west-stack',x:-30,y:.007981,z:-16,power:19,triggerRadius:.75,size:1.9,landing:{x:-19,y:7.5,z:-2.5}},
 {id:'shipment-northeast-stack',x:14,y:.0125,z:-22,power:19,triggerRadius:.75,size:1.9,landing:{x:6,y:7.5625,z:-12}},
 {id:'shipment-door-access',x:-4,y:0,z:8,power:14,triggerRadius:.75,size:1.9,landing:{x:1.5,y:3.75,z:7.9}},
 {id:'shipment-south-flank',x:13,y:.039808,z:25,power:15,triggerRadius:.75,size:1.9,landing:{x:13,y:3.75,z:30}}
];
const pickups=[],place=(x,y,z)=>supportedPosition(data.brushes,x,y,z,{ground:true,avoid:pickups,separation:.65});
for(const [id,x,y,z,amount]of[['major',0,0,0,50],['north',-10,0,-30,25],['south',-9,0,28,25],['west',-28,0,9,25],['east',22,0,7,25]]){const p=place(x,y,z);pickups.push(healthPickup('shipment-'+id,p[0],p[1],p[2],amount));}
for(const [i,pad]of pads.entries())for(let j=0;j<3;j++){const p=place(pad.x+(j-1)*.7,pad.y,pad.z+2);pickups.push(healthPickup('shipment-trail-'+i+'-'+j,p[0],p[1],p[2],5));}
export const SHIPMENT={navigation,id:'shipment',name:'SHIPMENT',source:data.source,description:'The supplied Shipment2 container yard: original lanes, open containers, stacked roofs and perimeter service paths.',brushes:data.brushes,groups:data.groups,spawns,spawnYaws:data.spawns.map(s=>(s.angle-90)*Math.PI/180),water:[],lights:[],signs:[],elevators:[],pads,pickups,stairs:[],solids:[],areas:[],navigationGround:true,anchors:[...spawns,...pads.flatMap(p=>[[p.x,p.y,p.z],[p.landing.x,p.landing.y,p.landing.z]]),...pickups.map(p=>[p.x,p.y,p.z])],bounds:{x:37,z:40.5},floor:{w:78,d:86},maxHeight:9,stepHeight:.45,camera:{position:[49,47,51],target:[0,3,0]}};
export {data as SHIPMENT_SOURCE};
