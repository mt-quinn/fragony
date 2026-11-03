import fs from 'node:fs';import path from 'node:path';import specs from '../dist/maps/source-arena-specs.js';import {fileURLToPath} from 'node:url';import {gzipSync} from 'node:zlib';
// Preserve authoring archives in source; ship the prepared render/physics used
// by the active browser build. Local authoring and previews still use dist.
const root=new URL('../',import.meta.url),source=new URL('dist/',root),output=new URL('build/',root),excluded=new Set();
for(const spec of specs){
 if(!spec.precompiled)continue;
 for(const family of ['render','physics'])if(!fs.existsSync(new URL('maps/'+spec.id+'-'+family+'.json.gz',source)))throw Error('Missing prepared '+family+' for '+spec.id);
 const prefix=spec.id+'-data.json.gz';for(const file of fs.readdirSync(new URL('maps/',source)))if(file===prefix||file.startsWith(prefix+'.part-'))excluded.add('maps/'+file);
}
fs.rmSync(output,{recursive:true,force:true});
fs.cpSync(source,output,{recursive:true,filter:file=>!excluded.has(path.relative(fileURLToPath(source),file).split(path.sep).join('/'))});
// The original Nuketown module exceeds the static per-file ceiling. Emit its
// exact JSON payload separately, preserving the original decoder verbatim.
const nuketownSource=fs.readFileSync(new URL('maps/nuketown-data.js',source),'utf8'),start=nuketownSource.indexOf('const data='),end=nuketownSource.indexOf(';\nfor(const g of',start);
if(start<0||end<0)throw Error('Unrecognized Nuketown source module.');
fs.writeFileSync(new URL('maps/nuketown-source.json.gz',output),gzipSync(nuketownSource.slice(start+11,end),{level:6,mtime:0}));
fs.writeFileSync(new URL('maps/nuketown-data.js',output),nuketownSource.slice(0,start)+"import {readCompressedJSON} from './source-data.js';\nconst data=await readCompressedJSON(new URL('./nuketown-source.json.gz',import.meta.url))"+nuketownSource.slice(end));
let bytes=0,files=0;function inspect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())inspect(p);else{const s=fs.statSync(p).size;if(s>25*1024*1024)throw Error('Production file exceeds 25 MiB: '+p);bytes+=s;files++;}}}inspect(fileURLToPath(output));
console.log(JSON.stringify({files,bytes,excludedAuthoringFiles:excluded.size}));
