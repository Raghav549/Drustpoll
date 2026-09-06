import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { defaultLocale, getLocale, hasSavedLocale, loadLocale, saveLocale, t, type Locale } from './core';

type I18nContextValue={locale:string;meta:Locale;ready:boolean;needsChoice:boolean;setLocale:(code:string)=>Promise<void>;t:(key:string,vars?:Record<string,string|number>)=>string};
const I18nContext=createContext<I18nContextValue|null>(null);

export function I18nProvider({children}:{children:ReactNode}){
 const [locale,setLocaleState]=useState(defaultLocale); const [ready,setReady]=useState(false); const [needsChoice,setNeedsChoice]=useState(false);
 useEffect(()=>{void Promise.all([loadLocale(),hasSavedLocale()]).then(([code,chosen])=>{setLocaleState(code);setNeedsChoice(!chosen);setReady(true);});},[]);
 const setLocale=async(code:string)=>{const next=getLocale(code);await saveLocale(next.code);setLocaleState(next.code);setNeedsChoice(false);I18nManager.allowRTL(next.direction==='rtl');};
 const meta=getLocale(locale);
 const value=useMemo(()=>({locale,meta,ready,needsChoice,setLocale,t:(key:string,vars?:Record<string,string|number>)=>t(locale,key,vars)}),[locale,meta,ready,needsChoice]);
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(){const value=useContext(I18nContext);if(!value)throw new Error('useI18n must be used inside I18nProvider');return value;}
export function useLocaleDirection(){const{meta}=useI18n();return meta.direction;}
export function LocaleGate({children}:{children:ReactNode}){const{ready}=useI18n();return ready?<>{children}</>:null;}
