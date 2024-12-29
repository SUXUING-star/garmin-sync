/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      appDir: true
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*'
        }
      ]
    }
  }
  
  module.exports = nextConfig