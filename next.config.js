/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return config
  },
}

module.exports = nextConfig
