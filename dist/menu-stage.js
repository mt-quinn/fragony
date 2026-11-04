import * as THREE from './vendor/three.module.js';
import {poseDummy} from './characters.js';
import {createMuzzleFlash} from './presentation.js';

// A staged firefight in Shoot House's central firing lane. These actors never join AI/combat.
export const MENU_STAGE={mapId:'shoothouse',position:[0,1.56365,0],yaw:Math.PI-Math.atan2(2.6,4),cameraOffset:[2.6,1.4,4.0]};
export class MenuStage {
 constructor(scene,rig,rival=null){
  this.rig=rig;this.rival=rival;this.time=0;this.group=new THREE.Group();this.group.name='menu-stage';
  this.group.position.fromArray(MENU_STAGE.position);this.group.rotation.y=MENU_STAGE.yaw;scene.add(this.group);this.group.add(rig.group);
  this.reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  const key=new THREE.DirectionalLight(0xffdfb4,1.25);key.position.set(2,4,4);this.group.add(key,key.target);key.target.position.set(0,.7,0);
  rig.group.position.set(1.15,0,-.25);rig.group.rotation.set(0,-.46,0);
  poseSlide(rig);
  if(rival){this.group.add(rival.group);rival.group.position.set(-.5,0,3.05);rival.group.rotation.set(0,2.68,0);rival.group.scale.setScalar(.93);rival.anim.twist=.1;rival.anim.time=.6;poseDummy(rival,{dt:1,crouch:1,pitch:-.03,weapon:rival.weapon});}
  const brass=new THREE.MeshStandardMaterial({color:0xb69b54,roughness:.32,metalness:.75}),caseGeo=new THREE.CylinderGeometry(.024,.024,.105,6);
  for(const [x,y,z,rx,rz]of [[.8,1.2,.5,.4,.8],[1.05,1.5,.1,1.4,.2],[.65,1.65,-.2,.8,1.2]]){const shell=new THREE.Mesh(caseGeo,brass);shell.position.set(x,y,z);shell.rotation.set(rx,0,rz);shell.castShadow=true;rig.group.add(shell);}
  const flash=createMuzzleFlash();this.flash=flash;rig.weaponMount.add(flash);flash.position.set(0,.06,.69);flash.rotation.y=Math.PI;flash.scale.setScalar(.42);flash.visible=true;
  const trailMaterial=new THREE.MeshBasicMaterial({color:0xffdf9b,transparent:true,opacity:.8,depthWrite:false}),trailGeo=new THREE.CylinderGeometry(.006,.006,1,5);
  const trail=new THREE.Mesh(trailGeo,trailMaterial);trail.position.set(0,.06,1.8);trail.scale.y=1.4;trail.rotation.x=Math.PI/2;rig.weaponMount.add(trail);
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;data[i]=12;data[i+1]=19;data[i+2]=21;data[i+3]=Math.round(Math.max(0,1-r)**2*130);}
  const texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  shadow.rotation.x=-Math.PI/2;shadow.userData.pixelForgeClean=true;shadow.position.set(1.0,.012,-.05);this.group.add(shadow);if(rival){const contact=shadow.clone();contact.position.set(rival.group.position.x,.012,rival.group.position.z);contact.scale.set(.55,.45,1);this.group.add(contact);}
  // All geometry is persistent; present() only changes the camera, never simulates combat.
  this.target=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);this.group.visible=false;
 }
 present(camera,width,height,dt,motion=1){
  this.group.visible=true;this.rig.group.visible=true;if(this.rival)this.rival.group.visible=true;
  const amount=this.reducedMotion?.matches?0:THREE.MathUtils.clamp(Number(motion)||0,0,1);this.time+=Math.min(dt,.1)*amount;
  const drift=Math.sin(this.time*.12)*.12*amount,o=MENU_STAGE.cameraOffset,portrait=height>width,zoom=portrait?1.4:1;
  camera.position.set(o[0]*zoom+drift,o[1]*zoom,o[2]*zoom-drift*.5).applyAxisAngle(this.up,MENU_STAGE.yaw).add(this.group.position);
  this.target.set(-.15,1.0,.15).applyAxisAngle(this.up,MENU_STAGE.yaw).add(this.group.position);camera.lookAt(this.target);camera.aspect=width/height;camera.fov=portrait?90:THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(21))*(844/390)/camera.aspect));
  camera.setViewOffset(width,height,-width*(portrait?.09:.07),height*.10,width,height);camera.updateMatrixWorld(true);
 }
 hide(camera){this.group.visible=false;camera.clearViewOffset();}
}

// Static inverse kinematics: a reclined slide, one hand planted, the other aiming.
// Keep all joints at their real lengths rather than stretching the mannequin.
function limb(root,hinge,start,end,pole,l1,l2){
 const down=new THREE.Vector3(0,-1,0),direction=end.clone().sub(start),distance=THREE.MathUtils.clamp(direction.length(),.04,l1+l2-.003);direction.normalize();
 const bendDirection=pole.clone().addScaledVector(direction,-pole.dot(direction)).normalize(),along=(l1*l1+distance*distance-l2*l2)/(2*distance),bend=Math.sqrt(Math.max(.00001,l1*l1-along*along));
 const elbow=start.clone().addScaledVector(direction,along).addScaledVector(bendDirection,bend);
 root.position.copy(start);root.quaternion.setFromUnitVectors(down,elbow.clone().sub(start).normalize());hinge.position.set(0,-l1,0);
 hinge.quaternion.setFromUnitVectors(down,end.clone().sub(elbow).normalize().applyQuaternion(root.quaternion.clone().invert()));
}
function poseSlide(rig){
 poseDummy(rig,{dt:1,crouch:1,sliding:1,weapon:rig.weapon});
 rig.parts.pelvis.position.set(0,.32,0);rig.parts.pelvis.rotation.set(-.35,0,.14);
 rig.parts.torso.position.set(.025,.67,-.18);rig.parts.torso.rotation.set(-.50,-.08,.30);
 rig.parts.head.position.set(.12,.99,-.39);rig.parts.head.rotation.set(-.12,-.16,.10);
 for(const [side,foot]of [['left',[-.18,.08,.74]],['right',[.27,.08,.56]]]){
  limb(rig.parts[side+'Leg'],rig.joints[side+'Knee'],new THREE.Vector3(side==='left'?-.165:.165,.32,0),new THREE.Vector3(...foot),new THREE.Vector3(0,1,1),.4,.39);
  rig.joints[side+'Foot'].quaternion.copy(rig.parts[side+'Leg'].quaternion).multiply(rig.joints[side+'Knee'].quaternion).invert();
 }
 const grip=new THREE.Vector3(.17,.75,.30);
 limb(rig.parts.rightArm,rig.joints.rightElbow,new THREE.Vector3(.30,.80,-.18),grip,new THREE.Vector3(1,-.3,-.2),.29,.27);
 limb(rig.parts.leftArm,rig.joints.leftElbow,new THREE.Vector3(-.28,.60,-.22),new THREE.Vector3(-.44,.085,-.36),new THREE.Vector3(-1,0,0),.29,.27);
 rig.joints.leftHand.rotation.x=-.7;
 const inverse=rig.parts.rightArm.quaternion.clone().invert();rig.weaponMount.position.copy(grip).sub(rig.parts.rightArm.position).applyQuaternion(inverse);
 rig.weaponMount.quaternion.copy(inverse).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.08,-.10,.08)));
}
