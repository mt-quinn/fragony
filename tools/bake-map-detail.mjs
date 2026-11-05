import * as THREE from '../dist/vendor/three.module.js';import {MeshBVH,CENTER} from '../dist/vendor/three-mesh-bvh.module.js';
import fs from 'node:fs';import {gzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import {MeshoptSimplifier as S} from './vendor/meshopt_simplifier.js';
import {readSourceRender} from '../dist/maps/source-render.js';
await S.ready;
const ids=process.argv.slice(2),hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
for(const id of ids){
 const chunks=await readSourceRender(new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url),null,{detail:false}),out=[];let before=0,after=0,maxError=0;
 for(const c of chunks){
  const p=c.attributes.position.array,n=c.attributes.normal.array,color=c.attributes.color.array,ix=c.index.array;before+=ix.length;
  let reduced=ix,error=0;
  if(!/^(fence|glass|light)(@|~|$)/.test(c.family)&&ix.length>300){
   // Rejoin only exact positions with the same paint and near-identical normals.
   // UVs are world projected; their clipping-roundoff must not split flat faces.
   const unique=new Map(),remap=new Uint32Array(p.length/3);
   for(let i=0;i<remap.length;i++){const k=i*3,key=p[k]+','+p[k+1]+','+p[k+2]+':'+Math.round(n[k]/64)+','+Math.round(n[k+1]/64)+','+Math.round(n[k+2]/64)+':'+color[k]+','+color[k+1]+','+color[k+2];let j=unique.get(key);const uv=c.attributes.uv.array;if(j!==undefined&&(Math.abs(uv[i*2]-uv[j*2])>.001||Math.abs(uv[i*2+1]-uv[j*2+1])>.001))j=undefined;if(j===undefined){j=i;unique.set(key,j);}remap[i]=j;}
   const welded=Uint32Array.from(ix,i=>remap[i]);[reduced,error]=S.simplify(welded,p,3,Math.floor(ix.length*.15/3)*3,.02,['ErrorAbsolute','Permissive']);
   if(error>.020001||!reduced.length||reduced.length>ix.length*.97){reduced=ix;error=0;}
  }
  if(reduced!==ix)reduced=repairCoverage(p,ix,reduced);
  if(reduced.length>=ix.length*.97){reduced=ix;error=0;}
  after+=reduced.length;maxError=Math.max(maxError,error);
  if(reduced===ix)out.push(null);else{const delta=new Int32Array(reduced.length);let last=0;for(let i=0;i<reduced.length;i++){delta[i]=reduced[i]-last;last=reduced[i];}out.push({family:c.family,vertices:p.length/3,original:ix.length,indexHash:hash(ix),positionHash:hash(p),error,blob:Buffer.from(delta.buffer).toString('base64')});}
 }
 const data={version:1,source:chunks.sourceHash,artProfile:chunks.artProfile,maxError,chunks:out},file=new URL('../dist/maps/'+id+'-detail.json.gz',import.meta.url);fs.writeFileSync(file,gzipSync(JSON.stringify(data),{level:9,mtime:0}));console.log(JSON.stringify({id,before:before/3,after:after/3,reduction:1-after/before,maxError,bytes:fs.statSync(file).size}));
}

function repairCoverage(p,original,reduced){
 const tree=index=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex(new THREE.BufferAttribute(index,1));g.boundsTree=new MeshBVH(g,{strategy:CENTER,indirect:true,verbose:false});return g;},point=new THREE.Vector3(),hit={},weights=[[1/3,1/3,1/3],[.5,.5,0],[.5,0,.5],[0,.5,.5],[1,0,0],[0,1,0],[0,0,1]];
 const source=tree(original),kept=[];
 function supported(index,k,bvh){for(const w of weights){point.set(0,0,0);for(let j=0;j<3;j++){const o=index[k+j]*3;point.x+=p[o]*w[j];point.y+=p[o+1]*w[j];point.z+=p[o+2]*w[j];}const distance=bvh.closestPointToPoint(point,hit,0,.025)?.distance??Infinity;if(distance>.025)return false;}return true;}
 for(let k=0;k<reduced.length;k+=3)if(supported(reduced,k,source.boundsTree))kept.push(reduced[k],reduced[k+1],reduced[k+2]);
 source.dispose();if(!kept.length)return original;const target=tree(new Uint32Array(kept));
 for(let k=0;k<original.length;k+=3)if(!supported(original,k,target.boundsTree))kept.push(original[k],original[k+1],original[k+2]);
 target.dispose();return new Uint32Array(kept);
}
