import {MAPS} from './map.js';
import {MENU_STAGE} from './menu-stage.js';
import {RAINWORKS} from './maps/rainworks.js';
// A dedicated one-map sample. The ordinary game's campaign roster is unchanged.
MAPS.splice(0,MAPS.length,RAINWORKS);
Object.assign(MENU_STAGE,{mapId:'rainworks',position:[-7,1,10],yaw:.4,cameraOffset:[3.8,2.4,5.5]});
await import('./game.js');
