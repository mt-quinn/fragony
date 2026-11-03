import { FEEL } from './feel.js';
export const BODY_MULTIPLIERS=Object.freeze({head:1.5,torso:1,pelvis:1,leftArm:.75,rightArm:.75,leftLeg:.75,rightLeg:.75});
export const bodyDamage=(damage,part='torso')=>damage*(BODY_MULTIPLIERS[part]??1);
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

// Credit only health actually removed, once per life or healing interval.
export function recordDamage(target,attacker,damage){
 if(!attacker||!(damage>0))return;
 target.damageCredit??=new Map();
 target.damageCredit.set(attacker,(target.damageCredit.get(attacker)||0)+damage);
}
export function clearDamageCredit(target){target.damageCredit=new Map()}
export function takeAssists(target,killer){
 const assists=[...(target.damageCredit||new Map())].filter(([id])=>id!==killer).map(([id,damage])=>({id,points:Math.round(FEEL.score.kill*Math.min(1,damage/(target.maxHealth||100)))})).filter(a=>a.points>0);
 clearDamageCredit(target);return assists;
}
