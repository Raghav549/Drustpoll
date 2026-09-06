import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);
const packsStart=core.indexOf('const packs:Record<string,Dictionary>={');
const exportAfterPacks=core.indexOf('\nexport function t',packsStart);
if(packsStart<0||exportAfterPacks<0)throw new Error('Unable to locate i18n packs registry.');
const packsText=core.slice(packsStart+'const packs:Record<string,Dictionary>={'.length,exportAfterPacks);
const packCodes=new Set();
for(const line of packsText.split(/\r?\n/)){
  const match=line.match(/^\s*([A-Za-z][A-Za-z0-9-]*):\s*\{/);
  if(match)packCodes.add(match[1]);
}
const missing=localeCodes.filter(c=>c!=='en'&&!packCodes.has(c));
console.log(`i18n locale registry: ${localeCodes.length} locales; explicit translated packs: ${packCodes.size}.`);
if(missing.length)console.log(`Advisory fallback locales: ${missing.join(', ')}`);
const duplicate=[...new Set(localeCodes.filter((c,i,a)=>a.indexOf(c)!==i))];
if(duplicate.length){console.error(`Duplicate locale codes: ${duplicate.join(', ')}`);process.exit(1);}
if(!packCodes.has('en')||!packCodes.has('hi')){console.error('Required English/Hindi locale packs are missing.');process.exit(1);}
console.log(`i18n validation OK: ${localeCodes.length} selectable locales, ${packCodes.size} explicit packs.`);
