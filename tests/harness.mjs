import {createNailer,animateNailer,createNailerWorld} from '../dist/nailer.js';
import {WEAPON_ORDER,weaponSlot} from '../dist/weapon-order.js';
import {healthAfterPickup} from '../dist/pickups.js';
import {buildBrushMap,dressElevators} from '../dist/map-view.js';
import {ElevatorSystem} from '../dist/elevators.js';
import {surface,MATERIALS,studioEnvironment,FrameRenderer,dressArena,createMuzzleFlash,smokeMesh} from '../dist/presentation.js';
import {createRifle,rifleAttachment,animateRifle} from '../dist/rifle.js';
import {createDummyRig,resetDummyRig,animateDummy,fireDummy,beginRagdoll,stepRagdoll,poseDummy} from '../dist/characters.js';
import {HurtFeedback,HURT,nearMissSegment} from '../dist/hurt.js';
import {DamageHistory,bodyPartAt,recapHTML} from '../dist/recap.js';
import {ACTIONS,ControlBindings,keyLabel,mouseCode,bindingsHTML,controlsOptionsHTML} from '../dist/controls.js';
import {COLLISION,canOccupy,moveCharacter} from '../dist/collision.js';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import { ArenaAI, AI_TUNING, difficultyForRound, buildNavigation, restoreNavigation, nearestNode as nearestAINode, findRoute } from '../dist/ai.js';
import {inBlock,blockedAt,surfaceAt,ceilingAt,launchTime,blockSpan} from '../dist/geometry.js';
import { MAP, MAPS,selectMap, ALL_WEAPONS, randomWeaponPair } from '../dist/map.js';
import { WEAPON_SLOTS,OPTICS,SLOT_LABELS,attachment,fitted,normalizeBuilds,weaponStats,previewBuild,fitAttachment,migrateBuilds,EQUIPMENT,normalizeEquipment } from '../dist/loadout.js';
import {createShopOffers,validShopOffers,offeredPart,offeredUpgrade} from '../dist/shop.js';
import {loadoutHTML,gunIcon,reticleIcon as reticleIconForGame} from '../dist/loadout-view.js';
import { GameAudio, AUDIO_TUNING } from '../dist/audio.js';
import { FEEL,HANDLING,Spring,accelerate,WeaponMotion,HitFeedback } from '../dist/feel.js';
import { resolveDamage,combineOutcomes,recordDamage,clearDamageCredit,takeAssists } from '../dist/combat.js';
export function createGameHarness(seed=12345){
 selectMap('testworks');
 const nodes=new Map(),storage=new Map(),events=new Map();
 function element(id){if(!nodes.has(id))nodes.set(id,{style:{setProperty(k,v){this[k]=v}},hidden:false,textContent:'',innerHTML:'',querySelector(){return element(id+'child')},querySelectorAll(selector){const key=selector.match(/data-([a-z-]+)/)?.[1]||'buy';if(this.queryHTML!==this.innerHTML){this.queryHTML=this.innerHTML;this.queryCache={}}if(this.queryCache[key])return this.queryCache[key];const buttons=[...this.innerHTML.matchAll(new RegExp('data-'+key+'="([^"]*)"','g'))].map(m=>({dataset:{[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:m[1]}}));if(key==='buy')this.buttons=buttons;this.queryCache[key]=buttons;return buttons;}});return nodes.get(id)}
 const drawing=new Proxy({},{get:(o,p)=>o[p]||(()=>{})});
 const seededMath=Object.create(Math);seededMath.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const context=vm.createContext({createNailer,animateNailer,createNailerWorld,WEAPON_ORDER,weaponSlot,restoreNavigation,atob,healthAfterPickup,buildBrushMap,dressElevators,ElevatorSystem,MAPS,selectMap,blockSpan,surface,MATERIALS,studioEnvironment,FrameRenderer,dressArena,createMuzzleFlash,smokeMesh,createRifle,rifleAttachment,animateRifle,createDummyRig,resetDummyRig,animateDummy,fireDummy,beginRagdoll,stepRagdoll,poseDummy,COLLISION,canOccupy,moveCharacter,ACTIONS,ControlBindings,keyLabel,mouseCode,bindingsHTML,controlsOptionsHTML,DamageHistory,bodyPartAt,recapHTML,HurtFeedback,HURT,nearMissSegment,events,createShopOffers,validShopOffers,offeredPart,offeredUpgrade,inBlock,blockedAt,surfaceAt,ceilingAt,launchTime,WEAPON_SLOTS,OPTICS,SLOT_LABELS,attachment,fitted,normalizeBuilds,weaponStats,previewBuild,fitAttachment,migrateBuilds,EQUIPMENT,normalizeEquipment,loadoutHTML,gunIcon,reticleIconForGame,FEEL,HANDLING,Spring,accelerate,WeaponMotion,HitFeedback,resolveDamage,combineOutcomes,recordDamage,clearDamageCredit,takeAssists,GameAudio,AUDIO_TUNING,MAP,ALL_WEAPONS,randomWeaponPair,THREE,ArenaAI,AI_TUNING,difficultyForRound,buildNavigation,nearestAINode,findRoute,console,assert,results:[],Math:seededMath,innerWidth:1280,innerHeight:800,performance,
  document:{body:{classList:{add(){},remove(){}}},getElementById:element,createElement:()=>({getContext:()=>drawing}),addEventListener:(name,handler)=>events.set(name,handler),exitPointerLock(){}},
  window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
 const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'').replace(/\ninit\(\);\s*$/,'');
 vm.runInContext(source,context);
 const run=(code,options={})=>vm.runInContext(code,context,{timeout:30000,...options});
 const setup=()=>run(`muted=true;scene=new THREE.Scene();arena=new THREE.Group();scene.add(arena);camera=new THREE.PerspectiveCamera(85,1,.07,160);scene.add(camera);renderer={domElement:{requestPointerLock(){}}};previewDummy=new THREE.Group();buildArena();buildNav();buildWeapon();makeBots();scene.updateMatrixWorld(true);`);
 return{context,run,setup};
}
