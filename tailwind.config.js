/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Purple Scale based on style guide
        primary: {
          50: '#F9F7FF',
          100: '#F3F0FF',
          200: '#E9E2FF',
          300: '#D6C7FF',
          400: '#C8A2C8',
          500: '#9966CC',
          600: '#7851A9', // Main brand color
          700: '#6B46C1',
          800: '#553C9A',
          900: '#44337A',
        },
        // Status Colors
        success: '#48BB78',
        warning: '#ED8936',
        error: '#F56565',
        info: '#4299E1',
        // Accent Colors
        orange: '#FF6B35',
        teal: '#38B2AC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.4' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['28px', { lineHeight: '1.4' }],
        '4xl': ['36px', { lineHeight: '1.3' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem', // 72px for collapsed sidebar
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1200px',
      '2xl': '1400px',
    },
  },
  plugins: [],
}