export const theme = {
  colors: {
    background: {
      primary: '#0A0E1A',
      secondary: '#141B2D',
      elevated: '#1E2A3F',
      hover: '#253347',
    },
    border: {
      default: '#2D3B52',
      focus: '#3B82F6',
      success: '#10B981',
      error: '#EF4444',
    },
    brand: {
      red: {
        from: '#DC2626',
        to: '#EF4444',
      },
      blue: {
        from: '#3B82F6',
        to: '#60A5FA',
      },
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      tertiary: '#64748B',
      muted: '#475569',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
}

export type Theme = typeof theme