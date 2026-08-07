/** @type {import('tailwindcss').Config} */
export default {
  // Enables dark mode using the "dark" class on the <html> tag
  darkMode: "class",

  // THIS IS THE FIX: Tells Tailwind where to look for your classes
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#3B82F6",
          soft: "#DBEAFE",
        },
        secondary: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          light: "#6366F1",
          soft: "#E0E7FF",
        },
        accent: {
          DEFAULT: "#14B8A6",
          dark: "#0F766E",
          light: "#2DD4BF",
          soft: "#CCFBF1",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(15, 23, 42, 0.12)",
        card: "0 18px 50px -20px rgba(15, 23, 42, 0.18)",
        glow: "0 0 60px rgba(37, 99, 235, 0.22)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
