// Original transfer exercises. No source-map geometry copied; no production roster mutation.
import * as THREE from '../../dist/vendor/three.module.js';
import {healthPickup} from '../../dist/pickups.js';
const B=1,U=4;
function builder(id,name,family,w,d){
 const brushes=[],stairs=[],pickups=[],spawns=[],landmarks=[],elevators=[],features=[];
 const box=(id,x,z,w,d,bottom,top,yaw=0,style='shell')=>{const b={id,x,z,w,d,bottom,top,yaw,style};brushes.push(b);return b};
 const wall=(id,x,z,w,d,height=7,base=B,style='shell')=>box(id,x,z,w,d,base,base+height,0,style);
 const deck=(id,x,z,w,d,top=U)=>box(id,x,z,w,d,top-.5,top,0,'deck');
 function stair(id,x,z,dx,dz,width=4,base=B,rise=3){const count=Math.round(rise/.25),points=[];for(let i=0;i<count;i++){const top=base+(i+1)*.25;box(id+'-'+i,x+dx*i,z+dz*i,dx?1:width,dx?width:1,base,top,0,'stair');points.push({x:x+dx*i,y:top,z:z+dz*i,action:'walk'})}stairs.push({id,points,start:{x:x-dx,y:base,z:z-dz},end:points.at(-1)});return points.at(-1)}
 const health=(id,x,y,z,amount)=>pickups.push(healthPickup(id,x,y,z,amount));
 const line=(id,x,y,z,dx,dz,count=4)=>{for(let i=0;i<count;i++)health(id+'-'+i,x+dx*i,y,z+dz*i,5)};
 const spawn=(x,y,z)=>spawns.push([x,y,z]);
 const landmark=(name,x,y,z)=>landmarks.push({name,x,y,z});
 box('foundation',0,0,w,d,0,B,0,'floor');wall('north',0,-d/2,w+2,1);wall('south',0,d/2,w+2,1);wall('west',-w/2,0,1,d);wall('east',w/2,0,1,d);
 function carve(rects){ // Solid complement gives the rooms real outlines, not crate lanes.
  const rows=[];for(let z=-d/2;z<d/2;z++){const spans=[];let start=null;for(let x=-w/2;x<w/2;x++){const free=rects.some(r=>x+.5>=r[0]&&x+.5<r[2]&&z+.5>=r[1]&&z+.5<r[3]);if(!free&&start===null)start=x;if((free||x===w/2-1)&&start!==null){spans.push([start,free?x:x+1]);start=null}}rows.push({z,spans})}
  const active=new Map(),done=[];for(const row of rows){const next=new Set();for(const[a,b]of row.spans){const k=a+','+b;next.add(k);if(active.has(k))active.get(k).z1=row.z+1;else active.set(k,{a,b,z0:row.z,z1:row.z+1})}for(const[k,r]of active)if(!next.has(k)){done.push(r);active.delete(k)}}done.push(...active.values());for(const[i,r]of done.entries())wall('hull-fill-'+i,(r.a+r.b)/2,(r.z0+r.z1)/2,r.b-r.a,r.z1-r.z0,8);
 }
 function finish(){
  const groups={},cube=new THREE.BoxGeometry(1,1,1),p=cube.attributes.position,n=cube.attributes.normal,ix=cube.index;
  for(const b of brushes){const k=b.style==='floor'||b.style==='deck'||b.style==='stair'?'floor':b.style==='ink'?'ink':'shell',g=groups[k]??={p:[],n:[],c:[]},c=Math.cos(b.yaw),s=Math.sin(b.yaw);for(let i=0;i<ix.count;i++){const j=ix.getX(i),x=p.getX(j)*b.w,z=p.getZ(j)*b.d,nx=n.getX(j),nz=n.getZ(j),ny=n.getY(j);g.p.push(b.x+c*x+s*z,(b.bottom+b.top)/2+p.getY(j)*(b.top-b.bottom),b.z-s*x+c*z);g.n.push(c*nx+s*nz,ny,-s*nx+c*nz);const col=k==='floor'?[.47,.62,.59]:ny<-.5?[.44,.49,.48]:[.79,.82,.74];g.c.push(...col)}}cube.dispose();
  return {id,name,family,brushes,groups,stairs,pickups,spawns,elevators,landmarks,features,areas:[],pads:[],solids:[],bounds:{x:w/2-.5,z:d/2-.5},floor:{w,d},maxHeight:U+.1,stepHeight:.3,anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z]),...landmarks.map(p=>[p.x,p.y,p.z])],camera:{position:[w*.6,28,d*.65],target:[0,2,0]},spawnYaws:spawns.map(([x,,z])=>Math.atan2(x,z))};
 }
 return {box,wall,deck,stair,health,line,spawn,landmark,carve,finish,elevators,features};
}
function court(variant){const b=builder('exercise-court-'+variant,variant?'OFFSET COURT':'TWIN COURT','court',60,50),{wall,deck,stair,health,line,spawn,landmark}=b;
 // A walkable outer upper circuit and a protected ground arcade share a court.
 deck('north-rim',0,-20,58,8);deck('south-rim',0,20,58,8);
 deck('west-rim-north',-25,-11.75,8,16.5);deck('west-rim-south',-25,15,8,10);deck('west-stair-bypass',-28.5,0,2.8,40);
 deck('east-rim-north',25,-15,8,10);deck('east-rim-south',25,11.75,8,16.5);deck('east-stair-bypass',28.5,0,2.8,40);
 stair('west-stair',-24.5,8,0,-1,4.5);stair('east-stair',24.5,-8,0,1,4.5);
 for(const x of [-19,19])for(const z of [-12,0,12])wall(`arcade-pier-${x}-${z}`,x,z,1.5,1.8,3);
 // Revised from observed near-continuous ground exposure: real opaque arcade
 // frontages below deck height, with spaced entries rather than roof-only cover.
 if(variant){for(const z of [-16.3,16.3])for(const [a,c]of[[-28,-20],[-14,-6],[0,8],[14,22]])wall(`arcade-front-${z}-${a}`,(a+c)/2,z,c-a,.8,2.5);
 for(const x of [-20.5,20.5])for(const[a,c]of[[-16,-10],[-6,-2],[2,6],[10,16]])wall(`arcade-side-${x}-${a}`,x,(a+c)/2,.8,c-a,2.5);}

 if(!variant){wall('twin-west',-5,-2,3,3,5.5);wall('twin-east',5,2,3,3,5.5);health('major',0,B,0,50)}
 else{wall('offset-monument',-3,0,5,7,5.5);wall('short-screen',8,6,1.4,5,2.4);health('major',4,B,-3,50)}
 for(const[x,z]of[[-25,-18],[25,18],[-25,18],[25,-18]])health('recovery-'+x+'-'+z,x,B,z,25);
 line('north-fragments',-8,U,-20,1.5,0);line('south-fragments',6,U,20,1.5,0);line('crossing-fragments',-12,B,12,1.5,0);
 for(const[x,z]of[[-14,-10],[14,-10],[-14,10],[14,10],[-25,-18],[25,18],[-25,18],[25,-18]])spawn(x,B,z);
 for(const[x,z]of[[-15,-20],[15,-20],[-15,20],[15,20]])spawn(x,U,z);
 landmark('court',0,B,0);landmark('north arcade',0,B,-20);landmark('upper north',0,U,-20);landmark('upper south',0,U,20);landmark('west recovery',-25,B,-18);landmark('east recovery',25,B,18);
 b.features.push('shared court','walkable upper perimeter','ground arcade','two stairs','open drops','return bypass','monument '+(variant?'offset':'paired'));
 return b.finish();}
