// Facility finishes: color identifies the work performed in each real district.
// The same finite material library serves every map and every rendering tier.
const finish=(wall,floor,accent,wallType,type='concrete')=>({wall,floor,accent,wallType,type});
export const INDUSTRIAL_FINISHES={
 brick:finish(0xa56348,0x898473,0xd4a044,'brick'),
 blue:finish(0x63889b,0x78868b,0x366b87,'coated','coated'),
 oxide:finish(0xad674d,0x8d7e70,0xc58142,'paint','concrete'),
 ochre:finish(0xc1a35b,0x958b72,0xc58a32,'paint'),
 green:finish(0x72947d,0x7b8c7c,0x42705d,'coated','coated'),
 limewash:finish(0xc6bca5,0x969080,0xaf743e,'concrete'),
 timber:finish(0xb29669,0x92846c,0x987344,'wood'),
 utility:finish(0xc1ccc3,0x80948a,0x4f887b,'tile','tile'),
 navy:finish(0x637b8a,0x77848b,0xc0a04c,'paint','steel'),
 rust:finish(0xa27553,0x807868,0xbd8748,'steel','asphalt'),
 aggregate:finish(0xb4aa92,0x827f70,0xb48c45,'concrete','asphalt'),
 sage:finish(0x9ca68a,0x878e77,0x637d58,'concrete')
};
// Ordered to match the physical districts, never selected by triangle/random hash.
export const MAP_FINISHES={
 reservoir:['blue','ochre','limewash','green','utility','oxide'],
 rust:['oxide','green','aggregate','ochre'],
 shipment:['blue','oxide','green','ochre','aggregate'],
 nuketown:['green','ochre','timber','brick','aggregate'],
 killhouse:['timber','ochre','navy','brick','aggregate'],
 vacant:['aggregate','brick','ochre','green','utility'],
 showdown:['limewash','brick','blue','green','ochre'],
 firingrange:['timber','blue','brick','green','aggregate'],
 hijacked:['utility','timber','blue','ochre','navy','limewash'],
 summit:['blue','ochre','oxide','green','utility'],
 shoothouse:['rust','blue','utility','green','ochre','aggregate'],
 siege:['brick','ochre','sage','aggregate','blue'],
 mutiny:['oxide','ochre','blue','brick','green'],
 bravery:['green','ochre','utility','brick','navy'],
 'ef-showdown':['brick','blue','timber','ochre','aggregate'],
 'delta-station':['blue','oxide','utility','ochre'],
 'beta-station':['green','ochre','navy','brick'],
 forge2:['oxide','green','ochre','brick','navy'],
 forge1:['blue','oxide','green','ochre','aggregate'],
 'blast-radius':['utility','ochre','blue','brick','green']
};
export function applyIndustrialFinishes(districts){
 for(const [id,keys]of Object.entries(MAP_FINISHES)){
  const areas=districts[id];if(!areas)throw Error('Missing material districts: '+id);
  if(areas.length!==keys.length)throw Error('Material district count: '+id);
  areas.forEach((area,i)=>Object.assign(area,INDUSTRIAL_FINISHES[keys[i]],{finish:keys[i]}));
 }
}
