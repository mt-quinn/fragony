import * as THREE from './vendor/three.module.js';
import {MATERIALS as M} from './presentation.js';
const cache=new Map(),cylinder=new THREE.CylinderGeometry(1,1,1,16),sphere=new THREE.SphereGeometry(1,10,6),ring=new THREE.TorusGeometry(1,.10,4,16);
function profile(points,width,bevel=.008){const key=JSON.stringify([points,width,bevel]);if(cache.has(key))return cache.get(key);const shape=new THREE.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();const depth=Math.max(.001,width-2*bevel),g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,steps:1,curveSegments:1});g.translate(0,0,-depth/2);g.rotateY(Math.PI/2);cache.set(key,g);return g}
function piece(parent,points,width,material=M.graphite,x=0){const m=new THREE.Mesh(profile(points,width),material);m.position.x=x;m.receiveShadow=true;parent.add(m);return m}
function block(parent,x,y,z,w,h,d,material=M.graphite,r=.006){const m=new THREE.Mesh(profile([[z-d/2,y-h/2],[z+d/2,y-h/2],[z+d/2,y+h/2],[z-d/2,y+h/2]],w,Math.min(r,w*.2,h*.2,d*.2)),material);m.position.x=x;parent.add(m);return m}
function tube(parent,x,y,z,r,length,material=M.steel){const m=new THREE.Mesh(cylinder,material);m.position.set(x,y,z);m.rotation.x=Math.PI/2;m.scale.set(r,length,r);parent.add(m);return m}
function palm(parent,x,y,z,left=false){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const shell=new THREE.Mesh(sphere,M.yellow);shell.scale.set(.057,.086,.049);shell.userData.healthSkin=true;g.add(shell);const wrist=new THREE.Mesh(sphere,M.rubber);wrist.position.set(0,-.085,.02);wrist.scale.set(.046,.038,.045);g.add(wrist);
 for(let i=0;i<4;i++){const finger=new THREE.Mesh(sphere,M.yellow);finger.position.set(left?.043:-.043,.045-i*.026,-.025);finger.scale.set(.027,.013,.035);finger.userData.healthSkin=true;g.add(finger)}const thumb=new THREE.Mesh(sphere,M.yellow);thumb.position.set(left?-.04:.04,.04,.015);thumb.scale.set(.025,.042,.027);thumb.rotation.z=left?-.5:.5;thumb.userData.healthSkin=true;g.add(thumb);return g}
