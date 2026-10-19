/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0d0d0d',
          surface: '#141414',
          card:    '#1a1a1a',
          hover:   '#1f1f1f',
          border:  'rgba(255,255,255,0.06)',
        },
        accent: {
          DEFAULT:  '#7c3aed',
          light:    '#a78bfa',
          muted:    'rgba(124,58,237,0.2)',
          glow:     'rgba(124,58,237,0.4)',
        },
        cyan: {
          DEFAULT:  '#06b6d4',
          muted:    'rgba(6,182,212,0.2)',
        },
        content: {
          primary:   '#e8e8e8',
          secondary: '#8a8a8a',
          tertiary:  '#555555',
        },
        red: {
          yt:       '#ff0000',
          'yt-dim': 'rgba(255,0,0,0.15)',
          'yt-border': 'rgba(255,0,0,0.25)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-accent': '0 0 24px rgba(124,58,237,0.45)',
        'glow-sm':     '0 0 12px rgba(124,58,237,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-lg':     '0 8px 40px rgba(0,0,0,0.6)',
        'player':      '0 -8px 40px rgba(0,0,0,0.5)',
      },
      animation: {
        'spin-slow':     'spin 10s linear infinite',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'fade-up':       'fadeSlideUp 0.4s ease forwards',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
};
