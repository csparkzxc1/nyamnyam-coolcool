export const colors = {
  // Backgrounds — light
  bgPage:    '#F4EBDC',
  bgApp:     '#FAF4EC',
  bgSurface: '#FFFFFF',
  bgMuted:   '#EFE4D0',
  // Backgrounds — dark
  bgPageDark:    '#1A1410',
  bgAppDark:     '#231B15',
  bgSurfaceDark: '#2E2419',
  bgMutedDark:   '#3A2E22',
  // Ink — light
  inkPrimary:   '#2A1D12',
  inkSecondary: '#5C4A37',
  inkTertiary:  '#8A7A63',
  inkOnAccent:  '#FFF8EF',
  // Ink — dark
  inkPrimaryDark:   '#F4EBDC',
  inkSecondaryDark: '#C9B89A',
  inkTertiaryDark:  '#8A7A63',
  // Accents
  accentAmber:  '#D68E2F',
  accentSienna: '#B85428',
  accentRose:   '#C66E7E',
  accentSage:   '#6E8565',
  accentPlum:   '#6B4975',
} as const;

export const shadows = {
  soft:  '0 1px 2px rgba(42,29,18,0.04), 0 8px 24px rgba(42,29,18,0.06)',
  card:  '0 2px 6px rgba(42,29,18,0.05), 0 16px 40px rgba(42,29,18,0.08)',
  phone: '0 10px 30px rgba(42,29,18,0.15), 0 40px 80px rgba(42,29,18,0.2)',
} as const;

export const borderRadius = {
  sm:    8,
  md:    14,
  lg:    20,
  phone: 44,
} as const;

export type ColorKey = keyof typeof colors;
