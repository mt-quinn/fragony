import * as THREE from './vendor/three.module.js';
import {SMAAPass} from './vendor/addons/postprocessing/SMAAPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {FXAAShader} from './vendor/addons/shaders/FXAAShader.js';

export function antialiasOptions(settings={}){
 return {antialias:settings.antialias!==false,msaa:[0,2,4].includes(settings.msaa)?settings.msaa:2,aaFilter:['none','fxaa','smaa'].includes(settings.aaFilter)?settings.aaFilter:'none',taa:settings.taa===true};
}
export function supportedSamples(renderer,type,requested){
 if(!requested)return 0;
 // Some GPUs expose 4× only: a request for 2× actually allocates 4×.
 const gl=renderer.getContext?.(),counts=gl?.getInternalformatParameter(gl.RENDERBUFFER,type===THREE.HalfFloatType?gl.RGBA16F:gl.RGBA8,gl.SAMPLES);
 if(counts){const sorted=Array.from(counts).filter(n=>n>0).sort((a,b)=>a-b);return sorted.find(n=>n>=requested)??sorted.at(-1)??0;}
 return Math.min(requested,renderer.capabilities.maxSamples);
}
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const temporalFragment=`
 uniform sampler2D currentTex,depthTex,historyTex;
 uniform mat4 inverseVP,previousVP,previousView,currentView;
 uniform vec2 texel;
 uniform float historyWeight,farPlane,depthTolerance;
 varying vec2 vUv;
 void main(){
  vec3 current=texture2D(currentTex,vUv).rgb;
  float depth=texture2D(depthTex,vUv).x;
  vec4 world=inverseVP*vec4(vUv*2.-1.,depth*2.-1.,1.);world/=world.w;
  vec4 oldClip=previousVP*world;vec2 oldUV=oldClip.xy/max(oldClip.w,.00001)*.5+.5;
  vec4 old=texture2D(historyTex,clamp(oldUV,vec2(0.),vec2(1.)));
  float expected=-(previousView*world).z;
  float valid=step(.00001,oldClip.w)*step(0.,oldUV.x)*step(oldUV.x,1.)*step(0.,oldUV.y)*step(oldUV.y,1.)*step(depth,.999999);
  valid*=step(abs(old.a*farPlane-expected),max(depthTolerance,expected*.01));
  // Clamp stale samples to the current 3×3 neighborhood and reject color changes.
  vec3 lo=current,hi=current;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   vec3 c=texture2D(currentTex,vUv+vec2(float(x),float(y))*texel).rgb;lo=min(lo,c);hi=max(hi,c);
  }
  vec3 history=clamp(old.rgb,lo,hi);
  float reactive=clamp(length(current-history)/(length(current)+.1),0.,1.);
  float weight=historyWeight*valid*(1.-reactive);
  gl_FragColor=vec4(mix(current,history,weight),clamp(-(currentView*world).z/farPlane,0.,1.));
 }`;
const jitter=[[.5,1/3],[.25,2/3],[.75,1/9],[.125,4/9],[.625,7/9],[.375,2/9],[.875,5/9],[.0625,8/9]];

// Camera reprojection, not object-motion reprojection. Moving geometry remains experimental.
export class TemporalAA{
 constructor(type){
  this.targets=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,{type,depthBuffer:false}));
  this.projection=new THREE.Matrix4();this.previousVP=new THREE.Matrix4();this.previousView=new THREE.Matrix4();this.position=new THREE.Vector3();this.rotation=new THREE.Quaternion();this.valid=false;this.index=0;this.frame=0;this.fov=null;
  this.material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:temporalFragment,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{currentTex:{value:null},depthTex:{value:null},historyTex:{value:null},inverseVP:{value:new THREE.Matrix4()},previousVP:{value:this.previousVP},previousView:{value:this.previousView},currentView:{value:new THREE.Matrix4()},texel:{value:new THREE.Vector2()},historyWeight:{value:0},farPlane:{value:160},depthTolerance:{value:type===THREE.HalfFloatType?.04:1.3}}});
 }
 resize(w,h){for(const t of this.targets)t.setSize(w,h);this.material.uniforms.texel.value.set(1/w,1/h);this.reset();}
 reset(){this.valid=false;this.frame=0;}
 begin(camera,dt){
  camera.updateMatrixWorld();
  if(dt>.09||(this.fov===null||Math.abs(this.fov-camera.fov)>.1)||this.position.distanceToSquared(camera.position)>16||Math.abs(this.rotation.dot(camera.quaternion))<.85)this.reset();
  this.projection.copy(camera.projectionMatrix);
  const [x,y]=jitter[this.frame++%jitter.length],size=this.targets[0];
  camera.projectionMatrix.elements[8]+=(x-.5)*2/size.width;
  camera.projectionMatrix.elements[9]+=(y-.5)*2/size.height;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  const u=this.material.uniforms;u.inverseVP.value.multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);u.currentView.value.copy(camera.matrixWorldInverse);u.farPlane.value=camera.far;u.historyWeight.value=this.valid?.85:0;
 }
 restore(camera){camera.projectionMatrix.copy(this.projection);camera.projectionMatrixInverse.copy(this.projection).invert();}
 resolve(camera,world,pass){
  const target=this.targets[this.index],history=this.targets[1-this.index],u=this.material.uniforms;
  u.currentTex.value=world.texture;u.depthTex.value=world.depthTexture;u.historyTex.value=history.texture;
  pass(this.material,target);
  this.previousVP.copy(u.inverseVP.value).invert();this.previousView.copy(u.currentView.value);
  this.position.copy(camera.position);this.rotation.copy(camera.quaternion);this.fov=camera.fov;this.valid=true;this.index=1-this.index;
  return target.texture;
 }
 dispose(){for(const t of this.targets)t.dispose();this.material.dispose();}
}

export class SpatialAA{
 constructor(filter,type){
  this.filter=filter;this.input=new THREE.WebGLRenderTarget(1,1,{type,depthBuffer:false});
  this.output=new OutputPass();
  if(filter==='smaa'){
   this.smaa=new SMAAPass();
   // Match the existing byte fallback on devices without HDR render targets.
   this.smaa._edgesRT.texture.type=type;this.smaa._weightsRT.texture.type=type;
   this.filtered=this.input.clone();this.output.renderToScreen=true;
  }else{
   this.filtered=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
   this.fxaa=new THREE.ShaderMaterial({...FXAAShader,uniforms:THREE.UniformsUtils.clone(FXAAShader.uniforms),depthTest:false,depthWrite:false,toneMapped:false});
  }
 }
 resize(w,h){this.input.setSize(w,h);this.filtered.setSize(w,h);this.smaa?.setSize(w,h);this.fxaa?.uniforms.resolution.value.set(1/w,1/h);}
 render(renderer,pass){
  if(this.smaa){this.smaa.render(renderer,this.filtered,this.input);this.output.render(renderer,null,this.filtered);}
  else{this.output.render(renderer,this.filtered,this.input);this.fxaa.uniforms.tDiffuse.value=this.filtered.texture;pass(this.fxaa,null);}
 }
 dispose(){this.input.dispose();this.filtered.dispose();this.output.dispose();this.smaa?.dispose();this.fxaa?.dispose();}
}
