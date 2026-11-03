import * as THREE from './vendor/three.module.js';
import {poseDummy} from './characters.js';

// A real spot on Reservoir's upper crossing, overlooking the waterworks.
export const MENU_STAGE={mapId:'reservoir',position:[-3,34,-6],cameraOffset:[3.5,1.4,3]};
export class MenuStage {
 constructor(scene,rig){
  this.rig=rig;this.group=new THREE.Group();this.group.name='menu-stage';
  this.group.position.fromArray(MENU_STAGE.position);scene.add(this.group);
  const key=new THREE.DirectionalLight(0xffd8a8,1.15);key.position.set(3,4,3);this.group.add(key,key.target);key.target.position.set(0,1,0);
  const rim=new THREE.DirectionalLight(0xb6d9db,.65);rim.position.set(-3,3,-4);this.group.add(rim,rim.target);rim.target.position.set(0,1,0);
  rig.group.rotation.y=Math.atan2(MENU_STAGE.cameraOffset[0],MENU_STAGE.cameraOffset[2])-.55;
  this.group.add(rig.group);
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;
   data[i]=12;data[i+1]=19;data[i+2]=21;data[i+3]=Math.round(Math.max(0,1-radius)**2*115);
  }
  const texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.85),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.008;this.group.add(shadow);
 }
 present(camera,width,height,dt,motion=1){
  this.group.visible=true;this.rig.group.visible=true;
  this.rig.anim.time+=dt*motion;this.rig.anim.twist=-.08;
  poseDummy(this.rig,{dt,menu:true});
  if(!camera.view?.enabled||this.width!==width||this.height!==height){
   this.width=width;this.height=height;
   const p=MENU_STAGE.position,o=MENU_STAGE.cameraOffset;
   camera.position.set(p[0]+o[0],p[1]+o[1],p[2]+o[2]);
   camera.lookAt(p[0],p[1]+.94,p[2]);camera.aspect=width/height;
   camera.fov=height>width?40:36;
   camera.setViewOffset(width,height,-width*(height>width?.25:.23),0,width,height);
   camera.updateMatrixWorld(true);
  }
 }
 hide(camera){this.group.visible=false;camera.clearViewOffset();}
}
