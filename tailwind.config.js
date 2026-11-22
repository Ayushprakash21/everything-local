/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Everything Local Approved Brand Design System Tokens
        brand: {
          primary: '#0B1F3A',   // Primary Navy
          navy: '#0B1F3A',
          accent: '#FFB21A',    // Accent Amber
          amber: '#FFB21A',
          success: '#00B982',   // Success Green
          green: '#00B982',
          surface: '#F5F7FA',   // Light Background / Surface
          text: '#64748B',      // Secondary Text
          dark: '#081426',      // Dark Mode / Background
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#00b982',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#0B1F3A',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#00b982',
          600: '#16a34a',
          700: '#15803d',
          800: '#065f46',
          900: '#0B1F3A',
          950: '#022c22',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFB21A',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#FFB21A',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 12px -2px rgba(11, 31, 58, 0.06), 0 2px 6px -1px rgba(11, 31, 58, 0.04)',
        'float': '0 12px 30px -4px rgba(11, 31, 58, 0.15), 0 4px 12px -2px rgba(11, 31, 58, 0.08)',
      }
    },
  },
  plugins: [],
}
