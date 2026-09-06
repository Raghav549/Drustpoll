import fs from 'node:fs';
const source=fs.readFileSync('src/i18n/core.ts','utf8');
const localeMatch=source.match(/export const locales:Locale\[\]=\[(.*?)\];/s);
const packMatch=source.match(/const packs:Record<string,Dictionary>=\{(.*?)\n\};/s);
if(!localeMatch||!packMatch) throw new Error('Unable to inspect translation registry');
const localeCodes=[...localeMatch[1].matchAll(/code:'([^']+)'/g)].map(m=>m[1]);
const englishKeys=[...source.match(/const en:Dictionary=\{(.*?)\};/s)?.[1].matchAll(/([A-Za-z0-9_]+):/g)??[]].map(m=>m[1]);
const failures=[];
for(const code of localeCodes){
 if(code==='en') continue;
 const re=new RegExp(`(?:^|\\n)\\s*${code}:\\{(.*?)\\}(?=,\\n|\\n\\};)`,`s`);
 const pack=packMatch[1].match(re)?.[1]??'';
 const missing=englishKeys.filter(key=>!new RegExp(`(?:^|,)${key}:`).test(pack));
 if(missing.length) failures.push(`${code}: ${missing.join(', ')}`);
}
if(failures.length){console.error('Translation coverage incomplete');console.error(failures.join('\n'));process.exit(1);}
console.log(`Translation coverage OK: ${localeCodes.length} locales × ${englishKeys.length} core keys.`);
