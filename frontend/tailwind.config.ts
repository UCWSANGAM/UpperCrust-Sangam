import type { Config } from 'tailwindcss';

// Saarthi house style — dark sidebar, ivory content, gold accent, Playfair Display numerals
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F0', // ivory content area
        surface: '#FFFFFF', // card surface
        sidebar: '#14171B', // dark navy/black sidebar
        border: '#E7E1D3',
        accent: '#B8935A', // gold
        accentDark: '#8A6A3E',
        ink: '#1F2430', // primary text on ivory
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
