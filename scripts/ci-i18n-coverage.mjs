import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);

// `en` is the base dictionary and lives as `const en`, while translated
// dictionaries live under `packs`. Treat both as actual packs in CI.
const packCodes=new Set(['en']);
const packsStart=core.indexOf('const packs:Record<string,Dictionary>={');
const exportAfterPacks=core.indexOf('\nexport function t',packsStart);
if(packsStart<0||exportAfterPacks<0)throw new Error('Unable to locate i18n packs registry.');
const packsText=core.slice(packsStart+'const packs:Record<string,Dictionary>={'.length,exportAfterPacks);
for(const line of packsText.split(/\r?\n/)){
  const match=line.match(/^\s*([A-Za-z][A-Za-z0-9-]*):\s*\{/);
  if(match)packCodes.add(match[1]);
}

const required=['en','hi'];
const missingRequired=required.filter(c=>!packCodes.has(c));
const duplicates=[...new Set(localeCodes.filter((c,i,a)=>a.indexOf(c)!==i))];
if(duplicates.length)throw new Error(`Duplicate locale codes: ${duplicates.join(', ')}`);
if(missingRequired.length)throw new Error(`Missing required locale packs: ${missingRequired.join(', ')}`);

console.log(`i18n CI validation OK: ${localeCodes.length} selectable locales; ${packCodes.size} explicit packs; required packs present: ${required.join(', ')}.`);
