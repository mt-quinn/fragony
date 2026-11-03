const area=(id,name,wall,floor,accent,type='concrete')=>({id,name,wall,floor,accent,type});
export const sourceDistricts={
 killhouse:[area('west','WEST DRILL BAYS',0xb7c8bc,0x9ba99a,0x72948b,'coated'),area('east','EAST DRILL BAYS',0xcac0a8,0xb0a38b,0xae9667),area('tower','OBSERVATION',0xb5c7c2,0x94aaa2,0x658e8b,'coated'),area('briefing','BRIEFING APRON',0xc8ccb9,0xa8b19e,0x8e9b81),area('entry','RANGE ENTRY',0xc8c3b0,0xada58e,0xaa9c73)],
 vacant:[area('yard','SERVICE YARD',0xc9c2ac,0xa8a58e,0xad9b6b),area('warehouse','WAREHOUSE',0xb7c8bc,0x95a89c,0x658f85,'coated'),area('records','RECORDS & STORES',0xc8c8b8,0xa7afa0,0x939e84),area('maintenance','MAINTENANCE',0xc5beb0,0xa99f8d,0xb08d70),area('offices','OPERATIONS',0xb9ccc4,0x9bafa6,0x739b94,'coated')],
 showdown:[area('court','TRANSFER COURT',0xcac5b1,0xb1ac93,0xad9e72),area('west','WEST ARCADE',0xbac9bf,0x9eafa4,0x6e948a,'coated'),area('east','EAST ARCADE',0xc8bca6,0xafa18b,0xb2976d),area('north','NORTH GALLERY',0xb8c8c2,0x98aaa3,0x799992,'coated'),area('south','SOUTH GALLERY',0xcdcbb7,0xafa991,0x9e9c78)],
 firingrange:[area('timber','TIMBER RANGE',0xc8bca5,0xaaa08b,0xb39b6a),area('containers','CONTAINER LAB',0xb6cac2,0x97ada3,0x61918b,'coated'),area('workshop','RANGE WORKSHOP',0xc4c8b8,0xa3ad9c,0x8a9c81),area('tower','OBSERVATION RANGE',0xb6c5c0,0x98aaa1,0x72958e,'coated'),area('yard','DRILL YARD',0xcbc4ae,0xb0a68b,0xad9c6c)],
 hijacked:[area('service','SERVICE PASSAGE',0xa9bfb7,0x879d94,0x609489,'coated'),area('aft','AFT DECK',0xc8c3af,0xb1a78d,0xb49b68),area('salon','AFT OPERATIONS',0xb8ccc4,0x97aea5,0x69988f,'coated'),area('bow','FORWARD DECK',0xcacbb9,0xabb49f,0x8f9f83),area('bridge','BRIDGE SYSTEMS',0xbacbc7,0x98ada7,0x729b98,'coated'),area('crossing','DECK TRANSFER',0xc9c3ad,0xafa68e,0xad9a6a)],
 summit:[area('north','NORTH SWITCHYARD',0xb6c8c2,0x9eafa5,0x6f9791,'coated'),area('south','SOUTH GANTRY',0xc9c6b3,0xaab29d,0xa49d73),area('west','WEST SERVICE',0xc7c0ac,0xaba28c,0xb09b6f),area('cable','CABLE STATION',0xb5c9c4,0x95aaa4,0x6e9792,'coated'),area('control','CONTROL HALL',0xc6cec1,0xa5b1a3,0x8a9f8a)],
 shoothouse:[area('scrap','RECOVERY YARD',0xc8bda7,0xaaa087,0xb19a6b),area('cargo','CARGO RANGE',0xb4c8c0,0x95aa9f,0x66958c,'coated'),area('office','RANGE CONTROL',0xb9cbc7,0x98ada6,0x729b94,'coated'),area('north','NORTH ENTRY',0xc6c9b8,0xa6b29e,0x8e9f83),area('south','SOUTH ENTRY',0xc9c1ab,0xafa38b,0xad986b),area('lane','MAIN FIRING LANE',0xc9ccbd,0xaeb59f,0x939e81)]
};
export function sourceDistrictIndex(id,x,y,z){
 if(id==='killhouse')return z< -23?3:z>23?4:Math.abs(x)<6?2:x<0?0:1;
 if(id==='vacant')return x< -22?0:z< -18?1:x>20?2:z>16?3:4;
 if(id==='showdown')return z< -30?3:z>30?4:x< -18?1:x>18?2:0;
 if(id==='firingrange')return z>22&&x<0?3:z< -25?1:x< -15?0:x>18?4:2;
 if(id==='hijacked')return y<7?0:x< -40?1:x< -10?2:x>45?3:x>12?4:5;
 if(id==='summit')return z< -40?0:z>40?1:x< -12?2:x>18?3:4;
 if(id==='shoothouse')return y>4&&z< -4&&z> -24?2:z< -30?3:z>30?4:x< -9?0:x>11?1:5;
 return -1;
}
export const sourceDistrictCuts={killhouse:[[0,-6],[0,0],[0,6],[2,-23],[2,23]],vacant:[[0,-22],[0,20],[2,-18],[2,16]],showdown:[[0,-18],[0,18],[2,-30],[2,30]],firingrange:[[0,-15],[0,0],[0,18],[2,-25],[2,22]],hijacked:[[1,7],[0,-40],[0,-10],[0,12],[0,45]],summit:[[0,-12],[0,18],[2,-40],[2,40]],shoothouse:[[0,-9],[0,11],[1,4],[2,-30],[2,-24],[2,-4],[2,30]]};
// Origins stay inside the real rooms. The dressing fitter raycasts the wall,
// verifies every panel corner and refuses apertures or unsupported surfaces.
export const sourceFittings={
 killhouse:[['RANGE ENTRY / 01',[-12,3,31],[-1,0,0]],['WEST DRILL / 02',[-13,3,7],[-1,0,0]],['EAST DRILL / 03',[13,3,-8],[1,0,0]],['BRIEFING / 04',[10,3,-31],[0,0,-1]],['OBSERVATION',[0,5,0],[1,0,0]],['',[-13,1.8,29],[-1,0,0],'electrical']],
 vacant:[['WAREHOUSE / 01',[-30,4,-30],[-1,0,0]],['OPERATIONS / 02',[-2,5,-12],[0,0,-1]],['RECORDS / 03',[30,5,-9],[1,0,0]],['MAINTENANCE / 04',[-18,5,20],[0,0,1]],['SERVICE YARD',[-49,3,3],[-1,0,0]],['',[42,4,30],[1,0,0],'electrical'],['',[-12,4,-10],[0,0,-1],'electrical']],
 showdown:[['NORTH GALLERY / 01',[-10,4,-50],[0,0,-1]],['SOUTH GALLERY / 02',[-10,4,52],[0,0,1]],['WEST ARCADE / 03',[-26,4,8],[-1,0,0]],['EAST ARCADE / 04',[27,4,-6],[1,0,0]],['TRANSFER COURT',[8,4,-22],[0,0,-1]],['',[-24,3,-8],[-1,0,0],'electrical']],
 firingrange:[['OBSERVATION RANGE',[-24,3,38],[-1,0,0]],['CONTAINER LAB / 02',[-15,5,-48],[0,0,-1]],['RANGE WORKSHOP / 03',[-12,5,1],[0,0,1]],['TIMBER RANGE / 04',[-35,5,-33],[-1,0,0]],['DRILL YARD / 05',[22,5,-1],[1,0,0]],['',[-22,4,-3],[0,0,1],'electrical']],
 hijacked:[['AFT OPERATIONS / 01',[-30,12,8],[-1,0,0]],['BRIDGE SYSTEMS / 02',[33,16,1],[1,0,0]],['SERVICE PASSAGE / 03',[-3,6,-4],[0,0,-1]],['FORWARD DECK / 04',[53,12,-8],[1,0,0]],['DECK TRANSFER',[4,13,12],[0,0,1]],['',[-10,12,-12],[0,0,-1],'electrical'],['',[13,12,-11],[0,0,-1],'pump']],
 summit:[['NORTH SWITCHYARD / 01',[8,9,-44],[0,0,-1]],['CONTROL HALL / 02',[13,9,-9],[-1,0,0]],['CABLE STATION / 03',[27,9,5],[1,0,0]],['WEST SERVICE / 04',[-16,9,-20],[-1,0,0]],['SOUTH GANTRY / 05',[11,13,58],[0,0,1]],['',[19,13,22],[1,0,0],'electrical'],['',[-22,11,34],[0,0,1],'pump']],
 shoothouse:[['NORTH ENTRY / 01',[0,3.6,-40],[0,0,-1]],['SOUTH ENTRY / 02',[-20,3.6,40],[0,0,1]],['RANGE CONTROL / 03',[7,7,-12],[0,0,-1]],['CARGO RANGE / 04',[24,3.6,15],[1,0,0]],['RECOVERY YARD / 05',[-18,3.6,20],[-1,0,0]],['MAIN FIRING LANE',[-3,3.6,-1],[0,0,1]],['',[-20,6.7,-15],[-1,0,0],'electrical']]
};
