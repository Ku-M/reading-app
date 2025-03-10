/** @type {import('tailwindcss').Config} */
const { heroui } = require("@heroui/react");

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#ebf1ff',
          200: '#d6e4ff',
          300: '#b3ccff',
          400: '#809fff',
          500: '#4d73ff',
          600: '#1a46ff',
          700: '#0033ff',
          800: '#0029cc',
          900: '#001f99',
        },
        dark: {
          100: '#1a1a1a',
          200: '#2d2d2d',
          300: '#404040',
          400: '#525252',
          500: '#666666',
          600: '#7a7a7a',
          700: '#8c8c8c',
          800: '#a1a1a1',
          900: '#b3b3b3',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
        serif: ['var(--font-serif)', 'Georgia'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: theme('colors.primary.600'),
              },
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.100'),
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: theme('colors.primary.300'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    heroui()
  ],
} 