import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e0f12',
        panel: '#15171c',
        accent: '#22c55e',
        accent2: '#84cc16',
      },
      fontFamily: {
        mc: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
