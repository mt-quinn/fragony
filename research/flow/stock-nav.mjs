import fs from 'node:fs';
import {buildNavigation,nearestNode,findRoute} from '../../dist/ai.js';
import {canOccupy} from '../../dist/collision.js';
const root=new URL('./',import.meta.url),maps=JSON.parse(fs.readFileSync(new URL('maps.json',root))),summaries=[];
for(const {name}of maps.filter(m=>m.name.startsWith('hm_'))){
 const m=JSON.parse(fs.readFileSync(new URL(name+'.json',root))),points=m.points.filter(p=>['spawn','health','armor','weapon'].includes(p.k)),anchors=points.map(p=>[p.position[0],Math.max(0,p.position[1]-.75),p.position[2]]),nav=buildNavigation(m.brushes,[],null,{bounds:m.bounds,maxHeight:m.maxHeight,noGround:true,stepHeight:.57,water:m.water});
 const matched=points.map(p=>{const at={x:p.position[0],y:p.position[1]-.75,z:p.position[2]},n=nearestNode(nav,at);return {entity:p.i,class:p.c,kind:p.k,origin:p.p,position:p.position,node:n?.id,gap:n?Math.hypot(at.x-n.x,at.z-n.z,(at.y-n.y)*2):null}});
 const links=[];
 for(const b of m.triggers){const e=m.entities[b.entity];if(!e.target)continue;let ids=[b.entity],target=e;for(let count=0;count<4&&target?.target;count++){let index=m.entities.findIndex(t=>t.targetname===target.target);if(index<0)break;ids.push(index);target=m.entities[index]}
  if(!ids.some(i=>/teleport/.test(m.entities[i].classname||'')))continue;
  const p=m.points.find(p=>p.i===ids.at(-1));if(!p)continue;const from=nearestNode(nav,{x:b.x,y:(b.top+b.bottom)/2-.75,z:b.z}),to=nearestNode(nav,{x:p.position[0],y:p.position[1]-.75,z:p.position[2]});if(!from||!to)continue;from.edges.push({node:to,action:'teleport',cost:1});links.push({from:from.id,to:to.id,chain:ids});}
 const spawns=matched.filter(p=>p.kind==='spawn'&&p.gap<3),routes=[];
 // Source surfaces are a conservative proxy; report unmatched origins instead of
 // silently projecting distant endpoints or calling every sampled path playable.
 for(let i=0;i<spawns.length;i++)for(let j=i+1;j<spawns.length;j++){const a=nav.nodes[spawns[i].node],b=nav.nodes[spawns[j].node],path=findRoute(nav,a,b);if(!path.length){routes.push({from:spawns[i].entity,to:spawns[j].entity,reached:false});continue}let len=0,prev=a;const actions={};for(const p of path){len+=p.action==='teleport'?0:Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z);prev=p;actions[p.action]=(actions[p.action]||0)+1}routes.push({from:spawns[i].entity,to:spawns[j].entity,reached:true,length:len,actions,path});}
 // Connectivity without pretending that a component count is a room count.
 const indeg=nav.nodes.map(()=>0);for(const n of nav.nodes)for(const e of n.edges)indeg[e.node.id]++;
 const row={name,nodes:nav.nodes.length,edges:nav.nodes.reduce((n,a)=>n+a.edges.length,0),teleportLinks:links,matched,spawnPairs:routes.length,reachedPairs:routes.filter(r=>r.reached).length,routes};
 fs.writeFileSync(new URL(name+'-nav.json',root),JSON.stringify({...row,nodes:nav.nodes.map(n=>({id:n.id,x:n.x,y:n.y,z:n.z,edges:n.edges.map(e=>({node:e.node.id,action:e.action,cost:e.cost}))}))}));summaries.push({...row,routes:undefined,matched:undefined});fs.writeFileSync(new URL('stock-nav-summary.json',root),JSON.stringify(summaries));console.log(name,'nodes',row.nodes,'edges',row.edges,'matched',matched.filter(p=>p.gap<3).length+'/'+matched.length,'spawnpairs',row.reachedPairs+'/'+row.spawnPairs,'teleport',links.length,flush());
}
function flush(){return ''}
