/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#10B981',
          'primary-light': '#34D399',
          'primary-dark': '#059669'
        }
      },
    },
    plugins: [],
  }