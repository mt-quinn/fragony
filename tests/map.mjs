import { createGameHarness } from './harness.mjs';
const {setup,run}=createGameHarness(55);setup();
run(`
const travel=[];
for(const s of MAP.spawns){const start={x:s[0],y:s[1],z:s[2]},path=findRoute(navigation,start,{x:3,y:.5,z:6});assert.ok(path.length);let length=0,previous=start;for(const p of path){length+=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);previous=p}travel.push(length/7.5)}
assert.ok(Math.max(...travel)<10,'all spawns should reach contested center within ten seconds at normal speed');
const original=blocks.map(b=>({...b}));
const closedHallDoor={x:-10,z:2,w:1.5,d:4.1,bottom:0,top:5};const alternate=buildNavigation([...original,closedHallDoor],MAP.pads,MAP.anchors);
assert.ok(findRoute(alternate,{x:-20,y:0,z:9},{x:3,y:.5,z:6}).length,'blocking one portal must leave a circulation route');
scene.updateMatrixWorld(true);const center=new THREE.Vector3(3,1.7,6),hallHealth=new THREE.Vector3(-20,1.3,9);assert.equal(visible(center,hallHealth),false,'armor cannot control the sheltered health pickup');
const gallery=new THREE.Vector3(7,4.7,-14);let seen=0;for(const p of MAP.spawns)if(visible(gallery,new THREE.Vector3(p[0],p[1]+1.3,p[2])))seen++;
assert.ok(seen<MAP.spawns.length*.75,'gallery must not control all spawn routes');
console.log('Crosscut: '+navigation.nodes.length+' walkable nodes; all areas connected, alternate portal route, separated resources and limited gallery visibility.');
console.log('Spawn-to-center travel at normal speed: '+travel.map(n=>n.toFixed(1)).join(', ')+' seconds.');
`);
