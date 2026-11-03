import {SOURCE_ARENAS} from './source-arenas.js';
export const HIJACKED=await SOURCE_ARENAS.find(m=>m.id==='hijacked').load({raw:true});
