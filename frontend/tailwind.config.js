/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--gf-bg) / <alpha-value>)',
        bg2: 'rgb(var(--gf-bg2) / <alpha-value>)',
        card: 'rgb(var(--gf-card) / <alpha-value>)',
        line: 'rgb(var(--gf-line) / 0.14)',
        cyan: {
          DEFAULT: 'rgb(var(--gf-cyan) / <alpha-value>)',
          dim: 'rgb(var(--gf-cyan-dim) / <alpha-value>)',
        },
        violet: { DEFAULT: 'rgb(var(--gf-violet) / <alpha-value>)' },
        pos: 'rgb(var(--gf-pos) / <alpha-value>)',
        neg: 'rgb(var(--gf-neg) / <alpha-value>)',
        neutral: 'rgb(var(--gf-neutral) / <alpha-value>)',
        ink: 'rgb(var(--gf-ink) / <alpha-value>)',
        up: 'rgb(var(--gf-up) / <alpha-value>)',
        down: 'rgb(var(--gf-down) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: { card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.6)' },
      keyframes: { shimmer: { '100%': { transform: 'translateX(100%)' } } },
      animation: { shimmer: 'shimmer 1.6s infinite' },
    },
  },
  plugins: [],
}
