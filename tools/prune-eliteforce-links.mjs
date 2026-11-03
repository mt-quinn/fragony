import fs from 'node:fs';import{gunzipSync}from'node:zlib';
const ref=new URL('../../reference-maps/eliteforce-next-map-round/',import.meta.url),path=new URL('../dist/maps/source-arena-specs.js',import.meta.url),specs=JSON.parse(fs.readFileSync(path,'utf8').split('export default ')[1].trim().replace(/;$/,''));
for(const s of specs.filter(s=>s.sourceFamily==='eliteforce')){
 const raw=JSON.parse(gunzipSync(fs.readFileSync(new URL(s.id+'/navigation-audit.json.gz',ref)))),near=p=>{let score=Infinity,best=0;raw.forEach((n,i)=>{const d=(n[0]-p[0])**2+9*(n[1]-p[1])**2+(n[2]-p[2])**2;if(d<score){score=d;best=i}});return best},anchors=[...s.starts.map(p=>p.position),...s.resources.map(p=>[p.x,p.y,p.z])].map(near),removed=[];
 function connected(){const forward=raw.map(n=>n[3].filter(e=>!['pad','elevator'].includes(e[2])).map(e=>e[0]));
  for(const p of s.pads)forward[near([p.x,p.y,p.z])].push(near([p.landing.x,p.landing.y,p.landing.z]));
  for(const l of s.elevators){const a=near([(l.entryLow||l.entry).x,l.low,(l.entryLow||l.entry).z]),b=near([(l.entryHigh||l.entry).x,l.high,(l.entryHigh||l.entry).z]);forward[a].push(b);forward[b].push(a);}
  const back=raw.map(()=>[]);forward.forEach((es,i)=>es.forEach(j=>back[j].push(i)));
  for(const graph of [forward,back]){const q=[anchors[0]],seen=new Set(q);for(let i=0;i<q.length;i++)for(const j of graph[q[i]])if(!seen.has(j)){seen.add(j);q.push(j)}if(anchors.some(i=>!seen.has(i)))return false;}return true;
 }
 if(!connected()){console.log(s.id,'not fully connected yet; retain links');continue;}
 for(let i=s.pads.length-1;i>=0;i--){const[p]=s.pads.splice(i,1);if(!connected())s.pads.splice(i,0,p);else removed.push(p.id);}
 for(let i=s.elevators.length-1;i>=0;i--){if(s.elevators[i].id.includes('-source-platform-'))continue;const[l]=s.elevators.splice(i,1);if(!connected())s.elevators.splice(i,0,l);else removed.push(l.id);}
 const customPath=new URL(s.id+'/gameplay.json',ref),custom=JSON.parse(fs.readFileSync(customPath));fs.writeFileSync(customPath,JSON.stringify({...custom,pads:s.pads,elevators:s.elevators},null,2));
 fs.writeFileSync(new URL(s.id+'/link-pruning.json',ref),JSON.stringify({removed,pads:s.pads.length,elevators:s.elevators.length},null,2));
 console.log(s.id,'retained',s.pads.length,'pads',s.elevators.length,'lifts; removed',removed.length,'redundant links');
}
fs.writeFileSync(path,'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(specs)+';\n');
