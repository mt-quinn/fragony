import {SOURCE_ARENAS} from './source-arenas.js';
export const SHOOTHOUSE=await SOURCE_ARENAS.find(m=>m.id==='shoothouse').load({raw:true});
