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
        bento: {
          bg: '#F4F4F2',
          card: '#FFFFFF',
          cardHover: '#FAFAF8',
          border: '#E7E7E4',
          darkBg: '#0A0A0B',
          darkCard: '#121214',
          darkBorder: '#26262B',
          muted: '#71717A',
          darkMuted: '#A1A1AA',
          text: '#0A0A0A',
          darkText: '#FAFAFA'
        },
        brand: {
          orange: '#FF5A1F',
          orangeDark: '#E84A10',
          neon: '#FF6A2B',
          neonHover: '#FF7E47',
          neonGlow: 'rgba(255, 106, 43, 0.25)',
          softOrange: 'rgba(255, 90, 31, 0.10)',
          darkSoftOrange: 'rgba(255, 106, 43, 0.14)',
          // Backward-compatible aliases mapped to neon orange
          indigo: '#FF5A1F',
          indigoDark: '#E84A10',
          violet: '#FF6A2B',
          emerald: '#10B981',
          rose: '#EF4444',
          amber: '#F59E0B'
        }
      },
      borderRadius: {
        'bento': '20px',
        'bento-sm': '12px',
        'bento-lg': '28px',
      },
      boxShadow: {
        'bento': '0 2px 12px -2px rgba(10, 10, 10, 0.04), 0 1px 3px -1px rgba(10, 10, 10, 0.02)',
        'bento-hover': '0 8px 24px -4px rgba(255, 90, 31, 0.12), 0 2px 8px -2px rgba(10, 10, 10, 0.04)',
        'bento-hero': '0 12px 32px -6px rgba(255, 90, 31, 0.35)',
        'neon-glow': '0 0 25px rgba(255, 106, 43, 0.35)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}

