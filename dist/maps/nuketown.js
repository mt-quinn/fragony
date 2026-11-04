import {withPreparedRender} from './prepared-render.js';
import navigation from './nuketown-nav.js';
import data from './nuketown-data.js';
import {sourceSpawns,sourcePickups} from './radiant-arena.js';
const spawns=sourceSpawns(data);
const pickups=sourcePickups('nuketown',data,[
 ['major',0,1,0,50],['west-yard',-58,1,0,25],['east-yard',59,1,0,25],['west-house',-29,1,0,25],['east-house',30,1,0,25],
 ...[-1,0,1,2].flatMap((v,i)=>[['west-trail-'+i,-45+v,1,-13,5],['east-trail-'+i,45-v,1,13,5],['north-trail-'+i,-8+v,1,-15,5],['south-trail-'+i,8-v,1,15,5]])
]);
export const NUKETOWN={navigation,id:'nuketown',name:'NUKETOWN',source:data.source,description:'Two source houses, upstairs firing rooms, garden flanks and the vehicle crossing, dressed as a utility campus.',brushes:data.brushes,groups:data.groups,spawns,spawnYaws:data.spawns.map(s=>(s.angle-90)*Math.PI/180),water:[],lights:[],signs:[],elevators:[],pads:[],pickups,stairs:[],solids:[],areas:[],navigationGround:false,anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z])],bounds:{x:71.5625,z:35.9375},floor:{w:143.125,d:71.875},maxHeight:24.375,stepHeight:.6,camera:{position:[68,54,59],target:[0,4,0]}};
export {data as NUKETOWN_SOURCE};

withPreparedRender(NUKETOWN);
