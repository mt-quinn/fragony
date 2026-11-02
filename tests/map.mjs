import {createGameHarness} from './harness.mjs';
const {setup,run}=createGameHarness(55);setup();
run(`
for(const n of navigation.nodes)for(const e of n.edges)if(e.action==='drop')assert.ok(surfaceAt(blocks,e.node.x,e.node.z,n.y)<=e.node.y+.31,'drop route must leave its supporting deck');
const travel=[],center={x:-4,y:.5,z:7};
for(const s of MAP.spawns){const start={x:s[0],y:s[1],z:s[2]};assert.equal(blocked(start.x,start.z,start.y),false,'spawn must be clear');assert.ok(Math.abs(floorAt(start.x,start.z,start.y)-start.y)<.3,'spawn has support');const path=findRoute(navigation,start,center);assert.ok(path.length);let length=0,previous=start;for(const p of path){length+=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);previous=p}travel.push(length/7.5)}
assert.ok(Math.max(...travel)<12,'all spawns reach the central contest within twelve seconds at normal speed');
for(const p of MAP.pickups){assert.equal(blocked(p.x,p.z,p.y),false,'resource must have headroom');assert.ok(Math.abs(floorAt(p.x,p.z,p.y)-p.y)<.3,'resource has support');const n=nearestNode({x:p.x,y:p.y,z:p.z});assert.ok(Math.abs(n.y-p.y)<.4)}
// Block different primary doors independently: every region must retain a route.
for(const door of [{x:-13,z:7,w:1.6,d:8,bottom:0,top:10},{x:14,z:-6,w:1.6,d:9,bottom:0,top:10},{x:0,z:18,w:8,d:1.6,bottom:0,top:10}]){const alternative=buildNavigation([...blocks,door],MAP.pads,MAP.anchors,{bounds:MAP.bounds,maxHeight:MAP.maxHeight});for(const a of alternative.anchors)assert.ok(findRoute(alternative,a,center).length,'closing a door must not isolate a combat area')}
// Verify an upper-only route exists independently of shortcuts through the ground.
const upperNodes=navigation.nodes.filter(n=>Math.abs(n.y-4)<.01),upperSet=new Set(upperNodes),savedEdges=new Map(upperNodes.map(n=>[n,n.edges]));for(const n of upperNodes)n.edges=n.edges.filter(e=>upperSet.has(e.node));const upper={...navigation,nodes:upperNodes};assert.ok(findRoute(upper,{x:-29,y:4,z:-17},{x:33,y:4,z:-6}).length,'press and range share a real upper circuit');assert.ok(findRoute(upper,{x:0,y:4,z:3},{x:11,y:4,z:-25}).length,'core gantry connects to control without dropping');for(const [n,edges]of savedEdges)n.edges=edges;
scene.updateMatrixWorld(true);
const armor=new THREE.Vector3(-4,2.2,7),westHealth=new THREE.Vector3(-33,1.2,4),highArmor=new THREE.Vector3(28,9.7,-29);assert.equal(visible(armor,westHealth),false,'central armor cannot watch sheltered press health');assert.equal(visible(armor,highArmor),false,'both armor rewards require a rotation');assert.equal(visible(new THREE.Vector3(22,9.7,-26),new THREE.Vector3(30,1.7,14)),true,'upper control has a useful range sightline');
let mostSpawns=0;for(const a of MAP.anchors){const eye=new THREE.Vector3(a[0],a[1]+1.7,a[2]);let seen=0;for(const s of MAP.spawns)if(visible(eye,new THREE.Vector3(s[0],s[1]+1.3,s[2])))seen++;mostSpawns=Math.max(mostSpawns,seen)}assert.ok(mostSpawns<MAP.spawns.length*.65,'no strategic point controls most spawn locations');
// Real stacked floors, not a tall solid block masquerading as a balcony.
const stack=navigation.nodes.filter(n=>n.x===0&&n.z===-6).map(n=>n.y);assert.ok(stack.includes(0)&&stack.includes(4));assert.equal(floorAt(0,-6,0),0);assert.equal(floorAt(0,-6,4),4);assert.ok(Math.abs(ceilingAt(blocks,0,-6,0,2)-1.6)<.00001);
playerPos.set(0,1.7,-6);viewHeight=1.7;vy=8.5;grounded=false;mode='play';locked=true;opponentAI=null;bots=[];pickups=[];let highest=0;for(let i=0;i<80;i++){update(1/120);highest=Math.max(highest,playerPos.y-1.7)}assert.ok(highest<=1.61,'jumping underneath a gantry hits its underside');assert.ok(playerPos.y<4,'cannot phase up through a deck');
// Diagonal screens share collision and rendering orientation.
const angled=MAP.solids.find(b=>b.id==='assembly-east-baffle'),block=blocks.find(b=>b.x===angled.x&&b.z===angled.z);assert.equal(inBlock(block,block.x,block.z),true);assert.equal(inBlock(block,block.x+7,block.z),false);
console.log('Test Works: '+navigation.nodes.length+' nodes; 14 supported spawns, '+MAP.pickups.length+' accessible resources, three tiers, real underpasses, rotated collision and alternate routes after three independent portal closures.');console.log('Spawn-to-core travel: '+travel.map(t=>t.toFixed(1)).join(', ')+' s; maximum spawns visible from an anchor: '+mostSpawns+'/14.');
`);
