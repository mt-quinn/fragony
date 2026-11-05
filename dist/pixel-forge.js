import * as THREE from './vendor/three.module.js';

// Fixed to the approved lab setting: 3.5px base × 0.5 scale.
export const PIXEL_FORGE_SIZE=1.75;
export const pixelForgeGLSL=`
uniform sampler2D cleanActorTex;
uniform float pixelForgeAmount;
uniform sampler2D worldDepth;
uniform mat4 inverseProjection,cameraWorld;
float forgeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
vec3 forgeSurfacePosition(vec2 uv){
 float depth=texture2D(worldDepth,uv).r;
 vec4 view=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
 return (cameraWorld*vec4(view.xyz/view.w,1.)).xyz;
}
float forgeSurfaceGrain(vec2 uv){
 vec3 p=forgeSurfacePosition(uv)*18.;
 vec3 n=abs(cross(dFdx(p),dFdy(p)));
 // Remove derivative magnitude before sharpening the axis weights. Otherwise
 // small nearby footprints collapse below the epsilon and erase the grain.
 n/=max(max(n.x,n.y),max(n.z,.00000001));
 n=pow(n,vec3(4.));n/=max(dot(n,vec3(1.)),.00001);
 float yz=forgeHash(floor(p.yz)+vec2(17.,31.));
 float xz=forgeHash(floor(p.xz)+vec2(47.,13.));
 float xy=forgeHash(floor(p.xy)+vec2(71.,59.));
 float footprint=max(length(dFdx(p)),length(dFdy(p)));
 // Keep close detail, then taper gently instead of cutting off at footprint 2.
 float grainSpread=max(0.,footprint-.75)*.4;
 return dot(vec3(yz,xz,xy)-vec3(.5),n)/(1.+grainSpread*grainSpread);
}
vec3 forgePalette(vec3 c){
 vec3 best=vec3(.075,.12,.13);float dst=100.;
 for(int i=0;i<12;i++){
  vec3 p=vec3(.075,.12,.13);
  if(i==1)p=vec3(.17,.24,.24);if(i==2)p=vec3(.29,.36,.32);if(i==3)p=vec3(.46,.51,.4);
  if(i==4)p=vec3(.67,.69,.51);if(i==5)p=vec3(.87,.86,.68);if(i==6)p=vec3(.94,.94,.83);
  if(i==7)p=vec3(.58,.32,.22);if(i==8)p=vec3(.79,.46,.28);if(i==9)p=vec3(.8,.77,.27);
  if(i==10)p=vec3(.32,.55,.54);if(i==11)p=vec3(.65,.8,.36);
  float d=dot((c-p)*vec3(.9,1.1,.8),c-p);if(d<dst){dst=d;best=p;}
 }
 return best;
}
`;

// Render one black/white scene pass. Its own depth buffer handles cover,
// intersecting actors, and ragdolls without drawing silhouettes through walls.
export class PixelForgeMask{
 constructor(samples=0){
  this.target=new THREE.WebGLRenderTarget(1,1,{format:THREE.RedFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});this.target.samples=samples;
  this.target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  this.black=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,fog:false,toneMapped:false});
  this.white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false,toneMapped:false});
  this.clearColor=new THREE.Color();
  // The color pass already resolved opaque-world depth. Draw only clean actors
  // against it instead of submitting every environment triangle a second time.
  this.depthUniforms={maskWorldDepth:{value:null},maskSize:{value:new THREE.Vector2(1,1)}};
  this.whiteDepth=this.white.clone();
  const depthCompile=shader=>{Object.assign(shader.uniforms,this.depthUniforms);shader.fragmentShader='uniform sampler2D maskWorldDepth;uniform vec2 maskSize;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(gl_FragCoord.z>texture2D(maskWorldDepth,gl_FragCoord.xy/maskSize).r+0.00000012) discard;');};
  this.whiteDepth.onBeforeCompile=depthCompile;this.whiteDepth.customProgramCacheKey=()=> 'forge-depth-reuse-v1';
  this.meshes=[];this.materials=[];this.hidden=[];this.cutouts=new WeakMap();this.cutoutMaterials=new Set();
 }
 maskMaterial(source,clean,depth=false){
  const base=clean?(depth?this.whiteDepth:this.white):this.black;
  if(!source?.alphaTest||(!source.alphaMap&&!source.map))return base;
  let pair=this.cutouts.get(source);if(!pair){pair={};this.cutouts.set(source,pair);}
  const key=clean?(depth?'whiteDepth':'white'):'black';if(!pair[key]){
   const material=base.clone();if(clean&&depth){material.onBeforeCompile=base.onBeforeCompile;material.customProgramCacheKey=base.customProgramCacheKey;}material.alphaTest=source.alphaTest;material.alphaMap=source.alphaMap;material.map=source.map;material.side=source.side;
   pair[key]=material;this.cutoutMaterials.add(material);
  }
  return pair[key];
 }
 resize(w,h){this.target.setSize(w,h);this.depthUniforms.maskSize.value.set(w,h);}
 render(renderer,scene,camera,worldDepth=null){
  this.depthUniforms.maskWorldDepth.value=worldDepth;
  const background=scene.background,override=scene.overrideMaterial,layers=camera.layers.mask,shadow=renderer.shadowMap.autoUpdate,target=renderer.getRenderTarget();
  const clearColor=renderer.getClearColor(this.clearColor),clearAlpha=renderer.getClearAlpha();
  const visit=(o,clean)=>{
   if(!o.visible)return;clean=clean||o.userData.pixelForgeClean===true;
   if(o.isMesh){
    const m=o.material,transparent=Array.isArray(m)?m.every(x=>x.transparent&&!x.depthWrite):m?.transparent&&!m.depthWrite;
    // Smoke, tracers and water must not hide the clean actor beneath them.
    if(transparent||worldDepth&&!clean){this.hidden.push(o);o.visible=false;for(const child of o.children)visit(child,clean);return;}
    this.meshes.push(o);this.materials.push(m);o.material=Array.isArray(m)?m.map(source=>this.maskMaterial(source,clean,!!worldDepth)):this.maskMaterial(m,clean,!!worldDepth);
   }
   for(const child of o.children)visit(child,clean);
  };
  try{
   visit(scene,false);scene.background=null;scene.overrideMaterial=null;
   camera.layers.set(0);renderer.shadowMap.autoUpdate=false;
   renderer.setRenderTarget(this.target);renderer.setClearColor(0,1);renderer.clear();renderer.render(scene,camera);
  }finally{
   for(let i=0;i<this.meshes.length;i++)this.meshes[i].material=this.materials[i];
   for(const o of this.hidden)o.visible=true;
   this.meshes.length=this.materials.length=this.hidden.length=0;
   scene.background=background;scene.overrideMaterial=override;camera.layers.mask=layers;renderer.shadowMap.autoUpdate=shadow;
   renderer.setRenderTarget(target);renderer.setClearColor(clearColor,clearAlpha);
  }
 }
 dispose(){for(const m of this.cutoutMaterials)m.dispose();this.cutoutMaterials.clear();this.target.depthTexture.dispose();this.target.dispose();this.black.dispose();this.white.dispose();this.whiteDepth.dispose();}
}
