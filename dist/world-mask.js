import * as THREE from './vendor/three.module.js';

// Write clean-actor coverage alongside world color, sharing the same MSAA depth
// test. This replaces the separate actor mask draw without changing the final
// Pixel Forge shader, actor silhouettes, fence cutouts, or screen resolution.
export class WorldMask{
 constructor(){
  // Three's internally-created sky material also writes the second attachment.
  // Its color shader is otherwise unchanged, including cube-UV filtering.
  for(const name of ['background','backgroundCube']){const shader=THREE.ShaderLib[name];if(!shader.fragmentShader.includes('forgeSkyMask'))shader.fragmentShader='layout(location = 1) out vec4 forgeSkyMask;\n'+shader.fragmentShader.replace(/}\s*$/,'forgeSkyMask=vec4(0.);\n}');}
  this.cache=new Map();this.meshes=[];this.materials=[];this.clearColor=new THREE.Color();this.zero=new Float32Array(4);}
 material(source,clean){
  let entry=this.cache.get(source);
  if(!entry){entry={variants:new Map(),dispose:()=>{for(const m of entry.variants.values())m.dispose();source.removeEventListener('dispose',entry.dispose);this.cache.delete(source);}};this.cache.set(source,entry);source.addEventListener('dispose',entry.dispose);}
  const key=source.transparent&&!source.depthWrite?'transparent':clean?'clean':'world';let material=entry.variants.get(key);
  if(!material){
   material=source.clone();if(source.isShaderMaterial)material.uniforms=source.uniforms;material.userData={...source.userData};const compile=source.onBeforeCompile.bind(source),cacheKey=source.customProgramCacheKey();
   material.onBeforeCompile=shader=>{compile(shader);shader.fragmentShader='layout(location = 1) out vec4 forgeCleanOutput;\n'+shader.fragmentShader.replace(/}\s*$/,`forgeCleanOutput=vec4(${key==='clean'?'1.':'0.'},0.,0.,${key==='transparent'?'0.':'1.'});\n}`);};
   material.customProgramCacheKey=()=>cacheKey+':world-mask-v1:'+key;entry.variants.set(key,material);
  }
  // Effects fade and actor health hues change while their source material lives.
  if(source.color)material.color.copy(source.color);if(source.emissive)material.emissive.copy(source.emissive);material.opacity=source.opacity;material.emissiveIntensity=source.emissiveIntensity;
  return material;
 }
 bind(root,camera){
  let complete=true;
  const visit=(o,clean)=>{if(!o.visible)return;clean=clean||o.userData.pixelForgeClean===true;
   if((o.isMesh||o.isLine||o.isPoints||o.isSprite)&&o.layers.test(camera.layers)&&o.material){
    const source=o.material;if((Array.isArray(source)?source:[source]).some(m=>m.isRawShaderMaterial)){complete=false;}
    else{this.meshes.push(o);this.materials.push(source);o.material=Array.isArray(source)?source.map(m=>this.material(m,clean)):this.material(source,clean);}
   }
   for(const child of o.children)visit(child,clean);
  };visit(root,false);return complete;
 }
 restore(){for(let i=0;i<this.meshes.length;i++)this.meshes[i].material=this.materials[i];this.meshes.length=this.materials.length=0;}
 render(renderer,scene,camera,actors=null){
  const background=scene.background,auto=renderer.autoClear,alpha=renderer.getClearAlpha();renderer.getClearColor(this.clearColor);let complete;
  try{
   complete=this.bind(scene,camera);if(!complete)return false;renderer.setClearColor(background?.isColor?background:0x182127,1);if(background?.isColor)scene.background=null;
   renderer.clear();const gl=renderer.getContext();gl.clearBufferfv(gl.COLOR,1,this.zero);renderer.autoClear=false;if(actors)actors.render(renderer,scene,camera);else renderer.render(scene,camera);return complete;
  }finally{this.restore();scene.background=background;renderer.autoClear=auto;renderer.setClearColor(this.clearColor,alpha);}
 }
 warmup(renderer,arena,camera,scene){try{this.bind(arena,camera);return renderer.compileAsync(arena,camera,scene);}finally{this.restore();}}
 dispose(){this.restore();for(const entry of [...this.cache.values()])entry.dispose();}
}
