import assert from 'node:assert/strict';
import {mapPaletteGLSL} from '../dist/map-palette-lookup.js';
// The user approved authored output colors, while retaining the historical
// grain pattern, grid, edges, actor protection and water composition. The
// later approved fade change alters only the grain attenuation curve.
export function historicalGrainFade(shader){return shader.replace(' // Keep close detail, then taper gently instead of cutting off at footprint 2.\n float grainSpread=max(0.,footprint-.75)*.4;\n return (dot(vec3(yz,xz,xy),n)-.5)/(1.+grainSpread*grainSpread);',' return (dot(vec3(yz,xz,xy),n)-.5)*(1.-smoothstep(.75,2.,footprint));');}
export function assertForgeCore(actual,historical){
 const stripped=actual.replace(mapPaletteGLSL+'\n','').replace('c=authoredPalette>.5?forgeMapPalette(forgeRead(q)+vec3(surfaceValue*.085),texture2D(worldDepth,q).r>=.99999):forgePalette(forgeRead(q)+vec3(surfaceValue*.085));','c=forgePalette(forgeRead(q)+vec3(surfaceValue*.085));');
 assert.equal(historicalGrainFade(stripped),historical,'historical filter differs only by the approved palette lookup and softer grain fade');
}
