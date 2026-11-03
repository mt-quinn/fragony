// Shared geometry. Reservoir retains convex BSP brushes, including bevels and ramps.
// Box maps keep their original inexpensive OBB path.
export function blockSpan(b,x,z,r=0){
 if(!b.planes){const dx=x-b.x,dz=z-b.z,a=b.yaw||0,c=Math.cos(a),s=Math.sin(a);return Math.abs(c*dx-s*dz)<b.w/2+r&&Math.abs(s*dx+c*dz)<b.d/2+r?{bottom:b.bottom,top:b.top}:null}
 if(!b.yaw&&(Math.abs(x-b.x)>b.w/2+r+1e-6||Math.abs(z-b.z)>b.d/2+r+1e-6))return null;
 let bottom=b.bottom,top=b.top;
 for(const [nx,ny,nz,d] of b.planes){const q=d-nx*x-nz*z+r*Math.hypot(nx,nz);if(Math.abs(ny)<1e-7){if(q< -1e-6)return null}else if(ny>0)top=Math.min(top,q/ny);else bottom=Math.max(bottom,q/ny)}
 return bottom<=top+1e-6?{bottom,top}:null;
}
const indices=new WeakMap();
export function nearBlocks(blocks,x,z,r=1,minY=-100,maxY=100){const base=classicNearBlocks(blocks,x,z,r);return blocks.triangleCollision?base.concat(blocks.triangleCollision.query(x,z,r,minY,maxY)):base;}
function classicNearBlocks(blocks,x,z,r=1){
 if(blocks.localized||blocks.length<180)return blocks;
 let index=indices.get(blocks);
 if(!index||index.length!==blocks.length){const cells=new Map(),dynamic=[];for(const b of blocks){if(b.dynamic){dynamic.push(b);continue}const c=Math.abs(Math.cos(b.yaw||0)),s=Math.abs(Math.sin(b.yaw||0)),wx=(b.w*c+b.d*s)/2,dz=(b.w*s+b.d*c)/2;for(let ix=Math.floor((b.x-wx)/4);ix<=Math.floor((b.x+wx)/4);ix++)for(let iz=Math.floor((b.z-dz)/4);iz<=Math.floor((b.z+dz)/4);iz++){const k=ix+','+iz;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b)}}index={cells,dynamic,length:blocks.length,queries:new Map()};indices.set(blocks,index)}
 const ax=Math.floor((x-r)/4),bx=Math.floor((x+r)/4),az=Math.floor((z-r)/4),bz=Math.floor((z+r)/4),key=[ax,bx,az,bz].join(',');if(index.queries.has(key))return index.queries.get(key);const result=new Set(index.dynamic);for(let ix=ax;ix<=bx;ix++)for(let iz=az;iz<=bz;iz++)for(const b of index.cells.get(ix+','+iz)||[])result.add(b);const list=[...result];index.queries.set(key,list);return list;
}
export function inBlock(b,x,z,margin=0){return !!blockSpan(b,x,z,margin)}
export function blockedAt(blocks,x,z,feet,r=.4,height=1.7,step=.32){return nearBlocks(blocks,x,z,r,feet+step,feet+height).some(b=>{if(b.top<=feet+step||b.bottom>=feet+height)return false;const span=blockSpan(b,x,z,r);return span&&span.top>feet+step&&span.bottom<feet+height})}
export function surfaceAt(blocks,x,z,feet){let h=0;for(const b of nearBlocks(blocks,x,z,.25,-100,feet+.3)){const span=blockSpan(b,x,z,.24);if(span&&span.top<=feet+.3&&span.top>h)h=span.top}return h}
export function ceilingAt(blocks,x,z,oldFeet,newFeet,height=1.7){if(newFeet<=oldFeet)return null;let result=Infinity;for(const b of nearBlocks(blocks,x,z)){const span=blockSpan(b,x,z,.32);if(span&&span.bottom>=oldFeet+height-.01&&span.bottom<newFeet+height)result=Math.min(result,span.bottom-height)}return Number.isFinite(result)?result:null}
export function launchTime(speed,rise){return(speed+Math.sqrt(Math.max(0,speed*speed-46*rise)))/23}
