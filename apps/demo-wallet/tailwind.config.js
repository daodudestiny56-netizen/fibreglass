/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/fiberglass-react/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'var(--bg)',
        surface: '#FFFFFF',
        edge: 'var(--ink)',
        signal: 'var(--accent-primary)',
        signalDim: 'var(--accent-primary)',
        ink: 'var(--ink)',
        inkMuted: '#555555',
        fail: 'var(--accent-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
