import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://barterwave.com';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/discover',
        '/distress',
        '/help',
        '/privacy',
        '/terms',
        '/listings/*',
        '/post/*',
        '/profile/*',
      ],
      disallow: [
        '/admin/',
        '/account/',
        '/settings/',
        '/cart/',
        '/checkout/',
        '/messages/',
        '/offers/',
        '/onboarding/',
        '/auth/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
