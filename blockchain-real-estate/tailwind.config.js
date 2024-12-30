/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#212E53",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#4A919E",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#CE6A6B",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "#BED3C3",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.range-slider::-webkit-slider-thumb': {
          '-webkit-appearance': 'none',
          'appearance': 'none',
          '@apply h-5 w-5 rounded-full border-2 border-primary bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2': {}
        },
        '.range-slider::-moz-range-thumb': {
          '@apply h-5 w-5 rounded-full border-2 border-primary bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2': {}
        },
      }
      addUtilities(newUtilities)
    }
  ]
}
