/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0f1115',
        card: '#171a21',
        well: '#0f1218',
        topbar: '#131620',
        edge: {
          DEFAULT: '#242833',
          strong: '#2a2f3d',
        },
        ink: {
          DEFAULT: '#e6e8eb',
          muted: '#9aa3b2',
          soft: '#b8c0cc',
          inverse: '#0b0d12',
        },
        accent: {
          DEFAULT: '#6ea8ff',
          hover: '#8bb9ff',
        },
        danger: '#ff6b6b',
      },
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
