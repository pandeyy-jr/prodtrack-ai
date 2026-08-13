/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#10100F',
        'surface': '#171715',
        'primary': '#D99219',
        'accent': '#F0AE35',
        'warning': '#F59E0B',
        'danger': '#FF4D4F',
        'text-primary': '#F0EEE8',
        'text-secondary': '#A6A29A',
      },
      backgroundColor: {
        'glass': 'rgba(255,255,255,0.035)',
        'card': '#171715',
        'hover': 'rgba(255,255,255,0.06)',
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.10)',
      },
      borderRadius: {
        'DEFAULT': '0px',
        'lg': '0px',
        'md': '0px',
        'sm': '0px',
      },
      spacing: {
        'safe': '32px',
        'gutter': '48px',
      },
      maxWidth: {
        'container': '1440px',
      },
      boxShadow: {
        'glass': '0 14px 36px rgba(0,0,0,0.18)',
        'glass-lg': '0 35px 100px rgba(0,0,0,0.42)',
        'lift': '0 8px 32px rgba(0,0,0,0.22)',
        'glow': '0 10px 28px rgba(217,146,25,0.16)',
        'glow-accent': '0 10px 28px rgba(240,174,53,0.14)',
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
