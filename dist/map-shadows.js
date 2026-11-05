import * as THREE from './vendor/three.module.js';

// Preserve the renderer's exact shadow camera, depth materials and filtering.
// Cache only immutable architecture. Each frame begins with its cached depth,
// then moving actors/lifts/props cast into the same map with the same depth test.
export class MapShadowCache{
 constructor(renderer){
  this.renderer=renderer;this.original=renderer.shadowMap.render;this.staticScene=new THREE.Scene();this.entries=new Set();this.type=renderer.shadowMap.type;this.signature=new Float64Array(43);
  this.wrapper=(lights,scene,camera)=>this.render(lights,scene,camera);renderer.shadowMap.render=this.wrapper;
 }
 render(lights,scene,camera){
  const r=this.renderer,system=r.shadowMap,original=(ls,s,c)=>this.original.call(system,ls,s,c);
  const light=lights.find(l=>l.isDirectionalLight&&l.castShadow),arena=scene.children.find(o=>o.userData.staticShadowMeshes?.length);
  if(!system.enabled||!system.autoUpdate||!light||!light.shadow.autoUpdate||!arena)return original(lights,scene,camera);
  if(this.type!==system.type){scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.needsUpdate=true;});this.type=system.type;}
  const shadow=light.shadow,casters=arena.userData.staticShadowMeshes;
  const signature=this.signature;signature[0]=system.type;signature[1]=shadow.mapSize.x;signature[2]=shadow.mapSize.y;signature.set(light.matrixWorld.elements,3);signature.set(light.target.matrixWorld.elements,19);
  const c=shadow.camera;signature[35]=c.left;signature[36]=c.right;signature[37]=c.top;signature[38]=c.bottom;signature[39]=c.near;signature[40]=c.far;signature[41]=c.zoom;signature[42]=c.coordinateSystem;
  let entry=arena.userData.staticShadowCache;
  if(entry?.owner!==this||!entry.signature.every((v,i)=>v===signature[i])||!shadow.map){
   entry?.dispose();
   this.staticScene.children=casters;
   original([light],this.staticScene,camera);
   this.staticScene.children=[];
   if(!shadow.map?.depthTexture)return original(lights,scene,camera);
   const depth=new THREE.DepthTexture(shadow.map.width,shadow.map.height,shadow.map.depthTexture.type);
   const target=new THREE.WebGLRenderTarget(shadow.map.width,shadow.map.height,{depthTexture:depth,format:THREE.RedFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
   r.initRenderTarget(target);r.copyTextureToTexture(shadow.map.depthTexture,depth);r.setRenderTarget(r.getRenderTarget());
   entry={owner:this,signature:signature.slice(),target,flags:new Uint8Array(casters.length),dispose:()=>{depth.dispose();target.dispose();this.entries.delete(entry);if(arena.userData.staticShadowCache===entry)delete arena.userData.staticShadowCache;}};
   this.entries.add(entry);arena.userData.staticShadowCache=entry;
  }
  const clear=r.clear,flags=entry.flags;for(let i=0;i<casters.length;i++)flags[i]=casters[i].castShadow?1:0;
  try{
   for(const o of casters)o.castShadow=false;
   r.clear=(...args)=>{clear.apply(r,args);if(r.getRenderTarget()===shadow.map){r.copyTextureToTexture(entry.target.depthTexture,shadow.map.depthTexture);r.setRenderTarget(shadow.map);}};
   return original(lights,scene,camera);
  }finally{r.clear=clear;for(let i=0;i<casters.length;i++)casters[i].castShadow=!!flags[i];}
 }
 dispose(){if(this.renderer.shadowMap.render===this.wrapper)this.renderer.shadowMap.render=this.original;for(const entry of [...this.entries])entry.dispose();}
}
