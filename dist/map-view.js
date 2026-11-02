import * as THREE from './vendor/three.module.js';
// Retained BSP surfaces use our material palette, rather than imported game art.
export function buildBrushMap(arena,map,blocks,worldMeshes){
 blocks.push(...map.brushes.map(b=>({...b})));
 for(const [kind,g] of Object.entries(map.groups)){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(g.c,3));geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:kind==='ink'?0x354447:kind==='light'?0xebf5b5:0xffffff,vertexColors:kind!=='ink'&&kind!=='light',roughness:kind==='glass'||kind==='water'?.25:.8,metalness:kind==='ink'?.25:.08,side:THREE.DoubleSide});
  if(kind==='light'){material.emissive.setHex(0xd9ef45);material.emissiveIntensity=.65}
  if(kind==='glass'||kind==='water'){material.transparent=true;material.opacity=kind==='water'?.46:.26;material.color.setHex(kind==='water'?0x70b8a8:0xb5dbd8);material.depthWrite=false}
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=kind!=='glass'&&kind!=='water'&&kind!=='light';mesh.receiveShadow=true;arena.add(mesh);spatialRaycast(mesh);if(kind!=='water')worldMeshes.push(mesh);
 }
 // Broad ceiling washes distinguish the two ends without adding decorative clutter.
 for(const z of [-40,0,40]){const light=new THREE.PointLight(z<0?0xb6e4eb:0xe5efbf,100,30,2);light.position.set(0,42,z);arena.add(light)}
 for(const z of [-18,18]){const light=new THREE.PointLight(0x80c6bd,100,26,2);light.position.set(0,9,z);arena.add(light)}
 for(const z of [-43,0,43]){const bar=new THREE.Mesh(new THREE.BoxGeometry(3.5,.04,.35),new THREE.MeshStandardMaterial({color:0xd9ef45,emissive:0xd9ef45,emissiveIntensity:2.4}));bar.position.set(0,z===0?39.85:43.85,z);arena.add(bar)}
}
export function dressElevators(arena,system,worldMeshes){
 const metal=new THREE.MeshStandardMaterial({color:0x263936,roughness:.6,metalness:.55}),acid=new THREE.MeshStandardMaterial({color:0xd9ef45,roughness:.65,emissive:0x5a6210,emissiveIntensity:.2});
 const box=(group,x,y,z,w,h,d,material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m};
 for(const l of system.lifts){
  const group=new THREE.Group();group.position.set(l.x,l.y,l.z);arena.add(group);l.mesh=group;
  const deck=box(group,0,-.14,0,l.w,.28,l.d,metal);worldMeshes.push(deck);
  for(const z of [-1,1])box(group,0,.006,z*(l.d/2-.08),l.w,.015,.12,acid);
  for(const x of [-1,1])box(group,x*(l.w/2-.08),.006,0,.12,.015,l.d,acid);
  // Rails sit against the original ladder wall and expose the moving carriage.
  const rail=new THREE.Group();rail.position.set(l.x,0,l.z);arena.add(rail);
  for(const x of [-1,1])box(rail,x*(l.w/2-.13),(l.low+l.high)/2,-l.d/2+.09,.09,l.high-l.low,.09,metal);
  for(const y of [l.low,l.high])box(rail,0,y+.015,l.d/2+.05,l.w,.025,.13,acid);
 }
}

// Render each material in one draw, but ray-test small spatial leaves. Original
// BSP rooms should not make every visibility test scan every triangle in the map.
function spatialRaycast(mesh){
 const position=mesh.geometry.attributes.position,buckets=new Map();
 for(let i=0;i<position.count;i+=3){const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3,z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3,key=Math.floor(x/10)+','+Math.floor(z/10);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i,i+1,i+2)}
 const leaves=[];for(const indices of buckets.values()){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',position);geometry.setIndex(indices);geometry.boundingBox=new THREE.Box3();const point=new THREE.Vector3();for(const i of indices)geometry.boundingBox.expandByPoint(point.fromBufferAttribute(position,i));geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());const leaf=new THREE.Mesh(geometry,mesh.material);leaf.matrixWorld=mesh.matrixWorld;leaves.push(leaf)}
 mesh.raycast=(caster,hits)=>{const start=hits.length;for(const leaf of leaves)leaf.raycast(caster,hits);for(let i=start;i<hits.length;i++)hits[i].object=mesh};
}
