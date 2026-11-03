import {blockSpan,nearBlocks} from '../geometry.js';
import {supportedPosition} from './imported-placements.js';
import {healthPickup} from '../pickups.js';
export function sourceSpawns(data){return data.spawns.map(({position:[x,y,z]})=>{
 let floor=-Infinity;for(const b of nearBlocks(data.brushes,x,z,.4)){const s=blockSpan(b,x,z,.4);if(s&&s.top<=y+.1)floor=Math.max(floor,s.top);}
 if(!Number.isFinite(floor))throw Error('Unsupported source spawn '+[x,y,z]);return [x,Math.max(0,floor)+.002,z];
});}
export function sourcePickups(id,data,placements){const pickups=[];for(const [name,x,y,z,amount]of placements){const p=supportedPosition(data.brushes,x,y,z,{radius:5,avoid:pickups,separation:.65});pickups.push(healthPickup(id+'-'+name,...p,amount));}return pickups;}
