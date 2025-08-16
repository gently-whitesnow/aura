import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('daisyui')
  ],
  daisyui: {
    themes: ['lofi', 'dark'],
  },
} satisfies Config


