import * as THREE from './vendor/three.module.js';
// Keep the logical pickup objects used by collection/respawn. Instance their
// unchanged component geometry so hundreds of health packs cost four draws.
export function batchHealthPickups(arena,pickups){
 const packs=pickups.filter(p=>p.kind==='health'),batches=[],matrix=new THREE.Matrix4(),hidden=new THREE.Matrix4().makeScale(0,0,0);
 if(!packs.length)return null;
 function moving(parts,color){
  if(!parts.length)return;
  const source=parts[0].mesh,material=color?source.material.clone():source.material;
  if(color){material.color.setHex(0xffffff);material.userData.arenaOwnedMaterial=true;}
  const mesh=new THREE.InstancedMesh(source.geometry,material,parts.length);mesh.name='health-'+(color?'bodies':'crosses');mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(const [i,p]of parts.entries()){p.mesh.updateMatrix();p.local=p.mesh.matrix.clone();if(color)mesh.setColorAt(i,p.mesh.material.color);p.mesh.visible=false;}
  arena.add(mesh);batches.push({mesh,parts});
 }
 const bodies=[],crosses=[];
 for(const p of packs){const meshes=p.mesh.children.filter(m=>m.isMesh);if(!meshes.length)continue;bodies.push({pack:p,mesh:meshes[0]});for(const m of meshes.slice(1))crosses.push({pack:p,mesh:m});}
 moving(bodies,true);moving(crosses,false);
 const rings=new Map();for(const m of [...arena.children])if(m.userData.healthRing){const key=m.geometry.parameters.radius;if(!rings.has(key))rings.set(key,[]);rings.get(key).push(m);}
 for(const sources of rings.values()){const first=sources[0],mesh=new THREE.InstancedMesh(first.geometry,first.material,sources.length);mesh.name='health-rings';for(const [i,m]of sources.entries()){m.updateMatrix();mesh.setMatrixAt(i,m.matrix);m.visible=false;}mesh.computeBoundingSphere();arena.add(mesh);}
 const view={sync(){for(const p of packs)p.mesh.updateMatrix();for(const b of batches){for(const [i,p]of b.parts.entries())b.mesh.setMatrixAt(i,p.pack.mesh.visible?matrix.multiplyMatrices(p.pack.mesh.matrix,p.local):hidden);b.mesh.instanceMatrix.needsUpdate=true;}}};
 view.sync();arena.userData.healthBatches=view;return view;
}
