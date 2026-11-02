import { FEEL } from './feel.js';
// A health transition is the sole authority for scoring and confirmation.
export function resolveDamage(target,amount,{head=false}={}){
 const before=Math.max(0,target.hp||0);
 if(target.dead||before<=0||!Number.isFinite(amount)||amount<=0)return{damage:0,killed:false,head:false,points:0};
 target.hp=before-amount;const killed=target.hp<=0;
 return{damage:Math.min(before,amount),killed,head,points:killed?(head?FEEL.score.headshot:FEEL.score.kill):0};
}
export function combineOutcomes(outcomes){
 const live=outcomes.filter(o=>o.damage>0),kills=live.filter(o=>o.killed);
 return{damage:live.reduce((n,o)=>n+o.damage,0),killed:kills.length>0,head:kills.length?kills.some(o=>o.head):live.some(o=>o.head),points:kills.reduce((n,o)=>n+o.points,0),kills:kills.length};
}
