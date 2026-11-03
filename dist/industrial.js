import * as THREE from './vendor/three.module.js';
import {industrialResources} from './testworks.js';
import {sourceDistricts,sourceDistrictIndex,sourceDistrictCuts,sourceFittings} from './maps/source-districts.js';
const area=(id,name,wall,floor,accent,type='concrete')=>({id,name,wall,floor,accent,type});
const districts={
 'tidal-lock':[
  area('pumping','PUMP HOUSE',0xc6c7b8,0x93998a,0xb6a264),
  area('hydraulics','GATE HYDRAULICS',0xb9c9c0,0x91a7a1,0x5e8c87,'coated'),
  area('lock','LOCK CROSSING',0xc8ccc0,0xa1aaa2,0x8c9b91),
  area('intake','INTAKE CHANNEL',0xa6b8ae,0x80938a,0x66918a),
  area('discharge','DISCHARGE',0xc0c3af,0x9caa93,0xafa677)
 ],
 parallax:[
  area('compressors','COMPRESSORS',0xc3c5b5,0x929789,0xa7a16d),
  area('exchange','HEAT EXCHANGE',0xc8bfb0,0xa9a394,0xba8d70),
  area('transfer','TRANSFER HALL',0xc5cfc4,0xa4b2a8,0x6e9590,'coated'),
  area('switchgear','SWITCHGEAR',0xbdcbc7,0x98aaa7,0x8daba7,'coated'),
  area('loading','SERVICE YARD',0xcac4b0,0xb0a78e,0xb2a16a)
 ],
 foundry:[
  area('forge','FORGE HALL',0xc8c2ae,0x929486,0xb49b64),
  area('press','HYDRAULIC PRESS',0xbecac0,0x9aa9a1,0x6f9690,'coated'),
  area('gantry','TRANSFER GANTRY',0xc7c9ba,0xa3ada1,0x8e9c8f),
  area('control','CONTROL & POWER',0xc0cbc2,0x9eaba4,0x91a9a0,'coated'),
  area('dispatch','DISPATCH',0xc9c1ac,0xb0a48b,0xb7a16d)
 ],
 reservoir:[
  area('pumps','PUMP GALLERY',0xb9cbc1,0x8da89d,0x62948b,'coated'),
  area('electrical','ELECTRICAL GALLERY',0xc4cec6,0xa0b1a7,0x8ca79a,'coated'),
  area('filtration','FILTRATION',0xcecab5,0xa5ad96,0xb3a66d),
  area('valves','VALVE HALL',0xb9c8bb,0x91a79b,0x70958a),
  area('basin','RESERVOIR BASIN',0x9cae9f,0x7d9588,0x759e91),
  area('crossing','TRANSFER BRIDGE',0xc3c9bb,0xa2b1a4,0x8e9c89)
 ],
 rust:[
  area('tower','PROCESS TOWER',0xc5c4ae,0xaaa68d,0xa69868),
  area('pipes','PIPE RACK',0xb9c3b1,0x9ca58e,0x6f9488,'coated'),
  area('loading','LOADING APRON',0xcac1a7,0xb4a68c,0xb49a65),
  area('service','SERVICE PLANT',0xb9c7bc,0x98aaa0,0x6d9489,'coated')
 ],
 nuketown:[
  area('west-house','FIELD OPERATIONS',0xb5c8be,0x9cac9f,0x608d87,'coated'),
  area('east-house','SYSTEMS LAB',0xd0c5ac,0xb5aa91,0xb49b63),
  area('west-garden','WEST SERVICE GARDEN',0xbac7b7,0x9aa888,0x7a9b86),
  area('east-garden','EAST SERVICE GARDEN',0xc6c5ac,0xaaa68b,0xa89b6e),
  area('crossing','TRANSIT CROSSING',0xc8cebf,0xa8b2a5,0x8f9f92)
 ],
 shipment:[
  area('north','NORTH STACKS',0xc0c8b8,0xa8ae9b,0x70978f,'coated'),
  area('south','SOUTH STACKS',0xc8c1aa,0xb5a88c,0xb49a69),
  area('east','POWER BAY',0xc1cbc3,0xa2b1a7,0x8aa69a,'coated'),
  area('west','DISPATCH',0xc7c2ae,0xa9a28c,0xa99c70),
  area('crossing','CENTRAL CROSSING',0xc9ccba,0xb3b6a0,0x8f9c86)
 ]
};
districts.reservoir[0].wallType='coated';districts.reservoir[0].wall=0xa6beb0;
districts.reservoir[1].wallType='coated';districts.reservoir[3].wallType='paint';
Object.assign(districts,sourceDistricts);
export function industrialDistricts(id){return districts[id]||[];}
export function industrialDistrict(id,x,y,z){const a=districts[id];if(!a)return null;
 if(sourceDistricts[id])return a[sourceDistrictIndex(id,x,y,z)];
 if(id==='reservoir')return a[y<12?4:x>18?0:x< -18?1:z< -20?2:z>20?3:5];
 if(id==='tidal-lock')return a[Math.abs(x)<7?Math.abs(z)<19?2:z<0?3:4:x< -14?0:x>14?1:z<0?3:4];
 if(id==='parallax'||id==='foundry')return a[z< -17?3:z>15?4:x< -10?0:x>11?1:2];
 if(id==='rust')return a[Math.abs(x)<9&&Math.abs(z)<9?0:z< -7?1:z>9?2:3];
 if(id==='shipment')return a[z< -4?0:z>4?1:x>4?2:x< -4?3:4];
 if(id==='nuketown')return a[x< -42?2:x>42?3:x< -15?0:x>15?1:4];
 return a[0];
}
const materialCache=new Map();let fenceTexture;
function chainlink(){if(fenceTexture)return fenceTexture;const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const edge=((x+y)%16<1.6)||((x-y+128)%16<1.6),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=edge?255:0;data[i+3]=255;}fenceTexture=new THREE.DataTexture(data,size,size);fenceTexture.wrapS=fenceTexture.wrapT=THREE.RepeatWrapping;fenceTexture.magFilter=THREE.LinearFilter;fenceTexture.minFilter=THREE.LinearMipmapLinearFilter;fenceTexture.generateMipmaps=true;fenceTexture.needsUpdate=true;return fenceTexture;}
function fenceAlpha(uv){const x=((uv.x%1)+1)%1*64,y=((uv.y%1)+1)%1*64;return((x+y)%16<1.6)||(((x-y+128)%16)<1.6);}

