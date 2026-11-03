import {rivalCombat} from './rivals.js';
import {healthAfterPickup} from './pickups.js';
import {IMPACT} from './impact.js';
import { inBlock, blockedAt, surfaceAt, launchTime,blockSpan,nearBlocks } from './geometry.js';
// All campaign difficulty and personality controls live here. Distances are metres;
// timing uses world seconds, so slow motion affects thinking, aim and movement alike.
export const AI_TUNING = {
  progressionRounds: 30,
  early: { slideSkill: .15, speed: 4.8, reaction: .4, aimError: .045, memory: 1.8, think: .72, rest: 1, aggression: .7, dodgeChance: .25, dodgeReaction: .32 },
  late: { slideSkill: .9, speed: 6.6, reaction: .105, aimError: .004, memory: 4.5, think: .18, rest: .12, aggression: 1.4, dodgeChance: .8, dodgeReaction: .12 },
  senses: { interval: .16, range: 35, fieldOfView: 220, hearing: 23 },
  fairness: { spawnGrace: 1.05, maxPlayerAttackers: 2, targetCommitment: 1.2 },
  navigation: { repath: .85, stuckRepath: .6, retreatHealth: 35, pickupRespawn: 15 },
  combat: { attackCommitment: .85, repositionAfter: 2.6, pressureReposition: 24, acceleration: 13, detourBudget: 2.8 },
  weapons: {
    pistol: { damage: 42, interval: .58, burst: 1, rest: .35, magazine: 7, reload: 1.65, windup: .18, range: 30, idealRange: 14, spread: .004 },
    rifle:   { damage: 16, interval: .15, burst: 3, rest: .7, magazine: 18, reload: 1.7, windup: .12, range: 30, idealRange: 16, spread: .008 },
    smg:     { damage: 9, interval: .085, burst: 6, rest: .7, magazine: 30, reload: 1.5, windup: .08, range: 21, idealRange: 7, spread: .028 },
    shotgun: { damage: 8, pellets: 8, interval: .9, burst: 1, rest: .65, magazine: 6, reload: 1.9, windup: .27, range: 23, idealRange: 8, spread: .07 },
    rail:    { damage: 65, interval: 1.3, burst: 1, rest: .95, magazine: 3, reload: 2, windup: .8, range: 37, idealRange: 23, spread: 0 },
    rocket:  { damage: 0, splashScale: .72, interval: 1.1, burst: 1, rest: .8, magazine: 4, reload: 2, windup: .5, range: 29, idealRange: 15, spread: .012 }
  },
  profiles: [
    { name: 'rusher', weapon: 'smg', preferredRange: 7, aggression: 1.25, highGround: .15, flank: .3, caution: .65 },
    { name: 'duelist', weapon: 'rifle', preferredRange: 13, aggression: .9, highGround: .5, flank: .4, caution: 1 },
    { name: 'marksman', weapon: 'rail', preferredRange: 22, aggression: .6, highGround: 1.5, flank: .2, caution: 1.2 },
    { name: 'flanker', weapon: 'shotgun', preferredRange: 8, aggression: 1, highGround: .6, flank: 1.3, caution: .9 },
    { name: 'demolition', weapon: 'rocket', preferredRange: 15, aggression: .85, highGround: 1, flank: .5, caution: 1.1 }
  ]
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y||0)-(b.y||0),a.z-b.z);
const horizontal=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const copy=p=>({x:p.x,y:p.y||0,z:p.z});
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function difficultyForRound(round,tuning=AI_TUNING){
  const t=clamp((round-1)/tuning.progressionRounds,0,1),e=Math.pow(t,.65);
  if(t===1)return {...tuning.late};
  return Object.fromEntries(Object.keys(tuning.early).map(k=>[k,tuning.early[k]+(tuning.late[k]-tuning.early[k])*e]));
}
export function solidAt(blocks,x,z,y,r=.38,step=.32){return blockedAt(blocks,x,z,y,r,1.9,step)}
function clearSegment(blocks,a,b,action='walk',query=null,stepHeight=.3){
 // A descending edge must leave the upper floor, not point through it.
 if(action==='drop'&&surfaceAt(query?query(b.x,b.z):blocks,b.x,b.z,a.y)>b.y+.31)return false;
 const steps=Math.ceil(Math.max(horizontal(a,b),Math.abs(a.y-b.y))*4);
 for(let i=0;i<=steps;i++){
  const t=i/Math.max(1,steps),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=action==='drop'?a.y:action==='jump'?Math.max(a.y,b.y)+Math.sin(t*Math.PI)*.8:a.y+(b.y-a.y)*t,near=query?query(x,z):blocks;
  if(solidAt(near,x,z,y,.38,stepHeight+.02))return false;
  if(action==='walk'&&surfaceAt(near,x,z,y)<y-.34)return false;
 }return true;
}
export function buildNavigation(blocks,pads=[],anchors=null,options={}){
 const boundX=options.bounds?.x??Math.max(...blocks.map(b=>Math.abs(b.x)+b.w/2))-.8,boundZ=options.bounds?.z??Math.max(...blocks.map(b=>Math.abs(b.z)+b.d/2))-.8,maxHeight=options.maxHeight??8;
 const nodes=[],columns=new Map(),spatial=new Map(),query=(x,z)=>spatial.get(`${Math.round(x)},${Math.round(z)}`)||[];
 // One small neighborhood per grid cell avoids scanning the whole map for each edge.
 for(const b of blocks){const c=Math.abs(Math.cos(b.yaw||0)),s=Math.abs(Math.sin(b.yaw||0)),wx=(b.w*c+b.d*s)/2+1.2,dz=(b.w*s+b.d*c)/2+1.2;for(let x=Math.floor(b.x-wx);x<=Math.ceil(b.x+wx);x++)for(let z=Math.floor(b.z-dz);z<=Math.ceil(b.z+dz);z++){const key=`${x},${z}`;if(!spatial.has(key))spatial.set(key,[]);spatial.get(key).push(b)}}
 for(let x=Math.ceil(-boundX+.5);x<=Math.floor(boundX-.5);x++)for(let z=Math.ceil(-boundZ+.5);z<=Math.floor(boundZ-.5);z++){
  const near=query(x,z),heights=new Set(options.noGround?[]:[0]);for(const b of near)if(b.top>0&&b.top<=maxHeight&&b.w>=(options.noGround?.2:.75)&&b.d>=(options.noGround?.2:.75)&&inBlock(b,x,z,options.noGround?0:-.38)){const span=blockSpan(b,x,z,.38);if(span)heights.add(Math.round(span.top*1000)/1000);}
  for(const w of options.water||[]){const span=blockSpan(w,x,z);if(span)for(let y=Math.max(2,Math.ceil(span.bottom));y<span.top;y+=4)heights.add(y);if(span)heights.add(span.top-.75)}
  for(const y of heights){if(solidAt(near,x,z,y,.38,(options.stepHeight??.3)+.02))continue;const wet=(options.water||[]).some(w=>{const span=blockSpan(w,x,z);return span&&y>=span.bottom&&y<span.top});if(wet&&(x%2||z%2))continue;const n={id:nodes.length,x,y,z,wet,edges:[]};nodes.push(n);const key=`${x},${z}`;if(!columns.has(key))columns.set(key,[]);columns.get(key).push(n)}
 }
 for(const n of nodes)for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]])for(const m of columns.get(`${n.x+dx},${n.z+dz}`)||[]){
  const rise=m.y-n.y;if(n.wet||m.wet){if(Math.abs(rise)>4.1)continue;if(clearSegment(blocks,n,m,'swim',query,options.stepHeight??.3))n.edges.push({node:m,action:'swim',cost:distance(n,m)*1.3});continue}if(rise>1.35||rise< -8.1)continue;const action=rise>(options.stepHeight??.3)?'jump':rise< -.3?'drop':'walk';if(clearSegment(blocks,n,m,action,query,options.stepHeight??.3))n.edges.push({node:m,action,cost:distance(n,m)+(action==='walk'?0:1.2)});
 }
 for(const column of columns.values())for(const n of column)if(n.wet)for(const m of column)if(n!==m&&Math.abs(n.y-m.y)<=4.1&&clearSegment(blocks,n,m,'swim',query,options.stepHeight??.3))n.edges.push({node:m,action:'swim',cost:distance(n,m)*1.3});
 const navigation={nodes,blocks,stepHeight:options.stepHeight??.3,pads:[],anchors:[],bounds:{x:boundX,z:boundZ}};
 for(const p of pads){const from=nearestNode(navigation,{x:p.x,y:p.y||0,z:p.z}),to=nearestNode(navigation,p.landing);if(from&&to&&Math.abs(to.y-p.landing.y)<.35&&Math.abs(from.y-(p.y||0))<.35){const pad={x:p.x,y:p.y||0,z:p.z,power:p.power||16.5,triggerRadius:p.triggerRadius,landing:{...p.landing}};from.edges.push({node:to,action:'pad',cost:horizontal(from,to)*.5+3,pad});navigation.pads.push({from,to,...pad})}}
 for(const lift of options.elevators||[]){const from=nearestNode(navigation,{...lift.entry,y:lift.low}),to=nearestNode(navigation,{...lift.entry,y:lift.high});if(from&&to&&Math.abs(from.y-lift.low)<.35&&Math.abs(to.y-lift.high)<.35){from.edges.push({node:to,action:'elevator',cost:8,lift,fromY:lift.low});to.edges.push({node:from,action:'elevator',cost:8,lift,fromY:lift.high})}}
 for(const [x,y,z]of anchors||[]){const n=nearestNode(navigation,{x,y,z});if(n&&!navigation.anchors.includes(n))navigation.anchors.push(n)}
 if(options.noGround&&anchors?.length){const start=nearestNode(navigation,{x:anchors[0][0],y:anchors[0][1],z:anchors[0][2]}),seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++)for(const e of queue[i].edges)if(!seen.has(e.node)){seen.add(e.node);queue.push(e.node)}navigation.nodes=nodes.filter(n=>seen.has(n));navigation.nodes.forEach((n,i)=>n.id=i);navigation.anchors=navigation.anchors.filter(n=>seen.has(n))}
 return navigation;
}
export function nearestNode(navigation,pos){
  let best=null,score=Infinity;for(const n of navigation.nodes){const s=(n.x-pos.x)**2+(n.z-pos.z)**2+((n.y-(pos.y||0))*3)**2;if(s<score){score=s;best=n}}return best;
}
// A* with a small binary heap: route costs can discourage moving toward a threat.
export function findRoute(navigation,from,to,{avoid=null,aggression=1}={}){
  const start=nearestNode(navigation,from),goal=nearestNode(navigation,to);if(!start||!goal)return [];
  const heap=[],cost=new Map([[start,0]]),parents=new Map(),closed=new Set();
  const push=(n,f)=>{let i=heap.length;heap.push({n,f});while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p}heap[i]={n,f}};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let c=i*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c}heap[i]=last}return first.n};
  push(start,distance(start,goal));while(heap.length){const n=pop();if(closed.has(n))continue;if(n===goal)break;closed.add(n);
    for(const edge of n.edges){const m=edge.node,exposure=avoid?Math.max(0,10-horizontal(m,avoid))*.15/Math.max(.2,aggression):0,next=cost.get(n)+edge.cost+exposure;
      if(next<(cost.get(m)??Infinity)){cost.set(m,next);parents.set(m,{n,edge});push(m,next+distance(m,goal))}}
  }
  const final=navigation.blocks&&Math.abs(goal.y-(to.y||0))<.35&&clearSegment(navigation.blocks,goal,to,'walk',null,navigation.stepHeight)?[{...copy(to),action:'walk',fine:true}]:[];
  if(start===goal)return final.length?final:[{...copy(goal),action:'walk',fine:true}];if(!parents.has(goal))return [];
  const path=[];let n=goal;while(n!==start){const {n:previous,edge}=parents.get(n);path.unshift({...copy(n),action:edge.action,pad:edge.pad,lift:edge.lift,fromY:edge.fromY});n=previous}return path.concat(final);
}
export class ArenaAI{
  constructor({navigation,world,round=1,tuning=AI_TUNING,random=Math.random}){
    Object.assign(this,{navigation,world,tuning,random});this.difficulty=difficultyForRound(round,tuning);this.clock=0;this.brains=new Map();
    // A row of health items represents one patrol destination, not ten votes
    // for the same room. Keep spatially distinct routes at equal weight.
    this.patrolAnchors=[];for(const n of navigation.anchors)if(!this.patrolAnchors.some(p=>distance(p,n)<18))this.patrolAnchors.push(n);
    this.localNodes=new Map();for(const n of navigation.nodes){const key=Math.round(n.x)+','+Math.round(n.z);if(!this.localNodes.has(key))this.localNodes.set(key,[]);this.localNodes.get(key).push(n)}
    this.stats={shots:0,spotted:0,pads:0,drops:0,pickups:0,dodges:0,switches:0,weapons:{},repaths:0,stuckRecoveries:0,goals:{},actions:{},staggers:0,detours:0,slides:0,slideReasons:{}};
  }
  reset(bot,index=0){
    const profile=this.tuning.profiles[index%this.tuning.profiles.length],loadout=(bot.loadout||[profile.weapon]).filter(w=>this.tuning.weapons[w]),weaponType=loadout.includes(profile.weapon)?profile.weapon:loadout[0],weapon=this.world.weapon?.(bot,weaponType)||this.tuning.weapons[weaponType];
    const brain={profile,index,loadout,weaponType,preferredRange:weapon.idealRange*.8+profile.preferredRange*.2,magazines:Object.fromEntries(loadout.map(w=>[w,(this.world.weapon?.(bot,w)||this.tuning.weapons[w]).magazine])),weaponHeld:0,weaponDecisionIn:0,swapIn:0,spawnAt:this.clock,facing:Math.atan2(-bot.pos.x,-bot.pos.z),memory:new Map(),target:null,visible:false,reaction:0,
      senseIn:this.random()*.15,thinkIn:.15+this.random()*.35,path:[],pathIn:0,goal:null,goalAge:0,visits:new Map(),tiers:new Map(),lastSeen:null,regionOrigin:copy(bot.pos),regionAge:0,roamUntil:0,
      aim:copy(bot.pos),aimReady:false,aimBias:{x:0,y:0},biasIn:0,strafe:this.random()<.5?-1:1,strafeIn:.7+this.random()*.7,
      action:'travel',actionAt:this.clock,actionReason:'spawn',exposure:0,pressure:0,recover:0,recoverCooldown:0,moveX:0,moveZ:0,detour:null,detourIn:0,
      ammo:weapon.magazine,reload:0,charge:0,cool:.5,rest:0,burst:0,underFire:0,stuck:0,previous:copy(bot.pos),flight:null,weapon,dodge:null,dodgeCooldown:0};
    this.brains.set(bot,brain);bot.brain=brain;bot.vy=0;this.world.equip?.(bot,weaponType);return brain;
  }
  hear(pos,source,range=this.tuning.senses.hearing){
    for(const [bot,b]of this.brains){if(bot===source||bot.dead||distance(bot.pos,pos)>range)continue;
      // A sound gives a search location, never sight or a firing solution.
      b.heard={pos:copy(pos),at:this.clock,source:typeof source==='string'?source:source?.name};if(!b.target)b.thinkIn=Math.min(b.thinkIn,.2);
    }
  }
  damaged(bot,source,impact={}){
    const b=this.brains.get(bot);if(!b)return;b.underFire=1.8;b.pressure=Math.min(100,b.pressure+(impact.damage||12));
    if(impact.stagger&&b.recoverCooldown<=0){b.recover=impact.duration||IMPACT.recovery;b.recoverCooldown=IMPACT.cooldown;b.charge=0;b.burst=0;b.dodge=null;this.setAction(b,'recover','heavy impact');this.stats.staggers++}
    if(source){b.heard={pos:copy(source.pos),at:this.clock,source:source.id};b.thinkIn=0}
  }
  setAction(b,type,reason){
    if(b.action===type)return;
    b.action=type;b.actionAt=this.clock;b.actionReason=reason;this.stats.actions[type]=(this.stats.actions[type]||0)+1;
    this.world.action?.(b,type,reason);
  }
  walkClear(from,to){
    return !this.navigation.blocks||clearSegment(this.navigation.blocks,from,to,'walk',(x,z)=>nearBlocks(this.navigation.blocks,x,z),this.navigation.stepHeight??.3);
  }
  localPosition(pos){
    let best=null,score=Infinity;
    for(let x=Math.round(pos.x)-1;x<=Math.round(pos.x)+1;x++)for(let z=Math.round(pos.z)-1;z<=Math.round(pos.z)+1;z++)for(const n of this.localNodes.get(x+','+z)||[]){const d=distance(n,pos);if(Math.abs(n.y-pos.y)<.4&&d<score){best=n;score=d}}
    return best;
  }
  combatPosition(bot,b,m,defensive=false){
    let best=null,score=-Infinity;const currentRange=horizontal(bot.pos,m.pos),currentBearing=Math.atan2(bot.pos.x-m.pos.x,bot.pos.z-m.pos.z);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4+currentBearing,r=defensive?4.5:3.5,n=this.localPosition({x:bot.pos.x+Math.sin(angle)*r,y:bot.pos.y,z:bot.pos.z+Math.cos(angle)*r});
      if(!n||horizontal(bot.pos,n)<2||!this.walkClear(bot.pos,n))continue;
      const eye={x:n.x,y:n.y+1.3,z:n.z},los=this.world.canSee(m.eye,eye),range=horizontal(n,m.pos),angleGain=Math.abs(angleDelta(Math.atan2(n.x-m.pos.x,n.z-m.pos.z),currentBearing));
      if(!defensive&&!los)continue;
      const value=(defensive?(!los?14:0)+(range-currentRange)*.8:angleGain*12-Math.abs(range-b.preferredRange)*.8)-horizontal(bot.pos,n)*.3;
      if(value>score){best=n;score=value}
    }
    return best;
  }
  actors(){return this.world.actors().filter(a=>a.alive)}
  perceive(bot,b,actors){
    const origin={x:bot.pos.x,y:bot.pos.y+1.5,z:bot.pos.z};let candidate=null,best=-Infinity;
    const attackers=[...this.brains.values()].filter(v=>v.target==='player'&&v.visible&&this.clock-v.spawnAt>this.tuning.fairness.spawnGrace).length;
    for(const a of actors){if(a.id===bot.name||a.spawnAge<this.tuning.fairness.spawnGrace)continue;
      const d=distance(bot.pos,a.pos),bearing=Math.atan2(a.pos.x-bot.pos.x,a.pos.z-bot.pos.z);
      if(d>this.tuning.senses.range||Math.abs(angleDelta(bearing,b.facing))>this.tuning.senses.fieldOfView*Math.PI/360)continue;
      if(!this.world.canSee(origin,a.eye))continue;
      const previous=b.memory.get(a.id),v=previous&&this.clock>previous.at?{x:(a.pos.x-previous.pos.x)/(this.clock-previous.at),y:0,z:(a.pos.z-previous.pos.z)/(this.clock-previous.at)}:{x:0,y:0,z:0};
      b.memory.set(a.id,{pos:copy(a.pos),eye:copy(a.eye),velocity:v,at:this.clock});
      let score=30-d*.7+(a.id===b.target?9:0)+(a.hp<35?3:0)+(b.underFire>0&&b.heard?.source===a.id?8:0);
      if(a.id==='player'&&(b.target!=='player'||!b.visible)&&attackers>=this.tuning.fairness.maxPlayerAttackers)continue;
      if(score>best){candidate=a;best=score}
    }
    const remembered=b.target&&b.memory.get(b.target);
    if(candidate&&candidate.id!==b.target){
      const committed=remembered&&this.clock-b.targetAt<this.tuning.fairness.targetCommitment&&this.clock-remembered.at<.3;
      if(!committed){b.target=candidate.id;b.targetAt=this.clock;b.reaction=this.difficulty.reaction*(.85+this.random()*.3);b.aimReady=false;b.charge=0;b.thinkIn=0;this.stats.spotted++}
    }
    const memory=b.memory.get(b.target),wasVisible=b.visible;
    b.visible=!!memory&&this.clock-memory.at<this.tuning.senses.interval*1.5;
    if(b.visible&&!wasVisible)b.reaction=Math.max(b.reaction,this.difficulty.reaction*.65);
    if(memory&&this.clock-memory.at>this.difficulty.memory){b.target=null;b.visible=false;b.charge=0;b.thinkIn=0}
    for(const [id,m]of b.memory)if(this.clock-m.at>this.difficulty.memory)b.memory.delete(id);
  }
  noticeProjectiles(bot,b){
    if(b.flight||b.recover>0||b.dodgeCooldown>0||this.clock-b.spawnAt<this.tuning.fairness.spawnGrace)return;
    for(const r of this.world.projectiles?.()||[]){
      if(r.owner===bot||distance(bot.pos,r.pos)>11)continue;
      const dx=bot.pos.x-r.pos.x,dz=bot.pos.z-r.pos.z,speed=Math.hypot(r.velocity.x,r.velocity.z),approach=(dx*r.velocity.x+dz*r.velocity.z)/Math.max(.1,speed);
      const sideDistance=Math.abs(dx*r.velocity.z-dz*r.velocity.x)/Math.max(.1,speed);
      if(!r.grenade&&(approach<0||sideDistance>2.6))continue;
      const bearing=Math.atan2(r.pos.x-bot.pos.x,r.pos.z-bot.pos.z);
      if(Math.abs(angleDelta(bearing,b.facing))>Math.PI*.65||!this.world.canSee({x:bot.pos.x,y:bot.pos.y+1.3,z:bot.pos.z},r.pos))continue;
      b.dodgeCooldown=1.5;
      if(this.random()>this.difficulty.dodgeChance)return;
      let choice=null,best=-Infinity;
      for(const side of [b.strafe,-b.strafe]){const x=r.grenade?dx+side*dz*.5:r.velocity.z*side,z=r.grenade?dz-side*dx*.5:-r.velocity.x*side,d=Math.max(.01,Math.hypot(x,z)),floor=this.navigation.blocks?surfaceAt(this.navigation.blocks,bot.pos.x,bot.pos.z,bot.pos.y):bot.pos.y,from={...bot.pos,y:floor},to={x:bot.pos.x+x/d*2.2,y:floor,z:bot.pos.z+z/d*2.2};
        if(!this.walkClear(from,to))continue;const value=horizontal(to,r.pos);if(value>best){best=value;choice={x,z}}
      }
      if(choice){b.dodge={delay:this.difficulty.dodgeReaction,left:.38,...choice};this.stats.dodges++}return;
    }
  }
  setGoal(b,type,pos,extra={}){
    const same=b.goal?.type===type&&horizontal(b.goal,pos)<1&&Math.abs(b.goal.y-pos.y)<.4;
    if(!same){b.goal={type,...copy(pos),...extra};b.goalAge=0;b.pathIn=0;b.detour=null;this.stats.goals[type]=(this.stats.goals[type]||0)+1}
    if(b.recover<=0)this.setAction(b,({engage:'attack',search:b.target?'pursue':'search',reload:'reload',heal:'withdraw',retreat:'withdraw',reposition:'reposition',flank:'reposition'})[type]||'travel',extra.reason||'goal '+type);
  }
  chooseRotation(bot,b,minDistance=4){
    let choice=null,score=-Infinity;
    for(const n of this.patrolAnchors){const d=distance(bot.pos,n);if(d<minDistance)continue;
      const recency=this.clock-(b.visits.get(n.id)?? -30);
      const crowd=[...this.brains].reduce((sum,[other,brain])=>sum+(other!==bot&&!other.dead?Math.max(0,1-distance(n,brain.goal||other.pos)/16):0),0);
      const regionalMove=minDistance>=22?Math.min(50,horizontal(bot.pos,n))*.28:0;
      const tierAt=b.tiers.get(Math.round(n.y/4)),tierNovelty=tierAt===undefined?6:clamp(this.clock-tierAt-8,0,24)*.25;
      const value=Math.min(recency,30)*.7+clamp(n.y-bot.pos.y,-3,3)*b.profile.highGround-d*.06-crowd*10+regionalMove+tierNovelty+this.random()*8;
      if(value>score){choice=n;score=value}
    }
    if(choice){this.setGoal(b,'rotate',choice);return true}return false;
  }
  chooseGoal(bot,b){
    if(b.recover>0)return;
    const memory=b.memory.get(b.target),threat=memory?.pos,injured=bot.hp<this.tuning.navigation.retreatHealth*b.profile.caution;
    // A sustained local exchange can turn into a moving disengagement. Keep its
    // route through ordinary pressure, but allow critical survival to override it.
    if(bot.hp>=25&&b.goal?.type==='rotate'&&this.clock<b.roamUntil&&distance(bot.pos,b.goal)>1.2)return;
    if(bot.hp>=25&&b.regionAge>12&&this.chooseRotation(bot,b,22)){b.regionAge=0;b.roamUntil=this.clock+8;return}
    const pickups=this.world.pickups.filter(p=>p.kind!=='pad'&&p.kind!=='focus'&&p.timer<=0);
    let pickup=null,pickupScore=-Infinity;
    for(const p of pickups){const y=p.y||0,position={x:p.x,y,z:p.z};
      const value=(healthAfterPickup(bot.hp,100,p)-bot.hp)*(injured?2:1.25)+(p.amount===50&&bot.hp<200?12:0);
      if(value<=0)continue;const score=value-distance(bot.pos,position)*1.5;
      if(score>pickupScore){pickupScore=score;pickup={...position,pickup:p}}
    }
    if(pickup&&(injured||(!b.visible&&pickupScore>8&&!(b.heard&&this.clock-b.heard.at<this.difficulty.memory)))){this.setGoal(b,injured?'heal':'pickup',pickup,{pickup:pickup.pickup});return}
    if(threat&&(injured||b.reload>0||b.underFire>0&&bot.hp<55)){
      let choice=this.combatPosition(bot,b,memory,true),score=choice?20:-Infinity;
      for(const n of this.navigation.anchors){const travel=distance(bot.pos,n);if(travel>19||travel<2)continue;
        const cover=!this.world.canSee({x:threat.x,y:threat.y+1.4,z:threat.z},{x:n.x,y:n.y+1.3,z:n.z});
        const value=(cover?18:0)+Math.min(24,distance(n,threat))*.6-travel*.75;
        if(value>score){choice=n;score=value}
      }
      if(choice){this.setGoal(b,b.reload>0?'reload':'retreat',choice);return}
    }
    // Keep firing while taking a new route after a prolonged fight in one
    // room. Nearby targets and footstep sounds must not pin every bot forever.
    if(b.goal?.type==='rotate'&&this.clock<b.roamUntil&&distance(bot.pos,b.goal)>1.2)return;
    if(b.regionAge>14&&this.chooseRotation(bot,b,22)){b.regionAge=0;b.roamUntil=this.clock+10;return}
    if(memory&&b.visible){
      const d=distance(bot.pos,memory.pos),age=this.clock-b.actionAt,urgent=b.pressure>this.tuning.combat.pressureReposition||d<b.preferredRange*.55;
      if(b.goal?.type==='reposition'&&b.goalAge<1.7&&distance(bot.pos,b.goal)>1&&!urgent)return;
      if(b.goal?.type==='flank'&&b.goalAge<clamp(distance(bot.pos,b.goal)/this.difficulty.speed+1,2.6,6)&&distance(bot.pos,b.goal)>1.4&&!urgent)return;
      if(age<this.tuning.combat.attackCommitment&&!urgent&&b.goal?.type==='engage')return;
      // A distant high route can improve the actual firing angle. Do not choose
      // a hidden endpoint merely because its goal is named "flank".
      if(!urgent&&d>10&&b.exposure>2.5){
        let choice=null,best=-Infinity;
        for(const n of this.navigation.anchors){const travel=distance(bot.pos,n),range=distance(n,memory.pos),angle=Math.abs(angleDelta(Math.atan2(n.x-memory.pos.x,n.z-memory.pos.z),Math.atan2(bot.pos.x-memory.pos.x,bot.pos.z-memory.pos.z)));
          if(travel<5||travel>23||range<5||range>b.weapon.range||(angle<.35&&n.y-bot.pos.y<2.5)||!this.world.canSee(memory.eye,{x:n.x,y:n.y+1.3,z:n.z}))continue;
          const value=angle*8+clamp(n.y-bot.pos.y,-4,4)*1.5-Math.abs(range-b.preferredRange)*.6-travel*.3;
          if(value>best){choice=n;best=value}
        }
        if(choice&&best>2){this.setGoal(b,'flank',choice,{reason:'better angle or elevation'});b.exposure=0;return}
      }
      if(urgent||b.exposure>this.tuning.combat.repositionAfter||b.burst===0&&b.rest>.2&&age>1.1){
        const position=this.combatPosition(bot,b,memory,urgent);
        if(position){this.setGoal(b,'reposition',position,{reason:urgent?'pressure or unsafe range':'burst finished or angle exposed'});b.exposure=0;b.pressure*=.35;return}
      }
      this.setGoal(b,'engage',memory.pos);this.setAction(b,'attack','usable firing solution');return;
    }
    if(memory){this.setGoal(b,'search',memory.pos);return}
    if(b.heard&&this.clock-b.heard.at<this.difficulty.memory){this.setGoal(b,'search',b.heard.pos);return}
    // Finish long rotations instead of choosing another nearby base after 3.8s.
    const commitment=b.goal?.type==='rotate'?Math.min(40,8+distance(bot.pos,b.goal)/this.difficulty.speed*2):3.8;
    if(b.goal&&b.goalAge<commitment&&distance(bot.pos,b.goal)>1.2)return;
    this.chooseRotation(bot,b);
  }
  pickRouteDetour(bot,b){
    b.detourIn=1.6;if(!b.path.length)return;
    const candidates=this.world.pickups.filter(p=>p.kind==='health'&&p.amount===5&&p.timer<=0&&healthAfterPickup(bot.hp,100,p)>bot.hp&&distance(bot.pos,p)<6).sort((a,c)=>distance(bot.pos,a)-distance(bot.pos,c)).slice(0,2);
    const routeLength=(from,path)=>{let length=0;for(const n of path){length+=distance(from,n);from=n}return length};
    for(const p of candidates){
      const join=b.path.findIndex(n=>distance(n,p)<1.7);if(join<0)continue;
      const to=findRoute(this.navigation,bot.pos,p),back=findRoute(this.navigation,p,b.path[join]);if(!to.length||!back.length)continue;
      const extra=routeLength(bot.pos,to)+routeLength(p,back)-routeLength(bot.pos,b.path.slice(0,join+1));
      if(extra>this.tuning.combat.detourBudget)continue;
      b.detour={...copy(p),pickup:p};b.path=to;b.pathIn=1;this.stats.detours++;return;
    }
  }
  chooseStrafe(bot,b){
    const m=b.memory.get(b.target);b.strafeIn=.9+this.random()*.7;if(!m||!b.visible)return;
    const d=horizontal(bot.pos,m.pos)||1,dx=(m.pos.x-bot.pos.x)/d,dz=(m.pos.z-bot.pos.z)/d;
    let best=-Infinity,side=b.strafe;
    for(const sign of [b.strafe,-b.strafe]){
      const to={x:bot.pos.x+dz*sign*1.8,y:bot.pos.y,z:bot.pos.z-dx*sign*1.8};if(!this.walkClear(bot.pos,to))continue;
      const los=this.world.canSee({x:to.x,y:to.y+1.3,z:to.z},m.eye),value=(los?2:0)+(sign===b.strafe?.6:0)+(b.pressure>12&&sign!==b.strafe?1.5:0)+this.random()*.7;
      if(value>best){best=value;side=sign}
    }
    b.strafe=side;
  }
  navigate(bot,b,dt){
    if(b.liftRide){this.world.elevator?.(bot,b,dt);return}
    if(!b.goal)return;
    // Plant for the final rail wind-up; the visible crouched brace is also a dodge window.
    if(!b.slide?.active&&b.weaponType==='rail'&&b.charge>.2&&b.visible&&b.goal.type==='engage'&&!b.underFire&&!b.dodge&&!b.flight){b.moveX=b.moveZ=0;this.setAction(b,'brace','precision windup');return}
    if(b.flight){this.world.move(bot,b.flight.vx*dt,b.flight.vz*dt);return}
    if(b.dodge){b.dodge.delay-=dt;if(b.dodge.delay<=0){const d=Math.max(.01,Math.hypot(b.dodge.x,b.dodge.z)),step=this.difficulty.speed*1.2*dt,next={x:bot.pos.x+b.dodge.x/d*step*4,y:bot.pos.y,z:bot.pos.z+b.dodge.z/d*step*4};if(this.walkClear(bot.pos,next)){this.setAction(b,'dodge','perceived projectile');this.world.move(bot,b.dodge.x/d*step,b.dodge.z/d*step)}b.dodge.left-=dt;if(b.dodge.left<=0){b.dodge=null;b.thinkIn=0;b.moveX=b.moveZ=0}return}}
    b.pathIn-=dt;
    if(b.detour&&(b.detour.pickup.timer>0||horizontal(bot.pos,b.detour)<.6)){b.detour=null;b.pathIn=0}
    if(b.pathIn<=0){b.path=findRoute(this.navigation,bot.pos,b.detour||b.goal,{avoid:['retreat','heal','reload','reposition'].includes(b.goal.type)?b.memory.get(b.target)?.pos:null,aggression:b.profile.aggression});b.pathIn=this.tuning.navigation.repath+this.random()*.25;this.stats.repaths++;
      if(!b.visible&&!b.detour&&b.detourIn<=0&&['rotate','search'].includes(b.goal.type))this.pickRouteDetour(bot,b);
    }
    while(b.path.length&&horizontal(bot.pos,b.path[0])<(b.path[0].fine?.15:.55)&&Math.abs(bot.pos.y-b.path[0].y)<.65)b.path.shift();
    let destination=b.path[0];const m=b.memory.get(b.target);
    // Strafe in committed legs, never instantaneous direction jitter. Stay on a
    // supported surface and use the route when the enemy is on another level.
    if(destination?.action!=='swim'&&b.goal.type==='engage'&&b.visible&&m&&Math.abs(bot.pos.y-m.pos.y)<1.1&&this.world.canSee({x:bot.pos.x,y:bot.pos.y+1.4,z:bot.pos.z},m.eye)){
      const d=horizontal(bot.pos,m.pos),dx=(m.pos.x-bot.pos.x)/Math.max(.1,d),dz=(m.pos.z-bot.pos.z)/Math.max(.1,d);
      const advance=clamp((d-b.preferredRange)*.25,-1,1)*b.profile.aggression;
      destination={x:bot.pos.x+dx*advance+dz*b.strafe*.65,y:bot.pos.y,z:bot.pos.z+dz*advance-dx*b.strafe*.65,action:'walk'};
      if(!this.walkClear(bot.pos,destination)){b.strafe*=-1;destination=b.path[0];b.thinkIn=0}
    }
    if(!destination)return;
    if(destination.action==='elevator'){b.liftRide={id:destination.lift.id,fromY:destination.fromY,to:copy(destination),phase:'board'};this.world.elevator?.(bot,b,dt);return}
    if(destination.action==='swim')this.world.swim?.(bot,destination,dt);
    if(destination.action==='pad'){
      const pad=destination.pad,target=pad.landing||destination;
      if(horizontal(bot.pos,pad)<(pad.triggerRadius||1.45)&&Math.abs(bot.pos.y-pad.y)<.35){const power=pad.power,flightTime=launchTime(power,target.y-bot.pos.y);b.flight={vx:(target.x-bot.pos.x)/flightTime,vz:(target.z-bot.pos.z)/flightTime,age:0};bot.vy=power;this.stats.pads++;return;}
      destination={x:pad.x,y:pad.y,z:pad.z,action:'walk',fine:true};
    }
    if(destination.action==='jump'&&destination.y>bot.pos.y+.3&&Math.abs(bot.vy)<.01)bot.vy=8.5;
    const d=horizontal(bot.pos,destination);if(d<.05)return;
    const speed=this.difficulty.speed*(bot.rival?.perks.speed?1.2:1)*(b.weapon.native?.move||1)*(b.goal.type==='retreat'||b.goal.type==='heal'?1.08:1)*(b.reload>0?.8:1)*(b.recover>0?.28:1),step=Math.min(d,speed*dt),blend=1-Math.exp(-this.tuning.combat.acceleration*dt);
    if(!b.slide?.active){b.moveX+=((destination.x-bot.pos.x)/d*speed-b.moveX)*blend;b.moveZ+=((destination.z-bot.pos.z)/d*speed-b.moveZ)*blend;}
    if(this.world.slideMove?.(bot,b,dt,destination,speed))return;
    let mx=b.moveX*dt,mz=b.moveZ*dt;
    // Smoothing must not carry a grounded actor over an unsupported edge.
    if(destination.action==='walk'&&!this.walkClear(bot.pos,{x:bot.pos.x+mx,y:bot.pos.y,z:bot.pos.z+mz})){mx=(destination.x-bot.pos.x)/d*step;mz=(destination.z-bot.pos.z)/d*step;b.moveX=b.moveZ=0}
    const ox=bot.pos.x,oz=bot.pos.z;this.world.move(bot,mx,mz);
    if(horizontal(bot.pos,{x:ox,z:oz})<step*.15){b.stuck+=dt;if(b.stuck>.15){this.world.move(bot,-(destination.z-bot.pos.z)/d*step*b.strafe,(destination.x-bot.pos.x)/d*step*b.strafe)}
      if(b.stuck>this.tuning.navigation.stuckRepath){b.pathIn=0;b.strafe*=-1;b.thinkIn=0;b.stuck=0;this.stats.stuckRecoveries++;if(Math.abs(bot.vy)<.01)bot.vy=6.5}
    }else b.stuck=Math.max(0,b.stuck-dt*2);
  }
  chooseWeapon(bot,b){
    const memory=b.memory.get(b.target);if(!memory||!b.visible||b.reload>0||b.weaponHeld<1.7)return;
    const d=distance(bot.pos,memory.pos);let chosen=b.weaponType,best=-Infinity,current=-Infinity;
    for(const name of b.loadout){const w=this.world.weapon?.(bot,name)||this.tuning.weapons[name];let score=12-Math.abs(d-w.idealRange)*.5+(name===b.profile.weapon?3:0);
      if(d>w.range)score-=20;if(name==='rocket'&&d<7)score-=100;if(name==='rail'&&d<10)score-=12;if(name==='shotgun'&&d>18)score-=8;
      if(b.magazines[name]===0)score-=4;if(name===b.weaponType)current=score;
      if(score>best){chosen=name;best=score}
    }
    if(chosen===b.weaponType||best<current+2)return;
    b.magazines[b.weaponType]=b.ammo;b.weaponType=chosen;b.weapon=this.world.weapon?.(bot,chosen)||this.tuning.weapons[chosen];b.ammo=b.magazines[chosen];b.preferredRange=b.weapon.idealRange*.8+b.profile.preferredRange*.2;b.weaponHeld=0;b.swapIn=.35*(b.weapon.native?.switch||1)*(bot.rival?.perks.quickdraw?.65:1);b.charge=0;b.burst=0;b.cool=Math.max(b.cool,.35);b.reaction=Math.max(b.reaction,.2);b.thinkIn=0;
    this.world.equip?.(bot,chosen);this.stats.switches++;
  }
  combat(bot,b,dt,actors){
    if(b.weapon.native)return rivalCombat(this,bot,b,dt,actors);
    const w=b.weapon;b.cool=Math.max(0,b.cool-dt);b.rest=Math.max(0,b.rest-dt);b.reaction=Math.max(0,b.reaction-dt);
    if(b.swapIn>0)return;
    if(b.reload>0){b.reload-=dt;if(b.reload<=0){b.ammo=w.magazine;b.magazines[b.weaponType]=b.ammo}return}
    if(b.recover>0)return;
    if(b.ammo<=0){b.reload=w.reload;b.thinkIn=0;b.charge=0;return}
    const memory=b.memory.get(b.target),actor=actors.find(a=>a.id===b.target);
    if(!b.visible||!memory||!actor||this.clock-b.spawnAt<this.tuning.fairness.spawnGrace){b.charge=0;return}
    const origin={x:bot.pos.x,y:bot.pos.y+1.28,z:bot.pos.z},d=distance(origin,memory.eye);
    if(d>w.range||w===this.tuning.weapons.rocket&&d<6){b.charge=0;return}
    const desired={x:memory.eye.x,y:memory.eye.y-.42,z:memory.eye.z};
    // Lag the aim behind fast movement. The first shot has the same error floor
    // as every other shot; difficulty never enables perfect tracking/headshots.
    if(!b.aimReady){b.aim=copy(desired);b.aimReady=true}
    const follow=1-Math.exp(-dt/Math.max(.14,this.difficulty.reaction*.65));for(const k of ['x','y','z'])b.aim[k]+=(desired[k]-b.aim[k])*follow;
    const bearing=Math.atan2(desired.x-origin.x,desired.z-origin.z);if(Math.abs(angleDelta(bearing,b.facing))>.25||b.reaction>0||b.rest>0||b.cool>0)return;
    if(!this.world.canSee(origin,actor.eye)){b.charge=0;return}
    b.charge+=dt;
    if(b.weaponType==='rail'||b.weaponType==='rocket')this.world.telegraph?.(bot,b.aim,dt);
    if(b.charge<w.windup)return;
    if(b.biasIn<=0){const angle=this.random()*Math.PI*2,radius=.35+this.random()*.65;b.aimBias.x=Math.cos(angle)*radius;b.aimBias.y=Math.sin(angle)*radius;b.biasIn=.32+this.random()*.3}
    const error=this.difficulty.aimError*d;
    const dx=b.aim.x-origin.x,dz=b.aim.z-origin.z,flat=Math.max(.01,Math.hypot(dx,dz));
    const point={x:b.aim.x+b.aimBias.x*error*dz/flat,y:b.aim.y+b.aimBias.y*error*.65,z:b.aim.z-b.aimBias.x*error*dx/flat};
    this.world.fire(bot,point,{...w,type:b.weaponType});this.stats.shots++;this.stats.weapons[b.weaponType]=(this.stats.weapons[b.weaponType]||0)+1;b.ammo--;b.magazines[b.weaponType]=b.ammo;b.burst++;b.cool=w.interval;b.charge=0;
    if(b.burst>=w.burst){b.burst=0;b.rest=w.rest*this.difficulty.rest*(.85+this.random()*.3);b.thinkIn=Math.min(b.thinkIn,.2)}
  }
  update(dt){
    this.clock+=dt;const actors=this.actors();
    for(const [bot,b]of this.brains){if(bot.dead)continue;b.goalAge+=dt;b.regionAge+=dt;if(horizontal(bot.pos,b.regionOrigin)>18||Math.abs(bot.pos.y-b.regionOrigin.y)>10){b.regionOrigin=copy(bot.pos);b.regionAge=0}b.weaponHeld+=dt;b.weaponDecisionIn-=dt;b.swapIn=Math.max(0,b.swapIn-dt);b.dodgeCooldown=Math.max(0,b.dodgeCooldown-dt);b.underFire=Math.max(0,b.underFire-dt);b.thinkIn-=dt;b.senseIn-=dt;b.strafeIn-=dt;
      if(b.senseIn<=0){this.perceive(bot,b,actors);this.noticeProjectiles(bot,b);b.senseIn=Math.min(this.tuning.senses.interval,this.difficulty.reaction*.6)*(.85+this.random()*.3)}
      if(b.thinkIn<=0){this.chooseGoal(bot,b);b.thinkIn=this.difficulty.think*(.8+this.random()*.4)}
      b.pressure*=Math.exp(-dt*1.6);b.exposure=b.visible?b.exposure+dt:Math.max(0,b.exposure-dt*2);b.biasIn-=dt;b.detourIn-=dt;b.recoverCooldown=Math.max(0,b.recoverCooldown-dt);
      if(b.recover>0){b.recover=Math.max(0,b.recover-dt);if(b.recover===0){b.thinkIn=0;this.setAction(b,'reposition','balance regained')}}
      if(b.strafeIn<=0)this.chooseStrafe(bot,b);
      const memory=b.memory.get(b.target),look=memory?.eye||b.heard&&this.clock-b.heard.at<this.difficulty.memory&&b.heard.pos||b.path[0]||b.goal;
      if(look){const a=Math.atan2(look.x-bot.pos.x,look.z-bot.pos.z);b.facing+=clamp(angleDelta(a,b.facing),-3.8*dt,3.8*dt)}
      if(b.weaponDecisionIn<=0){this.chooseWeapon(bot,b);b.weaponDecisionIn=.65}
      b.slideTryIn=Math.max(0,(b.slideTryIn||0)-dt);b.tacticalSlideCooldown=Math.max(0,(b.tacticalSlideCooldown||0)-dt);
      if(b.slide?.active&&(b.flight||b.dodge||b.recover>0||b.liftRide)){b.slide.stop();}
      this.navigate(bot,b,dt);this.world.physics(bot,b,dt);
      b.tiers.set(Math.round(bot.pos.y/4),this.clock);
      for(const n of this.navigation.anchors)if(distance(bot.pos,n)<12&&Math.abs(bot.pos.y-n.y)<1.5)b.visits.set(n.id,this.clock);
      this.combat(bot,b,dt,actors);this.world.collect?.(bot,b);this.world.animate?.(bot,b,dt);
    }
  }
}
// Compact precomputed graph avoids rebuilding a BSP map's navigation on the menu.
export function restoreNavigation(encoded,elevators,anchors,bounds,blocks=null,stepHeight=.3,pads=[]){
 const raw=atob(encoded),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),data=new DataView(bytes.buffer),count=data.getUint32(0,true),edgeBase=8+count*12,actions=['walk','jump','drop','swim','elevator','pad'];
 const nodes=Array.from({length:count},(_,id)=>{const i=8+id*12;return{id,x:data.getInt8(i),z:data.getInt8(i+1),y:data.getUint16(i+2,true)/1000,wet:!!data.getUint8(i+4),edges:[]}}),restoredPads=[];
 for(const n of nodes){const i=8+n.id*12,first=data.getUint32(i+8,true),length=data.getUint16(i+6,true);for(let j=first;j<first+length;j++){const k=edgeBase+j*8,action=actions[data.getUint8(k+4)],slot=data.getUint8(k+5)-1,lift=action==='elevator'?elevators[slot]:undefined,sourcePad=action==='pad'?pads[slot]:null,pad=sourcePad?{x:sourcePad.x,y:sourcePad.y||0,z:sourcePad.z,power:sourcePad.power,triggerRadius:sourcePad.triggerRadius,landing:{...sourcePad.landing}}:undefined,to=nodes[data.getUint16(k,true)];n.edges.push({node:to,cost:data.getUint16(k+2,true)/100,action,lift,pad,fromY:lift?data.getUint16(k+6,true)/1000:undefined});if(pad)restoredPads.push({from:n,to,...pad});}}
 const navigation={nodes,blocks,stepHeight,anchors:[],pads:restoredPads,bounds};for(const [x,y,z]of anchors){const n=nearestNode(navigation,{x,y,z});if(n&&!navigation.anchors.includes(n))navigation.anchors.push(n)}return navigation;
}
