import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MangoNote dark theme colors
        'dark': {
          'primary': '#121212',
          'secondary': '#1A1A1A', 
          'tertiary': '#2C2C2C',
          'surface': '#333333',
        },
        'mango': {
          '50': '#fffbeb',
          '100': '#fef3c7',
          '200': '#fde68a',
          '300': '#fcd34d',
          '400': '#fbbf24',
          '500': '#FFC300', // Primary mango
          '600': '#d97706',
          '700': '#b45309',
          '800': '#92400e',
          '900': '#78350f',
        },
        'orange': {
          '400': '#FFA500', // Secondary mango
          '500': '#FF8C00',
          '600': '#FF7F00',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
