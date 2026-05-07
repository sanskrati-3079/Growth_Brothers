/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C63FF",
          light: "#8D86FF",
          dark: "#574FE0",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#4F8BFF",
          light: "#76A9FF",
          dark: "#3B68CC",
        },
        success: { DEFAULT: "#10B981", light: "#34D399", dark: "#059669" },
        warning: { DEFAULT: "#F59E0B", light: "#FBBF24", dark: "#D97706" },
        danger:  { DEFAULT: "#EF4444", light: "#F87171", dark: "#DC2626" },
        surface: { DEFAULT: "#FFFFFF", muted: "#F8FAFC" },
      },
      boxShadow: {
        soft: "0 4px 20px rgba(108, 99, 255, 0.10)",
        glow: "0 0 0 4px rgba(108, 99, 255, 0.18)",
      },
      animation: {
        "fade-in": "fadeIn .25s ease-out",
        "slide-up": "slideUp .35s ease-out",
        shimmer: "shimmer 1.4s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200px 0" }, "100%": { backgroundPosition: "calc(200px + 100%) 0" } },
      },
    },
  },
  plugins: [],
};
