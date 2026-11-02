import * as THREE from './vendor/three.module.js';
import {MATERIALS as M} from './presentation.js';
import {piece,block,tube,palm} from './rifle.js';
// Shared tooling and materials; component groups own all moving mechanisms.
const safety=new THREE.MeshStandardMaterial({color:0xe9b82d,roughness:.38,metalness:.22});
const lume=new THREE.MeshBasicMaterial({color:0xd8f7ae,side:THREE.DoubleSide});
const lens=new THREE.MeshBasicMaterial({color:0x91bfc3,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide});
const ring=new THREE.TorusGeometry(1,.13,6,24),openTube=new THREE.CylinderGeometry(1,1,1,20,1,true),disk=new THREE.CircleGeometry(1,24),armGeo=new THREE.CylinderGeometry(1,1,1,12);
const windows=new Map();
function windowGeometry(w){if(!windows.has(w))windows.set(w,new THREE.PlaneGeometry(w,.14));return windows.get(w)}
const v=new THREE.Vector3(),end=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)};
function circle(parent,x,y,z,r,material=M.steel){const m=new THREE.Mesh(ring,material);m.position.set(x,y,z);m.scale.setScalar(r);parent.add(m);return m}
function bore(parent,y,z,r,length){const m=new THREE.Mesh(openTube,M.steel);m.position.set(0,y,z+length/2);m.rotation.x=Math.PI/2;m.scale.set(r,length,r);parent.add(m);circle(parent,0,y,z,r);const dark=new THREE.Mesh(disk,M.bore);dark.position.set(0,y,z+length-.002);dark.rotation.y=Math.PI;dark.scale.setScalar(r*.94);parent.add(dark)}
function screw(parent,x,y,z){const m=tube(parent,x,y,z,.012,.009,M.steel);m.rotation.set(0,0,Math.PI/2);block(parent,x*1.01,y,z,.003,.004,.016,M.bore,.001)}
function sights(slide,front){const g=new THREE.Group();g.name='nailer-irons';slide.add(g);
 for(const side of [-1,1]){block(g,side*.048,.222,.084,.024,.044,.052,M.graphite,.004);const dot=new THREE.Mesh(disk,lume);dot.position.set(side*.048,.235,.121);dot.scale.setScalar(.006);g.add(dot)}
 block(g,0,.195,.084,.116,.018,.052,M.steel,.003);block(g,0,.221,front,.016,.064,.034,M.graphite,.003);const fiber=tube(g,0,.244,front,.005,.026,safety);fiber.name='front-sight-fiber';const dot=new THREE.Mesh(disk,lume);dot.name='front-sight-dot';dot.position.set(0,.244,front+.025);dot.scale.setScalar(.005);g.add(dot);return g;
}
function makeOptic(body,a){
 const g=new THREE.Group();g.name='nailer-'+a.id;body.add(g);const y=.355,z=-.045;
 // A frame-fixed bridge clears the reciprocating slide. It does not recoil open.
 for(const side of [-1,1]){block(g,side*.175,.145,z,.022,.19,.12,M.graphite,.004);screw(g,side*.19,.09,z)}block(g,0,.244,z,.37,.026,.15,M.steel,.004);block(g,0,.272,z,.12,.034,.12,M.graphite,.004);
 let half=.10;
 if(a.shape==='open'||a.shape==='box'){
  half=a.shape==='open'?.092:a.zoom===2?.104:.116;
  for(const side of [-1,1])piece(g,[[z-.047,y-.072],[z+.047,y-.072],[z+.047,y+.065],[z-.025,y+.092],[z-.047,y+.06]],.022,M.graphite,side*half);
  block(g,0,y+.083,z,half*2,.026,a.zoom===2?.15:.095,a.zoom===2?M.steel:a.shape==='box'?safety:M.steel,.005);block(g,0,y-.083,z,half*2,.022,.095,M.graphite,.004);
  const glass=new THREE.Mesh(windowGeometry(half*1.9),lens);glass.position.set(0,y,z);g.add(glass);
  if(a.shape==='box')for(const side of [-1,1])block(g,side*(half+.02),y-.012,z,.016,.09,.04,safety,.003);
 }else{
  const long=a.shape==='tube',enclosed=long||a.zoom===2,depth=long?.22:a.zoom===2?.12:.065;
  for(const offset of enclosed?[-depth/2,depth/2]:[0])circle(g,0,y,z+offset,.097,M.graphite);
  if(enclosed){const tube=new THREE.Mesh(openTube,M.graphite);tube.rotation.x=Math.PI/2;tube.position.set(0,y,z);tube.scale.set(.097,depth,.097);g.add(tube)}
  const glass=new THREE.Mesh(disk,lens);glass.position.set(0,y,z-depth/2+.01);glass.scale.setScalar(.087);g.add(glass);
  block(g,.106,y-.025,z,.037,.05,.055,M.steel,.006);block(g,0,y+.106,z,.045,.025,.045,M.graphite,.003);
 }
 block(g,-half-.012,y-.04,z,.016,.022,.034,safety,.002);return y;
}
export function createNailer(parent,{attachments=[]}={}){
 const kit=Object.fromEntries(attachments.map(a=>[a.slot,a])),barrelKit=kit.barrel?.visual,muzzleKit=kit.muzzle?.visual;
 const front=barrelKit==='long'?-.75:barrelKit==='short'?-.49:barrelKit==='heavy'?-.67:-.625;
 const body=new THREE.Group();body.name='nailer-frame';parent.add(body);
 piece(body,[[.16,-.075],[.15,.058],[-.45,.058],[-.51,-.025],[-.43,-.105],[-.03,-.12]],.205,M.graphite);
 // Reinforced dust cover, sculpted grip and a genuinely open trigger guard.
 piece(body,[[-.16,-.08],[-.43,-.08],[-.48,-.03],[-.49,-.12],[-.18,-.15]],.18,M.steel);
 piece(body,[[.065,-.085],[.16,-.11],[.255,-.407],[.13,-.45],[.015,-.19]],.13,M.rubber);
 for(const side of [-1,1]){
  piece(body,[[.078,-.17],[.13,-.17],[.207,-.38],[.145,-.397]],.015,safety,side*.071);
  for(let i=0;i<4;i++)block(body,side*.082,-.21-i*.041,.103+i*.014,.006,.011,.062,M.graphite,.002);
  screw(body,side*.114,-.021,-.35);screw(body,side*.114,-.025,.025);
 }
 piece(body,[[-.15,-.10],[-.174,-.19],[-.13,-.263],[-.004,-.263],[.022,-.22],[.001,-.205],[-.018,-.238],[-.117,-.236],[-.147,-.18],[-.13,-.10]],.073,M.graphite);
 const trigger=new THREE.Group();trigger.name='nailer-trigger';trigger.position.set(0,-.135,-.045);body.add(trigger);const triggerId=kit.trigger?.id||'';piece(trigger,triggerId.endsWith('flat')?[[0,0],[-.014,0],[-.014,-.067],[.004,-.067]]:triggerId.endsWith('hair')?[[0,0],[-.014,-.006],[-.012,-.052],[.007,-.047]]:[[0,0],[-.014,-.005],[-.022,-.04],[-.01,-.064],[.011,-.067],[.015,-.052],[.001,-.051],[-.005,-.035]],.022,triggerId.endsWith('flat')?safety:M.steel);
 const slide=new THREE.Group();slide.name='nailer-slide';body.add(slide);
 piece(slide,[[.119,.032],[.119,.132],[.079,.179],[-.392,.179],[-.469,.12],[-.469,.034]],.246,M.graphite);
 block(slide,0,.093,.126,.125,.063,.012,M.steel,.004);block(slide,0,.093,.135,.027,.044,.004,M.graphite,.002);
 // Safety housing is inset around the steel spine, not painted over the whole gun.
 for(const side of [-1,1]){
  piece(slide,[[.074,.053],[.073,.121],[.037,.15],[-.302,.15],[-.375,.103],[-.351,.053]],.021,safety,side*.124);
  for(let i=0;i<5;i++)block(slide,side*.14,.094,.057-i*.026,.009,.062,.010,M.graphite,.002);
  block(slide,side*.126,.072,-.22,.006,.028,.11,M.graphite,.002);
 }
 block(slide,0,.177,-.17,.087,.018,.38,M.steel,.003);
 const chamber=block(body,.13,.096,-.112,.013,.057,.116,M.bore,.003);block(body,.137,.1,-.129,.009,.041,.071,M.steel,.002);
 const catchLever=block(body,-.128,-.018,.018,.026,.024,.07,M.steel,.003);
 block(body,0,.044,.13,.093,.042,.06,M.steel,.005);
 const barrel=new THREE.Group();barrel.name='nailer-barrel';body.add(barrel);
 const radius=barrelKit==='heavy'?.105:.084;
 tube(barrel,0,.061,(front-.30)/2,radius,Math.abs(front+.30),M.graphite);
 bore(barrel,.061,front,radius*.75,.06);
 circle(barrel,0,.061,front+.025,radius*1.03,M.steel);
 if(barrelKit==='long'||barrelKit==='heavy')for(const side of [-1,1])block(barrel,side*(radius+.005),.035,(front-.43)/2,.018,.045,Math.abs(front+.43)*.78,safety,.003);
 const irons=sights(slide,Math.max(front+.065,-.42));
 let muzzleZ=front;
 if(muzzleKit){
  const g=new THREE.Group();g.name='nailer-muzzle-'+muzzleKit;barrel.add(g);
  if(muzzleKit==='crown'){circle(g,0,.061,front-.012,radius*.9,M.steel);muzzleZ=front-.025}
  else{
   const depth=muzzleKit==='comp'?.15:.11,width=muzzleKit==='comp'?.25:.22;
   // Four separate walls retain a real bore opening through the attachment.
   for(const side of [-1,1]){block(g,side*(width/2-.018),.061,front-depth/2,.036,.16,depth,muzzleKit==='comp'?safety:M.steel,.005);block(g,0,.061+side*.077,front-depth/2,width,.022,depth,M.graphite,.004);for(let i=0;i<2;i++)block(g,side*(width/2+.002),.067,front-.035-i*.045,.004,.055,.025,M.bore,.001)}
   muzzleZ=front-depth;
  }
 }
 const magazine=new THREE.Group();magazine.name='nailer-magazine';body.add(magazine);const style=kit.magazine?.visual||'standard',extension=style==='extended'?.07:style==='drum'?.13:style==='fast'?-.025:0;
 piece(magazine,[[.12,-.19],[.19,-.19],[.258+extension*.23,-.423-extension],[.157+extension*.23,-.45-extension]],.103,M.steel);
 const heel=block(magazine,0,-.448-extension,.205+extension*.23,.15,.038,.13,M.graphite,.005);block(magazine,-.079,-.45-extension,.205+extension*.23,.007,.019,.075,safety,.002);
 if(extension>0)for(let i=0;i<3;i++){const hole=new THREE.Mesh(disk,M.bore);hole.rotation.y=-Math.PI/2;hole.position.set(-.053,-.46-i*extension/3,.21+extension*.23);hole.scale.setScalar(.008);magazine.add(hole)}
 const sightY=kit.optic?makeOptic(body,kit.optic):.244;
 const right=palm(parent,.084,-.28,.145),left=palm(parent,-.09,-.315,.105,true);right.children[2].position.set(-.067,.095,-.17);right.rotation.set(-.15,0,-.15);left.rotation.set(.2,0,-.2);
 function arm(x,y,z,r){const m=new THREE.Mesh(armGeo,M.yellow);m.userData.healthSkin=true;parent.add(m);return{mesh:m,end:new THREE.Vector3(x,y,z),radius:r}}
 const rightArm=arm(.19,-.94,.55,.06),supportArm=arm(-.26,-.94,.32,.054);
 const hero={body,slide,barrel,magazine,irons,trigger,catchLever,chamber,heel,left,right,rightArm,supportArm,muzzleZ,sightY,magStyle:style,emptyReload:false,leftBase:left.position.clone(),baseTrigger:trigger.rotation.x};animateNailer(hero,{});return hero;
}
function followArm(hand,arm){v.set(0,-.085,.02).applyQuaternion(hand.quaternion).add(hand.position);end.copy(arm.end).sub(v);arm.mesh.position.copy(v).addScaledVector(end,.5);arm.mesh.quaternion.setFromUnitVectors(up,end.normalize());arm.mesh.scale.set(arm.radius,arm.end.distanceTo(v),arm.radius*1.07)}
export function animateNailer(h,{reload=0,reloading=false,shotAge=10,ammo=7}={}){
 const shot=Math.max(0,1-shotAge/.115),stroke=Math.sin(Math.min(1,shotAge/.025)*Math.PI/2)*shot;
 const release=smooth((reload-.78)/.07),locked=ammo===0&&(!reloading||h.emptyReload&&release<1);
 h.slide.position.z=locked?.102:stroke*.105;h.barrel.position.z=stroke*.013;h.barrel.rotation.x=-stroke*.045;h.trigger.rotation.x=h.baseTrigger-shot*.25;h.catchLever.rotation.z=0;
 h.magazine.position.set(0,0,0);h.magazine.rotation.set(0,0,0);h.magazine.visible=true;h.left.position.copy(h.leftBase);h.left.rotation.set(.2,0,-.2);
 if(reloading){
  const out=smooth((reload-.13)/.17),insert=smooth((reload-.49)/.24),withdraw=out*(1-insert),grab=smooth(reload/.12)*(1-smooth((reload-.76)/.15));
  h.magazine.position.set(-withdraw*.045,-withdraw*.48,withdraw*.10);h.magazine.rotation.z=withdraw*.12;h.magazine.visible=reload<.36||reload>.47;
  h.left.position.lerp(v.set(-.065-withdraw*.045,-.37-withdraw*.42,.18+withdraw*.10),grab);h.left.rotation.z=-.2-grab*.3;
  if(h.emptyReload){h.slide.position.z=.102*(1-release);const thumb=smooth((reload-.72)/.06)*(1-smooth((reload-.87)/.08));h.left.position.lerp(v.set(-.15,-.04,.045),thumb);h.catchLever.rotation.z=-thumb*.35}
 }
 followArm(h.right,h.rightArm);followArm(h.left,h.supportArm);
}
// A lightweight third-person version keeps the same yellow slide, heavy bore,
// swept grip and open guard without spending hero-view detail on distant bots.
export function createNailerWorld(parent){const g=new THREE.Group();g.name='nailer-world';parent.add(g);piece(g,[[.12,.02],[.12,.14],[-.4,.14],[-.48,.08],[-.48,.02]],.22,M.graphite);for(const side of [-1,1])block(g,side*.115,.085,-.15,.018,.085,.42,safety);piece(g,[[.04,0],[.14,-.02],[.24,-.34],[.12,-.37]],.13,M.rubber);tube(g,0,.06,-.53,.08,.19,M.steel);circle(g,0,.06,-.63,.065,M.graphite);block(g,0,-.18,-.05,.07,.025,.16,M.graphite);block(g,0,-.115,-.12,.07,.13,.025,M.graphite);return g}
