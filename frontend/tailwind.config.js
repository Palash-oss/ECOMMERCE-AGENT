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
          bg: '#EEF0FA',
          card: '#FFFFFF',
          cardHover: '#FAFAFF',
          darkBg: '#0B0F19',
          darkCard: '#131927',
          darkBorder: '#1E293B',
          muted: '#64748B',
          text: '#0F172A',
          darkText: '#F8FAFC'
        },
        brand: {
          indigo: '#4F46E5',
          indigoDark: '#4338CA',
          violet: '#7C3AED',
          orange: '#F97316',
          emerald: '#10B981',
          rose: '#EF4444'
        }
      },
      borderRadius: {
        'bento': '24px',
        'bento-sm': '16px',
        'bento-lg': '32px',
      },
      boxShadow: {
        'bento': '0 4px 20px -2px rgba(17, 24, 39, 0.05), 0 2px 6px -1px rgba(17, 24, 39, 0.02)',
        'bento-hover': '0 10px 30px -4px rgba(17, 24, 39, 0.08), 0 4px 10px -2px rgba(17, 24, 39, 0.04)',
        'bento-hero': '0 12px 35px -5px rgba(79, 70, 229, 0.35)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
