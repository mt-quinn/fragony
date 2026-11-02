// All campaign difficulty and personality controls live here. Distances are metres;
// timing uses world seconds, so slow motion affects thinking, aim and movement alike.
export const AI_TUNING = {
  progressionRounds: 10,
  early: { speed: 4.5, reaction: .58, aimError: .075, memory: 1.8, think: .72, rest: 1, aggression: .7, dodgeChance: .25, dodgeReaction: .32 },
  late: { speed: 5.9, reaction: .27, aimError: .032, memory: 3.2, think: .4, rest: .67, aggression: 1.15, dodgeChance: .6, dodgeReaction: .2 },
  senses: { interval: .16, range: 35, fieldOfView: 220, hearing: 23 },
  fairness: { spawnGrace: 1.05, maxPlayerAttackers: 2, targetCommitment: 1.2 },
  navigation: { repath: .85, stuckRepath: .6, retreatHealth: 35, pickupRespawn: 15 },
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
  const t=clamp((round-1)/tuning.progressionRounds,0,1),e=t*t*(3-2*t);
  return Object.fromEntries(Object.keys(tuning.early).map(k=>[k,tuning.early[k]+(tuning.late[k]-tuning.early[k])*e]));
}
export function solidAt(blocks,x,z,y,r=.38){
  if(Math.abs(x)>22.8||Math.abs(z)>22.8)return true;
  return blocks.some(b=>b.top>y+.32&&b.bottom<y+1.9&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);
}
function clearSegment(blocks,a,b,action='walk'){
  const steps=Math.ceil(horizontal(a,b)*4);
  for(let i=0;i<=steps;i++){
    const t=i/Math.max(1,steps),y=action==='drop'?a.y:action==='jump'?Math.max(a.y,b.y)+Math.sin(t*Math.PI)*.8:a.y+(b.y-a.y)*t;
    if(solidAt(blocks,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,y))return false;
  }return true;
}
export function buildNavigation(blocks,pads=[],anchors=null){
  const heights=[0,...new Set(blocks.filter(b=>b.top>0&&b.top<=3.1&&b.w>=1&&b.d>=1).map(b=>b.top))];
  const nodes=[],columns=new Map();
  for(let x=-22;x<=22;x++)for(let z=-22;z<=22;z++)for(const y of heights){
    const supported=y===0||blocks.some(b=>b.top===y&&Math.abs(x-b.x)<=b.w/2-.38&&Math.abs(z-b.z)<=b.d/2-.38);
    if(!supported||solidAt(blocks,x,z,y))continue;
    const n={id:nodes.length,x,y,z,edges:[]};nodes.push(n);const key=`${x},${z}`;if(!columns.has(key))columns.set(key,[]);columns.get(key).push(n);
  }
  for(const n of nodes)for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]]){
    for(const m of columns.get(`${n.x+dx},${n.z+dz}`)||[]){
      const rise=m.y-n.y;if(rise>1.35||rise< -3.1)continue;
      const action=rise>.3?'jump':rise< -.3?'drop':'walk';
      if(clearSegment(blocks,n,m,action))n.edges.push({node:m,action,cost:distance(n,m)+(action==='walk'?0:1.2)});
    }
  }
  const navigation={nodes,pads:[],anchors:[]};
  for(const p of pads){
    const from=nearestNode(navigation,{x:p.x,y:0,z:p.z});
    const to=nearestNode(navigation,p.landing||{x:Math.sign(p.x)*18,y:3,z:Math.sign(p.z)*7});
    if(from&&to&&to.y===3){from.edges.push({node:to,action:'pad',cost:6,pad:{x:p.x,z:p.z}});navigation.pads.push({from,to,x:p.x,z:p.z})}
  }
  for(const [x,y,z]of anchors||[[-19,0,-19],[19,0,-19],[-19,0,19],[19,0,19],[0,0,-18],[0,0,18],[-9,0,0],[9,0,0],[0,.5,0],[-16,3,-6],[-16,3,6],[16,3,-6],[16,3,6]]){
    const n=nearestNode(navigation,{x,y,z});if(n&&!navigation.anchors.includes(n))navigation.anchors.push(n);
  }
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
  if(start===goal)return [{...copy(goal),action:'walk'}];if(!parents.has(goal))return [];
  const path=[];let n=goal;while(n!==start){const {n:previous,edge}=parents.get(n);path.unshift({...copy(n),action:edge.action,pad:edge.pad});n=previous}return path;
}
export class ArenaAI{
  constructor({navigation,world,round=1,tuning=AI_TUNING,random=Math.random}){
    Object.assign(this,{navigation,world,tuning,random});this.difficulty=difficultyForRound(round,tuning);this.clock=0;this.brains=new Map();
    this.stats={shots:0,spotted:0,pads:0,drops:0,pickups:0,dodges:0,switches:0,weapons:{},repaths:0,stuckRecoveries:0,goals:{}};
  }
  reset(bot,index=0){
    const profile=this.tuning.profiles[index%this.tuning.profiles.length],loadout=(bot.loadout||[profile.weapon]).filter(w=>this.tuning.weapons[w]),weaponType=loadout.includes(profile.weapon)?profile.weapon:loadout[0],weapon=this.tuning.weapons[weaponType];
    const brain={profile,index,loadout,weaponType,preferredRange:weapon.idealRange*.8+profile.preferredRange*.2,magazines:Object.fromEntries(loadout.map(w=>[w,this.tuning.weapons[w].magazine])),weaponHeld:0,weaponDecisionIn:0,swapIn:0,spawnAt:this.clock,facing:Math.atan2(-bot.pos.x,-bot.pos.z),memory:new Map(),target:null,visible:false,reaction:0,
      senseIn:this.random()*.15,thinkIn:.15+this.random()*.35,path:[],pathIn:0,goal:null,goalAge:0,visits:new Map(),lastSeen:null,
      aim:copy(bot.pos),aimReady:false,strafe:this.random()<.5?-1:1,strafeIn:.7+this.random()*.7,
      ammo:weapon.magazine,reload:0,charge:0,cool:.5,rest:0,burst:0,underFire:0,stuck:0,previous:copy(bot.pos),flight:null,weapon,dodge:null,dodgeCooldown:0};
    this.brains.set(bot,brain);bot.brain=brain;bot.vy=0;this.world.equip?.(bot,weaponType);return brain;
  }
  hear(pos,source,range=this.tuning.senses.hearing){
    for(const [bot,b]of this.brains){if(bot===source||bot.dead||distance(bot.pos,pos)>range)continue;
      // A sound gives a search location, never sight or a firing solution.
      b.heard={pos:copy(pos),at:this.clock,source:typeof source==='string'?source:source?.name};if(!b.target)b.thinkIn=Math.min(b.thinkIn,.2);
    }
  }
  damaged(bot,source){
    const b=this.brains.get(bot);if(!b)return;b.underFire=1.8;
    if(source){b.heard={pos:copy(source.pos),at:this.clock,source:source.id};b.thinkIn=0}
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
    if(b.flight||b.dodgeCooldown>0||this.clock-b.spawnAt<this.tuning.fairness.spawnGrace)return;
    for(const r of this.world.projectiles?.()||[]){
      if(r.owner===bot||distance(bot.pos,r.pos)>11)continue;
      const dx=bot.pos.x-r.pos.x,dz=bot.pos.z-r.pos.z,speed=Math.hypot(r.velocity.x,r.velocity.z),approach=(dx*r.velocity.x+dz*r.velocity.z)/Math.max(.1,speed);
      const sideDistance=Math.abs(dx*r.velocity.z-dz*r.velocity.x)/Math.max(.1,speed);
      if(!r.grenade&&(approach<0||sideDistance>2.6))continue;
      const bearing=Math.atan2(r.pos.x-bot.pos.x,r.pos.z-bot.pos.z);
      if(Math.abs(angleDelta(bearing,b.facing))>Math.PI*.65||!this.world.canSee({x:bot.pos.x,y:bot.pos.y+1.3,z:bot.pos.z},r.pos))continue;
      b.dodgeCooldown=1.5;
      if(this.random()>this.difficulty.dodgeChance)return;
      const side=b.strafe;b.dodge={delay:this.difficulty.dodgeReaction,left:.38,x:r.grenade?dx: r.velocity.z*side,z:r.grenade?dz:-r.velocity.x*side};this.stats.dodges++;return;
    }
  }
  setGoal(b,type,pos,extra={}){
    const same=b.goal?.type===type&&horizontal(b.goal,pos)<1&&Math.abs(b.goal.y-pos.y)<.4;
    if(!same){b.goal={type,...copy(pos),...extra};b.goalAge=0;b.pathIn=0;this.stats.goals[type]=(this.stats.goals[type]||0)+1}
  }
  chooseGoal(bot,b){
    const memory=b.memory.get(b.target),threat=memory?.pos,injured=bot.hp<this.tuning.navigation.retreatHealth*b.profile.caution;
    const pickups=this.world.pickups.filter(p=>p.kind!=='pad'&&p.kind!=='focus'&&p.timer<=0);
    let pickup=null,pickupScore=-Infinity;
    for(const p of pickups){const y=p.y||0,position={x:p.x,y,z:p.z};
      const value=p.kind==='health'?(100-bot.hp)*1.1:bot.hp<140?27:0;
      if(value<=0)continue;const score=value-distance(bot.pos,position)*1.5;
      if(score>pickupScore){pickupScore=score;pickup={...position,pickup:p}}
    }
    if(pickup&&(injured||(!b.visible&&pickupScore>8))){this.setGoal(b,injured?'heal':'pickup',pickup,{pickup:pickup.pickup});return}
    if(threat&&(injured||b.reload>0||b.underFire>0&&bot.hp<55)){
      let choice=null,score=-Infinity;
      for(const n of this.navigation.anchors){const travel=distance(bot.pos,n);if(travel>19||travel<2)continue;
        const cover=!this.world.canSee({x:threat.x,y:threat.y+1.4,z:threat.z},{x:n.x,y:n.y+1.3,z:n.z});
        const value=(cover?18:0)+Math.min(24,distance(n,threat))*.6-travel*.75;
        if(value>score){choice=n;score=value}
      }
      if(choice){this.setGoal(b,b.reload>0?'reload':'retreat',choice);return}
    }
    if(memory&&b.visible){
      if(b.goal?.type==='flank'&&b.goalAge<2.6&&distance(bot.pos,b.goal)>1.4&&distance(bot.pos,memory.pos)>4)return;
      const d=distance(bot.pos,memory.pos),tooClose=d<b.preferredRange*.65;
      if(!tooClose&&d<b.preferredRange*1.45&&b.goalAge<2.3&&b.goal?.type==='engage')return;
      if(this.random()<b.profile.flank*.4||b.profile.highGround>1&&bot.pos.y<2.5){
        let choice=null,score=-Infinity;
        for(const n of this.navigation.anchors){const travel=distance(bot.pos,n),range=distance(n,memory.pos);if(travel<3||travel>25||range<5||range>32)continue;
          const cover=!this.world.canSee(memory.eye,{x:n.x,y:n.y+1.4,z:n.z});
          const value=n.y*b.profile.highGround*4+(cover?b.profile.flank*12:0)-Math.abs(range-b.preferredRange)*.5-travel*.25+this.random()*5;
          if(value>score){choice=n;score=value}
        }
        if(choice){this.setGoal(b,'flank',choice);return}
      }
      this.setGoal(b,'engage',memory.pos);return;
    }
    if(memory){this.setGoal(b,'search',memory.pos);return}
    if(b.heard&&this.clock-b.heard.at<this.difficulty.memory){this.setGoal(b,'search',b.heard.pos);return}
    if(b.goal&&b.goalAge<3.8&&distance(bot.pos,b.goal)>1.2)return;
    let choice=null,score=-Infinity;
    for(const n of this.navigation.anchors){const d=distance(bot.pos,n);if(d<4)continue;
      const recency=this.clock-(b.visits.get(n.id)?? -20),value=Math.min(recency,20)*.6+n.y*b.profile.highGround*2-d*.12+this.random()*8;
      if(value>score){choice=n;score=value}
    }
    if(choice){b.visits.set(choice.id,this.clock);this.setGoal(b,'rotate',choice)}
  }
  navigate(bot,b,dt){
    if(!b.goal)return;
    if(b.flight){this.world.move(bot,b.flight.vx*dt,b.flight.vz*dt);return}
    if(b.dodge){b.dodge.delay-=dt;if(b.dodge.delay<=0){const d=Math.max(.01,Math.hypot(b.dodge.x,b.dodge.z)),step=this.difficulty.speed*1.2*dt;this.world.move(bot,b.dodge.x/d*step,b.dodge.z/d*step);b.dodge.left-=dt;if(b.dodge.left<=0)b.dodge=null;return}}
    b.pathIn-=dt;
    if(b.pathIn<=0){b.path=findRoute(this.navigation,bot.pos,b.goal,{avoid:['retreat','heal','reload'].includes(b.goal.type)?b.memory.get(b.target)?.pos:null,aggression:b.profile.aggression});b.pathIn=this.tuning.navigation.repath+this.random()*.25;this.stats.repaths++}
    while(b.path.length&&horizontal(bot.pos,b.path[0])<.55&&Math.abs(bot.pos.y-b.path[0].y)<.65)b.path.shift();
    let destination=b.path[0];const m=b.memory.get(b.target);
    // Strafe in committed legs, never instantaneous direction jitter. Stay on a
    // supported surface and use the route when the enemy is on another level.
    if(b.goal.type==='engage'&&b.visible&&m&&Math.abs(bot.pos.y-m.pos.y)<1.1&&this.world.canSee({x:bot.pos.x,y:bot.pos.y+1.4,z:bot.pos.z},m.eye)){
      const d=horizontal(bot.pos,m.pos),dx=(m.pos.x-bot.pos.x)/Math.max(.1,d),dz=(m.pos.z-bot.pos.z)/Math.max(.1,d);
      const advance=clamp((d-b.preferredRange)*.25,-1,1)*b.profile.aggression;
      destination={x:bot.pos.x+dx*advance+dz*b.strafe*.65,y:bot.pos.y,z:bot.pos.z+dz*advance-dx*b.strafe*.65,action:'walk'};
    }
    if(!destination)return;
    if(destination.action==='pad'&&horizontal(bot.pos,destination.pad)<1.45&&bot.pos.y<.35){
      const flightTime=(13.5+Math.sqrt(13.5**2-46*(destination.y-bot.pos.y)))/23;
      b.flight={vx:(destination.x-bot.pos.x)/flightTime,vz:(destination.z-bot.pos.z)/flightTime,age:0};bot.vy=13.5;this.stats.pads++;return;
    }
    if(destination.action==='jump'&&destination.y>bot.pos.y+.3&&Math.abs(bot.vy)<.01)bot.vy=8.5;
    const d=horizontal(bot.pos,destination);if(d<.05)return;
    const speed=this.difficulty.speed*(b.goal.type==='retreat'||b.goal.type==='heal'?1.08:1)*(b.reload>0?.8:1),step=Math.min(d,speed*dt);
    const ox=bot.pos.x,oz=bot.pos.z;this.world.move(bot,(destination.x-bot.pos.x)/d*step,(destination.z-bot.pos.z)/d*step);
    if(horizontal(bot.pos,{x:ox,z:oz})<step*.15){b.stuck+=dt;if(b.stuck>.15){this.world.move(bot,-(destination.z-bot.pos.z)/d*step*b.strafe,(destination.x-bot.pos.x)/d*step*b.strafe)}
      if(b.stuck>this.tuning.navigation.stuckRepath){b.pathIn=0;b.strafe*=-1;b.thinkIn=0;b.stuck=0;this.stats.stuckRecoveries++;if(Math.abs(bot.vy)<.01)bot.vy=6.5}
    }else b.stuck=Math.max(0,b.stuck-dt*2);
  }
  chooseWeapon(bot,b){
    const memory=b.memory.get(b.target);if(!memory||!b.visible||b.reload>0||b.weaponHeld<1.7)return;
    const d=distance(bot.pos,memory.pos);let chosen=b.weaponType,best=-Infinity,current=-Infinity;
    for(const name of b.loadout){const w=this.tuning.weapons[name];let score=12-Math.abs(d-w.idealRange)*.5+(name===b.profile.weapon?3:0);
      if(d>w.range)score-=20;if(name==='rocket'&&d<7)score-=100;if(name==='rail'&&d<10)score-=12;if(name==='shotgun'&&d>18)score-=8;
      if(b.magazines[name]===0)score-=4;if(name===b.weaponType)current=score;
      if(score>best){chosen=name;best=score}
    }
    if(chosen===b.weaponType||best<current+2)return;
    b.magazines[b.weaponType]=b.ammo;b.weaponType=chosen;b.weapon=this.tuning.weapons[chosen];b.ammo=b.magazines[chosen];b.preferredRange=b.weapon.idealRange*.8+b.profile.preferredRange*.2;b.weaponHeld=0;b.swapIn=.35;b.charge=0;b.burst=0;b.cool=Math.max(b.cool,.35);b.reaction=Math.max(b.reaction,.2);b.thinkIn=0;
    this.world.equip?.(bot,chosen);this.stats.switches++;
  }
  combat(bot,b,dt,actors){
    const w=b.weapon;b.cool=Math.max(0,b.cool-dt);b.rest=Math.max(0,b.rest-dt);b.reaction=Math.max(0,b.reaction-dt);
    if(b.swapIn>0)return;
    if(b.reload>0){b.reload-=dt;if(b.reload<=0){b.ammo=w.magazine;b.magazines[b.weaponType]=b.ammo}return}
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
    const error=this.difficulty.aimError*d,angle=this.random()*Math.PI*2,radius=(.35+this.random()*.65)*error;
    const dx=b.aim.x-origin.x,dz=b.aim.z-origin.z,flat=Math.max(.01,Math.hypot(dx,dz));
    const point={x:b.aim.x+Math.cos(angle)*radius*dz/flat,y:b.aim.y+Math.sin(angle)*radius*.65,z:b.aim.z-Math.cos(angle)*radius*dx/flat};
    this.world.fire(bot,point,{...w,type:b.weaponType});this.stats.shots++;this.stats.weapons[b.weaponType]=(this.stats.weapons[b.weaponType]||0)+1;b.ammo--;b.magazines[b.weaponType]=b.ammo;b.burst++;b.cool=w.interval;b.charge=0;
    if(b.burst>=w.burst){b.burst=0;b.rest=w.rest*this.difficulty.rest*(.85+this.random()*.3);b.thinkIn=Math.min(b.thinkIn,.2)}
  }
  update(dt){
    this.clock+=dt;const actors=this.actors();
    for(const [bot,b]of this.brains){if(bot.dead)continue;b.goalAge+=dt;b.weaponHeld+=dt;b.weaponDecisionIn-=dt;b.swapIn=Math.max(0,b.swapIn-dt);b.dodgeCooldown=Math.max(0,b.dodgeCooldown-dt);b.underFire=Math.max(0,b.underFire-dt);b.thinkIn-=dt;b.senseIn-=dt;b.strafeIn-=dt;
      if(b.senseIn<=0){this.perceive(bot,b,actors);this.noticeProjectiles(bot,b);b.senseIn=this.tuning.senses.interval*(.85+this.random()*.3)}
      if(b.thinkIn<=0){this.chooseGoal(bot,b);b.thinkIn=this.difficulty.think*(.8+this.random()*.4)}
      if(b.strafeIn<=0){b.strafe*=-1;b.strafeIn=.65+this.random()*1.1}
      const memory=b.memory.get(b.target),look=memory?.eye||b.heard&&this.clock-b.heard.at<this.difficulty.memory&&b.heard.pos||b.path[0]||b.goal;
      if(look){const a=Math.atan2(look.x-bot.pos.x,look.z-bot.pos.z);b.facing+=clamp(angleDelta(a,b.facing),-3.8*dt,3.8*dt)}
      if(b.weaponDecisionIn<=0){this.chooseWeapon(bot,b);b.weaponDecisionIn=.65}
      this.navigate(bot,b,dt);this.world.physics(bot,b,dt);
      this.combat(bot,b,dt,actors);this.world.collect?.(bot,b);this.world.animate?.(bot,b,dt);
    }
  }
}
