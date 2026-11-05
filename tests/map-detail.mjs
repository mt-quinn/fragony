import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import * as THREE from '../dist/vendor/three.module.js';import {MeshBVH,CENTER} from '../dist/vendor/three-mesh-bvh.module.js';
import {DETAIL_MAPS} from '../dist/maps/map-detail.js';import {readSourceRender} from '../dist/maps/source-render.js';
const id=process.argv[2];
if(!id){for(const map of DETAIL_MAPS){const r=spawnSync(process.execPath,['--max-old-space-size=3072',import.meta.filename,map],{stdio:'inherit'});assert.equal(r.status,0,map+' reduced detail');}}
else{
 const chunks=await readSourceRender(new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url),undefined,{detail:true});let original=0,drawn=0,probes=0,maxError=0;const worst=[];
 for(const c of chunks){const p=c.attributes.position.array,ix=c.index.array;original+=ix.length/3;drawn+=(c.drawIndex||ix).length/3;if(!c.drawIndex)continue;assert.ok(!/^(glass|fence|light)(@|~|$)/.test(c.family));assert.ok(c.drawIndex.length<=ix.length);for(const i of c.drawIndex)assert.ok(i<p.length/3);
  const create=index=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(new THREE.BufferAttribute(index,1));g.boundsTree=new MeshBVH(g,{strategy:CENTER,indirect:true,verbose:false});return g;};const source=create(ix),target=create(c.drawIndex),point=new THREE.Vector3(),hit={};
  // Independent bidirectional surface distances, covering each material/chunk.
  for(const [a,b]of [[source,target],[target,source]]){const index=a.index.array,stride=Math.max(1,Math.floor(index.length/3/1500));for(let t=0;t<index.length;t+=stride*3){const ia=index[t]*3,ib=index[t+1]*3,ic=index[t+2]*3,ux=p[ib]-p[ia],uy=p[ib+1]-p[ia+1],uz=p[ib+2]-p[ia+2],vx=p[ic]-p[ia],vy=p[ic+1]-p[ia+1],vz=p[ic+2]-p[ia+2];if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-9)continue;point.set(0,0,0);for(let k=0;k<3;k++){const j=index[t+k]*3;point.x+=p[j]/3;point.y+=p[j+1]/3;point.z+=p[j+2]/3;}const distance=b.boundsTree.closestPointToPoint(point,hit)?.distance??Infinity;probes++;maxError=Math.max(maxError,distance);if(distance>.04&&worst.length<10)worst.push({family:c.family,distance,point:point.toArray()});}}
  source.dispose();target.dispose();
 }
 console.log(JSON.stringify({id,original,drawn,probes,maxError,worst}));assert.equal(worst.length,0,id+' independent surface coverage within4cm');assert.ok(drawn<original*.9,id+' meaningful detail reduction');
}
