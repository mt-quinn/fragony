import {createGameHarness} from './harness.mjs';
const h=createGameHarness(907);h.setup();h.run(`
changeArena('reservoir');mode='play';locked=true;respawnTime=0;health=100000;perks={};owned=[0,1,2,3,4,5];opponentAI=null;bots.forEach(b=>scene.remove(b.group));bots=[];scene.updateMatrixWorld(true);
for(const [index,s]of spawnPoints.slice(0,12).entries()){
 const floor=new THREE.Vector3(...s),center=floor.clone().add(new THREE.Vector3(0,1,0));
 assert.ok(blastVisible(floor,center),'outward blast at Reservoir floor '+index);
 const d=createDummy(),b={...d,name:'SPLASH',hp:100000,maxHealth:100000,dead:0,deaths:0,score:0,pos:floor.clone()};b.group.position.copy(b.pos);b.group.traverse(m=>m.userData.bot=b);scene.add(b.group);bots=[b];scene.updateMatrixWorld(true);
 payloadExplosion(floor,150,5.5);assert.ok(b.hp<100000,'attachment splash damages floor-adjacent target '+index);
 b.hp=100000;explode(floor,null);assert.ok(b.hp<100000,'legacy splash damages floor-adjacent target '+index);scene.remove(b.group);bots=[];
 // Both projectile paths stop on the raised floor instead of entering it.
 for(const attachment of [false,true]){
  const origin=floor.clone().add(new THREE.Vector3(0,2,0));launchRocket(origin,new THREE.Vector3(0,-1,0),null,false,1,attachment?{spec:{...weaponStats(weapons[4],4,normalizeBuilds()),weapon:'TEST'}}:{});
  const r=rockets.at(-1);r.origin=origin.clone();r.bounces=0;let detonated=false;
  for(let i=0;i<60;i++){if((attachment?stepAttachmentRocket:stepLegacyRocket)(r,1/120)){detonated=true;break;}}
  assert.ok(detonated,'floor contact detonates '+index);assert.ok(r.mesh.position.y>s[1]-.25,'rocket does not sink into Reservoir floor');scene.remove(r.mesh);rockets.pop();
 }
}
// A real solid wall still protects actors on its far side, including surface-origin blasts.
const wall=new THREE.Mesh(new THREE.BoxGeometry(1,5,5),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));wall.position.set(0,2.5,0);scene.add(wall);worldMeshes=[wall];scene.updateMatrixWorld(true);
assert.ok(!blastVisible(new THREE.Vector3(-2,2,0),new THREE.Vector3(2,2,0)),'wall blocks blast');
assert.ok(!blastVisible(new THREE.Vector3(-.5,2,0),new THREE.Vector3(2,2,0)),'surface-origin inward ray remains blocked');
assert.ok(blastVisible(new THREE.Vector3(-.5,2,0),new THREE.Vector3(-2,2,0)),'surface-origin outward ray escapes');
console.log('Explosions: Reservoir floor splash at all 12 spawns, both swept rocket paths, and solid-wall protection pass.');
`);
