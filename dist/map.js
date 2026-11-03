import {RUST} from './maps/rust.js';
import {SHIPMENT} from './maps/shipment.js';
import {NUKETOWN} from './maps/nuketown.js';
import {SOURCE_ARENAS} from './maps/source-arenas.js';
import {RESERVOIR} from './maps/reservoir.js';
// Retired arenas stay out of the shipped roster, practice chooser and map bag.
export const MAPS=[RESERVOIR,RUST,SHIPMENT,NUKETOWN,...SOURCE_ARENAS];
export const MAP={...RESERVOIR};
export function selectMap(id){const chosen=MAPS.find(m=>m.id===id)||RESERVOIR;for(const key of Object.keys(MAP))delete MAP[key];Object.assign(MAP,chosen);return MAP}
export const ALL_WEAPONS=['rifle','pistol','smg','rail','rocket','shotgun'];
export function randomWeaponPair(random=Math.random){const first=Math.floor(random()*ALL_WEAPONS.length);let second=Math.floor(random()*(ALL_WEAPONS.length-1));if(second>=first)second++;return[ALL_WEAPONS[first],ALL_WEAPONS[second]]}
