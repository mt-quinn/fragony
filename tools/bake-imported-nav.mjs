import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {buildNavigation,findRoute,nearestNode,restoreNavigation} from '../dist/ai.js';
import {moveCharacter} from '../dist/collision.js';

// Exact offline navigation for imported geometry. The browser restores these
// nodes/edges rather than rebuilding the source brush graph on a phone.
// Usage: node tools/bake-imported-nav.mjs rust [shipment]
const requested=process.argv.slice(2);
if(!requested.length||requested.some(id=>!['rust','shipment'].includes(id)))throw Error('Choose rust and/or shipment.');
const actions=['walk','jump','drop','swim','elevator','pad'];
for(const id of requested){
 const map=(await import(`../dist/maps/${id}.js`))[id.toUpperCase()],began=performance.now();
 console.log(`Building ${map.name}: ${map.brushes.length} source collision brushes, ${map.pads.length} pads, ${map.anchors.length} anchors.`);
 const nav=buildNavigation(map.brushes,map.pads,map.anchors,{bounds:map.bounds,maxHeight:map.maxHeight,noGround:!map.navigationGround,water:map.water,elevators:map.elevators,stepHeight:map.stepHeight});
 // Ground-zero source maps can otherwise retain isolated floor outside their
 // original perimeter. Keep only genuine directed edges reachable from the
 // first source spawn, exactly as source-noGround graphs do during construction.
 const unprunedNodes=nav.nodes.length;
 if(map.navigationGround){
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
 for(const [i,p]of map.pickups.entries()){const n=summarize(p);if(!n||Math.abs(n.rise)>.35||n.horizontal>1.6)issues.push({type:'pickup-node',id:p.id,index:i,source:{x:p.x,y:p.y,z:p.z},node:n});}
 const buffer=Buffer.alloc(8+nav.nodes.length*12+edges*8);buffer.writeUInt32LE(nav.nodes.length,0);buffer.writeUInt32LE(edges,4);let edgeIndex=0;
 for(const n of nav.nodes){
  if(n.x< -128||n.x>127||n.z< -128||n.z>127||n.y<0||n.y>65.535)throw Error(`Unencodable node ${JSON.stringify({x:n.x,y:n.y,z:n.z})}`);
  const i=8+n.id*12;buffer.writeInt8(n.x,i);buffer.writeInt8(n.z,i+1);buffer.writeUInt16LE(Math.round(n.y*1000),i+2);buffer.writeUInt8(n.wet?1:0,i+4);buffer.writeUInt16LE(n.edges.length,i+6);buffer.writeUInt32LE(edgeIndex,i+8);
  for(const e of n.edges){const action=actions.indexOf(e.action);if(action<0)throw Error('Unknown navigation action '+e.action);actionCounts[e.action]=(actionCounts[e.action]||0)+1;
   const padIndex=e.action==='pad'?map.pads.findIndex(p=>p.x===e.pad.x&&p.z===e.pad.z&&Math.abs((p.y||0)-e.pad.y)<.001):-1,liftIndex=e.lift?map.elevators.findIndex(l=>l.id===e.lift.id):-1;
   if(e.action==='pad'&&padIndex<0)throw Error('Pad edge missing its source definition.');if(e.node.id>=nav.nodes.length||nav.nodes[e.node.id]!==e.node)throw Error('Pruned edge points outside retained graph.');
   const j=8+nav.nodes.length*12+edgeIndex++*8;buffer.writeUInt16LE(e.node.id,j);buffer.writeUInt16LE(Math.round(e.cost*100),j+2);buffer.writeUInt8(action,j+4);buffer.writeUInt8((e.action==='pad'?padIndex:liftIndex)+1,j+5);buffer.writeUInt16LE(Math.round((e.fromY||0)*1000),j+6);
  }
 }
 const encoded=buffer.toString('base64'),restored=restoreNavigation(encoded,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads);
 if(restored.nodes.length!==nav.nodes.length||restored.nodes.reduce((sum,n)=>sum+n.edges.length,0)!==edges)throw Error('Navigation codec round-trip changed graph dimensions.');
 const encodedPads=actionCounts.pad||0;
 if(restored.pads.length!==encodedPads)throw Error('Navigation codec lost pad definitions.');
 for(const [i,n]of nav.nodes.entries())for(const [j,e]of n.edges.entries()){const copy=restored.nodes[i].edges[j];if(copy.action!==e.action||copy.node.id!==e.node.id||Math.abs(copy.cost-e.cost)>.00501)throw Error('Navigation codec changed an edge.');}
 const fingerprint=createHash('sha256').update(fs.readFileSync(new URL(`../dist/maps/${id}-data.js`,import.meta.url))).update(JSON.stringify([map.elevators,map.pads,map.anchors,map.stepHeight,map.bounds,map.maxHeight,!!map.navigationGround])).digest('hex');
 const stats={map:id,nodes:nav.nodes.length,prunedNodes:unprunedNodes-nav.nodes.length,edges,bytes:buffer.length,buildMs:Math.round(duration),spawnRoutes:connected,expectedSpawnRoutes:map.spawns.length**2,actions:actionCounts,pads:padStats,warnings,issues};
 console.log(JSON.stringify(stats,null,2));
 if(issues.length)throw Error(`${map.name}: ${issues.length} unsupported/unreachable anchor(s). Fix source wrappers or legitimate traversal; do not fake graph edges.`);
 fs.writeFileSync(new URL(`../dist/maps/${id}-nav.js`,import.meta.url),`// Generated by tools/bake-imported-nav.mjs. Source geometry + traversal fingerprint.\nexport const fingerprint=${JSON.stringify(fingerprint)};\nexport const stats=${JSON.stringify({nodes:stats.nodes,edges:stats.edges,spawnRoutes:stats.spawnRoutes,pads:padStats.length,warnings})};\nexport default ${JSON.stringify(encoded)};\n`);
 console.log(`Baked ${map.name}: ${nav.nodes.length} nodes / ${edges} edges, ${buffer.length} bytes in ${(duration/1000).toFixed(2)}s.`);
}
