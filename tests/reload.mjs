import { createGameHarness } from './harness.mjs';
const {setup,run}=createGameHarness(19);setup();
run(`
mode='play';locked=true;time=10000;opponentAI.brains.clear();bots=[];perks={};owned=[0,1,2,3,4,5];playerPos.set(20,1.7,8);camera.position.copy(playerPos);camera.lookAt(20,50,8);respawnTime=0;
function finishReload(){let frames=0;while(reloading>0&&frames++<100)update(.037);assert.equal(reloading,0,'reload timer must finish at exactly zero');assert.equal(ammo,weapons[equipped].mag,'magazine refills');}
for(let gun=0;gun<6;gun++){
 equipped=gun;ammo=weapons[gun].mag;magazines[gun]=ammo;reloading=0;buildWeapon();
 for(let cycle=0;cycle<3;cycle++){
  while(ammo>0){shotTimer=0;shoot()}assert.equal(ammo,0);shotTimer=0;shoot();assert.ok(reloading>0,'empty gun auto-reloads');finishReload();
  shotTimer=0;shoot();assert.equal(ammo,weapons[gun].mag-1,'firing resumes after reload');reload();assert.ok(reloading>0,'manual partial-magazine reload still works');finishReload();
 }
}
equipped=0;ammo=0;magazines[0]=0;shotTimer=0;reload();update(.1);switchWeapon(1);assert.equal(reloading,0);switchWeapon(0);assert.equal(ammo,0,'cancelled reload cannot refill via switch');shotTimer=0;reload();finishReload();
console.log('All six weapons: three complete empty/reload/fire/manual-reload cycles pass with uneven frame times. Interrupted reloads preserve empty magazines.');
`);
