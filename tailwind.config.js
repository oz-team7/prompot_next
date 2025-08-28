/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF7A00',
        accent: '#FFFFFF',
        text: '#000000',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}