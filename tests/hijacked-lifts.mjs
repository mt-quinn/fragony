import {createGameHarness} from './harness.mjs';
const h=createGameHarness(914,{legacyFixtures:false});h.setup();await h.run(`(async()=>{await beginPractice('hijacked');makeBots();mode='play';respawnTime=0;playerPos.set(0,20,0);
for(const l of MAP.elevators)for(const ascending of [true,false]){
 elevatorSystem.reset();const low=nearestAINode(navigation,{...(l.entryLow||l.entry),y:l.low}),high=nearestAINode(navigation,{...(l.entryHigh||l.entry),y:l.high}),from=ascending?low:high,to=ascending?high:low,b=bots[0];bots=[b];b.pos.set(from.x,from.y,from.z);b.vy=0;const brain=opponentAI.reset(b,0);brain.goal={type:'rotate',x:to.x,y:to.y,z:to.z};const edge=from.edges.find(e=>e.action==='elevator'&&e.lift.id===l.id&&e.node===to);assert.ok(edge,l.id+' baked lift link');brain.path=[{x:to.x,y:to.y,z:to.z,action:'elevator',lift:l,fromY:ascending?l.low:l.high}];brain.pathIn=999;let reached=false,used=false;
 for(let i=0;i<5400;i++){opponentAI.clock+=1/60;stepElevators(1/60);opponentAI.navigate(b,brain,1/60);used||=!!brain.liftRide;opponentAI.world.physics(b,brain,1/60);if(Math.hypot(b.pos.x-to.x,b.pos.z-to.z)<.65&&Math.abs(b.pos.y-to.y)<.2&&!brain.liftRide){reached=true;break;}}
 assert.ok(used,l.id+' route uses the actual elevator');assert.ok(reached,l.id+' '+ascending+' native bot ride ends safely '+JSON.stringify(b.pos));
 const exit=to.edges.find(e=>e.action==='walk'&&Math.hypot(e.node.x-l.x,e.node.z-l.z)>1.1)?.node;if(exit){brain.goal={type:'rotate',x:exit.x,y:exit.y,z:exit.z};for(let i=0;i<600;i++){opponentAI.clock+=1/60;stepElevators(1/60);opponentAI.navigate(b,brain,1/60);opponentAI.world.physics(b,brain,1/60);if(Math.hypot(b.pos.x-exit.x,b.pos.z-exit.z)<.4)break;}assert.ok(Math.hypot(b.pos.x-exit.x,b.pos.z-exit.z)<.6,l.id+' bot walks off the arrived deck');}
 console.log(l.id,ascending?'up':'down','native boarding, ride and route continuation pass');
}
})()`,{timeout:600000});
