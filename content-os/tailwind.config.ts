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
          primary: '#09090B',
          secondary: '#18181B',
          tertiary: '#27272A',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.16)',
          active: 'rgba(255, 255, 255, 0.28)',
        },
        coral: {
          DEFAULT: '#818CF8',
          light: 'rgba(99, 102, 241, 0.12)',
          dark: '#6366F1',
        },
        pillar: {
          'hot-take': '#EF4444',
          hackathon: '#F59E0B',
          founder: '#818CF8',
          explainer: '#A78BFA',
          origin: '#34D399',
          research: '#22D3EE',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
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
