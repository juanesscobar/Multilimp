/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#3B82F6',
          700: '#1D4ED8',
          800: '#1E3A8A',
          900: '#1E2D6B',
        },
        surface: {
          bg:     '#F0F4FF',
          card:   '#FFFFFF',
          border: '#E2E8F8',
        },
        text: {
          primary:   '#1E293B',
          secondary: '#64748B',
          muted:     '#94A3B8',
        },
        status: {
          success:  '#16A34A',
          warning:  '#D97706',
          danger:   '#DC2626',
          info:     '#2563EB',
        },
      },
    },
  },
  plugins: [],
}
