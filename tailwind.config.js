/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3eae4',
          500: '#6b8370',
          600: '#4a5d4e',
          700: '#39493c',
          300: '#869b8a', // Dark mode sage
        },
        sand: {
          500: '#785e3a',
          400: '#c8b28e', // Dark mode sand
        },
        linen: {
          canvas: '#f7f7f5',
          surface: '#ffffff',
          border: '#e5e5e2',
        },
        graphite: {
          canvas: '#0e1013',
          surface: '#15181e',
          border: '#242832',
        },
      },
    },
  },
  plugins: [],
}
