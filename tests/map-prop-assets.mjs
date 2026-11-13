import assert from 'node:assert/strict';
import {readSourceRender} from '../dist/maps/source-render.js';
import {readCompressedJSON,decodeSourceBuffer} from '../dist/maps/source-data.js';
import {isClosedComponent} from '../tools/map-prop-components.mjs';
import {COMPILED_PROP_MAP_IDS} from '../dist/maps/compiled-map-manifest.js';
// Independently compare every transformed prototype triangle to its original
// source triangle, including winding, normal, paint and world-projected UV.
for(const id of process.argv.slice(2).length?process.argv.slice(2):COMPILED_PROP_MAP_IDS){
 const url=new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url),chunks=await readSourceRender(url,null,{detail:true}),raw=await readCompressedJSON(new URL('../dist/maps/'+id+'-clusters.json.gz',import.meta.url));let triangles=0,instances=0;
 const decode=part=>{const packed=decodeSourceBuffer(part.blob,Int32Array);let at=0;return Uint32Array.from(packed,v=>at+=v);};
 for(let pi=0;pi<chunks.props.prototypes.length;pi++){
  const prototype=chunks.props.prototypes[pi];
  if(prototype.closed){const positions=[],index=[];for(const part of prototype.parts){const p=chunks[part.chunk].attributes.position.array;for(const i of part.levels[0].index){index.push(index.length);positions.push(p[i*3],p[i*3+1],p[i*3+2]);}}const vertices=Array.from({length:index.length},(_,i)=>i),min=[0,1,2].map(k=>positions.reduce((m,v,i)=>i%3===k?Math.min(m,v):m,Infinity));assert(isClosedComponent({attributes:{position:{array:positions}}},{index,vertices,min}),id+' front-sided prototype must remain closed at its rendered near level');}
  for(let ii=0;ii<prototype.instances.length;ii++){
   const instance=prototype.instances[ii],targets=new Map(),cell=.004,key=(family,x,y,z)=>family+':'+Math.floor(x/cell)+','+Math.floor(y/cell)+','+Math.floor(z/cell);let remaining=0;
   for(const part of raw.props.prototypes[pi].instances[ii].sourceParts){const c=chunks[part.chunk],p=c.attributes.position.array,ix=decode(part);for(let t=0;t<ix.length;t+=3){const ids=Array.from(ix.slice(t,t+3)),center=[0,1,2].map(k=>ids.reduce((s,i)=>s+p[i*3+k],0)/3),k=key(c.family,...center);let list=targets.get(k);if(!list)targets.set(k,list=[]);list.push({c,ids});remaining++;}}
   for(const part of prototype.parts){const c=chunks[part.chunk],p=c.attributes.position.array,ix=part.levels[0].index;assert(c.projectedUV,'shared prop shader requires projected UV');for(let t=0;t<ix.length;t+=3){const ids=Array.from(ix.slice(t,t+3)),center=[0,1,2].map(k=>ids.reduce((s,i)=>s+p[i*3+k]+instance.offset[k],0)/3);let found=false;
    for(let x=-1;x<=1&&!found;x++)for(let y=-1;y<=1&&!found;y++)for(let z=-1;z<=1&&!found;z++){const list=targets.get(key(c.family,center[0]+x*cell,center[1]+y*cell,center[2]+z*cell));if(!list)continue;for(let j=0;j<list.length&&!found;j++){const target=list[j];for(let rotation=0;rotation<3&&!found;rotation++){
     const match=ids.every((i,v)=>{const other=target.ids[(v+rotation)%3],a=c.attributes,b=target.c.attributes;if(Math.hypot(...[0,1,2].map(k=>a.position.array[i*3+k]+instance.offset[k]-b.position.array[other*3+k]))>instance.error+1e-6)return false;for(const name of ['normal','color'])for(let k=0;k<3;k++)if(a[name].array[i*3+k]!==b[name].array[other*3+k])return false;const axis=c.uvAxes[i],axes=axis===0?[2,1]:axis===1?[0,2]:[0,1];return axes.every((k,n)=>Math.abs(a.uv.array[i*2+n]+instance.offset[k]*.45-b.uv.array[other*2+n])<.0011);});if(match){list.splice(j,1);remaining--;found=true;}
    }}}
    assert(found,`${id} prototype ${pi}, instance ${ii}, triangle ${t/3} has an original matching oriented source face`);triangles++;
   }}assert.equal(remaining,0,'each original prop face is used exactly once');instances++;
  }
 }console.log(JSON.stringify({id,instances,triangles,sourcePaintNormalsWindingAndUV:true}));
}
