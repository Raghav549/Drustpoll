import Svg,{Path,Circle,Rect,Line} from 'react-native-svg';
import type {ColorValue} from 'react-native';

export type IconName='home'|'search'|'create'|'connect'|'profile'|'bell'|'settings'|'back'|'close'|'more'|'heart'|'comment'|'bookmark'|'share'|'cart'|'shop'|'check'|'chevronRight'|'plus'|'lock'|'shield'|'send'|'refresh'|'filter';

export function Icon({name,size=22,color='#6A756D',strokeWidth=1.9}:{name:IconName;size?:number;color?:ColorValue;strokeWidth?:number}){
 const p={fill:'none' as const,stroke:color,strokeWidth,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 const common={width:size,height:size,viewBox:'0 0 24 24',accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
 switch(name){
  case'home':return <Svg {...common}><Path {...p} d="M3 10.7 12 3l9 7.7v8.1a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 18.8z"/><Path {...p} d="M9 20v-6h6v6"/></Svg>;
  case'search':return <Svg {...common}><Circle {...p} cx="10.8" cy="10.8" r="6.4"/><Path {...p} d="m16 16 5 5"/></Svg>;
  case'create':return <Svg {...common}><Rect {...p} x="4" y="4" width="16" height="16" rx="3"/><Path {...p} d="M12 8v8M8 12h8"/></Svg>;
  case'connect':return <Svg {...common}><Path {...p} d="M5 7h9a5 5 0 0 1 5 5v5"/><Path {...p} d="m15 14 4 3 3-4"/><Path {...p} d="M5 7 8 4M5 7l3 3"/></Svg>;
  case'profile':return <Svg {...common}><Circle {...p} cx="12" cy="8" r="3.5"/><Path {...p} d="M5 20a7 7 0 0 1 14 0"/></Svg>;
  case'bell':return <Svg {...common}><Path {...p} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><Path {...p} d="M10 21h4"/></Svg>;
  case'settings':return <Svg {...common}><Circle {...p} cx="12" cy="12" r="3"/><Path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H7v-2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8.4 9 9.8 7.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2H21a1.7 1.7 0 0 0-1.6 1z"/></Svg>;
  case'back':return <Svg {...common}><Path {...p} d="m15 5-7 7 7 7"/><Line {...p} x1="8" y1="12" x2="21" y2="12"/></Svg>;
  case'close':return <Svg {...common}><Path {...p} d="m6 6 12 12M18 6 6 18"/></Svg>;
  case'more':return <Svg {...common}><Circle fill={color} cx="5" cy="12" r="1.4"/><Circle fill={color} cx="12" cy="12" r="1.4"/><Circle fill={color} cx="19" cy="12" r="1.4"/></Svg>;
  case'heart':return <Svg {...common}><Path {...p} d="M20.8 8.6c0 5-8.8 10-8.8 10s-8.8-5-8.8-10A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.8 2.6z"/></Svg>;
  case'comment':return <Svg {...common}><Path {...p} d="M20 11.5a7.5 7.5 0 0 1-7.9 7.5 9.5 9.5 0 0 1-4-.8L4 20l1.4-3.7A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7z"/></Svg>;
  case'bookmark':return <Svg {...common}><Path {...p} d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3-6 3z"/></Svg>;
  case'share':return <Svg {...common}><Circle {...p} cx="18" cy="5" r="2"/><Circle {...p} cx="6" cy="12" r="2"/><Circle {...p} cx="18" cy="19" r="2"/><Path {...p} d="m8 11 8-5M8 13l8 5"/></Svg>;
  case'cart':return <Svg {...common}><Path {...p} d="M3 4h2l2 11h10l2-8H6"/><Circle {...p} cx="9" cy="20" r="1"/><Circle {...p} cx="17" cy="20" r="1"/></Svg>;
  case'shop':return <Svg {...common}><Path {...p} d="M4 10h16v10H4zM3 10l2-6h14l2 6"/><Path {...p} d="M8 10v10M16 10v10"/></Svg>;
  case'check':return <Svg {...common}><Path {...p} d="m5 12 4 4L19 6"/></Svg>;
  case'chevronRight':return <Svg {...common}><Path {...p} d="m9 5 7 7-7 7"/></Svg>;
  case'plus':return <Svg {...common}><Path {...p} d="M12 5v14M5 12h14"/></Svg>;
  case'lock':return <Svg {...common}><Rect {...p} x="5" y="10" width="14" height="10" rx="2"/><Path {...p} d="M8 10V7a4 4 0 0 1 8 0v3"/></Svg>;
  case'shield':return <Svg {...common}><Path {...p} d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z"/><Path {...p} d="m8.5 12 2.2 2.2 4.8-5"/></Svg>;
  case'send':return <Svg {...common}><Path {...p} d="m3 11 18-8-6 18-3-7z"/><Path {...p} d="m3 11 9 3"/></Svg>;
  case'refresh':return <Svg {...common}><Path {...p} d="M20 11a8 8 0 0 0-14.8-4L3 10"/><Path {...p} d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14"/><Path {...p} d="M21 19v-5h-5"/></Svg>;
  case'filter':return <Svg {...common}><Path {...p} d="M4 6h16M7 12h10M10 18h4"/></Svg>;
 }
}
