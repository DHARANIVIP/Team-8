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
        primary:       '#DBEAFE', // Light Blue
        secondary:     '#E0E7FF', // Soft Indigo
        tertiary:      '#CCFBF1', // Mint
        accent:        '#93C5FD', // Sky Blue
        highlight:     '#FED7AA', // Soft Orange
        textGrey:      '#1F2937', // Dark Gray
        buttonPrimary: '#2563EB', // Medium Blue
        bg:            '#FFFFFF', // White
        surface:       '#F8FAFC', // Very Light Gray
        surfaceAlt:    '#F1F8FF',
        border:        '#CBD5E1', // Soft Gray
        borderFocus:   '#2563EB',
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
