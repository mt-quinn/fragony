import {readSourceRender}from'./source-render.js';
// Older source maps use the same offline prepared surfaces as the later maps.
// Keep their original collision/entity data; load only the selected visual mesh.
export function withPreparedRender(map){let pending=null;map.renderReady=false;map.loadRender=()=>map.renderChunks?Promise.resolve(map):pending||(pending=readSourceRender(new URL('./'+map.id+'-render.json.gz',import.meta.url),undefined,{detail:true}).then(chunks=>{map.renderChunks=chunks;map.renderInfo={artProfile:chunks.artProfile};map.renderReady=true;return map;}).finally(()=>pending=null));map.unload=()=>{if(map.id==='reservoir')return;delete map.renderChunks;map.renderReady=false;};return map;}
