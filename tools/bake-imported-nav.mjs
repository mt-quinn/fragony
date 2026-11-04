import fs from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {sourceNavigationKey} from './source-navigation-key.mjs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {buildNavigation,findRoute,nearestNode,restoreNavigation} from '../dist/ai.js';
import {moveCharacter,canOccupy} from '../dist/collision.js';
import {createSourceArena} from '../dist/maps/source-arenas.js';
import {readSourceData} from '../dist/maps/source-data.js';

// Exact offline navigation for imported geometry. The browser restores these
// nodes/edges rather than rebuilding the source brush graph on a phone.
// Usage: node tools/bake-imported-nav.mjs rust [shipment]
const requested=process.argv.slice(2);
const sourceSpecs=(await import('../dist/maps/source-arena-specs.js')).default;
if(!requested.length||requested.some(id=>!['rust','shipment','nuketown',...sourceSpecs.map(s=>s.id)].includes(id)))throw Error('Choose an imported arena.');
const actions=['walk','jump','drop','swim','elevator','pad'];
function physicalDrop(map,from,to){
 const dt=1/40,speed=4.8,travel=Math.hypot(to.x-from.x,to.z-from.z)/speed,
  duration=travel+Math.sqrt(Math.max(0,2*(from.y-to.y)/23))+.5;
 let p={x:from.x,z:from.z,feet:from.y+.005,height:1.9,radius:.4,grounded:true},vy=0;
 if(!canOccupy(map.brushes,p))return false;
 for(let t=0;t<duration;t+=dt){
  const dx=to.x-p.x,dz=to.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);
  p=moveCharacter(map.brushes,p,{x:d?dx/d*step:0,z:d?dz/d*step:0,y:0},{grounded:Math.abs(vy)<.1,bounds:map.bounds,stepHeight:map.stepHeight});
  vy-=23*dt;p=moveCharacter(map.brushes,p,{x:0,z:0,y:vy*dt},{bounds:map.bounds,stepHeight:map.stepHeight});if(p.grounded||p.ceiling)vy=0;
  if(Math.hypot(p.x-to.x,p.z-to.z)<.55&&Math.abs(p.feet-to.y)<.16&&p.grounded)return true;
 }
 return false;
}
for(const id of requested){
 const spec=sourceSpecs.find(s=>s.id===id),imported=spec?null:await import(`../dist/maps/${id}.js`),map=spec?createSourceArena(spec,await readSourceData(new URL(`../dist/maps/${id}-data.json.gz`,import.meta.url)),null):imported.default||imported[id.toUpperCase()],began=performance.now();
 if(map.brushes.triangleCollision){map.brushes.triangleCollision.faceLimit=64000;map.brushes.triangleCollision.queryLimit=4096;}
 console.log(`Building ${map.name}: ${map.brushes.length} source collision brushes, ${map.pads.length} pads, ${map.anchors.length} anchors.`);
 const auditRoot=process.env.SOURCE_NAV_AUDIT_DIR?pathToFileURL(path.resolve(process.env.SOURCE_NAV_AUDIT_DIR,id)+'/'):new URL('../../reference-maps/'+(spec?.sourceFamily==='eliteforce'?'eliteforce-next-map-round/':'')+id+'/',import.meta.url);fs.mkdirSync(auditRoot,{recursive:true});
 const auditPath=new URL('navigation-audit.json.gz',auditRoot),auditKey=new URL('navigation-audit-key.json',auditRoot),geometryKey=sourceNavigationKey(map);let nav,reused=false;
 if(process.env.SOURCE_NAV_REUSE==='1'&&fs.existsSync(auditPath)&&fs.existsSync(auditKey)){
  const key=JSON.parse(fs.readFileSync(auditKey));if(key.geometry===geometryKey&&key.maxHeight>=map.maxHeight){
   const raw=JSON.parse(gunzipSync(fs.readFileSync(auditPath))),nodes=raw.map((n,id)=>({id,x:n[0],y:n[1],z:n[2],edges:[]}));raw.forEach((r,i)=>{nodes[i].edges=r[3].filter(e=>!['pad','elevator'].includes(e[2])).map(e=>({node:nodes[e[0]],cost:e[1],action:e[2]}))});
   nav={nodes:nodes.filter(n=>n.y<=map.maxHeight),blocks:map.brushes,pads:[],anchors:[],bounds:map.bounds,stepHeight:map.stepHeight};const keep=new Set(nav.nodes);for(const n of nav.nodes)n.edges=n.edges.filter(e=>keep.has(e.node));
   for(const p of map.pads){const from=nearestNode(nav,p),to=nearestNode(nav,p.landing);const pad={...p,y:p.y||0};from.edges.push({node:to,action:'pad',cost:Math.hypot(from.x-to.x,from.z-to.z)*.5+3,pad});nav.pads.push({from,to,...pad});}
   for(const lift of map.elevators){const from=nearestNode(nav,{...(lift.entryLow||lift.entry),y:lift.low}),to=nearestNode(nav,{...(lift.entryHigh||lift.entry),y:lift.high});if(from&&to&&Math.abs(from.y-lift.low)<.35&&Math.abs(to.y-lift.high)<.35){from.edges.push({node:to,action:'elevator',cost:8,lift,fromY:lift.low});to.edges.push({node:from,action:'elevator',cost:8,lift,fromY:lift.high});}}
   for(const a of map.anchors){const n=nearestNode(nav,{x:a[0],y:a[1],z:a[2]});if(n&&!nav.anchors.includes(n))nav.anchors.push(n);}reused=true;console.log('Reusing validated source walk/jump/drop edges.');
  }
 }
 if(!nav){
 nav=buildNavigation(map.brushes,map.pads,map.anchors,{bounds:map.bounds,maxHeight:map.maxHeight,noGround:!map.navigationGround,keepIslands:true,gridStep:map.navigationGrid||1,refinement:map.navigationRefinement,water:map.water,elevators:map.elevators,stepHeight:map.stepHeight,onProgress:(stage,count)=>console.log(id,stage,count,Math.round((performance.now()-began)/1000)+'s')});
 }
 // A sampled descending line can incorrectly promise a drop to the floor
 // directly beneath a balcony. Require an actual walk-off and native landing.
 let rejectedDrops=0;
 if(!reused&&id!=='rust')for(const n of nav.nodes)n.edges=n.edges.filter(e=>{if(e.action!=='drop'||physicalDrop(map,n,e.node))return true;rejectedDrops++;return false;});
 // Ground-zero source maps can otherwise retain isolated floor outside their
 // original perimeter. Keep only genuine directed edges reachable from the
 // first source spawn, exactly as source-noGround graphs do during construction.
 const unprunedNodes=nav.nodes.length;
 if(!reused&&!['rust','shipment','nuketown'].includes(id)){fs.writeFileSync(auditPath,gzipSync(JSON.stringify(nav.nodes.map(n=>[n.x,n.y,n.z,n.edges.map(e=>[e.node.id,e.cost,e.action,e.pad||null])]))));fs.writeFileSync(auditKey,JSON.stringify({geometry:geometryKey,maxHeight:map.maxHeight}));}
 if(true){
  // The native engine hard floor is zero. Imported triangle backing can expose
  // millimetre-negative candidate heights; those are not physical walk space.
  nav.nodes=nav.nodes.filter(n=>n.y>=0);for(const n of nav.nodes)n.edges=n.edges.filter(e=>e.node.y>=0);
  const source=map.spawns[0],start=nearestNode(nav,{x:source[0],y:source[1],z:source[2]}),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++)for(const e of queue[i].edges)if(!seen.has(e.node)){seen.add(e.node);queue.push(e.node);}nav.nodes=nav.nodes.filter(n=>seen.has(n));nav.nodes.forEach((n,i)=>n.id=i);nav.anchors=nav.anchors.filter(n=>seen.has(n));nav.pads=nav.pads.filter(p=>seen.has(p.from)&&seen.has(p.to));}
 const duration=performance.now()-began,edges=nav.nodes.reduce((sum,n)=>sum+n.edges.length,0),actionCounts={};
 if(nav.nodes.length>=65536)throw Error('Navigation node count exceeds uint16 codec.');
 const issues=[],warnings=[],summarize=p=>{const n=nearestNode(nav,p);return n?{id:n.id,x:n.x,y:n.y,z:n.z,horizontal:Math.hypot(n.x-p.x,n.z-p.z),rise:n.y-p.y}:null;};
 for(const [i,s]of map.spawns.entries()){
  const n=summarize({x:s[0],y:s[1],z:s[2]});if(!n||Math.abs(n.rise)>.35||n.horizontal>1.6){
   // The supplied Rust spawn2 sits on a narrow original ledge between grid
   // centres. Preserve it only if the native controller can jump to the graph.
   let recovery=false;if(id==='rust'&&i===2&&Math.abs(s[0]+18.875)<.001&&Math.abs(s[2]+2.84375)<.001&&n&&n.horizontal<1&&n.rise>0&&n.rise<1.1){
    let p={x:s[0],feet:s[1],z:s[2],radius:.4,height:1.9},vy=6.5;
    for(let frame=0;frame<600;frame++){const dx=n.x-p.x,dz=n.z-p.z,d=Math.hypot(dx,dz);vy-=23/120;p=moveCharacter(map.brushes,p,{x:dx/Math.max(d,1)*4.5/120,y:vy/120,z:dz/Math.max(d,1)*4.5/120},{grounded:!!p.grounded,bounds:map.bounds});if(p.grounded||p.ceiling)vy=0;if(Math.hypot(p.x-n.x,p.z-n.z)<.16&&Math.abs(p.feet-n.y)<.16){recovery=true;break;}}
   }
   (recovery?warnings:issues).push({type:'spawn-node',index:i,source:s,node:n,...recovery?{verified:'Native 6.5m/s recovery jump leaves the original narrow ledge.'}:{}});
  }
 }
 let connected=0;for(const a of map.spawns)for(const b of map.spawns){if(findRoute(nav,{x:a[0],y:a[1],z:a[2]},{x:b[0],y:b[1],z:b[2]}).length)connected++;else issues.push({type:'spawn-route',from:a,to:b});}
 const padStats=map.pads.map(p=>{const from=summarize(p),to=summarize(p.landing),edge=nav.nodes.flatMap(n=>n.edges).find(e=>e.action==='pad'&&e.pad.x===p.x&&e.pad.z===p.z&&Math.abs(e.pad.y-(p.y||0))<.001);if(!edge||!from||!to||from.horizontal>1.6||to.horizontal>1.6||Math.abs(from.rise)>.35||Math.abs(to.rise)>.35)issues.push({type:'pad-edge',id:p.id,from,to});return{id:p.id,from,to,encoded:!!edge};});
 const elevatorStats=map.elevators.map(l=>{const edges=nav.nodes.flatMap(n=>n.edges).filter(e=>e.action==='elevator'&&e.lift.id===l.id);if(edges.length!==2)issues.push({type:'elevator-edges',id:l.id,count:edges.length});return {id:l.id,edges:edges.length};});
 for(const [i,p]of map.pickups.entries()){const n=summarize(p);if(!n||Math.abs(n.rise)>.35||n.horizontal>1.6)issues.push({type:'pickup-node',id:p.id,index:i,source:{x:p.x,y:p.y,z:p.z},node:n});}
 const wide=map.navigationGrid===.5,nodeBytes=wide?16:12,buffer=Buffer.alloc(8+nav.nodes.length*nodeBytes+edges*8);buffer.writeUInt32LE(wide?(nav.nodes.length|0x80000000)>>>0:nav.nodes.length,0);buffer.writeUInt32LE(edges,4);let edgeIndex=0;
 for(const n of nav.nodes){
  if(n.x< -128||n.x>127||n.z< -128||n.z>127||n.y<0||n.y>65.535)throw Error(`Unencodable node ${JSON.stringify({x:n.x,y:n.y,z:n.z})}`);
  const i=8+n.id*nodeBytes;if(wide){buffer.writeInt16LE(Math.round(n.x*2),i);buffer.writeInt16LE(Math.round(n.z*2),i+2);}else{buffer.writeInt8(n.x,i);buffer.writeInt8(n.z,i+1);}buffer.writeUInt16LE(Math.round(n.y*1000),i+(wide?4:2));buffer.writeUInt8(n.wet?1:0,i+(wide?6:4));buffer.writeUInt16LE(n.edges.length,i+(wide?8:6));buffer.writeUInt32LE(edgeIndex,i+(wide?12:8));
  for(const e of n.edges){const action=actions.indexOf(e.action);if(action<0)throw Error('Unknown navigation action '+e.action);actionCounts[e.action]=(actionCounts[e.action]||0)+1;
   const padIndex=e.action==='pad'?map.pads.findIndex(p=>p.x===e.pad.x&&p.z===e.pad.z&&Math.abs((p.y||0)-e.pad.y)<.001):-1,liftIndex=e.lift?map.elevators.findIndex(l=>l.id===e.lift.id):-1;
   if(e.action==='pad'&&padIndex<0)throw Error('Pad edge missing its source definition.');if(e.node.id>=nav.nodes.length||nav.nodes[e.node.id]!==e.node)throw Error('Pruned edge points outside retained graph.');
   const j=8+nav.nodes.length*nodeBytes+edgeIndex++*8;buffer.writeUInt16LE(e.node.id,j);buffer.writeUInt16LE(Math.round(e.cost*100),j+2);buffer.writeUInt8(action,j+4);buffer.writeUInt8((e.action==='pad'?padIndex:liftIndex)+1,j+5);buffer.writeUInt16LE(Math.round((e.fromY||0)*1000),j+6);
  }
 }
 const encoded=buffer.toString('base64'),restored=restoreNavigation(encoded,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);
 if(restored.nodes.length!==nav.nodes.length||restored.nodes.reduce((sum,n)=>sum+n.edges.length,0)!==edges)throw Error('Navigation codec round-trip changed graph dimensions.');
 const encodedPads=actionCounts.pad||0;
 if(restored.pads.length!==encodedPads)throw Error('Navigation codec lost pad definitions.');
 for(const [i,n]of nav.nodes.entries())for(const [j,e]of n.edges.entries()){const copy=restored.nodes[i].edges[j];if(copy.action!==e.action||copy.node.id!==e.node.id||Math.abs(copy.cost-e.cost)>.00501)throw Error('Navigation codec changed an edge.');}
 const dataFile=new URL(`../dist/maps/${id}-data.json.gz`,import.meta.url),fingerprint=createHash('sha256').update(fs.readFileSync(fs.existsSync(dataFile)?dataFile:new URL(`../dist/maps/${id}-data.js`,import.meta.url))).update(JSON.stringify([map.elevators,map.pads,map.anchors,map.stepHeight,map.bounds,map.maxHeight,!!map.navigationGround,...(map.navigationGrid||map.navigationRefinement?[map.navigationGrid||1,map.navigationRefinement||null]:[])])).digest('hex');
 const stats={map:id,nodes:nav.nodes.length,prunedNodes:unprunedNodes-nav.nodes.length,rejectedDrops,edges,bytes:buffer.length,buildMs:Math.round(duration),spawnRoutes:connected,expectedSpawnRoutes:map.spawns.length**2,actions:actionCounts,pads:padStats,elevators:elevatorStats,warnings,issues};
 fs.writeFileSync(new URL('navigation-results.json',auditRoot),JSON.stringify(stats,null,2));
 console.log(JSON.stringify(stats,null,2));
 if(issues.length)throw Error(`${map.name}: ${issues.length} unsupported/unreachable anchor(s). Fix source wrappers or legitimate traversal; do not fake graph edges.`);
 fs.writeFileSync(new URL(`../dist/maps/${id}-nav.js`,import.meta.url),`// Generated by tools/bake-imported-nav.mjs. Source geometry + traversal fingerprint.\nexport const fingerprint=${JSON.stringify(fingerprint)};\nexport const stats=${JSON.stringify({nodes:stats.nodes,edges:stats.edges,spawnRoutes:stats.spawnRoutes,pads:padStats.length,warnings})};\nexport default ${JSON.stringify(encoded)};\n`);
 console.log(`Baked ${map.name}: ${nav.nodes.length} nodes / ${edges} edges, ${buffer.length} bytes in ${(duration/1000).toFixed(2)}s.`);
}
