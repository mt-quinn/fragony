// Kinematic upright cylinder against the same rotated solid boxes used by rendering.
// Shared body footprint for walls, floor support, steps, ceilings and stance changes.
export const COLLISION={radius:.4,standing:1.9,crouching:1.2,step:.3,skin:.001,maxTravel:.08};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function footprint(b,x,z,r){
 const a=b.yaw||0,c=Math.cos(a),s=Math.sin(a),dx=x-b.x,dz=z-b.z,u=c*dx-s*dz,v=s*dx+c*dz,hw=b.w/2,hd=b.d/2;
 const qx=u-clamp(u,-hw,hw),qz=v-clamp(v,-hd,hd),d=Math.hypot(qx,qz);
 if(d>=r-COLLISION.skin*.1)return null;
 if(d>1e-9)return{nx:(c*qx+s*qz)/d,nz:(-s*qx+c*qz)/d,depth:r-d};
 const px=hw-Math.abs(u)+r,pz=hd-Math.abs(v)+r;
 return px<pz?{nx:c*(u<0?-1:1),nz:-s*(u<0?-1:1),depth:px}:{nx:s*(v<0?-1:1),nz:c*(v<0?-1:1),depth:pz};
}
export function bodyContacts(blocks,p){
 const out=[];for(const b of blocks){if(b.top<=p.feet+COLLISION.skin*.1||b.bottom>=p.feet+p.height-COLLISION.skin*.1)continue;if(Math.abs(p.x-b.x)>Math.hypot(b.w,b.d)/2+p.radius||Math.abs(p.z-b.z)>Math.hypot(b.w,b.d)/2+p.radius)continue;const hit=footprint(b,p.x,p.z,p.radius);if(hit)out.push({...hit,block:b})}return out;
}
export function canOccupy(blocks,p){return p.feet>=-COLLISION.skin&&!bodyContacts(blocks,p).length}
function constrain(p,bounds){if(!bounds)return p;return{...p,x:clamp(p.x,-bounds.x+p.radius,bounds.x-p.radius),z:clamp(p.z,-bounds.z+p.radius,bounds.z-p.radius)}}
// Resolve a pre-existing overlap by the nearest local exit. No spawn/home teleport.
export function recoverBody(blocks,body,bounds){
 const start=constrain({...body,feet:Math.max(0,body.feet)},bounds);if(canOccupy(blocks,start))return start;
 const distance=p=>(p.x-body.x)**2+(p.z-body.z)**2+(p.feet-body.feet)**2,queue=[start],seen=new Set();
 for(let i=0;i<256&&queue.length;i++){
  queue.sort((a,b)=>distance(a)-distance(b));const p=queue.shift(),key=[p.x,p.feet,p.z].map(v=>Math.round(v*10000)).join(':');if(seen.has(key))continue;seen.add(key);
  const contacts=bodyContacts(blocks,p);if(!contacts.length&&p.feet>=0)return p;
  for(const h of contacts){const b=h.block,skin=COLLISION.skin;
   const candidates=[{...p,x:p.x+h.nx*(h.depth+skin),z:p.z+h.nz*(h.depth+skin)},{...p,feet:b.top+skin},{...p,feet:b.bottom-p.height-skin}];
   // Inside adjacent boxes, the nearest exit of one box may lead into the other.
   const a=b.yaw||0,c=Math.cos(a),s=Math.sin(a),u=c*(p.x-b.x)-s*(p.z-b.z),v=s*(p.x-b.x)+c*(p.z-b.z);
   for(const sign of [-1,1]){const ux=sign*(b.w/2+p.radius+skin),vz=sign*(b.d/2+p.radius+skin);candidates.push({...p,x:b.x+c*ux+s*v,z:b.z-s*ux+c*v},{...p,x:b.x+c*u+s*vz,z:b.z-s*u+c*vz})}
   for(const candidate of candidates){const next=constrain(candidate,bounds);if(next.feet>=0&&distance(next)<16)queue.push(next)}
  }
 }
 return start;
}
function horizontal(blocks,p,dx,dz,step,bounds,normals){
 let x=dx,z=dz;
 for(let pass=0;pass<4&&Math.hypot(x,z)>1e-8;pass++){
  const target=constrain({...p,x:p.x+x,z:p.z+z},bounds),hits=bodyContacts(blocks,target);
  if(!hits.length){p.x=target.x;p.z=target.z;break}
  if(step){const top=Math.max(...hits.map(h=>h.block.top));if(top>p.feet&&top-p.feet<=COLLISION.step+COLLISION.skin){const raised={...p,feet:top+COLLISION.skin};if(canOccupy(blocks,raised)&&canOccupy(blocks,{...target,feet:raised.feet})){p.x=target.x;p.z=target.z;p.feet=raised.feet;break}}}
  let lo=0,hi=1;for(let j=0;j<14;j++){const t=(lo+hi)/2;if(canOccupy(blocks,{...p,x:p.x+x*t,z:p.z+z*t}))lo=t;else hi=t}
  const impact=bodyContacts(blocks,{...p,x:p.x+x*hi,z:p.z+z*hi});p.x+=x*lo;p.z+=z*lo;x*=1-lo;z*=1-lo;
  for(const h of impact.length?impact:hits){normals.push({x:h.nx,z:h.nz});const into=x*h.nx+z*h.nz;if(into<0){x-=h.nx*into;z-=h.nz*into}}
 }
}
function support(blocks,p,from,to){let floor=to<=0&&from>=-COLLISION.skin?0:-Infinity;for(const b of blocks)if(b.top<=from+COLLISION.skin&&b.top>=to-COLLISION.skin&&footprint(b,p.x,p.z,p.radius))floor=Math.max(floor,b.top);return floor}
export function moveCharacter(blocks,body,delta,{grounded=false,bounds=null}={}){
 let p=recoverBody(blocks,body,bounds);const recovery=Math.hypot(p.x-body.x,p.feet-body.feet,p.z-body.z),normals=[];
 const count=Math.max(1,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.y),Math.abs(delta.z))/COLLISION.maxTravel)),dx=delta.x/count,dy=delta.y/count,dz=delta.z/count;let ceiling=false,landed=false;
 for(let i=0;i<count;i++){
  const onGround=grounded;horizontal(blocks,p,dx,dz,onGround&&dy<=0,bounds,normals);
  const old=p.feet;let next=old+dy;
  if(dy>0){for(const b of blocks)if(b.bottom>=old+p.height-COLLISION.skin&&b.bottom<next+p.height&&footprint(b,p.x,p.z,p.radius)){next=Math.min(next,b.bottom-p.height);ceiling=true}}
  else{const floor=support(blocks,p,old,next);if(Number.isFinite(floor)){next=floor;landed=true}}
  p.feet=Math.max(0,next);grounded=false;
  const floor=support(blocks,p,p.feet+COLLISION.skin*2,p.feet-(onGround&&dy<=0?COLLISION.step:COLLISION.skin*2));
  if(dy<=0&&Number.isFinite(floor)&&p.feet>=floor-COLLISION.skin){p.feet=floor;grounded=true;landed=true}
  // This should only catch numerical seams; recovery uses the same collision shape.
  if(!canOccupy(blocks,p))p=recoverBody(blocks,p,bounds);
 }
 return{...p,grounded,ceiling,landed,normals,recovery};
}
