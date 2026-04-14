import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT:  'var(--brand-primary)',
          light:    'var(--brand-primary-light)',
          dark:     'var(--brand-primary-dark)',
          accent:   'var(--brand-accent)',
        },
        teal:  { DEFAULT: '#0F6E56', light: '#E1F5EE', dark: '#04342C' },
        amber: { DEFAULT: '#BA7517', light: '#FAEEDA', dark: '#412402' },
        danger:{ DEFAULT: '#A32D2D', light: '#FCEBEB', dark: '#501313' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}

export default config
