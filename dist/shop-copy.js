// Shop copy explains behavior and tradeoffs; the catalog retains exact statistics.
const actions=[
 {overdrive:['Faster automatic fire','More recoil; weaker bullets'],ratchet:['Three-shot bursts','Pause between bursts'],surveyor:['Powerful single shots','Tighter aim; more recoil']},
 {riveter:['Fully automatic fire','Hold the trigger; weaker bullets'],twin:['Two bullets at once','Uses two rounds; more recoil'],hammerfall:['Two-shot bursts','A hard-hitting pair of shots']},
 {overspeed:['Faster automatic fire','More recoil; weaker bullets'],cam:['Three-shot bursts','Tighter spread between bursts'],duplex:['Two bullets at once','Uses two rounds per shot']},
 {rapid:['Faster rail shots','Less damage per hit'],split:['Two rails at once','Uses two charges per shot'],siege:['Charge a powerful rail','Hold to charge; slower follow-ups']},
 {rotary:['Faster rocket fire','Weaker rockets; more recoil'],twin:['Two rockets at once','Uses two rockets per shot'],pressure:['Charge a faster rocket','More impact; a smaller blast']},
 {slamfire:['Automatic shotgun fire','Spread builds; release to settle'],double:['Fire two shells at once','Uses two shells; slower follow-ups'],precision:['Tighter pellet spread','Slower follow-up shots']}
];
const ammunition=[
 {demolition:['Explosive bullets','Impact damage plus a small blast'],duplex:['Two weaker bullets per shot','Both bullets share your aim'],through:['Shoot through enemies','Pierce up to three opponents']},
 {caps:['Explosive bullets','Impact damage plus a small blast'],penetrator:['Shoot through enemies','Hit another enemy behind the first'],shatter:['Fragmenting bullets','Three fragments spread on impact']},
 {frangible:['Stronger up close','Much weaker at long range'],microblast:['Explosive bullets','Impact damage plus a small blast'],needle:['Shoot through enemies','Hit another enemy behind the first']},
 {arc:['Chain lightning','Arcs to two nearby enemies'],flak:['Fire a spread of darts','Replaces piercing rail shots'],pulse:['Explosive rail shots','A blast replaces piercing']},
 {airburst:['Rockets burst near enemies','A wider, weaker blast'],breach:['Stronger direct impacts','A smaller blast radius'],skip:['Bounce rockets off walls','Detonate after one bounce']},
 {slug:['One accurate shotgun slug','Longer range; no pellet spread'],frag:['Exploding shells','Fragments plus a blast on impact'],flechette:['Piercing shotgun darts','Tighter spread; hit a second enemy']}
];
const feeds=[
 {sprint:['Quick reloads · 15 rounds','A smaller magazine'],box:['Carry 60 rounds','Slower reloads and movement'],reservoir:['Reload one round at a time','Interrupt reloading to fire']},
 {speed:['Quick reloads · 4 rounds','A smaller magazine'],extended:['Carry 12 rounds','Slower reloads and aiming'],empty:['Reload faster when empty','Slower reloads with rounds left']},
 {quick:['Quick reloads · 12 rounds','A smaller magazine'],drum:['Carry 96 rounds','Slower reloads, movement and aim'],coupled:['Alternate fast reloads','Every other reload is faster']},
 {quick:['Quick reloads · 1 charge','Reload after every shot'],battery:['Carry 8 charges','Slower reloads, movement and aim'],recuperator:['Headshot kills refund ammo','Recover a charge on a direct kill']},
 {quick:['Quick reloads · 2 rockets','A smaller rocket rack'],cassette:['Carry 8 rockets','Slower reloads and movement'],recovery:['Release to reload rockets','Loads while you stop firing']},
 {speed:['Quick reloads · 4 shells','A smaller shell tube'],carrier:['Carry 12 shells','Slower reloads and movement'],gate:['Reload one shell at a time','Interrupt reloading to fire']}
];
const handling={entry:['Aim and swap faster','More recoil'],anchor:['Steadier when stationary','Stand still or crouch; slower aim'],sling:['Reload holstered weapons','Switch away; reloads take longer']};
export function partCopy(g,a){
 if(!a)return{title:'Standard',hint:'Stock weapon behavior',detail:'Stock weapon behavior'};
 if(a.slot==='optic')return{title:a.name,hint:a.zoom+'× · free sight',detail:'Free sight preference. Swapping sights never costs credits.'};
 const pair=(a.slot==='action'?actions[g]:a.slot==='ammunition'?ammunition[g]:a.slot==='feed'?feeds[g]:handling)?.[a.key];
 const [title,hint]=pair||[a.name,'Changes weapon behavior'];
 let detail=title+'. '+hint+'.';
 if(a.key==='arc')detail='Shots arc to two nearby visible enemies. Less damage to the direct target.';
 if(a.key==='sling')detail='Switch away to reload this weapon automatically. Reloads take longer; incompatible with Recovery loader.';
 if(a.slot==='feed'&&a.key==='gate')detail='Load one shell at a time. Interrupt reloading whenever you need to fire.';
 return{title,hint,detail};
}
const supplies={
 reload:['Faster reloads','Reload your weapons faster.'],speed:['Faster movement','Move faster while carrying any weapon.'],
 armor:['Start with 140 HP','Start each life with 140 HP.'],focus:['Faster slow-mo recharge','Your slow-motion charge regenerates faster.'],
 quickdraw:['Aim and swap faster','Aim down sights and switch weapons faster.'],recovery:['Kills restore 20 HP','Each kill restores 20 HP, up to your starting health.'],
 surge:['3 kills: refill health + slow-mo','After three kills, activate to refill health and slow-motion charge.'],
 barrage:['3 kills: fire 3 rockets','After three kills, activate to fire three rockets in a wide fan.'],
 airstrike:['3 kills: strike all enemies','After three kills, activate to strike every living opponent’s position.']
};
export function supplyCopy(a){const [hint,detail]=supplies[a.id]||[a.label||a.desc,a.desc];return{title:a.name,hint,detail};}
