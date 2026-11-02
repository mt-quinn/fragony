import fs from 'node:fs';
import {synthesize} from '../dist/audio.js';
const rate=32000,names=['pistol','rifle','smg','shotgun','rail','rocket'],length=rate*9,pcm=new Float32Array(length);
for(let n=0;n<names.length;n++){const wave=synthesize(names[n],rate);const times=names[n]==='smg'?[0,.055,.11,.165]:[0];for(const offset of times){const start=Math.floor((n*1.4+.15+offset)*rate);for(let i=0;i<wave.length&&start+i<length;i++)pcm[start+i]+=wave[i]*.65}}
const wav=Buffer.alloc(44+length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*2,40);for(let i=0;i<length;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),44+i*2);fs.writeFileSync(new URL('../docs/weapon-audio.wav',import.meta.url),wav);
