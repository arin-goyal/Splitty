/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#060D10',

        neutral_1: '#DBE8E3',
        neutral_2: '#B1CDC1',
        neutral_3: '#7E9A8E',
        neutral_4: '#5A7268',
        neutral_5: '#060D10',

        accent_1: '#00EE87',

      },
      fontFamily: {
        satoshi: ['Satoshi Variable', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
