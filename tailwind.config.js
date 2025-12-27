/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT: Set to 'media' to use system preference, or remove to disable dark mode
  darkMode: 'media',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary Colors - BazaarX Brand
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Secondary Colors
        secondary: {
          indigo: '#4F46E5',
          purple: '#7C3AED',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#059669',
          bg: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
        info: {
          DEFAULT: '#0284C7',
          bg: '#F0F9FF',
        },
        // Dark Mode Colors
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          'surface-light': '#334155',
          text: '#F8FAFC',
          'text-secondary': '#94A3B8',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
};
