import {readCompressedJSON,decodeSourceBuffer} from './source-data.js';
export async function readSourceRender(url){
 const data=await readCompressedJSON(url),types={Float32Array,Int32Array,Int16Array,Uint16Array,Uint32Array,Uint8Array};
 if(data.version!==1)throw Error('Unsupported map render data.');
 for(const chunk of data.chunks){for(const attribute of Object.values(chunk.attributes)){attribute.array=decodeSourceBuffer(attribute.blob,types[attribute.type]);if(attribute.scale)attribute.array=Float32Array.from(attribute.array,v=>v*attribute.scale);delete attribute.blob;}if(chunk.index){chunk.index.array=decodeSourceBuffer(chunk.index.blob,types[chunk.index.type]);delete chunk.index.blob;}chunk.bvh.roots=chunk.bvh.roots.map(s=>decodeSourceBuffer(s,Uint8Array).buffer);chunk.bvh.indirectBuffer=chunk.bvh.indirectBuffer?decodeSourceBuffer(chunk.bvh.indirectBuffer,types[chunk.bvh.indirectType]||(chunk.index.array.length/3>65536?Uint32Array:Uint16Array)):null;chunk.bvh.index=chunk.index?.array||null;}
 return data.chunks;
}
