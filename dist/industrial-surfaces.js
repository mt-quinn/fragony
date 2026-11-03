import * as THREE from './vendor/three.module.js';
const cache=new Map();
const fract=n=>n-Math.floor(n),noise=(x,y)=>{let h=Math.imul(x+131,374761393)^Math.imul(y+719,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const line=(v,width)=>Math.min(fract(v),1-fract(v))<width;
// One repeat is 2.22m in the shared world-projected UVs. No imported game art.
// Neutral albedo leaves facility color in vertex attributes; relief/roughness
// describe the actual finish. Textures are shared across the entire map roster.
export function industrialSurface(family){
 if(cache.has(family))return cache.get(family);
 const size=256,albedo=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=noise(x,y),coarse=noise(Math.floor(x/6),Math.floor(y/6));let tone=.94+n*.06,h=.45+n*.1,r=.88;
  if(family==='concrete'){
   const seam=line(u, .003)||line(v,.003),tie=Math.hypot(fract(u*2)-.5,fract(v*2)-.5)<.018;
   tone=.88+n*.08+coarse*.04-(seam?.11:0)-(tie?.18:0);h=.5+(n-.5)*.25-(seam?.18:0)-(tie?.3:0);r=.88+n*.06;
  }else if(family==='brick'){
   const row=Math.floor(v*8),uu=u*4+(row%2)*.5,mortar=line(uu,.018)||line(v*8,.048),brick=noise(Math.floor(uu),row);
   tone=mortar?.68:.79+brick*.16+n*.05;h=mortar?.18:.58+n*.17;r=mortar?.95:.85;
  }else if(family==='tile'){
   const grout=line(u*4,.012)||line(v*4,.012);tone=grout?.67:.96+n*.04;h=grout?.15:.63;r=grout?.95:.49;
  }else if(family==='wood'){
   const grain=Math.sin(u*195+Math.sin(v*12)*1.8),joint=line(u*5,.008);
   tone=.88+grain*.035+n*.035+noise(Math.floor(u*5),17)*.035-(joint?.18:0);h=.5+grain*.08-(joint?.25:0);r=.8+grain*.04;
  }else if(family==='steel'){
   const seam=line(u,.004)||line(v,.004),bolt=Math.hypot(fract(u*2)-.06,fract(v*2)-.06)<.013;
   tone=.9+n*.045-(seam?.15:0)+(bolt?.07:0);h=.5+(n-.5)*.04-(seam?.22:0)+(bolt?.2:0);r=.57+n*.13;
  }else if(family==='paint'||family==='coated'){
   tone=.96+n*.04;h=.5+(n-.5)*.1;r=(family==='paint'?.64:.53)+n*.08;
  }else if(family==='asphalt'){
   const stone=n>.93;tone=.78+n*.16+(stone?.05:0);h=.3+n*.45;r=.94+n*.05;
  }else {tone=.92+n*.08;h=.5+(n-.5)*.08;r=.8;}
  const i=(y*size+x)*4;for(let k=0;k<3;k++){albedo[i+k]=Math.round(255*tone);height[i+k]=Math.round(255*h);rough[i+k]=Math.round(255*r);}albedo[i+3]=height[i+3]=rough[i+3]=255;
 }
 const texture=(data,color=false)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;if(color)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;};
 const result={map:texture(albedo,true),bumpMap:texture(height),roughnessMap:texture(rough),bumpScale:family==='brick'?.025:family==='wood'?.014:family==='concrete'?.016:family==='asphalt'?.018:family==='tile'?.009:.004};cache.set(family,result);return result;
}
