// Controlled decision probes of the actual current AI; no production policy change.
import assert from 'node:assert/strict';
import {ArenaAI} from '../../dist/ai.js';
import {healthPickup} from '../../dist/pickups.js';
for(const [label,hp,items]of [['healthy fragment',100,[healthPickup('fragment',.1,0,0,5)]],['healthy four-fragment line',100,[0,1,2,3].map(i=>healthPickup('fragment-'+i,.1+i,0,0,5))],['injured fragment',10,[healthPickup('fragment',.1,0,0,5)]],['healthy major',100,[healthPickup('major',.1,0,0,50)]]]){
 for(const p of items)p.timer=0;const nodes=[{id:0,x:0,y:0,z:0,edges:[]},{id:1,x:20,y:0,z:0,edges:[]}],ai=new ArenaAI({navigation:{nodes,anchors:nodes},world:{pickups:items,canSee:()=>true},random:()=>.5}),bot={name:'probe',pos:{x:0,y:0,z:0},hp,dead:0},brain=ai.reset(bot,0);ai.chooseGoal(bot,brain);
 if(label.startsWith('healthy')&&!label.includes('major'))assert.notEqual(brain.goal?.type,'pickup');else assert.ok(['pickup','heal'].includes(brain.goal?.type));console.log(label,'→',brain.goal?.type,brain.goal?.pickup?.id||'');
}
