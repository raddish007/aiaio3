/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip TypeScript checking during production build for consumer site
    ignoreBuildErrors: false,
  },

  images: {
    domains: [
      'localhost',
      'supabase.co',
      's3.amazonaws.com',
      'etshvxrgbssginmzsczo.supabase.co',
      // Production domains
      'hippopolka.com',
      'app.hippopolka.com',
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Redirect any admin routes to the admin subdomain
      {
        source: '/admin/:path*',
        destination: 'https://admin.hippopolka.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;