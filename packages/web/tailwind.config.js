/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eq: {
          gold: '#c8a84b',
          dark: '#1a1a2e',
          panel: '#16213e',
          border: '#2d3561',
          text: '#e0d8c0',
          muted: '#8a8070',
          accent: '#4a9eff',
          danger: '#e05a5a',
          success: '#5ae0a0',
        },
      },
      fontFamily: {
        sans: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
