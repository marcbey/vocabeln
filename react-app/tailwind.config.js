/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1c2e',
        panel: '#13253a',
        accent: '#3cdfff',
        accent2: '#ff7ac3',
        good: '#6df2a4',
        warn: '#ffb347',
        text: '#e9f2ff',
        muted: '#9eb4d1',
      },
      boxShadow: {
        glow: '0 8px 20px rgba(60, 223, 255, 0.35)',
        deep: '0 15px 40px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        xl2: '18px',
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Comic Neue"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        fast: '220ms',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { transform: 'translate(var(--dx), var(--dy)) scale(0)', opacity: '0' },
        },
      },
      animation: {
        pop: 'pop 900ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
