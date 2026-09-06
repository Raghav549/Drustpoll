import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);
const packMatch=core.match(/const packs:Record<string,Dictionary>=\{([\s\S]*?)\n\};\nexport function t/);
const packsText=packMatch?.[1]??'';
const packCodes=new Set([...packsText.matchAll(/(?:^|\n)\s{0,8}([a-zA-Z-]+):\{/g)].map(m=>m[1]));
const required=['en','hi'];
const missingRequired=required.filter(c=>!packCodes.has(c));
const duplicates=[...new Set(localeCodes.filter((c,i,a)=>a.indexOf(c)!==i))];
if(duplicates.length) throw new Error(`Duplicate locale codes: ${duplicates.join(', ')}`);
if(missingRequired.length) throw new Error(`Missing required locale packs: ${missingRequired.join(', ')}`);
console.log(`i18n CI validation OK: ${localeCodes.length} selectable locales; ${packCodes.size} explicit packs; required packs present: ${required.join(', ')}.`);
