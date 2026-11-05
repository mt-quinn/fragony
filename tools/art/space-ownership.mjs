// Space ownership follows the existing walk graph through doorways and stairs.
// Source surface/object assemblies receive one owner; no triangle is cut at an
// art-region coordinate boundary. Explicit author overrides remain possible.
class Queue{
 constructor(){this.items=[];}
 push(item){const a=this.items;let i=a.length;a.push(item);while(i){const p=(i-1)>>1;if(a[p].cost<=item.cost)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
 get length(){return this.items.length;}
}
export function artSpaceOwnership(nav,profile){
 const grid=new Map();for(const n of nav.nodes){const key=Math.floor(n.x/4)+','+Math.floor(n.z/4);let bucket=grid.get(key);if(!bucket){bucket=[];grid.set(key,bucket);}bucket.push(n);}
 function nearest(x,y,z){let best=null,score=Infinity,cx=Math.floor(x/4),cz=Math.floor(z/4);for(let r=0;r<=40;r++){for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(r&&Math.abs(dx)!==r&&Math.abs(dz)!==r)continue;for(const n of grid.get((cx+dx)+','+(cz+dz))||[]){const s=(n.x-x)**2+(n.z-z)**2+((n.y-y)*2.3)**2;if(s<score){score=s;best=n;}}}if(best&&score<Math.max(0,(r-1)*4)**2)break;}return best;}
 const labels=new Int16Array(nav.nodes.length).fill(-1),distances=new Float64Array(nav.nodes.length).fill(Infinity),queue=new Queue(),seeds=[];
 for(const [ai,a]of profile.areas.entries())for(const p of a.seeds){const node=nearest(...p);if(!node)throw Error('No source walk space for '+a.name);seeds.push({area:a.id,requested:p,node:[node.x,node.y,node.z],displacement:Math.hypot(p[0]-node.x,p[2]-node.z),heightDifference:Math.abs(p[1]-node.y)});if(distances[node.id]>0){distances[node.id]=0;labels[node.id]=ai;queue.push({id:node.id,cost:0});}}
 const reverse=nav.nodes.map(()=>[]);for(const n of nav.nodes)for(const e of n.edges){const distance=Math.hypot(n.x-e.node.x,n.y-e.node.y,n.z-e.node.z),cost=distance*(e.action==='walk'||e.action==='swim'?1:e.action==='jump'?1.4:2.3);reverse[e.node.id].push({id:n.id,cost});}
 while(queue.length){const {id,cost}=queue.pop();if(cost!==distances[id])continue;for(const e of reverse[id]){const next=cost+e.cost;if(next<distances[e.id]){distances[e.id]=next;labels[e.id]=labels[id];queue.push({id:e.id,cost:next});}}}
 // Disconnected source ledges retain the nearest authored space identity.
 for(const n of nav.nodes)if(labels[n.id]<0){let best=0,score=Infinity;for(const [i,a]of profile.areas.entries())for(const p of a.seeds){const s=(n.x-p[0])**2+(n.z-p[2])**2+((n.y-p[1])*2.3)**2;if(s<score){score=s;best=i;}}labels[n.id]=best;}
 function owner(assembly){const n=assembly.normal,p=assembly.center,point=[p[0]+n[0]*.8,Math.max(assembly.lo[1],p[1]-1.5),p[2]+n[2]*.8],node=nearest(...point),index=profile.overrides?.[assembly.id]??labels[node.id];return{index,area:profile.areas[index],node,floor:node.y};}
 return {labels,distances,seeds,nearest,owner};
}
