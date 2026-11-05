import * as THREE from './vendor/three.module.js';
import {MAP_ART_PROFILES} from './map-art-profiles.js';
const paintedMaps=new WeakMap();
function paintedAlbedo(source,retention){
 if(!source?.isDataTexture)return source;let variants=paintedMaps.get(source);if(!variants){variants=new Map();paintedMaps.set(source,variants);}if(variants.has(retention))return variants.get(retention);
 const input=source.image.data,output=new Uint8Array(input.length);let mean=0;for(let i=0;i<input.length;i+=4)mean+=input[i];mean/=input.length/4;
 for(let i=0;i<input.length;i+=4){for(let k=0;k<3;k++)output[i+k]=Math.round(mean+(input[i+k]-mean)*retention);output[i+3]=input[i+3];}
 const texture=new THREE.DataTexture(output,source.image.width,source.image.height);texture.wrapS=source.wrapS;texture.wrapT=source.wrapT;texture.magFilter=source.magFilter;texture.minFilter=source.minFilter;texture.generateMipmaps=source.generateMipmaps;texture.anisotropy=source.anisotropy;texture.colorSpace=source.colorSpace;texture.needsUpdate=true;variants.set(retention,texture);return texture;
}
export function styleMapArtMaterial(material,recipe){
 const match=/^roster:([^:]+):(\d+):(\w+):(-?[\d.]+)$/.exec(recipe);if(!match)throw Error('Invalid map paint recipe: '+recipe);
 const [,id,index,style,base]=match,p=MAP_ART_PROFILES[id],a=p?.areas[Number(index)];if(!p||!a)throw Error('Missing authored map paint recipe: '+recipe);
 material.metalness=Math.min(material.metalness,.1);material.roughness=1;material.bumpScale*=.3;
 if(style==='floor'){material.map=null;material.bumpMap=null;return;}
 material.map=paintedAlbedo(material.map,material.name==='industrial-wood'?.65:.28);
 if(['trim','ceiling','plain'].includes(style))return;
 const accent=new THREE.Color(p.colors[style==='mark'?a.primary:a.accent]),floor=Number(base),datums=p.datums||[...new Set(p.areas.flatMap(a=>a.seeds.map(s=>Math.round(s[1]*2)/2)))].sort((a,b)=>a-b);
 material.onBeforeCompile=shader=>{
  shader.uniforms.mapArtAccent={value:accent};shader.uniforms.mapArtBase={value:floor};shader.uniforms.mapArtDatums={value:new Float32Array(Array.from({length:8},(_,i)=>datums[i]??-10000))};shader.vertexShader='varying vec3 vMapArtPosition;varying vec3 vMapArtNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMapArtPosition=position;vMapArtNormal=normal;');
  let paint="float artPaint=0.;";
  if(style==='dado')paint+=`float artY=vMapArtPosition.y-mapArtBase;artPaint=(1.-smoothstep(1.04,1.08,artY));artPaint=max(artPaint,smoothstep(1.24,1.26,artY)*(1.-smoothstep(1.32,1.34,artY)));`;
  if(style==='frieze')paint+=`float artY=mapArtBase-vMapArtPosition.y;artPaint=smoothstep(.24,.27,artY)*(1.-smoothstep(.76,.79,artY));artPaint=max(artPaint,smoothstep(.97,1.,artY)*(1.-smoothstep(1.06,1.09,artY)));`;
  if(style==='datum')paint+=Array.from({length:8},(_,i)=>`artPaint=max(artPaint,smoothstep(mapArtDatums[${i}]+.18,mapArtDatums[${i}]+.21,vMapArtPosition.y)*(1.-smoothstep(mapArtDatums[${i}]+.48,mapArtDatums[${i}]+.51,vMapArtPosition.y)));`).join('');
  if(style==='pilaster')paint+=`float artU=abs(vMapArtNormal.x)>.6?vMapArtPosition.z:vMapArtPosition.x;float artEdge=abs(fract((artU+.37)/4.8)-.5);artPaint=smoothstep(.40,.415,artEdge);`;
  if(style==='mark')paint+=`float artY=vMapArtPosition.y-mapArtBase;float artU=(vMapArtPosition.x+vMapArtPosition.z)*.8+artY*.65;float artSoft=max(fwidth(artU),.015);artPaint=smoothstep(1.35,1.38,artY)*(1.-smoothstep(1.67,1.70,artY))*smoothstep(.60-artSoft,.60+artSoft,fract(artU));`;
  shader.fragmentShader='varying vec3 vMapArtPosition;varying vec3 vMapArtNormal;uniform vec3 mapArtAccent;uniform float mapArtBase;uniform float mapArtDatums[8];\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n${paint}\ndiffuseColor.rgb=mix(diffuseColor.rgb,mapArtAccent*diffuseColor.rgb/max(vColor,vec3(.015)),artPaint*.94);`);
 };
 // Uniform colors and story heights permit program reuse across every map.
 material.customProgramCacheKey=()=>"map-art-v1:"+style;
}
