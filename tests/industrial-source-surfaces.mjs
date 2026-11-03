import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {SOURCE_ARENAS} from '../dist/maps/source-arenas.js';
import {readSourceData} from '../dist/maps/source-data.js';
import {readSourceRender} from '../dist/maps/source-render.js';
const id=process.argv[2];
if(!id){for(const map of SOURCE_ARENAS){const r=spawnSync(process.execPath,['--max-old-space-size=10000',import.meta.filename,map.id],{stdio:'inherit'});if(r.status)process.exit(r.status);}console.log('All16 prepared industrial source surfaces preserved.');}
else{
 const source=await readSourceData(new URL('../dist/maps/'+id+'-data.json.gz',import.meta.url));
 const chunks=await readSourceRender(new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url));
 const area=(a,b,c)=>Math.hypot((b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
 let before=0,after=0;const p=[[],[],[]];
 for(const[k,g]of Object.entries(source.groups))if(k!=='water')for(let i=0;i<g.p.length;i+=9){for(let j=0;j<3;j++)for(let n=0;n<3;n++)p[j][n]=g.p[i+j*3+n];before+=area(...p);}
 for(const c of chunks){assert.ok(c.attributes.color.array.length);for(let i=0;i<c.index.array.length;i+=3){for(let j=0;j<3;j++)for(let n=0;n<3;n++)p[j][n]=c.attributes.position.array[c.index.array[i+j]*3+n];after+=area(...p);}}
 assert.ok(Math.abs(before-after)/before<.00003,id+' complete surface area after district cuts/quantization');
 console.log(id+': source surface area retained ('+(Math.abs(before-after)/before*100).toFixed(6)+'% quantization difference), '+chunks.length+' spatial chunks.');
}
