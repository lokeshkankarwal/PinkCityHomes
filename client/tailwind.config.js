/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy (keep for backward compat)
        ink: "#12263a",
        sand: "#f4efe6",
        brass: "#c4a574",
        moss: "#4d6b57",
        // New Design System
        navy: {
          DEFAULT: "#0B1D35",
          50: "#EEF3FA",
          100: "#D9E5F3",
          200: "#B3CBE7",
          300: "#7AAAD6",
          400: "#4485C1",
          500: "#2466A8",
          600: "#1A4F8A",
          700: "#133C6C",
          800: "#0B2B50",
          900: "#071A32",
          950: "#040E1A",
        },
        pink: {
          DEFAULT: "#E91E8C",
          50: "#FEF0F7",
          100: "#FDD9ED",
          200: "#FAB3DA",
          300: "#F67DBD",
          400: "#F04DA0",
          500: "#E91E8C",
          600: "#CC1478",
          700: "#A80D62",
          800: "#84094D",
          900: "#61063A",
        },
        cream: {
          DEFAULT: "#FDF8F3",
          50: "#FEFCF9",
          100: "#FDF8F3",
          200: "#FAF0E5",
          300: "#F5E5D2",
        },
        charcoal: "#1E293B",
        slate: "#64748B",
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#92400E",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#991B1B",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(11,29,53,0.06), 0 1px 2px 0 rgba(11,29,53,0.04)",
        "card-hover": "0 8px 24px 0 rgba(11,29,53,0.12), 0 2px 8px 0 rgba(11,29,53,0.06)",
        modal: "0 20px 60px 0 rgba(11,29,53,0.25)",
        nav: "0 2px 8px 0 rgba(11,29,53,0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-up": "fadeUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-up": "slideInUp 0.35s cubic-bezier(0.32,0.72,0,1)",
        skeleton: "skeleton 1.5s ease-in-out infinite",
        heartbeat: "heartbeat 0.35s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        skeleton: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        heartbeat: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
