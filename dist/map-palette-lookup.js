import * as THREE from './vendor/three.module.js';
import {mapArtPalette} from './map-art-colors.js';
import {SHOOTHOUSE_RAMPS} from './shoothouse-art.js';
import {SHOOTHOUSE_SKY} from './shoothouse-palette.js';

// Bake nearest authored swatches once per map transition. One nearest-filtered
// atlas lookup replaces the per-pixel color search; interpolation must never
// invent colors between the authored ramps. Keep one 2 MiB texture per renderer.
const LEVELS=64,SIDE=512;
export const mapPaletteGLSL=`uniform sampler2D authoredMapPalette;uniform float authoredPalette;
vec3 forgeMapPalette(vec3 c,bool sky){
 vec3 q=floor(clamp(c,0.,1.)*63.+.5);
 vec2 cell=vec2(mod(q.b,8.)*64.+q.r,floor(q.b/8.)*64.+q.g);
 return texture2D(authoredMapPalette,(cell+vec2(.5,sky?512.5:.5))/vec2(512.,1024.)).rgb;
}`;
function colors(list){return list.map(hex=>{const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,m=Math.min(r,g,b),length=Math.hypot(r-m+.00001,g-m+.00001,b-m+.00001);return {r,g,b,x:(r-m+.00001)/length,y:(g-m+.00001)/length,z:(b-m+.00001)/length,packed:(255<<24)|((n&255)<<16)|(n&0xff00)|(n>>16&255)};});}
export function fillMapPalette(data,world,sky){
 const output=new Uint32Array(data.buffer,data.byteOffset,data.byteLength/4),banks=[colors(world),colors(sky)];
 for(let b=0;b<LEVELS;b++)for(let g=0;g<LEVELS;g++)for(let r=0;r<LEVELS;r++){
  const cr=r/63,cg=g/63,cb=b/63,min=Math.min(cr,cg,cb),chroma=Math.max(cr,cg,cb)-min,t=Math.max(0,Math.min(1,(chroma-.035)/.085)),weight=.22*t*t*(3-2*t),length=Math.hypot(cr-min+.00001,cg-min+.00001,cb-min+.00001),x=(cr-min+.00001)/length,y=(cg-min+.00001)/length,z=(cb-min+.00001)/length;
  const index=(Math.floor(b/8)*64+g)*SIDE+(b%8)*64+r;
  for(let bank=0;bank<2;bank++){let distance=Infinity,best=banks[bank][0];for(const p of banks[bank]){const dr=cr-p.r,dg=cg-p.g,db=cb-p.b,d=dr*dr*.9+dg*dg*1.1+db*db*.8+(bank===0?Math.hypot(x-p.x,y-p.y,z-p.z)*weight:0);if(d<distance){distance=d;best=p;}}output[index+bank*SIDE*SIDE]=best.packed;}
 }
 // Preserve each exact swatch at its nearest lattice point, including near-
 // neutral paints whose hue can shift noticeably under input quantization.
 for(let bank=0;bank<2;bank++)for(const p of banks[bank]){const r=Math.round(p.r*63),g=Math.round(p.g*63),b=Math.round(p.b*63),i=(Math.floor(b/8)*64+g)*SIDE+(b%8)*64+r;output[i+bank*SIDE*SIDE]=p.packed;}
 return data;
}
export class MapPaletteLookup{
 constructor(){this.id=null;this.texture=null;}
 sync(id){
  const palette=id==='shoothouse'?{world:SHOOTHOUSE_RAMPS,sky:SHOOTHOUSE_SKY}:mapArtPalette(id);
  if(!palette){this.id=null;return false;}
  if(this.id===id)return true;
  if(!this.texture){this.texture=new THREE.DataTexture(new Uint8Array(SIDE*SIDE*2*4),SIDE,SIDE*2);this.texture.minFilter=this.texture.magFilter=THREE.NearestFilter;this.texture.generateMipmaps=false;this.texture.name='authored-map-palette';}
  fillMapPalette(this.texture.image.data,palette.world,palette.sky);this.texture.needsUpdate=true;this.id=id;return true;
 }
 dispose(){this.texture?.dispose();this.texture=null;this.id=null;}
}
