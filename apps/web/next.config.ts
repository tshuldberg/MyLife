import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@mylife/ui', '@mylife/module-registry', '@mylife/db', '@mylife/books', '@mylife/fast', '@mylife/subs', '@mylife/entitlements', '@mylife/billing-config', '@mylife/recipes', '@mylife/car', '@mylife/habits', '@mylife/meds', '@mylife/surf', '@mylife/workouts', '@mylife/homes', '@mylife/words'],
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
