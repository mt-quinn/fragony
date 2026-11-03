// Original triangle meshes stay instanced. Local BVHs select nearby source
// faces; only those faces become exact thin convex prisms for the controller.
// No render LOD is used for collision.
export class TriangleCollision{
 constructor(data,decode){
  this.models=data.models.map(m=>m.h?{h:decode(m.h,Float32Array)}:({p:decode(m.p,Float32Array),i:decode(m.i,Uint32Array),b:decode(m.b,Float32Array),l:decode(m.l,Int32Array)}));this.instances=data.instances;this.cells=new Map();this.faces=new Map();this.queries=new Map();this.faceLimit=16000;this.queryLimit=96;
  for(const [i,s]of this.instances.entries()){const b=s.bounds;for(let x=Math.floor(b[0]/4);x<=Math.floor(b[3]/4);x++)for(let z=Math.floor(b[2]/4);z<=Math.floor(b[5]/4);z++){const k=x+','+z;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(i)}}
 }
 query(x,z,r,minY=-100,maxY=100){return this.area([x-r,minY,z-r,x+r,maxY,z+r],.1);}
 face(id,t){const k=id+':'+t;let face=this.faces.get(k);if(face)return face;const s=this.instances[id],m=this.models[s.proto];if(m.h){const b=s.bounds,planes=[];for(let i=0;i<m.h.length;i+=4){const n=[m.h[i],m.h[i+1],m.h[i+2]],w=[0,1,2].map(k=>n.reduce((v,x,j)=>v+x*s.inverse[j][k],0)),d=m.h[i+3]-n.reduce((v,x,j)=>v+x*s.inverse[j][3],0),length=Math.hypot(...w);planes.push([...w.map(v=>v/length),d/length]);}face={id:'native-'+k,x:(b[0]+b[3])/2,z:(b[2]+b[5])/2,w:b[3]-b[0],d:b[5]-b[2],bottom:b[1],top:b[4],planes,movementOnly:true};this.faces.set(k,face);if(this.faces.size>this.faceLimit)this.faces.delete(this.faces.keys().next().value);return face;}const points=[];for(let j=0;j<3;j++){const v=m.i[t*3+j]*3;points.push(transform(s.matrix,[m.p[v],m.p[v+1],m.p[v+2]]));}face=prism(points,'native-'+k);if(face){this.faces.set(k,face);if(this.faces.size>this.faceLimit)this.faces.delete(this.faces.keys().next().value);}return face;}
 point(x,z,minY,maxY){return this.area([x-.00001,minY,z-.00001,x+.00001,maxY,z+.00001],.005);}
 area(input,precision=.5){
  const box=input.map((v,i)=>(i<3?Math.floor(v/precision):Math.ceil(v/precision))*precision),key=precision+':'+box.join(',');if(this.queries.has(key)){const pairs=this.queries.get(key),result=[];for(let i=0;i<pairs.length;i+=2){const face=this.face(pairs[i],pairs[i+1]);if(face)result.push(face);}return result;}
  const ids=new Set(),result=[],pairs=[];
  for(let x=Math.floor(box[0]/4);x<=Math.floor(box[3]/4);x++)for(let z=Math.floor(box[2]/4);z<=Math.floor(box[5]/4);z++)for(const id of this.cells.get(x+','+z)||[])ids.add(id);
  for(const id of ids){const s=this.instances[id];if(!overlap(s.bounds,box))continue;const m=this.models[s.proto];if(m.h){result.push(this.face(id,4294967295));pairs.push(id,4294967295);continue;}const local=transformBounds(s.inverse,box),stack=[0];
   while(stack.length){const node=stack.pop(),o=node*6;if(!overlap(m.b.subarray(o,o+6),local))continue;const left=m.l[node*2],right=m.l[node*2+1];if(left>=0){stack.push(left,right);continue;}
    for(let t=-left-1;t<-left-1+right;t++){const face=this.face(id,t);if(face&&overlap([face.x-face.w/2,face.bottom,face.z-face.d/2,face.x+face.w/2,face.top,face.z+face.d/2],box)){result.push(face);pairs.push(id,t);}}
   }
  }
  this.queries.set(key,new Uint32Array(pairs));if(this.queries.size>this.queryLimit)this.queries.delete(this.queries.keys().next().value);return result;
 }
}
function overlap(a,b){return a[0]<=b[3]+1e-5&&a[3]>=b[0]-1e-5&&a[1]<=b[4]+1e-5&&a[4]>=b[1]-1e-5&&a[2]<=b[5]+1e-5&&a[5]>=b[2]-1e-5;}
function transform(m,p){return m.map(row=>row[0]*p[0]+row[1]*p[1]+row[2]*p[2]+row[3]);}
function transformBounds(m,b){const lo=[],hi=[];for(const row of m){let a=row[3],c=row[3];for(let j=0;j<3;j++){a+=Math.min(row[j]*b[j],row[j]*b[j+3]);c+=Math.max(row[j]*b[j],row[j]*b[j+3]);}lo.push(a);hi.push(c);}return [...lo,...hi];}
function prism(v,id){
 const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),normal=a=>{const l=Math.hypot(...a);return l>1e-10?a.map(x=>x/l):null};
 const n=normal(cross(sub(v[1],v[0]),sub(v[2],v[0])));if(!n)return null;const back=v.map(p=>p.map((x,j)=>x-n[j]*.012)),all=[...v,...back],lo=[0,1,2].map(j=>Math.min(...all.map(p=>p[j]))),hi=[0,1,2].map(j=>Math.max(...all.map(p=>p[j]))),d=dot(n,v[0]),planes=[[...n,d],[...n.map(x=>-x),-d+.012]];
 for(let i=0;i<3;i++){const a=v[i],b=v[(i+1)%3],e=normal(cross(sub(b,a),n));if(!e)return null;planes.push([...e,dot(e,a)]);}
 return {id,x:(lo[0]+hi[0])/2,z:(lo[2]+hi[2])/2,w:hi[0]-lo[0],d:hi[2]-lo[2],bottom:lo[1],top:hi[1],planes,movementOnly:true};
}
