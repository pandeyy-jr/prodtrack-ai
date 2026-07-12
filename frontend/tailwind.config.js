/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#081217',
        'surface': '#0D1B22',
        'primary': '#00E676',
        'accent': '#00FFC8',
        'warning': '#F59E0B',
        'danger': '#FF4D4F',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
      },
      backgroundColor: {
        'glass': 'rgba(255,255,255,0.04)',
        'card': 'rgba(255,255,255,0.04)',
        'hover': 'rgba(255,255,255,0.08)',
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'DEFAULT': '18px',
        'lg': '18px',
        'md': '14px',
        'sm': '10px',
      },
      spacing: {
        'safe': '32px',
        'gutter': '48px',
      },
      maxWidth: {
        'container': '1440px',
      },
      boxShadow: {
        'glass': '0 10px 30px rgba(0,0,0,0.3)',
        'glass-lg': '0 35px 100px rgba(0,0,0,0.42)',
        'lift': '0 8px 32px rgba(0,0,0,0.2)',
        'glow': '0 10px 28px rgba(0,230,118,0.16)',
        'glow-accent': '0 10px 28px rgba(0,255,200,0.16)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-in-out',
        'slide-up': 'slideUp 400ms ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}