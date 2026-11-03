import * as THREE from './vendor/three.module.js';
import {MATERIALS as M} from './presentation.js';
import {piece,block} from './rifle.js';

// Conversion hardware shares source buffers/materials. Only the merged buffers below
// are owned by a weapon instance and disposed with the existing model lifecycle.
const boxGeo=new THREE.BoxGeometry(1,1,1),pipeGeo=new THREE.CylinderGeometry(1,1,1,16,1,true),ringGeo=new THREE.TorusGeometry(1,.11,5,20),diskGeo=new THREE.CircleGeometry(1,20);
const blue=new THREE.MeshStandardMaterial({color:0x83c6c6,emissive:0x367d83,emissiveIntensity:.6,roughness:.3,metalness:.45});
const orange=new THREE.MeshStandardMaterial({color:0xd87943,roughness:.43,metalness:.22});
const white=new THREE.MeshStandardMaterial({color:0xdbe4d6,roughness:.65,metalness:.15});
const lume=new THREE.MeshBasicMaterial({color:0xcde97a});
const DEFAULT_MUZZLE=[-.985,-.625,-.61,-1.282,-.855,-1.09],DEFAULT_Y=[.018,.061,.015,.025,.035,.025];
const clamp=THREE.MathUtils.clamp,up=new THREE.Vector3(0,1,0),work=new THREE.Vector3(),end=new THREE.Vector3();
const label=a=>(a?.name||a?.id||'').toLowerCase().replace(/[^a-z0-9]+/g,' ');
const has=(a,pattern)=>pattern.test(label(a));
const fit=(attachments,slot)=>attachments.find(a=>a.slot===slot||slot==='ammunition'&&a.slot==='ammo');
function group(parent,name){const g=new THREE.Group();g.name=name;parent.add(g);return g}
function flat(parent,x,y,z,w,h,d,material=M.graphite){const mesh=new THREE.Mesh(boxGeo,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh}
function pipe(parent,x,y,z,r,length,material=M.steel){const mesh=new THREE.Mesh(pipeGeo,material);mesh.position.set(x,y,z);mesh.rotation.x=Math.PI/2;mesh.scale.set(r,length,r);parent.add(mesh);return mesh}
function ring(parent,x,y,z,r,material=M.steel){const mesh=new THREE.Mesh(ringGeo,material);mesh.position.set(x,y,z);mesh.scale.setScalar(r);parent.add(mesh);return mesh}
function disc(parent,x,y,z,r,material=M.bore){const mesh=new THREE.Mesh(diskGeo,material);mesh.position.set(x,y,z);mesh.scale.setScalar(r);parent.add(mesh);return mesh}
function line(parent,a,b,r=.009,material=M.steel){const mesh=new THREE.Mesh(pipeGeo,material);work.copy(b).sub(a);mesh.position.copy(a).addScaledVector(work,.5);mesh.quaternion.setFromUnitVectors(up,work.clone().normalize());mesh.scale.set(r,work.length(),r);parent.add(mesh);return mesh}
function barrel(parent,x,y,z,r,length,material=M.steel){pipe(parent,x,y,z+length/2,r,length,material);ring(parent,x,y,z,r);ring(parent,x,y,z+.04,r*1.04,M.graphite);disc(parent,x,y,z+length-.002,r*.9);}
function marks(parent,x,y,z,count,material=white){for(let i=0;i<count;i++)flat(parent,x,y,z+i*.026,.005,.023,.012,material)}
function collar(parent,x,y,z,r,color=M.safety){ring(parent,x,y,z,r,color);ring(parent,x,y,z+.026,r*.99,M.graphite)}
function bolt(parent,x,y,z){const discMesh=disc(parent,x,y,z,.009,M.steel);discMesh.rotation.y=Math.PI/2;return discMesh}
function spring(parent,x,y,z,r,length,world){pipe(parent,x,y,z+length/2,r*.65,length,M.graphite);const n=world?3:6;for(let i=0;i<n;i++)ring(parent,x,y,z+i*length/n,r,M.steel)}
function hide(state,node){if(node){state.hidden.push([node,node.visible]);node.visible=false}}
function dynamic(state,parent,name,kind){const g=group(parent,name);g.userData.conversionDynamic=true;state.moving.push({node:g,kind,position:g.position.clone(),rotation:g.rotation.clone()});return g}
function saveBase(state,node){const m=state.moving.find(x=>x.node===node);if(m){m.position.copy(node.position);m.rotation.copy(node.rotation)}}
function lamp(state,parent,x,y,z,w,h,d,kind='charge',index=0){const mesh=flat(parent,x,y,z,w,h,d,lume);mesh.userData.conversionDynamic=true;state.lamps.push({mesh,kind,index,scale:mesh.scale.clone()});return mesh}

function merged(root){
 for(const child of [...root.children])if(child.isGroup)merged(child);
 const sets=new Map();for(const child of root.children)if(child.isMesh&&child.visible&&!child.userData.conversionDynamic&&child.name!=='front-sight-dot'&&child.name!=='front-sight-fiber'){child.updateMatrix();if(!sets.has(child.material))sets.set(child.material,[]);sets.get(child.material).push(child)}
 for(const [material,meshes]of sets){if(meshes.length<2)continue;const count=meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count),0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2),normalMatrix=new THREE.Matrix3(),p=new THREE.Vector3(),normal=new THREE.Vector3();let offset=0;
  for(const mesh of meshes){const geo=mesh.geometry,index=geo.index,position=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv;normalMatrix.getNormalMatrix(mesh.matrix);
   for(let i=0;i<(index?.count||position.count);i++){const k=index?index.getX(i):i;p.fromBufferAttribute(position,k).applyMatrix4(mesh.matrix).toArray(positions,offset*3);normal.fromBufferAttribute(norm,k).applyNormalMatrix(normalMatrix).toArray(normals,offset*3);if(uv){uvs[offset*2]=uv.getX(k);uvs[offset*2+1]=uv.getY(k)}offset++}root.remove(mesh);if(geo.userData.weaponOwned)geo.dispose();
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.computeBoundingSphere();geometry.userData.weaponOwned=true;const result=new THREE.Mesh(geometry,material);result.castShadow=true;result.receiveShadow=true;root.add(result);
 }
}

