import type { Config } from 'tailwindcss';

// Bloomberg/Linear-inspired palette — dark, high-contrast, gold accent
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0D10',
        surface: '#14171B',
        border: '#232830',
        accent: '#C9A962', // gold
        muted: '#8A8F98',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
