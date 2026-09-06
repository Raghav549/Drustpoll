export type TranslationDictionary=Record<string,string>;

export function localeCoverage(english:TranslationDictionary, pack:TranslationDictionary={}){
  const keys=Object.keys(english);
  const missing=keys.filter(key=>!pack[key]);
  return {total:keys.length,translated:keys.length-missing.length,missing};
}

export function mergeLocale(english:TranslationDictionary, pack:TranslationDictionary={}){
  return {...english,...pack};
}
