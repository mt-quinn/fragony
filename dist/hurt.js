// Real-time feedback: independent of simulation slow motion and damage cadence.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
export const HURT={directionLife:2,nearMissLife:.65,maxDirections:8,lowHealth:.55,criticalHealth:.25};
export class HurtFeedback{
 constructor(){this.reset()}
 reset(){this.directions=[];this.flash=0;this.low=0;this.clock=0;this.beatIn=0}
 cue(bearing,sourceId,kind,strength){
  if(!Number.isFinite(bearing))return;
  // Identity, not angular proximity: two shooters at the same bearing stay distinct.
  let cue=this.directions.find(c=>sourceId!=null?c.sourceId===sourceId:c.sourceId==null&&Math.abs(angle(c.bearing-bearing))<.2);
  if(!cue){cue={sourceId,bearing,hitLeft:0,nearLeft:0,strength:0,lane:0};this.directions.push(cue)}
  cue.bearing=bearing;
  if(kind==='hit'){cue.hitLeft=HURT.directionLife;cue.strength=Math.max(cue.strength,strength)}else cue.nearLeft=HURT.nearMissLife;
  const occupied=new Set(this.directions.filter(c=>c!==cue&&Math.abs(angle(c.bearing-bearing))<1.2).map(c=>c.lane));
  if(occupied.has(cue.lane)){cue.lane=0;while(occupied.has(cue.lane))cue.lane++}
  if(this.directions.length>HURT.maxDirections){const expendable=this.directions.filter(c=>c!==cue).sort((a,b)=>(a.hitLeft>0)-(b.hitLeft>0)||Math.max(a.hitLeft,a.nearLeft)-Math.max(b.hitLeft,b.nearLeft));this.directions.splice(this.directions.indexOf(expendable[0]),1)}
 }
 hit(damage,maxHealth,bearing=null,sourceId=null){
  if(!(damage>0))return;
  this.flash=Math.max(this.flash,clamp(.25+damage/maxHealth,0,.75));
  this.cue(bearing,sourceId,'hit',clamp(damage/maxHealth*2,.35,1));
 }
 nearMiss(bearing,sourceId){this.cue(bearing,sourceId,'near',.35)}
 step(dt,health,maxHealth,yaw,{alive=true,motion=1}={}){
  if(!alive){this.reset();return{directions:[],edge:0,flash:0,critical:false,beat:false,pulse:0}}
  const ratio=clamp(health/maxHealth),severity=clamp((HURT.lowHealth-ratio)/HURT.lowHealth),critical=ratio<=HURT.criticalHealth;
  this.clock+=dt;this.flash=Math.max(0,this.flash-dt*2.1);
  // Recovery fades quickly; damage gets a crisp but non-flashing response.
  this.low+=(severity-this.low)*(1-Math.exp(-dt*(severity>this.low?12:7)));
  this.directions=this.directions.filter(c=>{c.hitLeft=Math.max(0,c.hitLeft-dt);c.nearLeft=Math.max(0,c.nearLeft-dt);return c.hitLeft>0||c.nearLeft>0});
  this.beatIn-=dt;let beat=false;
  if(critical&&this.beatIn<=0){beat=true;this.beatIn=.85+ratio*1.4}
  if(!critical)this.beatIn=0;
  const pulse=critical?(1+Math.sin(this.clock*5.5))*.5:0;
  return{directions:this.directions.map(c=>({sourceId:c.sourceId,kind:c.hitLeft>0?'hit':'near',lane:c.lane,rotation:angle(yaw-c.bearing+Math.PI),scale:1+c.lane*.13,opacity:c.hitLeft>0?Math.min(1,c.hitLeft/.6)*(.8+c.strength*.2):Math.min(1,c.nearLeft/.35)*.65})),edge:clamp(this.low*(.6+pulse*.1*motion),0,.65),flash:this.flash,critical,beat,pulse};
 }
}

// Only the travelled bullet segment counts. A wall hit before the player cannot suppress through cover.
export function nearMissSegment(start,end,eye,radius=1.5){
 const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z,length2=dx*dx+dy*dy+dz*dz;
 if(length2<1e-8)return null;
 const center={x:eye.x,y:eye.y-.65,z:eye.z},t=((center.x-start.x)*dx+(center.y-start.y)*dy+(center.z-start.z)*dz)/length2;
 if(t<=0||t>=1)return null;
 const point={x:start.x+t*dx,y:start.y+t*dy,z:start.z+t*dz},distance=Math.hypot(point.x-center.x,point.y-center.y,point.z-center.z);
 return distance<radius?{point,distance}:null;
}
