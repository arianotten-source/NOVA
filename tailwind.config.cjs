/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./frontend/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        nova: {
          black: '#0a0a0f',
          dark: '#12121a',
          panel: '#1a1a26',
          border: '#2a2a3a',
          blue: '#00d4ff',
          cyan: '#00fff5',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 212, 255, 0.15)',
        'neon-strong': '0 0 30px rgba(0, 212, 255, 0.3)',
      },
      spacing: {
        'nav-bottom': '4.5rem',
      },
    },
  },
  plugins: [],
};
