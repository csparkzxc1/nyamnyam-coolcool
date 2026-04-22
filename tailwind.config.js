/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds — light
        'bg-page': '#F4EBDC',
        'bg-app': '#FAF4EC',
        'bg-surface': '#FFFFFF',
        'bg-muted': '#EFE4D0',
        // Backgrounds — dark
        'bg-page-dark': '#1A1410',
        'bg-app-dark': '#231B15',
        'bg-surface-dark': '#2E2419',
        'bg-muted-dark': '#3A2E22',
        // Ink — light
        'ink-primary': '#2A1D12',
        'ink-secondary': '#5C4A37',
        'ink-tertiary': '#8A7A63',
        'ink-on-accent': '#FFF8EF',
        // Ink — dark
        'ink-primary-dark': '#F4EBDC',
        'ink-secondary-dark': '#C9B89A',
        'ink-tertiary-dark': '#8A7A63',
        // Accents (다크모드 변경 없음)
        'accent-amber': '#D68E2F',
        'accent-sienna': '#B85428',
        'accent-rose': '#C66E7E',
        'accent-sage': '#6E8565',
        'accent-plum': '#6B4975',
        // Brand — Kakao (공식 가이드, 다크모드 동일)
        'brand-kakao': '#FEE500',
        'brand-kakao-ink': '#191919',
        // Borders — light / dark
        'border-subtle': 'rgba(42, 29, 18, 0.08)',
        'border-strong': 'rgba(42, 29, 18, 0.16)',
        'border-subtle-dark': 'rgba(244, 235, 220, 0.08)',
        'border-strong-dark': 'rgba(244, 235, 220, 0.16)',
      },
      fontFamily: {
        display: ['Fraunces', 'Pretendard Variable', 'serif'],
        body: ['Pretendard Variable', 'Fraunces', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(42,29,18,0.04), 0 8px 24px rgba(42,29,18,0.06)',
        card: '0 2px 6px rgba(42,29,18,0.05), 0 16px 40px rgba(42,29,18,0.08)',
        phone: '0 10px 30px rgba(42,29,18,0.15), 0 40px 80px rgba(42,29,18,0.2)',
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        phone: '44px',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #E8A660 0%, #C66E7E 60%, #8B5A84 100%)',
        'gradient-hero-dawn': 'linear-gradient(135deg, #F2D094 0%, #E8A660 50%, #C66E7E 100%)',
        'gradient-hero-night': 'linear-gradient(135deg, #4A3A5C 0%, #6B4975 50%, #8B5A84 100%)',
        'gradient-hero-warn': 'linear-gradient(135deg, #E8A660 0%, #B85428 100%)',
      },
    },
  },
  plugins: [],
};
