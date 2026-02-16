const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  },
  images: {
    domains: [
      'ui-avatars.com',
      'images.unsplash.com',
      'placehold.co',
      'api.dicebear.com',
      'localhost',
      'res.cloudinary.com',
      'cloudinary.com',
      'unhappy-marijo-barterwave-f6a20928.koyeb.app',
      ...(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
        ? [new URL(process.env.NEXT_PUBLIC_API_URL).hostname]
        : [])
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://unhappy-marijo-barterwave-f6a20928.koyeb.app'
      : 'http://localhost:3333';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: '/private-uploads/:path*',
        destination: `${backendUrl}/private-uploads/:path*`,
      },
    ];
  },
}

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "barterwave",
    project: "javascript-nextjs",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: false,
    automaticVercelMonitors: true,
  }
);




