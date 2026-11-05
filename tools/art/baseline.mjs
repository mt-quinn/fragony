import fs from 'node:fs';import path from 'node:path';import {gunzipSync} from 'node:zlib';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
// Immutable approved Shoot House revision; other nineteen maps are untouched here.
export const ART_BASELINE='aee5ddde752fde24be23f67d93b10012724ce2a3';
export function baselineRender(id){
 const root=fileURLToPath(new URL('../../',import.meta.url)),directory='/private/tmp/fragony-map-art-baselines/'+ART_BASELINE;fs.mkdirSync(directory,{recursive:true});
 function read(name){const local=path.join(directory,name);if(!fs.existsSync(local)){const r=spawnSync('git',['show',ART_BASELINE+':dist/maps/'+name],{cwd:root,maxBuffer:128*1024*1024});if(r.status)throw Error('Cannot read original map render '+name+': '+r.stderr.toString());fs.writeFileSync(local,r.stdout);}return fs.readFileSync(local);}
 const name=id+'-render.json.gz',bytes=read(name),manifest=JSON.parse(gunzipSync(bytes));if(manifest.parts)for(const part of manifest.parts)read(part);return pathToFileURL(path.join(directory,name));
}
