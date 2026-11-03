import {SOURCE_ARENAS} from '../dist/maps/source-arenas.js';
import {nearBlocks,blockSpan} from '../dist/geometry.js';
import {canOccupy} from '../dist/collision.js';
for(const id of process.argv.slice(2)){
 const m=await SOURCE_ARENAS.find(m=>m.id===id).load(),cells=new Map();
 for(let x=Math.ceil(-m.bounds.x);x<m.bounds.x;x+=2)for(let z=Math.ceil(-m.bounds.z);z<m.bounds.z;z+=2){
  const near=nearBlocks(m.brushes,x,z,.45,0,m.maxHeight);for(const b of near){const span=blockSpan(b,x,z,0);if(!span||span.top<3||span.top>m.maxHeight-2)continue;const y=span.top;if(!canOccupy(m.brushes,{x,z,feet:y+.01,height:1.9,radius:.4}))continue;const key=[Math.floor(x/8),Math.floor(z/8),Math.floor(y)].join(',');if(!cells.has(key))cells.set(key,[x,+y.toFixed(3),z]);}}
 console.log(id,JSON.stringify([...cells.values()]));m.unload();
}
