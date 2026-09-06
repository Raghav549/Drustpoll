import Svg,{Path,Rect,Circle} from 'react-native-svg';
import {colors} from './theme';

export function BrandMark({size=48}:{size?:number}){
 const r=size*0.24;
 return <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityRole="image" accessibilityLabel="Drustpoll">
   <Rect x="1" y="1" width="46" height="46" rx={r*2} fill={colors.brand}/>
   <Path d="M15 10.5v27M15 10.5h8.2c7.1 0 11.8 5 11.8 13.5S30.3 37.5 23.2 37.5H15" fill="none" stroke={colors.white} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
   <Circle cx="34.5" cy="10.5" r="2.5" fill={colors.accent}/>
 </Svg>;
}
