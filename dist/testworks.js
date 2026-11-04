import * as THREE from './vendor/three.module.js';

// One working facility, five material districts. All combat solids come directly
// from map.solids; equipment skins stay inside their original cover envelopes.
export const TESTWORKS_AREAS=[
 {id:'fabrication',name:'FABRICATION',number:'01',color:0xb99a55,floor:0x858980},
 {id:'process',name:'PROCESS HALL',number:'02',color:0x82938d,floor:0xb1b5aa},
 {id:'pumps',name:'PUMP SERVICE',number:'03',color:0x578b88,floor:0x929f98},
 {id:'electrical',name:'ELECTRICAL',number:'04',color:0xa7b6ba,floor:0xa1a9a5},
 {id:'dispatch',name:'DISPATCH',number:'05',color:0xb99a69,floor:0xaa9f89}
];
export const TESTWORKS_VIEWS=[
 {id:'fabrication',label:'01 / Fabrication',position:[-30,1.7,12],target:[-25,3,-5]},
 {id:'process',label:'02 / Process hall',position:[-8,1.7,12],target:[-3,4,-3]},
 {id:'pumps',label:'03 / Pump service',position:[33,1.7,10],target:[24,3,-10]},
 {id:'electrical',label:'04 / Electrical',position:[31,9.7,-29],target:[9,5,-27]},
 {id:'dispatch',label:'05 / Dispatch',position:[6,1.7,30],target:[-12,2,25]},
 {id:'gantry',label:'06 / Gantry crossing',position:[0,5.7,2],target:[24,3,-5]},
 {id:'underpass',label:'07 / Lower service',position:[-30,1.7,-29],target:[-12,2,-28]},
 {id:'sky',label:'08 / Skylight and sky',position:[5,5.7,4],target:[0,24,0]}
];
export function testworksArea(x,z){return TESTWORKS_AREAS[z< -21?3:z>18?4:x< -13?0:x>14?2:1];}
let shared;
function resources(){
 if(shared)return shared;
 // Subtle, tileable mineral grain. World-sized UVs keep aggregate consistent
 // across a 1m plinth and a 70m wall; no stretching or screen-space noise.
 let seed=47;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,v=Math.round(242+(rnd()-.5)*12+Math.sin(x*.14)*1.2+Math.sin(y*.08)*1.1);data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}
 const grain=new THREE.DataTexture(data,size,size);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.magFilter=THREE.LinearFilter;grain.minFilter=THREE.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
 const materials=new Map(),get=(name,color,roughness=.82,metalness=0,texture=false)=>{if(!materials.has(name))materials.set(name,new THREE.MeshStandardMaterial({name:'testworks-'+name,color,roughness,metalness,map:texture?grain:null}));return materials.get(name);};
 const m={concrete:get('precast',0xc5c5b8,.94,0,true),light:get('limestone',0xd0cfc2,.92,0,true),base:get('base',0x7b8580,.95,0,true),steel:get('graphite',0x59665e,.78,.2),edge:get('galvanized',0x9fa9a3,.53,.58),ochre:get('ochre-enamel',0xbba062,.68,.18),teal:get('teal-enamel',0x638e89,.64,.2),pale:get('electrical-enamel',0xb9c5bf,.68,.16),black:get('recess',0x283633,.87,.1),seam:get('joint',0x909b90,.93),paint:get('safety-paint',0xcebc83,.85),white:get('stencil',0xe0dfce,.87),rust:get('oxidized-base',0x84745a,.97),pipe:get('pipe',0x899d97,.55,.5),rubber:get('gasket',0x3d4944,.97),glass:get('instrument-glass',0x607977,.4,.25)};
 m.lamp=get('worklight',0xe4e7d1,.5,.1);m.lamp.emissive.setHex(0xe7e7c8);m.lamp.emissiveIntensity=1.2;
 m.floor=Object.fromEntries(TESTWORKS_AREAS.map(a=>{const coated=a.id==='pumps'||a.id==='electrical';return[a.id,get('floor-'+a.id,a.floor,coated?.62:.93,coated?.06:0,!coated)];}));
 shared={m,grain};return shared;
}
export function buildTestworks(arena,map,blocks,worldMeshes){
 const {m}=resources(),batches=new Map(),unit=new THREE.BoxGeometry(1,1,1),labels=[],landmarks=[];
 const emit=(geometry,material,shadow=false)=>{const key=material.name+':'+shadow;if(!batches.has(key))batches.set(key,{material,shadow,geometries:[]});batches.get(key).geometries.push(geometry);};
 function box(x,y,z,w,h,d,material=m.concrete,yaw=0,solid=false,id=''){
  const g=solid&&h>.6&&w>.5&&d>.5?beveledBox(w,h,d,.035):unit.clone().scale(w,h,d);g.rotateY(yaw);g.translate(x,y,z);worldUV(g);emit(g,material,solid);
  if(solid){const mesh=new THREE.Mesh(unit,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.rotation.y=yaw;mesh.updateMatrixWorld(true);mesh.visible=false;mesh.name=id;arena.add(mesh);worldMeshes.push(mesh);blocks.push({x,z,w,d,bottom:y-h/2,top:y+h/2,yaw,id});}
 }
 function cylinder(x,y,z,r,length,material=m.pipe,axis='y',segments=16,solid=false,id=''){
  const g=new THREE.CylinderGeometry(r,r,length,segments,1);if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='z')g.rotateX(Math.PI/2);g.translate(x,y,z);worldUV(g);
  if(solid){const mesh=new THREE.Mesh(g.clone(),material);mesh.visible=false;mesh.name=id;arena.add(mesh);worldMeshes.push(mesh);blocks.push({x,z,w:axis==='x'?length:r*2,d:axis==='z'?length:r*2,bottom:y-(axis==='y'?length/2:r),top:y+(axis==='y'?length/2:r),id,yaw:0});}
  emit(g,material,solid);
 }
 function ring(x,y,z,r,t,material=m.edge,axis='z'){const g=new THREE.TorusGeometry(r,t,4,20);if(axis==='y')g.rotateX(Math.PI/2);if(axis==='x')g.rotateY(Math.PI/2);g.translate(x,y,z);emit(g,material);}
 function plaque(text,x,y,z,w,h,yaw=0,{bg='#48564f',fg='#e4e3d3',sub='',number=''}={}){
  labels.push({text,x,y,z,w,h,yaw});if(typeof document==='undefined')return;
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(!ctx?.fillRect)return;ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;
  if(number){ctx.font='700 164px Arial';ctx.fillText(number,32,184);ctx.fillRect(244,36,3,184);}
  const left=number?282:32;ctx.font='700 '+(sub?'76':'108')+'px Arial';ctx.textBaseline='middle';ctx.fillText(text,left,sub?101:134,1024-left-28);
  if(sub){ctx.font='28px Arial';ctx.fillStyle=fg;ctx.fillText(sub,left,187,1024-left-28);}
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;const material=new THREE.MeshStandardMaterial({map:tx,roughness:.86,polygonOffset:true,polygonOffsetFactor:-2});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.name='testworks-sign-'+text;arena.add(mesh);
 }
 // Per-face local detail stays a few millimetres in front of an existing surface.
 function onFace(b,side,u,y,w,h,material,depth=.018,inset=0){const layer=material===m.edge?5:material===m.seam?6:material===m.paint?7:material===m.black?3:material===m.steel?4:1,offset=.008+layer*.012-inset,c=Math.cos(b.yaw||0),s=Math.sin(b.yaw||0),lx=side==='e'?b.w/2+offset:side==='w'?-b.w/2-offset:u,lz=side==='n'?-b.d/2-offset:side==='s'?b.d/2+offset:u;box(b.x+c*lx+s*lz,y,b.z-s*lx+c*lz,side==='e'||side==='w'?depth:w,h,side==='e'||side==='w'?w:depth,material,b.yaw||0);}
 const ground=new THREE.Mesh(new THREE.BoxGeometry(map.floor.w,1,map.floor.d),m.base);ground.position.y=-.5;ground.visible=false;ground.updateMatrixWorld(true);worldMeshes.push(ground);arena.add(ground);box(0,-.5,0,map.floor.w,1,map.floor.d,m.base);
 // Continuous, quiet floor districts; broad threshold joints mark transitions.
 for(const [x,z,w,d,id]of[[-25.7,-1.5,24.9,38.8,'fabrication'],[.5,-1.5,25.8,38.8,'process'],[26.45,-1.5,24.1,38.8,'pumps'],[0,-27.5,76.5,12.9,'electrical'],[0,26.3,76.5,16.5,'dispatch']]){
  box(x,.002,z,w,.004,d,m.floor[id]);
  // Four-metre cast bays, close in value to the slab; no arena-wide line grid.
  for(let xx=x-w/2+5;xx<x+w/2-.5;xx+=6)box(xx,.006,z,.03,.003,d,m.seam);
  for(let zz=z-d/2+6;zz<z+d/2-.5;zz+=7)box(x,.006,zz,w,.003,.03,m.seam);
 }
 for(const b of map.solids){const a=testworksArea(b.x,b.z),base=b.y-b.h/2,top=b.y+b.h/2,perimeter=['north','south','east','west'].includes(b.id)||b.id.startsWith('corner-'),machine=b.id.startsWith('press-machine'),equipment=['range-test-block','core-test-column','assembly-center-block'].includes(b.id);
  let material=b.style==='deck'?m.edge:b.style==='stair'?m.base:b.style==='ink'?m.steel:m.concrete;
  if(perimeter)material=m.light;
  if(machine)material=m.ochre;if(b.id==='range-test-block')material=m.teal;if(b.id==='core-test-column')material=m.concrete;
  if(b.id.startsWith('assembly-')&&!b.id.includes('door'))material=b.style==='ink'?m.base:m.concrete;
  if(b.id.startsWith('control-')&&b.style!=='deck'&&b.style!=='stair')material=m.pale;
  box(b.x,b.y,b.z,b.w,b.h,b.d,material,b.yaw||0,true,b.id);
  if(b.style==='stair'){box(b.x,top+.007,b.z,b.w,.012,.065,m.edge,b.yaw||0);continue;}
  if(b.style==='deck'){
   box(b.x,base-.008,b.z,b.w-.03,.014,b.d-.03,m.pale);box(b.x,base+.07,b.z,b.w,.14,b.d,m.steel);box(b.x,top+.006,b.z,b.w-.05,.01,b.d-.05,m.floor[a.id]);
   for(const side of [-1,1]){box(b.x,top+.013,b.z+side*(b.d/2-.075),b.w,.012,.075,m.paint);box(b.x,base+.12,b.z+side*(b.d/2-.06),b.w,.09,.045,m.edge);}
   // Underdeck ribs fit wholly inside the original slab.
   if(b.w>8)for(let x=b.x-b.w/2+2;x<b.x+b.w/2;x+=4)box(x,base+.1,b.z,.13,.19,b.d-.08,m.black);
   continue;
  }
  if(base<=.1&&b.h>1.5){box(b.x,base+.16,b.z,b.w+.012,.32,b.d+.012,m.base,b.yaw||0);}
  // Smooth architectural panels: broad joints and one raised concrete cap.
  if(!machine&&!equipment&&b.h>4&&b.style!=='ink'){
   const side=b.w>=b.d?'s':'e',width=Math.max(b.w,b.d);
   for(let u=-width/2+3;u<width/2-.8;u+=4.5)onFace(b,side,u,b.y,.018,b.h-.5,m.seam);
   onFace(b,side,0,top-.18,width,.10,m.light);
   if(width>3)for(let yy=base+3;yy<top-.6;yy+=3)onFace(b,side,0,yy,width-.15,.035,m.seam);
   if(width>5)for(let u=-width/2+1.2;u<width/2-.6;u+=4.5)for(const yy of [base+.8,Math.min(top-.9,base+4.5)])onFace(b,side,u,yy,.07,.07,m.base,.012);

  }
  if(machine)press(b);
  if(b.id==='core-test-column')tower(b);
  if(b.id==='core-east-screen')for(const side of ['e','w']){onFace(b,side,0,1.0,b.d-.1,.55,m.pipe);onFace(b,side,0,top-.12,b.d-.08,.11,m.edge);onFace(b,side,0,b.y,.022,b.h-.5,m.seam);}

  if(b.id==='range-test-block')pump(b);
  if(b.id==='assembly-center-block')cabinet(b,'TRANSFER / 05',m.ochre);
  if(b.id==='assembly-west-baffle'||b.id==='assembly-east-baffle')for(const side of ['e','w']){onFace(b,side,0,top-.22,b.d-.08,.22,m.edge);onFace(b,side,0,1.45,b.d-.15,.14,m.ochre);for(let u=-b.d/2+2;u<b.d/2-.6;u+=3)onFace(b,side,u,b.y,.025,b.h-.4,m.seam);}

  if(b.id==='control-west-baffle'||b.id==='control-floor-baffle'||b.id==='control-upper-blind')cabinet(b,'LV / 04',m.pale);
 }
 function cabinet(b,text,material){
  for(const side of ['e','w','n','s']){const width=side==='e'||side==='w'?b.d:b.w;
   onFace(b,side,0,b.y,Math.max(.3,width-.25),b.h-.35,material);
   for(let u=-width/2+1.4;u<width/2-.3;u+=1.4){onFace(b,side,u,b.y,.018,b.h-.5,m.seam);onFace(b,side,u-.18,b.y,.06,.35,m.edge);}
   if(b.h>2){onFace(b,side,0,b.y+b.h*.23,Math.min(width-.4,.9),.25,m.steel);onFace(b,side,0,b.y+b.h*.23,Math.min(width-.6,.65),.10,m.glass,.02,-.06);for(let yy=b.y-b.h*.3;yy<b.y-b.h*.1;yy+=.18)onFace(b,side,0,yy,width-.45,.025,m.seam);}
  }
 }
 function press(b){
  landmarks.push({id:b.id,area:'fabrication',bounds:[b.x,b.z,b.w,b.d]});
  for(const side of ['n','s']){
   // Closed guarding retains the actual solid cover. Dark inset is shallow.
   onFace(b,side,0,b.h*.5,b.w-.34,b.h-.5,m.ochre);
   onFace(b,side,0,b.h*.42,b.w-.85,b.h*.41,m.black);
   onFace(b,side,0,b.h*.42,b.w-1.08,b.h*.36,m.steel,.022,-.03);
   onFace(b,side,0,b.h*.35,b.w-1.25,.28,m.edge,.035,-.06);
   onFace(b,side,0,b.h*.55,.36,b.h*.22,m.edge,.035,-.06);
   for(const u of [-b.w*.36,b.w*.36])onFace(b,side,u,b.h*.5,.19,b.h-.3,m.edge);
   onFace(b,side,0,b.h*.76,b.w-.4,.45,m.black);
   onFace(b,side,0,.48,b.w-.25,.16,m.paint);
  }
  for(const side of ['e','w']){onFace(b,side,0,b.h*.49,b.d-.34,b.h-.45,m.ochre);onFace(b,side,0,b.h*.48,b.d-1,b.h*.64,m.steel);for(const u of [-b.d*.31,b.d*.31])onFace(b,side,u,b.h*.48,.055,b.h*.58,m.edge);onFace(b,side,0,b.h*.75,b.d-.7,.035,m.seam);onFace(b,side,0,b.h*.3,b.d-.7,.035,m.seam);}
  box(b.x,b.h-.18,b.z,b.w-.05,.32,b.d-.05,m.steel);
  for(const side of [-1,1]){cylinder(b.x+side*(b.w/2-.27),b.h-.75,b.z,.12,1.1,m.edge);box(b.x+side*(b.w/2-.24),b.h*.54,b.z,.28,b.h*.66,b.d-.08,m.steel);}
  plaque(b.id.endsWith('a')?'PRESS / P1':'PRESS / P2',b.x,b.h*.76,b.z+b.d/2+.095,2.9,.36,0,{bg:'#37423d',fg:'#e0d4ad'});
 }
 function tower(b){
  landmarks.push({id:'process-tower',area:'process',bounds:[b.x,b.z,b.w,b.d]});
  for(const side of ['n','s','e','w']){
   onFace(b,side,0,2.45,3.65,4.1,m.pipe);
   for(const u of [-1.65,1.65])onFace(b,side,u,4.9,.1,9.7,m.steel);
   onFace(b,side,0,6.2,3.8,.5,m.steel);onFace(b,side,0,9.55,3.8,.45,m.steel);
   for(let y=6.9;y<9.3;y+=.7)onFace(b,side,0,y,3.3,.035,m.seam);
  }
  // Four enclosed instrument faces suggest a process vessel inside its shell.
  for(const side of [-1,1]){ring(b.x,2.4,b.z+side*2.025,.58,.065,m.edge);cylinder(b.x,2.4,b.z+side*2.018,.49,.018,m.glass,'z',24);}
  plaque('PROCESS',b.x,7.5,b.z+2.10,3.2,1.0,0,{bg:'#acb5a9',fg:'#3a4d47',sub:'PW / TRANSFER VESSEL',number:'02'});
 }
 function pump(b){
  landmarks.push({id:'pump-skid',area:'pumps',bounds:[b.x,b.z,b.w,b.d]});
  for(const side of ['e','w']){
   onFace(b,side,0,1.65,b.d-.35,2.45,m.teal);
   for(let u=-b.d/2+.8;u<b.d/2;u+=1.6){onFace(b,side,u,1.65,.018,2.1,m.seam);onFace(b,side,u-.2,1.75,.07,.33,m.edge);}
   for(let y=.6;y<1.05;y+=.13)onFace(b,side,0,y,b.d-.9,.025,m.black);
  }
  // A fully enclosed acoustic skid: all readable casing stays below its 3.1m cover top.
  for(const side of [-1,1]){onFace(b,side<0?'n':'s',0,1.55,3.55,2.55,m.teal);ring(b.x,1.7,b.z+side*(b.d/2+.024),.72,.085,m.edge);cylinder(b.x,1.7,b.z+side*(b.d/2+.02),.61,.02,m.glass,'z',24);}
  plaque('PUMP / 03',b.x,2.75,b.z+4.10,3,.35,0,{bg:'#446e69'});
 }
 // Large architectural treatments on the perimeter. Equipment belongs to walls;
 // lanes stay free of freestanding props and false cover.
 // West: warm precast bays and embedded workshop columns.
 for(const z of [-26,-14,-2,10,26]){box(-38.005,5.6,z,.012,10.2,.24,m.base);box(-37.995,8.8,z+3,.015,2.8,5.5,m.ochre);}
 plaque('FABRICATION',-37.98,6.7,-4,11,2.0,Math.PI/2,{bg:'#b9a16b',fg:'#303e37',sub:'PUBLIC WORKS / MACHINE SHOP',number:'01'});
 // East: teal process wall, paired header bands and large, quiet equipment doors.
 for(const z of [-27,-13,1,15,28]){box(38.005,4.7,z,.015,5.2,7,m.teal);for(const zz of [-2.9,2.9])box(37.99,4.7,z+zz,.02,5.0,.035,m.seam);box(37.98,2.5,z,.02,.035,6.3,m.pipe);}
 plaque('PUMP SERVICE',37.975,7.9,-4,11,1.9,-Math.PI/2,{bg:'#557e79',sub:'CLOSED CIRCUIT / SERVICE ACCESS',number:'03'});
 // North: a continuous pale electrical service wall with broad cabinet modules.
 for(let x=-34;x<=34;x+=6){box(x,2.6,-33.955,5.5,.16,.04,m.steel);box(x,5.2,-33.995,5.7,8.5,.012,m.pale);box(x+2.7,5.2,-33.98,.025,8.3,.025,m.seam);box(x+1.8,3,-33.97,.06,.42,.03,m.steel);box(x,1.1,-33.975,5.4,.2,.02,m.steel);}
 plaque('ELECTRICAL',25,11,-33.97,16,1.9,0,{bg:'#aebcb7',fg:'#354b45',sub:'SWITCHGEAR / UPPER SERVICE',number:'04'});
 // South: unmistakable loading doors. Broad slats, not fine corrugation.
 for(const [x,n]of[[-25,'A'],[0,'B'],[25,'C']]){
  box(x,4.9,33.985,11,8.6,.014,m.ochre);box(x,9.25,33.97,11.4,.2,.04,m.steel);
  for(let y=1.1;y<9;y+=.85)box(x,y,33.968,10.8,.035,.025,m.rust);
  for(const side of [-1,1])box(x+side*5.5,4.8,33.965,.13,8.8,.03,m.steel);
  plaque('BAY '+n,x,7.4,33.94,6,1.25,Math.PI,{bg:'#b99c63',fg:'#354039'});
  box(x,0.012,31,10,.014,.14,m.paint);
 }
 plaque('DISPATCH',0,10.05,33.96,11,1.0,Math.PI,{bg:'#4b5549',sub:''});
 // Partial roof bays and open skylight slots make the arena a real facility.
 // Bottoms are >12m: the highest legal transfer apex is below 11m.
 for(const [x,z,w,d]of[[-34,-1.5,8,39],[-18,-1.5,8,39],[18,-1.5,8,39],[34,-1.5,8,39],[0,-28,77,12],[0,27,77,14]]){
  box(x,13.4,z,w,.25,d,m.pale,0,true,'industrial-canopy');
  for(const edge of [-1,1])box(x+edge*(w/2-.07),13.18,z,.14,.25,d,m.steel);
 }
 for(const x of [-26,26])for(const z of [-19,-9,2,13]){
  box(x,12.88,z,24,.24,.28,m.steel,0,true,'roof-beam');
  for(const u of [-9,-3,3,9]){box(x+u,13.08,z,.13,.45,.17,m.edge);}
  box(x,12.74,z,13,.045,.23,m.lamp);
 }
 for(const z of [-19,-9,2,13])box(-38.15,12.14,z,.3,2.3,.3,m.steel,0,true,'west-roof-stanchion');
 for(const x of [-30,-15,0,15,30])box(x,12.14,34.15,.3,2.3,.3,m.steel,0,true,'dispatch-roof-stanchion');
 box(0,13.2,-34.15,77,.45,.3,m.steel,0,true,'electrical-roof-plate');
 // Teal service headers run above the pump bay, feeding a clearly closed skid.
 for(const x of [20.5,22]){cylinder(x,10.8,-1,.18,34,m.teal,'z',16,true,'pump-header');for(const z of [-16,-8,0,8,15])ring(x,10.8,z,.2,.045,m.edge,'z');}
 // Each pipe has its own exact cylindrical shot volume; the air gap stays open.
 for(const z of [-16,-4,8,15])box(21.25,11.98,z,.055,2.6,.08,m.edge,0,true,'header-hanger');
 // A narrow tray and hangers visibly tie the headers into the roof structure.
 box(21.25,10.6,-1,1.9,.1,34,m.steel,0,true,'header-tray');
 // Existing overhead fixture volumes retain their collision and shot occlusion.
 for(const z of [-14,-2,10]){box(0,13.23,z,29,.22,.32,m.steel,0,true,'process-roof-tie');box(3,11.7,z,15,.22,1.05,m.steel,0,true,'core-worklight');box(3,11.55,z,13.8,.055,.68,m.lamp,0,true,'core-worklight-lens');for(const x of [-3.5,9.5])box(x,12.5,z,.065,1.5,.065,m.edge);}
 // Recessed architectural headers: all inside the existing lintel envelopes.
 for(const b of map.solids.filter(b=>b.id.includes('door'))){const side=b.w>b.d?'s':'e',w=Math.max(b.w,b.d);onFace(b,side,0,b.y,w-.15,Math.min(.55,b.h-.1),b.id.startsWith('assembly')?m.ochre:b.id.startsWith('range')?m.teal:b.id.startsWith('press')?m.ochre:m.pale);}
 // Sparse markings at transitions, with no diagonal hazard fields behind actors.
 for(const [x,z,w,d]of[[-26,17.7,10,.12],[0,17.7,10,.12],[26,17.7,10,.12],[-27,-21,9,.12],[-1,-21,12,.12],[24,-21,12,.12]])box(x,.013,z,w,.012,d,m.paint);
 // Two broad ceiling fills replace the test-lab colored washes.
 for(const [x,z,color,intensity,distance]of[[-23,-2,0xeee5d5,65,38],[26,-8,0xdce8df,65,38]]){const light=new THREE.PointLight(color,intensity,distance,2);light.position.set(x,9,z);arena.add(light);}
 for(const {material,shadow,geometries}of batches.values()){const merged=mergeGeometries(geometries,false);for(const g of geometries)g.dispose();const mesh=new THREE.Mesh(merged,material);mesh.name=material.name;mesh.castShadow=shadow&&material!==m.lamp;mesh.receiveShadow=true;if(!shadow&&[m.seam,m.edge,m.paint,m.white,m.rust,m.black,m.glass].includes(material))mesh.layers.set(2);arena.add(mesh);}
 // unit is retained by precise invisible collision meshes, which raycast even
 // though they do not render. Batching never changes projectile geometry.
 arena.userData.testworks={labels,landmarks,areas:TESTWORKS_AREAS,materialCount:batches.size};
}
function worldUV(g){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(ny>.5?x:nx>.5?z:x)*.45,(ny>.5?z:y)*.45);}return g;}

