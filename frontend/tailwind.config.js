/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Your unique color palette
        'mint': {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#30e8b0', // Primary mint color
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#07363b', // Primary teal color
        },
        'sky': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#6ad1fa', // Primary sky color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#c3a1f8', // Primary purple color
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Semantic colors using your palette - more formal
        primary: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#30e8b0',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#07363b',
        },
        success: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#30e8b0',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#07363b',
        },
        warning: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Dark mode colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'gentle-float': 'gentleFloat 8s ease-in-out infinite',
      },
      keyframes: {
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(5px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-mint': 'linear-gradient(135deg, #30e8b0 0%, #6ad1fa 100%)',
        'gradient-teal': 'linear-gradient(135deg, #07363b 0%, #30e8b0 100%)',
        'gradient-sky': 'linear-gradient(135deg, #6ad1fa 0%, #c3a1f8 100%)',
        'gradient-purple': 'linear-gradient(135deg, #c3a1f8 0%, #30e8b0 100%)',
        'gradient-formal': 'linear-gradient(135deg, #07363b 0%, #0d9488 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        'gradient-dark-card': 'linear-gradient(135deg, #334155 0%, #475569 100%)',
      },
      boxShadow: {
        'mint': '0 4px 14px 0 rgba(48, 232, 176, 0.25)',
        'teal': '0 4px 14px 0 rgba(7, 54, 59, 0.25)',
        'sky': '0 4px 14px 0 rgba(106, 209, 250, 0.25)',
        'purple': '0 4px 14px 0 rgba(195, 161, 248, 0.25)',
        'dark': '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
        'dark-lg': '0 10px 25px 0 rgba(0, 0, 0, 0.4)',
        'subtle': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
