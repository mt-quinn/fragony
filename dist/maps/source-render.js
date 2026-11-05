import {loadMapDetail} from './map-detail.js';
import {readCompressedJSON,decodeSourceBuffer} from './source-data.js';
export async function readSourceRender(url,onProgress,{detail=false}={}){
 const data=await readCompressedJSON(url,onProgress),types={Float32Array,Int32Array,Int16Array,Uint16Array,Uint32Array,Uint8Array};
 if(data.version!==1)throw Error('Unsupported map render data.');
 for(const chunk of data.chunks){for(const attribute of Object.values(chunk.attributes)){attribute.array=decodeSourceBuffer(attribute.blob,types[attribute.type]);if(attribute.scale)attribute.array=Float32Array.from(attribute.array,v=>v*attribute.scale);delete attribute.blob;}if(chunk.index){chunk.index.array=decodeSourceBuffer(chunk.index.blob,chunk.index.delta?Int32Array:types[chunk.index.type]);if(chunk.index.delta){const packed=chunk.index.array,array=new types[chunk.index.type](packed.length);let previous=0;for(let i=0;i<packed.length;i++)array[i]=previous+=packed[i];chunk.index.array=array;}delete chunk.index.blob;}chunk.bvh.roots=chunk.bvh.roots.map(s=>decodeSourceBuffer(s,Uint8Array).buffer);chunk.bvh.indirectBuffer=chunk.bvh.indirectBuffer?decodeSourceBuffer(chunk.bvh.indirectBuffer,types[chunk.bvh.indirectType]||(chunk.index.array.length/3>65536?Uint32Array:Uint16Array)):null;chunk.bvh.index=chunk.index?.array||null;}
 data.chunks.surfaceCleanup=data.surfaceCleanup||null;data.chunks.artProfile=data.artProfile||null;data.chunks.sourceHash=data.source||null;return detail?loadMapDetail(url,data.chunks):data.chunks;
}
