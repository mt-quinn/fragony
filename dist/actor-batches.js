import * as THREE from './vendor/three.module.js';

// Exact visual instances within each actor. Keep the original articulated meshes
// for hit regions, ragdolls and shattering; hide them only inside the world draw.
// Per-actor bounds preserve independent main-camera and shadow-camera culling.
export class ActorBatches{
 constructor(){this.group=new THREE.Group();this.group.name='actor-instances';this.group.userData.pixelForgeClean=true;this.group.visible=false;this.group.matrixAutoUpdate=this.group.matrixWorldAutoUpdate=false;this.roots=new Map();this.hidden=[];this.seen=new Set();}
 sync(scene,camera){
  if(this.group.parent!==scene)scene.add(this.group);this.seen.clear();
  const visit=o=>{if(!o.visible||o===this.group)return;if(o.isGroup&&o.userData.pixelForgeClean){this.syncRoot(o,camera);return;}for(const child of o.children)visit(child);};visit(scene);
  for(const [root,cache]of this.roots)if(!this.seen.has(root)){for(const entry of cache.values()){this.group.remove(entry.mesh);entry.mesh.dispose();}this.roots.delete(root);}
  this.group.visible=true;
 }
 syncRoot(root,camera){
  this.seen.add(root);const groups=new Map();
  root.traverseVisible(o=>{
   if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(o.material)||!o.material.visible||o.material.transparent||o.material.isShaderMaterial||o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||o.onAfterRender!==THREE.Object3D.prototype.onAfterRender||o.onBeforeShadow!==THREE.Object3D.prototype.onBeforeShadow||o.onAfterShadow!==THREE.Object3D.prototype.onAfterShadow||o.morphTargetInfluences?.length||!o.layers.test(camera.layers)||o.children.some(c=>c.visible)||!orthogonalPositive(o.matrixWorld))return;
   const flags=(o.castShadow?1:0)+','+(o.receiveShadow?1:0)+','+o.renderOrder+','+o.layers.mask+','+!!o.userData.healthShell,signature=o.geometry.id+':'+flags,key=signature+':'+o.material.id;
   let group=groups.get(key);if(!group){group={signature,meshes:[],material:o.material,health:!!o.userData.healthShell};groups.set(key,group);}group.meshes.push(o);
  });
  let cache=this.roots.get(root);if(!cache){cache=new Map();this.roots.set(root,cache);}for(const entry of cache.values())entry.used=false;
  for(const [key,g]of groups){
   if(g.meshes.length<2)continue;let entry=cache.get(key);
   if(!entry&&g.health){for(const [oldKey,old]of cache)if(!old.used&&old.health&&old.signature===g.signature&&!groups.has(oldKey)){cache.delete(oldKey);entry=old;cache.set(key,entry);break;}}
   if(entry&&entry.capacity<g.meshes.length){this.group.remove(entry.mesh);entry.mesh.dispose();cache.delete(key);entry=null;}
   if(!entry){const capacity=2**Math.ceil(Math.log2(Math.max(4,g.meshes.length))),source=g.meshes[0],mesh=new THREE.InstancedMesh(source.geometry,g.material,capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.layers.mask=source.layers.mask;mesh.renderOrder=source.renderOrder;mesh.matrixAutoUpdate=mesh.matrixWorldAutoUpdate=false;mesh.name='actor-parts';this.group.add(mesh);entry={mesh,capacity,signature:g.signature,health:g.health};cache.set(key,entry);}
   entry.used=true;entry.mesh.material=g.material;entry.mesh.count=g.meshes.length;
   for(let i=0;i<g.meshes.length;i++){const source=g.meshes[i];entry.mesh.setMatrixAt(i,source.matrixWorld);source.visible=false;this.hidden.push(source);}
   entry.mesh.instanceMatrix.needsUpdate=true;entry.mesh.computeBoundingSphere();
  }
  for(const [key,entry]of cache)if(!entry.used){this.group.remove(entry.mesh);entry.mesh.dispose();cache.delete(key);}
 }
 render(renderer,scene,camera){
  const before=scene.onBeforeRender;scene.onBeforeRender=(...args)=>{before?.apply(scene,args);this.sync(scene,camera);};
  try{return renderer.render(scene,camera);}finally{scene.onBeforeRender=before;this.restore();}
 }
 restore(){for(const mesh of this.hidden)mesh.visible=true;this.hidden.length=0;this.group.visible=false;}
 clear(){this.restore();for(const cache of this.roots.values())for(const entry of cache.values())entry.mesh.dispose();this.roots.clear();this.group.clear();}
 dispose(){this.clear();this.group.removeFromParent();}
}
function orthogonalPositive(matrix){
 const e=matrix.elements,a=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],b=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],c=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];
 if(!(a>1e-12&&b>1e-12&&c>1e-12)||matrix.determinant()<=0)return false;
 return Math.abs(e[0]*e[4]+e[1]*e[5]+e[2]*e[6])<1e-6*Math.sqrt(a*b)&&Math.abs(e[0]*e[8]+e[1]*e[9]+e[2]*e[10])<1e-6*Math.sqrt(a*c)&&Math.abs(e[4]*e[8]+e[5]*e[9]+e[6]*e[10])<1e-6*Math.sqrt(b*c);
}
