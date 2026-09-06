import {locales,missingTranslationKeys,translationKeys} from './core';

export type LocaleCoverage={code:string;total:number;translated:number;missing:string[]};

export function getLocaleCoverage(code:string):LocaleCoverage{
 const missing=missingTranslationKeys(code);
 return {code,total:translationKeys.length,translated:translationKeys.length-missing.length,missing};
}

export function getAllLocaleCoverage():LocaleCoverage[]{return locales.map(locale=>getLocaleCoverage(locale.code));}

export function assertNoMissingTranslations(codes:string[]=locales.map(x=>x.code)){
 const failures=codes.map(getLocaleCoverage).filter(x=>x.missing.length>0);
 if(failures.length)throw new Error(`Missing translations: ${failures.map(x=>`${x.code}(${x.missing.join(',')})`).join(' ')}`);
 return true;
}
