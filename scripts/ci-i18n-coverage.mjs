import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const extended=fs.readFileSync(path.join(root,'src/i18n/extended.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);
if(!localeCodes.length)throw new Error('No selectable locales found.');
const packCodes=new Set(['en']);
for(const source of [core,extended]){
  const start=source.indexOf('const packs:Record<string,Dictionary>={');
  if(start<0)continue;
  const end=source.indexOf('\n};',start);
  const text=source.slice(start,end<0?source.length:end);
  for(const m of text.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9-]*|'[^']+'):\s*\{/g))packCodes.add(m[1].replace(/^'|'$/g,''));
}
const uncovered=localeCodes.filter(c=>!packCodes.has(c));
if(uncovered.length)throw new Error(`Locales without an explicit translation pack: ${uncovered.join(', ')}`);
const duplicates=[...new Set(localeCodes.filter((c,i,a)=>a.indexOf(c)!==i))];
if(duplicates.length)throw new Error(`Duplicate locale codes: ${duplicates.join(', ')}`);
console.log(`i18n CI validation OK: ${localeCodes.length} selectable locales; every locale has an explicit translation pack.`);
