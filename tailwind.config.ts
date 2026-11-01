import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        halloween: {
          orange: '#FF6B1A',
          pumpkin: '#FF8C00',
          purple: '#6B2D8E',
          deepPurple: '#3D1452',
          black: '#0A0A0A',
          mist: '#1A0A2E',
          ghost: '#E8E0F0',
        },
        upsideDown: {
          darkBlue: '#0A1929',
          blue: '#0D2A4A',
          grey: '#3A4555',
          fog: '#1A2535',
          danger: '#FF3333',
          ash: '#5A5A6A',
        },
      },
      fontFamily: {
        creepy: ['var(--font-creepy)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'flicker': 'flicker 3s linear infinite',
        'shake': 'shake 0.3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,107,26,0.4)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,26,0.8)', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '48%': { opacity: '1' },
          '49%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '51%': { opacity: '0.3' },
          '52%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