function mergeGeometries(geometries){
 const arrays={position:[],normal:[],uv:[]};
 for(const source of geometries){const g=source.index?source.toNonIndexed():source;for(const name of Object.keys(arrays))arrays[name].push(g.attributes[name].array);if(g!==source)g.dispose();}
 const result=new THREE.BufferGeometry();for(const [name,parts]of Object.entries(arrays)){const data=new Float32Array(parts.reduce((sum,p)=>sum+p.length,0));let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}result.setAttribute(name,new THREE.BufferAttribute(data,name==='uv'?2:3));}result.computeBoundingSphere();return result;
}

let skyTexture;
function industrialSky(){
 if(skyTexture)return skyTexture;
 // Compose in broad values that remain distinct after the limited palette.
 const w=1024,h=512,data=new Uint8Array(w*h*4),top=new THREE.Color(0x345663),horizon=new THREE.Color(0xbfb58c),cloud=new THREE.Color(0xc9cbb2),shade=new THREE.Color(0x6d8c89),warm=new THREE.Color(0xd4b778),c=new THREE.Color();
 const banks=[[.08,.67,.14,.055],[.19,.70,.16,.064],[.33,.68,.13,.043],[.51,.61,.19,.042],[.65,.64,.16,.050],[.82,.77,.13,.065],[.94,.74,.15,.052]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/(h-1),angle=u*Math.PI*2,t=THREE.MathUtils.smoothstep(v,.49,.80);c.copy(horizon).lerp(top,t);
  const glow=Math.exp(-(((v-.52)/.075)**2))*(.5+.5*Math.cos(angle-1.1))**6;c.lerp(warm,glow*.28);
  let field=0,lit=0;
  for(const [cx,cy,rx,ry]of banks){
   let dx=Math.abs(u-cx);dx=Math.min(dx,1-dx);
   const warp=Math.sin(angle*11+cy*8)*.0035+Math.cos(angle*19)*.002;
   const dy=(v-cy+warp)/ry,r=Math.sqrt((dx/rx)**2+dy*dy),density=1-THREE.MathUtils.smoothstep(r,.58,1.);
   if(density>field){field=density;lit=THREE.MathUtils.smoothstep(dy,-.55,.6);}
  }
  // Layered bases and lit caps, rather than tiny noise or a single empty wash.
  if(field>.12){const coverage=THREE.MathUtils.smoothstep(field,.12,.6);c.lerp(shade,coverage*.85);c.lerp(cloud,coverage*(.28+.64*lit));}
  c.convertLinearToSRGB();const i=(y*w+x)*4;data[i]=Math.round(c.r*255);data[i+1]=Math.round(c.g*255);data[i+2]=Math.round(c.b*255);data[i+3]=255;
 }
 skyTexture=new THREE.DataTexture(data,w,h);skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.mapping=THREE.EquirectangularReflectionMapping;skyTexture.magFilter=skyTexture.minFilter=THREE.LinearFilter;skyTexture.needsUpdate=true;return skyTexture;
}
export function setArenaAtmosphere(scene,map){
 const industrial=!!map.source||['testworks','reservoir','tidal-lock','parallax','foundry','rust','shipment','nuketown'].includes(map.id);scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=industrial?1.35:1;if(o.isDirectionalLight&&o.castShadow){o.shadow.bias=industrial?-.0003:-.003;o.shadow.normalBias=industrial?.02:.08;o.shadow.radius=industrial?2:1;}});
 scene.background=industrial?industrialSky():new THREE.Color(0x182127);if(scene.fog){scene.fog.color.setHex(industrial?0xc1cbbb:0x182127);scene.fog.near=industrial?62:38;scene.fog.far=industrial?155:120;}
}

