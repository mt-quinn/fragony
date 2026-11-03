import {SOURCE_ARENAS} from './source-arenas.js';
export const SHOWDOWN=await SOURCE_ARENAS.find(m=>m.id==='showdown').load({raw:true});
