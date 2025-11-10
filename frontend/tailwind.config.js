/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // Scans all HTML files (index.html, cart.html, etc.)
    "./js/*.js", // Scans  JavaScript files (e.g., cart.js)
  ],
  theme: {
    extend: {
      colors: {
        'gold': '#D4AF37',
        'dark': '#0d0d0d',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

