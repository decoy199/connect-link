/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(135deg,rgb(167, 117, 75) 0%,rgb(231, 109, 38) 100%)',
      }
    },
  },
  plugins: [],
}
