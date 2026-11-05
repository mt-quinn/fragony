import assert from 'node:assert/strict';
import {createModularGun} from '../dist/modular-model.js';
import {PARTS,createCollection} from '../dist/modular-gun.js';
import {createGameHarness} from './harness.mjs';
for(const [id,part]of Object.entries(PARTS))for(let rank=0;rank<4;rank++){const c=createCollection();c.kit[part.slot]={id,rank};const m=createModularGun(c.kit);m.root.updateMatrixWorld(true);let draws=0;m.root.traverse(o=>{if(o.isMesh){draws++;assert.ok(o.geometry.attributes.position.count>0);assert.ok(o.matrixWorld.elements.every(Number.isFinite));assert.equal(o.userData.gunVisual,true);}});assert.ok(draws<=40,id+' draw budget');m.dispose();}
const h=createGameHarness();h.setup();h.run(`settings.motion=0;keys.add('MouseRight');worldMeshes=[];playerPos.set(0,1.7,0);viewHeight=1.7;health=200;weaponMotion.reset();aimSpring.reset();for(let i=0;i<180;i++)present(1/60);weaponGroup.updateMatrixWorld(true);const sight=new THREE.Vector3(0,.72*.43,-1.18*.43).applyMatrix4(weaponGroup.matrixWorld).project(camera);assert.ok(Math.abs(sight.x)<1e-5&&Math.abs(sight.y)<1e-5,'modular sight sits on actual aim axis');`);
console.log('Modular models: all 100 identity/rarity variants have finite geometry, bounded draws and disposal; actual gameplay sights align with the crosshair.');
