/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891B2',
          light: '#06B6D4',
          dark: '#0E7490',
          50: '#ECFEFF',
          100: '#CFFAFE',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          50: '#ECFDF5',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          50: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          50: '#FFFBEB',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'DM Sans', 'sans-serif'],
        number: ['DM Sans', 'Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
