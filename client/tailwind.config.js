/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 24px 60px rgba(20, 11, 0, 0.18)'
      }
    }
  },
  plugins: []
};
