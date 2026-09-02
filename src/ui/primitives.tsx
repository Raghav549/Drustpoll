import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewProps } from 'react-native';
import { colors, elevation, radius, spacing, type } from './theme';

export function Surface({ children, tone='default', style, ...props }: PropsWithChildren<ViewProps> & { tone?: 'default'|'soft'|'success'|'commerce'|'info'|'danger' }) {
  return <View {...props} style={[styles.surface, styles[tone], style]}>{children}</View>;
}

export function AppText({ children, variant='body', style, ...props }: TextProps & { variant?: 'display'|'title'|'body'|'muted'|'label'|'caption' }) {
  return <Text {...props} style={[styles.text, styles[variant], style]}>{children}</Text>;
}

export function Action({ children, label, variant='primary', disabled=false, style, ...props }: PressableProps & { label?: string; variant?: 'primary'|'secondary'|'quiet'|'danger' }) {
  return <Pressable {...props} disabled={disabled} accessibilityRole={props.accessibilityRole ?? 'button'} accessibilityLabel={props.accessibilityLabel ?? label} style={({pressed})=>[styles.action, styles[`action_${variant}`], disabled&&styles.disabled, pressed&&!disabled&&styles.pressed, style]}>{children}</Pressable>;
}

export function StateView({ title, body, action, icon }: { title:string; body?:string; action?:ReactNode; icon?:ReactNode }) {
  return <Surface style={styles.state}>{icon}<AppText variant="title">{title}</AppText>{body?<AppText variant="muted" style={styles.stateBody}>{body}</AppText>:null}{action?<View style={styles.stateAction}>{action}</View>:null}</Surface>;
}

export function Divider() { return <View accessible={false} style={styles.divider}/>; }

const styles=StyleSheet.create({
  surface:{backgroundColor:colors.surface,borderColor:colors.line,borderWidth:1,borderRadius:radius.lg,padding:spacing.lg,...elevation.low},
  default:{backgroundColor:colors.surface},soft:{backgroundColor:colors.surfaceStrong},success:{backgroundColor:colors.successSoft,borderColor:'#CFE9D9'},commerce:{backgroundColor:colors.commerceSoft,borderColor:'#F0D5BC'},info:{backgroundColor:colors.infoSoft,borderColor:'#D5E6F5'},danger:{backgroundColor:colors.dangerSoft,borderColor:'#F3C9C5'},
  text:{color:colors.ink},display:{fontSize:type.displayLG,lineHeight:38,fontWeight:'800'},title:{fontSize:type.titleMD,lineHeight:24,fontWeight:'800'},body:{fontSize:type.bodyMD,lineHeight:22},muted:{fontSize:type.bodySM,lineHeight:21,color:colors.muted},label:{fontSize:type.labelLG,lineHeight:20,fontWeight:'700'},caption:{fontSize:type.labelSM,lineHeight:15,color:colors.faint},
  action:{minHeight:44,borderRadius:radius.md,paddingHorizontal:16,alignItems:'center',justifyContent:'center',...elevation.low},action_primary:{backgroundColor:colors.brand},action_secondary:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line},action_quiet:{backgroundColor:colors.brandSoft,...elevation.none},action_danger:{backgroundColor:colors.danger},disabled:{opacity:.45},pressed:{opacity:.72},
  state:{marginTop:spacing.sm},stateBody:{marginTop:6},stateAction:{marginTop:spacing.md},divider:{height:1,backgroundColor:colors.line,width:'100%'},
});
