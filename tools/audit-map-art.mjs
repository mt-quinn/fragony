import fs from 'node:fs';
import {MAP_ART_PROFILES} from '../dist/map-art-profiles.js';
import {loadArtMap} from './art/load-map.mjs';
import {surfaceAssemblies} from './art/geometry-assemblies.mjs';
import {artSpaceOwnership} from './art/space-ownership.mjs';
const id=process.argv[2],profile=MAP_ART_PROFILES[id];if(!profile)throw Error('Choose a map color script.');
const start=performance.now(),map=await loadArtMap(id,{baseline:true}),geometry=surfaceAssemblies(map.renderChunks),spaces=artSpaceOwnership(map.artNavigation,profile),counts={},components=[];
for(const c of geometry.assemblies){const o=spaces.owner(c);counts[o.area.id]=(counts[o.area.id]||0)+c.area;components.push({...c,owner:o.area.id,floor:o.floor});}
const nodes=map.artNavigation.nodes.map(n=>[n.x,n.y,n.z,spaces.labels[n.id]]),levels=new Map();for(const n of nodes){const y=Math.round(n[1]*4)/4;levels.set(y,(levels.get(y)||0)+1);}
const data={id,palette:profile.name,triangles:geometry.triangles,assemblies:geometry.assemblies.length,seeds:spaces.seeds,areas:counts,levels:[...levels].sort((a,b)=>b[1]-a[1]).slice(0,20),nodes,components,spawns:map.spawns};
fs.mkdirSync(new URL('../research/map-art-roster/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../research/map-art-roster/'+id+'-analysis.json',import.meta.url),JSON.stringify(data));
console.log(JSON.stringify({...data,nodes:undefined,components:undefined,spawns:undefined,seconds:Math.round((performance.now()-start)/1000)}));
