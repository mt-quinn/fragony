import * as THREE from './vendor/three.module.js';
import Clipper from './vendor/clipper.module.js';
const EPS=1/4096+1e-7,Q=4096;
// Partition coverage by physical plane and finish, then triangulate its exact
// exterior contours/holes. Redundant surfaces disappear; curves and collisions
// are untouched. Opposing coincident finishes render on their respective sides.
export function cleanCoplanarSurfaces(groups){
 const planes=new Map(),writers=new Map(),pass=[];let originalArea=0,overlaps=0,outputArea=0;
 function write(key,family,v){let b=writers.get(key);if(!b){b={family,p:[],n:[],c:[],uv:[]};writers.set(key,b);}for(const a of v){b.p.push(...a.slice(0,3));b.n.push(...a.slice(3,6));b.c.push(...a.slice(6,9));b.uv.push(...a.slice(9,11));}}
 for(const [bucket,{family,geometry:g}]of groups.entries()){
  const pos=g.attributes.position,count=g.index?g.index.count:pos.count,read=i=>{const j=g.index?g.index.array[i]:i;return['position','normal','color','uv'].flatMap(k=>Array.from({length:g.attributes[k].itemSize},(_,n)=>g.attributes[k].getComponent(j,n)));};
  for(let i=0;i<count;i+=3){const v=[read(i),read(i+1),read(i+2)],u=sub(v[1],v[0]),w=sub(v[2],v[0]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...n);if(len<1e-12)continue;originalArea+=len/2;for(let k=0;k<3;k++)n[k]/=len;
   const axis=n.map(x=>Math.round(Math.abs(x)*10000)).indexOf(Math.max(...n.map(x=>Math.round(Math.abs(x)*10000)))),axes=[0,1,2].filter(k=>k!==axis),sign=n[[0,1,2].find(k=>!axes.includes(k))]>0?1:-1,d=n.reduce((s,x,k)=>s+x*v[0][k],0),flat=!['glass','fence'].includes(family.split('@')[0])&&v.every(a=>Math.abs(a[3]*n[0]+a[4]*n[1]+a[5]*n[2])>.9999&&[3,4,5,6,7,8].every(k=>Math.abs(a[k]-v[0][k])<1e-6));
   if(!flat){pass.push({bucket,family,v,area:len/2});continue;}
   const planeKey=n.map(x=>Math.round(x*sign*1000000)).join(',')+':'+Math.round(d*sign/EPS),plane=planes.get(planeKey)||new Map();if(!planes.has(planeKey))planes.set(planeKey,plane);
   const key=bucket+':'+sign+':'+v[0].slice(3,6).map(x=>Math.round(x*100000)).join(',')+':'+v[0].slice(6,9).map(x=>Math.round(x*255)).join(','),s=plane.get(key)||{bucket,family,sign,axes,ref:v,refArea:len/2,triangles:[],area:0};if(!plane.has(key))plane.set(key,s);s.area+=len/2;if(len/2>s.refArea){s.ref=v;s.refArea=len/2;}s.triangles.push([v.map(a=>axes.map(k=>Math.round(a[k]*Q)/Q))]);
  }
 }
 const priority={light:9,paint:8,wood:7,tile:6,brick:5,coated:4,steel:3,rubber:2,concrete:1,asphalt:0};
 for(const sets of planes.values()){
  if(sets.size===1){const s=sets.values().next().value;if(s.triangles.length===1){write(s.bucket+":"+s.family,s.family,s.ref);outputArea+=s.area;continue;}}
  const list=[...sets.values()].sort((a,b)=>(priority[b.family.split('@')[0]]??1)-(priority[a.family.split('@')[0]]??1)||a.area-b.area),coverage={1:[],[-1]:[]},visible=[];
  for(const s of list){try{const shape=operation('union',s.triangles),previous=coverage[s.sign],result=previous.length?operation('difference',shape,previous):shape;if(result.length)visible.push({s,shape:result});coverage[s.sign]=previous.length?operation('union',previous,shape):shape;if(s.triangles.length>shape.length)overlaps++;}catch(error){throw Error('Could not resolve source surface coverage: '+error.message);}}
  for(const {s,shape}of visible){const opposite=coverage[-s.sign];if(opposite.length){emit(s,operation('difference',shape,opposite),false);emit(s,operation('intersection',shape,opposite),true);}else emit(s,shape,false);}
 }
 function emit(s,shape,front){const ref=s.ref.map(v=>s.axes.map(k=>v[k])),dx=ref[1][0]-ref[0][0],dy=ref[1][1]-ref[0][1],ex=ref[2][0]-ref[0][0],ey=ref[2][1]-ref[0][1],det=dx*ey-dy*ex,sign=Math.sign(det),family=s.family+(front?'~front':'');
  for(const poly of shape){const rings=poly.map(r=>r.slice(0,-1)),p=rings.flat(),vertices=p.map(q=>{const x=q[0]-ref[0][0],y=q[1]-ref[0][1],u=(x*ey-y*ex)/det,v=(dx*y-dy*x)/det;return s.ref[0].map((a,k)=>a+(s.ref[1][k]-a)*u+(s.ref[2][k]-a)*v);}),triangles=THREE.ShapeUtils.triangulateShape(rings[0].map(p=>new THREE.Vector2(...p)),rings.slice(1).map(r=>r.map(p=>new THREE.Vector2(...p))));
   for(let tri of triangles){const[a,b,c]=tri.map(i=>p[i]),cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(cross)<1e-12)continue;if(Math.sign(cross)!==sign)tri=[tri[0],tri[2],tri[1]];const v=tri.map(i=>vertices[i]);outputArea+=triangleArea(v);write(s.bucket+':'+family,family,v);}
  }
 }
 for(const t of pass){write(t.bucket+':'+t.family,t.family,t.v);outputArea+=t.area;}
 const stats={originalArea,removedArea:originalArea-outputArea,outputArea,overlaps},out=[];for(const b of writers.values()){const geometry=new THREE.BufferGeometry();for(const[name,key,size]of[['position','p',3],['normal','n',3],['color','c',3],['uv','uv',2]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(b[key],size));geometry.userData.surfaceCleanup=stats;out.push({family:b.family,geometry});}for(const {geometry}of groups)geometry.dispose();return out;
}
function sub(a,b){return a.slice(0,3).map((v,k)=>v-b[k]);}
function triangleArea(v){const a=sub(v[1],v[0]),b=sub(v[2],v[0]);return Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])/2;}

