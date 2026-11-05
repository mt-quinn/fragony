import * as THREE from './vendor/three.module.js';

// Conservative software depth tiles. A tile is written only when all four
// corners lie inside a real opaque source triangle. Its stored depth is farther
// than every point on that triangle. A box is rejected only when its entire
// projected rectangle lies behind covered tiles. No rays, guessed portals,
// previous-frame visibility, or GPU readbacks; camera movement cannot reveal gaps.
export class MapOcclusion{
 constructor(surfaces,{width=64,height=36,maxTriangles=2048,minArea=1}={}){
  this.width=width;this.height=height;this.depth=new Float32Array(width*height);this.matrix=new THREE.Matrix4();this.view=new THREE.Matrix4();this.previous=new Float64Array(32).fill(NaN);this.points=new Float64Array(24);this.lastCamera=null;
  const candidates=[];
  for(const {geometry,material}of surfaces){
   if(material.transparent||material.alphaTest>0||!material.depthWrite)continue;
   const p=geometry.attributes.position,ix=geometry.index.array;
   for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,v=p.array,ux=v[b]-v[a],uy=v[b+1]-v[a+1],uz=v[b+2]-v[a+2],vx=v[c]-v[a],vy=v[c+1]-v[a+1],vz=v[c+2]-v[a+2],cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx,area=Math.hypot(cx,cy,cz)*.5;if(area<minArea)continue;candidates.push({area,p:[v[a],v[a+1],v[a+2],v[b],v[b+1],v[b+2],v[c],v[c+1],v[c+2]],side:material.side});}
  }
  candidates.sort((a,b)=>b.area-a.area);this.triangles=candidates.slice(0,maxTriangles);this.projected=this.triangles.map(()=>({p:new Float64Array(9),far:0,side:0}));this.order=[];
 }
 prepare(camera){
  if(!camera.isPerspectiveCamera)return false;
  const projection=camera.projectionMatrix.elements,view=camera.matrixWorldInverse.elements;let changed=this.lastCamera!==camera;
  for(let i=0;i<16;i++){if(this.previous[i]!==projection[i]||this.previous[16+i]!==view[i])changed=true;this.previous[i]=projection[i];this.previous[16+i]=view[i];}
  if(!changed)return true;this.lastCamera=camera;this.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.view.copy(camera.matrixWorldInverse);this.depth.fill(Infinity);
  const w=this.width,h=this.height;let count=0;
  for(const triangle of this.triangles){
   const projected=this.projected[count],q=projected.p;
   let valid=true,far=0;
   for(let i=0;i<3;i++){if(!this.project(triangle.p[i*3],triangle.p[i*3+1],triangle.p[i*3+2],q,i*3,camera.near)){valid=false;break;}far=Math.max(far,q[i*3+2]);}if(!valid)continue;projected.far=far+.002;projected.side=triangle.side;this.order[count++]=projected;
  }
  this.order.length=count;this.order.sort((a,b)=>a.far-b.far);
  for(const projected of this.order){
   const q=projected.p,far=projected.far,triangle=projected;
   const ax=q[0],ay=q[1],bx=q[3],by=q[4],cx=q[6],cy=q[7],area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(Math.abs(area)<1e-8||triangle.side===THREE.FrontSide&&area<=0||triangle.side===THREE.BackSide&&area>=0)continue;
   const sign=area>0?1:-1,minX=Math.max(0,Math.ceil(Math.min(ax,bx,cx))),maxX=Math.min(w-1,Math.floor(Math.max(ax,bx,cx))-1),minY=Math.max(0,Math.ceil(Math.min(ay,by,cy))),maxY=Math.min(h-1,Math.floor(Math.max(ay,by,cy))-1);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const index=y*w+x;if(this.depth[index]<=far)continue;
    // Linear edge functions take their minimum at one of a square's corners.
    let inside=true;for(let edge=0;edge<3;edge++){const a=edge*3,b=((edge+1)%3)*3,dx=(q[b]-q[a])*sign,dy=(q[b+1]-q[a+1])*sign,value=dx*(y-q[a+1])-dy*(x-q[a]);if(value+Math.min(0,dx)-Math.max(0,dy)<1e-5){inside=false;break;}}
    if(inside)this.depth[index]=far;
   }
  }
  return true;
 }
 project(x,y,z,out,offset,near){
  const m=this.matrix.elements,v=this.view.elements,depth=-(v[2]*x+v[6]*y+v[10]*z+v[14]),clipW=m[3]*x+m[7]*y+m[11]*z+m[15];if(depth<=near+.001||clipW<=0)return false;
  out[offset]=((m[0]*x+m[4]*y+m[8]*z+m[12])/clipW*.5+.5)*this.width;out[offset+1]=((m[1]*x+m[5]*y+m[9]*z+m[13])/clipW*.5+.5)*this.height;out[offset+2]=depth;return true;
 }
 visible(box,camera){
  if(!camera.isPerspectiveCamera)return true;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,near=Infinity;const q=this.points;
  for(let i=0;i<8;i++){if(!this.project(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z,q,0,camera.near))return true;minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1]);near=Math.min(near,q[2]);}
  const x0=Math.max(0,Math.floor(minX)),x1=Math.min(this.width-1,Math.floor(maxX)),y0=Math.max(0,Math.floor(minY)),y1=Math.min(this.height-1,Math.floor(maxY));
  if(x0>x1||y0>y1)return true;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(near<=this.depth[y*this.width+x]+.01)return true;
  return false;
 }
}
