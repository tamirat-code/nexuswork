/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens linked to CSS custom properties
        canvas: {
          DEFAULT: "var(--canvas)",
          subtle: "var(--canvas-subtle)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          soft: "var(--surface-soft)",
          muted: "var(--surface-muted)",
          elevated: "var(--surface-elevated)",
        },
        border: {
          DEFAULT: "var(--border-subtle)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          soft: "var(--brand-soft)",
          dark: "var(--brand-dark)",
          foreground: "var(--brand-foreground)",
        },
        
        // Legacy aliases mapped directly to CSS variables for 100% backward compatibility
        ink: {
          DEFAULT: "var(--canvas)",
          50: "var(--surface)",
          100: "var(--surface-soft)",
          300: "var(--border-subtle)",
          500: "var(--border-strong)",
          700: "var(--surface-elevated)",
          900: "var(--sidebar-bg)",
        },
        paper: {
          DEFAULT: "var(--canvas)",
          100: "var(--surface-soft)",
        },
        brass: {
          DEFAULT: "var(--brand)",
          100: "var(--brand-soft)",
          300: "var(--brand-hover)",
          700: "var(--brand-dark)",
        },
        slate: {
          DEFAULT: "var(--text-primary)",
          200: "var(--text-primary)",
          300: "var(--text-secondary)",
          400: "var(--text-muted)",
          100: "var(--border-subtle)",
        },
        escrow: {
          DEFAULT: "var(--success)",
          100: "var(--success-soft)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        brick: {
          DEFAULT: "var(--danger)",
          100: "var(--danger-soft)",
        },
        amber: {
          DEFAULT: "var(--warning)",
          100: "var(--warning-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          100: "var(--info-soft)",
        },

        // Brand-mapped shadcn aliases
        input: "var(--border-subtle)",
        ring: "var(--brand)",
        background: "var(--canvas)",
        foreground: "var(--text-primary)",
        primary: { DEFAULT: "var(--brand)", foreground: "var(--brand-foreground)" },
        secondary: { DEFAULT: "var(--surface-soft)", foreground: "var(--text-primary)" },
        destructive: { DEFAULT: "var(--danger)", foreground: "#ffffff" },
        muted: { DEFAULT: "var(--surface-muted)", foreground: "var(--text-muted)" },
        accent: { DEFAULT: "var(--brand-soft)", foreground: "var(--brand)" },
        popover: { DEFAULT: "var(--surface-elevated)", foreground: "var(--text-primary)" },
        card: { DEFAULT: "var(--surface)", foreground: "var(--text-primary)" },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        badge: "9999px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
        card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 16px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.08)",
        focus: "0 0 0 3px var(--brand-soft)",
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
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};