// Exact position connectivity recovers assemblies without depending on the
// original engine's material batching. Source arrays are never modified.
export function connectedComponents(chunk,index=chunk.drawIndex||chunk.index.array,tolerance=0){
 const p=chunk.attributes.position.array,parent=new Int32Array(p.length/3).fill(-1),at=new Map(),grid=new Map();
 const find=i=>{let root=i;while(parent[root]!==root)root=parent[root];while(parent[i]!==i){const next=parent[i];parent[i]=root;i=next;}return root;};
 for(const i of index){if(parent[i]!==-1)continue;parent[i]=i;const key=p[i*3]+','+p[i*3+1]+','+p[i*3+2],old=at.get(key);if(old!==undefined){parent[i]=find(old);continue;}at.set(key,i);if(tolerance){const cell=[0,1,2].map(k=>Math.floor(p[i*3+k]/tolerance));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const nearby=grid.get((cell[0]+x)+','+(cell[1]+y)+','+(cell[2]+z));if(nearby)for(const j of nearby)if(Math.hypot(p[i*3]-p[j*3],p[i*3+1]-p[j*3+1],p[i*3+2]-p[j*3+2])<=tolerance)parent[find(j)]=find(i);}const key=cell.join(',');let list=grid.get(key);if(!list){list=[];grid.set(key,list);}list.push(i);}}
 for(let k=0;k<index.length;k+=3){const a=find(index[k]);parent[find(index[k+1])]=a;parent[find(index[k+2])]=a;}
 const groups=new Map();for(let k=0;k<index.length;k+=3){const root=find(index[k]);let list=groups.get(root);if(!list){list=[];groups.set(root,list);}list.push(index[k],index[k+1],index[k+2]);}
 return [...groups.values()].map(indices=>{const vertices=[...new Set(indices)],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const i of vertices)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[i*3+k]);max[k]=Math.max(max[k],p[i*3+k]);}return{index:new Uint32Array(indices),vertices,min,max};});
}

export function flattenChunks(chunks){
 const families=[...new Set(chunks.map(c=>c.family))],count=chunks.reduce((n,c)=>n+c.attributes.position.array.length/3,0),attributes={position:{array:new Float32Array(count*3),size:3},normal:{array:new Int16Array(count*3),size:3,normalized:true},color:{array:new Uint8Array(count*3),size:3,normalized:true},uv:{array:new Float32Array(count*2),size:2},family:{array:new Uint16Array(count),size:1}},index=new Uint32Array(chunks.reduce((n,c)=>n+c.index.array.length,0));let vertex=0,at=0;const offsets=[];
 for(const c of chunks){offsets.push(vertex);const n=c.attributes.position.array.length/3;for(const key of ['position','normal','color','uv'])attributes[key].array.set(c.attributes[key].array,vertex*attributes[key].size);attributes.family.array.fill(families.indexOf(c.family),vertex,vertex+n);for(const i of c.index.array)index[at++]=i+vertex;vertex+=n;}return{attributes,index:{array:index},families,offsets};
}

export function isClosedComponent(scene,part){
 const p=scene.attributes.position.array,ids=new Map(),positions=new Map(),edges=new Map();let next=0,volume=0;
 for(const i of part.vertices){const key=p[i*3]+','+p[i*3+1]+','+p[i*3+2];let id=positions.get(key);if(id===undefined){id=next++;positions.set(key,id);}ids.set(i,id);}
 for(let i=0;i<part.index.length;i+=3){const vs=[part.index[i],part.index[i+1],part.index[i+2]],v=vs.map(j=>ids.get(j));if(new Set(v).size<3)continue;for(let e=0;e<3;e++){const a=v[e],b=v[(e+1)%3],key=Math.min(a,b)+','+Math.max(a,b);let pair=edges.get(key);if(!pair){pair={count:0,winding:0};edges.set(key,pair);}pair.count++;pair.winding+=a<b?1:-1;}const [a,b,c]=vs.map(j=>[p[j*3]-part.min[0],p[j*3+1]-part.min[1],p[j*3+2]-part.min[2]]);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
 return [...edges.values()].every(e=>e.count===2&&e.winding===0)&&volume>1e-8;
}