export function createRifle(parent){
 const body=new THREE.Group();body.name='ar9-receiver';parent.add(body);
 piece(body,[[.155,-.07],[.14,.07],[-.08,.118],[-.32,.10],[-.365,.025],[-.30,-.105],[-.06,-.11]],.19);
 piece(body,[[.15,.055],[.12,.13],[-.12,.162],[-.31,.125],[-.34,.06]],.202,M.ceramic);
 // Recessed ejection port, bolt and a small, purposeful selector inset.
 block(body,-.102,.045,-.105,.008,.065,.165,M.bore,.002);
 const bolt=block(body,-.109,.044,-.14,.009,.045,.10,M.steel,.002);block(body,-.12,.048,-.08,.018,.021,.028,M.graphite,.002);
 block(body,-.103,-.044,-.012,.01,.032,.047,M.rubber,.003);tube(body,-.11,-.044,-.012,.009,.012,M.steel).rotation.z=Math.PI/2;
 // Structural handguard shell, open slots and an exposed floated barrel.
 tube(body,0,.017,-.64,.035,.66,M.graphite);
 piece(body,[[-.30,-.035],[-.33,.085],[-.68,.07],[-.735,.02],[-.68,-.065]],.155,M.ceramic);
 for(const side of [-1,1]){
  for(let i=0;i<4;i++)block(body,side*.080,.009,-.37-i*.074,.009,.038,.045,M.bore,.003);
  block(body,side*.083,-.032,-.53,.012,.018,.27,M.graphite,.002);
 }
 block(body,0,.128,-.5,.055,.025,.31,M.graphite,.003);
 tube(body,0,.018,-.832,.046,.16,M.steel);tube(body,0,.018,-.921,.061,.075,M.graphite);tube(body,0,.018,-.963,.047,.008,M.bore);
 const muzzle=new THREE.Mesh(ring,M.steel);muzzle.position.set(0,.018,-.966);muzzle.scale.setScalar(.055);body.add(muzzle);
 for(const side of [-1,1])block(body,side*.057,.018,-.925,.008,.042,.033,M.bore,.002);
 // Pistol grip and open trigger guard have real negative space.
 piece(body,[[.095,-.08],[.02,-.09],[.052,-.31],[.146,-.295]],.10,M.rubber);
 block(body,0,-.303,.10,.105,.025,.095,M.graphite,.003);
 for(let i=0;i<4;i++)block(body,.052,-.15-i*.032,.092,.006,.008,.074,M.graphite,.001);
 block(body,0,-.188,-.008,.065,.019,.11,M.graphite,.003);block(body,0,-.145,-.062,.065,.085,.019,M.graphite,.003);
 const trigger=block(body,0,-.137,-.018,.015,.056,.018,M.steel,.002);trigger.rotation.x=-.2;
 const stock=new THREE.Group();body.add(stock);
 // Skeleton stock: two struts around an open center, with a rubber shoulder pad.
 piece(stock,[[.13,.06],[.19,.085],[.45,.025],[.44,-.028],[.18,.018]],.095,M.graphite);
 piece(stock,[[.17,-.065],[.41,-.14],[.455,-.09],[.19,-.02]],.075,M.ceramic);
 piece(stock,[[.43,.035],[.49,.015],[.49,-.18],[.425,-.15]],.13,M.rubber);
 // Notch/post irons share a sight line at Y=.20.
 block(body,-.055,.19,.105,.025,.09,.045,M.graphite);block(body,.055,.19,.105,.025,.09,.045,M.graphite);block(body,0,.151,.105,.11,.018,.045,M.graphite);
 block(body,0,.19,-.68,.014,.065,.025,M.steel);block(body,0,.153,-.68,.074,.025,.055,M.graphite);
 const magazine=new THREE.Group();parent.add(magazine);
 piece(magazine,[[-.125,-.09],[-.242,-.10],[-.27,-.35],[-.235,-.445],[-.13,-.43],[-.105,-.29]],.115,M.graphite);
 for(const side of [-1,1])for(let i=0;i<3;i++)block(magazine,side*.062,-.18-i*.07,-.185,.008,.012,.106,M.rubber,.002);
 block(magazine,0,-.425,-.18,.127,.035,.122,M.rubber,.004);block(magazine,.065,-.32,-.18,.008,.022,.055,M.yellow,.002);
 const right=palm(parent,.077,-.21,.095),left=palm(parent,-.075,-.12,-.47,true);left.rotation.set(.45,0,.25);
 const connect=(from,to,r)=>{const arm=new THREE.Mesh(cylinder,M.yellow),d=to.clone().sub(from);arm.position.copy(from).addScaledVector(d,.5);arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());arm.scale.set(r,d.length(),r*1.08);arm.userData.healthSkin=true;parent.add(arm);return arm};
 const arm=connect(new THREE.Vector3(.085,-.29,.13),new THREE.Vector3(.15,-.95,.52),.058);
 const supportArm=connect(new THREE.Vector3(-.085,-.18,-.44),new THREE.Vector3(-.16,-.95,.23),.052);
 const charging=block(body,-.126,.09,.035,.035,.022,.04,M.steel,.003);
 return {body,stock,magazine,bolt,trigger,left,right,arm,supportArm,charging,emptyReload:false,magStyle:'standard',leftBase:left.position.clone(),magBase:magazine.position.clone(),boltBase:bolt.position.clone(),chargingBase:charging.position.clone(),recoil:0};
}
export function rifleAttachment(hero,a){
 if(a.slot==='magazine'){hero.magStyle=a.visual;if(a.visual==='drum'){hero.magazine.children.forEach(m=>m.visible=false);const drum=tube(hero.magazine,0,-.24,-.17,.14,.20,M.graphite);drum.rotation.set(0,0,Math.PI/2);block(hero.magazine,0,-.11,-.17,.11,.13,.12,M.steel);hero.magazine.scale.y=1}else{hero.magazine.scale.y=a.visual==='fast'?.82:1.26;hero.magBase.y=(hero.magazine.scale.y-1)*.09}return true}
 if(a.slot==='optic'){
  block(hero.body,0,.19,-.16,.075,.075,.16,M.steel);
  if(a.shape==='open'||a.shape==='box'){const w=a.shape==='open'?.19:.23;for(const side of [-1,1])block(hero.body,side*w/2,.30,-.17,.023,.17,.07,M.graphite);block(hero.body,0,.385,-.17,w,.023,.07,M.ceramic);block(hero.body,0,.215,-.17,w,.022,.07,M.graphite)}
  else{for(const z of a.shape==='tube'?[-.26,-.07]:[-.17]){const rim=new THREE.Mesh(ring,M.graphite);rim.position.set(0,.30,z);rim.scale.setScalar(.10);hero.body.add(rim)}if(a.shape==='tube')for(const side of [-1,1])block(hero.body,side*.098,.30,-.165,.014,.025,.19,M.steel)}return true;
 }
 if(a.slot==='stock'){if(a.visual==='light')hero.stock.children[1].visible=false;else if(a.visual==='brace')piece(hero.stock,[[.16,-.06],[.43,-.17],[.44,-.20],[.16,-.10]],.10,M.graphite);else{piece(hero.body,[[-.50,-.06],[-.44,-.06],[-.37,-.22],[-.43,-.23]],.065,M.rubber);hero.leftBase.set(-.045,-.18,-.44)}return true}
 return false;
}
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)};
function followSupport(hero){const from=new THREE.Vector3(0,-.085,.02).applyQuaternion(hero.left.quaternion).add(hero.left.position),to=new THREE.Vector3(-.16,-.95,.23),d=to.sub(from);hero.supportArm.position.copy(from).addScaledVector(d,.5);hero.supportArm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());hero.supportArm.scale.set(.052,d.length(),.056)}
export function animateRifle(hero,{reload=0,reloading=false,shotAge=10,ammo=30}){
 const recoil=Math.max(0,1-shotAge/.075),bolt=hero.bolt;bolt.position.copy(hero.boltBase);bolt.position.z+=(ammo===0&&!reloading?.07:Math.sin(recoil*Math.PI*.5)*.065);hero.trigger.rotation.x=-.2-recoil*.18;
 hero.magazine.position.copy(hero.magBase);hero.magazine.rotation.set(0,0,0);hero.magazine.visible=true;hero.left.position.copy(hero.leftBase);hero.left.rotation.set(.45,0,.25);hero.charging.position.copy(hero.chargingBase);
 if(!reloading){followSupport(hero);return;}
 const out=smooth((reload-.14)/.19),insert=smooth((reload-.51)/.25),withdraw=out*(1-insert);
 hero.magazine.position.y-=withdraw*.48;hero.magazine.position.z+=withdraw*.09;hero.magazine.rotation.x=withdraw*.18;hero.magazine.visible=reload<.40||reload>.49;
 const grab=smooth(reload/.13)*(1-smooth((reload-.76)/.15));hero.left.position.lerp(new THREE.Vector3(-.055,-.15-withdraw*.25,-.18+withdraw*.09),grab);hero.left.rotation.x=.45-grab*.75;
 const rack=smooth((reload-.79)/.065)*(1-smooth((reload-.91)/.035));hero.left.position.lerp(new THREE.Vector3(-.16,.095,.055+rack*.08),smooth((reload-.77)/.04)*(1-smooth((reload-.93)/.06)));hero.charging.position.z+=rack*.09;bolt.position.z+=rack*.07;followSupport(hero);
}
