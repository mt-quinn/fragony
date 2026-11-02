import * as THREE from './vendor/three.module.js';
import {blockSpan} from './geometry.js';

// A liquid volume has one visible interface, never transparent side/bottom skins
// coincident with the BSP walls. Keep the original volume for swim physics.
export function waterPolygon(volume){
 let polygon=[[volume.x-volume.w/2,volume.z-volume.d/2],[volume.x+volume.w/2,volume.z-volume.d/2],[volume.x+volume.w/2,volume.z+volume.d/2],[volume.x-volume.w/2,volume.z+volume.d/2]];
 for(const [a,b,c,d] of volume.planes||[]){if(Math.abs(a)+Math.abs(c)<1e-7)continue;const output=[];
  for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],dp=a*p[0]+b*volume.top+c*p[1]-d,dq=a*q[0]+b*volume.top+c*q[1]-d;
   if(dp<=1e-6)output.push(p);if((dp<0)!==(dq<0)){const t=dp/(dp-dq);output.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}
  }polygon=output;
 }return polygon;
}
const vertex=`varying vec3 worldPosition;void main(){vec4 p=modelMatrix*vec4(position,1.);worldPosition=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`;
const fragment=`uniform float time;uniform vec3 shorePlanes[8];varying vec3 worldPosition;
void main(){
 vec3 view=normalize(cameraPosition-worldPosition);float facing=abs(view.y),edge=pow(1.-facing,3.);
 // Broad angular bands: no texture noise, screen distortion or moving geometry.
 vec2 p=worldPosition.xz;float a=sin(p.x*.85+p.y*.38-time*.65),b=sin(p.y*1.12-p.x*.27+time*.43);
 float stripe=fract(p.y*.32+p.x*.05-time*.025+sin(p.x*.35+time*.15)*.055);
 float crest=(1.-smoothstep(.025,.055,abs(stripe-.5)))*smoothstep(.2,.65,sin(p.x*.7-p.y*.12));
 float shore=1000.;for(int i=0;i<8;i++){vec3 plane=shorePlanes[i];shore=min(shore,abs(dot(plane.xy,p)-plane.z));}
 float rim=1.-smoothstep(.035,.13,shore);float broad=floor((a+b)*1.5)/3.;
 vec3 color=mix(vec3(.075,.30,.29),vec3(.24,.52,.48),edge);color+=broad*.012+crest*vec3(.08,.13,.12)+rim*vec3(.15,.25,.22);
 float alpha=mix(.15,.48,edge)+crest*.10+rim*.18;
 // Looking up from inside stays clear enough to read the galleries and exits.
 if(cameraPosition.y<worldPosition.y){alpha*=.66;color=mix(color,vec3(.30,.55,.49),.25);}
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function createWaterSurface(volume){
 const polygon=waterPolygon(volume),positions=[];for(let i=1;i<polygon.length-1;i++)for(const p of [polygon[0],polygon[i+1],polygon[i]])positions.push(p[0],volume.top,p[1]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0},shorePlanes:{value:Array.from({length:8},(_,i)=>{const plane=(volume.planes||[]).filter(p=>Math.hypot(p[0],p[2])>1e-6)[i];if(!plane)return new THREE.Vector3(0,0,1000);const [a,b,c,d]=plane,n=Math.hypot(a,c);return new THREE.Vector3(a/n,c/n,(d-b*volume.top)/n)})}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide});material.forceSinglePass=true;
 const mesh=new THREE.Mesh(geometry,material);mesh.name='water-surface';mesh.userData.waterSurface=true;mesh.layers.set(2);mesh.renderOrder=1;mesh.castShadow=mesh.receiveShadow=false;
 // Scene-local time keeps cached maps synchronized without traversing the arena.
 mesh.onBeforeRender=(_renderer,scene)=>{material.uniforms.time.value=scene.userData.waterTime||0};return mesh;
}
export function submergedAt(position,volumes){
 for(const volume of volumes){const span=blockSpan(volume,position.x,position.z);if(span&&position.y>span.bottom&&position.y<span.top)return Math.min(1,(span.top-position.y)/.18)}return 0;
}
export function createWaterState(){return{amount:0,time:0,color:new THREE.Color(0x315657),airColor:new THREE.Color(0x182127),fog:new THREE.Fog(0x315657,10,90)}}
export function updateWaterState(state,scene,camera,dt,volumes){state.time+=dt;scene.userData.waterTime=state.time;state.amount=THREE.MathUtils.damp(state.amount,submergedAt(camera.position,volumes),18,dt);return state.amount}

export function waterImmersion(feet,height,top){return THREE.MathUtils.clamp((top-feet)/height,0,1)}
// Integrate drag and buoyancy, preserving the velocity carried into the water.
// Neutral floating depth leaves the head near the surface; Space swims upward.
export function swimVertical(velocity,feet,height,top,dt,input=0){
 const depth=waterImmersion(feet,height,top),drag=.15+3.8*depth,acceleration=-23+32*depth+input*25,target=acceleration/drag;
 return target+(velocity-target)*Math.exp(-drag*dt);
}
export function swimHorizontal(x,z,targetX,targetZ,depth,dt){const blend=1-Math.exp(-(1.8+5*depth)*dt);return{x:x+(targetX-x)*blend,z:z+(targetZ-z)*blend}}
