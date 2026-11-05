import * as THREE from '../../dist/vendor/three.module.js';
import {MeshBVH,acceleratedRaycast} from '../../dist/vendor/three-mesh-bvh.module.js';
export function sourceReviewViews(map,spaces,profile){
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),meshes=[];
 for(const c of map.renderChunks){if(/^(glass|light|fence)/.test(c.family))continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(c.attributes.position.array,3));g.setIndex(new THREE.BufferAttribute(c.index.array,1));g.boundsTree=MeshBVH.deserialize(c.bvh,g,{setIndex:false});const mesh=new THREE.Mesh(g,material);mesh.raycast=acceleratedRaycast;mesh.updateMatrixWorld(true);meshes.push(mesh);}
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),origin=new THREE.Vector3(),views=[];ray.far=48;
 for(const a of profile.areas){const seeds=spaces.seeds.filter(s=>s.area===a.id),first=seeds[0],chosen=seeds.filter((s,i)=>i===0||Math.abs(s.node[1]-first.node[1])>2||Math.hypot(s.node[0]-first.node[0],s.node[2]-first.node[2])>25);
  for(const [i,s]of chosen.entries()){const p=[s.node[0],s.node[1]+1.65,s.node[2]],angles=Array.from({length:16},(_,i)=>i*Math.PI/8);let winner=0,best=-Infinity;
   for(const angle of angles){let score=0,closest=Infinity;for(const offset of [-.48,0,.48]){origin.fromArray(p);direction.set(Math.sin(angle+offset),-.025,Math.cos(angle+offset));ray.set(origin,direction);ray.far=40;const hit=ray.intersectObjects(meshes,false)[0],distance=hit?.distance||40;closest=Math.min(closest,distance);score+=(hit?Math.min(distance,22):4)*(offset===0?1.5:.6);}if(closest<2)continue;score+=Math.min(closest,12)*.8;
    ray.set(new THREE.Vector3(p[0]+Math.sin(angle)*5,p[1],p[2]+Math.cos(angle)*5),new THREE.Vector3(0,-1,0));ray.far=160;if(!ray.intersectObjects(meshes,false).length)score-=18;
    if(score>best){best=score;winner=angle;}
   }
   const target=a.viewTarget||[p[0]+Math.sin(winner)*12,p[1]-.3,p[2]+Math.cos(winner)*12];views.push({id:a.id+(i?'-'+i:''),name:a.viewNames?.[i]||a.name+(i?(Math.abs(s.node[1]-first.node[1])<2?' / far side':s.node[1]>first.node[1]?' / upper':' / lower'):''),area:a.id,p,t:target});
  }
 }
 for(const m of meshes)m.geometry.dispose();material.dispose();return views;
}
