/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14213D",
          50: "#F1F3F7",
          100: "#DDE2EB",
          300: "#8C97AE",
          500: "#3C4A69",
          700: "#1D2B4A",
          900: "#0B1526",
        },
        paper: {
          DEFAULT: "#FBFAF7",
          100: "#F4F2EC",
        },
        brass: {
          DEFAULT: "#C9A227",
          100: "#F5EBC7",
          300: "#E0C15E",
          700: "#8F721A",
        },
        slate: {
          DEFAULT: "#5C6470",
          300: "#9AA1AB",
          100: "#E7E9EC",
        },
        escrow: {
          DEFAULT: "#2F6F4E",
          100: "#E1EFE7",
        },
        brick: {
          DEFAULT: "#B3403A",
          100: "#F6E4E3",
        },
      },
      fontFamily: {
        display: ["Newsreader", "ui-serif", "Georgia", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,33,61,0.04), 0 4px 16px rgba(20,33,61,0.06)",
        elevated: "0 8px 24px rgba(20,33,61,0.12), 0 2px 6px rgba(20,33,61,0.08)",
        focus: "0 0 0 3px rgba(201,162,39,0.35)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};