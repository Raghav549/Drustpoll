import Svg,{Circle,Path,Rect} from 'react-native-svg';
import {colors} from './theme';

export function BrandMark({size=48}:{size?:number}){
 const r=size*0.24;
 return <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityRole="image" accessibilityLabel="Drustpoll">
   <Rect x="1" y="1" width="46" height="46" rx={r*2} fill={colors.brand}/>
   <Path d="M14 11v26M14 11h9c7 0 11 4.6 11 13s-4 13-11 13h-9" fill="none" stroke={colors.white} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>
   <Circle cx="35.5" cy="11" r="2.2" fill={colors.accent}/>
 </Svg>;
}
