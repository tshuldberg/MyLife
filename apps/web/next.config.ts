import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  env: {
    NEXT_PUBLIC_WORKOUTS_BASE_PATH: '/workouts',
  },
  transpilePackages: ['@mylife/ui', '@mylife/module-registry', '@mylife/db', '@mylife/books', '@mylife/fast', '@mylife/entitlements', '@mylife/billing-config', '@mylife/recipes', '@mylife/car', '@mylife/habits', '@mylife/meds', '@mylife/surf', '@mylife/workouts', '@mylife/homes', '@mylife/words', '@mybooks/shared', '@mybooks/ui', '@mybudget/shared', '@mybudget/ui', '@myrecipes/shared', '@myrecipes/ui', '@myfast/shared', '@myfast/ui', '@mycar/shared', '@mycar/ui'],
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
