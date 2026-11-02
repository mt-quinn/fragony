import * as THREE from '../vendor/three.module.js';
import {healthPickup} from '../pickups.js';
// Original authored architecture: identical solids feed movement and rendered faces.
export function arenaKit(id,name,w,d,palette){
 const brushes=[],visuals=[],stairs=[],pads=[],elevators=[],water=[],pickups=[],spawns=[],landmarks=[],signs=[],lights=[];
 const colors={wall:0xc1c6b6,floor:0x849c94,deck:0x9fb3a8,steel:0x334d50,trim:0xb7c4b3,accent:0xd9ef45,blue:0x599ca8,warm:0xc69170,...palette};
 function shape(id,x,z,w,d,bottom,top,kind='wall',yaw=0,solid=true){const b={id,x,z,w,d,bottom,top,yaw};if(solid)brushes.push(b);visuals.push({...b,kind});return b}
 const detail=(...a)=>shape(...a.slice(0,8),false);
 function wall(id,x,z,w,d,height=8,base=1,kind='wall',yaw=0){shape(id,x,z,w,d,base,base+height,kind,yaw);shape(id+'-foot',x,z,w+.02,d+.02,base,base+.2,'steel',yaw,false);shape(id+'-coping',x,z,w+.08,d+.08,base+height-.12,base+height+.02,'trim',yaw,false)}
 function deck(id,x,z,w,d,top=5){shape(id,x,z,w,d,top-.5,top,'deck');shape(id+'-fascia',x,z,w+.04,d+.04,top-.55,top-.43,'steel',0,false);for(const side of [-1,1])shape(id+'-edge',x,z+side*(d/2-.1),w,.09,top+.008,top+.026,'accent',0,false)}
 function stair(id,x,z,dx,dz,base=1,rise=4,width=4,tread=.65){const count=Math.round(rise/.25);for(let i=0;i<count;i++){const top=base+(i+1)*.25;shape(id+'-'+i,x+dx*i*tread,z+dz*i*tread,dx?tread:width,dx?width:tread,base,top,'deck');shape(id+'-nosing-'+i,x+dx*i*tread,z+dz*i*tread,dx?.045:width,dx?width:.045,top+.005,top+.02,'steel',0,false)}const end={x:x+dx*(count-1)*tread,y:base+rise,z:z+dz*(count-1)*tread};stairs.push({id,start:{x:x-dx*tread,y:base,z:z-dz*tread},end});return end}
 function ramp(id,x,z,dx,dz,base,rise,length,width){
  const cx=x+dx*length/2,cz=z+dz*length/2,px=-dz*width/2,pz=dx*width/2;
  const a=[x-px,base,z-pz],b=[x+px,base,z+pz],c=[x+dx*length+px,base,z+dz*length+pz],d=[x+dx*length-px,base,z+dz*length-pz],C=[c[0],base+rise,c[2]],D=[d[0],base+rise,d[2]],positions=[];
  for(const tri of [[a,b,C],[a,C,D],[a,d,c],[a,c,b],[d,D,C],[d,C,c],[a,D,d],[b,c,C]])positions.push(...tri.flat());
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();visuals.push({geometry,kind:'deck'});
  const w=dx?length:width,dep=dx?width:length,nx=-rise/length*dx,nz=-rise/length*dz;
  brushes.push({id,x:cx,z:cz,w,d:dep,bottom:base,top:base+rise,planes:[[1,0,0,cx+w/2],[-1,0,0,-cx+w/2],[0,0,1,cz+dep/2],[0,0,-1,-cz+dep/2],[0,-1,0,-base],[nx,1,nz,base+rise/2+nx*cx+nz*cz]]});
 }
 function pillar(id,x,z,r,base=1,top=10,kind='steel'){
  // Chamfered octagon, not an invisible square collision around a round column.
  const planes=[[0,1,0,top],[0,-1,0,-base]];for(let i=0;i<8;i++){const a=i*Math.PI/4;planes.push([Math.cos(a),0,Math.sin(a),r*Math.cos(Math.PI/8)+Math.cos(a)*x+Math.sin(a)*z])}
  brushes.push({id,x,z,w:r*2,d:r*2,bottom:base,top,planes});const geo=new THREE.CylinderGeometry(r,r,top-base,8,1);geo.rotateY(Math.PI/8);geo.translate(x,(base+top)/2,z);visuals.push({geometry:geo,kind});
 }
 function windowWall(id,x,z,w,d,base=1,height=8,sill=1.15,opening=2.5,axis='x'){
  // Open firing window: the sill and lintel collide; no invisible glass blocker.
  shape(id+'-sill',x,z,w,d,base,base+sill,'steel');shape(id+'-lintel',x,z,w,d,base+sill+opening,base+height,'wall');
  for(const side of [-1,1])shape(id+'-jamb',x+(axis==='x'?side*(w/2-.15):0),z+(axis==='z'?side*(d/2-.15):0),axis==='x'?.3:w,axis==='z'?.3:d,base,base+height,'steel');
 }
 const health=(id,x,y,z,amount)=>pickups.push(healthPickup(id,x,y,z,amount));
 const line=(id,x,y,z,dx,dz,n=5)=>{for(let i=0;i<n;i++)health(id+'-'+i,x+dx*i,y,z+dz*i,5)};
 const spawn=(x,y,z)=>spawns.push([x,y,z]);const mark=(name,x,y,z)=>landmarks.push({name,x,y,z});
 function sign(text,x,y,z,rotation=0,width=5,color='accent'){signs.push({text,x,y,z,rotation,width,color:colors[color]})}
 function floor(id,x,z,w,d,top=1,kind='floor'){shape(id,x,z,w,d,0,top,kind);for(let u=-w/2+2;u<w/2;u+=4)shape(id+'-seam',x+u,z,.025,d,top+.003,top+.009,'steel',0,false)}
 function shell(height=12){wall('north',0,-d/2,w+1,1,height);wall('south',0,d/2,w+1,1,height);wall('west',-w/2,0,1,d,height);wall('east',w/2,0,1,d,height)}
 function finish(camera,description){const groups={},unit=new THREE.BoxGeometry(1,1,1);for(const v of visuals){const geo=v.geometry||unit,p=geo.attributes.position,n=geo.attributes.normal,ix=geo.index,c=Math.cos(v.yaw||0),s=Math.sin(v.yaw||0),g=groups[v.kind]??={p:[],n:[],c:[]},color=new THREE.Color(colors[v.kind]??colors.wall);for(let i=0;i<(ix?.count||p.count);i++){const j=ix?ix.getX(i):i,nx=n.getX(j),ny=n.getY(j),nz=n.getZ(j);if(v.geometry){g.p.push(p.getX(j),p.getY(j),p.getZ(j));g.n.push(nx,ny,nz)}else{const x=p.getX(j)*v.w,z=p.getZ(j)*v.d;g.p.push(v.x+c*x+s*z,(v.bottom+v.top)/2+p.getY(j)*(v.top-v.bottom),v.z-s*x+c*z);g.n.push(c*nx+s*nz,ny,-s*nx+c*nz)}const shade=ny>.5?1:ny<-.5?.63:.88;g.c.push(color.r*shade,color.g*shade,color.b*shade)}if(v.geometry)geo.dispose()}unit.dispose();return{id,name,description,brushes,groups,stairs,pads,elevators,water,pickups,spawns,landmarks,signs,lights,solids:[],areas:[],bounds:{x:w/2-.5,z:d/2-.5},floor:{w,d},maxHeight:9.1,stepHeight:.3,anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z]),...landmarks.map(p=>[p.x,p.y,p.z])],camera,materials:{steel:{roughness:.58,metalness:.4},accent:{emissive:colors.accent,emissiveIntensity:.12},blue:{roughness:.72},warm:{roughness:.78}}}}
 return{shape,wall,deck,stair,ramp,pillar,windowWall,health,line,spawn,mark,sign,floor,shell,finish,pads,elevators,water,lights};
}
