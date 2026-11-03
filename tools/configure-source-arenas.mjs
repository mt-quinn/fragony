import fs from 'node:fs';
import {supportedPosition} from '../dist/maps/imported-placements.js';
import {readSourceData} from '../dist/maps/source-data.js';
const configs=JSON.parse(fs.readFileSync(new URL('./source-map-config.json',import.meta.url))),specs=[];
const playableHeights={killhouse:10,vacant:7,showdown:10,firingrange:12,hijacked:18,summit:18,shoothouse:9};
const descriptions={killhouse:'Hangar training lanes, plywood partitions and the central observation tower.',vacant:'Abandoned operations offices, service corridors and the warehouse yard.',showdown:'A two-level stone courtyard with balcony flanks and four approaches.',firingrange:'Training compound, plywood houses, firing lanes and the watchtower.',hijacked:'Shipboard cabins, upper decks and the below-deck service passage.',summit:'Mountain research rooms, exposed catwalks and the cable-car approach.',shoothouse:'Three training lanes, the scrap yard, container flank and upstairs offices.'};
for(const id of ['killhouse','vacant','showdown','firingrange','hijacked','summit','shoothouse']){
 const c=configs[id],path=new URL('../../reference-maps/'+id+'/starts.json',import.meta.url);if(!c||!fs.existsSync(path))continue;
 const all=JSON.parse(fs.readFileSync(path)).starts;if(!all.length)continue;
 const data=await readSourceData(new URL('../dist/maps/'+id+'-data.json.gz',import.meta.url));
 let starts=[];
 if(all.length<=16)starts=all;else{starts=[all[0]];while(starts.length<16){const candidates=all.filter(s=>!starts.includes(s));candidates.sort((a,b)=>score(b)-score(a));starts.push(candidates[0]);}function score(s){return Math.min(...starts.map(t=>(s.position[0]-t.position[0])**2+(s.position[2]-t.position[2])**2+9*(s.position[1]-t.position[1])**2))}}
 const bounds={x:Math.ceil(Math.max(Math.abs(c.crop[0]-c.origin[0]),Math.abs(c.crop[1]-c.origin[0]))/32),z:Math.ceil(Math.max(Math.abs(c.crop[2]-c.origin[1]),Math.abs(c.crop[3]-c.origin[1]))/32)};
 const anchors=starts.map(s=>s.position),center=[...anchors].sort((a,b)=>a[0]**2+a[2]**2-b[0]**2-b[2]**2)[0],resources=[];
 const add=(resourceId,target,amount)=>{let p;const nearby=[target,...[...anchors].sort((a,b)=>Math.hypot(a[0]-target[0],a[2]-target[2])-Math.hypot(b[0]-target[0],b[2]-target[2]))];for(const candidate of nearby){for(const dy of [0,-.5,-1,-1.5,.5]){try{p=supportedPosition(data.brushes,candidate[0],candidate[1]+dy,candidate[2],{radius:4,avoid:resources,separation:.8});break}catch{}}if(p)break;}if(!p)throw Error('No supported '+resourceId+' placement on '+id+' near '+target);resources.push({id:resourceId,x:p[0],y:p[1],z:p[2],amount})};
 add('major',center,50);
 for(let i=0;i<4;i++)add('health-'+i,anchors[Math.floor(i*anchors.length/4)],25);
 for(let i=0;i<12;i++){const s=anchors[Math.floor(i*anchors.length/12)];add('trail-'+i,[s[0]+(i%3-1),s[1],s[2]+((i+1)%3-1)],5)}
 const customPath=new URL('../../reference-maps/'+id+'/gameplay.json',import.meta.url),custom=fs.existsSync(customPath)?JSON.parse(fs.readFileSync(customPath)):{};
 const fixtures=(data.modelInstances||[]).filter(m=>/light|fluor/.test(m.name));const lights=fixtures.filter((m,i)=>i===0||Math.hypot(m.position[0]-fixtures[0].position[0],m.position[2]-fixtures[0].position[2])>20).slice(0,2).map(m=>({x:m.position[0],y:m.position[1]-.15,z:m.position[2]}));
 const spec={id,name:c.title.toUpperCase(),description:descriptions[id],starts,resources,pads:[],lights,bounds,floor:{w:bounds.x*2,d:bounds.z*2},maxHeight:playableHeights[id],camera:{position:[bounds.x*1.3,Math.max(bounds.x,bounds.z),bounds.z*1.3],target:[0,5,0]},...custom};
 specs.push(spec);console.log(id,'starts',starts.length,'resources',resources.length);
}
fs.writeFileSync(new URL('../dist/maps/source-arena-specs.js',import.meta.url),'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(specs)+';\n');
