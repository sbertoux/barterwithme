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
          50: '#fdf6ee',
          100: '#fae8d0',
          200: '#f5d0a0',
          300: '#efb268',
          400: '#e8903a',
          500: '#e3731c',
          600: '#d45a12',
          700: '#b04211',
          800: '#8c3515',
          900: '#712e14',
          950: '#3d1507',
        },
        earth: {
          50: '#f6f3ee',
          100: '#e8e0d0',
          200: '#d2c2a2',
          300: '#b89f6e',
          400: '#a48548',
          500: '#906e35',
          600: '#795a2c',
          700: '#604527',
          800: '#503a24',
          900: '#443221',
          950: '#251910',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
