import navigation from './reservoir-nav.js';
import data from './reservoir-data.js';
import {surfaceAt} from '../geometry.js';
import {healthPickup} from '../pickups.js';
const floor=(x,y,z)=>surfaceAt(data.brushes,x,z,y);
const spawns=data.spawns.map(({position:[x,y,z]})=>[x,floor(x,y,z),z]);
const pickups=data.items.map(({position:[x,y,z],type},i)=>healthPickup('reservoir-source-'+i,x,floor(x,y,z),z,type.includes('medium')?25:5));
// Original small-health rows and shield pairs stay in place. The one major reward
// sits at the central weapon crossing on the exposed lower crossing, not either home base.
pickups.push(healthPickup('reservoir-major',0,14,0,50));
// FFA entries supplement the original CTF base-only spawns. Gallery, crossing
// and reservoir entries spread encounters across both routes and elevations.
spawns.push([-31,31,-8],[31,31,8],[-31,31,8],[31,31,-8],[-3,34,-6],[3,34,6],[0,13,-26],[0,13,24],[0,2,-18],[0,2,18]);
// Four shafts: the two paired base ladders and two offset central ladders. Stop heights
// follow the source ladder tops and landings. Geometry remains in BSP proportions.
const elevators=[
 {id:'north',x:0,z:-51.5,w:5.5,d:2.65,low:14,high:34,entry:{x:0,z:-48.7}},
 {id:'south',x:0,z:51.5,w:5.5,d:2.65,low:14,high:34,entry:{x:0,z:48.7}},
 {id:'center-east',x:7.45,z:-3.5,w:2.65,d:2.5,low:14,high:34,entry:{x:5.4,z:-3.5}},
 {id:'center-west',x:-7.45,z:3.5,w:2.65,d:2.5,low:14,high:34,entry:{x:-5.4,z:3.5}}
];
// Single recovery packs sit off the small-health routes. Lower packs give players
// a reason to use the reservoir passage; neither end inherits a second major.
for(const [id,x,y,z]of [['north-lower',0,14,-43],['south-lower',0,14,43],['west-gallery',-31,31,0],['east-gallery',31,31,0],['north-reservoir',0,2,-18],['south-reservoir',0,2,18]])pickups.push(healthPickup(id,x,y,z,25));
export const RESERVOIR={id:'reservoir',navigation,name:'RESERVOIR',stepHeight:.57,bounds:{x:41,z:56},floor:{w:84,d:114},maxHeight:46,stairs:[],solids:[],brushes:data.brushes,groups:data.groups,water:data.water,elevators,pads:[],pickups,spawns,spawnYaws:data.spawns.map(s=>(s.angle-90)*Math.PI/180),areas:[],anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z])],camera:{position:[36,58,50],target:[0,32,0]}};
export {data as RESERVOIR_SOURCE};
