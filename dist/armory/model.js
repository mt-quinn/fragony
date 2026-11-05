// Authored attachment catalog and pure comparison calculator.
export const TIERS=['COMMON','RARE','EPIC','LEGENDARY'];
export const COLORS=['#d2d4be','#a4d6ed','#d6b6f1','#f4d889'];
export const SLOT_NAMES={mechanism:'TRIGGER',barrel:'BARREL',ammo:'AMMO',circuit:'CIRCUIT'};
export const PARTS={
 automatic:{slot:'mechanism',name:"Automatic fire",short:"Automatic fire",copy:"Keeps firing while aimed at an enemy.",damage:24,cycle:.16,count:1,gap:0,charge:0},
 semi:{slot:'mechanism',name:"Semi-automatic fire",short:"Semi-automatic fire",copy:"Fires one strong shot at a slower rate.",damage:68,cycle:.5,count:1,gap:0,charge:0},
 burst:{slot:'mechanism',name:"Burst fire",short:"Burst fire",copy:"Fires three shots, then pauses.",damage:24,cycle:.5,count:3,gap:.06,charge:0},
 charge:{slot:'mechanism',name:"Charge fire",short:"Charge fire",copy:"Charges automatically and keeps the charge until fired.",damage:80,cycle:.6,count:1,gap:0,charge:.4},
 single:{slot:'barrel',name:"Single barrel",short:"Single barrel",copy:"One barrel, with a larger magazine.",damage:1,cycle:1,packets:1,capacity:24,reload:1},
 double:{slot:'barrel',name:"Double barrel",short:"Double barrel",copy:"Fires twice in quick succession.",damage:1.5,cycle:1.45,packets:2,capacity:24,reload:1.1},
 huge:{slot:'barrel',name:"Large barrel",short:"Large barrel",copy:"Fires larger projectiles.",damage:1.5,cycle:1.6,packets:1,capacity:12,reload:.85},
 gatling:{slot:'barrel',name:"Gatling barrels",short:"Gatling barrels",copy:"Fires faster as the barrels spin.",damage:.65,cycle:.55,packets:1,capacity:48,reload:1.25},
 rails:{slot:'barrel',name:"Magnetic rails",short:"Magnetic rails",copy:"Projectiles hit instantly.",damage:1.25,cycle:1.2,packets:1,capacity:18,reload:1.1},
 normal:{slot:'ammo',name:"Normal rounds",short:"Normal rounds",copy:"Fires one bullet.",damage:1,cycle:1,capacity:1,head:1.25,projectiles:1},
 pellets:{slot:'ammo',name:"Shotgun pellets",short:"Shotgun pellets",copy:"Fires eight pellets in a fixed spread.",damage:1.35,cycle:1,capacity:1,head:1.1,projectiles:8},
 sniper:{slot:'ammo',name:"Sniper rounds",short:"Sniper rounds",copy:"Fires one accurate bullet with more headshot damage.",damage:1.25,cycle:1.25,capacity:.75,head:1.3,projectiles:1},
 explosive:{slot:'ammo',name:"Explosive rounds",short:"Explosive rounds",copy:"Explodes on impact and damages nearby enemies.",damage:1.05,cycle:1.1,capacity:.85,head:1,projectiles:1},
 piercing:{slot:'ammo',name:"Piercing rounds",short:"Piercing rounds",copy:"Passes through up to three enemies.",damage:1,cycle:1.1,capacity:1,head:1.25,projectiles:1},
 duplex:{slot:'ammo',name:"Duplex rounds",short:"Duplex rounds",copy:"Fires two bullets at the same point.",damage:1.5,cycle:1.4,capacity:.75,head:1.1,projectiles:2},
 pressure:{slot:'circuit',name:"Damage boost",short:"Damage boost",copy:"Each kill increases damage until you die.",interval:1},
 service:{slot:'circuit',name:"Reload boost",short:"Reload boost",copy:"Each kill returns ammunition and speeds up reloads.",interval:1},
 momentum:{slot:'circuit',name:"Movement boost",short:"Movement boost",copy:"Each kill increases movement speed until you die.",interval:1},
 repair:{slot:'circuit',name:"Healing",short:"Healing",copy:"Heals you after every two kills without dying.",interval:2},
 focus:{slot:'circuit',name:"Slow-time recovery",short:"Slow-time recovery",copy:"Every two kills restores slow time and improves its recovery.",interval:2},
 rebound:{slot:'circuit',name:"Ricochet",short:"Ricochet",copy:"After two kills, shots can bounce once off walls.",interval:2},
 brake:{slot:'circuit',name:"Slowing hits",short:"Slowing hits",copy:"After two kills, hits slow enemies down.",interval:2},
 echo:{slot:'circuit',name:"Extra shot",short:"Extra shot",copy:"Every three kills adds a following shot each time the gun fires.",interval:3},
 arc:{slot:'circuit',name:"Chain damage",short:"Chain damage",copy:"After three kills, hits can damage another nearby enemy.",interval:3},
 assayer:{slot:'circuit',name:"Rarity boost",short:"Rarity boost",copy:"Every three kills gives each attachment in the next shop a chance to go up one rarity.",interval:3}
};
export const INITIAL_KIT={mechanism:{id:'burst',rank:1},barrel:{id:'double',rank:0},ammo:{id:'normal',rank:1},circuit:{id:'momentum',rank:0}};
export const INITIAL_OWNED={automatic:0,semi:0,burst:1,charge:0,single:1,double:0,huge:0,gatling:0,normal:1,pellets:0,piercing:1,momentum:0,pressure:0,repair:1};
export const OFFERS=[{id:'duplex',rank:2},{id:'huge',rank:1},{id:'rails',rank:3},{id:'assayer',rank:1},{id:'charge',rank:2}];
export const clone=x=>JSON.parse(JSON.stringify(x));
export const same=(a,b)=>a?.id===b?.id&&a?.rank===b?.rank;
export function resolve(kit){
 const M={...PARTS[kit.mechanism.id]},B={...PARTS[kit.barrel.id]},A={...PARTS[kit.ammo.id]};
 const u=r=>[1,1.08,1.16,1.25][r],p=r=>[1,.92,.84,.75][r];
 const mr=kit.mechanism.rank,br=kit.barrel.rank,ar=kit.ammo.rank,mp=p(mr),bu=u(br),bp=p(br),ap=p(ar);
 if(kit.mechanism.id==='automatic')M.cycle/=(1+.03*mr);
 if(['semi','burst'].includes(kit.mechanism.id)){M.cycle=.16+(M.cycle-.16)*mp;M.gap*=mp;}
 if(kit.mechanism.id==='charge'){M.charge*=mp;M.cycle=.6*mp;}
 B.cycle=kit.barrel.id==='gatling'?Math.max(.5,1-(1-B.cycle)*bu):1+(B.cycle-1)*bp;
 if(kit.barrel.id==='gatling')B.damage=1-(1-B.damage)*bp;
 B.capacity=kit.barrel.id==='single'?24*bu:['huge','rails'].includes(kit.barrel.id)?24-(24-B.capacity)*bp:kit.barrel.id==='gatling'?24+(B.capacity-24)*bu:B.capacity;
 B.reload=kit.barrel.id==='single'?bp:B.reload<1?1-(1-B.reload)*bu:1+(B.reload-1)*bp;
 B.pairDelay=.065*bp;
 A.cycle=1+(A.cycle-1)*ap;A.capacity=1-(1-A.capacity)*ap;
 const cost=B.packets*M.count,capacity=Math.max(2*cost,Math.floor(B.capacity*A.capacity/cost)*cost);
 const damage=M.damage*B.damage*A.damage*(1+.04*(mr+br+ar));
 const charge=M.charge?Math.max(.18,Math.min(.6,M.charge*B.cycle)):0;
 const cycle=M.charge?charge+(M.cycle-M.charge)*B.cycle*A.cycle:M.cycle*B.cycle*A.cycle;
 const gap=M.gap*B.cycle*A.cycle,G=M.count>1?gap:cycle;
 const b=B.packets===2?Math.min(B.pairDelay,.4*G):0;
 const tandem=kit.ammo.id==='duplex'?Math.min(.035,.4*(b?Math.min(b,G-b):G)):0;
 const events=[];
 for(let i=0;i<M.count;i++)for(let j=0;j<B.packets;j++)for(let k=0;k<(kit.ammo.id==='duplex'?2:1);k++)events.push(i*gap+j*b+k*tandem);
 events.sort((a,b)=>a-b);
 return {damage,burstDamage:damage*M.count,cycle,charge,capacity,loaded:capacity/cost,reload:B.reload,projectiles:M.count*B.packets*A.projectiles,events,M,B,A};
}
