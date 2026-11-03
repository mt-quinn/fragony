import {blockSpan,nearBlocks} from '../geometry.js';
import {canOccupy} from '../collision.js';
// Place gameplay resources on actual accessible source surfaces. Positive-radius
// brush overlap is not enough: all floor probes must have genuine support.
export function supportedPosition(brushes,x,y,z,{radius=4,ground=false,avoid=[],separation=.6}={}){
 let best=null,score=Infinity;
 const floorAt=(x,z,ceiling)=>{let floor=ground?0:-Infinity;for(const b of nearBlocks(brushes,x,z,.01)){const span=blockSpan(b,x,z,0);if(span&&span.top<=ceiling)floor=Math.max(floor,span.top);}return floor;};
 for(let dx=-radius;dx<=radius;dx+=.5)for(let dz=-radius;dz<=radius;dz+=.5){const xx=x+dx,zz=z+dz;if(avoid.some(p=>Math.hypot(p.x-xx,p.z-zz)<separation&&Math.abs((p.y||0)-y)<1))continue;const floor=floorAt(xx,zz,y+.35);if(!Number.isFinite(floor)||Math.abs(floor-y)>.75||!canOccupy(brushes,{x:xx,z:zz,feet:floor+.002,height:1.9,radius:.4}))continue;let supported=true;for(let i=0;i<8;i++){const f=floorAt(xx+Math.cos(i*Math.PI/4)*.35,zz+Math.sin(i*Math.PI/4)*.35,floor+.2);if(!Number.isFinite(f)||Math.abs(f-floor)>.25){supported=false;break;}}if(!supported)continue;const value=dx*dx+dz*dz+(floor-y)**2*4;if(value<score){score=value;best=[xx,floor+.002,zz];}}
 if(!best)throw Error('No accessible source surface near '+[x,y,z]);return best;
}
