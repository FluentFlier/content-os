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
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          tertiary: '#94A3B8',
        },
        border: {
          DEFAULT: 'rgba(15, 23, 42, 0.08)',
          hover: 'rgba(15, 23, 42, 0.16)',
          active: 'rgba(15, 23, 42, 0.28)',
        },
        coral: {
          DEFAULT: '#6366F1',
          light: '#EEF2FF',
          dark: '#4338CA',
        },
        pillar: {
          'hot-take': '#EF4444',
          hackathon: '#F59E0B',
          founder: '#6366F1',
          explainer: '#8B5CF6',
          origin: '#10B981',
          research: '#06B6D4',
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
