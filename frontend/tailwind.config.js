/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        pm: {
          dark:   '#0b0f1a',
          card:   'rgba(255,255,255,0.04)',
          accent: '#06d6a0',
          cyan:   '#22d3ee',
          purple: '#a78bfa',
          glow:   'rgba(6,214,160,0.15)',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        glow:      '0 0 20px rgba(6,214,160,0.15), 0 0 60px rgba(6,214,160,0.05)',
        'glow-lg': '0 0 40px rgba(6,214,160,0.2), 0 0 80px rgba(34,211,238,0.08)',
        glass:     '0 8px 32px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'bar-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(6,214,160,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(6,214,160,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.5s ease-out both',
        'slide-up':       'slide-up 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s ease-out both',
        'bar-fill':       'bar-fill 1s ease-out both',
        'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
        shimmer:          'shimmer 2s linear infinite',
        'spin-slow':      'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
}
