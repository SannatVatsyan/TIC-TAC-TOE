/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enables dark mode support
  theme: {
    extend: {
      colors: {
        primary: "#1E293B",
        secondary: "#64748B",
        accent: "#E11D48",
        light: "#F8FAFC",
        dark: "#0F172A",
      },
    },
  },
  plugins: [],
};
