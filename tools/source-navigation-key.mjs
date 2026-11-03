import {createHash} from 'node:crypto';
export function sourceNavigationKey(map){
 const h=createHash('sha256'),buffers=new Set();for(const b of map.brushes){h.update(JSON.stringify([b.id,b.x,b.z,b.w,b.d,b.bottom,b.top,!!b.movementOnly,b.planes?.start,b.planes?.end]));if(ArrayBuffer.isView(b.planes?.buffer))buffers.add(b.planes.buffer);else h.update(JSON.stringify(b.planes));}for(const b of buffers)h.update(Buffer.from(b.buffer,b.byteOffset,b.byteLength));
 const native=map.brushes.triangleCollision;if(native){for(const m of native.models)for(const k of (m.h?['h']:['p','i','b','l'])){const b=m[k];h.update(Buffer.from(b.buffer,b.byteOffset,b.byteLength));}h.update(JSON.stringify(native.instances));}h.update(JSON.stringify(['stairs-v2-height-bands',map.bounds,map.stepHeight]));if(map.navigationGrid&&map.navigationGrid!==1)h.update('grid:'+map.navigationGrid);if(map.navigationRefinement)h.update(JSON.stringify(map.navigationRefinement));return h.digest('hex');
}
