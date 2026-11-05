import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {MapPaletteLookup,mapPaletteGLSL} from '../dist/map-palette-lookup.js';
import {mapArtPalette} from '../dist/map-art-colors.js';
import {MAP_ART_PROFILES} from '../dist/map-art-profiles.js';
import {SHOOTHOUSE_RAMPS} from '../dist/shoothouse-art.js';
const lookup=new MapPaletteLookup();let texture;
for(const id of ['shoothouse',...Object.keys(MAP_ART_PROFILES)]){
 assert.equal(lookup.sync(id),true);texture??=lookup.texture;assert.equal(lookup.texture,texture,'one bounded atlas across map transitions');assert.equal(texture.image.width,512);assert.equal(texture.image.height,1024);assert.equal(texture.minFilter,THREE.NearestFilter);
 const world=id==='shoothouse'?SHOOTHOUSE_RAMPS:mapArtPalette(id).world,allowed=new Set(world.map(c=>parseInt(c.slice(1),16))),d=texture.image.data;
 for(let i=0;i<512*512*4;i+=4)assert.ok(allowed.has((d[i]<<16)|(d[i+1]<<8)|d[i+2]),id+' world lookup contains only authored swatches');
 for(const hex of world){const n=parseInt(hex.slice(1),16),r=Math.round((n>>16&255)/255*63),g=Math.round((n>>8&255)/255*63),b=Math.round((n&255)/255*63),i=((Math.floor(b/8)*64+g)*512+b%8*64+r)*4;assert.equal((d[i]<<16)|(d[i+1]<<8)|d[i+2],n,id+' authored swatch survives the filter');}
 const version=texture.version;lookup.sync(id);assert.equal(texture.version,version,'no rebuild/upload per frame');
}
assert.equal(lookup.sync('unskinned'),false);assert.equal(lookup.sync(null),false);let disposed=0;texture.addEventListener('dispose',()=>disposed++);lookup.dispose();assert.equal(disposed,1);assert.equal(lookup.texture,null);assert.match(mapPaletteGLSL,/texture2D/);assert.doesNotMatch(mapPaletteGLSL,/for\s*\(/,'no per-fragment palette search');
console.log('Map palette: all20 authored world gamuts and exact swatches survive, nearest filtering prevents invented colors, one bounded atlas, no per-frame rebuilds, fallback and disposal pass.');
