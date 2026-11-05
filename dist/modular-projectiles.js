import * as T from './vendor/three.module.js';
const CORE=[[0,0],[-.35,0],[.175,.3031],[.175,-.3031],[-3.5,0],[3.5,0],[0,-3.5],[0,3.5]];
const up=new T.Vector3(0,1,0),zAxis=new T.Vector3(0,0,1);
const id=a=>a.name;
export class ModularProjectiles{
 constructor(world){this.world=world;this.items=[];this.groups=new Set();this.clock=0;this.serial=0;
  this.geometry=new T.SphereGeometry(1,6,4);this.material=new T.MeshBasicMaterial({color:0xffbf77});this.mesh=new T.InstancedMesh(this.geometry,this.material,384);this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.name='modular-projectiles';world.scene?.add(this.mesh);this.transform=new T.Object3D();
 }
 clear(){this.items.length=0;this.groups.clear();this.mesh.count=0;this.clock=0;}
 emit(packet,origin,forward,owner=null){packet.ejection.owner=owner;const w=packet.w,right=new T.Vector3().crossVectors(forward,up).normalize(),vertical=new T.Vector3().crossVectors(right,forward).normalize(),pattern=w.ammoType==='pellets'?CORE:[[0,0]];
  for(let i=0;i<pattern.length;i++){
   const [x,y]=pattern[i],direction=forward.clone().addScaledVector(right,Math.tan(T.MathUtils.degToRad(x*w.pattern))).addScaledVector(vertical,Math.tan(T.MathUtils.degToRad(y*w.pattern))).normalize();
   const p={id:++this.serial,origin:origin.clone(),pos:origin.clone(),direction,owner,lifeId:packet.lifeId,w,budget:packet.budget/pattern.length,distance:0,seen:new Set(),passed:0,secondary:packet.secondary,ejection:packet.ejection,active:true};
   if(w.instant)this.travel(p,90);else this.items.push(p);
  }
 }
 curve(w,distance){if(!w.falloff)return 1;const f=w.falloff,t=Math.max(0,Math.min(1,(distance-f.close)/(f.far-f.close)));return f.near+(f.farScale-f.near)*t;}
 record(p,actor,damage,point,direct=false){const key=id(actor),old=p.ejection.hits.get(key);p.ejection.hits.set(key,{actor,damage:(old?.damage||0)+damage,point:point.clone(),distance:p.origin.distanceTo(point),direct:direct||old?.direct});this.groups.add(p.ejection);}
 damage(p,actor,budget,part,point,direct=false){
  if(actor.dead||actor.hp<=0||actor===p.owner||actor.isPlayer&&!p.owner)return 0;
  const result=this.world.damage(actor,budget,p.owner,part,point,{modular:true,lifeId:p.lifeId,secondary:p.secondary,origin:p.origin,weapon:'Modular gun',impactType:p.w.instant?'rail':p.w.ammoType==='pellets'?'shotgun':'rifle'}),damage=result?.damage??budget;
  if(damage>0){this.record(p,actor,damage,point,direct);if(p.w.bonus.slow&&!p.secondary)this.world.slow?.(actor,p.w.bonus.slow);}
  return damage;
 }
 explosion(p,point,direct=null){const w=p.w,actors=this.world.actors(),excluded=new Set(p.seen);if(direct)excluded.delete(id(direct));const splash=p.budget*.35;
  for(const actor of actors){if(actor===p.owner||actor.isPlayer&&!p.owner||actor.dead||actor.hp<=0||excluded.has(id(actor)))continue;const center=actor.pos.clone().add(new T.Vector3(0,1,0)),distance=center.distanceTo(point);if(actor!==direct&&(distance>=w.blast||!this.world.visible(point,center)))continue;
   const amount=splash*(actor===direct?1:Math.max(0,1-distance/w.blast));if(amount>0){this.damage(p,actor,amount,'torso',center);p.seen.add(id(actor));}
  }
  this.world.explosion?.(point,w.blast,p.owner);
 }
 rebound(p,hit){if(p.secondary||!p.w.bonus.rebound||p.distance>=90)return;const direction=p.direction.clone().reflect(hit.normal).normalize(),child={...p,id:++this.serial,pos:hit.center.clone().addScaledVector(hit.normal,.001),direction,budget:p.budget*p.w.bonus.rebound,seen:new Set(p.seen),passed:0,secondary:true,active:true};if(p.w.instant)this.travel(child,90-child.distance);else this.items.push(child);}
 travel(p,length){
  let remaining=Math.min(length,90-p.distance);
  for(let guard=0;guard<8&&remaining>1e-7&&p.active;guard++){
   const hit=this.world.trace(p.pos,p.direction,remaining,p.w.radius,p.owner,p.seen);
   if(!hit){p.pos.addScaledVector(p.direction,remaining);p.distance+=remaining;remaining=0;break;}
   p.pos.copy(hit.center||hit.point);p.distance+=hit.distance;remaining-=hit.distance;
   const actor=hit.object.userData?.bot;
   if(actor){const part=actor.isPlayer?this.world.playerPart(hit.point):hit.object.userData.part||'torso',multiplier=part==='head'?p.w.headMultiplier:['leftArm','rightArm','leftLeg','rightLeg'].includes(part)?.75:1,retention=p.w.penetration[p.passed]??0;
    this.damage(p,actor,p.budget*this.curve(p.w,p.distance)*retention*multiplier*(p.w.ammoType==='explosive'?.65:1),part,hit.point,true);p.seen.add(id(actor));p.passed++;
    if(p.w.ammoType==='explosive')this.explosion(p,hit.point.clone().addScaledVector(hit.normal,.02),actor);
    if(p.passed>=p.w.penetration.length||p.w.ammoType==='explosive')p.active=false;
    else{const e=Math.min(.001,remaining);p.pos.addScaledVector(p.direction,e);p.distance+=e;remaining-=e;}
   }else{
    this.world.impact?.(hit,p.w);if(p.w.ammoType==='explosive')this.explosion(p,hit.point.clone().addScaledVector(hit.normal,.02));this.rebound(p,hit);p.active=false;
   }
  }
  if(p.distance>=90-1e-7)p.active=false;
 }
 arcs(){for(const group of this.groups){if(group.arcDone||!group.w.bonus.arc||!group.hits.size)continue;group.arcDone=true;const hits=[...group.hits.values()],direct=hits.filter(h=>h.direct),source=(direct.length?direct.sort((a,b)=>a.distance-b.distance):hits.sort((a,b)=>b.damage-a.damage||a.distance-b.distance||id(a.actor).localeCompare(id(b.actor))))[0],start=source.point.clone(),owner=group.owner,targets=this.world.actors().filter(a=>a!==owner&&!(a.isPlayer&&!owner)&&!a.dead&&a.hp>0&&!group.hits.has(id(a))&&a.pos.clone().add(new T.Vector3(0,1,0)).distanceTo(start)<=4&&this.world.visible(start,a.pos.clone().add(new T.Vector3(0,1,0)))).sort((a,b)=>a.pos.distanceToSquared(start)-b.pos.distanceToSquared(start)||id(a).localeCompare(id(b)));
   const target=targets[0];if(!target)continue;const point=target.pos.clone().add(new T.Vector3(0,1,0));this.world.arc?.(start,point,owner);this.world.damage(target,group.w.baseDamage*group.w.bonus.arc,owner,'torso',point,{modular:true,lifeId:group.lifeId,secondary:true,origin:start,weapon:'Chain damage',impactType:'rail'});
  }this.groups.clear();}
 step(dt){this.clock+=dt;const active=this.items;this.items=[];for(const p of active){this.travel(p,p.w.velocity*dt);if(p.active)this.items.push(p);}this.arcs();this.draw();}
 draw(){let count=0;for(const p of this.items){if(count>=384)break;this.transform.position.copy(p.pos);this.transform.quaternion.setFromUnitVectors(zAxis,p.direction);this.transform.scale.set(p.w.radius*.8,p.w.radius*.8,Math.max(p.w.radius,p.w.velocity*.002));this.transform.updateMatrix();this.mesh.setMatrixAt(count++,this.transform.matrix);}this.mesh.count=count;if(count)this.mesh.instanceMatrix.needsUpdate=true;}
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
