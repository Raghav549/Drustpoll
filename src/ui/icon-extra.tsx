import React from 'react';
import Svg,{Path,Circle} from 'react-native-svg';
import type {ColorValue} from 'react-native';
import {colors} from './theme';
export type ExtraIconName='clip'|'phone'|'eyeOff';
export function ExtraIcon({name,size=22,color=colors.ink}:{name:ExtraIconName;size?:number;color?:ColorValue}){const p={fill:'none' as const,stroke:color,strokeWidth:1.85,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};if(name==='clip')return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="m20 11-8.7 8.7a5 5 0 1 1-7.1-7.1L13 3.8a3.5 3.5 0 0 1 5 5L9.4 17.4a2 2 0 0 1-2.8-2.8l8-8"/></Svg>;if(name==='phone')return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M7 3h3l1.2 5-2 1.7a15 15 0 0 0 5.1 5.1l1.7-2 5 1.2v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 5 5.2 2 2 0 0 1 7 3z"/></Svg>;return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 3l18 18"/><Path {...p} d="M10.6 5.2A11.7 11.7 0 0 1 12 5c5.9 0 9.5 7 9.5 7a16 16 0 0 1-3 3.6M6.1 6.1C3.8 8.1 2.5 12 2.5 12s3.6 7 9.5 7a9.7 9.7 0 0 0 2.4-.3"/><Circle {...p} cx="12" cy="12" r="2.5"/></Svg>;}
