// The map, blips and rim share one fixed world radius. UI scale never changes range.
export const MINIMAP={range:26,hold:1,fade:.55,size:200,radius:87};
const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function mapPoint(point,player,yaw=0,north=false){const x=point.x-player.x,z=point.z-player.z,a=north?0:yaw,c=Math.cos(a),s=Math.sin(a);return{x:c*x-s*z,y:s*x+c*z,distance:Math.hypot(x,z)};}
export function revealOpacity(age){return age<0||age>=MINIMAP.hold+MINIMAP.fade?0:age<=MINIMAP.hold?1:1-(age-MINIMAP.hold)/MINIMAP.fade;}
export class ShotReveals{
 constructor(){this.pings=new Map();this.clock=0;}
 reset(){this.pings.clear();this.clock=0;}
 shot(id,position){this.pings.set(id,{id,x:position.x,y:position.y,z:position.z,at:this.clock});}
 step(dt){this.clock+=Math.max(0,dt);for(const [id,p]of this.pings)if(!revealOpacity(this.clock-p.at))this.pings.delete(id);}
 active(){return [...this.pings.values()].map(p=>({...p,age:this.clock-p.at,alpha:revealOpacity(this.clock-p.at)}));}
}
const angleGap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
// Merge circularly, including the -pi/pi seam. Counts survive dense salvos; no
// indicators are dropped or spread to misleading, invented bearings.
export function edgeGroups(points,separation=.29){
 const groups=points.map(p=>({members:[p],angle:Math.atan2(p.y,p.x),alpha:p.alpha??1}));
 const merge=(a,b)=>{const members=[...a.members,...b.members],x=members.reduce((n,p)=>n+p.x/Math.max(.001,Math.hypot(p.x,p.y)),0),y=members.reduce((n,p)=>n+p.y/Math.max(.001,Math.hypot(p.x,p.y)),0);return{members,angle:Math.atan2(y,x),alpha:Math.max(...members.map(p=>p.alpha??1))};};
 while(groups.length>1){groups.sort((a,b)=>a.angle-b.angle);let pair=-1,gap=separation;for(let i=0;i<groups.length;i++){const g=angleGap(groups[i].angle,groups[(i+1)%groups.length].angle);if(g<gap){gap=g;pair=i;}}if(pair<0)break;const next=(pair+1)%groups.length,combined=merge(groups[pair],groups[next]);groups.splice(Math.max(pair,next),1);groups.splice(Math.min(pair,next),1);groups.push(combined);}
 return groups.map(g=>({...g,count:g.members.length}));
}
// Horizontal cross-section of actual collision geometry: convex BSP bevels,
// octagonal pillars, rotated walls and ramps all retain their true footprint.
export function sliceSolid(b,y){
 if(y<b.bottom-1e-5||y>b.top+1e-5)return[];
 if(!b.planes){const c=Math.cos(b.yaw||0),s=Math.sin(b.yaw||0);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>({x:b.x+c*u*b.w/2+s*v*b.d/2,z:b.z-s*u*b.w/2+c*v*b.d/2}));}
 let polygon=[{x:b.x-b.w/2,z:b.z-b.d/2},{x:b.x+b.w/2,z:b.z-b.d/2},{x:b.x+b.w/2,z:b.z+b.d/2},{x:b.x-b.w/2,z:b.z+b.d/2}];
 for(const [nx,ny,nz,d]of b.planes){const next=[],signed=p=>nx*p.x+ny*y+nz*p.z-d;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=signed(a),db=signed(b),insideA=da<=0,insideB=db<=0;if(insideA)next.push(a);if(insideA!==insideB){const t=da/(da-db);next.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}polygon=next;if(polygon.length<3)return[];}
 return polygon;
}
export function mapSlice(map,feet){
 const solids=map.brushes||map.solids||[],floor=[],walls=[];
 if(solids.triangleCollision&&map.navigation){const footprint=sourceFloorFootprint(sourceFloorNodes(map.navigation),feet);floor.push(...footprint.floor);walls.push(...footprint.walls);}
 for(const b of solids){const f=sliceSolid(b,feet-.12),w=sliceSolid(b,feet+.9);if(f.length)floor.push(f);if(w.length)walls.push(w);}
 return {floor,walls,ground:!map.brushes&&feet<.4};
}
function sourceFloorFootprint(nodes,feet){
 const cells=new Set(),rows=new Map();for(const n of nodes)if(n.y<=feet+.25&&n.y>=feet-.65)for(let dx=-1;dx<=0;dx++)for(let dz=-1;dz<=0;dz++){const x=Math.round(n.x*2)+dx,z=Math.round(n.z*2)+dz;cells.add(x+','+z);if(!rows.has(z))rows.set(z,new Set());rows.get(z).add(x);}
 const floor=[],walls=[];for(const [z,set]of rows){const xs=[...set].sort((a,b)=>a-b);let start=xs[0],last=start;const emit=()=>floor.push([{x:start/2,z:z/2},{x:(last+1)/2,z:z/2},{x:(last+1)/2,z:(z+1)/2},{x:start/2,z:(z+1)/2}]);for(const x of xs.slice(1)){if(x!==last+1){emit();start=x;}last=x;}if(xs.length)emit();}
 for(const key of cells){const [i,j]=key.split(',').map(Number),x=i/2,z=j/2,e=.035;for(const[dx,dz]of[[-1,0],[1,0],[0,-1],[0,1]])if(!cells.has((i+dx)+','+(j+dz))){const a=x+(dx>0?.5:0),b=z+(dz>0?.5:0);walls.push(dx?[{x:a-e,z},{x:a+e,z},{x:a+e,z:z+.5},{x:a-e,z:z+.5}]:[{x,z:b-e},{x:x+.5,z:b-e},{x:x+.5,z:b+e},{x,z:b+e}]);}}
 return{floor,walls};
}