// Preserve the original authored mechanisms and animated anchors. These aliases
// are visual inputs only: gameplay still uses the original conversion catalog.
export function modelAttachments(gun,attachments=[]){
 const out=[...attachments],feed=fit(attachments,'feed'),handling=fit(attachments,'handling');
 if(feed){
  const large=has(feed,/twelve round magazine|ninety six|sixty round|twelve shell|eight rocket|eight charge/),small=has(feed,/four round|twelve round quick|fifteen round|four shell|two rocket|single charge/);
  let slot=gun===5?'tube':gun===4?'loader':'magazine',visual=large?(gun===2?'drum':'extended'):small?'fast':'standard';
  // The Nailer has a truly flush speed base and a visible extended grip magazine.
  if(gun===1&&has(feed,/twelve/))visual='drum';
  out.push({id:'conversion-visual-'+(large?'extended':small?'fast':'standard'),slot,visual});
 }
 if(handling&&has(handling,/entry/))out.push({id:'conversion-visual-light',slot:gun===4?'grip':'stock',visual:'light'});
 if(handling&&has(handling,/anchor/))out.push({id:'conversion-visual-brace',slot:gun===4?'grip':'stock',visual:'brace'});
 return out;
}

function paired(state,hero,gun,action){
 const root=group(state.root,'conversion-paired-'+gun),y=state.y,z=state.z;
 if(gun===3){
  hide(state,hero.rails);const channels=dynamic(state,root,'split-accelerator-carriage','rails');
  for(const x of [-.095,.095]){for(const side of [-1,1]){flat(channels,x+side*.029,y,(z-.35)/2,.022,.05,Math.abs(z+.35),M.steel);flat(channels,x+side*.047,y-.005,(z-.35)/2,.012,.028,Math.abs(z+.35)*.88,M.safety)}for(const railZ of [z+.12,-.68,-.39]){flat(channels,x,y-.047,railZ,.115,.025,.035,M.graphite);ring(channels,x,y,railZ,.061,M.graphite)}lamp(state,channels,x,y-.025,(z-.38)/2,.014,.008,Math.abs(z+.38)*.87,'rail')}
  state.muzzles=[new THREE.Vector3(-.095,y,z),new THREE.Vector3(.095,y,z)];
 }else if(gun===4){
  const secondY=y-.35;barrel(root,state.x,secondY,z-.025,.15,.83,M.graphite);for(const zz of [z+.13,-.35]){collar(root,state.x,secondY,zz,.164);flat(root,state.x-.16,(y+secondY)/2,zz,.035,.30,.075,M.steel);flat(root,state.x+.16,(y+secondY)/2,zz,.035,.30,.075,M.steel)}
  state.muzzles=[new THREE.Vector3(state.x,y,z),new THREE.Vector3(state.x,secondY,z-.025)];
 }else if(gun===5){
  const secondY=y-.145;barrel(root,0,secondY,z-.025,.058,.66);for(const zz of [z+.10,-.52]){flat(root,0,y-.065,zz,.20,.21,.045,M.graphite);ring(root,0,y,zz-.025,.071,M.safety);ring(root,0,secondY,zz-.025,.069,M.safety)}
  state.muzzles=[new THREE.Vector3(0,y,z),new THREE.Vector3(0,secondY,z-.025)];
 }else{
  const r=gun===1?.045:.030,offset=gun===1?.079:.067,front=z-.075,length=gun===1?.34:.33;
  if(gun===1)hide(state,hero.barrel);
  block(root,0,y-.015,front+.13,offset*2+.09,.125,.22,M.graphite,.008);
  for(const x of [-offset,offset]){barrel(root,x,y,front,r,length);collar(root,x,y,front+.07,r*1.15)}
  flat(root,0,y,front+.045,.028,.075,.045,M.graphite);state.muzzles=[new THREE.Vector3(-offset,y,front),new THREE.Vector3(offset,y,front)];
 }
 marks(root,gun===4?.09:.145,gun===4?-.15:-.045,-.25,2,M.safety);
}
function actionHardware(state,hero,gun,action){
 if(!action)return;const g=group(state.root,'conversion-action-'+action.id),world=state.world,n=world?2:4;
 const twin=has(action,/twinstrike|duplex feed|double strike|twin launch|split rail/),charged=has(action,/pressure chamber|siege/),burst=has(action,/hammerfall|three round/),fast=has(action,/riveter|overspeed|overdrive|rotary|rapid pulse|slamfire/);
 state.actionKind=twin?'paired':charged?'charge':burst?'burst':fast?'automatic':'precision';
 if(twin)paired(state,hero,gun,action);
 if(gun===5&&has(action,/slamfire/)){
  const carriage=dynamic(state,g,'slamfire-hydraulic-carriage','slam');
  for(const side of [-1,1]){pipe(carriage,side*.135,-.105,-.57,.021,.37,M.steel);flat(carriage,side*.145,-.105,-.42,.04,.065,.11,M.graphite);collar(carriage,side*.135,-.105,-.75,.025,M.safety)}
  flat(g,.148,.012,-.22,.035,.085,.22,M.graphite);marks(g,.169,.012,-.29,3,M.safety);state.slamHousing=flat(g,.17,.012,-.22,.008,.045,.14,orange);state.slamHousing.userData.conversionDynamic=true;
 }else if(charged){
  const chargedRail=gun===3,x=chargedRail?.14:state.x,y=chargedRail?-.055:state.y;
  for(let i=0;i<n;i++){const zz=(chargedRail?-.44:-.64)+i*.10;collar(g,chargedRail?0:x,chargedRail?state.y:y,zz,chargedRail?.145:.225);if(!world)for(const side of [-1,1])flat(g,(chargedRail?0:x)+side*(chargedRail?.15:.23),chargedRail?-.025:y,zz,.025,.065,.05,M.steel)}
  const bank=dynamic(state,g,'pressure-accumulator','charge');bank.position.set(x,chargedRail?-.04:-.04,-.17);flat(bank,chargedRail?.015:.23,-.08,0,.08,.19,.20,M.graphite);for(let i=0;i<(world?2:4);i++)lamp(state,bank,chargedRail?.058:.275,-.145+i*.042,0,.006,.023,.11,'charge',i);saveBase(state,bank);
  for(const side of [-1,1])line(g,new THREE.Vector3((chargedRail?.13:state.x+side*.20),-.06,-.23),new THREE.Vector3((chargedRail?.13:state.x+side*.20),-.06,-.51),.012,blue);
 }else if(gun===3&&fast){
  block(g,.14,-.035,-.17,.075,.15,.25,M.graphite,.006);for(let i=0;i<n;i++)flat(g,.185,-.075+i*.032,-.17,.012,.014,.23,M.steel);spring(g,.14,-.035,-.27,.026,.20,world);lamp(state,g,.194,-.035,-.17,.005,.019,.17,'rail');
 }else if(gun===4&&fast){
  const rotor=dynamic(state,g,'rotary-breech-drive','rotor');rotor.position.set(.15,-.11,.10);ring(rotor,0,0,.04,.18,M.graphite);for(let i=0;i<3;i++){const a=i*Math.PI*2/3,x=Math.sin(a)*.12,y=Math.cos(a)*.12;pipe(rotor,x,y,0,.045,.18,M.steel);ring(rotor,x,y,-.10,.047,M.safety)}flat(g,.20,-.20,-.12,.12,.08,.16,M.steel);saveBase(state,rotor);
 }else if(fast){
  const side=gun===1?.156:gun===2?.115:.125,port=dynamic(state,g,'high-speed-drive','drive');port.position.set(side,.035,-.17);
  block(port,0,0,0,.055,.10,.25,M.graphite,.005);for(let i=0;i<n;i++)flat(port,.03,0,-.09+i*.05,.012,.066,.014,M.steel);pipe(port,.042,0,0,.031,.035,M.safety).rotation.set(0,0,Math.PI/2);saveBase(state,port);marks(g,-side-.01,-.018,-.10,3,M.safety);
 }else if(burst){
  const cam=dynamic(state,g,'burst-index-cam','cam');cam.position.set(gun===1?.16:.13,.015,-.20);const wheel=ring(cam,0,0,0,.035,M.steel);wheel.rotation.y=Math.PI/2;for(let i=0;i<(has(action,/hammerfall/)?2:3);i++)flat(cam,.014,-.022+i*.023,0,.015,.009,.07,M.safety);saveBase(state,cam);flat(g,gun===1?.14:.115,.015,-.20,.025,.105,.19,M.graphite);marks(g,gun===1?-.15:-.13,-.025,-.20,has(action,/hammerfall/)?2:3);
 }else if(!twin){
  const side=gun===1?.155:.13;block(g,side,-.025,-.17,.045,.085,.20,M.steel,.005);marks(g,side+.025,-.025,-.19,1,M.safety);
  if(gun===0||gun===5){const front=state.z-.055;barrel(g,0,state.y,front,gun===5?.059:.04,.085);ring(g,0,state.y,front,.07,M.graphite);state.muzzles=[new THREE.Vector3(0,state.y,front)];state.z=front;hero.muzzleZ=front;for(const sign of [-1,1])flat(g,sign*(gun===5?.105:.085),-.055,-.69,.018,.025,.40,M.steel)}
 }
 // A selector with readable physical detents sits below the sight channel.
 const selector=group(g,'conversion-selector');selector.position.set(gun===4?.14:-.14,-.035,.015);flat(selector,0,0,0,.022,.045,.09,M.graphite);flat(selector,-.014,burst?-.007:fast?.007:0,0,.012,.009,.050,M.safety);
}

