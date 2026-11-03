import {bodyDamage} from './combat.js';
import * as THREE from './vendor/three.module.js';
import {distanceDamage} from './weapon-cycle.js';
// Return grouped direct-hit packets; a cartridge may supply one payload event, never one per pellet.
export function traceCartridges(w,origin,forward,targets,{rounds=w.volley,ads=false,spreadScale=1,random=Math.random}={}){
 const ray=new THREE.Raycaster(),right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize(),vertical=new THREE.Vector3().crossVectors(right,forward).normalize();
 const hits=new Map(),traces=[],blasts=[],arcs=[];
 for(let round=0;round<rounds;round++){
  const barrel=(round-(rounds-1)/2)*THREE.MathUtils.degToRad(w.separation||0);let primary=null,arcTarget=null;
  for(let p=0;p<w.pellets;p++){
   const core=w.payload==='buckshot'&&(w.precision||p<4),spread=(core?.016*w.core:w.spread)*(ads?.72:1)*spreadScale;
   const pair=w.payload==='duplex'?(p-(w.pellets-1)/2)*THREE.MathUtils.degToRad(ads?w.adsSeparation:w.payloadSeparation):0;
   const direction=forward.clone().addScaledVector(right,Math.tan(barrel+pair)+(random()-.5)*spread).addScaledVector(vertical,(random()-.5)*spread).normalize();ray.set(origin,direction);ray.far=90;
   const seen=new Set(),intersections=ray.intersectObjects(targets,false);let endpoint=origin.clone().addScaledVector(direction,70),passed=0;
   for(const hit of intersections){
    const b=hit.object.userData.bot;endpoint=hit.point;
    if(!primary)primary=hit;
    if(!b){traces.push({point:hit.point,hit,pellet:p,round,wall:true});break;}
    if(seen.has(b))continue;seen.add(b);
    const multiplier=w.penetration[Math.min(passed,w.penetration.length-1)]??0;if(passed>=w.penetration.length)break;
    const part=hit.object.userData.part||'torso',head=part==='head',damage=bodyDamage(w.damage*distanceDamage(w,hit.distance)*multiplier,part);
    const packet=hits.get(b)||{damage:0,headDamage:0,part,point:hit.point.clone(),headPoint:null,parts:[]};packet.damage+=damage;packet.parts.push({part,damage});packet.part=part;if(head){packet.headDamage+=damage;packet.headPoint=hit.point.clone()}hits.set(b,packet);
    if(!b.dead&&b.hp>0&&!arcTarget)arcTarget=b;
    passed++;if(passed>=w.penetration.length)break;
   }
   traces.push({point:endpoint,pellet:p,round});
  }
  if(primary&&w.splash>0)blasts.push({point:primary.point.clone(),bot:primary.object.userData.bot||null,damage:w.splash,radius:w.blast});
  if(arcTarget&&w.arc)arcs.push({bot:arcTarget,damage:w.arc,range:w.arcRange});
 }
 return{hits,traces,blasts,arcs};
}
