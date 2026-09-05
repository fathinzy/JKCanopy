/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f5efe6',
        canopy: {
          DEFAULT: '#8b5e34',
          dark: '#6f4a29',
          light: '#a9764a',
        },
        gold: '#c9a24b',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
