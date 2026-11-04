import {withPreparedRender} from './prepared-render.js';
import navigation from './shipment-nav.js';
import data from './shipment-data.js';
import {sourceSpawns,sourcePickups} from './radiant-arena.js';
const spawns=sourceSpawns(data);
const pickups=sourcePickups('shipment',data,[
 ['major',0,0,0,50],['north',-3,0,-20,25],['south',-4,0,20,25],['west',-22,0,1,25],['east',22,0,2,25],
 ...[-1,0,1].flatMap((v,i)=>[['north-trail-'+i,-5+v*.9,0,-18,5],['south-trail-'+i,8+v*.9,0,18,5],['west-trail-'+i,-20,0,-3+v*.9,5],['east-trail-'+i,20,0,3+v*.9,5]])
]);
export const SHIPMENT={navigation,id:'shipment',name:'SHIPMENT',source:data.source,description:'Stock Shipment: compact crossing lanes, original open containers and perimeter loading routes.',brushes:data.brushes,groups:data.groups,spawns,spawnYaws:data.spawns.map(s=>(s.angle-90)*Math.PI/180),water:[],lights:[],signs:[],elevators:[],pads:[],pickups,stairs:[],solids:[],areas:[],navigationGround:false,anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z])],bounds:{x:26.5,z:27},floor:{w:53,d:54},maxHeight:16,stepHeight:.6,camera:{position:[34,32,34],target:[0,2,0]}};
export {data as SHIPMENT_SOURCE};

withPreparedRender(SHIPMENT);
