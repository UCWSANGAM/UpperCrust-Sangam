import type { Config } from 'tailwindcss';

// Sangam Design System v2 — corporate white/gold, Manrope UI text, Playfair Display
// hero numerals. Every value here is a token; components should never hardcode a
// color, spacing, radius, or shadow — reference these instead.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        sidebar: '#14171B',
        sidebarHover: '#1F232A',
        border: '#E5E5E5',
        borderStrong: '#D4D4D4',
        accent: '#B8935A',
        accentDark: '#8A6A3E',
        accentSoft: '#F5EDE1',
        ink: '#141414',
        muted: '#71767C',
        mutedSoft: '#9AA0A6',
        // Semantic — meaning, not decoration
        success: '#639922',
        successSoft: '#EAF3DE',
        danger: '#E24B4A',
        dangerSoft: '#FBEAEA',
        warning: '#B8935A',
        warningSoft: '#F5EDE1',
        info: '#378ADD',
        infoSoft: '#E8F2FC',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        // Fixed type scale — every component should pick from this, not arbitrary px
        micro: ['10px', { lineHeight: '14px' }],
        caption: ['11px', { lineHeight: '15px' }],
        body: ['13px', { lineHeight: '19px' }],
        label: ['12px', { lineHeight: '16px' }],
        title: ['15px', { lineHeight: '20px', fontWeight: '600' }],
        section: ['20px', { lineHeight: '26px', fontWeight: '600' }],
        page: ['28px', { lineHeight: '34px', fontWeight: '600' }],
        hero: ['38px', { lineHeight: '42px' }],
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        pill: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(20,20,20,0.04)',
        sm: '0 1px 3px rgba(20,20,20,0.06), 0 1px 2px rgba(20,20,20,0.04)',
        md: '0 4px 12px rgba(20,20,20,0.08)',
        lg: '0 12px 32px rgba(20,20,20,0.12)',
        focus: '0 0 0 3px rgba(184,147,90,0.25)',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '180ms',
        slow: '260ms',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
};
export default config;
