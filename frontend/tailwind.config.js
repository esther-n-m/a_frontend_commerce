/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Scans all HTML files (index.html, cart.html, etc.)
    "./*.html",
    // Scans JavaScript files (e.g., cart.js)
    "./js/*.js",
  ],
  theme: {
    extend: {
      colors: {
        // Primary background (very dark, almost black)
        'primary-bg': '#0a0a0a',
        // Secondary background (a subtle lift for cards/modals)
        'secondary-bg': '#151515', 
        // Soft off-white for primary text (less harsh than pure white)
        'text-light': '#f0f0f0', 
        
        // Gold Tones
        'gold': '#D4AF37',       // Your primary gold
        'gold-hover': '#E0C16E', // Brighter gold for hover/accents
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

