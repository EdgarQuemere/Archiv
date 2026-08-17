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
          blue: '#1b00ee',
          'blue-hover': '#1500bd',
          dark: '#0f0f13',
          light: '#eef0f4',
          grid: '#d5dae2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
