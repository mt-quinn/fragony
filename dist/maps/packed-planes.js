const planeMetrics=new WeakMap();
export class PackedPlanes{
 constructor(buffer,start,end){this.buffer=buffer;this.start=start;this.end=end;this.length=end-start;let metrics=planeMetrics.get(buffer);if(!metrics){metrics=new Float64Array(buffer.length/4);for(let i=0;i<metrics.length;i++)metrics[i]=Math.hypot(buffer[i*4],buffer[i*4+2]);planeMetrics.set(buffer,metrics);}this.horizontal=metrics;}
 // Prepared source planes are immutable. Query their packed storage directly,
 // reusing normal lengths instead of allocating an iterator/plane per test.
 span(x,z,r,bottom,top){const p=this.buffer,h=this.horizontal;for(let j=this.start;j<this.end;j++){const i=j*4,nx=p[i],ny=p[i+1],nz=p[i+2],q=p[i+3]-nx*x-nz*z+r*h[j];if(Math.abs(ny)<1e-7){if(q< -1e-6)return null;}else if(ny>0)top=Math.min(top,q/ny);else bottom=Math.max(bottom,q/ny);}return bottom<=top+1e-6?{bottom,top}:null;}
 contact(x,z,feet,height,radius){const p=this.buffer,h=this.horizontal,y=feet+height/2;let depth=Infinity,nx=0,nz=0;for(let j=this.start;j<this.end;j++){const i=j*4,q=p[i]*x+p[i+1]*y+p[i+2]*z-p[i+3]-radius*h[j]-Math.abs(p[i+1])*height/2;if(q>=-1e-7)return null;if(h[j]>1e-6&&-q/h[j]<depth){depth=-q/h[j];nx=p[i]/h[j];nz=p[i+2]/h[j];}}return Number.isFinite(depth)?{nx,nz,depth}:null;}
 // Consumers destructure each plane immediately. One iterator-local value
 // avoids allocating five small arrays for every narrow collision query.
 *[Symbol.iterator](){const p=[0,0,0,0];for(let i=this.start*4;i<this.end*4;i+=4){p[0]=this.buffer[i];p[1]=this.buffer[i+1];p[2]=this.buffer[i+2];p[3]=this.buffer[i+3];yield p;}}
 toJSON(){return Array.from(this,p=>Array.from(p));}
}
