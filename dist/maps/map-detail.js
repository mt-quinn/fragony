import {readCompressedJSON,decodeSourceBuffer} from './source-data.js';
export const DETAIL_MAPS=new Set(['rust','shipment','nuketown','killhouse','vacant','showdown','firingrange','hijacked','summit','shoothouse']);
const hex=buffer=>Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
async function hash(array){return hex(await crypto.subtle.digest('SHA-256',array));}
export async function loadMapDetail(url,chunks){
 const match=/\/([^/]+)-render\.json\.gz$/.exec(url.pathname);if(!match||!DETAIL_MAPS.has(match[1]))return chunks;
 const data=await readCompressedJSON(new URL('./'+match[1]+'-detail.json.gz',url));
 if(data.version!==1||data.source!==chunks.sourceHash||data.artProfile!==chunks.artProfile||data.chunks.length!==chunks.length)throw Error('Map detail source mismatch: '+match[1]);
 await Promise.all(data.chunks.map(async(part,i)=>{if(!part)return;const c=chunks[i];if(part.family!==c.family||part.vertices!==c.attributes.position.array.length/3||part.original!==c.index.array.length||part.error>.020001||part.indexHash!==await hash(c.index.array)||part.positionHash!==await hash(c.attributes.position.array))throw Error('Map detail geometry mismatch: '+match[1]);const packed=decodeSourceBuffer(part.blob,Int32Array),array=new c.index.array.constructor(packed.length);let previous=0;for(let j=0;j<packed.length;j++){previous+=packed[j];if(previous<0||previous>=part.vertices)throw Error('Invalid map detail index');array[j]=previous;}c.drawIndex=array;}));
 chunks.detailError=data.maxError;return chunks;
}