function material(family){if(materialCache.has(family))return materialCache.get(family);const {grain}=industrialResources(),metal=family==='steel',coated=family==='coated'||family==='paint',glass=family==='glass';const m=new THREE.MeshStandardMaterial({name:'industrial-'+family,color:0xffffff,vertexColors:true,roughness:glass?.3:metal?.8:coated?.68:.93,metalness:metal?.2:coated?.12:0,side:THREE.DoubleSide,map:family==='concrete'?grain:null});if(family==='fence'){m.alphaMap=chainlink();m.alphaTest=.5;m.roughness=.83;m.userData.alphaAt=fenceAlpha;}if(family==='light'){m.emissive.setHex(0xdfe5cd);m.emissiveIntensity=.75;}if(glass){m.transparent=true;m.opacity=.26;m.depthWrite=false;}materialCache.set(family,m);return m;}
// Exact source triangles, recolored by their physical district and material role.
// Only visual attributes change; no simplification or shifted original geometry.
export function industrialGroups(map){
 if(map.renderChunks)return map.renderChunks.map(chunk=>{const geometry=new THREE.BufferGeometry();for(const [name,a]of Object.entries(chunk.attributes))geometry.setAttribute(name,new THREE.BufferAttribute(a.array,a.size,a.normalized));if(chunk.index)geometry.setIndex(new THREE.BufferAttribute(chunk.index.array,1));geometry.computeBoundingSphere();geometry.userData.sourceBVH=chunk.bvh;return{family:chunk.family,geometry,material:material(chunk.family)}});
 const buckets=new Map(),color=new THREE.Color(),chunked=!!sourceDistricts[map.id];
 for(const [kind,g]of Object.entries(map.groups)){
  if(kind==='water')continue;
  for(let source=0;source<g.p.length;source+=9)for(const tri of districtTriangles(map.id,g,source)){
   // Some source engines store clockwise draw indices. Align each face with
   // its authored normals so DoubleSide does not light its outside as an inside.
   const u=tri[1].p.map((v,k)=>v-tri[0].p[k]),v=tri[2].p.map((v,k)=>v-tri[0].p[k]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],dot=cross.reduce((sum,value,k)=>sum+value*(tri[0].n[k]+tri[1].n[k]+tri[2].n[k]),0);if(dot<0)[tri[1],tri[2]]=[tri[2],tri[1]];
   const p=tri.flatMap(v=>v.p),n=tri.flatMap(v=>v.n),x=(p[0]+p[3]+p[6])/3,y=(p[1]+p[4]+p[7])/3,z=(p[2]+p[5]+p[8])/3,nx=(n[0]+n[3]+n[6])/3,ny=(n[1]+n[4]+n[7])/3,a=industrialDistrict(map.id,x,y,z);if(!a)continue;
   const equipment=/^prop_/.test(kind)&&!/pallet|wood|board|stone|concrete|column|rock|brick|cinder|sandbag/.test(kind),wood=/pallet|wood|board/.test(kind)||(map.id==='killhouse'&&kind==='concrete'&&Math.abs(ny)<.5&&y<7&&Math.abs(x)<18&&Math.abs(z)<38),floor=ny>.65,fence=/fence|grate|chainlink/.test(kind),metal=/^(steel|ink|trim)$|metal|pipe|rail|structural/.test(kind),container=/container|cargo/.test(kind),paint=equipment||container||['blue','warm','accent','paint','equipment','model-cover'].includes(kind),light=kind==='light'||/lightpanel|worklight/.test(kind),family=kind==='rubber'?'rubber':wood?'wood':fence?'fence':kind==='glass'?'glass':light?'light':metal?'steel':paint?'paint':floor?a.type:(a.wallType||'concrete');
   const containerColor=/blue/.test(kind)?0x73939a:/green|teal/.test(kind)?0x739589:/white/.test(kind)?0xbdc9bb:0xb6a06c;
   const hex=kind==='snow'?0xd4ded2:kind==='rubber'?0x46534c:/prop_t5_veh_schoolbus/.test(kind)?0xbba06a:/prop_t5_veh_movingtruck/.test(kind)?0x779b94:kind==='landscape'?(floor?0x91a17b:0x748c70):wood?(map.id==='nuketown'?a.wall:0xa69c7e):fence?0x788a7b:light?0xe3e7ce:metal?floor?0x9ba99c:0x64776b:container?containerColor:paint?a.accent:floor?a.floor:a.wall;
   color.setHex(hex);color.multiplyScalar(.96+.04*Math.max(0,ny)+nx*.025);
   const key=chunked?family+':'+Math.floor(x/24)+','+Math.floor(z/24):family;let b=buckets.get(key);if(!b){b={family,p:new FloatBuilder(),n:new FloatBuilder(),c:new FloatBuilder(),uv:new FloatBuilder()};buckets.set(key,b);}
   for(let j=0;j<9;j+=3){b.p.push(p[j],p[j+1],p[j+2]);b.n.push(n[j],n[j+1],n[j+2]);b.c.push(color.r,color.g,color.b);const xx=p[j],yy=p[j+1],zz=p[j+2],ax=Math.abs(n[j]),ay=Math.abs(n[j+1]);b.uv.push((ay>.5?xx:ax>.5?zz:xx)*.45,(ay>.5?zz:yy)*.45);}

  }
 }
 return [...buckets.values()].map(b=>{const family=b.family,geometry=new THREE.BufferGeometry();for(const [name,key,size]of[['position','p',3],['normal','n',3],['color','c',3],['uv','uv',2]])geometry.setAttribute(name,new THREE.BufferAttribute(b[key].finish(),size));if(chunked)indexSourceGeometry(geometry);geometry.computeBoundingSphere();return{family,geometry,material:material(family)};});
}

