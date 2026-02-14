const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  },
  images: {
    'ui-avatars.com',
    'images.unsplash.com',
    'placehold.co',
    'api.dicebear.com',
    'localhost',
    ...(process.env.NEXT_PUBLIC_API_URL
      ? [new URL(process.env.NEXT_PUBLIC_API_URL).hostname]
      : [])
    ],
  },
eslint: {
  ignoreDuringBuilds: true,
  },
typescript: {
  ignoreBuildErrors: true,
  },
devIndicators: {
  buildActivity: false,
    appIsrStatus: false,
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




