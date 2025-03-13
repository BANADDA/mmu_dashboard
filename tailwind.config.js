/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'mmu-blue': '#003366',
        'mmu-light-blue': '#006699',
        'mmu-gray': '#f0f0f0',
      },
    },
  },
  plugins: [],
}