function magazine(state,hero,gun,feed){
 if(!feed)return;const world=state.world,root=hero.magazine||group(hero.body,'conversion-feed-anchor');if(hero.magazine)for(const child of [...root.children])hide(state,child);
 const g=group(root,'conversion-feed-'+feed.id);state.roots.push(g);state.feedRoot=g;state.feedName=label(feed);
 const small=has(feed,/four round|twelve round quick|fifteen round|four shell|two rocket|single charge/),large=has(feed,/twelve round magazine|ninety six|sixty round|twelve shell|eight rocket|eight charge/),individual=has(feed,/individual shell|service feed/);
 if(gun===1){
  const length=large?.59:small?.415:.45,z=.205+(length-.45)*.23;
  piece(g,[[.12,-.18],[.19,-.18],[z+.054,-length+.025],[z-.05,-length]],.106,M.steel);
  block(g,0,-length-.009,z,.15,.035,.13,small?M.safety:M.graphite,.004);flat(g,-.057,-length+.035,z,.009,.035,.09,M.safety);
  if(large)for(let i=0;i<(world?2:5);i++){const hole=disc(g,-.056,-.30-i*.055,.21,.007,M.bore);hole.rotation.y=-Math.PI/2}
  if(has(feed,/empty drop/)){flat(g,-.067,-.43,.20,.025,.065,.11,M.safety);spring(g,-.07,-.40,.12,.008,.07,world)}
 }else if(gun===2){
  if(large){
   pipe(g,0,-.265,-.15,.17,.21,M.graphite).rotation.set(0,0,Math.PI/2);
   for(const side of [-1,1]){const rim=ring(g,side*.112,-.265,-.15,.147,M.safety);rim.rotation.y=Math.PI/2;const hub=disc(g,side*.117,-.265,-.15,.108,M.steel);hub.rotation.y=side*Math.PI/2;if(!world)for(let i=0;i<6;i++){const a=i*Math.PI/3;flat(g,side*.12,-.265+Math.sin(a)*.12,-.15+Math.cos(a)*.12,.008,.014,.029,M.graphite)}}
   block(g,0,-.14,-.15,.105,.16,.11,M.steel,.004);
  }else{
   const coupled=has(feed,/coupled/),length=small?.225:.34;
   for(const side of coupled?[-1,1]:[0]){const clip=group(g,'rattler-stick-'+side);clip.position.x=side*.057;piece(clip,[[-.085,-.08],[-.17,-.09],[-.21,-length],[-.13,-length-.025],[-.095,-.19]],.075,M.graphite);flat(clip,0,-length-.014,-.17,.09,.025,.10,M.safety);if(!world)for(let i=0;i<3;i++)flat(clip,-.04,-.135-i*.043,-.14,.006,.010,.064,M.steel)}
   if(coupled){flat(g,0,-.19,-.15,.21,.055,.13,M.rubber);marks(g,-.106,-.19,-.19,2,M.safety)}
  }
 }else if(gun===0){
  const length=large?.51:small?.29:.41;
  piece(g,[[-.12,-.09],[-.24,-.10],[-.27,-length+.08],[-.235,-length],[-.13,-length+.015],[-.105,-.26]],large?.15:.115,M.graphite);
  flat(g,0,-length,-.18,large?.17:.13,.035,.13,M.rubber);for(const sign of [-1,1]){flat(g,sign*(large?.08:.063),(-.1-length)/2,-.18,.008,length*.68,.075,M.safety);if(!world)for(let i=0;i<3;i++)flat(g,sign*(large?.086:.069),-.16-i*(length-.17)/3,-.18,.007,.010,.09,M.steel)}
  if(individual){const rotor=dynamic(state,g,'service-feed-wheel','feed');rotor.position.set(-.094,-.24,-.17);ring(rotor,0,0,0,.052,M.steel).rotation.y=Math.PI/2;flat(rotor,-.006,0,0,.012,.015,.11,M.safety);saveBase(state,rotor);block(g,-.09,-.17,-.18,.045,.07,.14,M.graphite,.004)}
 }else if(gun===5){
  if(large){
   block(g,0,-.245,-.27,.21,.17,.31,M.graphite,.008);flat(g,0,-.335,-.27,.23,.025,.33,M.safety);for(const side of [-1,1])for(let i=0;i<(world?2:4);i++){pipe(g,side*.117,-.245,-.39+i*.075,.025,.069,M.casing).rotation.set(0,0,Math.PI/2);const endCap=ring(g,side*.155,-.245,-.39+i*.075,.027,M.graphite);endCap.rotation.y=Math.PI/2}
  }else{
   const gate=dynamic(state,g,'shell-loading-gate','shell');gate.position.set(-.145,-.13,-.24);flat(g,-.13,-.12,-.26,.02,.09,.19,M.steel);flat(g,-.145,-.12,-.26,.009,.05,.14,M.bore);flat(gate,0,0,0,.018,.042,.13,M.safety);saveBase(state,gate);
   if(individual){for(let i=0;i<(world?2:4);i++){pipe(g,.143,-.09,-.36+i*.075,.027,.065,M.casing).rotation.set(Math.PI/2,0,Math.PI/2);ring(g,.18,-.09,-.36+i*.075,.027,M.graphite).rotation.y=Math.PI/2}}else{collar(g,0,-.105,-.80,.059,M.safety);flat(g,-.14,-.12,-.24,.017,.03,.08,M.safety)}
  }
 }else if(gun===4){
  const count=large?8:small?2:3,r=large?.195:small?.115:.14;
  pipe(g,0,0,0,r,.23,M.graphite);ring(g,0,0,.123,r,M.safety);disc(g,0,0,.128,r*.84,M.graphite);
  for(let i=0;i<(world?Math.min(4,count):count);i++){const a=i*Math.PI*2/count,x=Math.sin(a)*r*.64,y=Math.cos(a)*r*.64;pipe(g,x,y,0,.032,.26,M.steel);disc(g,x,y,.135,.027,M.casing);ring(g,x,y,.14,.031,M.graphite)}
  if(has(feed,/recovery/)){const drive=dynamic(state,g,'recovery-loader-pawl','feed');drive.position.set(.17,-.015,-.05);flat(drive,0,0,0,.045,.12,.13,M.steel);spring(drive,0,0,-.10,.026,.18,world);flat(drive,.024,.015,.025,.012,.055,.085,M.safety);saveBase(state,drive)}
 }else if(gun===3){
  const count=large?8:small?1:3,height=large?.30:small?.115:.20;
  piece(g,[[.085,.045],[-.085,.045],[-.11,-height],[.07,-height-.015]],large?.145:.11,M.graphite);flat(g,-(large?.083:.063),-height/2,-.015,.018,height*.83,.12,M.safety);flat(g,0,-height-.018,-.015,large?.16:.13,.03,.16,M.steel);
  const rows=world?Math.min(3,count):count;for(let i=0;i<rows;i++)lamp(state,g,-(large?.095:.076),.005-i*(height-.04)/Math.max(1,rows-1),-.015,.008,.012,.076,'ammo',i);
  if(has(feed,/recuperator/)){line(g,new THREE.Vector3(.08,-.06,.045),new THREE.Vector3(.12,-.06,.14),.012,blue);line(g,new THREE.Vector3(.12,-.06,.14),new THREE.Vector3(.12,.045,.14),.012,blue);flat(g,.08,-.105,-.015,.022,.055,.13,M.steel)}
 }
 if(!hero.magazine&&gun===5){state.shotFeedRoot=g;g.position.set(0,0,0)}
}
function payloadHardware(state,hero,gun,ammo){
 if(!ammo)return;const g=group(state.root,'conversion-ammunition-'+ammo.id),text=label(ammo),explosive=/demolition|microblast|fragmentation|shaped pulse|breach charge/.test(text),arc=/arc/.test(text),penetrator=/penetrator|needle|through bolts|flechette/.test(text),fragment=/shattershot|duplex cartridge|flak/.test(text),slug=/slug/.test(text),frangible=/frangible/.test(text),air=/airburst/.test(text),skip=/skip/.test(text),color=explosive?orange:arc?blue:penetrator?M.steel:frangible?orange:M.safety;
 const leftX=gun===4?-.32:gun===1?-.16:-.145,z=gun===1?-.08:-.20,y=gun===4?-.035:-.025;
 block(g,leftX,y,z,.032,.075,.18,M.graphite,.004);flat(g,leftX-.02,y,z,.008,.047,.14,color);
 const count=state.world?1:fragment?3:penetrator?3:2;
 for(let i=0;i<count;i++){const round=group(g,'visible-special-cartridge-'+i);round.position.set(leftX-.023,y-.010-i*.026,z);pipe(round,0,0,0,.008,penetrator?.14:.09,M.casing);barrel(round,0,0,penetrator?-.105:-.07,.008,penetrator?.04:.025,color)}
 if(explosive){
  for(const muzzle of state.muzzles){collar(g,muzzle.x,muzzle.y,muzzle.z+.065,gun===4?.21:gun===5?.075:gun===1?.063:.052,color);if(!state.world)for(const side of [-1,1])flat(g,muzzle.x+side*(gun===4?.208:.056),muzzle.y-.012,muzzle.z+.076,.009,.025,.035,M.graphite)}
 }else if(arc){
  for(const side of [-1,1]){line(g,new THREE.Vector3(side*.105,-.04,-.25),new THREE.Vector3(side*.105,-.04,-.70),.009,blue);for(const zz of [-.32,-.58])flat(g,side*.105,-.04,zz,.03,.055,.06,M.graphite)}
 }else if(fragment&&gun===3){
  for(const muzzle of state.muzzles){ring(g,muzzle.x,muzzle.y,muzzle.z-.025,.093,M.safety);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;barrel(g,muzzle.x+Math.sin(a)*.052,muzzle.y+Math.cos(a)*.052,muzzle.z-.027,.016,.065,M.steel)}}
 }else if(slug){
  for(const muzzle of state.muzzles)collar(g,muzzle.x,muzzle.y,muzzle.z+.04,.071,M.steel);flat(g,.13,-.085,-.18,.025,.075,.15,M.safety);marks(g,.147,-.085,-.22,1,M.steel);
 }else if(air){
  for(const muzzle of state.muzzles){ring(g,muzzle.x,muzzle.y,muzzle.z+.045,.215,blue);for(const side of [-1,1]){flat(g,muzzle.x+side*.215,muzzle.y,muzzle.z+.04,.035,.065,.10,M.graphite);lamp(state,g,muzzle.x+side*.235,muzzle.y,muzzle.z+.025,.007,.025,.05,'sensor')}}
 }else if(skip){
  for(const muzzle of state.muzzles){ring(g,muzzle.x,muzzle.y,muzzle.z+.07,.23,M.rubber);ring(g,muzzle.x,muzzle.y,muzzle.z+.10,.228,M.safety)}
 }
 state.ammunitionKind=explosive?'explosive':arc?'arc':penetrator?'penetrator':fragment?'fragment':slug?'slug':frangible?'frangible':air?'airburst':skip?'skip':'standard';
}
function handlingHardware(state,hero,gun,handling){
 if(!handling)return;const g=group(state.root,'conversion-handling-'+handling.id),pistol=gun===1;
 if(has(handling,/entry/)){
  const x=pistol?-.155:-.14;block(g,x,-.07,.03,.03,.07,.11,M.safety,.004);flat(g,x-.02,-.07,.045,.014,.038,.09,M.steel);if(!pistol){const rest=group(g,'entry-folding-stock');line(rest,new THREE.Vector3(-.07,-.09,.19),new THREE.Vector3(-.07,-.12,.44),.016,M.steel);flat(rest,0,-.10,.44,.15,.045,.035,M.rubber)}
 }else if(has(handling,/anchor/)){
  const brace=dynamic(state,g,'anchor-deploying-brace','anchor');brace.position.set(0,pistol?-.14:-.12,pistol?-.28:-.47);
  for(const side of [-1,1]){line(brace,new THREE.Vector3(side*.08,0,0),new THREE.Vector3(side*.13,-.17,.06),.014,M.steel);flat(brace,side*.13,-.17,.06,.065,.025,.09,M.rubber)}flat(brace,0,0,0,.18,.04,.10,M.graphite);saveBase(state,brace);
 }else if(has(handling,/service sling/)){
  const x=pistol?-.16:gun===4?-.33:-.17,front=pistol?-.24:-.38,rear=pistol?.13:.34;
  piece(g,[[front,-.12],[front+.05,-.28],[rear-.04,-.37],[rear,-.13],[rear-.024,-.12],[rear-.061,-.34],[front+.075,-.25],[front+.023,-.11]],.022,M.rubber,x);
  block(g,x,-.29,(front+rear)/2,.043,.055,.11,M.steel,.003);flat(g,x-.025,-.29,(front+rear)/2,.008,.025,.075,M.safety);
  if(!state.world){ring(g,x,-.13,front,.028,M.steel).rotation.y=Math.PI/2;ring(g,x,-.13,rear,.028,M.steel).rotation.y=Math.PI/2}
 }
}

