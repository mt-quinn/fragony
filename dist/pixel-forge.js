import * as THREE from './vendor/three.module.js';

// Fixed to the approved lab setting: 3.5px base × 0.5 scale.
export const PIXEL_FORGE_SIZE=1.75;
export const pixelForgeGLSL=`
uniform sampler2D cleanActorTex;
uniform float pixelForgeAmount;
float forgeDither(vec2 p){
 vec2 a=mod(floor(p),4.);float v=0.;
 if(a.y<1.){if(a.x<1.)v=0.;else if(a.x<2.)v=8.;else if(a.x<3.)v=2.;else v=10.;}
 else if(a.y<2.){if(a.x<1.)v=12.;else if(a.x<2.)v=4.;else if(a.x<3.)v=14.;else v=6.;}
 else if(a.y<3.){if(a.x<1.)v=3.;else if(a.x<2.)v=11.;else if(a.x<3.)v=1.;else v=9.;}
 else{if(a.x<1.)v=15.;else if(a.x<2.)v=7.;else if(a.x<3.)v=13.;else v=5.;}
 return (v+.5)/16.-.5;
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
  this.target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});this.target.samples=samples;
  this.black=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,fog:false,toneMapped:false});
  this.white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false,toneMapped:false});
  this.clearColor=new THREE.Color();
  this.meshes=[];this.materials=[];this.hidden=[];
 }
 resize(w,h){this.target.setSize(w,h);}
 render(renderer,scene,camera){
  const background=scene.background,override=scene.overrideMaterial,layers=camera.layers.mask,shadow=renderer.shadowMap.autoUpdate,target=renderer.getRenderTarget();
  const clearColor=renderer.getClearColor(this.clearColor),clearAlpha=renderer.getClearAlpha();
  const visit=(o,clean)=>{
   if(!o.visible)return;clean=clean||o.userData.pixelForgeClean===true;
   if(o.isMesh){
    const m=o.material,transparent=Array.isArray(m)?m.every(x=>x.transparent&&!x.depthWrite):m?.transparent&&!m.depthWrite;
    // Smoke, tracers and water must not hide the clean actor beneath them.
    if(transparent){this.hidden.push(o);o.visible=false;return;}
    this.meshes.push(o);this.materials.push(m);o.material=clean?this.white:this.black;
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
 dispose(){this.target.dispose();this.black.dispose();this.white.dispose();}
}
