/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        primary: { 50:'#F5F3FF',100:'#EDE9FE',200:'#DDD6FE',300:'#C4B5FD',400:'#A78BFA',500:'#7C3AED',600:'#6D28D9',700:'#5B21B6',800:'#4C1D95' },
        sidebar: '#1A1033',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)',
        soft: '0 12px 40px -12px rgba(124,58,237,0.22)',
        premium: '0 20px 60px -20px rgba(30,27,75,0.25)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
