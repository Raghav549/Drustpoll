import { AccessibilityInfo, Platform } from 'react-native';

let reduceMotion=false;
let highContrast=false;
let loaded=false;

export async function initAccessibilityPreferences(){
  if(loaded)return {reduceMotion,highContrast};
  loaded=true;
  try{reduceMotion=await AccessibilityInfo.isReduceMotionEnabled();}catch{}
  return {reduceMotion,highContrast};
}
export function getReduceMotion(){return reduceMotion;}
export function setHighContrast(value:boolean){highContrast=value;}
export function getHighContrast(){return highContrast;}
export const webFocusStyle=Platform.OS==='web'?{outlineStyle:'solid' as const,outlineWidth:2,outlineColor:'#173F35',outlineOffset:2}:{};
export const buttonA11y=(label:string,disabled=false,selected=false)=>({accessibilityRole:'button' as const,accessibilityLabel:label,accessibilityState:{disabled,selected}});
