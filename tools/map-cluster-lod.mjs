// Coarsen only visual indices. Every kept vertex/normal/paint/UV remains an
// original prepared vertex; exact weapon/collision geometry is independent.
export function clusterLOD(geometry,indices,grid,pinned=null){
 const p=geometry.attributes.position,n=geometry.attributes.normal,c=geometry.attributes.color,groups=new Map(),remap=new Map();
 for(const i of indices){if(remap.has(i))continue;if(pinned?.has(i)){remap.set(i,i);continue;}const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),axis=Math.abs(ny)>.5?1:Math.abs(nx)>.5?0:2,key=[Math.floor(p.getX(i)/grid),Math.floor(p.getY(i)/grid),Math.floor(p.getZ(i)/grid),Math.round(nx*4),Math.round(ny*4),Math.round(nz*4),axis,c.getX(i),c.getY(i),c.getZ(i)].join(',');let representative=groups.get(key);if(representative===undefined){representative=i;groups.set(key,i);}remap.set(i,representative);}
 const out=[],seen=new Set();for(let i=0;i<indices.length;i+=3){const a=remap.get(indices[i]),b=remap.get(indices[i+1]),c=remap.get(indices[i+2]);if(a===b||b===c||c===a)continue;const v=a<b&&a<c?[a,b,c]:b<c?[b,c,a]:[c,a,b],key=v.join(',');if(!seen.has(key)){seen.add(key);out.push(a,b,c);}}
 return {index:new Uint32Array(out),remap,error:Math.sqrt(3)*grid};
}
