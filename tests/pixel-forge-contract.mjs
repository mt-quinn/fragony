import assert from 'node:assert/strict';
import {mapPaletteGLSL} from '../dist/map-palette-lookup.js';
// The user approved authored output colors, while retaining the historical
// grain pattern, grid, edges, actor protection and water composition. The
// later approved fade change alters only the grain attenuation curve.
export function historicalGrainCore(shader){
 return shader.replace(' vec3 n=abs(cross(dFdx(p),dFdy(p)));\n // Remove derivative magnitude before sharpening the axis weights. Otherwise\n // small nearby footprints collapse below the epsilon and erase the grain.\n n/=max(max(n.x,n.y),max(n.z,.00000001));\n n=pow(n,vec3(4.));n/=max(dot(n,vec3(1.)),.00001);',' vec3 n=abs(cross(dFdx(p),dFdy(p)));n=pow(n,vec3(4.));n/=max(dot(n,vec3(1.)),.00001);')
 .replace(' // Keep close detail, then taper gently instead of cutting off at footprint 2.\n float grainSpread=max(0.,footprint-.75)*.4;\n return dot(vec3(yz,xz,xy)-vec3(.5),n)/(1.+grainSpread*grainSpread);',' return (dot(vec3(yz,xz,xy),n)-.5)*(1.-smoothstep(.75,2.,footprint));');
}
export function assertForgeCore(actual,historical){
 const stripped=actual.replace(mapPaletteGLSL+'\n','').replace('c=authoredPalette>.5?forgeMapPalette(forgeRead(q)+vec3(surfaceValue*.085),texture2D(worldDepth,q).r>=.99999):forgePalette(forgeRead(q)+vec3(surfaceValue*.085));','c=forgePalette(forgeRead(q)+vec3(surfaceValue*.085));');
 assert.equal(historicalGrainCore(stripped),historical,'historical filter differs only by the approved palette lookup and grain attenuation/normalization fixes');
}
