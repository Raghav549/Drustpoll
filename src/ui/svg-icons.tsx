import React from 'react';
import Svg,{Path,Circle,Rect,Line,Polyline,Polygon} from 'react-native-svg';
import {colors} from './theme';

type Props={size?:number;color?:string;strokeWidth?:number};
const base=(p:Props)=>({width:p.size??24,height:p.size??24,viewBox:'0 0 24 24',fill:'none',stroke:p.color??colors.ink,strokeWidth:p.strokeWidth??1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const});
export function HomeIcon(p:Props){return <Svg {...base(p)}><Path d="M3 10.5 12 3l9 7.5"/><Path d="M5.5 9.5V21h13V9.5"/><Path d="M9.5 21v-6h5v6"/></Svg>}
export function SearchIcon(p:Props){return <Svg {...base(p)}><Circle cx="10.8" cy="10.8" r="6.5"/><Line x1="16" y1="16" x2="21" y2="21"/></Svg>}
export function CreateIcon(p:Props){return <Svg {...base(p)}><Path d="M12 3v18M3 12h18"/></Svg>}
export function ConnectIcon(p:Props){return <Svg {...base(p)}><Circle cx="7" cy="8" r="2.5"/><Circle cx="17" cy="6" r="2.5"/><Circle cx="17" cy="18" r="2.5"/><Path d="M9.3 7.5 14.7 6.5M9 9.5l5.5 6.5M9.3 8.5l6 8"/></Svg>}
export function ProfileIcon(p:Props){return <Svg {...base(p)}><Circle cx="12" cy="8" r="3.5"/><Path d="M4.5 21c.9-4.1 3.3-6 7.5-6s6.6 1.9 7.5 6"/></Svg>}
export function HeartIcon(p:Props){return <Svg {...base(p)}><Path d="M20.8 8.9c0 5.1-8.8 10.1-8.8 10.1S3.2 14 3.2 8.9A4.4 4.4 0 0 1 12 6.8a4.4 4.4 0 0 1 8.8 2.1Z"/></Svg>}
export function SaveIcon(p:Props){return <Svg {...base(p)}><Path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"/></Svg>}
export function ShareIcon(p:Props){return <Svg {...base(p)}><Circle cx="18" cy="5" r="2.5"/><Circle cx="6" cy="12" r="2.5"/><Circle cx="18" cy="19" r="2.5"/><Path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4"/></Svg>}
export function MoreIcon(p:Props){return <Svg {...base(p)}><Circle cx="5" cy="12" r="1" fill={p.color??colors.ink}/><Circle cx="12" cy="12" r="1" fill={p.color??colors.ink}/><Circle cx="19" cy="12" r="1" fill={p.color??colors.ink}/></Svg>}
export function CloseIcon(p:Props){return <Svg {...base(p)}><Path d="m5 5 14 14M19 5 5 19"/></Svg>}
export function BackIcon(p:Props){return <Svg {...base(p)}><Path d="m14.5 5-7 7 7 7"/></Svg>}
export function CheckIcon(p:Props){return <Svg {...base(p)}><Polyline points="5 12.5 10 17 19 7"/></Svg>}
export function CartIcon(p:Props){return <Svg {...base(p)}><Path d="M3.5 4h2l1.6 10.1a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L20.3 7H6.2"/><Circle cx="9" cy="19" r="1.5"/><Circle cx="17" cy="19" r="1.5"/></Svg>}
export function LockIcon(p:Props){return <Svg {...base(p)}><Rect x="5" y="10" width="14" height="11" rx="2"/><Path d="M8 10V7a4 4 0 0 1 8 0v3"/></Svg>}
export function FilterIcon(p:Props){return <Svg {...base(p)}><Path d="M4 6h16M7 12h10M10 18h4"/></Svg>}
export function RefreshIcon(p:Props){return <Svg {...base(p)}><Path d="M20 11a8 8 0 0 0-14-4.9L4 8"/><Path d="M4 4v4h4M4 13a8 8 0 0 0 14 4.9l2-1.9"/><Path d="M20 20v-4h-4"/></Svg>}
export function InfoIcon(p:Props){return <Svg {...base(p)}><Circle cx="12" cy="12" r="9"/><Path d="M12 10v6M12 7.2h.01"/></Svg>}
export function AlertIcon(p:Props){return <Svg {...base(p)}><Path d="m12 3 9 16H3L12 3Z"/><Path d="M12 9v4M12 16h.01"/></Svg>}
export function CameraIcon(p:Props){return <Svg {...base(p)}><Rect x="3" y="6.5" width="18" height="13" rx="2"/><Path d="m8 6.5 1.3-2h5.4l1.3 2"/><Circle cx="12" cy="13" r="3.5"/></Svg>}
export function MicIcon(p:Props){return <Svg {...base(p)}><Rect x="9" y="3" width="6" height="11" rx="3"/><Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></Svg>}
export function PauseIcon(p:Props){return <Svg {...base(p)}><Path d="M8 5v14M16 5v14"/></Svg>}
export function PlayIcon(p:Props){return <Svg {...base(p)}><Polygon points="8,5 19,12 8,19" fill="none"/></Svg>}
export function EyeIcon(p:Props){return <Svg {...base(p)}><Path d="M2.8 12s3.2-5.5 9.2-5.5S21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z"/><Circle cx="12" cy="12" r="2.2"/></Svg>}
export function SlidersIcon(p:Props){return <Svg {...base(p)}><Line x1="5" y1="6" x2="19" y2="6"/><Circle cx="9" cy="6" r="2"/><Line x1="5" y1="12" x2="19" y2="12"/><Circle cx="15" cy="12" r="2"/><Line x1="5" y1="18" x2="19" y2="18"/><Circle cx="11" cy="18" r="2"/></Svg>}
