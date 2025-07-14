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
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('DEPLOY_TARGET:', process.env.DEPLOY_TARGET);
    
    // Block admin routes ONLY for public deployments
    if (process.env.DEPLOY_TARGET === 'public') {
      console.log('BLOCKING ADMIN ROUTES FOR PUBLIC DEPLOYMENT');
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
    console.log('NOT BLOCKING ADMIN ROUTES');
    return [];
  }
};

module.exports = nextConfig;