function indexSourceGeometry(geometry){
 const entries=Object.entries(geometry.attributes),count=geometry.attributes.position.count,unique=new Map(),indices=new Uint32Array(count),buffers=entries.map(([name,a])=>({name,size:a.itemSize,input:a.array,output:new Float32Array(a.array.length)}));let next=0;
 for(let i=0;i<count;i++){let key='';for(const b of buffers)for(let k=0;k<b.size;k++)key+=b.input[i*b.size+k]+',';let index=unique.get(key);if(index===undefined){index=next++;unique.set(key,index);for(const b of buffers)for(let k=0;k<b.size;k++)b.output[index*b.size+k]=b.input[i*b.size+k];}indices[i]=index;}
 for(const b of buffers)geometry.setAttribute(b.name,new THREE.BufferAttribute(b.output.slice(0,next*b.size),b.size));geometry.setIndex(new THREE.BufferAttribute(indices,1));
}

class FloatBuilder{
 constructor(){this.parts=[];this.current=new Float32Array(65536);this.offset=0;this.length=0;}
 push(...values){for(const v of values){if(this.offset===this.current.length){this.parts.push(this.current);this.current=new Float32Array(65536);this.offset=0;}this.current[this.offset++]=v;this.length++;}}
 finish(){const result=new Float32Array(this.length);let offset=0;for(const part of this.parts){result.set(part,offset);offset+=part.length;}result.set(this.current.subarray(0,this.offset),offset);this.parts=[];this.current=null;return result;}
}

