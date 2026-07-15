import type { Config } from 'tailwindcss';

// Corporate white/gold house style — white canvas, dark navy sidebar, gold accent,
// Manrope for UI text, Playfair Display reserved for hero numerals only.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF', // white content area
        surface: '#FFFFFF', // card surface
        sidebar: '#14171B', // dark navy/black sidebar
        border: '#E5E5E5',
        accent: '#B8935A', // gold
        accentDark: '#8A6A3E',
        ink: '#141414', // primary text on white
        muted: '#71767C',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
