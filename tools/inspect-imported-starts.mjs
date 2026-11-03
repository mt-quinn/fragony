import fs from 'node:fs';
import {canOccupy} from '../dist/collision.js';
import {nearBlocks,blockSpan} from '../dist/geometry.js';
import {supportedPosition} from '../dist/maps/imported-placements.js';
const id=process.argv[2],data=(await import('../dist/maps/'+id+'-data.js')).default;
const starts=[],issues=[];
for(const [i,s]of data.spawns.entries()){
 const [x,y,z]=s.position;let floor=-Infinity;
 for(const b of nearBlocks(data.brushes,x,z,.4)){const q=blockSpan(b,x,z,.4);if(q&&q.top<=y+.15)floor=Math.max(floor,q.top)}
 let p=Number.isFinite(floor)&&canOccupy(data.brushes,{x,z,feet:floor+.005,height:1.9,radius:.4})?[x,floor+.005,z]:null;
 if(!p){try{p=supportedPosition(data.brushes,x,Number.isFinite(floor)?floor:y,z,{radius:3})}catch{}}
 if(p&&!starts.some(t=>Math.hypot(t.position[0]-p[0],t.position[2]-p[2])<.5&&Math.abs(t.position[1]-p[1])<.3))starts.push({position:p,angle:s.angle,sourceIndex:i,adjusted:Math.hypot(p[0]-x,p[2]-z)});
 else issues.push({index:i,source:s.position,floor,reason:p?'duplicate':'unsupported'});
}
const folder=new URL('../../reference-maps/'+id+'/',import.meta.url);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(new URL('starts.json',folder),JSON.stringify({starts,issues},null,2));console.log(id,'usable starts',starts.length,'/',data.spawns.length,'issues',JSON.stringify(issues));
