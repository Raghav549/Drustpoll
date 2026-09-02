export const colors = {
  canvas:'#F5F6F2',surface:'#FFFFFF',surfaceStrong:'#F0F2EC',ink:'#162019',inkSoft:'#344238',muted:'#6A756D',faint:'#98A39A',line:'#E1E6DF',brand:'#173F35',brandSoft:'#E5F0EA',accent:'#173F35',accentSoft:'#E5F0EA',dark:'#173F35',social:'#7C4DFF',socialSoft:'#F0EAFE',commerce:'#B76528',commerceSoft:'#FAEBDD',success:'#19734A',successSoft:'#E8F6EE',warning:'#8A5A00',warningSoft:'#FFF4D6',danger:'#B42318',dangerSoft:'#FEECEA',info:'#1D5C91',infoSoft:'#EAF3FB',scrim:'rgba(0,0,0,0.38)',white:'#FFFFFF',black:'#000000'
} as const;
export const highContrast={canvas:'#FFFFFF',surface:'#FFFFFF',surfaceStrong:'#F2F2F2',ink:'#000000',inkSoft:'#151515',muted:'#333333',faint:'#555555',line:'#111111',brand:'#003C2F',brandSoft:'#E5F4EF',accent:'#003C2F',accentSoft:'#E5F4EF',dark:'#003C2F',social:'#3B1FA3',socialSoft:'#F0EAFF',commerce:'#7A3C00',commerceSoft:'#FFF0E0',success:'#075C35',successSoft:'#E4F4EC',warning:'#684300',warningSoft:'#FFF4CE',danger:'#8F0C06',dangerSoft:'#FFE7E4',info:'#064D80',infoSoft:'#E4F1FA',scrim:'rgba(0,0,0,0.55)',white:'#FFFFFF',black:'#000000'} as const;
export const type={displayXL:38,displayLG:32,titleXL:26,titleLG:22,titleMD:18,bodyLG:17,bodyMD:15,bodySM:13,labelLG:14,labelMD:12,labelSM:11} as const;
export const leading={displayXL:44,displayLG:38,titleXL:32,titleLG:28,titleMD:24,bodyLG:25,bodyMD:22,bodySM:19,labelLG:20,labelMD:17,labelSM:15} as const;
export const radius={xs:8,sm:12,md:16,lg:22,xl:30,hero:36,pill:999} as const;
export const spacing={xxs:4,xs:8,sm:12,md:16,lg:20,xl:28,xxl:36,huge:52} as const;
export const motion={instant:80,quick:160,standard:240,emphasis:360} as const;
export const touch={minimum:44,comfortable:48} as const;
export const breakpoints={compact:360,phone:768,tablet:1100} as const;
export const elevation={none:{},low:{shadowColor:'#162019',shadowOpacity:.05,shadowRadius:10,shadowOffset:{width:0,height:3},elevation:2},medium:{shadowColor:'#162019',shadowOpacity:.09,shadowRadius:18,shadowOffset:{width:0,height:7},elevation:5}} as const;
export type ThemeMode='system'|'light'|'dark'|'high_contrast';
