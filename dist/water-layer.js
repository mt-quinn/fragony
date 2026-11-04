import * as THREE from './vendor/three.module.js';

// Pixel Forge styles the opaque scene first. Water is a separate, premultiplied
// display-color layer, so its translucency never becomes floor-colored stipple.
export class WaterLayer{
 constructor(){
  this.target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  this.uniforms={opaqueDepth:{value:null},inverseSize:{value:new THREE.Vector2()},waterToneMap:{value:1},toneMappingExposure:{value:1}};
  this.cache=new Map();this.meshes=[];this.originals=[];this.clearColor=new THREE.Color();
 }
 resize(w,h){this.target.setSize(w,h);this.uniforms.inverseSize.value.set(1/w,1/h);}
 material(source){
  if(this.cache.has(source))return this.cache.get(source);
  const fragment=`uniform sampler2D opaqueDepth;uniform vec2 inverseSize;uniform float waterToneMap;\n#include <tonemapping_pars_fragment>\n`+source.fragmentShader.replace('void main(){',`void main(){
 // The unjittered opaque depth includes cover and character silhouettes.
 if(gl_FragCoord.z>texture2D(opaqueDepth,gl_FragCoord.xy*inverseSize).r+.000002)discard;`).replace('gl_FragColor=vec4(color,alpha);',`if(waterToneMap>1.5)color=NeutralToneMapping(color);else if(waterToneMap>.5)color=ACESFilmicToneMapping(color);
 color=sRGBTransferOETF(vec4(color,1.)).rgb;
 gl_FragColor=vec4(color,alpha);`);
  const material=new THREE.ShaderMaterial({vertexShader:source.vertexShader,fragmentShader:fragment,uniforms:{...source.uniforms,...this.uniforms},transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});material.forceSinglePass=true;
  this.cache.set(source,material);return material;
 }
 render(renderer,scene,camera,opaqueDepth){
  const target=renderer.getRenderTarget(),background=scene.background,override=scene.overrideMaterial,mask=camera.layers.mask,shadow=renderer.shadowMap.autoUpdate;
  const color=renderer.getClearColor(this.clearColor),alpha=renderer.getClearAlpha();
  this.uniforms.opaqueDepth.value=opaqueDepth;this.uniforms.waterToneMap.value=renderer.toneMapping===THREE.NeutralToneMapping?2:renderer.toneMapping===THREE.NoToneMapping?0:1;this.uniforms.toneMappingExposure.value=renderer.toneMappingExposure;
  try{
   scene.traverseVisible(o=>{if(o.isMesh&&o.userData.waterSurface){this.meshes.push(o);this.originals.push(o.material);o.material=this.material(o.material);}});
   scene.background=null;scene.overrideMaterial=null;camera.layers.set(3);renderer.shadowMap.autoUpdate=false;
   renderer.setRenderTarget(this.target);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,camera);
  }finally{
   for(let i=0;i<this.meshes.length;i++)this.meshes[i].material=this.originals[i];this.meshes.length=this.originals.length=0;
   scene.background=background;scene.overrideMaterial=override;camera.layers.mask=mask;renderer.shadowMap.autoUpdate=shadow;renderer.setRenderTarget(target);renderer.setClearColor(color,alpha);
  }
 }
 dispose(){this.target.dispose();for(const m of this.cache.values())m.dispose();this.cache.clear();}
}
