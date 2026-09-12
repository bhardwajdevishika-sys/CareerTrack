/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 12px 35px -18px rgba(15, 23, 42, 0.22)',
      },
    },
  },
  plugins: [],
}
