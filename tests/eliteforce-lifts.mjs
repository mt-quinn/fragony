import{createGameHarness}from'./harness.mjs';import{SOURCE_ARENAS}from'../dist/maps/source-arenas.js';
const h=createGameHarness(914,{legacyFixtures:false});h.setup();
for(const id of SOURCE_ARENAS.filter(m=>m.sourceFamily==='eliteforce'&&m.elevators?.length).map(m=>m.id)){
 await h.run(`(async()=>{await beginPractice(${JSON.stringify(id)});makeBots();mode='play';respawnTime=0;playerPos.set(0,MAP.maxHeight+20,0);
 for(const l of MAP.elevators)for(const ascending of [true,false]){
  elevatorSystem.reset();const low=nearestAINode(navigation,{...(l.entryLow||l.entry),y:l.low}),high=nearestAINode(navigation,{...(l.entryHigh||l.entry),y:l.high}),from=ascending?low:high,to=ascending?high:low,b=bots[0];bots=[b];b.dead=0;b.hp=100;
  const settle=n=>moveCharacter(blocks,{x:n.x,z:n.z,feet:n.y+.4,radius:.4,height:1.9},{x:0,z:0,y:-.8},{bounds:MAP.bounds,stepHeight:MAP.stepHeight}),start=settle(from),arrival=settle(to);assert.ok(start.grounded&&arrival.grounded,l.id+' native landing support');assert.ok(Math.abs(arrival.feet-to.y)<.35,l.id+' source trim stays within navigation tolerance');
  b.pos.set(start.x,start.feet,start.z);b.vy=0;const brain=opponentAI.reset(b,0);brain.goal={type:'rotate',x:to.x,y:to.y,z:to.z};const edge=from.edges.find(e=>e.action==='elevator'&&e.lift.id===l.id&&e.node===to);assert.ok(edge,l.id+' baked lift link');brain.path=[{x:to.x,y:to.y,z:to.z,action:'elevator',lift:l,fromY:ascending?l.low:l.high}];brain.pathIn=999;let reached=false,used=false;
  for(let i=0;i<5400;i++){opponentAI.clock+=1/60;stepElevators(1/60);opponentAI.navigate(b,brain,1/60);used||=!!brain.liftRide;opponentAI.world.physics(b,brain,1/60);if(Math.hypot(b.pos.x-to.x,b.pos.z-to.z)<.65&&Math.abs(b.pos.y-arrival.feet)<.2&&!brain.liftRide&&b.grounded&&canOccupy(blocks,{x:b.pos.x,z:b.pos.z,feet:b.pos.y+.003,radius:.4,height:1.9})){reached=true;break;}}
  assert.ok(used,l.id+' actual elevator boarding');assert.ok(reached,l.id+' '+ascending+' safe native bot ride '+JSON.stringify(b.pos));
  console.log(l.id,ascending?'up':'down','native bot boarding/ride/exit pass');
 }
 })()`,{timeout:600000});
}
