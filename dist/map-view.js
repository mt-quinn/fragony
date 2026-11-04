import {MeshBVH,acceleratedRaycast,CENTER} from './vendor/three-mesh-bvh.module.js';
import {industrialGroups,dressIndustrialArena,industrialDistricts} from './industrial.js';
import {createWaterSurface} from './water.js';
import * as THREE from './vendor/three.module.js';
// Retained BSP surfaces use our material palette, rather than imported game art.
export function buildBrushMap(arena,map,blocks,worldMeshes){
 blocks.push(...map.brushes.map(b=>({...b})));
 if(map.brushes.triangleCollision)blocks.triangleCollision=map.brushes.triangleCollision;
 const industrial=industrialDistricts(map.id).length>0;
 if(industrial){for(const {family,geometry,material}of industrialGroups(map)){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=!['glass','light','fence'].includes(family.split('~')[0].split('@')[0]);mesh.receiveShadow=true;arena.add(mesh);spatialRaycast(mesh,true);worldMeshes.push(mesh);}}
 else{
 for(const [kind,g] of Object.entries(map.groups)){
  if(kind==='water')continue;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(g.c,3));geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:kind==='ink'?0x354447:kind==='light'?0xebf5b5:0xffffff,vertexColors:kind!=='ink'&&kind!=='light',roughness:kind==='glass'||kind==='water'?.25:.8,metalness:kind==='ink'?.25:.08,side:THREE.DoubleSide,...map.materials?.[kind]});
  if(kind==='light'){material.emissive.setHex(0xd9ef45);material.emissiveIntensity=.65}
  if(kind==='glass'||kind==='water'){material.transparent=true;material.opacity=kind==='water'?.46:.26;material.color.setHex(kind==='water'?0x70b8a8:0xb5dbd8);material.depthWrite=false}
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=kind!=='glass'&&kind!=='water'&&kind!=='light';mesh.receiveShadow=true;arena.add(mesh);spatialRaycast(mesh);if(kind!=='water')worldMeshes.push(mesh);
 }
 }
 for(const volume of map.water||[])arena.add(createWaterSurface(volume));
 if(industrial){
  const lights=map.id==='reservoir'?[[0,39,-32],[0,39,32]]:(map.lights||[]).slice(0,2).map(l=>[l.x,l.y,l.z]);
  for(const [x,y,z]of lights){const light=new THREE.PointLight(0xe3ead7,map.id==='reservoir'?105:65,map.id==='reservoir'?42:34,2);light.position.set(x,y,z);arena.add(light);}
  arena.updateMatrixWorld(true);dressIndustrialArena(arena,map,worldMeshes);
 }else{
 if(map.lights){
  for(const p of map.lights){const light=new THREE.PointLight(p.color,p.intensity,p.distance,2);light.position.set(p.x,p.y,p.z);arena.add(light)}
 }else{
 // Broad ceiling washes distinguish the two ends without adding decorative clutter.
 for(const z of [-40,0,40]){const light=new THREE.PointLight(z<0?0xb6e4eb:0xe5efbf,100,30,2);light.position.set(0,42,z);arena.add(light)}
 for(const z of [-18,18]){const light=new THREE.PointLight(0x80c6bd,100,26,2);light.position.set(0,9,z);arena.add(light)}
 for(const z of [-43,0,43]){const bar=new THREE.Mesh(new THREE.BoxGeometry(3.5,.04,.35),new THREE.MeshStandardMaterial({color:0xd9ef45,emissive:0xd9ef45,emissiveIntensity:2.4}));bar.position.set(0,z===0?39.85:43.85,z);arena.add(bar)}
 }
 }
 for(const p of typeof document==='undefined'||industrial?[]:map.signs||[]){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#24393b';ctx.fillRect(0,0,1024,192);ctx.fillStyle='#'+p.color.toString(16).padStart(6,'0');ctx.fillRect(0,0,16,192);ctx.font='800 112px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.text,520,103,945);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.width*192/1024),new THREE.MeshBasicMaterial({map:texture}));mesh.position.set(p.x,p.y,p.z);mesh.rotation.y=p.rotation;arena.add(mesh);
 }

}
export function dressElevators(arena,system,worldMeshes){
 if(!system.lifts.length)return;
 const pitMaterial=new THREE.MeshStandardMaterial({color:0xabb7a4,roughness:.88,metalness:.1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
 const metal=new THREE.MeshStandardMaterial({color:0x263936,roughness:.6,metalness:.55}),acid=new THREE.MeshStandardMaterial({color:0xd9ef45,roughness:.65,emissive:0x5a6210,emissiveIntensity:.2});
 for(const material of [pitMaterial,metal,acid])material.userData.arenaOwnedMaterial=true;
 const box=(group,x,y,z,w,h,d,material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m};
 for(const l of system.lifts){
  const pit=box(arena,l.x,l.low-.3,l.z,l.pit?.w||l.w+.8,.6,l.pit?.d||l.d+.8,pitMaterial);pit.name=l.id+'-pit-floor';pit.rotation.y=l.yaw||0;worldMeshes.push(pit);
  const baseMarks=new THREE.Group();baseMarks.position.set(l.x,l.low+.003,l.z);baseMarks.rotation.y=l.yaw||0;arena.add(baseMarks);
  for(const side of [-1,1])box(baseMarks,side*(l.w/2+.15),0,0,.06,.012,l.d+.4,acid);
  const group=new THREE.Group();group.position.set(l.x,l.y,l.z);group.rotation.y=l.yaw||0;arena.add(group);l.mesh=group;
  const deck=box(group,0,-.12,0,l.w,.28,l.d,metal);worldMeshes.push(deck);
  for(const z of [-1,1])box(group,0,.026,z*(l.d/2-.08),l.w,.015,.12,acid);
  for(const x of [-1,1])box(group,x*(l.w/2-.08),.026,0,.12,.015,l.d,acid);
  // Rails sit against the original ladder wall and expose the moving carriage.
  const rail=new THREE.Group();rail.position.set(l.x,0,l.z);rail.rotation.y=l.yaw||0;arena.add(rail);
  for(const x of [-1,1])box(rail,x*(l.w/2-.13),(l.low+l.high)/2,-l.d/2+.09,.09,l.high-l.low,.09,metal);
  for(const y of [l.low,l.high])box(rail,0,y+.015,l.d/2+.05,l.w,.025,.13,acid);
 }
}

// Render each material in one draw, but ray-test small spatial leaves. Original
// BSP rooms should not make every visibility test scan every triangle in the map.
function spatialRaycast(mesh,accelerated=false){
 if(accelerated){mesh.geometry.boundsTree=mesh.geometry.userData.sourceBVH?MeshBVH.deserialize(mesh.geometry.userData.sourceBVH,mesh.geometry,{setIndex:false}):new MeshBVH(mesh.geometry,{strategy:CENTER,targetLeafSize:12,indirect:true,verbose:false});delete mesh.geometry.userData.sourceBVH;mesh.raycast=(caster,hits)=>{const start=hits.length;acceleratedRaycast.call(mesh,caster,hits);if(mesh.material.userData.alphaAt)for(let i=hits.length-1;i>=start;i--)if(hits[i].uv&&!mesh.material.userData.alphaAt(hits[i].uv))hits.splice(i,1);};return;}
 const position=mesh.geometry.attributes.position,buckets=new Map();
 for(let i=0;i<position.count;i+=3){const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3,z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3,key=Math.floor(x/10)+','+Math.floor(z/10);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i,i+1,i+2)}
 const leaves=[];for(const indices of buckets.values()){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',position);for(const name of ['normal','uv','uv1'])if(mesh.geometry.attributes[name])geometry.setAttribute(name,mesh.geometry.attributes[name]);geometry.setIndex(indices);geometry.boundingBox=new THREE.Box3();const point=new THREE.Vector3();for(const i of indices)geometry.boundingBox.expandByPoint(point.fromBufferAttribute(position,i));geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());const leaf=new THREE.Mesh(geometry,mesh.material);leaf.matrixWorld=mesh.matrixWorld;leaves.push(leaf)}
 mesh.raycast=(caster,hits)=>{const start=hits.length;for(const leaf of leaves)leaf.raycast(caster,hits);for(let i=hits.length-1;i>=start;i--){if(mesh.material.userData.alphaAt&&hits[i].uv&&!mesh.material.userData.alphaAt(hits[i].uv))hits.splice(i,1);else hits[i].object=mesh;}};
}