const sourceFloorCache=new Map();
function sourceFloorNodes(encoded){if(sourceFloorCache.has(encoded))return sourceFloorCache.get(encoded);const s=atob(encoded),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);const v=new DataView(b.buffer),nodes=[],header=v.getUint32(0,true),wide=!!(header&0x80000000),n=header&0x7fffffff,stride=wide?16:12;for(let i=0;i<n;i++){const o=8+i*stride;nodes.push({x:wide?v.getInt16(o,true)/2:v.getInt8(o),z:wide?v.getInt16(o+2,true)/2:v.getInt8(o+1),y:v.getUint16(o+(wide?4:2),true)/1000})}sourceFloorCache.set(encoded,nodes);if(sourceFloorCache.size>2)sourceFloorCache.delete(sourceFloorCache.keys().next().value);return nodes;}
const path=(ctx,polygon)=>{ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.z):ctx.moveTo(p.x,p.z));ctx.closePath();};
export class Minimap{
 constructor(canvas,{createCanvas=()=>document.createElement('canvas')}={}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.createCanvas=createCanvas;this.reveals=new ShotReveals();this.cache=new Map();this.map=null;this.resolution=0;}
 reset(){this.reveals.reset();}
 shot(id,position){this.reveals.shot(id,position);}
 step(dt){this.reveals.step(dt);}
 layer(map,feet){
 if(this.map!==map){this.map=map;this.cache.clear();}
 const level=Math.round(feet*2)/2;if(this.cache.has(level))return this.cache.get(level);
 const x=map.floor.w/2+2,z=map.floor.d/2+2,ppm=4,canvas=this.createCanvas();canvas.width=Math.ceil(x*2*ppm);canvas.height=Math.ceil(z*2*ppm);const ctx=canvas.getContext('2d'),slice=mapSlice(map,level);
 ctx.setTransform(ppm,0,0,ppm,x*ppm,z*ppm);ctx.fillStyle='#53665e';if(slice.ground)ctx.fillRect(-map.floor.w/2,-map.floor.d/2,map.floor.w,map.floor.d);
 for(const polygon of slice.floor){path(ctx,polygon);ctx.fill();}
 ctx.strokeStyle='#a6b3a0';ctx.lineWidth=.16;if(!map.brushes?.triangleCollision)for(const polygon of slice.floor){path(ctx,polygon);ctx.stroke();}
 for(const volume of map.water||[]){if(level>=volume.bottom-.5&&level<=volume.top+1){const polygon=sliceSolid(volume,clamp(level,volume.bottom,volume.top));path(ctx,polygon);ctx.fillStyle='#3b7577';ctx.fill();ctx.strokeStyle='#82aaa1';ctx.stroke();}}
 ctx.fillStyle='#202d30';ctx.strokeStyle='#89988e';ctx.lineWidth=.18;for(const polygon of slice.walls){path(ctx,polygon);ctx.fill();ctx.stroke();}
 // Tread/connection lines communicate stairs without projecting overhead roofs.
 ctx.lineWidth=.25;ctx.strokeStyle='#b3bca5';ctx.setLineDash([.45,.45]);for(const stair of map.stairs||[]){if(Math.min(stair.start.y,stair.end.y)-.5>level||Math.max(stair.start.y,stair.end.y)+.5<level)continue;ctx.beginPath();ctx.moveTo(stair.start.x,stair.start.z);ctx.lineTo(stair.end.x,stair.end.z);ctx.stroke();}ctx.setLineDash([]);
 const layer={canvas,x,z,ppm};this.cache.set(level,layer);if(this.cache.size>16)this.cache.delete(this.cache.keys().next().value);return layer;
 }
 draw({map,player,yaw,north=false,pickups=[],elevators=[],pixelSize=200,level=player.y}){
 const ctx=this.ctx;if(!ctx)return;const resolution=clamp(Math.ceil(pixelSize),128,640);if(this.resolution!==resolution){this.resolution=resolution;this.canvas.width=this.canvas.height=resolution;}
 const {size,radius,range}=MINIMAP,k=radius/range;ctx.setTransform(resolution/size,0,0,resolution/size,0,0);ctx.clearRect(0,0,size,size);ctx.translate(100,100);
 ctx.fillStyle='#152328';ctx.beginPath();ctx.arc(0,0,98,0,tau);ctx.fill();ctx.strokeStyle='#d1d8c888';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,92,0,tau);ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(0,0,radius,0,tau);ctx.clip();ctx.fillStyle='#2e4142';ctx.fillRect(-90,-90,180,180);
 const layer=this.layer(map,level),a=north?0:yaw;ctx.save();ctx.rotate(a);ctx.scale(k,k);ctx.translate(-player.x,-player.z);ctx.drawImage(layer.canvas,-layer.x,-layer.z,layer.canvas.width/layer.ppm,layer.canvas.height/layer.ppm);ctx.restore();
 ctx.strokeStyle='#d5ddc716';ctx.lineWidth=.6;for(const r of [radius/2,radius]){ctx.beginPath();ctx.arc(0,0,r,0,tau);ctx.stroke();}ctx.beginPath();ctx.moveTo(-radius,0);ctx.lineTo(radius,0);ctx.moveTo(0,-radius);ctx.lineTo(0,radius);ctx.stroke();
 // Only this elevation's useful landmarks. Icons stay upright as geometry turns.
 for(const p of pickups){if(p.timer>0||Math.abs((p.y||0)-level)>2.2)continue;const q=mapPoint(p,player,yaw,north),x=q.x*k,y=q.y*k;if(q.distance>range-1.5)continue;ctx.strokeStyle=p.kind==='pad'?'#e1d28f':'#d3e1c4';ctx.lineWidth=1.3;ctx.beginPath();if(p.kind==='pad'){ctx.moveTo(x-2.5,y+2);ctx.lineTo(x,y-2);ctx.lineTo(x+2.5,y+2);}else{ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.moveTo(x,y-2);ctx.lineTo(x,y+2);}ctx.stroke();}
 for(const lift of elevators){if(level<lift.low-1||level>lift.high+1)continue;const q=mapPoint(lift,player,yaw,north);if(q.distance>range-2)continue;ctx.strokeStyle='#c3d3b5';ctx.lineWidth=1;ctx.strokeRect(q.x*k-3,q.y*k-3,6,6);}
 ctx.restore();
 const outside=[];for(const ping of this.reveals.active()){const q={...mapPoint(ping,player,yaw,north),alpha:ping.alpha};if(q.distance>range){outside.push(q);continue;}
  ctx.globalAlpha=ping.alpha;ctx.fillStyle='#ff534d';ctx.strokeStyle='#172429';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(q.x*k,q.y*k,3.7,0,tau);ctx.fill();ctx.stroke();ctx.strokeStyle='#ff8175';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(q.x*k,q.y*k,6+Math.min(ping.age,.4)*7,0,tau);ctx.globalAlpha=ping.alpha*Math.max(0,.6-ping.age);ctx.stroke();ctx.globalAlpha=ping.alpha;
  const height=ping.y-player.y;if(Math.abs(height)>2.5){const sign=height>0?-1:1,x=q.x*k,y=q.y*k+sign*8;ctx.strokeStyle='#ffc7b5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-2,y-sign*2);ctx.lineTo(x,y);ctx.lineTo(x+2,y-sign*2);ctx.stroke();}}
 ctx.globalAlpha=1;
 // A separated directional chevron + dark-backed count sits just inside the rim.
 for(const group of edgeGroups(outside)){ctx.save();ctx.rotate(group.angle+Math.PI/2);ctx.globalAlpha=group.alpha;ctx.strokeStyle='#152328';ctx.lineWidth=5;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-5,-83);ctx.lineTo(0,-89);ctx.lineTo(5,-83);ctx.stroke();ctx.strokeStyle='#ff6257';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();if(group.count>1){const x=Math.cos(group.angle)*76,y=Math.sin(group.angle)*76;ctx.globalAlpha=group.alpha;ctx.fillStyle='#18272b';ctx.beginPath();ctx.arc(x,y,7,0,tau);ctx.fill();ctx.fillStyle='#ff8a7a';ctx.font='800 9px Barlow,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(group.count>99?'99+':String(group.count),x,y+.3);}}
 ctx.globalAlpha=1;
 // The player stays centered; only north-lock rotates the player arrow.
 ctx.save();if(north)ctx.rotate(-yaw);ctx.fillStyle='#e4f369';ctx.strokeStyle='#152328';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,2);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 const compass=north?0:yaw;ctx.fillStyle='#dbe4d1';ctx.font='800 9px Barlow,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('N',Math.sin(compass)*95,-Math.cos(compass)*95);ctx.fillStyle='#c7d4bc66';for(let i=1;i<4;i++){const t=compass+i*Math.PI/2;ctx.beginPath();ctx.arc(Math.sin(t)*95,-Math.cos(t)*95,1,0,tau);ctx.fill();}
 }
}
