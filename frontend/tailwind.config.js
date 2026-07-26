/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fb',
          100: '#dcedf5',
          200: '#bcdcec',
          300: '#8ec3dd',
          400: '#59a3c8',
          500: '#3786ae',
          600: '#296b90',
          700: '#245775',
          800: '#224a61',
          900: '#213f53',
          950: '#132836',
        },
        ink: '#1a2733',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}