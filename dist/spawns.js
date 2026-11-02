// Prefer breathing room, cover and underused entries without always choosing
// the single most distant corner. Player and bots share the same spawn rules.
export function chooseSpawn(spawns,actors,{now=0,recent=new Map(),canSee=()=>false,random=Math.random}={}){
 const ranked=spawns.map(s=>{
  const pos={x:s[0],y:s[1],z:s[2]},eye={...pos,y:pos.y+1.6};let nearest=30,density=0,exposure=0;
  for(const a of actors){const d=Math.hypot(pos.x-a.pos.x,pos.y-a.pos.y,pos.z-a.pos.z);nearest=Math.min(nearest,d);density+=Math.max(0,1-d/24);if(d<30&&canSee(a.eye||{...a.pos,y:a.pos.y+1.6},eye))exposure+=Math.max(0,1-d/30)}
  const lastUse=Math.max(...spawns.filter(p=>Math.hypot(p[0]-s[0],p[2]-s[2])<20&&Math.abs(p[1]-s[1])<6).map(p=>recent.get(p)??-Infinity));
  const age=now-lastUse,score=Math.min(nearest,24)-density*8-exposure*12-Math.max(0,12-age)*1.2;
  return{s,score,nearest};
 }).sort((a,b)=>b.score-a.score);
 const safe=ranked.filter(c=>c.nearest>=8&&c.score>=ranked[0].score-5),pool=safe.length?safe:[ranked[0]],chosen=pool[Math.floor(random()*pool.length)].s;
 recent.set(chosen,now);return chosen;
}
