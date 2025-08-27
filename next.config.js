const withNextIntl = require('next-intl/plugin')(
  // This is the default (also the `src` folder is supported out of the box)
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable webpack build worker to avoid module resolution issues
    webpackBuildWorker: true
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore pdf-parse test files during server build
      config.externals = [...config.externals, {
        'canvas': 'commonjs canvas',
        'fs': 'fs'
      }]
      
      // Configure pdf-parse to not bundle test files
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    // Fix module resolution issues with formatjs
    config.resolve.alias = {
      ...config.resolve.alias,
      '@formatjs/icu-messageformat-parser': require.resolve('@formatjs/icu-messageformat-parser'),
    }
    
    return config
  },
}

module.exports = withNextIntl(nextConfig);
