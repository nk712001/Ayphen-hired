/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/camera/:path*',
        destination: 'http://localhost:8001/api/camera/:path*',
      },
      {
        source: '/api/speech/:path*',
        destination: 'http://localhost:8001/api/speech/:path*',
      },
      {
        source: '/api/questions/:path*',
        destination: 'http://localhost:8001/api/questions/:path*',
      },
    ]
  },
}

module.exports = nextConfig