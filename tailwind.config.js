/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#EEEEEE',
        black: '#111111',
        brand: {
          blue: '#1b00ee',
          'blue-hover': '#1500bd',
          dark: '#111111',
          light: '#EEEEEE',
          grid: '#d5dae2'
        }
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Satoshi', 'JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
