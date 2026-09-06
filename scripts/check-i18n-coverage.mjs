import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const appDir=path.join(root,'app');
const core=fs.readFileSync(path.join(root,'src/i18n/core.ts'),'utf8');
const localeCodes=[...core.matchAll(/\{code:'([^']+)'/g)].map(m=>m[1]);
const packMatch=core.match(/const packs:Record<string,Dictionary>=\{([\s\S]*?)\n\};\nexport function t/);
const packsText=packMatch?.[1]??'';
const packCodes=[...packsText.matchAll(/\n\s{1,4}([a-zA-Z-]+):\{/g)].map(m=>m[1]);
const missing=localeCodes.filter(c=>c!=='en'&&!packCodes.includes(c));
if(missing.length){console.error(`Missing locale packs: ${missing.join(', ')}`);process.exit(1);}
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.tsx')||p.endsWith('.ts'))files.push(p);}}
walk(appDir);
const allow=['node_modules','src/i18n/core.ts'];
const hardcoded=[];
for(const file of files){if(allow.some(x=>file.includes(x)))continue;const text=fs.readFileSync(file,'utf8');
  if(/<Text[^>]*>\s*[A-Za-z][^<{]{2,}\s*<\//.test(text)||/placeholder\s*=\s*["'][A-Za-z]/.test(text))hardcoded.push(path.relative(root,file));
}
// This is an advisory coverage gate. Existing product/content strings may be intentional,
// but locale packs must exist for every selectable locale.
console.log(`i18n locale coverage OK: ${localeCodes.length} selectable locales, ${packCodes.length} explicit packs.`);
if(hardcoded.length)console.log(`Advisory: ${hardcoded.length} UI files still contain literal copy; migrate these deliberately to keyed translations.`);
