import {SOURCE_ARENAS} from './source-arenas.js';
export const VACANT=await SOURCE_ARENAS.find(m=>m.id==='vacant').load({raw:true});
