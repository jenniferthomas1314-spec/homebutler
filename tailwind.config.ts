import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        dark:    '#1a1a18',
        gold:    { DEFAULT: '#c9a84c', light: '#e8d5a3' },
        green:   { DEFAULT: '#2d5a3d', light: '#e8f0eb' },
        red:     { DEFAULT: '#8b3a3a', light: '#f5e8e8' },
        amber:   { DEFAULT: '#a0620a', light: '#fdf0dc' },
        blue:    { DEFAULT: '#1a3a5c', light: '#e8f0f8' },
        purple:  { DEFAULT: '#4a2a6a', light: '#f0e8f8' },
        teal:    { DEFAULT: '#1a5a52', light: '#e0f4f2' },
        muted:   '#9a9488',
        border:  '#ece8e0',
        surface: '#ffffff',
        bg:      '#faf7f2',
      },
      borderRadius: {
        card: '13px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        modal: '0 8px 32px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
export default config
