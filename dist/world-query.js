// World queries usually need one obstruction, not a sorted list of every wall.
// Keep exact per-mesh raycasts (including fence alpha tests), and shorten the
// remaining search range as soon as a nearer surface has been found.
const closestHits=[],blockedHits=[];
export function closestHit(ray,meshes,extras=null){
 const far=ray.far,first=ray.firstHitOnly;let best=null;ray.firstHitOnly=true;
 try{for(let group=0;group<(extras?2:1);group++)for(const mesh of group?extras:meshes){closestHits.length=0;ray.intersectObject(mesh,false,closestHits);const hit=closestHits[0];if(hit&&(!best||hit.distance<best.distance)){best=hit;ray.far=hit.distance;}}return best;}
 finally{ray.far=far;ray.firstHitOnly=first;closestHits.length=0;}
}
export function occluded(ray,meshes,excludeBot=null){
 const first=ray.firstHitOnly;ray.firstHitOnly=true;
 try{for(const mesh of meshes){if(excludeBot&&mesh.userData.bot===excludeBot)continue;blockedHits.length=0;ray.intersectObject(mesh,false,blockedHits);if(blockedHits.length)return true;}return false;}
 finally{ray.firstHitOnly=first;blockedHits.length=0;}
}
