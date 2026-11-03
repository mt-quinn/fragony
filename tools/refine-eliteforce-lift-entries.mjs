import fs from'node:fs';import{SOURCE_ARENAS}from'../dist/maps/source-arenas.js';import{restoreNavigation}from'../dist/ai.js';import{canOccupy,moveCharacter}from'../dist/collision.js';
const path=new URL('../dist/maps/source-arena-specs.js',import.meta.url),specs=JSON.parse(fs.readFileSync(path,'utf8').split('export default ')[1].trim().replace(/;$/,''));
for(const id of process.argv.slice(2)){
 const map=await SOURCE_ARENAS.find(m=>m.id===id).load(),spec=specs.find(s=>s.id===id),nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);
 for(const l of spec.elevators)for(const side of ['Low','High']){const floor=side==='Low'?l.low:l.high;
  function walk(entry,reverse=false){const blocks=map.brushes.slice();blocks.triangleCollision=map.brushes.triangleCollision;blocks.push({id:'entry-probe',x:l.x,z:l.z,w:l.w,d:l.d,bottom:floor-.28,top:floor},{id:'pit-probe',x:l.x,z:l.z,w:l.pit?.w||l.w+.8,d:l.pit?.d||l.d+.8,bottom:l.low-.6,top:l.low});const start=reverse?entry:{x:l.x,y:floor,z:l.z},end=reverse?{x:l.x,y:floor,z:l.z}:entry;let body={x:start.x,z:start.z,feet:start.y+.003,radius:.4,height:1.9};if(!canOccupy(blocks,body))return false;
   for(let i=0;i<600;i++){const dx=end.x-body.x,dz=end.z-body.z,d=Math.hypot(dx,dz);if(d<.08)return Math.abs(body.feet-end.y)<.2;body=moveCharacter(blocks,body,{x:dx/d*Math.min(d,3/120),z:dz/d*Math.min(d,3/120),y:-.003},{grounded:true,bounds:map.bounds,stepHeight:map.stepHeight});if(Math.abs(body.feet-floor)>.6||body.recovery>.05)return false;}return false;
  }
  const current=l['entry'+side]||l.entry,old=nav.nodes.filter(n=>Math.abs(n.y-floor)<.35).sort((a,b)=>(a.x-current.x)**2+(a.z-current.z)**2-((b.x-current.x)**2+(b.z-current.z)**2))[0];if(old&&walk(old)&&walk(old,true))continue;
  const candidates=nav.nodes.filter(n=>Math.abs(n.y-floor)<.35&&Math.hypot(n.x-l.x,n.z-l.z)<8&&(Math.abs(n.x-l.x)>l.w/2+.3||Math.abs(n.z-l.z)>l.d/2+.3)).sort((a,b)=>Math.hypot(a.x-l.x,a.z-l.z)-Math.hypot(b.x-l.x,b.z-l.z));
  const chosen=candidates.find(n=>walk(n)&&walk(n,true));if(!chosen)throw Error('No native lift entry '+l.id+'/'+side);l['entry'+side]={x:chosen.x,z:chosen.z};if(side==='Low')l.entry=l.entryLow;console.log(l.id,side,'entry',l['entry'+side]);
 }
 const customPath=new URL('../../reference-maps/eliteforce-next-map-round/'+id+'/gameplay.json',import.meta.url),custom=JSON.parse(fs.readFileSync(customPath));fs.writeFileSync(customPath,JSON.stringify({...custom,elevators:spec.elevators},null,2));map.unload();
}
fs.writeFileSync(path,'// Validated source starts and authored gameplay placements.\nexport default '+JSON.stringify(specs)+';\n');
