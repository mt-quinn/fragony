import {canOccupy} from './collision.js';
import {inBlock} from './geometry.js';
// Demand-driven lifts: approach either landing to call; boarding sends it to the
// other floor after a short dwell. World-time movement carries existing velocity.
export class ElevatorSystem{
 constructor(definitions,blocks){
  this.staticBlocks=blocks.filter(b=>!b.dynamic);
  this.lifts=definitions.map(d=>{const block={x:d.x,z:d.z,w:d.w,d:d.d,bottom:d.low-.28,top:d.low,dynamic:true,id:d.id};blocks.push(block);return{...d,y:d.low,target:d.low,wait:.65,idle:0,calls:new Set(),block}});
 }
 request(lift,floor){if(Math.abs(lift.y-floor)>.08||Math.abs(lift.target-floor)>.08)lift.calls.add(floor)}
 reset(){for(const l of this.lifts){l.y=l.target=l.low;l.wait=.65;l.idle=0;l.calls.clear();l.block.top=l.low;l.block.bottom=l.low-.28;l.mesh?.position.set(l.x,l.y,l.z)}}
 step(dt,actors){
  for(const l of this.lifts){
   const riders=actors.filter(a=>Math.abs(a.feet()-l.y)<.12&&a.velocityY()<=.15&&inBlock(l.block,a.x(),a.z(),-.16));
   for(const a of actors)for(const floor of [l.low,l.high])if(Math.abs(a.feet()-floor)<.35&&Math.hypot(a.x()-l.entry.x,a.z()-l.entry.z)<2.5)this.request(l,floor);
   if(Math.abs(l.target-l.y)<1e-6){
    l.wait=Math.max(0,l.wait-dt);l.idle+=dt;l.calls.delete(l.y);
    if(l.wait<=0){const other=l.y===l.low?l.high:l.low;if(riders.length||l.calls.has(other)||l.y===l.high&&l.idle>2){l.target=other;l.calls.delete(other);l.idle=0}}
   }
   const dy=Math.sign(l.target-l.y)*Math.min(Math.abs(l.target-l.y),7*dt);
   if(dy){
    // Check the carried body and the swept slab before moving. A blocked lift
    // reverses without moving a player into a ceiling or snapping them elsewhere.
    const unsafe=riders.some(a=>!canOccupy(this.staticBlocks,{x:a.x(),z:a.z(),feet:a.feet()+dy,radius:a.radius||.4,height:a.height()}))||actors.some(a=>!riders.includes(a)&&inBlock(l.block,a.x(),a.z(),a.radius||.4)&&a.feet()<l.y+dy-.001&&a.feet()+a.height()>l.y+dy-.28);
    if(unsafe){l.target=dy>0?l.low:l.high;l.wait=.65;continue}
    l.y+=dy;l.block.top=l.y;l.block.bottom=l.y-.28;
    for(const a of riders)a.carry(dy);
    l.mesh?.position.set(l.x,l.y,l.z);
    if(Math.abs(l.y-l.target)<1e-6){l.wait=.8;l.idle=0}
   }
  }
 }
}
