import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        surface: "#18181B",
        "surface-hover": "#1F1F23",
        border: "#27272A",
        "border-bright": "#3F3F46",
        "text-primary": "#FAFAF9",
        "text-secondary": "#D4D4D8",
        "text-muted": "#71717A",
        amber: "#F59E0B",
        "amber-hover": "#D97706",
        "amber-dim": "#92400E",
        coral: "#EB5E55",
        green: "#22C55E",
        blue: "#3B82F6",
        purple: "#A78BFA",
        yellow: "#F5C842",
      },
      fontFamily: {
        display: ['"Instrument Serif"', "serif"],
        body: ["Outfit", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
