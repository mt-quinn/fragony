import * as THREE from './vendor/three.module.js';

// Acquisition-only padding in world meters. Actual shot geometry stays unchanged.
export const AUTO_AIM_PADDING=.06;
const inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),box=new THREE.Box3(),point=new THREE.Vector3(),surfacePoint=new THREE.Vector3(),direction=new THREE.Vector3(),sight=new THREE.Raycaster();
export function nearbyAutoTarget(aimRay,actorMeshes,worldMeshes,padding=AUTO_AIM_PADDING){
 let best=null;
 for(const mesh of actorMeshes){
  const bot=mesh.userData.bot;if(!bot||bot.dead||bot.hp<=0||!mesh.geometry)continue;
  const geometry=mesh.geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();if(!geometry.boundingBox||geometry.boundingBox.isEmpty())continue;
  const m=mesh.matrixWorld.elements,sx=Math.hypot(m[0],m[1],m[2]),sy=Math.hypot(m[4],m[5],m[6]),sz=Math.hypot(m[8],m[9],m[10]);if(Math.min(sx,sy,sz)<1e-8)continue;
  inverse.copy(mesh.matrixWorld).invert();localRay.copy(aimRay.ray).applyMatrix4(inverse);box.copy(geometry.boundingBox);
  box.min.x-=padding/sx;box.max.x+=padding/sx;box.min.y-=padding/sy;box.max.y+=padding/sy;box.min.z-=padding/sz;box.max.z+=padding/sz;
  if(!localRay.intersectBox(box,point))continue;
  surfacePoint.copy(point).clamp(geometry.boundingBox.min,geometry.boundingBox.max).applyMatrix4(mesh.matrixWorld);
  const distance=surfacePoint.distanceTo(aimRay.ray.origin);if(distance<aimRay.near||distance>aimRay.far||best&&distance>=best.distance)continue;
  // Check the real surface, not the enlarged shell: padding must never reach through a wall.
  direction.copy(surfacePoint).sub(aimRay.ray.origin).normalize();sight.set(aimRay.ray.origin,direction);sight.near=0;sight.far=Math.max(0,distance-.002);
  if(sight.intersectObjects(worldMeshes,false).length)continue;
  const obstruction=sight.intersectObjects(actorMeshes,false).find(hit=>hit.object.userData.bot!==bot);if(obstruction)continue;
  best={bot,distance};
 }
 return best;
}