// A 35mm chamfer catches light on cover edges without changing their gameplay
// bounds. Large quiet faces remain flat; no dense subdivision or normal maps.
function beveledBox(w,h,d,r){
 const half=[w/2,h/2,d/2],inner=half.map(v=>v-r),positions=[];
 function face(points){const a=new THREE.Vector3(...points[0]),b=new THREE.Vector3(...points[1]),c=new THREE.Vector3(...points[2]),normal=b.clone().sub(a).cross(c.clone().sub(a)),center=points.reduce((v,p)=>v.add(new THREE.Vector3(...p)),new THREE.Vector3());if(normal.dot(center)<0)points.reverse();for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);}
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const a=(axis+1)%3,b=(axis+2)%3;face([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const p=[0,0,0];p[axis]=sign*half[axis];p[a]=u*inner[a];p[b]=v*inner[b];return p;}));}
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const c=3-a-b;for(const sa of [-1,1])for(const sb of [-1,1]){const points=[];for(const [edge,sc]of[[0,-1],[1,-1],[1,1],[0,1]]){const p=[0,0,0];p[a]=sa*(edge?inner[a]:half[a]);p[b]=sb*(edge?half[b]:inner[b]);p[c]=sc*inner[c];points.push(p);}face(points);}}
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])face([0,1,2].map(axis=>[x*(axis===0?half[0]:inner[0]),y*(axis===1?half[1]:inner[1]),z*(axis===2?half[2]:inner[2])]));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(positions.length/3*2),2));return g;
}

// Shared material vocabulary for the other individually authored facilities.
export function industrialResources(){return resources();}
export function industrialChamferBox(w,h,d,r=.035){return beveledBox(w,h,d,r);}
