/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12263a",
        sand: "#f7f1e8",
        brass: "#c4a574",
        moss: "#4d6b57",
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
          DEFAULT: "#E11D74",
          50: "#FEF0F7",
          100: "#FDD9ED",
          200: "#FAB3DA",
          300: "#F67DBD",
          400: "#F04DA0",
          500: "#E11D74",
          600: "#C2185B",
          700: "#A01551",
          800: "#7E1143",
          900: "#5C0C33",
        },
        cream: {
          DEFAULT: "#FDF8F3",
          50: "#FEFCF9",
          100: "#FDF8F3",
          200: "#FAF0E5",
          300: "#F5E5D2",
        },
        slate: {
          450: "#7a8a9c",
          500: "#5b6b7c",
          550: "#4e5d6d",
        },
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
        display: [
          "'Plus Jakarta Sans'",
          "'Manrope'",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "'Plus Jakarta Sans'",
          "'Manrope'",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(11,29,53,0.04)",
        card: "0 1px 2px 0 rgba(11,29,53,0.04), 0 2px 8px -2px rgba(11,29,53,0.06)",
        "card-hover":
          "0 4px 12px -4px rgba(11,29,53,0.10), 0 16px 32px -12px rgba(11,29,53,0.14)",
        modal: "0 20px 60px -10px rgba(11,29,53,0.28)",
        nav: "0 -4px 20px -8px rgba(11,29,53,0.10)",
        "btn-primary":
          "0 1px 2px rgba(11,29,53,0.10), 0 6px 16px -6px rgba(11,29,53,0.35)",
        "btn-primary-hover":
          "0 2px 4px rgba(11,29,53,0.12), 0 10px 24px -8px rgba(11,29,53,0.42)",
      },
      letterSpacing: {
        "tightest": "-0.03em",
        "tighter": "-0.02em",
        "widest-ui": "0.08em",
      },
      lineHeight: {
        snugish: "1.15",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out both",
        "fade-up": "fadeUp 0.4s ease-out both",
        "slide-in-right": "slideInRight 0.3s ease-out both",
        "slide-in-up": "slideInUp 0.4s cubic-bezier(0.32,0.72,0,1) both",
        skeleton: "skeleton 1.5s ease-in-out infinite",
        heartbeat: "heartbeat 0.35s ease-out",
        "scale-in": "scaleIn 0.25s ease-out both",
        float: "float 3s ease-in-out infinite",
        "badge-pop": "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "page-enter": "pageEnter 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "page-enter-1": "pageEnter 0.5s cubic-bezier(0.22,1,0.36,1) 60ms both",
        "page-enter-2": "pageEnter 0.5s cubic-bezier(0.22,1,0.36,1) 120ms both",
        "page-enter-3": "pageEnter 0.5s cubic-bezier(0.22,1,0.36,1) 180ms both",
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite",
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
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        badgePop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.12)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pageEnter: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.82" },
        },
      },
    },
  },
  plugins: [],
};
