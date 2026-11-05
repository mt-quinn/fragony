// Order-independent triangle fingerprint. Positions are packed on the same
// 1/4096m source grid. Two independent hashes, sums and XORs retain duplicates
// while allowing material/batch/index reordering. No geometry is simplified.
export function geometrySignature(chunks){
 let triangles=0,sumA=0,sumB=0,xorA=0,xorB=0,area=0;
 for(const c of chunks){const p=c.attributes.position.array,ix=c.index.array;
  for(let k=0;k<ix.length;k+=3){let a=2166136261,b=0x9e3779b9;const v=[];
   for(let j=0;j<3;j++)for(let q=0;q<3;q++){const value=p[ix[k+j]*3+q],n=Math.round(value*4096);v.push(value);a=Math.imul(a^n,16777619);b=Math.imul(b^n,0x85ebca6b);b^=b>>>13;}
   sumA=(sumA+(a>>>0))>>>0;sumB=(sumB+(b>>>0))>>>0;xorA^=a;xorB^=b;triangles++;
   const x=v[3]-v[0],y=v[4]-v[1],z=v[5]-v[2],u=v[6]-v[0],w=v[7]-v[1],t=v[8]-v[2];area+=Math.hypot(y*t-z*w,z*u-x*t,x*w-y*u)/2;
  }
 }
 return {triangles,sumA,sumB,xorA:xorA>>>0,xorB:xorB>>>0,area};
}
