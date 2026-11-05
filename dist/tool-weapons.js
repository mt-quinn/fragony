import * as THREE from './vendor/three.module.js';
import {MATERIALS as M} from './presentation.js';
import {piece,block,tube,palm,createRifle,rifleAttachment,animateRifle} from './rifle.js';
const Y=M.safety,ringGeo=new THREE.TorusGeometry(1,.12,5,20),tubeGeo=new THREE.CylinderGeometry(1,1,1,20,1,true),diskGeo=new THREE.CircleGeometry(1,20),armGeo=new THREE.CylinderGeometry(1,1,1,12);
const sightMat=new THREE.MeshBasicMaterial({color:0xd8f7ae,side:THREE.DoubleSide}),glassMat=new THREE.MeshBasicMaterial({color:0x93b9be,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide}),powerMat=new THREE.MeshStandardMaterial({color:0x8dd7d1,emissive:0x6bd0c4,emissiveIntensity:1.1,roughness:.25,metalness:.4});
const windows=new Map(),v=new THREE.Vector3(),d=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)};
function group(parent,name){const g=new THREE.Group();g.name=name;parent.add(g);return g}
function ring(parent,x,y,z,r,material=M.steel){const m=new THREE.Mesh(ringGeo,material);m.position.set(x,y,z);m.scale.setScalar(r);parent.add(m);return m}
function openTube(parent,x,y,z,r,length,material=M.graphite){const m=new THREE.Mesh(tubeGeo,material);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.scale.set(r,length,r);parent.add(m);return m}
function bore(parent,x,y,z,r){openTube(parent,x,y,z+.035,r,.07,M.steel);ring(parent,x,y,z,r,M.steel);const m=new THREE.Mesh(diskGeo,M.bore);m.position.set(x,y,z+.069);m.rotation.y=Math.PI;m.scale.setScalar(r*.92);parent.add(m)}
function screw(parent,x,y,z){const m=tube(parent,x,y,z,.011,.008,M.steel);m.rotation.set(0,0,Math.PI/2)}
function ironSights(parent,{x=0,y=.23,rear=.08,front=-.6,base=.13,frontBase=.06}={}){
 const g=group(parent,'iron-sights');block(g,x,(base+y-.03)/2,rear,.11,y-.03-base,.05,M.graphite,.003);piece(g,[[front-.03,frontBase],[front+.03,frontBase],[front+.014,y-.03],[front-.014,y-.03]],.045,M.graphite,x);for(const side of [-1,1]){block(g,x+side*.04,y-.014,rear,.022,.045,.04,M.graphite,.003);const dot=new THREE.Mesh(diskGeo,sightMat);dot.position.set(x+side*.04,y-.009,rear+.027);dot.scale.setScalar(.004);g.add(dot)}
 block(g,x,y-.02,front,.013,.05,.025,M.graphite,.002);const dot=new THREE.Mesh(diskGeo,sightMat);dot.name='front-sight-dot';dot.position.set(x,y,front+.019);dot.scale.setScalar(.004);g.add(dot);return g;
}
function optic(parent,a,{x=0,y=.30,z=-.13,mount=.17}={}){
 const g=group(parent,'optic-'+a.id);block(g,x,(mount+y-.09)/2,z,.075,y-.09-mount,.13,M.steel,.003);block(g,x,y-.082,z,.14,.023,.16,M.graphite,.004);
 const boxed=a.shape==='open'||a.shape==='box',half=a.shape==='open'?.085:a.zoom===2?.095:.106;
 if(boxed){for(const side of [-1,1])piece(g,[[z-.045,y-.069],[z+.045,y-.069],[z+.045,y+.058],[z+.02,y+.079],[z-.045,y+.079]],.02,M.graphite,x+side*half);block(g,x,y+.077,z,half*2,.024,a.zoom===2?.14:.09,a.shape==='box'&&a.zoom===1?Y:M.steel,.004);block(g,x,y-.074,z,half*2,.019,.09,M.graphite,.003);
  const key=half*1.85;if(!windows.has(key))windows.set(key,new THREE.PlaneGeometry(key,.13));const lens=new THREE.Mesh(windows.get(key),glassMat);lens.position.set(x,y,z);g.add(lens);
  if(a.shape==='box')for(const side of [-1,1])block(g,x+side*(half+.014),y-.025,z,.014,.065,.038,Y,.002);
 }else{const depth=a.shape==='tube'?.23:a.zoom===2?.12:.055,enclosed=a.zoom===2||a.shape==='tube';for(const offset of enclosed?[-depth/2,depth/2]:[0])ring(g,x,y,z+offset,.09,M.graphite);if(enclosed)openTube(g,x,y,z,.09,depth);const lens=new THREE.Mesh(diskGeo,glassMat);lens.position.set(x,y,z-depth/2+.01);lens.scale.setScalar(.081);g.add(lens);block(g,x+.096,y-.018,z,.035,.043,.046,M.steel,.004);block(g,x,y+.098,z,.035,.021,.04,Y,.003)}
 return g;
}
function grip(parent,{z=.08,y=-.08,width=.10,brace=false}={}){
 piece(parent,[[z-.052,y],[z+.045,y-.01],[z+.105,y-.255],[z+.015,y-.28]],width,M.rubber);
 for(const side of [-1,1]){piece(parent,[[z-.03,y-.04],[z+.015,y-.05],[z+.072,y-.22],[z+.025,y-.235]],.012,Y,side*(width/2+.004));if(brace)block(parent,side*(width/2+.011),y-.18,z+.045,.014,.05,.1,M.graphite,.003)}
 // Open guard and a hooked trigger suspended from its actual pivot.
 piece(parent,[[z-.05,y],[z-.12,y-.02],[z-.14,y-.09],[z-.11,y-.145],[z-.005,y-.145],[z+.018,y-.11],[z-.002,y-.10],[z-.02,y-.122],[z-.096,y-.12],[z-.112,y-.08],[z-.09,y-.025]],.065,M.graphite);
 const trigger=group(parent,'trigger');trigger.position.set(0,y-.028,z-.065);piece(trigger,[[0,0],[-.012,-.009],[-.015,-.047],[.005,-.057],[.012,-.046],[0,-.038]],.017,M.steel);return trigger;
}
function stock(parent,{z=.15,kind='solid',length=.33,low=-.13}={}){
 const g=group(parent,'stock'),end=z+length;
 piece(g,[[z,.065],[z+.07,.085],[end,.016],[end,-.025],[z+.035,.02]],.087,M.graphite);
 if(kind==='wire')piece(g,[[z+.025,-.045],[end,-.14],[end,-.17],[z+.025,-.075]],.04,M.steel);
 if(kind==='full')piece(g,[[z,.04],[end,.005],[end,-.17],[z+.03,-.08]],.11,M.graphite);
 if(kind!=='light'&&kind!=='wire'&&kind!=='full')piece(g,[[z+.035,-.03],[end,-.16],[end-.025,-.19],[z+.03,-.09]],.075,kind==='brace'?M.steel:Y);
 piece(g,[[end-.02,.03],[end+.042,.006],[end+.042,low-.075],[end-.035,low-.05]],.13,M.rubber);
 if(kind==='brace')block(g,0,-.085,z+length*.6,.13,.07,length*.7,M.graphite,.005);return g;
}
function muzzle(parent,{x=0,y=0,z,r=.045,type}={}){
 bore(parent,x,y,z,r);if(!type)return z;
 if(type==='crown'||type==='choke'){ring(parent,x,y,z-.016,r*(type==='choke'?1.06:1.0),M.steel);return z-.03}
 const depth=type==='comp'?.12:.085,w=r*2.7,h=r*2.4,g=group(parent,'muzzle-'+type);
 for(const sign of [-1,1]){block(g,x+sign*(w/2-.012),y,z-depth/2,.024,h,depth,type==='comp'?Y:M.steel,.004);block(g,x,y+sign*(h/2-.008),z-depth/2,w,.016,depth,M.graphite,.003);for(let i=0;i<2;i++)block(g,x+sign*(w/2+.003),y,z-.025-i*.036,.004,h*.5,.02,M.bore,.001)}return z-depth;
}
function handRig(h,rightPosition,leftPosition){
 const parent=h.parent;h.right=palm(parent,...rightPosition);h.left=palm(parent,...leftPosition,true);h.right.rotation.set(.05,0,-.12);h.left.rotation.set(.42,0,.20);h.right.children[2].position.set(-.065,.095,-.10);
 h.leftBase=h.left.position.clone();h.leftRotation=h.left.rotation.clone();h.armEnds=[new THREE.Vector3(.17,-.95,.55),new THREE.Vector3(-.22,-.95,.25)];h.arms=h.armEnds.map(()=>{const arm=new THREE.Mesh(armGeo,M.yellow);arm.userData.healthSkin=true;arm.userData.weaponDynamic=true;parent.add(arm);return arm});followHands(h);
}
function followHands(h){if(!h.arms)return;for(let i=0;i<2;i++){const hand=i?h.left:h.right;v.set(0,-.085,.02).applyQuaternion(hand.quaternion).add(hand.position);d.copy(h.armEnds[i]).sub(v);const length=d.length(),arm=h.arms[i];arm.position.copy(v).addScaledVector(d,.5);arm.quaternion.setFromUnitVectors(up,d.normalize());arm.scale.set(i?.053:.058,length,i?.057:.062)}}
// Static meshes are combined inside each independently animated group. Base
// profile buffers/materials remain shared; only these merged buffers are owned.
function consolidate(root){
 for(const child of [...root.children])if(!child.isMesh)consolidate(child);
 const sets=new Map();for(const m of root.children)if(m.isMesh&&m.visible&&!m.userData.weaponDynamic){m.updateMatrix();const key=m.material.uuid+':'+!!m.userData.healthSkin;if(!sets.has(key))sets.set(key,[]);sets.get(key).push(m)}
 for(const meshes of sets.values()){if(meshes.length<2)continue;const count=meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count),0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2),normal=new THREE.Vector3(),point=new THREE.Vector3(),nm=new THREE.Matrix3();let offset=0;
  for(const mesh of meshes){const geo=mesh.geometry,pos=geo.attributes.position,norm=geo.attributes.normal,tex=geo.attributes.uv,index=geo.index;nm.getNormalMatrix(mesh.matrix);for(let j=0;j<(index?.count||pos.count);j++){const k=index?index.getX(j):j;point.fromBufferAttribute(pos,k).applyMatrix4(mesh.matrix);normal.fromBufferAttribute(norm,k).applyNormalMatrix(nm);point.toArray(p,offset*3);normal.toArray(n,offset*3);if(tex){uv[offset*2]=tex.getX(k);uv[offset*2+1]=tex.getY(k)}offset++}if(mesh.name){const anchor=new THREE.Object3D();anchor.name=mesh.name;anchor.position.copy(mesh.position);root.add(anchor)}root.remove(mesh)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingSphere();g.userData.weaponOwned=true;const m=new THREE.Mesh(g,meshes[0].material);m.userData.healthSkin=!!meshes[0].userData.healthSkin;m.receiveShadow=true;root.add(m);
 }
}
export function disposeToolModel(root){root?.traverse(m=>{if(m.userData.modularDispose){m.userData.modularDispose();delete m.userData.modularDispose;}if(m.geometry?.userData.weaponOwned)m.geometry.dispose()})}
function finish(h,{world=false,right=[.075,-.23,.10],left=[-.075,-.11,-.45]}={}){
 h.parent.userData.toolWeapon=h;h.emptyReload=false;if(!world)handRig(h,right,left);h.leftReload=h.leftReload||new THREE.Vector3(-.07,-.22,-.18);
 for(const name of ['magazine','bolt','pump','gate','rails','charge','feed'])if(h[name])h[name+'Base']=h[name].position.clone();
 animateToolWeapon(h,{});consolidate(h.parent);return h;
}
function rattler(parent,kit,world){
 const body=group(parent,'rattler-receiver'),h={type:'smg',parent,body,muzzleY:.015,sightX:0,sightY:kit.optic?.30:.212};
 piece(body,[[.12,-.065],[.13,.065],[.04,.115],[-.32,.115],[-.38,.025],[-.31,-.085]],.165,M.graphite);
 piece(body,[[.10,.07],[.035,.14],[-.26,.14],[-.34,.07],[-.26,.02],[.09,.02]],.178,Y);
 const barrel=kit.barrel?.visual,front=barrel==='long'?-.76:barrel==='short'?-.49:-.61;
 tube(body,0,.015,(front-.28)/2,.04,Math.abs(front+.28),M.steel);
 piece(body,[[-.28,-.035],[-.34,.06],[front+.07,.055],[front+.025,-.012],[front+.08,-.055]],.13,M.graphite);
 for(const side of [-1,1]){for(let i=0;i<(world?2:4);i++)block(body,side*.071,.012,-.33-i*.046,.009,.035,.022,M.bore,.002);if(!world){screw(body,side*.095,.07,-.25);screw(body,side*.095,.07,.05)}}
 h.bolt=group(body,'rattler-bolt');block(h.bolt,.095,.04,-.10,.018,.05,.11,M.steel,.003);block(h.bolt,-.11,.065,-.025,.04,.025,.04,M.graphite,.003);
 h.trigger=grip(body);h.stock=stock(body,{kind:kit.stock?.visual==='light'?'light':kit.stock?.visual==='brace'?'brace':'wire',length:.26});
 h.magazine=group(body,'rattler-magazine');const mag=kit.magazine?.visual;
 if(mag==='drum'){tube(h.magazine,0,-.23,-.14,.14,.18,M.graphite).rotation.set(0,0,Math.PI/2);block(h.magazine,0,-.12,-.14,.10,.11,.10,M.steel);for(const side of [-1,1])ring(h.magazine,side*.1,-.23,-.14,.09,Y).rotation.y=Math.PI/2}
 else{const length=mag==='extended'?.43:mag==='fast'?.24:.32;piece(h.magazine,[[-.085,-.08],[-.18,-.09],[-.225,-length],[-.14,-length-.035],[-.095,-.21]],.09,M.graphite);for(const side of [-1,1])for(let i=0;i<(world?1:3);i++)block(h.magazine,side*.049,-.15-i*.055,-.14,.007,.009,.075,M.steel,.001);block(h.magazine,0,-length-.02,-.18,.11,.025,.11,Y,.003)}
 if(kit.stock?.visual==='grip'){piece(body,[[-.35,-.045],[-.42,-.05],[-.39,-.19],[-.33,-.17]],.065,M.rubber);h.leftReload=new THREE.Vector3(-.06,-.21,-.12)}
 h.muzzleZ=muzzle(body,{y:h.muzzleY,z:front,r:barrel==='heavy'?.055:.038,type:kit.muzzle?.visual});
 if(kit.optic)optic(body,kit.optic,{y:h.sightY,mount:.15});else ironSights(body,{y:h.sightY,front:front+.075,base:.14,frontBase:.06});
 return finish(h,{world,left:[-.07,-.12,-.34]});
}
function jackhammer(parent,kit,world){
 const h=createRifle(parent);h.type='rifle';h.parent=parent;h.muzzleY=.018;h.sightX=0;h.sightY=kit.optic?.30:.23;h.irons.visible=false;
 h.body.name='jackhammer-receiver';h.body.traverse(m=>{if(m.isMesh&&m.material===M.ceramic)m.material=Y});
 const scale=kit.barrel?.visual==='long'?1.19:kit.barrel?.visual==='short'?.80:kit.barrel?.visual==='heavy'?1.04:1;h.foreEnd.scale.z=scale;h.foreEnd.position.z=-.30+.30*scale;
 h.muzzleZ=-.30+(-.985+.30)*scale;
 if(kit.muzzle)h.muzzleZ=muzzle(h.body,{y:h.muzzleY,z:h.muzzleZ,r:.047,type:kit.muzzle.visual});
 for(const a of [kit.magazine,kit.stock].filter(Boolean))rifleAttachment(h,a);
 for(const side of [-1,1]){block(h.body,side*.107,-.02,-.04,.018,.10,.033,M.steel,.003);if(!world){screw(h.body,side*.114,.045,-.28);screw(h.body,side*.114,-.05,.07)}}
 if(kit.optic)optic(h.body,kit.optic,{y:h.sightY,mount:.17});else ironSights(h.body,{y:h.sightY,front:-.30+(-.68+.30)*scale,base:.16,frontBase:.075});
 h.body.traverse(m=>{if(m.isMesh&&m.material===M.ceramic)m.material=Y});
 for(const m of [h.bolt,h.trigger,h.charging,h.arm,h.supportArm])m.userData.weaponDynamic=true;
 parent.userData.toolWeapon=h;consolidate(parent);return h;
}
function sledgehammer(parent,kit,world){
 const body=group(parent,'sledgehammer-receiver'),h={type:'shotgun',parent,body,muzzleY:.025,sightX:0,sightY:kit.optic?.30:.205};
 piece(body,[[.15,-.08],[.14,.075],[.03,.115],[-.38,.115],[-.48,.045],[-.43,-.095],[-.08,-.12]],.235,M.graphite);
 for(const side of [-1,1])piece(body,[[.08,.04],[.02,.09],[-.32,.09],[-.39,.03],[-.34,-.04],[-.06,-.04]],.017,Y,side*.124);
 h.trigger=grip(body,{z:.10,brace:true});stock(body,{kind:'full',z:.19,length:.30,low:-.15});
 const barrel=kit.barrel?.visual,front=barrel==='long'?-1.25:barrel==='short'?-.88:-1.09,extension=kit.tube?.id.endsWith('balanced')?.07:kit.tube?.id.endsWith('extended')?.14:kit.tube?.id.endsWith('fast')?-.12:0;
 tube(body,0,.025,(front-.29)/2,barrel==='heavy'?.082:.068,Math.abs(front+.29),M.steel);tube(body,0,-.105,(-.34+(front+.17-extension))/2,.052,Math.abs(front+.17-extension+.34),M.graphite);ring(body,0,-.105,front+.17-extension,.052,Y);
 h.pump=group(body,'sledgehammer-pump');const light=kit.pump?.visual==='light',pumpLength=kit.pump?.id.endsWith('rapid')?.22:.31;
 piece(h.pump,[[-.46,-.065],[-.46-pumpLength,-.065],[-.49-pumpLength,-.12],[-.46-pumpLength,-.18],[-.45,-.18],[-.42,-.12]],light?.17:.205,light?M.graphite:M.rubber);
 for(const side of [-1,1]){block(h.pump,side*(light?.095:.112),-.12,-.46-pumpLength/2,.016,.09,pumpLength*.8,Y,.004);for(let i=0;i<(world?2:light?3:6);i++)block(h.pump,side*.122,-.12,-.47-i*pumpLength/(light?3:6),.008,.10,.013,M.graphite,.002)}
 h.pumpStroke=kit.pump?.id.endsWith('rapid')?.105:.17;h.bolt=group(body,'sledgehammer-bolt');block(h.bolt,.13,.035,-.18,.016,.07,.14,M.steel,.003);block(body,.131,-.065,-.23,.014,.045,.15,M.bore,.002);
 h.feed=group(body,'shell-speed-loader');for(let i=0;i<(world?2:4);i++){tube(h.feed,0,0,-i*.075,.024,.066,M.casing);ring(h.feed,0,0,.033-i*.075,.024,M.steel)}
 h.leftReload=new THREE.Vector3(-.045,-.22,-.23);
 h.muzzleZ=muzzle(body,{y:h.muzzleY,z:front,r:.061,type:kit.choke?.visual});
 if(kit.optic)optic(body,kit.optic,{y:h.sightY,mount:.16});else ironSights(body,{y:h.sightY,front:front+.09,base:.115,frontBase:.095});
 return finish(h,{world,right:[.075,-.23,.12],left:[-.085,-.15,-.62]});
}
function demolisher(parent,kit,world){
 const body=group(parent,'demolisher-tube'),h={type:'rocket',parent,body,muzzleY:.035,muzzleX:-.10,sightX:.235,sightY:kit.optic?.34:.285};
 openTube(body,-.10,.035,-.27,.19,1.10,M.graphite);for(const z of [-.72,.10]){ring(body,-.10,.035,z,.20,Y);ring(body,-.10,.035,z+.035,.195,M.steel)}
 for(const side of [-1,1])piece(body,[[-.64,-.075],[-.64,.12],[-.50,.19],[.10,.19],[.21,.10],[.21,-.08]],.022,Y,-.10+side*.19);
 // Real open carry handle, insulated grip and shoulder cheek pad.
 piece(body,[[.15,.205],[.15,.34],[-.30,.34],[-.35,.27],[-.31,.235],[-.27,.297],[.10,.297],[.10,.205]],.085,M.graphite);
 for(const side of [-1,1]){for(let i=0;i<(world?2:4);i++)block(body,-.10+side*.207,.055,-.48+i*.105,.009,.065,.055,M.graphite,.004);if(!world)screw(body,-.10+side*.214,-.035,-.55)}
 h.trigger=grip(body,{z:.06,y:-.15,width:.12,brace:kit.grip?.visual==='grip'});block(body,-.10,-.16,.16,.26,.08,.26,M.rubber,.01);
 h.gate=group(body,'breech-gate');h.gate.position.set(-.10,-.12,.28);tube(h.gate,0,.15,0,.19,.025,M.steel);ring(h.gate,0,.15,.018,.13,M.graphite);
 h.magazine=group(body,'rocket-cassette');h.magazine.position.set(.13,-.10,.10);const loader=kit.loader?.visual,r=loader==='extended'?.17:loader==='fast'?.12:.145;
 tube(h.magazine,0,0,0,r,.25,M.graphite);ring(h.magazine,0,0,.13,r,Y);const rounds=loader==='extended'?7:loader==='fast'?4:5;for(let i=0;i<(world?3:rounds);i++){const a=i*Math.PI*2/rounds;tube(h.magazine,Math.sin(a)*r*.62,Math.cos(a)*r*.62,0,.031,.27,M.steel)}
 const motor=kit.motor?.id||'';for(let i=0;i<(world?2:motor.endsWith('fast')?5:3);i++)ring(body,-.10,.035,-.02+i*.045,motor.endsWith('heavy')?.225:.205,M.steel);
 if(kit.grip?.visual==='sling')piece(body,[[.21,-.12],[.12,-.37],[-.15,-.41],[-.20,-.32],[-.18,-.31],[-.12,-.38],[.09,-.34],[.18,-.12]],.025,M.rubber,-.25);
 if(kit.grip?.visual==='light')block(body,0,-.28,.11,.16,.04,.09,Y,.004);
 if(loader==='brace')block(body,-.10,-.22,.21,.22,.10,.13,M.steel,.006);
 const warhead=kit.warhead?.id||'',front=-.855,radius=warhead.endsWith('blast')?.225:warhead.endsWith('focused')?.145:.19;
 bore(body,-.10,.035,front,radius);if(warhead.endsWith('focused')){openTube(body,-.10,.035,front+.06,.15,.12,Y);ring(body,-.10,.035,front,.16,M.steel)}else ring(body,-.10,.035,front,.22,Y);
 if(warhead.endsWith('jump'))for(const side of [-1,1])openTube(body,-.10+side*.23,.035,-.70,.028,.18,M.steel);
 h.muzzleZ=front;block(body,h.sightX,.15,-.26,.055,.08,.84,M.steel,.004);
 if(kit.optic)optic(body,kit.optic,{x:h.sightX,y:h.sightY,z:-.19,mount:.20});else ironSights(body,{x:h.sightX,y:h.sightY,front:-.67,rear:.04,base:.19,frontBase:.19});
 h.leftReload=new THREE.Vector3(.08,-.24,.10);
 return finish(h,{world,right:[.08,-.31,.09],left:[-.13,-.23,-.43]});
}
function lancer(parent,kit,world){
 const body=group(parent,'lancer-chassis'),h={type:'rail',parent,body,muzzleY:.025,sightX:0,sightY:.34};
 piece(body,[[.17,-.07],[.15,.08],[.03,.13],[-.29,.13],[-.38,.03],[-.30,-.105],[-.04,-.13]],.18,M.graphite);
 for(const side of [-1,1])piece(body,[[.09,.075],[.01,.11],[-.26,.10],[-.32,.03],[-.28,-.035],[-.01,-.035]],.016,Y,side*.101);
 h.trigger=grip(body,{z:.10});stock(body,{z:.18,length:.34,kind:kit.stock?.visual==='light'?'light':kit.stock?.visual==='brace'?'brace':'solid',low:kit.stock?.visual==='pad'?-.18:-.13});
 h.rails=group(body,'accelerator-rails');const barrel=kit.barrel?.visual,front=barrel==='long'?-1.46:barrel==='short'?-1.05:-1.27,heavy=barrel==='heavy';
 for(const side of [-1,1]){
  piece(h.rails,[[-.31,-.045],[-.32,.065],[front+.03,.065],[front,.025],[front+.03,-.045]],heavy?.067:.049,M.steel,side*.075);
  block(h.rails,side*(heavy?.115:.105),.01,(front-.32)/2,.016,.06,Math.abs(front+.32)*.94,Y,.003);
 }
 for(let i=0;i<(world?2:4);i++){const z=-.43+(front+.58)*i/3;ring(h.rails,0,.022,z,heavy?.14:.115,M.graphite);block(h.rails,0,-.086,z,.18,.035,.045,M.steel,.003)}
 h.charge=group(h.rails,'charge-conductors');for(const side of [-1,1])block(h.charge,side*.041,.022,(front-.35)/2,.012,.02,Math.abs(front+.35),powerMat,.002);
 block(h.rails,0,-.025,front,.22,.06,.025,M.graphite,.003);h.muzzleZ=front-.012;
 h.magazine=group(body,'lancer-battery');h.magazine.position.set(-.13,-.13,-.13);const mag=kit.magazine?.visual,length=mag==='extended'?.25:mag==='fast'?.13:.19;
 piece(h.magazine,[[.08,.04],[-.09,.04],[-.12,-length],[.07,-length-.02]],.11,M.graphite);block(h.magazine,-.063,-length/2,-.015,.018,length*.80,.12,Y,.004);
 const capacitor=kit.capacitor?.id||'',cells=mag==='extended'?6:mag==='fast'?3:kit.magazine?.id.endsWith('reserve')?5:4;for(let i=0;i<(world?2:cells);i++)block(h.magazine,-.075,-.015-i*length/cells,-.015,.009,.01,.08,capacitor.endsWith('overcharge')?M.casing:powerMat,.002);
 if(capacitor.endsWith('rapid'))for(let i=0;i<3;i++)block(body,.105,.02-i*.027,-.19,.022,.014,.13,M.steel,.002);
 if(capacitor.endsWith('overcharge'))block(h.magazine,0,-length-.01,-.02,.14,.035,.16,Y,.003);
 if(capacitor.endsWith('stable'))for(let i=0;i<3;i++)block(body,.105,-.015-i*.025,-.15,.018,.012,.20,M.steel,.002);
 h.bolt=group(body,'lancer-charging-lever');block(h.bolt,.125,.05,-.06,.05,.025,.065,M.steel,.003);
 const opticPart=kit.optic||{id:'standard-scope',shape:'tube',zoom:2};optic(body,opticPart,{y:h.sightY,z:-.08,mount:.12});
 h.leftReload=new THREE.Vector3(-.18,-.20,-.13);
 return finish(h,{world,right:[.075,-.23,.12],left:[-.075,-.12,-.45]});
}
export function createToolWeapon(parent,gun,{attachments=[],world=false}={}){
 const kit=Object.fromEntries(attachments.map(a=>[a.slot,a]));
 if(gun===0)return jackhammer(parent,kit,world);if(gun===2)return rattler(parent,kit,world);if(gun===3)return lancer(parent,kit,world);if(gun===4)return demolisher(parent,kit,world);if(gun===5)return sledgehammer(parent,kit,world);throw Error('Unknown tool weapon '+gun);
}
export function animateToolWeapon(h,{reload=0,reloading=false,shotAge=10,ammo=30,charge=0}={}){
 if(h.type==='rifle'){animateRifle(h,{reload,reloading,shotAge,ammo});return}
 const kick=Math.max(0,1-shotAge/(h.type==='smg'?.065:.12)),cycle=Math.sin(THREE.MathUtils.clamp((shotAge-.10)/.28,0,1)*Math.PI);
 for(const name of ['magazine','bolt','pump','gate','rails','charge','feed'])if(h[name]){h[name].position.copy(h[name+'Base']);h[name].rotation.set(0,0,0)}
 if(h.bolt)h.bolt.position.z+=ammo===0&&h.type==='smg'?.065:kick*.055;
 if(h.trigger)h.trigger.rotation.x=-kick*.22;
 if(h.pump){h.pump.position.z=cycle*h.pumpStroke;if(h.left)h.left.position.copy(h.leftBase).add(v.set(0,0,cycle*h.pumpStroke))}
 else if(h.left)h.left.position.copy(h.leftBase);
 if(h.left)h.left.rotation.copy(h.leftRotation);
 if(h.magazine)h.magazine.visible=true;if(h.feed)h.feed.visible=false;
 if(h.rails){h.rails.position.z=kick*.035;h.charge.scale.y=1+charge*.3;h.charge.visible=shotAge>.06||charge>0}
 if(h.gate)h.gate.rotation.x=kick*.10;
 if(reloading){
  const out=smooth((reload-.13)/.18),insert=smooth((reload-.49)/.25),withdraw=out*(1-insert),grab=smooth(reload/.13)*(1-smooth((reload-.78)/.15));
  if(h.type==='shotgun'){
   const feed=smooth((reload-.17)/.18)*(1-smooth((reload-.62)/.12));h.feed.visible=reload>.16&&reload<.67;h.feed.position.set(-.12*(1-feed),-.37+feed*.22,-.20);h.feed.rotation.z=.3*(1-feed);
   if(h.left)h.left.position.lerp(h.leftReload,feed);
   const rack=smooth((reload-.72)/.09)*(1-smooth((reload-.88)/.09));h.pump.position.z=rack*h.pumpStroke;if(h.left)h.left.position.lerp(v.copy(h.leftBase).add(d.set(0,0,rack*h.pumpStroke)),smooth((reload-.68)/.09));
  }else{
   const rail=h.type==='rail',rocket=h.type==='rocket';h.magazine.position.y-=withdraw*(rocket?.25:.42);h.magazine.position.x-=withdraw*(rail?.22:rocket?.22:.025);h.magazine.position.z+=withdraw*(rocket?-.08:.065);h.magazine.rotation.z=withdraw*(rocket?-.3:.14);h.magazine.visible=reload<.38||reload>.47;
   if(h.left){h.left.position.lerp(v.copy(h.leftReload).add(d.set(-withdraw*.10,-withdraw*.30,withdraw*.04)),grab);h.left.rotation.x-=grab*.55}
   const rack=smooth((reload-.78)/.065)*(1-smooth((reload-.91)/.06));if(h.bolt)h.bolt.position.z+=rack*.075;
   if(h.gate)h.gate.rotation.x=-smooth((reload-.05)/.12)*(1-smooth((reload-.77)/.16))*1.2;
  }
 }
 followHands(h);
}
// Distant players retain each weapon's recognizable construction with a small draw budget.
export function createToolWorld(parent,gun){
 const g=group(parent,'tool-world'),h={type:['rifle','pistol','smg','rail','rocket','shotgun'][gun]};
 if(gun===4){openTube(g,-.05,.06,-.12,.135,.67);ring(g,-.05,.06,-.46,.15,Y);block(g,0,-.14,.06,.10,.22,.11,M.rubber);block(g,-.05,.19,-.10,.11,.035,.32,Y);tube(g,.10,-.015,.12,.105,.16,M.graphite)}
 else{
  const smg=gun===2,rail=gun===3,shotgun=gun===5,length=smg?.33:shotgun?.47:.44;
  piece(g,[[.12,-.04],[.10,.10],[-length,.10],[-length-.055,.02],[-length,-.07],[-.05,-.09]],rail?.145:.18,M.graphite);
  for(const side of [-1,1])block(g,side*(rail?.08:.10),.05,-length/2,.015,.07,length*.84,Y);
  piece(g,[[.06,-.05],[.13,-.06],[.20,-.28],[.10,-.30]],.09,M.rubber);stock(g,{length:smg?.21:.30});
  if(rail){for(const side of [-1,1]){block(g,side*.06,.02,-.76,.038,.055,.70,M.steel);block(g,side*.085,.02,-.76,.012,.025,.65,Y)}tube(g,0,.21,-.08,.06,.24,M.graphite);block(g,-.11,-.11,-.09,.09,.17,.14,Y)}
  else{tube(g,0,.025,smg?-.47:-.68,shotgun?.054:.032,smg?.24:.51,M.steel);if(shotgun){tube(g,0,-.075,-.63,.034,.46,M.graphite);block(g,0,-.08,-.61,.17,.12,.23,Y)}else piece(g,[[-.08,-.07],[-.15,-.07],[-.19,-.31],[-.09,-.33]],.075,M.graphite)}
 }
 consolidate(g);g.userData.weaponType=h.type;return g;
}
