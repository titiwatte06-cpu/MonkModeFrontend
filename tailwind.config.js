import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Oswald', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#0b0b0b',
          900: '#111111',
          800: '#1b1b1b',
        },
        amber: {
          400: '#B08D57',
          50: '#f9f2e7',
        },
      },
      boxShadow: {
        soft: '0 10px 35px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
