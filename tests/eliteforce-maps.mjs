import assert from 'node:assert/strict';import fs from 'node:fs';import{createHash}from'node:crypto';
import {SOURCE_ARENAS}from'../dist/maps/source-arenas.js';import{MAPS}from'../dist/map.js';
import{restoreNavigation,nearestNode}from'../dist/ai.js';import{launchTime}from'../dist/geometry.js';
const expected=[['siege','hm_cam'],['mutiny','hm_for1'],['bravery','hm_kln1'],['ef-showdown','hm_noon'],['delta-station','ctf_voy1'],['beta-station','ctf_voy2'],['forge2','hm_for2'],['forge1','ctf_for1'],['blast-radius','hm_blastradius']],ref=new URL('../../reference-maps/eliteforce-next-map-round/',import.meta.url);
assert.equal(MAPS.length,20);assert.notEqual(MAPS.find(m=>m.id==='showdown').name,MAPS.find(m=>m.id==='ef-showdown').name);
let starts=0,items=0;
for(const[id,engine]of expected){const map=await SOURCE_ARENAS.find(m=>m.id===id).load(),source=JSON.parse(fs.readFileSync(new URL(id+'/source-entities.json',ref))),bytes=fs.readFileSync(new URL('maps/'+engine+'.map',ref));
 assert.equal(map.sourceEngine,engine);assert.equal(map.source.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(map.source.scale,1/32);assert.equal(map.stepHeight,.57);assert.ok(map.killBelow<Math.min(...map.spawns.map(p=>p[1])));
 assert.equal(map.spawns.length,source.starts.length);assert.equal(map.pickups.length,source.items.length);assert.equal(map.resources.length,source.items.length);starts+=map.spawns.length;items+=map.pickups.length;
 const original=new Map(source.items.map(p=>[p.id,p]));for(const p of map.resources){const old=original.get(p.id);assert.ok(old);assert.equal(p.sourceClass,old.sourceClass);assert.equal(p.amount,old.amount);if(!p.adaptation)assert.ok(Math.hypot(p.x-old.position[0],p.z-old.position[2])<=3.001,id+' source pickup pattern');}
 assert.ok(map.pickups.every(p=>p.kind==='health'&&[5,25,50].includes(p.amount)));assert.ok(map.precompiled&&map.renderChunks.length>5);
 const nav=restoreNavigation(map.navigation,map.elevators,map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads),home=nearestNode(nav,{x:map.spawns[0][0],y:map.spawns[0][1],z:map.spawns[0][2]}),back=nav.nodes.map(()=>[]);
 for(const n of nav.nodes)for(const e of n.edges)back[e.node.id].push(n);
 for(const reverse of [false,true]){const seen=new Set([home]),q=[home];for(let i=0;i<q.length;i++)for(const n of reverse?back[q[i].id]:q[i].edges.map(e=>e.node))if(!seen.has(n)){seen.add(n);q.push(n)}for(const p of [...map.spawns.map(([x,y,z])=>({x,y,z})),...map.pickups])assert.ok(seen.has(nearestNode(nav,p)),id+' native resource/spawn '+(reverse?'return':'access'));}
 for(const p of map.pads)assert.ok(launchTime(p.power,p.landing.y-p.y)<2.8,p.id+' fits native flight lifetime');
 console.log(id+': original source hash, '+map.spawns.length+' starts, '+map.pickups.length+' converted pickups, all access/return routes and prepared assets pass');map.unload();
}
assert.equal(starts,108);assert.equal(items,788);console.log('All nine original EF maps: 108 source starts and 788 health-converted pickup anchors retained.');
