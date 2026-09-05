import React from 'react';
import {CanonicalIcon,type CanonicalIconName} from './CanonicalIcon';
import {ExtraIcon,type ExtraIconName} from './icon-extra';
export type IconName=CanonicalIconName|ExtraIconName;
export function Icon({name,...props}:{name:IconName;size?:number;color?:any;strokeWidth?:number}){if(name==='clip'||name==='phone'||name==='eyeOff')return <ExtraIcon name={name} size={props.size} color={props.color}/>;return <CanonicalIcon name={name} {...props}/>;}
