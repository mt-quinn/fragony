// Health economy shared by player, bot decisions, rendering and pickup tests.
export const OVERHEALTH_CAP=200;
export function healthAfterPickup(hp,max,p){
 if(p.kind!=='health')return hp;
 const cap=p.overhealth?Math.max(OVERHEALTH_CAP,max):max;
 return hp>=cap?hp:Math.min(cap,hp+p.amount);
}
export function healthPickup(id,x,y,z,amount=25){return{id,kind:'health',x,y,z,amount,overhealth:amount!==25,respawn:amount===50?30:15}}
