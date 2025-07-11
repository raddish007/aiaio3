#!/bin/bash

# Remotion Lullaby Template Deployment Script
# This script bundles and deploys the Remotion template to AWS Lambda

set -e  # Exit on any error

echo "🚀 Starting Remotion Lullaby Template Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the remotion directory."
    exit 1
fi

# Step 1: Bundle the project
echo "📦 Bundling the project..."
npx remotion bundle src/index.ts

if [ $? -eq 0 ]; then
    echo "✅ Bundle completed successfully"
else
    echo "❌ Bundle failed"
    exit 1
fi

# Step 2: Deploy Lambda functions (if needed)
echo "🔧 Deploying Lambda functions..."
npx remotion lambda functions deploy

if [ $? -eq 0 ]; then
    echo "✅ Lambda functions deployed successfully"
else
    echo "❌ Lambda functions deployment failed"
    exit 1
fi

# Step 3: Deploy the site
echo "🌐 Deploying site..."
npx remotion lambda sites create --site-name=aiaio3-lullaby-template

if [ $? -eq 0 ]; then
    echo "✅ Site deployed successfully"
    echo ""
    echo "🎉 Deployment Complete!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Copy the Serve URL from the output above"
    echo "2. Update your .env.local file with:"
    echo "   REMOTION_SITE_URL=<Serve URL from above>"
    echo "3. Test the deployment in your admin UI"
    echo ""
    echo "🔍 To verify deployment:"
    echo "- Check the Serve URL in your browser"
    echo "- Test video generation in the admin UI"
    echo "- Verify debug mode works correctly"
else
    echo "❌ Site deployment failed"
    exit 1
fi 