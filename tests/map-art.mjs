import assert from 'node:assert/strict';import fs from 'node:fs';import{createHash}from'node:crypto';import{gunzipSync}from'node:zlib';import {spawnSync} from 'node:child_process';
import * as THREE from '../dist/vendor/three.module.js';
import {MAP_ART_PROFILES} from '../dist/map-art-profiles.js';import {mapArtPalette} from '../dist/map-art-colors.js';
import {readSourceRender} from '../dist/maps/source-render.js';import {geometrySignature} from '../tools/art/geometry-signature.mjs';
import {styleMapArtMaterial} from '../dist/map-art-materials.js';
import {industrialGroups} from '../dist/industrial.js';import {setArenaAtmosphere} from '../dist/testworks.js';import {FrameRenderer} from '../dist/presentation.js';
const id=process.argv[2],root=new URL('../research/map-art-roster/',import.meta.url);
if(!id){
 assert.equal(Object.keys(MAP_ART_PROFILES).length,19);assert.ok(!MAP_ART_PROFILES.shoothouse,'approved Shoot House retains its dedicated implementation');
 const gamuts=new Set();for(const [id,p]of Object.entries(MAP_ART_PROFILES)){
  assert.equal(p.colors.length,4);assert.equal(new Set(p.colors).size,4);const key=[...p.colors].sort().join();assert.ok(!gamuts.has(key),id+' has an independent gamut');gamuts.add(key);
  const palette=mapArtPalette(id);assert.equal(palette.world.length,18);assert.equal(mapArtPalette(id),palette,'palette cache');assert.ok(palette.world.every(c=>/^#[0-9a-f]{6}$/i.test(c)));
  for(const a of p.areas){assert.notEqual(a.primary,a.accent,id+'/'+a.id+' primary and accent differ');assert.ok(a.seeds.length);assert.ok(a.seeds.flat().every(Number.isFinite));}
  const ledger=JSON.parse(fs.readFileSync(new URL(id+'-ledger.json',root)));assert.deepEqual(ledger.colors,p.colors,id+' bake matches final authored gamut');assert.equal(ledger.floor,p.floor);assert.equal(ledger.ink,p.ink);assert.ok(ledger.seeds.every(s=>s.displacement<.001&&s.heightDifference<.001),id+' exact native walk-space anchors');
  const result=spawnSync(process.execPath,['--max-old-space-size=3072',import.meta.filename,id],{stdio:'inherit'});assert.equal(result.status,0,id+' geometry/color acceptance');
 }
 // The final output bank and lighting must switch and reset across cached maps.
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0,1,2);const hemi=new THREE.HemisphereLight();scene.add(hemi,new THREE.DirectionalLight());
 const renderer={extensions:{has:()=>false},capabilities:{maxSamples:4},getDrawingBufferSize:v=>v.set(320,180),toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1,setRenderTarget(){},setClearColor(){},clear(){},shadowMap:{autoUpdate:true},getRenderTarget:()=>null,getClearColor:c=>c.set(0),getClearAlpha:()=>1,render(){}};
 const camera=new THREE.PerspectiveCamera(),frame=new FrameRenderer(renderer,scene,camera,{ao:false,bloom:false,antialias:false});
 for(const id of ['rust','summit','shoothouse','nuketown','unskinned']){
  const p=MAP_ART_PROFILES[id];setArenaAtmosphere(scene,{id,renderChunks:p?{artProfile:id}:undefined});frame.render(scene,camera,1/60);
  assert.equal(frame.forge.uniforms.arenaRoster.value,p?1:0);assert.equal(frame.forge.uniforms.arenaArt.value,p||id==='shoothouse'?1:0);
  if(p){assert.equal(hemi.intensity,p.lighting.hemi);assert.equal(scene.userData.mapArtId,id);const c=frame.forge.uniforms.rosterColors.value[1];const hex=parseInt(p.colors[0].slice(1),16);assert.deepEqual(c.toArray(),[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255]);}
  if(id==='shoothouse'){assert.equal(scene.userData.shootHouseArt,true);assert.equal(scene.userData.mapArtId,null);assert.equal(scene.environmentIntensity,.5);}
  if(id==='unskinned'){assert.equal(scene.userData.mapArtId,null);assert.equal(hemi.intensity,1);}
 }
 frame.dispose();const variants=[];for(const [id,base] of [['rust',0],['mutiny',7.5]]){const material=new THREE.MeshStandardMaterial({vertexColors:true});styleMapArtMaterial(material,'roster:'+id+':0:dado:'+base);const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};material.onBeforeCompile(shader);variants.push({key:material.customProgramCacheKey(),shader});assert.equal(shader.uniforms.mapArtBase.value,base);material.dispose();}assert.equal(variants[0].key,variants[1].key,'area colors and story heights share one graphic shader');assert.notEqual(variants[0].shader.uniforms.mapArtAccent.value.getHex(),variants[1].shader.uniforms.mapArtAccent.value.getHex());console.log('Map art:19 independently authored gamuts, native area anchors, source triangle fingerprints, valid packed paint colors, quiet floors, shared graphics and cached map transitions pass.');
}else{
 const ledger=JSON.parse(fs.readFileSync(new URL(id+'-ledger.json',root))),bytes=fs.readFileSync(new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url));let transport; if(bytes.length<4096)transport=JSON.parse(gunzipSync(bytes));assert.equal(transport?.codec==='source-chunks-v1'?transport.sha256:createHash('sha256').update(bytes).digest('hex'),ledger.sha256,id+' reviewed asset fingerprint');
 const p=MAP_ART_PROFILES[id],chunks=await readSourceRender(new URL('../dist/maps/'+id+'-render.json.gz',import.meta.url)),expected=JSON.parse(fs.readFileSync(new URL('fixtures/map-art-source-geometry.json',import.meta.url))).maps[id],actual=geometrySignature(chunks);
 for(const key of ['triangles','sumA','sumB','xorA','xorB'])assert.equal(actual[key],expected[key],id+' original source coverage '+key);assert.ok(Math.abs(actual.area-expected.area)<Math.max(.001,expected.area*1e-9));assert.equal(chunks.artProfile,id);
 const allowed=new Set(),floor=new Set();for(const [i,hex]of [...p.colors,p.floor,p.ink].entries())for(const shade of [.82,.88,1,1.03]){const c=new THREE.Color(hex).multiplyScalar(shade),key=c.toArray().map(v=>Math.max(0,Math.min(255,Math.round(v*255)))).join(',');allowed.add(key);if(i===4)floor.add(key);}
 let floorVertices=0;for(const chunk of chunks){const c=chunk.attributes.color.array,n=chunk.attributes.normal,ix=chunk.index.array;if(!/^(fence|glass|light)@/.test(chunk.family))for(let k=0;k<ix.length;k+=3){const ny=(n.array[ix[k]*3+1]+n.array[ix[k+1]*3+1]+n.array[ix[k+2]*3+1])/(n.normalized?32767:1)/3;if(ny>.62)assert.ok(chunk.family.startsWith('asphalt@'),id+' upward decks are floors even when imported as rubber or steel');}for(let k=0;k<c.length;k+=3){const key=c[k]+','+c[k+1]+','+c[k+2];assert.ok(allowed.has(key),id+' packed vertex belongs to authored gamut');if(chunk.family.startsWith('asphalt@')){assert.ok(floor.has(key),id+' every walking elevation uses quiet floor paint');floorVertices++;}}}
 assert.ok(floorVertices>0);for(const {geometry,material,family}of industrialGroups({id,renderChunks:chunks})){if(family.startsWith('asphalt@')){assert.equal(material.map,null);assert.equal(material.bumpMap,null);}if(material.onBeforeCompile&&/:(dado|frieze|pilaster|datum|mark):/.test(family)){const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};material.onBeforeCompile(shader);assert.match(shader.fragmentShader,/vMapArtNormal/);assert.ok(shader.uniforms.mapArtAccent);assert.match(shader.vertexShader,/vMapArtPosition/);}geometry.dispose();}
 console.log(id+': '+actual.triangles+' exact source triangles, '+chunks.length+' batches, valid final paints at all elevations');
}
