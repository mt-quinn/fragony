import fs from 'node:fs';
import {restoreNavigation} from '../dist/ai.js';
for(const id of process.argv.slice(2)){
 const m=(await import('../dist/maps/'+id+'.js'))[id.toUpperCase()];
 const nav=restoreNavigation(m.navigation,m.elevators,m.anchors,m.bounds,m.brushes,m.stepHeight,m.pads);
 const cells=new Set();for(const n of nav.nodes)for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)cells.add([Math.floor(n.x/2)+dx,Math.floor(n.z/2)+dz].join(','));
 const out={cellSize:2,boundaryBuffer:2,cells:[...cells].map(k=>k.split(',').map(Number)),source:'Reachable source navigation, expanded one cell to retain boundary walls and cover.'};
 fs.writeFileSync(new URL('../../reference-maps/'+id+'/playable-footprint.json',import.meta.url),JSON.stringify(out));console.log(id,cells.size,'retained boundary cells');
}
