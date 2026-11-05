import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {readSourceRender} from '../dist/maps/source-render.js';
import * as THREE from '../dist/vendor/three.module.js';
import {SHOOTHOUSE_COLORS as C,SHOOTHOUSE_RAMPS,SHOOTHOUSE_AREAS,prepareShootHouseObjects,shootHouseSurface,styleShootHouseMaterial} from '../dist/shoothouse-art.js';
import {setArenaAtmosphere} from '../dist/testworks.js';
import {FrameRenderer} from '../dist/presentation.js';
const source=JSON.parse(gunzipSync(fs.readFileSync(new URL('../tools/art/shoothouse-objects.json.gz',import.meta.url))));
assert.ok(source.componentSplit,'material-combined source batches are split by connectivity');
const art=prepareShootHouseObjects(source),counts={};for(const o of art.objects)counts[o.area]=(counts[o.area]||0)+1;
for(const key of Object.keys(SHOOTHOUSE_AREAS))assert.ok(counts[key]>20,key+' has source architecture');
let matched=0,total=0;for(const s of Object.values(source.summary)){matched+=s.matched;total+=s.triangles;}assert.ok(matched/total>.995);
assert.equal(SHOOTHOUSE_RAMPS.length,18);assert.equal(new Set(SHOOTHOUSE_RAMPS).size,18);
for(const a of Object.values(SHOOTHOUSE_AREAS))assert.notEqual(a.primary,a.accent);
// A single wall straddling an old coordinate cut keeps one source-object area.
const o={name:'mout_container_wall_flat',lo:[-12,5.02,-17],hi:[-7,8.57,-17],area:'office'},n=[0,0,1,0,0,1,0,0,1];
for(const x of [-11,-9,-7]){const p=[x,6,-17,x+.1,7,-17,x+.2,6,-17],paint=shootHouseSurface('concrete',o,p,n);assert.equal(paint.hex,C.petrol);assert.match(paint.family,/office-bandUpper/);}
const frame={...o,name:'mout_container_wall_frame_single_flat'};assert.equal(shootHouseSurface('concrete',frame,[0,6,0,0,7,0,1,6,0],n).hex,C.limestone);
const floor=shootHouseSurface('concrete',{...o,name:'concrete_ground'},[0,1.5,0,1,1.5,0,0,1.5,1],[0,1,0,0,1,0,0,1,0]);assert.equal(floor.hex,C.slate);
const mezzanine=shootHouseSurface('wood',{...o,name:'plywood_clean_01'},[0,5.24658,0,1,5.24658,0,0,5.24658,1],[0,1,0,0,1,0,0,1,0]);assert.equal(mezzanine.hex,C.slate,'elevated control floor is quiet slate, not bright accent');
// Paint executes on existing geometry, with complete source openings preserved.
const m=new THREE.MeshStandardMaterial({vertexColors:true});styleShootHouseMaterial(m,'office-bandUpper');const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};m.onBeforeCompile(shader);assert.ok(shader.uniforms.artAccent.value.equals(new THREE.Color(C.limestone)));assert.match(shader.vertexShader,/vArtPosition=position/);assert.match(shader.fragmentShader,/5.02/);m.dispose();
// Map-specific lighting cannot leak to the next map.
const scene=new THREE.Scene();scene.fog=new THREE.Fog();const hemi=new THREE.HemisphereLight();scene.add(hemi);setArenaAtmosphere(scene,{id:'shoothouse',source:{}});assert.equal(scene.userData.shootHouseArt,true);assert.equal(hemi.intensity,2.3);assert.equal(scene.environmentIntensity,.5);setArenaAtmosphere(scene,{id:'vacant',source:{}});assert.equal(scene.userData.shootHouseArt,false);assert.equal(hemi.intensity,1.35);assert.equal(scene.environmentIntensity,.34);
const renderStub={extensions:{has:()=>false},getDrawingBufferSize:v=>v.set(320,180),toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1,setRenderTarget(){},setClearColor(){},clear(){}};
const f=new FrameRenderer(renderStub,scene,new THREE.PerspectiveCamera(),{antialias:false,ao:false,bloom:false});assert.equal(f.forge.fragmentShader,JSON.parse(fs.readFileSync(new URL('fixtures/pixel-forge-world-space.json',import.meta.url))).fragmentShader);f.dispose();
// Check the uppermost visible source floor, including the thin 5.24658m layer.
const baked=await readSourceRender(new URL('../dist/maps/shoothouse-render.json.gz',import.meta.url));let topFloor=null;
for(const chunk of baked){const p=chunk.attributes.position.array,n=chunk.attributes.normal.array,c=chunk.attributes.color.array,ix=chunk.index.array;
 for(let k=0;k<ix.length;k+=3){const a=ix[k]*3,b=ix[k+1]*3,d=ix[k+2]*3;if(p[a+1]<4.5||p[a+1]>5.5||n[a+1]<32000)continue;
  const denominator=(p[b+2]-p[d+2])*(p[a]-p[d])+(p[d]-p[b])*(p[a+2]-p[d+2]);if(Math.abs(denominator)<1e-9)continue;
  const u=((p[b+2]-p[d+2])*(-15-p[d])+(p[d]-p[b])*(-13-p[d+2]))/denominator,v=((p[d+2]-p[a+2])*(-15-p[d])+(p[a]-p[d])*(-13-p[d+2]))/denominator,w=1-u-v;
  if(Math.min(u,v,w)<-1e-5)continue;const y=p[a+1]*u+p[b+1]*v+p[d+1]*w;if(!topFloor||y>topFloor.y)topFloor={y,color:Array.from(c.slice(a,a+3)),family:chunk.family};
 }
}
assert.ok(topFloor&&topFloor.y>5.24,'visible upper mezzanine floor layer exists');const slate=new THREE.Color(C.slate);for(const [i,value]of [slate.r,slate.g,slate.b].entries())assert.ok(Math.abs(topFloor.color[i]/255-value)<1/255,'visible mezzanine floor is approved slate');assert.match(topFloor.family,/^asphalt/);
console.log('Shoot House art: six architecture areas, '+(matched/total*100).toFixed(2)+'% source ownership, connected source batches, complete object colors, approved ramps, physical-surface accents, map isolation and historical world-space filter pass.');
