import fs from 'node:fs';import{MAP_ART_PROFILES}from'../../dist/map-art-profiles.js';import{readSourceRender}from'../../dist/maps/source-render.js';import{baselineRender,ART_BASELINE}from'./baseline.mjs';import{geometrySignature}from'./geometry-signature.mjs';
const maps={};for(const id of Object.keys(MAP_ART_PROFILES)){maps[id]=geometrySignature(await readSourceRender(baselineRender(id)));console.log(id,maps[id].triangles);}
fs.writeFileSync(new URL('../../tests/fixtures/map-art-source-geometry.json',import.meta.url),JSON.stringify({baseline:ART_BASELINE,maps},null,2)+'\n');