function operation(name,...input){
 const toPaths=geometry=>geometry.flatMap(poly=>poly.map((ring,i)=>{const path=ring.map(p=>({X:Math.round(p[0]*Q),Y:Math.round(p[1]*Q)}));if(Clipper.Clipper.Orientation(path)!==(i===0))path.reverse();return path;}));
 const c=new Clipper.Clipper();c.StrictlySimple=false;if(!c.AddPaths(toPaths(input[0]),Clipper.PolyType.ptSubject,true))return [];if(input[1]?.length)c.AddPaths(toPaths(input[1]),Clipper.PolyType.ptClip,true);
 const tree=new Clipper.PolyTree(),type={union:Clipper.ClipType.ctUnion,difference:Clipper.ClipType.ctDifference,intersection:Clipper.ClipType.ctIntersection}[name];
 if(name==='intersection'&&!input[1]?.length)return[];
 if(!c.Execute(type,tree,Clipper.PolyFillType.pftNonZero,Clipper.PolyFillType.pftNonZero))throw Error('Integer surface clipping failed.');
 const ring=path=>{const r=path.map(p=>[p.X/Q,p.Y/Q]);return r.length?[...r,r[0]]:[];};return Clipper.JS.PolyTreeToExPolygons(tree).map(p=>[ring(p.outer),...p.holes.map(ring)]);
}
