const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cloudinary.com' },
      { protocol: 'https', hostname: 'images.barterwave.com' },
      { protocol: 'https', hostname: 'api.barterwave.com' },
      ...(process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
        ? [{ protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_API_URL).hostname }]
        : []),
    ],
  },
  typescript: {
    // TypeScript errors should fail the build — don't ship broken code
    ignoreBuildErrors: false,
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.barterwave.com'
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
      // Private uploads are now served through the authenticated API endpoint:
      // GET /api/uploads/private/:filename (requires moderator+ role)
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




