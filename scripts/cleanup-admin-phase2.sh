#!/bin/bash

echo "🧹 Phase 2: Removing remaining admin API and debug files"
echo "========================================================"

# Remove admin-specific API endpoints
echo "📡 Removing admin API files..."
admin_api_dirs=(
    "pages/api/assets"
    "pages/api/prompts"
    "pages/api/wish-button"
    "pages/api/debug"
    "pages/api/s3"
    "pages/api/videos"
)

for dir in "${admin_api_dirs[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "✅ Removed $dir directory"
    fi
done

# Remove specific admin API files
admin_api_files=(
    "pages/api/upload-video-url.ts"
    "pages/api/not-found.js"
)

for file in "${admin_api_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "✅ Removed $file"
    fi
done

# Clean up any remaining admin-related files
echo "🧽 Removing remaining admin files..."
find . -name "*admin*" -type f -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    rm "$file"
    echo "✅ Removed $file"
done

# Remove backup and temporary files
echo "🗑️ Removing backup and temporary files..."
find . -name "*.backup" -type f -not -path "./node_modules/*" | while read file; do
    rm "$file"
    echo "✅ Removed $file"
done

find . -name "*.old.*" -type f -not -path "./node_modules/*" | while read file; do
    rm "$file"
    echo "✅ Removed $file"
done

# Remove any leftover subdomain config files
echo "🔧 Removing subdomain config files..."
if [ -f "next.config.subdomain.js" ]; then
    rm "next.config.subdomain.js"
    echo "✅ Removed next.config.subdomain.js"
fi

if [ -f "middleware.consumer.ts" ]; then
    rm "middleware.consumer.ts"
    echo "✅ Removed middleware.consumer.ts"
fi

echo ""
echo "✅ Phase 2 cleanup complete!"
echo ""
echo "📋 Summary:"
echo "- Removed all admin API endpoints"
echo "- Removed debug and testing files"
echo "- Removed backup files"
echo "- Repository is now consumer-focused only"
