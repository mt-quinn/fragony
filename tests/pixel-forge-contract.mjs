import assert from 'node:assert/strict';
import {mapPaletteGLSL} from '../dist/map-palette-lookup.js';
// The user approved authored output colors, while retaining the historical
// surface grain, grid, edges, actor protection and water composition verbatim.
export function assertForgeCore(actual,historical){
 const stripped=actual.replace(mapPaletteGLSL+'\n','').replace('c=authoredPalette>.5?forgeMapPalette(forgeRead(q)+vec3(surfaceValue*.085),texture2D(worldDepth,q).r>=.99999):forgePalette(forgeRead(q)+vec3(surfaceValue*.085));','c=forgePalette(forgeRead(q)+vec3(surfaceValue*.085));');
 assert.equal(stripped,historical,'historical filter differs only by the approved authored palette lookup');
}
