/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:        '#ff9e42',
        accentSoft:    '#ff9757',
        textPrimary:   '#cccccc',
        textSecondary: '#bbbbbb',
        textMuted:     '#aaaaaa',
        bg:            '#0d0d0d',
        surface:       '#111111',
        surfaceAlt:    '#1a1a1a',
        border:        '#1f1f1f',
        borderFocus:   '#2a2a2a',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        pill: '999px',
      },
      boxShadow: {
        accent: '0 0 14px rgba(255,158,66,0.18)',
        card:   '0 2px 12px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}
