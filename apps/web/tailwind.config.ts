/**
 * File Description:
 * Tailwind CSS theme and content scanning configuration.
 *
 * Purpose:
 * Define design tokens and source paths for utility generation across web and shared UI package.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#3659f3',
          700: '#2039c9'
        }
      }
    }
  },
  plugins: []
};

export default config;
