/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#080c14",
          card: "#0c111d",
          border: "#1e293b"
        },
        light: {
          bg: "#fcfcfb",
          card: "#ffffff",
          border: "#eaeaea"
        },
        brand: {
          primary: "#0062ff",
          secondary: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          muted: "#64748b",
          success: "#10b981",
          info: "#06b6d4"
        }
      },
      fontFamily: {
        sans: ["SF Pro Display", "Geist Sans", "Outfit", "Inter", "sans-serif"],
        serif: ["Instrument Serif", "Playfair Display", "serif"],
        mono: ["Geist Mono", "SF Mono", "JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
