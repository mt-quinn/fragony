import * as THREE from './vendor/three.module.js';
// Approved display-space master palette. Health green/yellow/red are excluded.
export const SHOOTHOUSE_COLORS=Object.freeze({petrol:0x347c79,clay:0xb96c60,mulberry:0x76546f,limestone:0xc5b69b,slate:0x526776,ink:0x24343d});
export const SHOOTHOUSE_RAMPS=Object.freeze(['#203f45','#347c79','#79aba0','#623f46','#b96c60','#daa88b','#3d334a','#76546f','#ad8eaa','#82786e','#c5b69b','#e5d8bc','#303f50','#526776','#83949e','#17232d','#24343d','#42545b']);
export const SHOOTHOUSE_AREAS=Object.freeze({
 office:{name:'Range control',primary:'petrol',accent:'limestone'},
 scrap:{name:'Recovery yard',primary:'clay',accent:'petrol'},
 cargo:{name:'Cargo range',primary:'limestone',accent:'clay'},
 north:{name:'North entry',primary:'mulberry',accent:'limestone'},
 south:{name:'South entry',primary:'limestone',accent:'mulberry'},
 lane:{name:'Main firing lane',primary:'petrol',accent:'limestone'}
});
// The rule is evaluated ONCE for a source object, never at individual vertices.
// Complete office and range-house assemblies take precedence over lane bounds.
export function shootHouseObjectArea(o){
 const [x,y,z]=o.lo.map((v,k)=>(v+o.hi[k])*.5),name=o.name;
 if(x> -22.4&&x<21&&z< -9.5&&z> -24&&y>4.2)return 'office';
 if(x>-.6&&x<30&&z>.3&&z<30.4)return 'cargo';
 if(z< -25)return 'north';
 if(z>30.4)return 'south';
 if(x< -8)return 'scrap';
 if(x>11)return 'cargo';
 return 'lane';
}
export function prepareShootHouseObjects(data){
 const groups={};for(const [kind,blob]of Object.entries(data.groups)){const b=typeof Buffer!=='undefined'?Buffer.from(blob,'base64'):Uint8Array.from(atob(blob),c=>c.charCodeAt(0));groups[kind]=new Uint32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
 return {objects:data.objects.map(o=>({...o,area:shootHouseObjectArea(o)})),groups};
}
export function shootHouseSurface(kind,o,p,n){
 const y=(p[1]+p[4]+p[7])/3,ny=(n[1]+n[4]+n[7])/3,nx=(n[0]+n[3]+n[6])/3;
 const name=o?.name||'',sourceMaterial=o?.material||'',area=o?.area||'lane',a=SHOOTHOUSE_AREAS[area],c=SHOOTHOUSE_COLORS;
 const structural=/conduit|pipe|railing|rail_border|bracket|cable|barrel|tire|junk|vehicle|lamp|light|metal_sheet|duct/.test(name),frame=/window_frame|wall_frame|wall_stud(?!_ceiling)|wall_cinder_corner|wall_cinder_column|cinderblock_wall_topper/.test(name);
 const ground=ny>.65&&(y<1.9||(y>4.5&&y<5.5)||/floor|catwalk|plank_bridge|stair|steps|ground|terrain/.test(name));
 let hex=c[a.primary],family='paint',pattern='';
 if(kind==='fence'){hex=0x42545b;family='fence';}
 else if(kind==='glass'){hex=0x79aba0;family='glass';}
 else if(ground){hex=c.slate;family='asphalt';}
 else if(structural){hex=/vehicle|junk/.test(name)?c[a.accent]:c.ink;family=/tire/.test(name)?'rubber':'steel';}
 else if(frame||/shipping_container_door_01/.test(sourceMaterial)){hex=c[a.accent];family='paint';}
 else if(/door_details|金属part/.test(sourceMaterial)){hex=c.ink;family='steel';}
 else if(ny<-.65){hex=0x82786e;family='concrete';}
 else if(ny>.65){hex=c[a.accent];family='coated';}
 else if(/plywood|pallet|wood|plank/.test(name)||kind==='wood'){
  // Full cover boards carry the area's accent; their physical frames stay primary.
  hex=/plywood|board/.test(name)?c[a.accent]:c[a.primary];family='wood';
  if(/plywood/.test(name)&&o&&o.hi[1]-o.lo[1]>1.5)pattern='mark';
 }
 else if(/wall_cinder|container_wall|concrete_wall|cinderblock_wall|shipping_container/.test(name)||kind==='concrete'){
  family='concrete';if(o&&o.hi[1]-o.lo[1]>1.5)pattern='band';
 }
 else if(kind==='steel'){hex=c.ink;family='steel';}
 // Distinguish wall returns without making either orientation muddy or black.
 const shade=Math.abs(ny)<.65?(Math.abs(nx)>.65?.88:1.03):1;
 return {hex,family:family+(pattern?'@'+area+'-'+pattern+(o&&o.lo[1]>4?'Upper':'Lower'):''),shade};
}
// Paint graphics are evaluated on the original triangles. They cannot bridge
// a window/door, add collision, z-fight, or introduce any extra draw pass.
export function styleShootHouseMaterial(material,recipe){
 const match=/^(office|scrap|cargo|north|south|lane)-(band|mark)(Upper|Lower)$/.exec(recipe);
 material.roughness=1;material.metalness=Math.min(material.metalness,.1);material.bumpScale*=.35;
 if(!match)return;
 const [,area,pattern,level]=match,a=SHOOTHOUSE_AREAS[area],accent=new THREE.Color(SHOOTHOUSE_COLORS[pattern==='mark'?a.primary:a.accent]),base=level==='Upper'?5.02:1.36;
 material.onBeforeCompile=shader=>{
  shader.uniforms.artAccent={value:accent};
  shader.vertexShader='varying vec3 vArtPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvArtPosition=position;');
  shader.fragmentShader='varying vec3 vArtPosition;uniform vec3 artAccent;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float artY=vArtPosition.y-${base.toFixed(2)};
   ${pattern==='band'?`float artPaint=1.-smoothstep(1.02,1.06,artY);float artLine=smoothstep(1.18,1.20,artY)*(1.-smoothstep(1.27,1.29,artY));artPaint=max(artPaint,artLine);`:`float artBand=smoothstep(1.38,1.40,artY)*(1.-smoothstep(1.68,1.70,artY));float artStripe=step(.62,fract((vArtPosition.x+vArtPosition.z)*.85+artY*.65));float artPaint=artBand*artStripe;`}
   diffuseColor.rgb=mix(diffuseColor.rgb,artAccent*diffuseColor.rgb/max(vColor,vec3(.015)),artPaint*.94);
  `);
 };
 material.customProgramCacheKey=()=>recipe;
}
