import {TriangleCollision} from './triangle-collision.js';
// Source archives are fetched only for the selected arena. Browsers use native
// streaming decompression; offline navigation and QA use the same data in Node.
export async function readCompressedJSON(url,onProgress){
 onProgress?.(0);
 let data;
 if(typeof process!=='undefined'&&process.versions?.node){
  const [{readFile},{gunzipSync}]=await Promise.all([import('node:fs/promises'),import('node:zlib')]);data=JSON.parse(gunzipSync(await readFile(url)).toString());
  let completed=0;if(data.codec==='source-chunks-v1')data=JSON.parse(gunzipSync(Buffer.concat(await Promise.all(data.parts.map(async part=>{const bytes=await readFile(new URL(part,url));onProgress?.(++completed/data.parts.length);return bytes;})))).toString());
 }else{
  const response=await fetch(url);if(!response.ok)throw Error('Could not load map geometry ('+response.status+').');
  data=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
  if(data.codec==='source-chunks-v1'){
   const parts=data.parts;let index=0,reader=null;
   // Stream compressed parts in order, without retaining a second map-sized buffer.
   const stream=new ReadableStream({async pull(controller){try{while(true){if(!reader){if(index===parts.length){controller.close();return;}const part=await fetch(new URL(parts[index++],url));if(!part.ok)throw Error('Could not load map data ('+part.status+').');reader=part.body.getReader();}const next=await reader.read();if(next.done){onProgress?.(index/parts.length);reader=null;continue;}controller.enqueue(next.value);return;}}catch(error){controller.error(error);}},cancel(){return reader?.cancel();}});
   data=await new Response(stream.pipeThrough(new DecompressionStream('gzip'))).json();
  }
 }
 onProgress?.(1);return data;
}
export function decodeSourceBuffer(s,T){if(typeof Buffer!=='undefined'){const b=Buffer.from(s,'base64');return new T(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const raw=atob(s),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new T(bytes.buffer);}
export async function readSourceData(url,onProgress){
 const data=await readCompressedJSON(url,onProgress),decode=decodeSourceBuffer;

 if(data.collision){
  const c=data.collision,b=decode(c.bounds,Float32Array),planes=decode(c.planes,Float32Array),offsets=decode(c.offsets,Uint32Array);
  data.brushes=Array.from({length:offsets.length-1},(_,i)=>({id:c.ids[i],x:b[i*7],z:b[i*7+1],w:b[i*7+2],d:b[i*7+3],bottom:b[i*7+4],top:b[i*7+5],movementOnly:!!b[i*7+6],planes:new PackedPlanes(planes,offsets[i],offsets[i+1])}));
  delete data.collision;
 }
 if(data.triangleCollision){data.brushes.triangleCollision=new TriangleCollision(data.triangleCollision,decode);delete data.triangleCollision;}
 for(const g of Object.values(data.groups)){
  if(g.codec==='source-v2'){
   const p=decode(g.pv,Int32Array),ix=decode(g.ix,Uint32Array),oct=decode(g.nv,Int16Array);g.p=new Float32Array(ix.length*3);g.n=new Float32Array(ix.length*3);g.c=new Float32Array(0);
   for(let i=0;i<ix.length;i++){for(let k=0;k<3;k++)g.p[i*3+k]=p[ix[i]*3+k]/4096;const j=(g.flat?Math.floor(i/3):i)*2;let x=oct[j]/32767,y=oct[j+1]/32767,z=1-Math.abs(x)-Math.abs(y);if(z<0){const a=x;x=(1-Math.abs(y))*(x>=0?1:-1);y=(1-Math.abs(a))*(y>=0?1:-1);}const l=Math.hypot(x,y,z)||1;g.n[i*3]=x/l;g.n[i*3+1]=y/l;g.n[i*3+2]=z/l;}delete g.pv;delete g.ix;delete g.nv;continue;
  }
  let v;if(g.q){const raw=decode(g.v,Uint8Array),view=new DataView(raw.buffer);v=new Float32Array(raw.length/18*6);for(let i=0;i<raw.length/18;i++)for(let k=0;k<3;k++){v[i*6+k]=view.getInt32(i*18+k*4,true)/4096;v[i*6+3+k]=view.getInt16(i*18+12+k*2,true)/32767;}}else v=decode(g.v,Float32Array);
  const ix=decode(g.i,Uint32Array);g.p=new Float32Array(ix.length*3);g.n=new Float32Array(ix.length*3);g.c=new Float32Array(0);
  for(let i=0;i<ix.length;i++)for(let k=0;k<3;k++){g.p[i*3+k]=v[ix[i]*6+k];g.n[i*3+k]=v[ix[i]*6+3+k]}delete g.v;delete g.i;
 }
 return data;
}
class PackedPlanes{
 constructor(buffer,start,end){this.buffer=buffer;this.start=start;this.end=end;this.length=end-start;}
 // Consumers destructure each plane immediately. One iterator-local value
 // avoids allocating five small arrays for every narrow collision query.
 *[Symbol.iterator](){const p=[0,0,0,0];for(let i=this.start*4;i<this.end*4;i+=4){p[0]=this.buffer[i];p[1]=this.buffer[i+1];p[2]=this.buffer[i+2];p[3]=this.buffer[i+3];yield p;}}
 toJSON(){return Array.from(this,p=>Array.from(p));}
}
