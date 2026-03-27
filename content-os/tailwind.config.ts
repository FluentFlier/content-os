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
        bg: "#0C0A09",
        surface: "#13100E",
        border: "#2A2218",
        "text-primary": "#FAF6F1",
        "text-muted": "#5A5047",
        coral: "#EB5E55",
        yellow: "#F5C842",
        green: "#5CB85C",
        purple: "#C77DFF",
        blue: "#4D96FF",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
