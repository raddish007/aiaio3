#!/bin/bash

# Deploy Wish Button Remotion Lambda
# This script deploys the Remotion site with the WishButton composition to AWS Lambda

echo "🚀 Starting Wish Button Remotion Lambda Deployment"
echo "=================================================="

# Change to remotion directory
cd remotion

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building Remotion bundle..."
npm run build

echo "☁️ Deploying Lambda functions..."
npm run deploy

echo "🌐 Deploying Remotion site..."
npx remotion lambda sites create src/index.ts --site-name=wish-button-site-$(date +%s)

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Copy the site URL from the output above"
echo "2. Update REMOTION_SITE_URL in .env.local"
echo "3. Test video generation in the admin panel"
echo ""
echo "🎬 Your Wish Button videos are ready to render!"
