/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: '#05080f',
        surface: '#0a0e17',
        edge: '#151c2d',
        signal: '#4FF0D8',
        signalDim: '#4FF0D822',
        ink: '#e2e8f0',
        inkMuted: '#64748b',
        fail: '#f43f5e',
      },
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
