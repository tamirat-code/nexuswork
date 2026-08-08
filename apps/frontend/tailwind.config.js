/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#020f18",
          50: "#0a1e2e",
          100: "#071520",
          300: "#0e3347",
          500: "#0a3347",
          700: "#051e2e",
          900: "#020f18",
        },
        paper: {
          DEFAULT: "#020f18",
          100: "#071520",
        },
        brass: {
          DEFAULT: "#00c8b4",
          100: "#e0f5f2",
          300: "#00e5d1",
          700: "#006e62",
        },
        slate: {
          DEFAULT: "#a0cdd8",
          300: "#3a7080",
          100: "#0e3347",
        },
        escrow: {
          DEFAULT: "#22c55e",
          100: "#052e1a",
        },
        brick: {
          DEFAULT: "#f87171",
          100: "#2d0a0a",
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
        card: "0 1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.25)",
        elevated: "0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)",
        focus: "0 0 0 3px rgba(0,200,180,0.35)",
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