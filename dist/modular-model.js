import * as T from './vendor/three.module.js';
import {createHardware} from './armory/hardware.js';
export function createModularGun(kit){
 const hardware=createHardware(T),mats={},geos={},mergedGeometries=[];let barrelGroup,flash;const model=new T.Group();
 const material=(name,color,metalness=.05,roughness=.65)=>mats[name]??=(new T.MeshStandardMaterial({color,metalness,roughness,flatShading:false}));
 const M={blue:material('blue',0x3f72a2),cream:material('cream',0xe6d9b8),ink:material('ink',0x202b2b,.3,.5),steel:material('steel',0x8f9fb5,.65,.35),coral:material('coral',0xe87844),lime:material('lime',0xd5da9c),pink:material('pink',0xb4a0d9),cyan:material('cyan',0x7fafbf),gold:material('gold',0xdabb76)};
 const rankMat=r=>[M.cream,M.cyan,M.pink,M.gold][r];
 const geo=(id,make)=>geos[id]??=make();
 function box(parent,x,y,z,w,h,d,mat,rz=0){
  const id=`box-${w}-${h}-${d}`;
  const geometry=geo(id,()=>{const c=Math.min(.018,w*.14,h*.14,d*.2),shape=new T.Shape(),a=w/2,b=h/2;shape.moveTo(-a+c,-b);shape.lineTo(a-c,-b);shape.lineTo(a,-b+c);shape.lineTo(a,b-c);shape.lineTo(a-c,b);shape.lineTo(-a+c,b);shape.lineTo(-a,b-c);shape.lineTo(-a,-b+c);shape.closePath();return new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:c*.3,bevelSize:c*.3,bevelSegments:1,steps:1}).translate(0,0,-d/2);});
  const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.rotation.z=rz;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function tube(parent,x,y,z,r,length,mat){const mesh=new T.Mesh(geo('tube-'+r+'-'+length,()=>new T.CylinderGeometry(r,r,length,16)),mat);mesh.rotation.z=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function ring(parent,x,y,z,r,thick,mat){const mesh=new T.Mesh(geo('ring-'+r+'-'+thick,()=>new T.TorusGeometry(r,thick,6,24)),mat);mesh.rotation.y=Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function plate(parent,points,depth,mat,name){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geometry=geo(name,()=>new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1}));const mesh=new T.Mesh(geometry,mat);mesh.position.z=-depth/2;parent.add(mesh);return mesh;}
 function batchGroup(group){
  group.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(group.matrixWorld).invert(),byMaterial=new Map(),originals=[];
  const visit=o=>{if(o!==group&&o.userData.rotor)return;if(o.isMesh){if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(o);originals.push(o);}for(const child of o.children)visit(child);};visit(group);
  for(const [material,meshes] of byMaterial){
   const pieces=meshes.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));return g;}),g=new T.BufferGeometry();
   for(const key of ['position','normal','uv']){const length=pieces.reduce((n,g)=>n+g.getAttribute(key).array.length,0),values=new Float32Array(length);let at=0;for(const piece of pieces){const a=piece.getAttribute(key).array;values.set(a,at);at+=a.length;}g.setAttribute(key,new T.BufferAttribute(values,key==='uv'?2:3));}
   g.computeBoundingSphere();pieces.forEach(g=>g.dispose());mergedGeometries.push(g);const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  originals.forEach(mesh=>mesh.removeFromParent());
 }

 const group=slot=>{const g=new T.Group();g.userData.slot=slot;model.add(g);return g;};
  const receiver=group('mechanism'),barrel=group('barrel'),ammo=group('ammo'),circuit=group('circuit');barrelGroup=barrel;
  const main=M.blue;
  plate(receiver,[[-.79,-.02],[-.9,.25],[-.57,.47],[.46,.40],[.66,.14],[.52,-.06]],.42,main,'receiver');
  plate(receiver,[[-.59,.45],[.40,.39],[.49,.29],[-.63,.34]],.46,M.cream,'top-cover');
  box(receiver,-.14,.15,.235,.72,.12,.035,M.ink);box(receiver,-.14,.15,.258,.52,.035,.02,M.cyan);
  plate(receiver,[[-.72,.15],[-1.28,.20],[-1.51,.05],[-1.51,-.16],[-1.16,-.13],[-.70,-.01]],.27,M.ink,'stock');
  box(receiver,-1.48,.01,0,.095,.39,.38,M.cream,-.07);box(receiver,-1.17,.07,0,.13,.13,.32,M.coral);
  plate(receiver,[[-.52,-.04],[-.24,-.04],[-.33,-.59],[-.54,-.51],[-.62,-.32]],.27,M.ink,'grip');
  box(receiver,-.46,-.30,.149,.12,.25,.015,M.cream,-.16);
  box(receiver,-.07,-.10,0,.40,.08,.18,M.ink);box(receiver,.14,-.22,0,.07,.24,.18,M.ink,-.14);box(receiver,-.01,-.31,0,.34,.055,.18,M.ink);
  for(const z of [-.25,.25])for(const x of [-.57,.36]){const bolt=tube(receiver,x,.27,z,.026,.025,M.steel);bolt.rotation.set(Math.PI/2,0,0);}
  if(kit.mechanism.id==='burst')for(let i=0;i<3;i++)box(receiver,-.36+i*.14,.46,0,.075,.055,.16,M.coral);
  if(kit.mechanism.id==='automatic')for(let i=0;i<5;i++)box(receiver,-.42+i*.14,.46,0,.035,.055,.18,M.ink);
  if(kit.mechanism.id==='semi')box(receiver,-.68,.43,0,.13,.16,.16,M.coral,.3);
  if(kit.mechanism.id==='charge'){const cell=tube(receiver,-.03,.40,0,.15,.52,M.ink);for(let i=0;i<4;i++)ring(receiver,-.25+i*.14,.40,0,.15,.02,M.lime);}
  const bm=rankMat(kit.barrel.rank);
  box(barrel,.59,.16,0,.19,.44,.46,M.ink);box(barrel,.64,.22,0,.16,.25,.50,bm);
  if(kit.barrel.id==='rails'){
   for(const z of [-.16,.16]){box(barrel,1.04,.18,z,.93,.095,.085,bm);box(barrel,1.05,.19,z,.85,.023,.10,M.cyan);for(let i=0;i<4;i++)box(barrel,.72+i*.18,.18,z,.05,.18,.14,M.ink);}
   box(barrel,.75,.17,0,.16,.18,.18,M.ink);
  }else if(kit.barrel.id==='gatling'){
   const rotor=new T.Group();rotor.position.y=.17;rotor.userData.rotor=true;barrel.add(rotor);barrelGroup=rotor;
   for(let i=0;i<6;i++){const a=i*Math.PI/3,y=Math.cos(a)*.13,z=Math.sin(a)*.13;tube(rotor,1.02,y,z,.045,.83,M.steel);ring(rotor,1.45,y,z,.047,.013,bm);tube(rotor,1.455,y,z,.032,.012,M.ink);}
   batchGroup(rotor);
   ring(barrel,.82,.17,0,.19,.04,M.ink);ring(barrel,1.22,.17,0,.19,.025,bm);
  }else{
   const offsets=kit.barrel.id==='double'?[-.12,.12]:[0],radius=kit.barrel.id==='huge'?.15:kit.barrel.id==='single'?.075:.065;
   for(const z of offsets){tube(barrel,1.02,.17,z,radius,.85,M.steel);tube(barrel,1.10,.17,z,radius*1.2,.40,M.ink);ring(barrel,1.47,.17,z,radius*1.17,.026,bm);tube(barrel,1.477,.17,z,radius*.85,.012,M.ink);}
   if(kit.barrel.id==='huge'){box(barrel,.86,.17,0,.22,.37,.42,bm);ring(barrel,1.34,.17,0,.19,.035,M.coral);}
   else{box(barrel,.86,.26,0,.36,.055,.39,bm);for(let i=0;i<3;i++)box(barrel,.75+i*.10,.296,.01,.045,.025,.29,M.ink);}
  }
  for(let i=0;i<4;i++)box(receiver,-.55+i*.085,.23,.258,.038,.065,.018,M.ink,-.08);
  box(receiver,.36,.13,.238,.17,.20,.028,M.ink);box(receiver,.36,.16,.26,.11,.035,.025,M.coral);
  box(receiver,-.65,.09,-.23,.18,.12,.025,M.cream);
  for(const x of [-.68,.48]){const bolt=tube(receiver,x,.18,.258,.018,.025,M.steel);bolt.rotation.set(Math.PI/2,0,0);}
  const am=rankMat(kit.ammo.rank);
  plate(ammo,[[.03,-.07],[.34,-.06],[.27,-.57],[.02,-.54]],.27,M.ink,'magazine');
  plate(ammo,[[.08,-.12],[.28,-.11],[.22,-.49],[.07,-.47]],.295,am,'magazine-cover');
  box(ammo,.16,-.58,0,.35,.08,.37,M.cream,.03);
  if(kit.ammo.id==='duplex'){for(const x of [.11,.23]){box(ammo,x,-.29,.162,.045,.20,.02,M.cream,-.1);box(ammo,x+.01,-.18,.164,.045,.035,.022,M.gold);}}
  else if(kit.ammo.id==='pellets'){for(let i=0;i<8;i++)box(ammo,.12+(i%2)*.10,-.20-Math.floor(i/2)*.075,.162,.035,.035,.024,M.cream);}
  else if(kit.ammo.id==='explosive'){box(ammo,.17,-.28,.165,.09,.21,.026,M.coral);box(ammo,.17,-.18,.17,.09,.035,.03,M.gold);}
  else if(kit.ammo.id==='sniper'){box(ammo,.17,-.29,.164,.028,.25,.024,M.gold,-.1);}
  else{for(let i=0;i<3;i++)box(ammo,.08+i*.075,-.29,.163,.024,.18,.022,kit.ammo.id==='piercing'?M.cyan:M.cream,-.1);}
  for(let i=0;i<3;i++)box(ammo,.17,-.36-i*.055,-.165,.16,.015,.012,M.ink);
  // A common sight axis stays readable above every mechanism and barrel.
  for(const x of [-.12,1.18]){box(receiver,x,.59,0,.055,.20,.07,M.ink);for(const z of [-.055,.055])box(receiver,x,.705,z,.055,.10,.022,M.ink);}
  const sight=tube(receiver,1.18,.72,0,.011,.028,M.lime);sight.rotation.z=Math.PI/2;
  const cm=rankMat(kit.circuit.rank);
  box(circuit,-.54,.55,0,.30,.12,.34,M.ink);box(circuit,-.54,.62,0,.26,.025,.29,cm);
  for(let i=0;i<4;i++)box(circuit,-.65+i*.07,.55,.19,.028,.055,.065,M.gold);
  const circuitFace=hardware.part(kit.circuit.id,kit.circuit.rank,.0075);circuitFace.position.set(-.54,.61,.17);circuit.add(circuitFace);
  flash=new T.Group();flash.position.set(1.58,.17,0);model.add(flash);
  const fg=geo('flash',()=>new T.OctahedronGeometry(.15,0)),fm=material('flash',0xffc27a);fm.emissive=new T.Color(0xffa95a);fm.emissiveIntensity=1;
  const f=new T.Mesh(fg,fm);f.scale.set(2.4,.65,.65);flash.add(f);flash.visible=false;

 for(const g of [receiver,barrel,ammo,circuit])batchGroup(g);model.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;m.userData.gunVisual=true;}});flash.visible=false;
 return {root:model,barrel:barrelGroup,ammo,flash,dispose(){mergedGeometries.forEach(g=>g.dispose());Object.values(geos).forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());hardware.dispose();}};
}
