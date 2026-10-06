export const colors = {
  canvas: '#F6F7F2',
  surface: '#FFFEFB',
  surfaceStrong: '#EDF1EB',
  ink: '#14231B',
  inkSoft: '#3E5046',
  muted: '#69776F',
  faint: '#8B9890',
  line: '#DFE5DE',
  brand: '#145A48',
  brandSoft: '#E5F0EB',
  accent: '#B96C3B',
  accentSoft: '#F8EDE3',
  social: '#A94672',
  socialSoft: '#F8EAF0',
  commerce: '#A95D2B',
  commerceSoft: '#F8ECE1',
  success: '#187447',
  successSoft: '#E9F5ED',
  warning: '#815900',
  warningSoft: '#FFF4D9',
  danger: '#B42318',
  dangerSoft: '#FEECEA',
  info: '#1D5C91',
  infoSoft: '#EAF3FB',
  scrim: 'rgba(15, 24, 20, 0.42)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const highContrast = {
  ...colors,
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceStrong: '#F2F2F2',
  ink: '#000000',
  inkSoft: '#151515',
  muted: '#333333',
  faint: '#555555',
  line: '#111111',
  brand: '#005443',
  brandSoft: '#E3F4EE',
  accent: '#934500',
  accentSoft: '#FFF0E5',
  social: '#A61E63',
  socialSoft: '#FCE7F2',
  commerce: '#7A3C00',
  commerceSoft: '#FFF0E0',
  success: '#075C35',
  successSoft: '#E4F4EC',
  warning: '#684300',
  warningSoft: '#FFF4CE',
  danger: '#8F0C06',
  dangerSoft: '#FFE7E4',
  info: '#064D80',
  infoSoft: '#E4F1FA',
  scrim: 'rgba(0, 0, 0, 0.58)',
} as const;

export const type = {
  displayXL: 38,
  displayLG: 32,
  titleXL: 27,
  titleLG: 22,
  titleMD: 18,
  bodyLG: 17,
  bodyMD: 15,
  bodySM: 13,
  labelLG: 14,
  labelMD: 12,
  labelSM: 11,
  numeric: 22,
} as const;

export const leading = {
  displayXL: 44,
  displayLG: 38,
  titleXL: 33,
  titleLG: 28,
  titleMD: 24,
  bodyLG: 25,
  bodyMD: 22,
  bodySM: 19,
  labelLG: 20,
  labelMD: 17,
  labelSM: 15,
  numeric: 27,
} as const;

// A four-point rhythm keeps dense mobile surfaces aligned without turning every
// component into a rounded card.
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  hero: 28,
  pill: 999,
} as const;

export const motion = {
  instant: 90,
  quick: 160,
  standard: 240,
  emphasis: 360,
} as const;

export const touch = {
  minimum: 44,
  comfortable: 48,
} as const;

export const breakpoints = {
  compact: 360,
  phone: 768,
  tablet: 1100,
} as const;

export const elevation = {
  none: {},
  low: {
    boxShadow: '0px 2px 8px rgba(20, 35, 27, 0.035)',
    elevation: 1,
  },
  medium: {
    boxShadow: '0px 6px 16px rgba(20, 35, 27, 0.07)',
    elevation: 3,
  },
} as const;

export type ThemeMode = 'system' | 'light' | 'dark' | 'high_contrast';

export type InteractionState =
  | 'idle'
  | 'focused'
  | 'pressed'
  | 'pending'
  | 'success'
  | 'error'
  | 'recovered'
  | 'disabled'
  | 'selected'
  | 'unavailable'
  | 'offline'
  | 'private'
  | 'blocked'
  | 'muted'
  | 'deleted'
  | 'moderated'
  | 'expired';

export const psychology = {
  contentWidth: { reading: 680, standard: 900, wide: 1200 },
  rhythm: { sectionGap: 24, cardGap: 16, controlGap: 8 },
  motion: { enter: motion.standard, feedback: motion.quick, emphasis: motion.emphasis },
  trust: { minTouch: touch.minimum, clearCommit: true, reversibleByDefault: true, visibleSystemState: true },
  ranking: { relevance: true, novelty: true, diversity: true, fairness: true, freshness: true, relationship: true, userControl: true },
  commerce: { priceBeforeCommit: true, inventoryBeforeCommit: true, deliveryBeforeCommit: true, paymentSeparate: true },
} as const;