const districtCuts={
 ...sourceDistrictCuts,
 'tidal-lock':[[0,-14],[0,-7],[0,7],[0,14],[2,-19],[2,0],[2,19]],
 parallax:[[0,-10],[0,11],[2,-17],[2,15]],foundry:[[0,-10],[0,11],[2,-17],[2,15]],
 reservoir:[[0,-18],[0,18],[1,12],[2,-20],[2,20]],
 rust:[[0,-9],[0,9],[2,-9],[2,-7],[2,9]],shipment:[[0,-4],[0,4],[2,-4],[2,4]],nuketown:[[0,-42],[0,-15],[0,15],[0,42]]
};
function districtTriangles(id,g,offset){
 let polygons=[Array.from({length:3},(_,j)=>({p:Array.from(g.p.slice(offset+j*3,offset+j*3+3)),n:Array.from(g.n.slice(offset+j*3,offset+j*3+3))}))];
 for(const [axis,value]of districtCuts[id]||[]){const next=[];for(const polygon of polygons){const min=Math.min(...polygon.map(v=>v.p[axis])),max=Math.max(...polygon.map(v=>v.p[axis]));if(min>=value-1e-5||max<=value+1e-5){next.push(polygon);continue;}for(const sign of [-1,1]){const out=[];for(let j=0;j<polygon.length;j++){const a=polygon[j],b=polygon[(j+1)%polygon.length],da=(a.p[axis]-value)*sign,db=(b.p[axis]-value)*sign;if(da>=-1e-6)out.push(a);if(da*db< -1e-10){const t=da/(da-db);out.push({p:a.p.map((v,k)=>v+(b.p[k]-v)*t),n:a.n.map((v,k)=>v+(b.n[k]-v)*t)});}}if(out.length>=3)next.push(out);}}polygons=next;}
 const triangles=[];for(const p of polygons)for(let i=1;i<p.length-1;i++)triangles.push([p[0],p[i],p[i+1]]);return triangles;
}

