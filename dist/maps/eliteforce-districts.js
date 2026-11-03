// Geometry stays original; these names and material districts belong to Fragony.
const a=(id,name,wall,floor,accent,type='concrete')=>({id,name,wall,floor,accent,type});
const cool=(id,name)=>a(id,name,0xb7cbc1,0x96aaa1,0x6b9a91,'coated');
const warm=(id,name)=>a(id,name,0xcac1ab,0xafa18a,0xaf966b);
const pale=(id,name)=>a(id,name,0xc8cdbb,0xa6b29e,0x8fa184);
export const eliteforceDistricts={
 siege:[cool('west','WEST KEEP'),warm('east','EAST KEEP'),pale('north','NORTH RAMPART'),warm('south','SOUTH COURT'),cool('crossing','GATE TRANSFER')],
 mutiny:[cool('lower','LOWER PROCESS WORKS'),warm('east','EAST TRANSFER'),pale('west','WEST TRANSFER'),warm('loading','LOADING HALL'),cool('core','PROCESS GANTRY')],
 bravery:[cool('lower','LOWER ENGINE ROOM'),warm('service','SERVICE DUCT'),pale('north','NORTH OPERATIONS'),warm('south','SOUTH MAINTENANCE'),cool('core','ENGINE TRANSFER')],
 'ef-showdown':[pale('north','NORTH WORKSHOPS'),cool('south','SOUTH STORES'),warm('west','WEST ARCADE'),warm('east','EAST OPERATIONS'),cool('street','MAIN TRANSFER')],
 'delta-station':[cool('north','NORTH STATION'),warm('south','SOUTH STATION'),pale('upper','UPPER TRANSFER'),cool('bridge','STATION CROSSING')],
 'beta-station':[cool('north','NORTH SYSTEMS'),warm('south','SOUTH SYSTEMS'),pale('upper','UPPER GANTRIES'),cool('bridge','BETA CROSSING')],
 forge2:[cool('lower','LOWER FORGE'),warm('west','WEST TRANSFER'),pale('north','NORTH CORE'),warm('south','SOUTH REACTOR'),cool('middle','CORE GANTRY')],
 forge1:[cool('north','NORTH FORGE'),warm('south','SOUTH FORGE'),pale('west','WEST POWER'),warm('east','EAST POWER'),cool('crossing','FORGE CROSSING')],
 'blast-radius':[pale('upper','UPPER CONTROL'),warm('south','SOUTH TEST HALL'),cool('north','NORTH PRESSURE WELL'),warm('west','WEST TEST ROOM'),cool('core','CENTRAL PRESSURE HALL')]
};
export function eliteforceDistrictIndex(id,x,y,z){
 if(id==='siege')return x< -20?0:x>20?1:z< -10?2:z>14?3:4;
 if(id==='mutiny')return y<6?0:x>20?1:x< -15?2:z>10?3:4;
 if(id==='bravery')return y<8?0:x< -10?1:z< -10?2:z>12?3:4;
 if(id==='ef-showdown')return z< -12?0:z>12?1:x< -8?2:x>12?3:4;
 if(id==='delta-station'||id==='beta-station')return z< -35?0:z>35?1:y>9?2:3;
 if(id==='forge2')return y<15?0:x< -30?1:z< -20?2:z>20?3:4;
 if(id==='forge1')return z< -45?0:z>45?1:x< -20?2:x>20?3:4;
 if(id==='blast-radius')return y>12?0:z>25?1:z< -10?2:x< -15?3:4;
 return -1;
}
export const eliteforceCuts={siege:[[0,-20],[0,20],[2,-10],[2,14]],mutiny:[[1,6],[0,-15],[0,20],[2,10]],bravery:[[1,8],[0,-10],[2,-10],[2,12]],'ef-showdown':[[0,-8],[0,12],[2,-12],[2,12]],'delta-station':[[2,-35],[2,35],[1,9]],'beta-station':[[2,-35],[2,35],[1,9]],forge2:[[1,15],[0,-30],[2,-20],[2,20]],forge1:[[2,-45],[2,45],[0,-20],[0,20]],'blast-radius':[[1,12],[2,25],[2,-10],[0,-15]]};
