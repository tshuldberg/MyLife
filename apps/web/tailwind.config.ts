import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../MyWorkouts/apps/web/app/**/*.{ts,tsx}',
    '../../MyWorkouts/apps/web/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
