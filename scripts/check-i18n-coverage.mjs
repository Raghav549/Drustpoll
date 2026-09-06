import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);
const packMatch=core.match(/const packs:Record<string,Dictionary>=\{([\s\S]*?)\n\};\nexport function t/);
const packsText=packMatch?.[1]??'';
const packCodes=new Set([...packsText.matchAll(/(?:^|\n)\s{0,8}([a-zA-Z-]+):\{/g)].map(m=>m[1]));

const advisoryFallback=localeCodes.filter(c=>c!=='en'&&!packCodes.has(c));
console.log(`i18n locale registry: ${localeCodes.length} locales; explicit translated packs: ${packCodes.size}.`);
if(advisoryFallback.length)console.log(`Advisory fallback locales: ${advisoryFallback.join(', ')}`);

const duplicate=[...new Set(localeCodes.filter((c,i,a)=>a.indexOf(c)!==i))];
if(duplicate.length){
  console.error(`Duplicate locale codes: ${duplicate.join(', ')}`);
  process.exit(1);
}

// The app intentionally supports advisory fallback locales. The CI gate only
// requires the default English pack plus the primary Indian Hindi pack.
if(!packCodes.has('hi')||!packCodes.has('en')){
  console.error('Required English/Hindi locale packs are missing.');
  process.exit(1);
}

console.log(`i18n validation OK: ${localeCodes.length} selectable locales, ${packCodes.size} explicit packs.`);
