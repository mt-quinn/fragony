import fs from 'node:fs';
import {createGameHarness} from '../../tests/harness.mjs';
import {AI_TUNING} from '../../dist/ai.js';
const root=new URL('./',import.meta.url),code=fs.readFileSync(new URL('observe-runtime.js',root),'utf8'),originalProfiles=AI_TUNING.profiles;
try{
 AI_TUNING.profiles=[...originalProfiles,{...originalProfiles[0],name:'sixth-rusher'}];
 const cases=process.argv[2]==='verify'?[{map:'testworks',seed:17,telemetry:false},{map:'testworks',seed:17,telemetry:true}]:['testworks','reservoir'].flatMap(map=>[17,81,124].flatMap(seed=>[false,true].map(disableMajor=>({map,seed,disableMajor,telemetry:true}))));
 const outputs=[];
 for(const config of cases){const h=createGameHarness(config.seed);h.setup();h.context.studyConfig=config;const result=h.run(code,{timeout:180000});outputs.push(result);const name=`encounters-${config.map}-${config.seed}-${config.disableMajor?'no-major':'baseline'}${config.telemetry===false?'-unobserved':''}.json`;fs.writeFileSync(new URL(name,root),JSON.stringify(result));console.log(JSON.stringify({config,nativeShots:result.final.stats.shots,recordedShots:result.events.filter(e=>e.type==='shot').length,damage:result.events.filter(e=>e.type==='damage').length,nativeDeaths:result.final.bots.reduce((s,b)=>s+b.deaths,0),recordedDeaths:result.events.filter(e=>e.type==='death').length,pickups:result.events.filter(e=>e.type==='pickup').length,snapshots:result.snapshots.length}));}
 if(process.argv[2]==='verify'){if(JSON.stringify(outputs[0].final)!==JSON.stringify(outputs[1].final)||JSON.stringify(outputs[0].initial)!==JSON.stringify(outputs[1].initial))throw Error('Observer changed deterministic behavior');console.log('VERIFIED full observer versus no hooks/snapshots: identical initial state, native counters, final actors and pickup timers.');}
}finally{AI_TUNING.profiles=originalProfiles}
