/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        geist: ["Geist", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"]
      },
      colors: {
        saffron: "#F59E0B",
        ember: "#E94B24",
        ink: "#090909"
      }
    }
  },
  plugins: []
}
