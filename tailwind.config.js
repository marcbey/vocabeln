/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './client/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f4f8ff',
        panel: '#ffffff',
        accent: '#0d47b7',
        accent2: '#8f3f00',
        good: '#0a6a45',
        warn: '#6f3400',
        text: '#101d36',
        muted: '#243a5f',
      },
      boxShadow: {
        glow: '0 12px 28px rgba(33, 121, 255, 0.24)',
        deep: '0 24px 48px rgba(26, 39, 66, 0.16)',
      },
      borderRadius: {
        xl2: '22px',
      },
      fontFamily: {
        display: ['"Fredoka"', '"Nunito"', '"Trebuchet MS"', 'sans-serif'],
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
        pop: 'pop 1500ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
