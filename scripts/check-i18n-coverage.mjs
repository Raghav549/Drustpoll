import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const core = fs.readFileSync(path.join(root, 'src/i18n/core.ts'), 'utf8');
const localeCodes = [...core.matchAll(/\{code:'([^']+)'/g)].map(m => m[1]);

// The English dictionary is the base pack (`const en`), while translated
// dictionaries live in `packs`. Treat the base dictionary as an explicit pack.
const packCodes = new Set(['en']);
const packsStart = core.indexOf('const packs:Record<string,Dictionary>={');
const exportAfterPacks = core.indexOf('\nexport function t', packsStart);
if (packsStart < 0 || exportAfterPacks < 0) {
  throw new Error('Unable to locate i18n packs registry.');
}
const packsText = core.slice(
  packsStart + 'const packs:Record<string,Dictionary>={'.length,
  exportAfterPacks,
);
for (const match of packsText.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9-]*):\s*\{/g)) {
  packCodes.add(match[1]);
}

const missing = localeCodes.filter(c => c !== 'en' && !packCodes.has(c));
const duplicates = [...new Set(localeCodes.filter((c, i, a) => a.indexOf(c) !== i))];

if (duplicates.length) {
  console.error(`Duplicate locale codes: ${duplicates.join(', ')}`);
  process.exit(1);
}

// Non-English locales may intentionally fall back to the base pack; this is
// advisory coverage, not a CI failure. The product requires EN + HI packs.
if (missing.length) console.log(`Advisory fallback locales: ${missing.join(', ')}`);
if (!packCodes.has('hi')) {
  console.error('Required Hindi locale pack is missing.');
  process.exit(1);
}

console.log(`i18n validation OK: ${localeCodes.length} selectable locales; ${packCodes.size} explicit packs; required packs present: en, hi.`);
