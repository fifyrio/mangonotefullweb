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
        // Mango AI Note Brand Colors (based on color-system.md)
        'mango': {
          'primary': '#FFD84D',      // Primary Yellow (Logo Mango, Accent Circle)
          'icon': '#FFB800',         // Icon Yellow (Voice to Text)
          'secondary': '#E78822',    // Orange Accent (students & creators)
          'accent': {
            'pdf': '#F8A136',        // Icon Orange (PDF Processing)
            'mindmap': '#F8A94C',    // Icon Yellow-Orange (AI Mind Maps)
            'mobile': '#F47E2C',     // Icon Orange-Red (iPhone Native)
          },
          // Extended palette for better gradations
          '50': '#FFFDF6',           // Background gradient end
          '100': '#FFF8E1', 
          '200': '#FFF3C4',
          '300': '#FFEC9E',
          '400': '#FFE066',
          '500': '#FFD84D',          // Primary brand color
          '600': '#FFB800',          // Icon yellow
          '700': '#E78822',          // Orange accent
          '800': '#D17017',
          '900': '#B8590C',
        },
        // Semantic UI Colors
        'surface': {
          'primary': '#FFFFFF',       // Pure white background
          'secondary': '#FFFDF6',     // Light cream (gradient end)
          'tertiary': '#F9F7F0',      // Slightly warmer white
          'elevated': '#FFFFFF',      // Cards and elevated elements
        },
        'text': {
          'primary': '#1A1F2C',       // Dark Text (Main Heading)
          'secondary': '#4C5464',     // Light Gray (Body Text)
          'muted': '#6B7280',         // Muted text
          'inverse': '#FFFFFF',       // White text on dark backgrounds
        },
        'border': {
          'light': '#E5E7EB',         // Light borders
          'medium': '#D1D5DB',        // Medium borders
          'focus': '#FFD84D',         // Focus state borders (mango primary)
        },
        // Functional Colors
        'success': '#10B981',
        'warning': '#F59E0B', 
        'error': '#EF4444',
        'info': '#3B82F6',
        // Dark theme support (for components that need it)
        'dark': {
          'primary': '#1A1F2C',       // Using the dark text color as dark bg
          'secondary': '#2D3748',
          'tertiary': '#4A5568',
          'surface': '#2D3748',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Mango AI Note gradients
        'gradient-mango': 'linear-gradient(135deg, #FFD84D 0%, #E78822 100%)',
        'gradient-mango-soft': 'linear-gradient(135deg, #FFF8E1 0%, #FFFDF6 100%)',
        'gradient-surface': 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF6 100%)',
        'gradient-card': 'linear-gradient(145deg, #FFFFFF 0%, #F9F7F0 100%)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
