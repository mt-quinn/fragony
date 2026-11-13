import {ClusterVisibility} from './map-cluster-visibility.js';
import * as THREE from './vendor/three.module.js';
import {optimizeMapMaterial} from './map-material-performance.js';
import {MapOcclusion} from './map-occlusion.js';

// Small prepared maps are cheaper as a few merged material draws. Compiled
// spatial/detail data pays for its command and visibility overhead on dense maps.
export function useCompiledMapDetails(surfaces){return surfaces.some(s=>s.geometry.userData.compiledClusters)&&surfaces.reduce((n,s)=>n+(s.geometry.userData.drawIndex?.length??s.geometry.index.count),0)>600000;}
export function useSpatialMapBatches(surfaces){return useCompiledMapDetails(surfaces)||surfaces.length>64;}

// Keep the exact authored triangles/attributes, but make visibility granular.
// Identity instances keep world-space paint coordinates and ray geometry intact.
export function spatialMapBatches(surfaces,{tile=8,occlusion=true}={}){
 const families=new Map();
 for(const surface of surfaces){
  if(surface.material.transparent)continue;
  let group=families.get(surface.material);if(!group){group={family:surface.family,material:surface.material,sources:[]};families.set(surface.material,group);}
  group.sources.push(surface.geometry);
 }
 const occluders=surfaces.find(s=>s.geometry.userData.mapOccluders)?.geometry.userData.mapOccluders;
 const records=[];let hierarchy=null;
 const batches=[],visibility=occlusion&&(occluders||surfaces.reduce((n,s)=>n+s.geometry.index.count/3,0)>250000)?new MapOcclusion(surfaces,occluders?{triangles:occluders,width:48,height:27,maxTriangles:512}:{}):null,clip=new THREE.Matrix4(),frustum=new THREE.Frustum(),size=new THREE.Vector2();
 for(const {family,material,sources}of families.values()){
  const projectedUV=sources.every(g=>g.userData.projectedUV),parts=sources.flatMap(geometry=>geometry.userData.compiledClusters?compiledParts(geometry,projectedUV):partitionSurface(geometry,tile));
  if(!parts.length)continue;
  const vertices=parts.reduce((n,g)=>n+g.attributes.position.count,0),indices=parts.reduce((n,g)=>n+g.index.count,0);
  const paint=identityBatchMaterial(material,projectedUV),depth=identityBatchMaterial(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:material.side,alphaMap:material.alphaMap,map:material.alphaTest?material.map:null,alphaTest:material.alphaTest}));
  const mesh=new THREE.BatchedMesh(parts.length,vertices,indices,paint);mesh.customDepthMaterial=depth;
  const dispose=mesh.dispose.bind(mesh);mesh.dispose=()=>{dispose();paint.dispose();depth.dispose();};mesh.name='map-batch:'+family;mesh.userData.staticMapBatch=true;
  mesh.castShadow=!['glass','light','fence'].includes(family.split('~')[0].split('@')[0]);mesh.receiveShadow=true;
  let maxLevels=4;const bounds=[],ranges=[],visibilityRecords=[],visibleFlags=new Uint8Array(parts.length).fill(1);for(const geometry of parts){const id=mesh.addGeometry(geometry),instance=mesh.addInstance(id);bounds[instance]=geometry.boundingBox.clone();const record={box:bounds[instance]};records.push(record);visibilityRecords[instance]=record;maxLevels=Math.max(maxLevels,geometry.userData.levelRanges?.length||0);ranges[instance]=geometry.userData.levelRanges?{id,levels:geometry.userData.levelRanges}:null;if(ranges[instance])mesh.setGeometryDrawRangeAt(id,0,ranges[instance].levels[0].count);geometry.dispose();}mesh.userData.compiledMapBatch=ranges.some(Boolean);
  mesh.perObjectFrustumCulled=false;mesh.sortObjects=false;
  const before=mesh.onBeforeRender.bind(mesh);
  mesh.onBeforeRender=(renderer,scene,camera,geometry,material)=>{
   const height=renderer.getDrawingBufferSize?.(size)?.y||1;if(hierarchy){hierarchy.prepare(camera,height);if(mesh.userData.visibilityVersion===hierarchy.version&&mesh.userData.exactVisuals===(renderer.userData?.exactMapVisuals===true)){before(renderer,scene,camera,geometry,material);return;}mesh.userData.visibilityVersion=hierarchy.version;mesh.userData.exactVisuals=renderer.userData?.exactMapVisuals===true;}else{clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip,camera.coordinateSystem,camera.reversedDepth);}
   const occlude=hierarchy?false:visibility?.prepare(camera),projection=camera.projectionMatrix.elements,view=camera.matrixWorldInverse.elements,focal=height*.5*Math.abs(projection[5]),perspective=camera.isPerspectiveCamera,angle=perspective?Math.sqrt(1+1/(projection[0]*projection[0])+1/(projection[5]*projection[5])):1;mesh.userData.lodCounts=new Array(maxLevels).fill(0);
   for(let i=0;i<bounds.length;i++){const box=bounds[i],visible=hierarchy?!!hierarchy.flags[visibilityRecords[i].visibilityId]:frustum.intersectsBox(box)&&(!occlude||visibility.visible(box,camera));if(visibleFlags[i]!==Number(visible)){mesh.setVisibleAt(i,visible);visibleFlags[i]=Number(visible);}const range=ranges[i];if(range){let level=0;if(visible&&perspective&&!renderer.userData?.exactMapVisuals){const depth=-(view[2]*(view[2]>=0?box.max.x:box.min.x)+view[6]*(view[6]>=0?box.max.y:box.min.y)+view[10]*(view[10]>=0?box.max.z:box.min.z)+view[14]);for(let j=1;j<range.levels.length;j++){const error=range.levels[j].error;if(depth>error+camera.near&&focal*angle*error/(depth-error)<=1.8)level=j;}const old=range.mainLevel||0,oldError=range.levels[old].error;if(old>level&&depth>oldError+camera.near&&focal*angle*oldError/(depth-oldError)<=2)level=old;range.mainLevel=level;}const selected=range.levels[level];if(range.selected!==selected){mesh.setGeometryDrawRangeAt(range.id,selected.start,selected.count);range.selected=selected;}if(visible)mesh.userData.lodCounts[level]++;}}
   before(renderer,scene,camera,geometry,material);
  };
  parts.length=0;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.updateMatrixWorld(true);mesh.matrixAutoUpdate=false;mesh.matrixWorldAutoUpdate=false;batches.push(mesh);
 }
 if(surfaces.some(s=>s.geometry.userData.compiledClusters)){hierarchy=new ClusterVisibility(records,visibility);for(const mesh of batches)mesh.userData.clusterVisibility=hierarchy;}return batches;
}

