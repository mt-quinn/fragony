import assert from 'node:assert/strict';import {summarize} from './encounter-metrics.mjs';
const actor=(id,life,x)=>({id,life,alive:true,position:[x,0,0],hp:100,goal:null,perceived:false,target:null});
const run={config:{map:'fixture',seed:1},initial:[],inventory:[{id:'major',amount:50,respawn:30}],final:{clock:20},events:[{type:'spawn',actor:'A:1',t:0,position:[0,0,0]},{type:'spawn',actor:'B:1',t:0,position:[5,0,0]},{type:'pickup',actor:'A:1',t:5,id:'major',amount:50,gain:50},{type:'damage',actor:'B:1',attacker:'A:2',t:5,damage:10}],snapshots:[{t:0,actors:[actor('A','A:1',0),actor('B','B:1',5)],contacts:[{a:'A:1',b:'B:1',distance:5,fovA:true,fovB:true}]},{t:.2,actors:[actor('A','A:1',0),actor('B','B:1',5)],contacts:[]}]};
let m=summarize(run);assert.equal(m.contacts.length,1);assert.equal(m.contacts[0].endReason,'occlusion');assert.equal(m.collections[0].damageContested,false,'same name, different life must not count as contest');assert.equal(m.availability[0].availableSeconds,5);assert.equal(m.collections[0].survival10,'survived');assert.equal(m.summary.medianObservedFirstContact,0);
run.events.push({type:'damage',actor:'A:1',attacker:'A:1',t:5.5,damage:25});assert.equal(summarize(run).collections[0].damageContested,false,'self damage is not an opposing contest');
run.events.push({type:'damage',actor:'A:1',attacker:'B:1',t:6,damage:25});m=summarize(run);assert.equal(m.collections[0].damageContested,true);
run.final.clock=8;m=summarize(run);assert.equal(m.collections[0].survival10,'censored');assert.equal(m.collections[0].windowRightCensored,false);
run.final.clock=7;m=summarize(run);assert.equal(m.collections[0].windowRightCensored,true);
console.log('Telemetry checks: life identity, real-damage contest, availability accounting, contact end and censoring pass.');

const escapeRun={config:{map:'fixture',seed:2},inventory:[],final:{clock:4},events:[{type:'spawn',actor:'A:1',t:0,position:[0,0,0]},{type:'spawn',actor:'B:1',t:0,position:[5,0,0]}],snapshots:[]};
for(let i=0;i<=20;i++){const t=i*.2,a=actor('A','A:1',0),b=actor('B','B:1',5);a.goal={type:'retreat'};a.target='B';a.perceived=true;escapeRun.snapshots.push({t,actors:[a,b],contacts:i===0||i===8?[{a:'A:1',b:'B:1',fovA:true,fovB:true}]:[]});}
assert.equal(summarize(escapeRun).summary.cleanEscapes,0,'reacquisition resets continuous escape clock');
for(let i=21;i<=27;i++)escapeRun.snapshots.push({t:i*.2,actors:[actor('A','A:1',0),actor('B','B:1',5)],contacts:[]});escapeRun.final.clock=5.4;
assert.equal(summarize(escapeRun).summary.cleanEscapes,1,'three continuously hidden seconds can qualify');
console.log('Escape checks: reacquisition resets timer; successful break requires continuous separation.');
