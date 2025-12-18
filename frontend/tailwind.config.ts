import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'gradient-shift-reverse': 'gradient-shift-reverse 20s ease infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'gradient-shift': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            backgroundSize: '200% 200%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            backgroundSize: '200% 200%',
          },
        },
        'gradient-shift-reverse': {
          '0%, 100%': {
            backgroundPosition: '100% 50%',
            backgroundSize: '250% 250%',
          },
          '50%': {
            backgroundPosition: '0% 50%',
            backgroundSize: '250% 250%',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
