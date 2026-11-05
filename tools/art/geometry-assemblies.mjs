// Recover connected planar source architecture across former material/district
// batches. Small closed objects are kept independent BEFORE joining planes, so
// a window frame touching a wall and roof cannot fuse those whole surfaces.
export function surfaceAssemblies(chunks){
 const offsets=new Uint32Array(chunks.length+1);for(let i=0;i<chunks.length;i++)offsets[i+1]=offsets[i]+chunks[i].index.array.length/3;
 const count=offsets[chunks.length],parents=new Int32Array(count),rank=new Uint8Array(count),objectParents=new Int32Array(count),objectRank=new Uint8Array(count),areas=new Float32Array(count),objectVertices=new Map(),objectBounds=new Map();for(let i=0;i<count;i++)parents[i]=objectParents[i]=i;
 function root(parent,i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
 function join(parent,ranks,a,b){a=root(parent,a);b=root(parent,b);if(a===b)return;if(ranks[a]<ranks[b])[a,b]=[b,a];parent[b]=a;if(ranks[a]===ranks[b])ranks[a]++;}
 const positionKey=(p,i)=>(BigInt(Math.round(p[i]*4096)+2097152)<<44n)|(BigInt(Math.round(p[i+1]*4096)+2097152)<<22n)|BigInt(Math.round(p[i+2]*4096)+2097152);
 const family=c=>c.family.split('~')[0].split('@')[0],objectFamily=f=>['paint','wood','steel','rubber','fence'].includes(f);
 // Object topology only joins within the original physical finish family.
 for(let ci=0;ci<chunks.length;ci++){const c=chunks[ci],f=family(c),p=c.attributes.position.array,ix=c.index.array;if(!objectFamily(f))continue;let vertices=objectVertices.get(f);if(!vertices){vertices=new Map();objectVertices.set(f,vertices);}
  for(let k=0;k<ix.length;k+=3){const ti=offsets[ci]+k/3;for(let j=0;j<3;j++){const key=positionKey(p,ix[k+j]*3),old=vertices.get(key);if(old!==undefined)join(objectParents,objectRank,ti,old);else vertices.set(key,ti);}}
 }
 objectVertices.clear();
 for(let ci=0;ci<chunks.length;ci++){const c=chunks[ci];if(!objectFamily(family(c)))continue;const p=c.attributes.position.array,ix=c.index.array;
  for(let k=0;k<ix.length;k+=3){const ti=offsets[ci]+k/3,r=root(objectParents,ti);let o=objectBounds.get(r);if(!o){o={lo:[Infinity,Infinity,Infinity],hi:[-Infinity,-Infinity,-Infinity],first:ti};objectBounds.set(r,o);}for(let j=0;j<3;j++)for(let q=0;q<3;q++){const v=p[ix[k+j]*3+q];o.lo[q]=Math.min(o.lo[q],v);o.hi[q]=Math.max(o.hi[q],v);}}
 }
 for(const o of objectBounds.values())o.small=Math.max(...o.hi.map((v,q)=>v-o.lo[q]))<12;
 const planes=new Map();
 for(let ci=0;ci<chunks.length;ci++){const c=chunks[ci],p=c.attributes.position.array,ix=c.index.array,n=c.attributes.normal,ns=n.normalized?1/32767:1,f=family(c),objects=objectFamily(f),opaque=!['glass','fence','rubber','light'].includes(f);
  for(let k=0;k<ix.length;k+=3){const ti=offsets[ci]+k/3,a=ix[k]*3,b=ix[k+1]*3,d=ix[k+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[d]-p[a],vy=p[d+1]-p[a+1],vz=p[d+2]-p[a+2],cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx,len=Math.hypot(cx,cy,cz);areas[ti]=len*.5;if(len<1e-10)continue;
   const object=objects?objectBounds.get(root(objectParents,ti)):null;if(object?.small){join(parents,rank,ti,object.first);continue;}
   let nx=cx/len,ny=cy/len,nz=cz/len;const sx=n.array[a]*ns,sy=n.array[a+1]*ns,sz=n.array[a+2]*ns,slen=Math.hypot(sx,sy,sz);if((nx*sx+ny*sy+nz*sz)/slen>.9999){nx=sx/slen;ny=sy/slen;nz=sz/slen;}
   // Parallel planes cannot share a position. Using their shared vertices rather
   // than rounded plane offsets also reconnects quantized old cut boundaries.
   const plane=(opaque?'architecture':f)+':'+[nx,ny,nz].map(v=>Math.round(v*10000)).join(',');let vertices=planes.get(plane);if(!vertices){vertices=new Map();planes.set(plane,vertices);}
   for(const index of [a,b,d]){const key=positionKey(p,index),old=vertices.get(key);if(old!==undefined)join(parents,rank,ti,old);else vertices.set(key,ti);}
  }
 }
 planes.clear();objectBounds.clear();const byRoot=new Map(),assemblies=[],ids=new Uint32Array(count);
 for(let ci=0;ci<chunks.length;ci++){const c=chunks[ci],p=c.attributes.position.array,n=c.attributes.normal,ix=c.index.array,ns=n.normalized?1/32767:1;
  for(let k=0;k<ix.length;k+=3){const ti=offsets[ci]+k/3,r=root(parents,ti);let id=byRoot.get(r);if(id===undefined){id=assemblies.length;byRoot.set(r,id);assemblies.push({id,family:family(c),lo:[Infinity,Infinity,Infinity],hi:[-Infinity,-Infinity,-Infinity],area:0,center:[0,0,0],normal:[0,0,0],triangles:0});}ids[ti]=id;const a=assemblies[id],w=areas[ti];a.area+=w;a.triangles++;
   for(let j=0;j<3;j++){const index=ix[k+j]*3;for(let q=0;q<3;q++){const v=p[index+q];a.lo[q]=Math.min(a.lo[q],v);a.hi[q]=Math.max(a.hi[q],v);a.center[q]+=v*w/3;a.normal[q]+=n.array[index+q]*ns*w/3;}}
  }
 }
 for(const a of assemblies){for(let q=0;q<3;q++){a.center[q]/=Math.max(a.area,1e-9);a.normal[q]/=Math.max(a.area,1e-9);}a.span=a.hi.map((v,q)=>v-a.lo[q]);}
 return {offsets,ids,assemblies,triangles:count};
}
