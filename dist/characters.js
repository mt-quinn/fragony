import * as THREE from './vendor/three.module.js';

// The same joint endpoints drive living poses, hit regions and the death solver.
const UP=new THREE.Vector3(0,1,0),DOWN=new THREE.Vector3(0,-1,0),FORWARD=new THREE.Vector3(0,0,1);
const v=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3(),q=new THREE.Quaternion(),basis=new THREE.Matrix4();
const collisionProbe={p:new THREE.Vector3(),radius:.05,contact:new THREE.Vector3()},probeBefore=new THREE.Vector3();
const clamp=THREE.MathUtils.clamp,damp=THREE.MathUtils.damp;
const lathe=points=>new THREE.LatheGeometry(points.map(([y,r])=>new THREE.Vector2(r,y)),12);
const geo={
 chest:lathe([[-.15,0],[-.145,.145],[-.10,.19],[-.035,.235],[.10,.265],[.20,.23],[.245,.15],[.25,0]]),
 pelvis:lathe([[-.125,0],[-.12,.11],[-.07,.20],[.035,.235],[.11,.18],[.12,0]]),
 head:lathe([[-.155,0],[-.15,.075],[-.11,.10],[-.025,.135],[.08,.14],[.145,.12],[.175,.065],[.18,0]]),
 thigh:lathe([[-.37,0],[-.36,.055],[-.28,.085],[-.13,.105],[-.065,.095],[-.035,.055],[-.03,0]]),
 shin:lathe([[-.365,0],[-.35,.045],[-.25,.055],[-.13,.082],[-.055,.075],[-.025,.04],[-.02,0]]),
 upperArm:lathe([[-.26,0],[-.25,.047],[-.19,.067],[-.09,.085],[-.035,.067],[-.025,0]]),
 forearm:lathe([[-.245,0],[-.23,.038],[-.16,.05],[-.07,.067],[-.025,.05],[-.02,0]]),
 joint:new THREE.SphereGeometry(1,10,6), foot:new THREE.SphereGeometry(1,12,6),
 ring:new THREE.TorusGeometry(1,.14,4,12), screw:new THREE.CylinderGeometry(1,1,1,8)
};
function mesh(parent,g,material,x,y,z,sx=1,sy=1,sz=1,health=false){const m=new THREE.Mesh(g,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;m.userData.healthShell=health;parent.add(m);return m}
function joint(parent,mat,x,y,z,r){return mesh(parent,geo.joint,mat,x,y,z,r,r,r)}
function pivot(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
export function createDummyRig({mat,target,weapon='rifle'}){
 const group=new THREE.Group(),parts={},joints={},markers={},shellMat=mat(0xd9ef45),black=mat(0x182127),metal=mat(0x606c6d);
 const part=(name,x,y,z)=>{const p=pivot(group,x,y,z);p.name=name;p.userData.part=name;parts[name]=p;return p};
 const mark=(name,parent,x=0,y=0,z=0)=>{const m=pivot(parent,x,y,z);markers[name]=m;return m};
 const shell=(parent,g,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>mesh(parent,g,shellMat,x,y,z,sx,sy,sz,true);
 const pelvis=part('pelvis',0,.9,0);shell(pelvis,geo.pelvis,0,0,0,1,1,.67);mark('pelvis',pelvis);
 // A rubber bellows spine separates the hard chest and hip shells.
 const torso=part('torso',0,1.30,0);shell(torso,geo.chest,0,0,0,1,1,.64);mark('chest',torso);mark('neck',torso,0,.285,0);
 mesh(torso,geo.joint,black,0,-.20,0,.125,.17,.095);
 for(let i=0;i<5;i++){const rib=mesh(torso,geo.ring,metal,0,-.09-i*.032,0,.133,.093,.133);rib.rotation.x=Math.PI/2}
 target(torso,-.145,.115,.149,.047);target(torso,.145,.115,.149,.047);target(torso,0,.035,-.164,.075,Math.PI);
 const neck=joint(torso,black,0,.285,0,.068);neck.scale.y=.1;
 const head=part('head',0,1.735,0);shell(head,geo.head,0,0,0,1,1,.82);mark('head',head);
 // A molded brow, nose and chin, rather than painted eyes or a face plate.
 shell(head,geo.joint,0,-.008,.109,.025,.052,.032);shell(head,geo.joint,0,-.087,.086,.065,.027,.025);
 mesh(head,geo.joint,black,0,-.068,.114,.033,.006,.006);target(head,-.132,.02,0,.062,-Math.PI/2);target(head,.132,.02,0,.062,Math.PI/2);
 for(const side of [-1,1]){
  const prefix=side<0?'left':'right',leg=part(prefix+'Leg',side*.165,.88,0);mark(prefix+'Hip',leg);joint(leg,black,0,0,0,.084);shell(leg,geo.thigh,0,0,0,1,1,.83);
  const knee=pivot(leg,0,-.4,0);joints[prefix+'Knee']=knee;mark(prefix+'Knee',knee);joint(knee,black,0,0,0,.068);shell(knee,geo.shin,0,0,0,1,1,.85);
  const ankle=pivot(knee,0,-.39,0);joints[prefix+'Foot']=ankle;mark(prefix+'Ankle',ankle);joint(ankle,black,0,0,0,.049);shell(ankle,geo.foot,0,-.025,.065,.076,.055,.153);mark(prefix+'Toe',ankle,0,-.025,.19);
  target(leg,0,-.15,.089,.04);target(knee,0,-.1,.067,.033);
  const arm=part(prefix+'Arm',side*.325,1.46,0);mark(prefix+'Shoulder',arm);joint(arm,black,0,0,0,.075);shell(arm,geo.upperArm,0,0,0,1,1,.92);
  const elbow=pivot(arm,0,-.29,0);joints[prefix+'Elbow']=elbow;mark(prefix+'Elbow',elbow);joint(elbow,black,0,0,0,.058);shell(elbow,geo.forearm,0,0,0,1,1,.87);
  const hand=pivot(elbow,0,-.27,0);joints[prefix+'Hand']=hand;mark(prefix+'Wrist',hand);joint(hand,black,0,0,0,.041);shell(hand,geo.foot,0,-.035,.015,.049,.075,.04);
  const bolt=mesh(arm,geo.screw,metal,side*.073,0,0,.033,.012,.033);bolt.rotation.z=Math.PI/2;target(arm,side*.075,-.12,0,.028,side*Math.PI/2);
 }
 const weaponMount=pivot(group);weaponMount.name='weapon-mount';parts.rightArm.userData.weaponMount=weaponMount;
 // The gun remains a member of the right-arm damage region, including shattering.
 parts.rightArm.add(weaponMount);
 const rig={group,parts,joints,markers,legs:[parts.leftLeg,parts.rightLeg],weaponMount,weapon,anim:{phase:0,speed:0,crouch:0,shot:0,land:0,air:0,time:0,feet:{},lastPos:new THREE.Vector3(),initialized:false},ragdoll:null};
 for(const [name,p]of Object.entries(parts))p.traverse(o=>o.userData.part=name);
 resetDummyRig(rig);return rig;
}
function setLimb(root,hinge,start,end,pole,l1,l2){
 root.position.copy(start);v.copy(end).sub(start);const distance=clamp(v.length(),.04,l1+l2-.003);v.normalize();v2.copy(pole).addScaledVector(v,-pole.dot(v)).normalize();
 const along=(l1*l1+distance*distance-l2*l2)/(2*distance),bend=Math.sqrt(Math.max(.00001,l1*l1-along*along));v3.copy(start).addScaledVector(v,along).addScaledVector(v2,bend);
 root.quaternion.setFromUnitVectors(DOWN,v.copy(v3).sub(start).normalize());hinge.position.set(0,-l1,0);
 q.copy(root.quaternion).invert();v.copy(end).sub(v3).normalize().applyQuaternion(q);hinge.quaternion.setFromUnitVectors(DOWN,v);
}
export function resetDummyRig(b){
 b.ragdoll=null;b.group.rotation.set(0,0,0);if(b.pos)b.group.position.copy(b.pos);for(const p of Object.values(b.parts)){p.visible=true;p.rotation.set(0,0,0)}
 b.weaponMount.visible=true;for(const p of Object.values(b.joints))p.rotation.set(0,0,0);
 Object.assign(b.anim,{phase:0,speed:0,crouch:0,shot:0,land:0,air:0,time:0,feet:{},initialized:false});
 poseDummy(b,{dt:1,dx:0,dz:0,speed:0,grounded:true,crouch:0,pitch:0,reload:0,weapon:b.brain?.weaponType||b.weapon||'rifle'});
}
export function fireDummy(b,type){b.anim.shot=type==='rocket'||type==='shotgun'?1:type==='pistol'?.8:type==='rail'?.9:.45}
export function animateDummy(b,brain,dt,groundAt){
 const a=b.anim,dx=b.pos.x-brain.previous.x,dz=b.pos.z-brain.previous.z,speed=Math.hypot(dx,dz)/Math.max(dt,.001),grounded=Math.abs(b.vy)<.05;
 a.time+=dt;a.speed=damp(a.speed,speed,12,dt);if(grounded&&a.air>.3)a.land=.12;a.air=damp(a.air,grounded?0:1,14,dt);a.land=damp(a.land,0,12,dt);a.shot=damp(a.shot,0,17,dt);
 // Deliberate braced crouches on aimed shots and sheltered reloads; never random bobbing.
 const brace=b.crouched??(speed<2.7&&grounded&&(brain.charge>.15||brain.reload>0&&brain.underFire>0));a.crouch=damp(a.crouch,brace?1:0,8,dt);
 const run=clamp((a.speed-3.2)/3,0,1);a.phase+=Math.hypot(dx,dz)/(2.2+run*1.2)*Math.PI*2;a.footfall=false;
 a.velocity??=new THREE.Vector3();a.velocity.set(dx/dt,0,dz/dt);
 const target=brain.aim||brain.memory?.get(brain.target)?.eye,pitch=target?clamp(Math.atan2(target.y-(b.pos.y+1.3),Math.hypot(target.x-b.pos.x,target.z-b.pos.z)),-.75,.75):0;
 b.group.position.copy(b.pos);b.group.rotation.set(0,brain.facing,0);
 poseDummy(b,{dt,dx,dz,speed:a.speed,grounded,crouch:a.crouch,pitch,reload:brain.reload>0?1-brain.reload/brain.weapon.reload:0,weapon:brain.weaponType,groundAt});
 b.group.updateMatrixWorld(true);a.jointPosition??={};a.jointVelocity??={};
 for(const [name,marker]of Object.entries(b.markers)){
  const now=marker.getWorldPosition(v3),last=a.jointPosition[name];
  if(last&&a.initialized){v.copy(now).sub(last).multiplyScalar(1/dt).sub(a.velocity);v.y-=(b.pos.y-a.lastPos.y)/dt;v.clampLength(0,6);(a.jointVelocity[name]??=new THREE.Vector3()).copy(a.velocity).add(v);a.jointVelocity[name].y+=b.vy||0}
  if(last)last.copy(now);else a.jointPosition[name]=now.clone();
 }
 b.hitReact&&(b.hitReact.left-=dt);if(b.hitReact?.left<=0)b.hitReact=null;
 a.lastPos.copy(b.pos);a.initialized=true;
}
export function poseDummy(b,{dt=1/60,dx=0,dz=0,speed=0,grounded=true,crouch=0,pitch=0,reload=0,weapon='rifle',groundAt,relaxed=false}={}){
 const a=b.anim,run=clamp((speed-3.2)/3,0,1),moving=clamp(speed/2,0,1),yaw=b.group.rotation.y,c=Math.cos(yaw),s=Math.sin(yaw);
 const lx=c*dx-s*dz,lz=s*dx+c*dz,d=Math.hypot(lx,lz)||1,dirX=lx/d,dirZ=lz/d,phase=a.phase;
 const bob=(Math.cos(phase*2)*.018*moving+a.land)*(1-crouch*.6),hipY=.9-crouch*.43-bob-moving*(.035+run*.035),lean=clamp(speed*.012,0,.10)*(1-crouch*.7);
 const hip=b.parts.pelvis;hip.position.set(0,hipY,-crouch*.07);hip.rotation.set(lean+crouch*.13,Math.sin(phase)*.035*moving,Math.sin(phase)*.025*moving);
 const chest=b.parts.torso;chest.position.set(0,hipY+.4-crouch*.06+Math.sin(a.time*2.2)*.004*(1-moving),.015+crouch*.04);chest.rotation.set(lean+crouch*.19-pitch*.16,-Math.sin(phase)*.045*moving,Math.sin(phase)*.016*moving);
 const flinch=b.hitReact?Math.sin(clamp(b.hitReact.left/.17,0,1)*Math.PI)*b.hitReact.strength:0;
 chest.rotation.x-=flinch*.55;chest.rotation.z+=(b.hitReact?.direction?.x||0)*flinch*.6;
 b.parts.head.position.set(0,hipY+.835-crouch*.09,.012+crouch*.075);b.parts.head.rotation.set(-pitch*.55-flinch*(b.hitReact?.part==='head'?1:.35),Math.sin(a.time*.6)*.025*(1-moving),0);
 const legTargets=[];
 for(const side of [-1,1]){
  const pre=side<0?'left':'right',p=phase+(side<0?0:Math.PI),cycle=((p/(Math.PI*2))%1+1)%1,stance=.28-run*.06,stride=(2.2+run*1.2)*stance*.5*moving*(1-crouch*.45),inStance=cycle<stance;
  const travel=inStance?1-cycle/stance*2:-Math.cos((cycle-stance)/(1-stance)*Math.PI),lift=inStance?0:Math.sin((cycle-stance)/(1-stance)*Math.PI);
  let footX=side*.165+dirX*travel*stride,footZ=dirZ*travel*stride+.035,footY=.09+lift*(.105+run*.09)*moving;
  if(!grounded){footY=.24+(side<0?.06:0);footZ=(side<0?.12:-.12);footX=side*.19}
  else if(groundAt&&b.pos){const wx=b.pos.x+c*footX+s*footZ,wz=b.pos.z-s*footX+c*footZ;const floor=groundAt(wx,wz,b.pos.y+.34);footY+=clamp(floor-b.pos.y,-.22,.3)}
  if(b.pos&&grounded&&moving>.15){
   let plant=a.feet[pre];const wx=b.pos.x+c*footX+s*footZ,wz=b.pos.z-s*footX+c*footZ;
   if(inStance){if(!plant||!plant.stance){a.footfall=true;plant={x:wx,z:wz,y:b.pos.y+footY,stance:true};a.feet[pre]=plant}const px=plant.x-b.pos.x,pz=plant.z-b.pos.z;footX=c*px-s*pz;footZ=s*px+c*pz;footY=plant.y-b.pos.y}
   else a.feet[pre]={x:wx,z:wz,y:b.pos.y+footY,stance:false};
  }else if(a.feet[pre])a.feet[pre].stance=false;
  const start=new THREE.Vector3(side*.165,hipY-.02,-crouch*.07),end=new THREE.Vector3(footX,footY,footZ),pole=new THREE.Vector3(side*(.10+(b.hitReact?.part===pre+'Leg'?flinch*1.6:0)),0,1);
  legTargets.push({pre,start,end,pole,toe:(inStance?0:lift*.2)*moving*(1-crouch)});
  setLimb(b.parts[pre+'Leg'],b.joints[pre+'Knee'],start,end,pole,.4,.39);
  const ankle=b.joints[pre+'Foot'];ankle.position.set(0,-.39,0);q.copy(b.parts[pre+'Leg'].quaternion).multiply(b.joints[pre+'Knee'].quaternion).invert();ankle.quaternion.copy(q);ankle.rotation.x+=(inStance?0:lift*.2)*moving*(1-crouch);
 }
 // Pelvis compensation keeps a planted foot fixed rather than stretching the leg.
 let drop=0;if(grounded)for(const leg of legTargets){const reach=Math.sqrt(Math.max(.1,.783**2-(leg.end.x-leg.start.x)**2-(leg.end.z-leg.start.z)**2));drop=Math.max(drop,leg.start.y-leg.end.y-reach)}
 drop=clamp(drop,0,.12);if(drop>0){for(const name of ['pelvis','torso','head'])b.parts[name].position.y-=drop;for(const leg of legTargets){leg.start.y-=drop;setLimb(b.parts[leg.pre+'Leg'],b.joints[leg.pre+'Knee'],leg.start,leg.end,leg.pole,.4,.39);q.copy(b.parts[leg.pre+'Leg'].quaternion).multiply(b.joints[leg.pre+'Knee'].quaternion).invert();b.joints[leg.pre+'Foot'].quaternion.copy(q);b.joints[leg.pre+'Foot'].rotation.x+=leg.toe}}
 const recoil=a.shot,reloadPose=reload>0?Math.sin(clamp(reload,0,1)*Math.PI):0,shoulderY=chest.position.y+.16;
 const gunPitch=relaxed?.65:-pitch-recoil*.10+reloadPose*.65,gunCenter=relaxed?new THREE.Vector3(.25,shoulderY-.50,.10):new THREE.Vector3(.17,shoulderY-.20-reloadPose*.1,.30-recoil*.045);
 // Arms solve to grip positions. Both hands remain attached as the gun aims/recoils.
 const supportOffset=new THREE.Vector3(-.27,-.015,weapon==='rocket'?.16:weapon==='pistol'?.03:.13).applyAxisAngle(new THREE.Vector3(1,0,0),gunPitch);
 const leftTarget=relaxed?new THREE.Vector3(-.33,shoulderY-.53,.015):weapon==='pistol'?new THREE.Vector3(-.25,shoulderY-.37,.20):gunCenter.clone().add(supportOffset);
 if(reloadPose>.01){leftTarget.set(-.10-reloadPose*.1,gunCenter.y-.17*reloadPose,gunCenter.z+.04);leftTarget.x-=Math.sin(reload*Math.PI*2)*.05}
 for(const side of [-1,1]){const pre=side<0?'left':'right',start=new THREE.Vector3(side*.325,shoulderY,0),end=side<0?leftTarget:gunCenter,pole=new THREE.Vector3(side, -.45,-.2);end.y-=flinch*(b.hitReact?.part===pre+'Arm'?1:.15);setLimb(b.parts[pre+'Arm'],b.joints[pre+'Elbow'],start,end,pole,.29,.27);b.joints[pre+'Hand'].position.set(0,-.27,0)}
 // Mount is under the right-arm region but takes the solved grip's local transform.
 b.group.updateMatrixWorld(true);const world=gunCenter.clone().applyMatrix4(b.group.matrixWorld);b.weaponMount.position.copy(b.parts.rightArm.worldToLocal(world));
 q.setFromEuler(new THREE.Euler(gunPitch,0,-reloadPose*.45));q.premultiply(b.group.getWorldQuaternion(new THREE.Quaternion()));const parentQ=b.parts.rightArm.getWorldQuaternion(new THREE.Quaternion()).invert();b.weaponMount.quaternion.copy(parentQ.multiply(q));
}

const nodeNames=['pelvis','chest','neck','head',...['left','right'].flatMap(s=>[s+'Shoulder',s+'Elbow',s+'Wrist',s+'Hip',s+'Knee',s+'Ankle',s+'Toe'])];
export function beginRagdoll(b,impulse=new THREE.Vector3(),hitPart='torso'){
 b.group.updateMatrixWorld(true);const nodes={};
 for(const name of nodeNames){const p=b.markers[name].getWorldPosition(new THREE.Vector3()),core=['pelvis','chest','neck'].includes(name),radius=name==='head'?.135:name==='chest'?.175:name==='pelvis'?.16:name.endsWith('Shoulder')?.075:name.endsWith('Hip')?.08:name.endsWith('Knee')?.067:name.endsWith('Toe')?.055:.05;
  // Release the current pose without a launch, random kick or upward pop.
  // All bodies inherit the actor's movement; damage adds only a small local nudge.
  const velocity=new THREE.Vector3(0,b.vy||0,0),a=b.anim;
  if(a.initialized&&a.velocity)velocity.add(a.velocity);
  const localHit=name===hitPart||hitPart.endsWith('Arm')&&name.startsWith(hitPart.slice(0,-3))&&/Shoulder|Elbow|Wrist/.test(name)||hitPart.endsWith('Leg')&&name.startsWith(hitPart.slice(0,-3))&&/Hip|Knee|Ankle|Toe/.test(name);
  if(a.initialized&&a.jointVelocity?.[name])velocity.copy(a.jointVelocity[name]);
  velocity.x+=impulse.x*(localHit?.25:.08);velocity.z+=impulse.z*(localHit?.25:.08);
  velocity.clampLength(0,24);nodes[name]={p,velocity:velocity.clone(),prev:p.clone().addScaledVector(velocity,-1/120),radius,weight:core?.6:name==='head'?1:1.8,contact:new THREE.Vector3()};
 }
 const links=[],link=(a,c,min=null,max=null,stiff=1)=>{const length=nodes[a].p.distanceTo(nodes[c].p);links.push({a:nodes[a],b:nodes[c],min:min??length,max:max??length,stiff})};
 link('pelvis','chest');link('chest','neck');link('neck','head');link('pelvis','neck');link('chest','head',.34,.49,.5);
 for(const side of ['left','right']){link('chest',side+'Shoulder');link('neck',side+'Shoulder');link('pelvis',side+'Shoulder');link('pelvis',side+'Hip');link('chest',side+'Hip');link(side+'Shoulder',side+'Elbow',.29,.29);link(side+'Elbow',side+'Wrist',.27,.27);link(side+'Shoulder',side+'Wrist',.18,.55,.7);link(side+'Hip',side+'Knee',.4,.4);link(side+'Knee',side+'Ankle',.39,.39);link(side+'Hip',side+'Ankle',.22,.78,.8);link(side+'Ankle',side+'Toe');link(side+'Knee',side+'Toe',.32,.46,.5)}
 link('leftShoulder','rightShoulder');link('leftHip','rightHip');link('leftShoulder','rightHip');link('rightShoulder','leftHip');
 const list=Object.values(nodes),neighbors=new Set(links.filter(l=>l.min===l.max).map(l=>list.indexOf(l.a)+':'+list.indexOf(l.b)));
 const self=[];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)if(!neighbors.has(i+':'+j)&&!neighbors.has(j+':'+i)&&list[i].p.distanceTo(list[j].p)>list[i].radius+list[j].radius+.025)self.push([list[i],list[j]]);
 b.ragdoll={nodes,list,links,self,age:0,quiet:0,sleeping:false};b.group.position.set(0,0,0);b.group.rotation.set(0,0,0);b.weaponMount.visible=false;renderRagdoll(b);return b.ragdoll;
}
function sphereWorld(n,blocks){
 const p=n.p,r=n.radius;if(p.y<r){p.y=r;n.contact.y=1}
 for(const b of blocks){if(p.y+r<b.bottom||p.y-r>b.top||Math.abs(p.x-b.x)>Math.hypot(b.w,b.d)/2+r||Math.abs(p.z-b.z)>Math.hypot(b.w,b.d)/2+r)continue;
  const a=b.yaw||0,c=Math.cos(a),s=Math.sin(a),dx=p.x-b.x,dz=p.z-b.z,x=c*dx-s*dz,z=s*dx+c*dz,hw=b.w/2,hd=b.d/2;
  let nx=x-clamp(x,-hw,hw),ny=p.y-clamp(p.y,b.bottom,b.top),nz=z-clamp(z,-hd,hd),length=Math.hypot(nx,ny,nz),depth=r-length;
  if(depth<=0)continue;
  if(length<1e-8){const faces=[hw-Math.abs(x),hd-Math.abs(z),b.top-p.y,p.y-b.bottom],which=faces.indexOf(Math.min(...faces));nx=ny=nz=0;if(which===0)nx=x<0?-1:1;if(which===1)nz=z<0?-1:1;if(which===2)ny=1;if(which===3)ny=-1;depth=r+faces[which];length=1}
  nx/=length;ny/=length;nz/=length;const wx=c*nx+s*nz,wz=-s*nx+c*nz;p.x+=wx*(depth+.0001);p.y+=ny*(depth+.0001);p.z+=wz*(depth+.0001);n.contact.set(wx,ny,wz);
 }
}
function solveLink(l){const dx=l.b.p.x-l.a.p.x,dy=l.b.p.y-l.a.p.y,dz=l.b.p.z-l.a.p.z,length=Math.hypot(dx,dy,dz);if(length<1e-8)return;const target=clamp(length,l.min,l.max),error=(length-target)/length*l.stiff,weight=l.a.weight+l.b.weight,wa=error*l.a.weight/weight,wb=error*l.b.weight/weight;l.a.p.x+=dx*wa;l.a.p.y+=dy*wa;l.a.p.z+=dz*wa;l.b.p.x-=dx*wb;l.b.p.y-=dy*wb;l.b.p.z-=dz*wb}
export function stepRagdoll(b,dt,blocks){
 const rag=b.ragdoll;if(!rag||rag.sleeping)return;
 for(let left=Math.min(dt,.1);left>1e-7;){const h=Math.min(left,1/120);left-=h;rag.age+=h;
  for(const n of rag.list){n.prev.copy(n.p);n.velocity.y-=23*h;n.velocity.multiplyScalar(Math.exp(-h*.06)).clampLength(0,24);n.p.addScaledVector(n.velocity,h);n.contact.set(0,0,0)}
  for(let iteration=0;iteration<9;iteration++){
   for(const l of rag.links)solveLink(l);
   for(const [a,c]of rag.self){const length=a.p.distanceTo(c.p),radius=a.radius+c.radius;if(length<radius&&length>1e-5){v.copy(c.p).sub(a.p).multiplyScalar((radius-length)/length*.35);a.p.addScaledVector(v,-a.weight/(a.weight+c.weight));c.p.addScaledVector(v,c.weight/(a.weight+c.weight))}}
   // Joint spheres and segment interior samples stop limbs slipping through ledges.
   for(const n of rag.list)sphereWorld(n,blocks);
   if(iteration%3===2)for(const l of rag.links){if(l.min!==l.max||l.max<.25||l.max>.45)continue;const mid=collisionProbe;mid.p.copy(l.a.p).lerp(l.b.p,.5);mid.radius=Math.min(l.a.radius,l.b.radius)*.85;probeBefore.copy(mid.p);sphereWorld(mid,blocks);v.copy(mid.p).sub(probeBefore);l.a.p.addScaledVector(v,.5);l.b.p.addScaledVector(v,.5)}
  }
  let motion=0;for(const n of rag.list){v.copy(n.p).sub(n.prev).multiplyScalar(1/h);if(n.contact.lengthSq()){const into=v.dot(n.contact);if(into<0)v.addScaledVector(n.contact,-into);v.multiplyScalar(Math.exp(-h*13));}n.velocity.copy(v).clampLength(0,24);n.prev.copy(n.p).addScaledVector(n.velocity,-h);motion+=v.lengthSq()}
  if(rag.age>1.1&&motion<.06)rag.quiet+=h;else rag.quiet=0;if(rag.quiet>.3)rag.sleeping=true;
 }
 renderRagdoll(b);
}
function frame(up,right,out){v.copy(right).addScaledVector(up,-right.dot(up)).normalize();v2.crossVectors(v,up).normalize();v.crossVectors(up,v2).normalize();basis.makeBasis(v,up,v2);out.setFromRotationMatrix(basis)}
function renderRagdoll(b){
 const n=b.ragdoll.nodes,p=b.parts;v3.copy(n.neck.p).sub(n.pelvis.p).normalize();const right=n.rightShoulder.p.clone().sub(n.leftShoulder.p).normalize();
 p.torso.position.copy(n.chest.p);frame(v3,right,p.torso.quaternion);p.pelvis.position.copy(n.pelvis.p);frame(v3,n.rightHip.p.clone().sub(n.leftHip.p).normalize(),p.pelvis.quaternion);
 p.head.position.copy(n.head.p);v3.copy(n.head.p).sub(n.neck.p).normalize();frame(v3,right,p.head.quaternion);
 for(const side of ['left','right'])for(const limb of ['Arm','Leg']){const arm=limb==='Arm',start=n[side+(arm?'Shoulder':'Hip')].p,hinge=n[side+(arm?'Elbow':'Knee')].p,end=n[side+(arm?'Wrist':'Ankle')].p,root=p[side+limb],bend=b.joints[side+(arm?'Elbow':'Knee')];root.position.copy(start);root.quaternion.setFromUnitVectors(DOWN,v.copy(hinge).sub(start).normalize());bend.position.set(0,arm?-.29:-.4,0);q.copy(root.quaternion).invert();bend.quaternion.setFromUnitVectors(DOWN,v.copy(end).sub(hinge).normalize().applyQuaternion(q));
  if(!arm){const foot=b.joints[side+'Foot'];v.copy(n[side+'Toe'].p).sub(end).normalize();v2.crossVectors(UP,v).normalize();v3.crossVectors(v,v2).normalize();basis.makeBasis(v2,v3,v);q.setFromRotationMatrix(basis);foot.quaternion.copy(root.quaternion).multiply(bend.quaternion).invert().multiply(q)}
 }
 b.group.updateMatrixWorld(true);
}
