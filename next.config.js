/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Remotion dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    };

    // Handle video files
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/videos/',
          outputPath: 'static/videos/',
        },
      },
    });

    // Note: Admin files are blocked via rewrites below
    // TypeScript errors are skipped for production builds

    return config;
  },

  typescript: {
    // Skip TypeScript checking during production build
    ignoreBuildErrors: process.env.DEPLOY_TARGET === 'public',
  },

  images: {
    domains: [
      'localhost',
      'supabase.co',
      's3.amazonaws.com',
      'etshvxrgbssginmzsczo.supabase.co',
      'remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com',
    ],
  },

  async rewrites() {
    // Block admin routes in production deployments
    if (process.env.VERCEL_ENV === 'production' || process.env.DEPLOY_TARGET === 'public') {
      return [
        {
          source: '/admin/:path*',
          destination: '/404'
        },
        {
          source: '/api/admin/:path*',
          destination: '/api/not-found'
        }
      ];
    }
    return [];
  }
};

module.exports = nextConfig;