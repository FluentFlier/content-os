import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAFAF8',
          secondary: '#F4F2EF',
          tertiary: '#EDECEA',
        },
        text: {
          primary: '#1A1714',
          secondary: '#4A4540',
          tertiary: '#8C857D',
        },
        border: {
          DEFAULT: 'rgba(26, 23, 20, 0.12)',
          hover: 'rgba(26, 23, 20, 0.25)',
          active: 'rgba(26, 23, 20, 0.40)',
        },
        coral: {
          DEFAULT: '#EB5E55',
          light: '#FAECE7',
          dark: '#993C1D',
        },
        pillar: {
          'hot-take': '#EB5E55',
          hackathon: '#F5C842',
          founder: '#4D96FF',
          explainer: '#C77DFF',
          origin: '#5CB85C',
          research: '#F5C842',
        },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'md': '7px',
        'badge': '3px',
        'pill': '20px',
      },
      borderWidth: {
        'thin': '0.5px',
        'accent': '3px',
        'nav': '2px',
      },
    },
  },
  plugins: [],
};

export default config;
