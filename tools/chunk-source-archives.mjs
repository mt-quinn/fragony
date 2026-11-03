import fs from 'node:fs';import path from 'node:path';import {gzipSync,gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
// Sites source pushes and static assets have bounded sizes. Preserve compressed
// bytes exactly while splitting large map archives into 16 MiB transport parts.
const directory=new URL('../dist/maps/',import.meta.url),limit=16*1024*1024;
for(const file of fs.readdirSync(directory).filter(n=>n.endsWith('.json.gz'))){
 const location=new URL(file,directory),bytes=fs.readFileSync(location);if(bytes.length<=limit)continue;
 const parts=[];for(let offset=0;offset<bytes.length;offset+=limit){const part=file+'.part-'+String(parts.length+1).padStart(3,'0')+'.bin';fs.writeFileSync(new URL(part,directory),bytes.subarray(offset,offset+limit));parts.push(part);}
 const manifest={codec:'source-chunks-v1',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),parts};fs.writeFileSync(location,gzipSync(JSON.stringify(manifest),{mtime:0}));console.log(file,bytes.length,parts.length,'lossless transport parts');
}