function warren(variant){const b=builder('exercise-warren-'+variant,variant?'BENT RELAY':'CROSS RELAY','warren',52,44),{wall,deck,stair,health,line,spawn,landmark}=b;
 // Two offset chambers joined through two necks and independent end returns.
 wall('central-north-cap',0,-21,1.5,2);wall('central-north-stem',0,-11.5,1.5,9);wall('central-middle',0,variant?2:2.5,1.5,variant?6:5);wall('central-south-stem',0,14,1.5,4);wall('central-south-cap',0,21,1.5,2);
 wall('west-north-outer',-22,-10,8,1.5,2.5);wall('west-north-inner',-6,-10,12,1.5,2.5);wall('west-south-outer',-21,12,10,1.5,2.5);wall('west-south-inner',-5,12,10,1.5,2.5);
 wall('east-north-inner',5,-12,10,1.5,2.5);wall('east-north-outer',21,-12,10,1.5,2.5);wall('east-south-inner',7,8,14,1.5,2.5);wall('east-south-outer',23,8,6,1.5,2.5);
 deck('west-gallery',-20,-7,8,22);deck('west-stair-landing',-15,3.25,6,2.5);stair('west-stair',-13,15,0,-1,4);
 deck('east-gallery',20,7,8,22);deck('east-stair-landing',15,-3.25,6,2.5);stair('east-stair',13,-15,0,1,4);
 deck('cross-bridge',0,-5,40,6);
 // Thick room-scale supports interrupt the upper view, with real ground routes below.
 wall('bridge-pier-west',-8,-5,2.4,1.6,6.2);wall('bridge-pier-east',8,-5,2.4,1.6,6.2);
 if(variant){wall('west-reveal',-10,4,5,1.5,3.8);wall('east-reveal',11,-1,1.5,6,3.8);health('major',3,B,10,50)}else health('major',0,B,10,50);
 for(const[x,z]of[[-16,-18],[16,18],[-22,0],[22,4]])health('recovery-'+x+'-'+z,x,B,z,25);
 line('west-fragments',-20,U,-13,0,1.5);line('east-fragments',20,U,10,0,1.5);line('north-fragments',-8,B,-18,1.5,0);
 for(const[x,z]of[[-16,-18],[16,-18],[-16,18],[16,18],[-12,2],[13.5,2],[-24,6],[24,-6]])spawn(x,B,z);
 for(const[x,z]of[[-20,-15],[20,15],[-15,-5],[15,-5]])spawn(x,U,z);
 landmark('west chamber',-14,B,0);landmark('east chamber',14,B,0);landmark('crossing',0,U,-5);landmark('north return',0,B,-18);landmark('south return',0,B,18);landmark('lower contest',variant?3:0,B,10);
 b.features.push('offset rooms','two lower necks','two end returns','upper interlock','underpass','screened upper crossing','reveal screens '+!!variant);return b.finish();}
