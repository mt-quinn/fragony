// Persist the remaining bag across runs; opening menus never draws a map.
function shuffled(ids,random){const bag=[...ids];for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}return bag}
export function validMapRotation(state,ids){return !!state&&Array.isArray(state.roster)&&state.roster.length===ids.length&&state.roster.every((id,i)=>id===ids[i])&&Array.isArray(state.remaining)&&state.remaining.every(id=>ids.includes(id))&&new Set(state.remaining).size===state.remaining.length&&ids.includes(state.last)&&!state.remaining.includes(state.last)}
export function rotationAfterPlayedMap(ids,mapId,random=Math.random){return{roster:[...ids],remaining:shuffled(ids.filter(id=>id!==mapId),random),last:mapId}}
export function drawMapFromBag(ids,state,random=Math.random){
 if(!ids.length||new Set(ids).size!==ids.length)throw Error('Map roster must contain distinct maps');
 const valid=validMapRotation(state,ids),last=ids.includes(state?.last)?state.last:null;
 let bag=valid?[...state.remaining]:[];
 if(!bag.length){bag=shuffled(ids,random);if(bag.length>1&&bag.at(-1)===last){const j=Math.floor(random()*(bag.length-1));[bag[j],bag[bag.length-1]]=[bag.at(-1),bag[j]]}}
 const mapId=bag.pop();return{mapId,state:{roster:[...ids],remaining:bag,last:mapId}};
}
