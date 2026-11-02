import * as THREE from './vendor/three.module.js';
import {GTAOPass} from './vendor/addons/postprocessing/GTAOPass.js';

const surfaces=new Map();
export function surface(color,world=false){
 const key=color+':'+world;if(surfaces.has(key))return surfaces.get(key);
 const c=new THREE.Color(color),l=c.getHSL({}).l,signal=c.g>.55&&c.r>.45&&c.b<.2;
 const material=new THREE.MeshStandardMaterial({color,roughness:signal?.48:l<.16?.68:.73,metalness:0,vertexColors:world});surfaces.set(key,material);return material;
}
export const MATERIALS={
 ceramic:new THREE.MeshStandardMaterial({color:0xe3e5d8,roughness:.38,metalness:.12}),
 graphite:new THREE.MeshStandardMaterial({color:0x252e32,roughness:.43,metalness:.48}),
 rubber:new THREE.MeshStandardMaterial({color:0x11191d,roughness:.96,metalness:0}),
 steel:new THREE.MeshStandardMaterial({color:0x869493,roughness:.25,metalness:.88}),
 yellow:new THREE.MeshStandardMaterial({color:0xcbdc45,roughness:.41,metalness:.16}),
 casing:new THREE.MeshStandardMaterial({color:0xb6ad78,roughness:.3,metalness:.78}),
 bore:new THREE.MeshStandardMaterial({color:0x080f12,roughness:1}),
 lamp:new THREE.MeshStandardMaterial({color:0xe9efcf,emissive:0xe4eec2,emissiveIntensity:3.2,roughness:.7})
};
export function studioEnvironment(renderer){
 if(!renderer.extensions.has('EXT_color_buffer_float'))return {texture:null,dispose(){}};
 const room=new THREE.Scene();room.add(new THREE.Mesh(new THREE.BoxGeometry(50,50,50),new THREE.MeshBasicMaterial({color:0x45545a,side:THREE.BackSide})));
 const panels=[];for(const [x,y,z,w,h,color,power]of [[-7,5,2,5,12,0xe9efe1,3],[6,4,-6,4,9,0xb2c5cb,1.8],[0,13,0,13,6,0xf3edc9,2]]){const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide}),m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.lookAt(0,0,0);room.add(m);panels.push(m)}
 const generator=new THREE.PMREMGenerator(renderer),target=generator.fromScene(room,0,.1,100);generator.dispose();room.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});return target;
}
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const read=`uniform sampler2D worldTex;uniform sampler2D gunTex;varying vec2 vUv;vec3 colorAt(vec2 uv){vec4 g=texture2D(gunTex,uv);return mix(texture2D(worldTex,uv).rgb,g.rgb,g.a);}`;
const prefilter=read+`void main(){vec3 c=colorAt(vUv);float b=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*max(0.,b-1.8)/max(b,.001),1.);}`;
const blur=`uniform sampler2D image;uniform vec2 direction;varying vec2 vUv;void main(){vec3 c=texture2D(image,vUv).rgb*.227027;c+=texture2D(image,vUv+direction*1.384615).rgb*.316216;c+=texture2D(image,vUv-direction*1.384615).rgb*.316216;c+=texture2D(image,vUv+direction*3.230769).rgb*.070270;c+=texture2D(image,vUv-direction*3.230769).rgb*.070270;gl_FragColor=vec4(c,1.);}`;
const final=read+`uniform float aoAmount;uniform sampler2D ambientTex;uniform sampler2D bloomTex;uniform vec2 texel;uniform float slow;
void main(){
 vec3 w=texture2D(worldTex,vUv).rgb;float contact=mix(1.,texture2D(ambientTex,vUv).r,aoAmount);w*=contact;
 vec4 g=texture2D(gunTex,vUv);vec3 c=mix(w,g.rgb,g.a);
 // Modest edge smoothing; geometry stays crisp, including thin sights.
 vec3 a=colorAt(vUv+vec2(texel.x,0)),b=colorAt(vUv-vec2(texel.x,0)),d=colorAt(vUv+vec2(0,texel.y)),e=colorAt(vUv-vec2(0,texel.y));
 float l=dot(c,vec3(.299,.587,.114)),range=max(max(length(a-b),length(d-e)),.001);float edge=smoothstep(.16,.65,range)*.08;c=mix(c,(a+b+d+e)*.25,edge);
 c+=texture2D(bloomTex,vUv).rgb*(.105+slow*.045);
 // Restrained high-speed photographic grade, preserving the health-color range.
 c*=vec3(1.025,1.025,1.);c=mix(c,c*vec3(.94,1.015,1.045),slow*.22);c*=1.+slow*.065;
 float printPattern=mod(gl_FragCoord.x+mod(gl_FragCoord.y,2.)*2.,4.)/4.-.375;c+=printPattern*.006*(1.-smoothstep(.1,.6,l));
 vec2 p=vUv-.5;float vignette=1.-dot(p,p)*.14;c*=vignette;
 gl_FragColor=vec4(max(c,vec3(0.)),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
// Keep magnified targets independent of the first-person optic housing.
export function renderWeaponView(renderer,scene,camera){
 const fov=camera.fov,viewFov=Math.max(fov,camera.userData.weaponFovFloor||fov);
 if(viewFov!==fov){camera.fov=viewFov;camera.updateProjectionMatrix()}
 try{renderer.render(scene,camera)}finally{if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}}
}
export class FrameRenderer{
 constructor(renderer,worldScene,worldCamera){
  this.renderer=renderer;this.slow=0;this.scene=new THREE.Scene();this.camera=new THREE.Camera();this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);this.quad.frustumCulled=false;this.scene.add(this.quad);
  const hdr=renderer.extensions.has('EXT_color_buffer_float'),options={type:hdr?THREE.HalfFloatType:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter};
  this.world=new THREE.WebGLRenderTarget(1,1,options);this.world.samples=Math.min(2,renderer.capabilities.maxSamples);
  this.gun=new THREE.WebGLRenderTarget(1,1,options);this.gun.samples=this.world.samples;
  this.ambientTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
  this.gtao=hdr?new GTAOPass(worldScene,worldCamera,1,1,undefined,{radius:.38,thickness:.20,distanceFallOff:.6,scale:.7,samples:12},{radius:5,samples:12,depthPhi:3,normalPhi:4}):null;
  if(this.gtao){
   // The AO depth pass must see the same two-sided BSP walls as the color pass.
   this.gtao.normalMaterial.side=THREE.DoubleSide;
   this.gtao.output=GTAOPass.OUTPUT.Denoise;
  }
  this.bloomA=new THREE.WebGLRenderTarget(1,1,{...options,depthBuffer:false});this.bloomB=this.bloomA.clone();
  const common={worldTex:{value:this.world.texture},gunTex:{value:this.gun.texture}};
  this.prefilter=new THREE.ShaderMaterial({uniforms:common,vertexShader:vertex,fragmentShader:prefilter,depthTest:false,depthWrite:false,toneMapped:false});
  this.blur=new THREE.ShaderMaterial({uniforms:{image:{value:null},direction:{value:new THREE.Vector2()}},vertexShader:vertex,fragmentShader:blur,depthTest:false,depthWrite:false,toneMapped:false});
  this.output=new THREE.ShaderMaterial({uniforms:{...common,aoAmount:{value:this.gtao ? .65 : 0},ambientTex:{value:this.ambientTarget.texture},bloomTex:{value:this.bloomA.texture},texel:{value:new THREE.Vector2()},slow:{value:0}},vertexShader:vertex,fragmentShader:final,depthTest:false,depthWrite:false});
  this.resize();
 }
 resize(){const size=this.renderer.getDrawingBufferSize(new THREE.Vector2()),aw=Math.max(1,Math.floor(size.x*.45)),ah=Math.max(1,Math.floor(size.y*.45));this.world.setSize(size.x,size.y);this.gun.setSize(size.x,size.y);this.ambientTarget.setSize(aw,ah);this.gtao?.setSize(aw,ah);this.bloomA.setSize(Math.max(1,size.x>>2),Math.max(1,size.y>>2));this.bloomB.setSize(Math.max(1,size.x>>2),Math.max(1,size.y>>2));this.output.uniforms.texel.value.set(1/size.x,1/size.y)}
 pass(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera)}
 render(scene,camera,dt,slow=false){
  const r=this.renderer,background=scene.background,mask=camera.layers.mask;this.slow=THREE.MathUtils.damp(this.slow,slow?1:0,9,dt);this.output.uniforms.slow.value=this.slow;
  camera.layers.set(0);r.setRenderTarget(this.world);r.setClearColor(0x182127,1);r.render(scene,camera);
  const autoShadow=r.shadowMap.autoUpdate;r.shadowMap.autoUpdate=false;scene.background=null;
  if(this.gtao)this.gtao.render(r,this.ambientTarget,this.world);else{r.setRenderTarget(this.ambientTarget);r.setClearColor(0xffffff,1);r.clear()}
  camera.layers.set(1);r.setRenderTarget(this.gun);r.setClearColor(0,0);r.clear();renderWeaponView(r,scene,camera);scene.background=background;camera.layers.mask=mask;r.shadowMap.autoUpdate=autoShadow;
  this.pass(this.prefilter,this.bloomA);this.blur.uniforms.image.value=this.bloomA.texture;this.blur.uniforms.direction.value.set(1/this.bloomA.width,0);this.pass(this.blur,this.bloomB);this.blur.uniforms.image.value=this.bloomB.texture;this.blur.uniforms.direction.value.set(0,1/this.bloomB.height);this.pass(this.blur,this.bloomA);this.pass(this.output,null);r.setClearColor(0x182127,1);
 }
 dispose(){for(const t of [this.world,this.gun,this.bloomA,this.bloomB,this.ambientTarget])t.dispose();for(const m of [this.prefilter,this.blur,this.output])m.dispose();this.gtao?.dispose();this.quad.geometry.dispose()}
}

let contactTexture;
function contactMap(){if(contactTexture)return contactTexture;const data=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot(x-31.5,y-31.5)/32;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-r)**2*180)}contactTexture=new THREE.DataTexture(data,64,64);contactTexture.minFilter=contactTexture.magFilter=THREE.LinearFilter;contactTexture.needsUpdate=true;return contactTexture}
export function dressArena(arena,solids,collision=null){
 const box=new THREE.BoxGeometry(1,1,1),softShadow=new THREE.MeshBasicMaterial({color:0x0b181d,map:contactMap(),transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),plane=new THREE.PlaneGeometry(1,1);
 // Broad baked-style grounding under the main walls; runtime AO adds short contacts.
 const grounded=solids.filter(b=>b.y-b.h/2<=.1&&b.style!=='stair'),shadows=new THREE.InstancedMesh(plane,softShadow,grounded.length);let shadowIndex=0;for(const b of grounded){const s=new THREE.Mesh(plane,softShadow);s.rotation.set(-Math.PI/2,0,-(b.yaw||0));s.position.set(b.x,.025,b.z);s.scale.set(b.w+1.6,b.d+1.6,1);s.updateMatrix();shadows.setMatrixAt(shadowIndex++,s.matrix)}arena.add(shadows)
 const add=(x,y,z,w,h,d,material)=>{const m=new THREE.Mesh(box,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;arena.add(m);return m};
 const solid=m=>{if(collision){const p=m.position,s=m.scale;collision.blocks.push({x:p.x,z:p.z,w:s.x,d:s.z,bottom:p.y-s.y/2,top:p.y+s.y/2,yaw:0});collision.worldMeshes.push(m)}return m};
 // CORE is a lit impact-test bay: overhead softboxes, flush floor plates, capture rigs.
 for(const z of [-14,-2,10]){solid(add(3,11.7,z,15,.22,1.05,MATERIALS.graphite));const lamp=solid(add(3,11.55,z,13.8,.055,.68,MATERIALS.lamp));lamp.castShadow=false;for(const x of [-3.5,9.5])add(x,12.5,z,.065,1.5,.065,MATERIALS.steel)}
 for(const x of [-9,0,9])for(const z of [-16,-8,0,8,16]){const p=add(x,.026,z,6.6,.012,5.7,surface(0x899b97));p.castShadow=false;for(const side of [-1,1]){const seam=add(x+side*3.3,.035,z,.035,.009,5.7,surface(0x4d6261));seam.castShadow=false}}
 for(const x of [-8,8]){add(x,9.2,-19.99,.07,1.2,.08,MATERIALS.steel);add(x,8.7,-19.8,.44,.25,.36,MATERIALS.graphite);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.075,12),MATERIALS.steel);lens.rotation.x=Math.PI/2;lens.position.set(x,8.7,-19.56);arena.add(lens)}
 // Flush safety bands and service panels stay on existing geometry, outside routes.
 for(const x of [-10,0,10]){add(x,6.5,-20.08,6,.055,.018,MATERIALS.steel);for(let i=0;i<5;i++){const tick=add(x-2+i*.26,6.4,-20.06,.12,.09,.018,MATERIALS.yellow);tick.rotation.z=-.5}}
 const coreFill=new THREE.PointLight(0xe7edce,52,24,2);coreFill.position.set(3,9,-2);arena.add(coreFill);
 const rangeFill=new THREE.PointLight(0xaec9d1,24,21,2);rangeFill.position.set(27,8,-8);arena.add(rangeFill);
}
let muzzleFlashGeometry;
export function createMuzzleFlash(){
 const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:new THREE.Color(7,5.5,2.4),transparent:true,opacity:.95,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const points=[0,0,0,-.08,.09,-.13,0,.023,-.38,.08,.09,-.13,0,0,0,.08,-.09,-.13,0,-.023,-.38,-.08,-.09,-.13];const geo=muzzleFlashGeometry||(muzzleFlashGeometry=new THREE.BufferGeometry());if(!geo.attributes.position){geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex([0,1,2,0,2,3,4,5,6,4,6,7])}
 for(const angle of [0,Math.PI/2]){const blade=new THREE.Mesh(geo,material);blade.rotation.z=angle;group.add(blade)}group.material=material;return group;
}
const smokePlane=new THREE.PlaneGeometry(1,1);
export function smokeMesh(position,color=0xa7b5aa,size=.08){const m=new THREE.Mesh(smokePlane,new THREE.MeshBasicMaterial({color,map:contactMap(),transparent:true,opacity:.22,depthWrite:false}));m.position.copy(position);m.scale.setScalar(size);return m}