function ship(variant){const b=builder('exercise-ship-'+variant,variant?'SPLIT TRANSFER':'TRIPLE TRANSFER','ship',66,46),{wall,box,deck,stair,health,line,spawn,landmark,carve}=b;
 carve([[-30,-14,-14,10],[-8,-4,8,16],[14,-12,30,10],[-16,-2,-6,2],[-10,0,-6,8],[6,-2,14,2],[12,0,16,8],[-24,-20,24,-16],[-26,-18,-22,-12],[22,-18,26,-10]]);
 box('roof',0,0,66,46,8.5,9.2);
 for(const[id,x,z,w,d]of[['left-threshold',-11,0,10,4],['left-dogleg',-8,4,4,8],['right-threshold',11,0,10,4],['right-dogleg',14,4,4,8],['service-roof',0,-18,48,4],['left-service-roof',-24,-16,4,4],['right-service-roof',24,-15,4,6]])box(id,x,z,w,d,3.5,8.5);
 wall('engineering-core',-22,-4,4,6,5.5);wall('cargo-mass',22,variant?1:0,5,variant?7:5,4.5);wall('hub-core',variant?-1:0,4,variant?5:4,5,5.5);
 deck('engineering-west-gallery',-28,-8.75,4,10.5);deck('engineering-north-gallery',-22,-12,16,4);deck('engineering-east-gallery',-16,-8,4,12);stair('engineering-stair',-28,8,0,-1,4);
 deck('hub-back-gallery',0,-1,16,4);deck('hub-east-gallery',6,5,4,12);stair('hub-stair',-6,12,1,0,4);
 deck('cargo-north-gallery',22,-10,16,4);deck('cargo-east-gallery',28,-2,4,12);deck('cargo-lift-landing',26,3.5,8,2);
 b.elevators.push({id:'cargo-lift',x:27,z:6,w:3,d:3,low:B,high:U,entry:{x:27,z:3.8}});
 health('major',3.5,B,8,50);for(const[id,x,z]of[['engineering',-20,4],['cargo',18,-8],['service-west',-4,-18],['service-east',12,-18]])health('recovery-'+id,x,B,z,25);
 line('engineering-fragments',-24,U,-12,1.5,0);line('cargo-fragments',18,U,-10,1.5,0);line('hub-fragments',-4,B,-2,1.5,0);
 for(const[x,z]of[[-18,6],[-18,-8],[18,6],[18,-8],[-5,14.5],[5,3],[-12,-18],[12,-18]])spawn(x,B,z);
 spawn(-28,U,-8);spawn(-16,U,-10);spawn(28,U,-2);spawn(6,U,6);
 landmark('engineering',-20,B,2);landmark('hub contest',3.5,B,8);landmark('cargo',18,B,4);landmark('service return',0,B,-18);landmark('engineering upper',-22,U,-12);landmark('hub upper',6,U,6);landmark('cargo upper',28,U,-2);
 b.features.push('three recognizable chambers','offset low thresholds','separate service circuit','local upper galleries','two stair access points','one actual lift','hub obstruction '+(variant?'wide':'narrow'));return b.finish();}
export const EXERCISES=[court(0),court(1),warren(0),warren(1),ship(0),ship(1)];
