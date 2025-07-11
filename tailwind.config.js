/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFB200',   // Bright yellow/orange
          orange: '#EB5B00',   // Vivid orange
          pink: '#D91656',     // Vivid pink/red
          purple: '#640D5F',   // Deep purple
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1.25rem', // 20px for extra rounded cards
        '2xl': '1.5rem', // 24px for extra rounded cards
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(100,13,95,0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 