export function partitionSurface(geometry,tile=12){
 const p=geometry.attributes.position,ix=geometry.index.array,buckets=new Map();
 for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2],key=Math.floor((p.getX(a)+p.getX(b)+p.getX(c))/(3*tile))+','+Math.floor((p.getY(a)+p.getY(b)+p.getY(c))/(3*tile))+','+Math.floor((p.getZ(a)+p.getZ(b)+p.getZ(c))/(3*tile));let indices=buckets.get(key);if(!indices){indices=[];buckets.set(key,indices);}indices.push(a,b,c);}
 return [...buckets.values()].map(indices=>compactSurface(geometry,indices));
}

export function compactSurface(geometry,indices,{omitUV=false,omitUVBasis=false}={}){
  const remap=indices.length>geometry.attributes.position.count/3?new Int32Array(geometry.attributes.position.count).fill(-1):new Map(),dense=remap instanceof Int32Array,vertices=[],index=new Uint32Array(indices.length);
  for(let i=0;i<indices.length;i++){const old=indices[i];let next=dense?remap[old]:remap.get(old);if(next===undefined||next===-1){next=vertices.length;if(dense)remap[old]=next;else remap.set(old,next);vertices.push(old);}index[i]=next;}
  const part=new THREE.BufferGeometry();
  for(const [name,a]of Object.entries(geometry.attributes)){if(omitUV&&name==='uv'||omitUVBasis&&['mapUvAxis','mapUvOffset'].includes(name))continue;const array=new a.array.constructor(vertices.length*a.itemSize);for(let i=0;i<vertices.length;i++)for(let k=0;k<a.itemSize;k++)array[i*a.itemSize+k]=a.array[vertices[i]*a.itemSize+k];part.setAttribute(name,new THREE.BufferAttribute(array,a.itemSize,a.normalized));}
  part.setIndex(new THREE.BufferAttribute(vertices.length<=65535?new Uint16Array(index):index,1));part.computeBoundingBox();part.computeBoundingSphere();return part;
}

// Map instances never transform: skip the generic per-vertex matrix texture
// fetches. The standard BatchedMesh still handles camera-specific draw ranges.
export function identityBatchMaterial(source,projectedUV=false){
 const material=source.isMeshStandardMaterial?optimizeMapMaterial(source):source.clone(),compile=source.onBeforeCompile.bind(source),key=source.customProgramCacheKey();
 material.onBeforeCompile=shader=>{compile(shader);if(projectedUV)shader.vertexShader='attribute float mapUvAxis;attribute vec2 mapUvOffset;\n'+shader.vertexShader.replace('#include <uv_vertex>','#define uv (vec2(mapUvAxis<.5?position.z:position.x,(mapUvAxis>.5&&mapUvAxis<1.5)?position.z:position.y)*.45+mapUvOffset/81920.)\n#include <uv_vertex>\n#undef uv');shader.vertexShader=shader.vertexShader.replace('#include <batching_vertex>','#ifdef USE_BATCHING\nmat4 batchingMatrix=mat4(1.);\n#endif');};
 material.customProgramCacheKey=()=>key+':static-map-identity-v1:'+projectedUV;return material;
}

export function compiledParts(geometry,projectedUV){return geometry.userData.compiledClusters.map(cluster=>{const ranges=[],unique=new Map();let count=0;for(const l of cluster.levels){let range=unique.get(l.index);if(!range){range={start:count,count:l.index.length,error:l.error};unique.set(l.index,range);count+=l.index.length;}ranges.push(range);}const index=new Uint32Array(count);for(const [ix,r]of unique)index.set(ix,r.start);const part=compactSurface(geometry,index,{omitUV:projectedUV,omitUVBasis:!projectedUV});part.userData.levelRanges=ranges;return part;});}
