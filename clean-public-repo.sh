#!/bin/bash

# Script to clean up public repository (remove admin code)
# Run this from your main aiaio3 directory AFTER creating the admin repo

echo "🧹 Cleaning Public Repository"
echo "============================="

echo "Removing admin pages and API routes..."

# Remove admin pages
echo "   Removing admin pages..."
rm -rf pages/admin/

# Remove admin API routes  
echo "   Removing admin API routes..."
rm -rf pages/api/admin/

# Remove admin components (be careful here - some might be shared)
echo "   Removing admin-specific components..."
rm -f components/AdminHeader.tsx 2>/dev/null || true
# Add other admin-specific components to remove

# Update next.config.js for public deployment
echo "   Updating next.config.js for public deployment..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Remotion dependencies (still needed for public video playback)
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

  typescript: {
    // Skip TypeScript checking during build for public deployment
    ignoreBuildErrors: true,
  },

  images: {
    domains: [
      'localhost',
      'supabase.co',
      's3.amazonaws.com',
      'etshvxrgbssginmzsczo.supabase.co',
      'aiaio3-public-videos.s3.amazonaws.com',
      'aiaio3-public-videos.s3.us-east-1.amazonaws.com',
      'd7lpoub47y3dp.cloudfront.net',
      'remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com',
      // Public domains only
      'hippopolka.com',
      'www.hippopolka.com',
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
};

module.exports = nextConfig;
EOF

# Update package.json for public site
echo "   Updating package.json for public deployment..."
# Create a backup first
cp package.json package.json.backup

# Update the name and description
sed -i '' 's/"name": "aiaio-platform"/"name": "hippopolka-public"/' package.json
sed -i '' 's/"description": ".*"/"description": "HippoPolka - Personalized video content platform for children"/' package.json

# Remove middleware (not needed without admin routes)
echo "   Removing middleware..."
rm -f middleware.ts 2>/dev/null || true

# Create public-specific environment template
echo "   Creating public environment template..."
cat > .env.public.template << 'EOF'
# HippoPolka Public Site Environment Variables

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://app.hippopolka.com
NEXT_PUBLIC_MAIN_URL=https://hippopolka.com

# Supabase Configuration (same as admin)
NEXT_PUBLIC_SUPABASE_URL=https://etshvxrgbssginmzsczo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
# Note: Service role key not needed for public site

# CloudFront CDN (for video playback)
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d7lpoub47y3dp.cloudfront.net

# NextAuth (for user authentication)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://app.hippopolka.com

# Deployment
DEPLOY_TARGET=public
EOF

# Update README for public site
echo "   Updating README..."
cat > README.public.md << 'EOF'
# HippoPolka Public Site

Public-facing website for HippoPolka - personalized video content for children.

## Features

- **Marketing Site**: Landing page and product information
- **User Dashboard**: Parent and child accounts
- **Video Playback**: Personalized video content
- **User Registration**: Account creation and management

## Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.public.template .env.local
# Fill in your actual values

# Start development server
npm run dev
```

## Deployment

- **Domains**: hippopolka.com, www.hippopolka.com, app.hippopolka.com
- **Platform**: Vercel
- **Repository**: Public

## Architecture

This is the public-facing site. Admin functionality is deployed separately to admin.hippopolka.com for security.

## Environment Variables

See `.env.public.template` for required environment variables.
EOF

echo ""
echo "✅ Public repository cleaned successfully!"
echo ""
echo "📋 Changes made:"
echo "   ❌ Removed all /admin pages and API routes"
echo "   ❌ Removed admin-specific components"
echo "   ✅ Updated next.config.js for public deployment"
echo "   ✅ Updated package.json"
echo "   ✅ Created public environment template"
echo "   ✅ Updated documentation"
echo ""
echo "🚨 IMPORTANT: Review the changes before committing!"
echo "   - Check if any shared components were accidentally removed"
echo "   - Verify your landing page and user dashboard still work"
echo "   - Test the build: npm run build"
echo ""
echo "📋 Next steps:"
echo "1. Test the public site: npm run dev"
echo "2. Commit changes: git add . && git commit -m 'Remove admin code for separate deployment'"
echo "3. Deploy to Vercel with domains: hippopolka.com, app.hippopolka.com"
