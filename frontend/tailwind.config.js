/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060b14',
        bg2: '#0b1220',
        bg3: '#0f1929',
        card: '#111827',
        card2: '#162033',
        cyan: '#00E5FF',
        purple: '#8B5CF6',
        danger: '#EF4444',
        warn: '#F97316',
        success: '#22C55E',
        yellow: '#EAB308',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        ui: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
