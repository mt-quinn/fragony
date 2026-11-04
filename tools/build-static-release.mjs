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
// Compress the exact inline geometry JSON; retain each original decoder.
for(const id of ['rust','shipment','nuketown']){
 const text=fs.readFileSync(new URL('maps/'+id+'-data.js',source),'utf8'),start=text.indexOf('const data='),begin=start+11;
 if(start<0||text[begin]!=='{')throw Error('Unrecognized inline source: '+id);
 let depth=0,quoted=false,escaped=false,end=begin;
 for(;end<text.length;end++){
  const c=text[end];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end++;break;}
 }
 const json=text.slice(begin,end),groupKey=json.indexOf('"groups":'),groupStart=json.indexOf('{',groupKey);if(groupKey<0||groupStart<0)throw Error('Missing source groups: '+id);let groupEnd=groupStart,groupDepth=0,inString=false,escape=false;for(;groupEnd<json.length;groupEnd++){const c=json[groupEnd];if(inString){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')inString=false;continue;}if(c==='"')inString=true;else if(c==='{')groupDepth++;else if(c==='}'&&!--groupDepth){groupEnd++;break;}}const payload=json.slice(0,groupStart)+'{}'+json.slice(groupEnd);
 fs.writeFileSync(new URL('maps/'+id+'-source.json.gz',output),gzipSync(payload,{level:9,mtime:0}));
 fs.writeFileSync(new URL('maps/'+id+'-data.js',output),text.slice(0,start)+"import {readCompressedJSON} from './source-data.js';\nconst data=await readCompressedJSON(new URL('./"+id+"-source.json.gz',import.meta.url))"+text.slice(end));
}
// Navigation stays byte-for-byte identical after decoding. Store packed graph
// strings compressed instead of shipping their much larger base64 JS literals.
for(const file of fs.readdirSync(new URL('maps/',source)).filter(f=>f.endsWith('-nav.js'))){
 const text=fs.readFileSync(new URL('maps/'+file,source),'utf8'),match=/export default ("[^"\n]*");/.exec(text);
 if(!match)throw Error('Unrecognized navigation module: '+file);
 const archive=file.replace(/\.js$/,'.json.gz');
 fs.writeFileSync(new URL('maps/'+archive,output),gzipSync(match[1],{level:9,mtime:0}));
 fs.writeFileSync(new URL('maps/'+file,output),text.replace(match[0],"import {readCompressedJSON} from './source-data.js';\nexport default await readCompressedJSON(new URL('./"+archive+"',import.meta.url));"));
}
let bytes=0,files=0;function inspect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())inspect(p);else{const s=fs.statSync(p).size;if(s>25*1024*1024)throw Error('Production file exceeds 25 MiB: '+p);bytes+=s;files++;}}}inspect(fileURLToPath(output));
if(bytes>250*1024*1024)throw Error('Production package exceeds expanded archive budget.');
console.log(JSON.stringify({files,bytes,excludedAuthoringFiles:excluded.size}));
