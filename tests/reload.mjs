import {createGameHarness} from './harness.mjs';
const h=createGameHarness(19);h.setup();h.run(`
mode='play';locked=true;time=10000;opponentAI=null;bots=[];worldMeshes=[];blocks=[];pickups=[];playerPos.set(0,1.7,0);viewHeight=1.7;mouseDown=false;
for(const mechanism of ['automatic','semi','burst','charge'])for(const barrel of ['single','double','huge','gatling','rails']){
 gunCollection.kit.mechanism={id:mechanism,rank:2};gunCollection.kit.barrel={id:barrel,rank:1};playerGunFire.reset(playerWeapon(),playerGunLife.id);const w=playerWeapon();playerGunFire.ammo=1;syncModularAmmo();reload();assert.equal(reloadLength,w.reload);assert.ok(reloading>0);let frames=0;while(reloading>0&&frames++<200)update(.037);assert.equal(reloading,0);assert.equal(ammo,w.mag);assert.equal(playerGunFire.capacitor,1,'reload preserves a ready charge');
}
`);console.log('Reload: all mechanisms/barrels finish with uneven frames, correct durations/capacity and retained charge.');
