/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  },
  images: {
    domains: [
      'ui-avatars.com',
      'images.unsplash.com',
      'placehold.co',
      'localhost',  // for local development
      // Automatically add production API hostname from env var
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

module.exports = nextConfig




