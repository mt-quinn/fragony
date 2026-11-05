import * as THREE from './vendor/three.module.js';
import {optimizeMapMaterial} from './map-material-performance.js';
import {MapOcclusion} from './map-occlusion.js';

// Keep the exact authored triangles/attributes, but make visibility granular.
// Identity instances keep world-space paint coordinates and ray geometry intact.
export function spatialMapBatches(surfaces,{tile=8,occlusion=true}={}){
 const families=new Map();
 for(const surface of surfaces){
  if(surface.material.transparent)continue;
  let group=families.get(surface.material);if(!group){group={family:surface.family,material:surface.material,sources:[]};families.set(surface.material,group);}
  group.sources.push(surface.geometry);
 }
 const batches=[],visibility=occlusion&&surfaces.reduce((n,s)=>n+s.geometry.index.count/3,0)>250000?new MapOcclusion(surfaces):null,clip=new THREE.Matrix4(),frustum=new THREE.Frustum();
 for(const {family,material,sources}of families.values()){
  const parts=sources.flatMap(geometry=>partitionSurface(geometry,tile));
  const vertices=parts.reduce((n,g)=>n+g.attributes.position.count,0),indices=parts.reduce((n,g)=>n+g.index.count,0);
  const paint=identityBatchMaterial(material),depth=identityBatchMaterial(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:material.side,alphaMap:material.alphaMap,map:material.alphaTest?material.map:null,alphaTest:material.alphaTest}));
  const mesh=new THREE.BatchedMesh(parts.length,vertices,indices,paint);mesh.customDepthMaterial=depth;
  const dispose=mesh.dispose.bind(mesh);mesh.dispose=()=>{dispose();paint.dispose();depth.dispose();};mesh.name='map-batch:'+family;mesh.userData.staticMapBatch=true;
  mesh.castShadow=!['glass','light','fence'].includes(family.split('~')[0].split('@')[0]);mesh.receiveShadow=true;
  const bounds=[];for(const geometry of parts){const instance=mesh.addInstance(mesh.addGeometry(geometry));bounds[instance]=geometry.boundingBox.clone();geometry.dispose();}
  mesh.perObjectFrustumCulled=false;mesh.sortObjects=false;
  const before=mesh.onBeforeRender.bind(mesh);
  mesh.onBeforeRender=(renderer,scene,camera,geometry,material)=>{
   clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip,camera.coordinateSystem,camera.reversedDepth);
   const occlude=visibility?.prepare(camera);
   for(let i=0;i<bounds.length;i++){const visible=frustum.intersectsBox(bounds[i])&&(!occlude||visibility.visible(bounds[i],camera));if(mesh.getVisibleAt(i)!==visible)mesh.setVisibleAt(i,visible);}
   before(renderer,scene,camera,geometry,material);
  };
  parts.length=0;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.updateMatrixWorld(true);mesh.matrixAutoUpdate=false;mesh.matrixWorldAutoUpdate=false;batches.push(mesh);
 }
 return batches;
}

export function partitionSurface(geometry,tile=12){
 const p=geometry.attributes.position,ix=geometry.index.array,buckets=new Map();
 for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2],key=Math.floor((p.getX(a)+p.getX(b)+p.getX(c))/(3*tile))+','+Math.floor((p.getY(a)+p.getY(b)+p.getY(c))/(3*tile))+','+Math.floor((p.getZ(a)+p.getZ(b)+p.getZ(c))/(3*tile));let indices=buckets.get(key);if(!indices){indices=[];buckets.set(key,indices);}indices.push(a,b,c);}
 return [...buckets.values()].map(indices=>compactSurface(geometry,indices));
}

export function compactSurface(geometry,indices){
  const remap=indices.length>geometry.attributes.position.count/3?new Int32Array(geometry.attributes.position.count).fill(-1):new Map(),dense=remap instanceof Int32Array,vertices=[],index=new Uint32Array(indices.length);
  for(let i=0;i<indices.length;i++){const old=indices[i];let next=dense?remap[old]:remap.get(old);if(next===undefined||next===-1){next=vertices.length;if(dense)remap[old]=next;else remap.set(old,next);vertices.push(old);}index[i]=next;}
  const part=new THREE.BufferGeometry();
  for(const [name,a]of Object.entries(geometry.attributes)){const array=new a.array.constructor(vertices.length*a.itemSize);for(let i=0;i<vertices.length;i++)for(let k=0;k<a.itemSize;k++)array[i*a.itemSize+k]=a.array[vertices[i]*a.itemSize+k];part.setAttribute(name,new THREE.BufferAttribute(array,a.itemSize,a.normalized));}
  part.setIndex(new THREE.BufferAttribute(vertices.length<=65535?new Uint16Array(index):index,1));part.computeBoundingBox();part.computeBoundingSphere();return part;
}

// Map instances never transform: skip the generic per-vertex matrix texture
// fetches. The standard BatchedMesh still handles camera-specific draw ranges.
function identityBatchMaterial(source){
 const material=source.isMeshStandardMaterial?optimizeMapMaterial(source):source.clone(),compile=source.onBeforeCompile.bind(source),key=source.customProgramCacheKey();
 material.onBeforeCompile=shader=>{compile(shader);shader.vertexShader=shader.vertexShader.replace('#include <batching_vertex>','#ifdef USE_BATCHING\nmat4 batchingMatrix=mat4(1.);\n#endif');};
 material.customProgramCacheKey=()=>key+':static-map-identity-v1';return material;
}
