import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict HTTPS mode
  poweredByHeader: false,
  compress: true,

  // Configure security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=self, geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob:;
              font-src 'self';
              object-src 'none';
              media-src 'self' blob:;
              connect-src 'self' ${process.env.NEXT_PUBLIC_AI_SERVICE_URL || ''} wss:;
              worker-src 'self' blob:;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },

  // Configure allowed domains for images and other assets
  images: {
    domains: ['localhost'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Restrict API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'x-api-key'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
