#!/bin/bash

# Build and deploy script for Letter Hunt Remotion template

echo "🎬 Building Letter Hunt Remotion Template..."

# Change to remotion directory
cd /Users/carlaeng/Documents/aiaio3/remotion

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Bundle the Remotion project
echo "📦 Bundling Remotion project..."
npm run build

# Deploy to AWS Lambda (if configured)
if [ ! -z "$AWS_LAMBDA_REMOTION_FUNCTION" ]; then
  echo "🚀 Deploying to AWS Lambda..."
  npm run deploy
else
  echo "⚠️  AWS_LAMBDA_REMOTION_FUNCTION not set, skipping deployment"
fi

echo "✅ Letter Hunt template build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the template locally: npm run preview"
echo "2. Configure AWS Lambda environment variables"
echo "3. Deploy to production Lambda function"
echo "4. Test video generation through /api/videos/generate-letter-hunt"
