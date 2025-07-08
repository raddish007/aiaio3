/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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
    
    return config;
  },
  images: {
    domains: [
      'localhost',
      'supabase.co',
      's3.amazonaws.com',
      'your-supabase-project.supabase.co',
    ],
  },
};

module.exports = nextConfig; 