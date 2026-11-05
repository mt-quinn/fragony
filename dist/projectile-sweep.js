import * as T from './vendor/three.module.js';
const normal=new T.Vector3(),q=new T.Vector3(),center=new T.Vector3(),delta=new T.Vector3(),edge=new T.Vector3(),offset=new T.Vector3();
// Exact continuous sphere/triangle contact: face, three edge capsules and vertices.
export function sphereTriangleTime(origin,direction,length,radius,triangle){
 let best=Infinity;triangle.closestPointToPoint(origin,q);if(q.distanceToSquared(origin)<=radius*radius+1e-12)return 0;
 triangle.getNormal(normal);const distance=normal.dot(delta.copy(origin).sub(triangle.a)),velocity=normal.dot(direction);
 if(Math.abs(velocity)>1e-10)for(const sign of [-1,1]){const t=(sign*radius-distance)/velocity;if(t>=0&&t<=length&&t<best){center.copy(origin).addScaledVector(direction,t);q.copy(center).addScaledVector(normal,-sign*radius);if(triangle.containsPoint(q))best=t;}}
 const vertices=[triangle.a,triangle.b,triangle.c];
 for(let i=0;i<3;i++){
  const a=vertices[i],b=vertices[(i+1)%3];offset.copy(origin).sub(a);const v=offset.dot(direction),c=offset.lengthSq()-radius*radius,h=v*v-c;if(h>=0){const t=-v-Math.sqrt(h);if(t>=0&&t<=length)best=Math.min(best,t);}
  edge.copy(b).sub(a);const ee=edge.lengthSq(),ed=edge.dot(direction),eo=edge.dot(offset),aa=ee-ed*ed,bb=ee*v-eo*ed,cc=ee*offset.lengthSq()-eo*eo-radius*radius*ee,disc=bb*bb-aa*cc;
  if(aa>1e-12&&disc>=0){const t=(-bb-Math.sqrt(disc))/aa,y=eo+t*ed;if(t>=0&&t<=length&&y>=0&&y<=ee)best=Math.min(best,t);}
 }
 return best;
}
const bary=new T.Vector3(),uvPoint=new T.Vector2();
const cache=new WeakMap(),sweepBox=new T.Box3(),localBox=new T.Box3(),start=new T.Vector3(),end=new T.Vector3(),pointA=new T.Vector3(),pointB=new T.Vector3(),pointC=new T.Vector3(),triangle=new T.Triangle(),contact=new T.Vector3();
function transform(mesh){let c=cache.get(mesh);if(!c||!c.matrix.equals(mesh.matrixWorld)){mesh.geometry.computeBoundingBox();c={matrix:mesh.matrixWorld.clone(),inverse:mesh.matrixWorld.clone().invert(),bounds:mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld),scale:mesh.matrixWorld.getMaxScaleOnAxis()};cache.set(mesh,c);}return c;}
export function sweepMeshes(origin,direction,length,radius,meshes,{exclude=null,seen=null}={}){
 sweepBox.setFromPoints([origin,end.copy(origin).addScaledVector(direction,length)]).expandByScalar(radius);let best=null,bestDistance=length+1e-8;
 for(const mesh of meshes){const actor=mesh.userData?.bot;if(actor&&(actor===exclude||actor.dead||actor.hp<=0||seen?.has(actor.name)))continue;
  if(!mesh.geometry)continue;const c=transform(mesh);if(!sweepBox.intersectsBox(c.bounds))continue;
  start.copy(origin).applyMatrix4(c.inverse);end.copy(origin).addScaledVector(direction,bestDistance).applyMatrix4(c.inverse);const inverseScale=c.inverse.getMaxScaleOnAxis();localBox.setFromPoints([start,end]).expandByScalar(radius*inverseScale);
  const visit=(tri,triangleIndex)=>{triangle.a.copy(tri.a).applyMatrix4(mesh.matrixWorld);triangle.b.copy(tri.b).applyMatrix4(mesh.matrixWorld);triangle.c.copy(tri.c).applyMatrix4(mesh.matrixWorld);const distance=sphereTriangleTime(origin,direction,bestDistance,radius,triangle);if(distance<bestDistance){center.copy(origin).addScaledVector(direction,distance);triangle.closestPointToPoint(center,contact);const alpha=mesh.material?.userData?.alphaAt,uv=mesh.geometry.getAttribute('uv');if(alpha&&uv&&Number.isInteger(triangleIndex)){triangle.getBarycoord(contact,bary);const index=mesh.geometry.index,base=triangleIndex*3;uvPoint.set(0,0);for(let k=0;k<3;k++){const vertex=index?index.getX(base+k):base+k,weight=k===0?bary.x:k===1?bary.y:bary.z;uvPoint.x+=uv.getX(vertex)*weight;uvPoint.y+=uv.getY(vertex)*weight;}if(!alpha(uvPoint))return false;}const n=center.clone().sub(contact);if(n.lengthSq()<1e-12){triangle.getNormal(n);if(n.dot(direction)>0)n.negate();}else n.normalize();bestDistance=distance;best={distance,point:contact.clone(),center:center.clone(),normal:n,object:mesh,face:{normal:n.clone()},worldNormal:true};}return false;};
  if(mesh.geometry.boundsTree)mesh.geometry.boundsTree.shapecast({intersectsBounds:box=>box.intersectsBox(localBox),intersectsTriangle:visit});
  else{const g=mesh.geometry,index=g.index,vertices=g.getAttribute('position'),count=index?.count||vertices.count;for(let i=0;i<count;i+=3){pointA.fromBufferAttribute(vertices,index?index.getX(i):i);pointB.fromBufferAttribute(vertices,index?index.getX(i+1):i+1);pointC.fromBufferAttribute(vertices,index?index.getX(i+2):i+2);const tri={a:pointA,b:pointB,c:pointC};visit(tri,i/3);}}
 }
 return best;
}
