/**
 * EveryBazaar Design Tokens System
 * Unified design system for EveryBazaar hyperlocal commerce & marketplace platform
 * Brand Tagline: "Shop more. Save more. Live better."
 */

export const tokens = {
  colors: {
    brand: {
      navy: '#0B1F3B',         // Primary Navy - headers, navigation, dark backgrounds
      primary: '#0B1F3B',
      orange: '#F5B82E',       // Accent Orange - primary buttons, highlights, badges
      accent: '#F5B82E',
      orangeHover: '#E0A31D',
      green: '#10B981',        // Success Green - completed states, fresh accents
      success: '#10B981',
      surface: '#F3F4F6',      // Cards and page backgrounds
      textGrey: '#6B7280',     // Secondary text
      dark: '#071529',         // Deep navy surface
      white: '#FFFFFF'
    },
    accent: {
      orange: '#F5B82E',
      navy: '#0B1F3B',
      green: '#10B981',
      purple: '#7C3AED',       // Services App
      blue: '#0284C7',         // Delivery Partner App
      forest: '#047857'
    },
    surface: {
      background: '#F3F4F6',
      card: '#FFFFFF',
      subtle: '#F9FAFB',
      muted: '#E5E7EB',
      navy: '#0B1F3B'
    },
    text: {
      primary: '#0B1F3B',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      inverse: '#FFFFFF',
      accent: '#F5B82E'
    },
    border: {
      light: '#F3F4F6',
      default: '#E5E7EB',
      brand: '#F5B82E',
      navy: '#0B1F3B',
      focus: '#F5B82E'
    },
    status: {
      success: '#10B981',
      successBg: '#ECFDF5',
      warning: '#F59E0B',
      warningBg: '#FFFBEB',
      error: '#EF4444',
      errorBg: '#FEF2F2',
      info: '#3B82F6',
      infoBg: '#EFF6FF'
    }
  },

  typography: {
    fontFamily: 'Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: 'Manrope, Inter, sans-serif',
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem'  // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },

  spacing: {
    gutterMobile: '1rem',    // 16px
    gutterTablet: '1.5rem',  // 24px
    gutterDesktop: '2rem',   // 32px
    sectionY: '2.5rem'       // 40px
  },

  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.25rem',// 20px
    '3xl': '1.5rem', // 24px
    full: '9999px'
  },

  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    float: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
  },

  containers: {
    maxWidth: '1280px', // max-w-7xl
    gutter: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  },

  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },

  zIndex: {
    dropdown: 30,
    sticky: 40,
    modal: 50,
    toast: 60
  }
} as const;
