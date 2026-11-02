import fs from 'node:fs';
import {buildNavigation,nearestNode,findRoute} from './ai-body-proxy.js';
import {canOccupy} from '../../dist/collision.js';
const root=new URL('./',import.meta.url),maps=JSON.parse(fs.readFileSync(new URL('maps.json',root))),summaries=[];
for(const {name}of maps.filter(m=>m.name.startsWith('hm_')&&(!process.argv[2]||process.argv.slice(2).includes(m.name)))){
 const m=JSON.parse(fs.readFileSync(new URL(name+'.json',root))),points=m.points.filter(p=>['spawn','health','armor','weapon'].includes(p.k)),anchors=points.map(p=>[p.position[0],Math.max(0,p.position[1]-.75),p.position[2]]),movers=[],staticBrushes=m.brushes.filter(b=>!['func_door','func_plat','func_train','func_pendulum'].includes(b.class)),nav=buildNavigation(staticBrushes,[],null,{bounds:m.bounds,maxHeight:m.maxHeight,noGround:true,stepHeight:.57,water:m.water});
 const matched=points.map(p=>{const at={x:p.position[0],y:p.position[1]-.75,z:p.position[2]},n=nearestNode(nav,at);return {entity:p.i,class:p.c,kind:p.k,origin:p.p,position:p.position,node:n?.id,gap:n?Math.hypot(at.x-n.x,at.z-n.z,(at.y-n.y)*2):null}});
 const links=[];
 for(const [entity,e]of m.entities.entries())if(e.classname==='func_plat'){
 const bs=m.brushes.filter(b=>b.entity===entity);if(!bs.length)continue;const x0=Math.min(...bs.map(b=>b.x-b.w/2)),x1=Math.max(...bs.map(b=>b.x+b.w/2)),z0=Math.min(...bs.map(b=>b.z-b.d/2)),z1=Math.max(...bs.map(b=>b.z+b.d/2)),high=Math.max(...bs.map(b=>b.top)),lowBound=Math.min(...bs.map(b=>b.bottom)),height=e.height!==undefined?Number(e.height)/32:high-lowBound-Number(e.lip||8)/32,low=high-height;
 const pick=(y)=>{const candidates=nav.nodes.filter(n=>Math.abs(n.y-y)<.65&&n.x>=x0-1&&n.x<=x1+1&&n.z>=z0-1&&n.z<=z1+1);return candidates.sort((a,b)=>Math.hypot(a.x-(x0+x1)/2,a.z-(z0+z1)/2)-Math.hypot(b.x-(x0+x1)/2,b.z-(z0+z1)/2))[0]};const from=pick(low),to=pick(high);movers.push({entity,low,high,height,sourceSpeed:e.speed,from:from?.id,to:to?.id});if(from&&to){from.edges.push({node:to,action:'source-lift',cost:height+5});to.edges.push({node:from,action:'source-lift',cost:height+5})}}

 for(const b of m.triggers){const e=m.entities[b.entity];if(!e.target)continue;let ids=[b.entity],target=e;for(let count=0;count<4&&target?.target;count++){let index=m.entities.findIndex(t=>t.targetname===target.target);if(index<0)break;ids.push(index);target=m.entities[index]}
  if(!ids.some(i=>/teleport/.test(m.entities[i].classname||'')))continue;
  const p=m.points.find(p=>p.i===ids.at(-1));if(!p)continue;const from=nearestNode(nav,{x:b.x,y:(b.top+b.bottom)/2-.75,z:b.z}),to=nearestNode(nav,{x:p.position[0],y:p.position[1]-.75,z:p.position[2]});if(!from||!to)continue;from.edges.push({node:to,action:'teleport',cost:1});links.push({from:from.id,to:to.id,chain:ids});}
 const spawns=matched.filter(p=>p.kind==='spawn'&&p.gap<3),routes=[];
 // Source surfaces are a conservative proxy; report unmatched origins instead of
 // silently projecting distant endpoints or calling every sampled path playable.
 for(let i=0;i<spawns.length;i++)for(let j=i+1;j<spawns.length;j++){const a=nav.nodes[spawns[i].node],b=nav.nodes[spawns[j].node],path=findRoute(nav,a,b);if(!path.length){routes.push({from:spawns[i].entity,to:spawns[j].entity,reached:false});continue}let len=0,prev=a;const actions={};for(const p of path){len+=p.action==='teleport'?0:Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z);prev=p;actions[p.action]=(actions[p.action]||0)+1}routes.push({from:spawns[i].entity,to:spawns[j].entity,reached:true,length:len,actions,path});}
 // Connectivity without pretending that a component count is a room count.
 const indeg=nav.nodes.map(()=>0);for(const n of nav.nodes)for(const e of n.edges)indeg[e.node.id]++;
 const row={name,moverPolicy:'open doors, platforms removed from static; authored-height links only when both landings sample',bodyProxyHeight:1.75,movers,nodes:nav.nodes.length,edges:nav.nodes.reduce((n,a)=>n+a.edges.length,0),teleportLinks:links,matched,spawnPairs:routes.length,reachedPairs:routes.filter(r=>r.reached).length,routes};
 fs.writeFileSync(new URL(name+'-open-nav.json',root),JSON.stringify({...row,nodes:nav.nodes.map(n=>({id:n.id,x:n.x,y:n.y,z:n.z,edges:n.edges.map(e=>({node:e.node.id,action:e.action,cost:e.cost}))}))}));summaries.push({...row,routes:undefined,matched:undefined});fs.writeFileSync(new URL('stock-open-nav-summary.json',root),JSON.stringify(summaries));console.log(name,'nodes',row.nodes,'edges',row.edges,'matched',matched.filter(p=>p.gap<3).length+'/'+matched.length,'spawnpairs',row.reachedPairs+'/'+row.spawnPairs,'teleport',links.length,flush());
}
function flush(){return ''}