// Individually placed construction details. Everything at fighting height is
// supported by an original solid face; nothing decorates an empty shot opening.
export function dressIndustrialArena(arena,map,worldMeshes){
 const {m}=industrialResources(),batches=new Map(),unit=new THREE.BoxGeometry(1,1,1),notes=[];
 const tintCache=new Map(),tint=(a)=>{if(!tintCache.has(a.accent))tintCache.set(a.accent,new THREE.MeshStandardMaterial({color:a.accent,roughness:.68,metalness:.16}));return tintCache.get(a.accent);};
 function emit(g,mat){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);}
 function box(x,y,z,w,h,d,mat,yaw=0){const g=unit.clone().scale(w,h,d).rotateY(yaw).translate(x,y,z);emit(g,mat);}
 function face(b,side,u,y,w,h,mat,layer=1){const yaw=b.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),off=.012+layer*.012,lx=side==='e'?b.w/2+off:side==='w'?-b.w/2-off:u,lz=side==='s'?b.d/2+off:side==='n'?-b.d/2-off:u;box(b.x+c*lx+s*lz,y,b.z-s*lx+c*lz,side==='e'||side==='w'?.012:w,h,side==='e'||side==='w'?w:.012,mat,yaw);}
 function round(x,y,z,r,depth,mat,axis='z',segments=24){const g=new THREE.CylinderGeometry(r,r,depth,segments,1);if(axis==='z')g.rotateX(Math.PI/2);if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='y'&&segments===8)g.rotateY(Math.PI/8);g.translate(x,y,z);emit(g,mat);}
 function hatch(x,y,z,r,axis='z'){round(x,y,z,r,.035,m.edge,axis);round(x,y,z+(axis==='z'?.023:0),r*.86,.045,m.glass,axis);}
 function casing(b,a,style='cabinet'){
  if(b.planes||b.top-b.bottom<1)return;
  const h=b.top-b.bottom,y=(b.top+b.bottom)/2,paint=tint(a);
  for(const side of ['e','w','s','n']){const w=side==='e'||side==='w'?b.d:b.w;if(w<.7)continue;
   face(b,side,0,y,w-.13,h-.18,paint);
   face(b,side,0,b.bottom+.18,w-.1,.16,m.base,2);
   for(let u=-w/2+1.45;u<w/2-.25;u+=1.45){face(b,side,u,y,.025,h-.35,m.seam,2);face(b,side,u-.18,y,.055,.28,m.edge,3);}
   if(h>2){face(b,side,0,b.top-.55,Math.min(w-.3,1.15),.23,m.steel,2);face(b,side,0,b.top-.55,Math.min(w-.5,.75),.08,m.glass,3);}
   const rows=style==='exchanger'?6:3;for(let i=0;i<rows;i++)face(b,side,0,b.bottom+.4+i*.17,w-.35,.025,m.seam,3);
  }notes.push({type:style,id:b.id,area:a.id});
 }
 function vessel(b,a){
  const r=b.w/2,h=b.top-b.bottom;if(h<2)return;
  for(const y of [b.bottom+.25,b.top-.25])round(b.x,y,b.z,r*1.003,.2,m.edge,'y',8);
  round(b.x,b.bottom+Math.min(h*.35,2),b.z,r*1.004,.5,tint(a),'y',8);
  const front=b.z+r*Math.cos(Math.PI/8);hatch(b.x,b.bottom+Math.min(h*.5,2.4),front+.025,Math.min(.62,r*.32));
  notes.push({type:'vessel',id:b.id,area:a.id});
 }
 const brushes=map.brushes||[];
 for(const b of brushes){const a=industrialDistrict(map.id,b.x,(b.top+b.bottom)/2,b.z);if(!a)continue;
  if(b.planes&&/pump$|chimney|exchanger|press-cylinder/.test(b.id))vessel(b,a);
  else if(!b.planes&&/pump-wing|machine-wing|lower-core|low-console|major-island/.test(b.id))casing(b,a,/arc-|press/.test(b.id)?'exchanger':'cabinet');
  else if(!b.planes&&/recovery-screen|recovery-baffle|dispatch-.*screen|press-reveal/.test(b.id)){
   const h=b.top-b.bottom;for(const side of ['e','w','s','n']){const w=side==='e'||side==='w'?b.d:b.w;if(w<1.2)continue;face(b,side,0,b.bottom+.65,w-.12,.18,tint(a),1);face(b,side,0,b.top-.12,w-.1,.12,m.edge,2);}notes.push({type:'barrier',id:b.id,area:a.id});
  }
  // Original roof slabs and decks receive visible light undersides; they keep
  // their full original volume and drop edges, with no decorative guardrails.
  if(!b.planes&&(b.id.includes('roof')||b.id.includes('canopy')||(b.top-b.bottom<=.7&&b.top>2))&&b.w>4&&b.d>3){box(b.x,b.bottom-.006,b.z,b.w-.06,.012,b.d-.06,m.pale,b.yaw||0);for(let u=-b.w/2+2;u<b.w/2;u+=5)box(b.x+Math.cos(b.yaw||0)*u,b.bottom-.018,b.z-Math.sin(b.yaw||0)*u,.08,.04,b.d-.1,m.steel,b.yaw||0);}
  // Wall panel modules above combat sightlines mark actual facility districts.
  if(['north','south','east','west'].includes(b.id)){
   const side=b.id==='north'?'s':b.id==='south'?'n':b.id==='east'?'w':'e',width=side==='s'||side==='n'?b.w:b.d;
   for(let u=-width/2+3;u<width/2-2;u+=6){const x=side==='e'||side==='w'?b.x:b.x+u,z=side==='s'||side==='n'?b.z:b.z+u,region=industrialDistrict(map.id,x,6,z);face(b,side,u,Math.min(b.top-1.9,b.bottom+6.5),4.8,2.6,tint(region),1);for(const edge of [-1,1])face(b,side,u+edge*2.3,Math.min(b.top-1.9,b.bottom+6.5),.025,2.4,m.edge,2);}
  }
 }
 // Source signs retain their architecture positions but use actual plant names.
 const replacement={
  'tidal-lock':['PUMP HOUSE / 01','GATE HYDRAULICS / 02'],
  parallax:['COMPRESSORS / 01','HEAT EXCHANGE / 02'],
  foundry:['FORGE / 01','HYDRAULIC PRESS / 02','DISPATCH / 05','CONTROL / 04']
 };
 for(const [i,s]of(map.signs||[]).entries())sign(replacement[map.id]?.[i]||s.text,s.x,s.y,s.z,s.width,s.width*.19,s.rotation||0);
 if(map.id==='reservoir'){
  anchored('FILTRATION / 01',[12,38.5,-47],[0,0,-1],6,1.2);
  anchored('VALVE HALL / 02',[-12,38.5,47],[0,0,1],6,1.2);
  anchored('ELECTRICAL / 03',[-31,34.5,-18],[-1,0,0],6,1.2);
  anchored('PUMP GALLERY / 04',[31,34.5,18],[1,0,0],6,1.2);
  // Recessed service panels are fitted against the imported faces, not placed
  // over apertures. The exact source wall must support every panel corner.
  for(const [origin,dir]of[[[-31,33,-10],[-1,0,0]],[[-31,33,10],[-1,0,0]],[[31,33,-10],[1,0,0]],[[31,33,10],[1,0,0]]])anchored('',origin,dir,4.5,2.4,origin[0]>0?'pump':'electrical');
 }
 if(map.id==='shipment'){
  for(const [text,p,d]of[
   ['NORTH CARGO / 01',[-8,2.1,-5],[0,0,-1]],
   ['SOUTH CARGO / 02',[8,2.1,5],[0,0,1]],
   ['DISPATCH / 03',[-19,2.1,0],[-1,0,0]],
   ['POWER BAY / 04',[19,2.1,0],[1,0,0]]
  ])anchored(text,p,d,3.2,.58);
 }
 if(map.id==='nuketown'){
  for(const [text,p,d]of[
   ['FIELD OPERATIONS / 01',[-40,3.1,7],[1,0,0]],
   ['SYSTEMS LAB / 02',[42,3.1,7],[-1,0,0]],
   ['OPERATIONS / 01',[-12,3.1,0],[-1,0,0]],
   ['SYSTEMS / 02',[12,3.1,0],[1,0,0]],
   ['WEST SERVICE GARDEN',[-57,2.1,-10],[-1,0,0]],
   ['EAST SERVICE GARDEN',[57,2.1,10],[1,0,0]]
  ])anchored(text,p,d,4.2,.68);
  // Recessed cabinets fit actual opaque wall surfaces. No panel spans a door
  // or a firing window; the same support sampling used by Reservoir applies.
  for(const [p,d]of[[[-40,1.7,-7],[1,0,0]],[[42,1.7,-6],[-1,0,0]],[[-26,2.4,1],[0,0,-1]],[[28,2.4,1],[0,0,-1]]])anchored('',p,d,2.6,1.5,'electrical');
 }
 for(const [text,p,d,panel=false]of sourceFittings[map.id]||[])anchored(text,p,d,panel?2.2:3.4,panel?1.3:.58,panel);
 function sign(text,x,y,z,w,h,yaw=0,quaternion=null,panel=false){
  if(typeof document==='undefined')return;
  const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');if(!c?.fillRect)return;c.fillStyle=panel?'#91a79c':'#a9b7a6';c.fillRect(0,0,1024,256);c.fillStyle='#344c40';
  if(panel){c.fillRect(27,20,3,218);c.fillRect(505,20,3,218);for(const xx of [440,920])c.fillRect(xx,105,9,52);for(const yy of [185,201,217])c.fillRect(50,yy,890,3);}else{c.font='700 92px Arial';c.textBaseline='middle';c.fillText(text,32,131,960);}
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.84,polygonOffset:true,polygonOffsetFactor:-2});mat.userData.arenaOwnedMaterial=true;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);mesh.position.set(x,y,z);if(quaternion)mesh.quaternion.copy(quaternion);else mesh.rotation.y=yaw;mesh.layers.set(2);mesh.name='industrial-'+(text||'service-panel');arena.add(mesh);
 }
 function anchored(text,position,direction,w,h,panel=false){
  const backing=worldMeshes.filter(mesh=>!mesh.material.transparent&&!mesh.material.alphaTest);
  const origin=new THREE.Vector3(...position),dir=new THREE.Vector3(...direction),ray=new THREE.Raycaster(origin,dir,0,20),hit=ray.intersectObjects(backing,false)[0];if(!hit)return;
  const normal=new THREE.Vector3().fromBufferAttribute(hit.object.geometry.attributes.normal,hit.face.a).transformDirection(hit.object.matrixWorld);if(Math.abs(normal.y)>.2)return;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal),right=new THREE.Vector3(1,0,0).applyQuaternion(q),up=new THREE.Vector3(0,1,0);
  let fits=false;for(let attempt=0;attempt<5;attempt++){fits=Array.from({length:77},(_,i)=>[(i%11)/5-1,Math.floor(i/11)/3-1]).every(([x,y])=>{const o=hit.point.clone().addScaledVector(right,x*w/2).addScaledVector(up,y*h/2).addScaledVector(normal,.15);ray.set(o,normal.clone().negate());ray.far=.25;return ray.intersectObjects(backing,false).some(h=>Math.abs(h.point.clone().sub(hit.point).dot(normal))<.04);});if(fits)break;w*=.8;h*=.8;}if(!fits)return;
  const p=hit.point.clone().addScaledVector(normal,.022);sign(text,p.x,p.y,p.z,w,h,0,q,panel);if(panel==='pump'){const r=Math.min(h*.32,w*.2);for(const [radius,depth,mat,offset]of[[r,.025,m.edge,.005],[r*.84,.026,m.glass,.018]]){const g=new THREE.CylinderGeometry(radius,radius,depth,24,1);g.rotateX(Math.PI/2);g.applyQuaternion(q);g.translate(p.x+normal.x*offset,p.y+normal.y*offset,p.z+normal.z*offset);emit(g,mat);}}notes.push({type:panel?'service-panel':'sign',text,position:p.toArray()});
 }
 for(const [mat,list]of batches){const geometry=mergeDetailGeometry(list);for(const g of list)g.dispose();const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=false;mesh.receiveShadow=true;mesh.layers.set(2);mesh.name='industrial-detail';arena.add(mesh);}
 unit.dispose();arena.userData.industrial={districts:industrialDistricts(map.id),details:notes,detailBatches:batches.size};
}
function mergeDetailGeometry(geometries){const attributes={position:[],normal:[],uv:[]};for(const source of geometries){const g=source.index?source.toNonIndexed():source;for(const name of Object.keys(attributes))attributes[name].push(g.attributes[name].array);if(g!==source)g.dispose();}const result=new THREE.BufferGeometry();for(const [name,arrays]of Object.entries(attributes)){const data=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){data.set(a,offset);offset+=a.length;}result.setAttribute(name,new THREE.BufferAttribute(data,name==='uv'?2:3));}result.computeBoundingSphere();return result;}