export function applyAttachmentModels(hero,gun,attachments=[],{world=false}={}){
 if(!hero)return null;const bare=hero.isObject3D,object=bare?{body:hero,parent:hero}:hero;
 const key=attachments.filter(a=>['action','ammunition','ammo','feed','handling'].includes(a.slot)).map(a=>a.id||a.name).sort().join('|');
 if(object.conversionModels?.key===key)return object.conversionModels;
 if(object.conversionModels)disposeAttachmentModels(object.conversionModels);
 const root=group(object.body||object.parent,'attachment-conversions'),state={root,roots:[root],hidden:[],moving:[],lamps:[],world,key,gun,hero:object,y:object.muzzleY??DEFAULT_Y[gun],x:object.muzzleX||0,z:object.muzzleZ??DEFAULT_MUZZLE[gun],originalMuzzle:{x:object.muzzleX,y:object.muzzleY,z:object.muzzleZ},lastShotAge:10,shotIndex:0,lastAmmo:0,insertAt:-10,feedCycle:0,previousReloading:false};
 if(bare&&world){root.scale.setScalar(.72);state.worldScale=.72}else state.worldScale=1;
 state.muzzles=[new THREE.Vector3(state.x,state.y,state.z)];
 const action=fit(attachments,'action'),ammo=fit(attachments,'ammunition'),feed=fit(attachments,'feed'),handling=fit(attachments,'handling');
 actionHardware(state,object,gun,action);magazine(state,object,gun,feed);if(gun===5&&feed?.key==='gate'&&!world){const shell=group(state.root,'single-shell-insertion');shell.userData.conversionDynamic=true;pipe(shell,0,0,0,.026,.07,M.casing).rotation.set(Math.PI/2,0,Math.PI/2);ring(shell,.035,0,0,.027,M.steel).rotation.y=Math.PI/2;shell.visible=false;state.singleShell=shell;}payloadHardware(state,object,gun,ammo);handlingHardware(state,object,gun,handling);
 if(gun===1&&!bare){for(const value of Object.values(object))if(value?.isMesh)value.userData.conversionDynamic=true;merged(object.body);}
 for(const node of state.roots){if(bare&&world&&node!==root)node.scale.setScalar(.72);merged(node);node.traverse(m=>{m.layers.mask=(object.body||object.parent).layers.mask;if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}
 state.muzzleOffsets=state.muzzles.map(p=>p.clone().multiplyScalar(state.worldScale));if(!bare){object.muzzleX=state.muzzles[0].x;object.muzzleY=state.muzzles[0].y;object.muzzleZ=state.muzzles[0].z;}object.conversionModels=state;
 animateAttachmentModels(state,{});return state;
}
export function animateAttachmentModels(state,{shotAge=10,reloading=false,reload=0,charge=0,heat=0,ammo=0,time=0,anchor=0,feedPhase}={}){
 if(!state||state.disposed)return;const kick=Math.max(0,1-shotAge/.12),cycle=Math.sin(clamp(shotAge/.09,0,1)*Math.PI),load=clamp(reload,0,1),q=clamp(charge,0,1);
 if(reloading&&!state.previousReloading)state.reloadStarted=time;
 if(state.singleShell){const inserted=state.insertAt>=(state.reloadStarted??Infinity),period=inserted?.22:.35,phase=clamp((time-(inserted?state.insertAt:state.reloadStarted??time))/period,0,1);state.singleShell.visible=reloading;state.singleShell.position.set(.19*(1-phase),-.15-.04*Math.sin(phase*Math.PI),-.18-.09*phase);}
 if(shotAge<state.lastShotAge-.001)state.shotIndex++;if(ammo>state.lastAmmo)state.insertAt=time;if(state.previousReloading&&!reloading&&state.lastReload>.9)state.feedCycle++;state.previousReloading=reloading;state.lastReload=load;state.lastAmmo=ammo;state.lastShotAge=shotAge;
 for(const moving of state.moving){const {node,kind,position,rotation}=moving;node.position.copy(position);node.rotation.copy(rotation);
  if(kind==='drive')node.position.z+=kick*.035;
  if(kind==='cam')node.rotation.x+=kick*.20;
  if(kind==='rotor')node.rotation.z+=(state.shotIndex-cycle*.5)*Math.PI*2/3;
  if(kind==='rails')node.position.z+=kick*.035;
  if(kind==='charge')node.position.z+=q*.012;
  if(kind==='slam'){node.position.z+=Math.sin(clamp(shotAge/.25,0,1)*Math.PI)*(.075+clamp(heat,0,1)*.035);node.rotation.x-=clamp(heat,0,1)*.012;}
  if(kind==='feed'){node.rotation.x+=(reloading?Math.sin(load*Math.PI*6)*.4:Math.max(0,1-(time-state.insertAt)/.2)*.25);node.position.z+=reloading?Math.sin(load*Math.PI)*.02:0;}
  if(kind==='shell'){node.rotation.z-=reloading?Math.sin(load*Math.PI)*.6:0;}
  if(kind==='anchor'){const unfold=clamp(anchor,0,1);node.rotation.x-=unfold*.40;node.position.y-=unfold*.035;}
 }
 for(const light of state.lamps){const {mesh,kind,index,scale}=light;mesh.scale.copy(scale);mesh.visible=kind==='ammo'?ammo>index:true;
  if(kind==='charge'){mesh.visible=q>.02&&q>index*.22;mesh.scale.z=scale.z*(.35+.65*q);}
  if(kind==='rail')mesh.scale.y=scale.y*(.5+q*.5+kick*.8);
  if(kind==='sensor')mesh.visible=Math.sin(time*3+index)>.1;
 }
 if(state.feedRoot&&/coupled/.test(state.feedName)){const phase=feedPhase??state.feedCycle;state.feedRoot.rotation.z=(phase%2?-.06:.06);state.feedRoot.position.x=(phase%2?-.045:.045);}
 if(state.slamHousing)state.slamHousing.scale.y=.045*(1+clamp(heat,0,1)*.35);
}
export function disposeAttachmentModels(state){
 if(!state||state.disposed)return;state.disposed=true;
 for(const root of state.roots){root.traverse(mesh=>{if(mesh.geometry?.userData.weaponOwned)mesh.geometry.dispose()});root.removeFromParent()}
 for(const [node,visible]of state.hidden)node.visible=visible;
 for(const [key,value]of Object.entries(state.originalMuzzle)){const property='muzzle'+key.toUpperCase();if(value===undefined)delete state.hero[property];else state.hero[property]=value;}
 if(state.hero.conversionModels===state)delete state.hero.conversionModels;
}
