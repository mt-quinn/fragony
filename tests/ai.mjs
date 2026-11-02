import assert from 'node:assert/strict';
import { createGameHarness } from './harness.mjs';
import { AI_TUNING,difficultyForRound } from '../dist/ai.js';
const {run,setup}=createGameHarness(121);setup();
run(`
assert.equal(navigation.pads.length,2);
for(const a of navigation.anchors)for(const b of navigation.anchors)if(a!==b)assert.ok(findRoute(navigation,a,b).length,'all strategic positions must connect, including both levels');
const ascent=findRoute(navigation,{x:11,y:0,z:0},{x:11,y:3,z:-17});assert.ok(ascent.some(n=>n.action==='pad'),'upper lanes require a jump-pad route');
const descent=findRoute(navigation,{x:7,y:3,z:-13},{x:8,y:0,z:-5});assert.ok(descent.some(n=>n.action==='drop'),'upper lanes have intentional drop routes');
console.log('Height-aware routes connect all strategic positions; ascent uses pads and descent uses drops.');
`);
// Use the real collision/movement/physics adapters, but disable autonomous goal
// changes while checking traversal to isolate the route follower from decisions.
for(const [start,goal,label]of [
 [[-13,0,-3],[-13,3,-16],'west pad'],[[11,0,-3],[11,3,-16],'east pad'],
 [[-19,0,2],[-19,3,-19],'west stairs'],[[19,0,2],[19,3,-19],'east stairs'],
 [[-7,3,-13],[3,.5,6],'gallery drop to armor'],[[7,3,-13],[20,0,8],'gallery drop to yard']
]){
 run(`{
 const b=bots[0];b.pos.set(${start.join(',')});b.vy=0;const brain=opponentAI.reset(b,0);brain.goal={type:'rotate',x:${goal[0]},y:${goal[1]},z:${goal[2]}};let reached=false;
 for(let i=0;i<1800;i++){opponentAI.navigate(b,brain,1/60);opponentAI.world.physics(b,brain,1/60);if(b.pos.distanceTo(new THREE.Vector3(${goal.join(',')}))<1.25){reached=true;break}}
 assert.ok(reached,${JSON.stringify(label)}+' route must complete; ended at '+JSON.stringify(b.pos));
 }`);
}
console.log('Actual movement completes both pads, both stairways, and gallery drops.');
run(`{
 const b=bots[0],brain=opponentAI.reset(b,0);b.pos.set(0,0,18);brain.facing=0;opponentAI.clock=3;respawnTime=0;playerSpawnAt=0;playerPos.set(0,1.7,-10);scene.updateMatrixWorld(true);
 opponentAI.perceive(b,brain,[{id:'player',pos:{x:0,y:0,z:-10},eye:playerPos,hp:100,alive:true,spawnAge:3}]);assert.equal(brain.target,null,'cannot see target behind itself');
 b.hp=140;opponentAI.hear({x:0,y:0,z:5},'player');assert.equal(brain.visible,false);assert.equal(brain.target,null,'hearing must not grant sight');opponentAI.chooseGoal(b,brain);assert.equal(brain.goal.type,'search');
 b.hp=20;brain.target=null;brain.visible=false;opponentAI.chooseGoal(b,brain);assert.equal(brain.goal.type,'heal');assert.equal(brain.goal.pickup.kind,'health','injured bot routes to health');
 console.log('No knowledge of unseen targets; sounds cause searches, and low health causes a health-pickup route.');
}`);
// Isolate perception and timing with a minimal visible arena and a recorded fire adapter.
run(`{
 const actor={id:'player',pos:{x:0,y:0,z:10},eye:{x:0,y:1.7,z:10},hp:100,alive:true,spawnAge:10};let shots=[],los=true,telegraphs=0;
 const ai=new ArenaAI({navigation,random:()=>.5,world:{actors:()=>[actor],pickups:[],canSee:()=>los,move(){},physics(){},fire:(bot,point,w)=>shots.push({at:ai.clock,w}),telegraph(){telegraphs++}}});
 const bot={name:'RAILTEST',pos:{x:0,y:0,z:0},hp:100,dead:0};const b=ai.reset(bot,2);ai.clock=2;b.facing=0;
 for(let i=0;i<30;i++)ai.update(1/60);assert.equal(shots.length,0,'no instant reaction shot');
 for(let i=0;i<120;i++)ai.update(1/60);assert.ok(shots.length>0);assert.ok(shots[0].at>=2+ai.difficulty.reaction*.65+AI_TUNING.weapons.rail.windup);assert.ok(telegraphs>20,'rail visibly telegraphs before firing');
 los=false;const prior=shots.length;for(let i=0;i<120;i++)ai.update(1/60);assert.equal(shots.length,prior,'never fire through lost line of sight');
 console.log('Reaction delay, visible rail wind-up and line-of-sight firing checks hold.');
}`);
run(`{
 const actor={id:'player',pos:{x:0,y:0,z:8},eye:{x:0,y:1.7,z:8},hp:100,alive:true,spawnAge:100};let shots=[];
 const ai=new ArenaAI({navigation,random:()=>.5,world:{actors:()=>[actor],pickups:[],canSee:()=>true,move(){},physics(){},fire:bot=>shots.push({name:bot.name,at:ai.clock})}});
 const shooters=[];for(let i=0;i<5;i++){const bot={name:'BOT'+i,pos:{x:i*.5,y:0,z:0},hp:100,dead:0};const b=ai.reset(bot,1);b.facing=0;shooters.push(bot)}ai.clock=2;
 for(const bot of shooters)ai.perceive(bot,bot.brain,[actor]);assert.ok(shooters.filter(bot=>bot.brain.target==='player').length<=AI_TUNING.fairness.maxPlayerAttackers,'do not all focus player');
 const bot=shooters[0],b=bot.brain;ai.brains=new Map([[bot,b]]);b.ammo=1;b.cool=0;b.rest=0;b.reaction=0;b.visible=true;b.charge=1;b.memory.set('player',{pos:actor.pos,eye:actor.eye,at:ai.clock});ai.combat(bot,b,1/60,[actor]);assert.equal(b.ammo,0);ai.combat(bot,b,1/60,[actor]);assert.ok(b.reload>0);const prior=shots.length;
 for(let i=0;i<60;i++)ai.combat(bot,b,1/60,[actor]);assert.equal(shots.length,prior,'reload creates a real punish window');
 b.reload=.01;ai.combat(bot,b,.02,[actor]);assert.equal(b.ammo,b.weapon.magazine);
 ai.clock+=10;ai.perceive(bot,b,[]);assert.equal(b.target,null,'last-seen memory expires');
 console.log('Player focus stays capped; magazines, reload openings and expiring target memory work.');
}`);
run(`{
 const projectile={pos:{x:1,y:1,z:7},velocity:{x:0,y:0,z:-24},owner:null};let moves=[];
 const ai=new ArenaAI({navigation,round:11,random:()=>.5,world:{actors:()=>[],pickups:[],canSee:()=>true,projectiles:()=>[projectile],move:(bot,x,z)=>moves.push({x,z}),physics(){},fire(){}}});
 const bot={name:'DODGER',pos:{x:0,y:.5,z:0},hp:100,dead:0},b=ai.reset(bot,0);ai.clock=3;b.facing=0;b.goal={type:'rotate',x:5,y:0,z:5};ai.noticeProjectiles(bot,b);assert.ok(b.dodge);const duration=b.dodge.left;ai.navigate(bot,b,.1);assert.equal(b.dodge.left,duration,'do not react instantly to incoming projectile');ai.navigate(bot,b,.15);assert.ok(b.dodge.left<duration);assert.ok(moves.length);
 b.dodge=null;b.dodgeCooldown=0;projectile.owner=bot;ai.noticeProjectiles(bot,b);assert.equal(b.dodge,null,'do not dodge own rockets');
 console.log('Projectile dodges respect reaction delay and ignore the shooter’s own rockets.');
}`);
run(`{
 const ai=new ArenaAI({navigation,random:()=>.5,world:{actors:()=>[],pickups:[],canSee:()=>true,move(){},physics(){},fire(){}}});
 const bot={name:'SWITCHER',loadout:['rail','smg'],pos:{x:0,y:0,z:0},hp:100,dead:0},b=ai.reset(bot,2);
 assert.equal(b.weaponType,'rail');b.target='opponent';b.visible=true;b.weaponHeld=3;b.memory.set('opponent',{pos:{x:0,y:0,z:5},eye:{x:0,y:1.7,z:5},at:0});ai.chooseWeapon(bot,b);assert.equal(b.weaponType,'smg');b.ammo=4;b.magazines.smg=4;
 b.weaponHeld=3;b.memory.get('opponent').pos.z=27;ai.chooseWeapon(bot,b);assert.equal(b.weaponType,'rail');b.weaponHeld=3;b.memory.get('opponent').pos.z=5;ai.chooseWeapon(bot,b);assert.equal(b.weaponType,'smg');assert.equal(b.ammo,4,'switching never refills a magazine');assert.deepEqual(Array.from(b.loadout),['rail','smg']);
 console.log('Bots select only their two rolled weapons, switch by range, and preserve partial magazines.');
}`);
for(const k of ['speed','reaction','aimError','memory','think','rest','aggression'])assert.equal(difficultyForRound(1000)[k],AI_TUNING.late[k]);
assert.ok(difficultyForRound(1).reaction>difficultyForRound(8).reaction);
assert.ok(difficultyForRound(100).speed<7.5);
console.log('Difficulty curves cap at configured late-run values; no runaway speed, damage or perfect aim.');
