import assert from 'node:assert/strict';
import {MAPS} from '../dist/map.js';
import {industrialDistricts,industrialDistrict} from '../dist/industrial.js';
import {MAP_FINISHES,INDUSTRIAL_FINISHES} from '../dist/industrial-palettes.js';
import {industrialSurface} from '../dist/industrial-surfaces.js';
let count=0;
for(const map of MAPS){
 const areas=industrialDistricts(map.id);assert.ok(areas.length>=4,map.id+' distinct physical districts');
 assert.equal(areas.length,MAP_FINISHES[map.id].length);assert.ok(new Set(areas.map(a=>a.wall)).size>=4,map.id+' visible area color separation');
 if(map.id!=='shoothouse')assert.ok(new Set(areas.map(a=>a.wallType)).size>=2,map.id+' area wall finish contrast');
 if(map.id!=='shoothouse')assert.ok(new Set(areas.map(a=>a.type)).size>=2,map.id+' floor finish contrast');
 for(const a of areas){if(map.id==='shoothouse'){const expected={scrap:0xb96c60,cargo:0xc5b69b,office:0x347c79,north:0x76546f,south:0xc5b69b,lane:0x347c79};assert.equal(a.wall,expected[a.id]);assert.equal(a.floor,0x526776);assert.notEqual(a.accent,a.wall);}else assert.equal(a.wall,INDUSTRIAL_FINISHES[a.finish].wall);assert.ok(a.name&&a.id);count++;}
 for(const p of map.spawns||[])assert.ok(areas.includes(industrialDistrict(map.id,...p)),map.id+' spawn belongs to a physical district');
}
for(const family of ['brick','wood','concrete','asphalt','tile','steel','paint','coated']){
 const s=industrialSurface(family);assert.equal(s,industrialSurface(family),'reuse physical texture set');
 for(const key of ['map','bumpMap','roughnessMap']){const t=s[key];assert.equal(t.image.width,256);assert.equal(t.image.height,256);assert.ok(t.generateMipmaps);assert.equal(t.anisotropy,4);let lo=255,hi=0;for(let i=0;i<t.image.data.length;i+=4){lo=Math.min(lo,t.image.data[i]);hi=Math.max(hi,t.image.data[i]);}assert.ok(hi>lo,family+' has visible '+key+' variation');}
 assert.ok(s.bumpScale>0&&s.bumpScale<=.025,'relief stays in millimetres');
}
console.log(`Industrial materials: ${MAPS.length} maps / ${count} physical districts, separated colors and wall/floor finishes, eight shared mipmapped physical texture sets pass.`);
