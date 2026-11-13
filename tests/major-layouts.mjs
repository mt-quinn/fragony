import assert from 'node:assert/strict';
import {MAPS} from '../dist/map.js';
import {FFA_MAJOR_ANCHORS,ffaHealthResources} from '../dist/maps/ffa-health-layouts.js';
import specs from '../dist/maps/source-arena-specs.js';
import {restoreNavigation,nearestNode} from '../dist/ai.js';
import {canOccupy} from '../dist/collision.js';
for(const spec of specs){const before=JSON.stringify(spec.resources),adapted=ffaHealthResources(spec);assert.equal(JSON.stringify(spec.resources),before,'source item metadata remains intact');if(FFA_MAJOR_ANCHORS[spec.id]){assert.equal(adapted.filter(p=>p.amount===50).length,1);for(const p of adapted){const original=spec.resources.find(r=>r.id===p.id);assert.equal(p.amount,p.id===FFA_MAJOR_ANCHORS[spec.id]?50:original.amount===50?25:original.amount);assert.deepEqual([p.x,p.y,p.z],[original.x,original.y,original.z]);}}}
for(const map of MAPS){if(map.load)await map.load();const majors=map.pickups.filter(p=>p.amount===50);assert.equal(majors.length,1,map.id+' exactly one major');const p=majors[0];assert.equal(p.overhealth,true);assert.equal(p.respawn,30);assert.ok(map.pickups.filter(q=>q.amount===25).every(q=>q.respawn===15&&!q.overhealth));assert.ok(canOccupy(map.brushes,{x:p.x,z:p.z,feet:p.y,height:1.9,radius:.4}),map.id+' major standing clearance');
 const nav=restoreNavigation(map.navigation,map.elevators||[],map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads||[]),node=nearestNode(nav,p);assert.ok(Math.abs(node.y-p.y)<.35,map.id+' height-matched major access');const back=nav.nodes.map(()=>[]);for(const n of nav.nodes)for(const e of n.edges)back[e.node.id].push(n);
 for(const reverse of [false,true]){const seen=new Set([node]),queue=[node];for(let i=0;i<queue.length;i++)for(const n of reverse?back[queue[i].id]:queue[i].edges.map(e=>e.node))if(!seen.has(n)){seen.add(n);queue.push(n);}for(const [x,y,z] of map.spawns)assert.ok(seen.has(nearestNode(nav,{x,y,z})),map.id+' major '+(reverse?'approach':'departure')+' graph access');}
 console.log(map.id,p.id,[p.x,p.y,p.z].map(v=>v.toFixed(2)).join(', '),'one major, supported and graph access/return');map.unload?.();
}
console.log('All active maps have exactly one supported overheal major; source metadata and remaining pickup coordinates are preserved. Physical contention is evaluated in the native study, separately from this graph check.');
