import fs from 'node:fs';import {createHash}from'node:crypto';
const root=new URL('./',import.meta.url),game=fs.readFileSync(new URL('../../dist/game.js',root),'utf8'),paths=['game.js','ai.js','collision.js','geometry.js','elevators.js','pickups.js','map.js','combat.js','characters.js'];
const provenance=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL('../../dist/'+p,root))).digest('hex')]));
let source=fs.readFileSync(new URL('../../tests/harness.mjs',root),'utf8').replace(/from '\.\.\/dist\//g,"from '../../dist/").replace("fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8')",'FROZEN_GAME');
source='const FROZEN_GAME='+JSON.stringify(game)+';\nexport const provenance='+JSON.stringify(provenance)+';\n'+source;fs.writeFileSync(new URL('frozen-harness.mjs',root),source);console.log('Prepared frozen game source and recorded gameplay module hashes.');
