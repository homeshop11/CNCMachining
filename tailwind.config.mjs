import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7fb',
          100: '#e3eef7',
          200: '#c0dcee',
          300: '#8bc0df',
          400: '#4f9dca',
          500: '#2b7fae',
          600: '#20658f',
          700: '#1d5274',
          800: '#1b4660',
          900: '#183b50',
          950: '#0f2635',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        panel: '0 18px 50px -28px rgba(15, 38, 53, 0.35)',
      },
    },
  },
  plugins: [typography],
};
