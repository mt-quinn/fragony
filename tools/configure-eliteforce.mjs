import fs from 'node:fs';
import {readSourceData} from '../dist/maps/source-data.js';
import {nearBlocks,blockSpan} from '../dist/geometry.js';
import {canOccupy} from '../dist/collision.js';
const root=new URL('../',import.meta.url),ref=new URL('../../reference-maps/eliteforce-next-map-round/',import.meta.url),ids=['siege','mutiny','bravery','ef-showdown','delta-station','beta-station','forge2','forge1','blast-radius'];
const specPath=new URL('dist/maps/source-arena-specs.js',root),previous=JSON.parse(fs.readFileSync(specPath,'utf8').split('export default ')[1].trim().replace(/;$/,''));
export function fitSourcePosition(blocks,position,{maxRadius=2,maxDrop=4}={}){
 const [x,y,z]=position,candidates=[[x,z]];for(let r=.25;r<=maxRadius;r+=.25)for(let i=0;i<16;i++)candidates.push([x+Math.cos(i*Math.PI/8)*r,z+Math.sin(i*Math.PI/8)*r]);
 let best=null,bestScore=Infinity;
 for(const [xx,zz]of candidates){const floors=[];
  for(const b of nearBlocks(blocks,xx,zz,.42,y-maxDrop,y+2)){const s=blockSpan(b,xx,zz,0);if(s&&s.top<=y+.3&&s.top>=y-maxDrop)floors.push(s.top);}
  floors.sort((a,b)=>b-a);
  for(const floor of floors){if(floor<0||!canOccupy(blocks,{x:xx,z:zz,feet:floor+.003,radius:.4,height:1.9}))continue;
   let supported=true;for(let i=0;i<8;i++){const px=xx+Math.cos(i*Math.PI/4)*.32,pz=zz+Math.sin(i*Math.PI/4)*.32;if(!nearBlocks(blocks,px,pz,.01,floor-.2,floor+.1).some(b=>{const span=blockSpan(b,px,pz,0);return span&&Math.abs(span.top-floor)<.2})){supported=false;break;}}if(!supported)continue;
   const score=(xx-x)**2+(zz-z)**2+(floor-y)**2*.2;if(score<bestScore){bestScore=score;best=[xx,floor+.003,zz];}break;
  }if(best&&Math.hypot(xx-x,zz-z)>.8&&bestScore<.05)break;
 }
 return best;
}
const requested=process.argv.slice(2),specs=previous.filter(s=>!ids.includes(s.id)||requested.length&&!requested.includes(s.id));
for(const id of requested.length?requested:ids){
 const path=new URL(id+'/source-entities.json',ref);if(!fs.existsSync(path))continue;
 const audit=JSON.parse(fs.readFileSync(path)),data=await readSourceData(new URL('dist/maps/'+id+'-data.json.gz',root)),starts=[],resources=[],issues=[];
 for(const s of audit.starts){const p=fitSourcePosition(data.brushes,s.position,{maxRadius:1.5});if(!p)issues.push({kind:'spawn',...s});else starts.push({...s,sourcePosition:s.position,position:p});}
 for(const item of audit.items){const p=fitSourcePosition(data.brushes,item.position,{maxRadius:2});if(!p)issues.push({kind:'pickup',...item});else resources.push({...item,x:p[0],y:p[1],z:p[2]});}
 const occupied=[...starts.map(s=>s.position),...resources.map(p=>[p.x,p.y,p.z])],bounds={x:Math.ceil(Math.max(...occupied.map(p=>Math.abs(p[0])))+10),z:Math.ceil(Math.max(...occupied.map(p=>Math.abs(p[2])))+10)};
 // Source render/collision bounds remain untouched. Navigation bounds encompass
 // the actual architecture as well as its authored starts/resources.
 for(const b of data.brushes){if(b.w>150||b.d>150)continue;bounds.x=Math.max(bounds.x,Math.ceil(Math.abs(b.x)+b.w/2));bounds.z=Math.max(bounds.z,Math.ceil(Math.abs(b.z)+b.d/2));}
 const maxHeight=Math.min(65,Math.ceil(Math.max(...occupied.map(p=>p[1]))+6));
 const customPath=new URL(id+'/gameplay.json',ref),custom=fs.existsSync(customPath)?JSON.parse(fs.readFileSync(customPath)):{};
 const tallest=[...starts].sort((a,b)=>b.position[1]-a.position[1])[0];
 const spec={id,name:audit.source.title.toUpperCase()+(id==='ef-showdown'?' · ELITE FORCE':''),description:'Original '+audit.source.title+' architecture, with source pickup routes adapted to health.',sourceEngine:audit.source.engine,sourceFamily:'eliteforce',starts,resources,pads:[],elevators:[],lights:[tallest,...starts].slice(0,2).map(s=>({x:s.position[0],y:s.position[1]+3,z:s.position[2]})),bounds,maxHeight,floor:{w:bounds.x*2,d:bounds.z*2},camera:{position:[bounds.x*1.25,Math.max(bounds.x,bounds.z)*1.3,bounds.z*1.25],target:[0,maxHeight*.4,0]},...custom};
 specs.push(spec);fs.writeFileSync(new URL(id+'/placement-audit.json',ref),JSON.stringify({map:id,sourceStarts:audit.starts.length,sourceItems:audit.items.length,starts,resources,issues},null,2));
 console.log(id,'starts',starts.length+'/'+audit.starts.length,'pickups',resources.length+'/'+audit.items.length,'bounds',JSON.stringify(bounds),'maxHeight',maxHeight,'issues',issues.length);
 fs.writeFileSync(new URL('dist/maps/'+id+'.js',root),`import {SOURCE_ARENAS} from './source-arenas.js';\nexport default await SOURCE_ARENAS.find(m=>m.id===${JSON.stringify(id)}).load({raw:true});\n`);
}
fs.writeFileSync(specPath,'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(specs)+';\n');
