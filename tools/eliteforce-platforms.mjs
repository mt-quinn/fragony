import fs from 'node:fs';
import {readSourceData} from '../dist/maps/source-data.js';
import {canOccupy} from '../dist/collision.js';
import {fitSourcePosition} from './configure-eliteforce.mjs';
const root=new URL('../',import.meta.url),ref=new URL('../../reference-maps/eliteforce-next-map-round/',import.meta.url),path=new URL('dist/maps/source-arena-specs.js',root),specs=JSON.parse(fs.readFileSync(path,'utf8').split('export default ')[1].trim().replace(/;$/,''));
for(const id of process.argv.slice(2)){
 const spec=specs.find(s=>s.id===id),audit=JSON.parse(fs.readFileSync(new URL(id+'/source-entities.json',ref))),data=await readSourceData(new URL('dist/maps/'+id+'-data.json.gz',root)),lifts=[],issues=[];
 for(const e of audit.special.filter(e=>e.classname==='func_plat')){
  const lo=[Math.min(...e.boxes.map(b=>b.x-b.w/2)),Math.min(...e.boxes.map(b=>b.bottom)),Math.min(...e.boxes.map(b=>b.z-b.d/2))],hi=[Math.max(...e.boxes.map(b=>b.x+b.w/2)),Math.max(...e.boxes.map(b=>b.top)),Math.max(...e.boxes.map(b=>b.z+b.d/2))],x=(lo[0]+hi[0])/2,z=(lo[2]+hi[2])/2,high=hi[1],low=high-(e.height?+e.height/32:high-lo[1]-(+e.lip||8)/32),w=hi[0]-lo[0]-.08,d=hi[2]-lo[2]-.08;
  let blocked=false;for(let y=low+.003;y<=high;y+=.05)for(const [dx,dz]of[[0,0],[.25,0],[-.25,0],[0,.25],[0,-.25]])if(!canOccupy(data.brushes,{x:x+dx,z:z+dz,feet:y,radius:.4,height:1.9})){blocked=true;break;}
  const entryLow=fitSourcePosition(data.brushes,[x,low+.1,z],{maxRadius:6,maxDrop:.2}),entryHigh=fitSourcePosition(data.brushes,[x,high+.1,z],{maxRadius:6,maxDrop:.2});
  const def={id:id+'-source-platform-'+e.entity,x,z,w,d,low,high,boardingRadius:.25,entryLow:entryLow&&{x:entryLow[0],z:entryLow[2]},entryHigh:entryHigh&&{x:entryHigh[0],z:entryHigh[2]},pit:{w,d},sourceEntity:e.entity};def.entry=def.entryLow;
  if(blocked||!entryLow||!entryHigh){issues.push({def,blocked});console.log(id,'NEEDS REVIEW',JSON.stringify(issues.at(-1)));}else{lifts.push(def);console.log(id,'LIFT',JSON.stringify(def));}
 }
 spec.elevators=lifts;spec.precompiled=false;
 fs.writeFileSync(new URL(id+'/platform-audit.json',ref),JSON.stringify({lifts,issues},null,2));
 const custom=new URL(id+'/gameplay.json',ref),existing=fs.existsSync(custom)?JSON.parse(fs.readFileSync(custom)):{};fs.writeFileSync(custom,JSON.stringify({...existing,elevators:lifts},null,2));
}
fs.writeFileSync(path,'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(specs)+';\n');
