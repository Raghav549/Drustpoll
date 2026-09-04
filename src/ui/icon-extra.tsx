import React from 'react';
import Svg,{Path} from 'react-native-svg';
import type {ColorValue} from 'react-native';
import {colors} from './theme';
export type ExtraIconName='clip'|'phone';
export function ExtraIcon({name,size=22,color=colors.ink}:{name:ExtraIconName;size?:number;color?:ColorValue}){const p={fill:'none' as const,stroke:color,strokeWidth:1.85,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};if(name==='clip')return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="m20 11-8.7 8.7a5 5 0 1 1-7.1-7.1L13 3.8a3.5 3.5 0 0 1 5 5L9.4 17.4a2 2 0 0 1-2.8-2.8l8-8"/></Svg>;return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M7 3h3l1.2 5-2 1.7a15 15 0 0 0 5.1 5.1l1.7-2 5 1.2v3a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 5 5.2 2 2 0 0 1 7 3z"/></Svg>;}