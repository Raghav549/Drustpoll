import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export type LayoutClass = 'compact'|'phone'|'tablet'|'desktop';
export function getLayoutClass(width:number):LayoutClass { if(width<360)return 'compact'; if(width<768)return 'phone'; if(width<1100)return 'tablet'; return 'desktop'; }
export function useResponsiveLayout(){ const [width,setWidth]=useState(Dimensions.get('window').width); useEffect(()=>{const sub=Dimensions.addEventListener('change',({window})=>setWidth(window.width)); return ()=>sub.remove();},[]); const layout=getLayoutClass(width); return {width,layout,isCompact:layout==='compact',isPhone:layout==='compact'||layout==='phone',isTablet:layout==='tablet',isDesktop:layout==='desktop',contentWidth:layout==='desktop'?1120:layout==='tablet'?900:760}; }
