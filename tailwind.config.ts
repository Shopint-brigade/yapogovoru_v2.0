import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // === Border Radius (Pixel Art = Sharp) ===
      borderRadius: {
        none: "0px",
        sm: "2px",
        md: "4px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "9999px",
      },

      // === Colors ===
      colors: {
        // Base colors
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        // Card & Popover
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },

        // Primary (Red)
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },

        // Secondary (White)
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },

        // Muted
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },

        // Accent
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },

        // Destructive/Error
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },

        // Functional Colors
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          light: "hsl(var(--success-light) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          light: "hsl(var(--warning-light) / <alpha-value>)",
        },
        error: {
          DEFAULT: "hsl(var(--error) / <alpha-value>)",
          light: "hsl(var(--error-light) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          light: "hsl(var(--info-light) / <alpha-value>)",
        },

        // Status colors
        status: {
          online: "#00B74F",
          away: "#FFC138",
          busy: "#D10B00",
          offline: "rgba(255, 255, 255, 0.15)",
        },
      },

      // === Font Family ===
      fontFamily: {
        pixel: ["var(--font-pixel)"],
        mono: ["var(--font-mono)"],
        sans: ["var(--font-mono)"],
        display: ["var(--font-pixel)"],
      },

      // === Font Size (Pixel Art Scale) ===
      fontSize: {
        "pixel-xs": ["8px", { lineHeight: "1.5" }],
        "pixel-sm": ["10px", { lineHeight: "1.5" }],
        "pixel-md": ["12px", { lineHeight: "1.5" }],
        "pixel-lg": ["18px", { lineHeight: "1.5" }],
        "pixel-xl": ["24px", { lineHeight: "1.6" }],
        "pixel-2xl": ["32px", { lineHeight: "1.4" }],
      },

      // === Spacing (4px Grid) ===
      spacing: {
        "pixel-1": "4px",
        "pixel-2": "8px",
        "pixel-3": "12px",
        "pixel-4": "16px",
        "pixel-5": "20px",
        "pixel-6": "24px",
        "pixel-8": "32px",
        "pixel-10": "40px",
        "pixel-12": "48px",
      },

      // === Box Shadow ===
      boxShadow: {
        "pixel": "4px 4px 0px rgba(0, 0, 0, 0.8)",
        "pixel-sm": "2px 2px 0px rgba(0, 0, 0, 0.8)",
        "pixel-lg": "6px 6px 0px rgba(0, 0, 0, 0.8)",
        "pixel-inset": "inset 2px 2px 4px rgba(0, 0, 0, 0.4)",
        "glow-red": "0 0 20px hsl(355 95% 43% / 0.4)",
        "glow-green": "0 0 20px hsl(142 81% 36% / 0.4)",
        "glow-blue": "0 0 20px hsl(223 100% 61% / 0.4)",
        "glow-yellow": "0 0 20px hsl(38 100% 62% / 0.4)",
        "inner-dark": "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
        "border-glow": "0 0 0 2px hsl(var(--primary) / 0.3)",
      },

      // === Keyframes ===
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pixel-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pixel-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
        },
        "glow": {
          "0%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3)" },
          "100%": { boxShadow: "0 0 15px hsl(var(--primary) / 0.5)" },
        },
        "slide-up": {
          from: { transform: "translateY(4px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-4px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.8" },
          "94%": { opacity: "1" },
          "95%": { opacity: "0.9" },
        },
        "progress-stripe": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "8px 0" },
        },
        "border-pulse": {
          "0%, 100%": { borderColor: "hsl(var(--border))" },
          "50%": { borderColor: "hsl(var(--primary))" },
        },
      },

      // === Animations ===
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pixel-blink": "pixel-blink 1s step-end infinite",
        "pixel-pulse": "pixel-pulse 2s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "flicker": "flicker 3s linear infinite",
        "progress-stripe": "progress-stripe 0.5s linear infinite",
        "border-pulse": "border-pulse 2s ease-in-out infinite",
      },

      // === Transitions ===
      transitionDuration: {
        "pixel": "100ms",
      },
      transitionTimingFunction: {
        "pixel": "step-end",
        "retro": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
