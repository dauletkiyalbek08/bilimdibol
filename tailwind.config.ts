import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
      },
      colors: {
        // Brand palette
        canvas: "#F8FAF7",
        brand: {
          DEFAULT: "#16A34A",
          dark: "#166534",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#16A34A",
          600: "#15803D",
          700: "#166534",
        },
        accent: {
          yellow: "#FACC15",
          orange: "#FB923C",
        },
        ink: "#111827",
        muted: "#6B7280",
        border: "#E5E7EB",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.04)",
        card: "0 4px 24px -8px rgba(17, 24, 39, 0.08)",
        pop: "0 8px 32px -8px rgba(17, 24, 39, 0.16)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
