import * as THREE from './vendor/three.module.js';
const normalMaps=new WeakMap(),roughness=new WeakMap();
// Convert procedural world-space height relief once at load time. A normal
// texture needs one sample per fragment instead of three height samples and
// per-fragment height derivatives, particularly costly on subpixel map faces.
export function optimizeMapMaterial(source){
 const material=source.clone();material.userData={...source.userData};material.onBeforeCompile=source.onBeforeCompile.bind(source);material.customProgramCacheKey=source.customProgramCacheKey.bind(source);
 const height=source.bumpMap;
 if(height?.isDataTexture&&source.bumpScale){
  let variants=normalMaps.get(height);if(!variants){variants=new Map();normalMaps.set(height,variants);}const scale=source.bumpScale;
  let normal=variants.get(scale);
  if(!normal){const {width,height:h,data}=height.image,out=new Uint8Array(width*h*4),value=(x,y)=>data[(((y+h)%h)*width+(x+width)%width)*4]/255;
   for(let y=0;y<h;y++)for(let x=0;x<width;x++){const nx=-(value(x+1,y)-value(x-1,y))*width*.5*scale*.45,ny=-(value(x,y+1)-value(x,y-1))*h*.5*scale*.45,length=Math.hypot(nx,ny,1),i=(y*width+x)*4;out[i]=Math.round((nx/length*.5+.5)*255);out[i+1]=Math.round((ny/length*.5+.5)*255);out[i+2]=Math.round((1/length*.5+.5)*255);out[i+3]=255;}
   normal=new THREE.DataTexture(out,width,h);normal.wrapS=height.wrapS;normal.wrapT=height.wrapT;normal.minFilter=height.minFilter;normal.magFilter=height.magFilter;normal.generateMipmaps=height.generateMipmaps;normal.anisotropy=height.anisotropy;normal.needsUpdate=true;variants.set(scale,normal);
  }
  material.normalMap=normal;material.normalScale.set(1,1);material.bumpMap=null;
 }
 const map=source.roughnessMap;
 if(map?.isDataTexture){let mean=roughness.get(map);if(mean===undefined){const d=map.image.data;mean=0;for(let i=1;i<d.length;i+=4)mean+=d[i];mean/=d.length/4*255;roughness.set(map,mean);}material.roughness*=mean;material.roughnessMap=null;}
 return material;
}
