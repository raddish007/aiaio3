#!/bin/bash

echo "🧹 Cleaning up aiaio3 repository - Removing admin functionality"
echo "=============================================================="

# Remove admin pages
echo "📁 Removing admin pages..."
if [ -d "pages/admin" ]; then
    rm -rf pages/admin
    echo "✅ Removed pages/admin directory"
fi

# Remove admin API routes
echo "📡 Removing admin API routes..."
if [ -d "pages/api/admin" ]; then
    rm -rf pages/api/admin
    echo "✅ Removed pages/api/admin directory"
fi

# Remove admin-specific API endpoints
echo "🔧 Removing admin-specific API files..."
admin_api_files=(
    "pages/api/videos/upload-general.ts"
    "pages/api/videos/upload-asset.ts"
    "pages/api/ai/generate-image.ts"
    "pages/api/ai/generate-audio.ts"
    "pages/api/ai/prompts.ts"
    "pages/api/assets/approve.ts"
    "pages/api/assets/upload.ts"
    "pages/api/content/generate.ts"
    "pages/api/content/approve.ts"
)

for file in "${admin_api_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "✅ Removed $file"
    fi
done

# Remove admin components
echo "🎨 Removing admin components..."
admin_components=(
    "components/AdminHeader.tsx"
    "components/AdminLayout.tsx"
    "components/AssetUpload.tsx"
    "components/VideoUpload.tsx"
    "components/AssetManager.tsx"
    "components/ContentManager.tsx"
)

for component in "${admin_components[@]}"; do
    if [ -f "$component" ]; then
        rm "$component"
        echo "✅ Removed $component"
    fi
done

# Remove admin-specific utility files
echo "⚙️ Removing admin utilities..."
if [ -d "lib/admin" ]; then
    rm -rf lib/admin
    echo "✅ Removed lib/admin directory"
fi

# Remove admin scripts
echo "📜 Removing admin scripts..."
admin_scripts=(
    "scripts/create-admin.js"
    "scripts/make-admin.js"
    "scripts/verify-admin.js"
    "scripts/debug-admin-query.js"
    "scripts/approve-specific-asset.js"
    "scripts/clear-job-queue.js"
    "scripts/migrate-fal-images-to-supabase.js"
    "scripts/add-duration-to-existing-assets.js"
    "scripts/check-*.js"
    "scripts/test-*.js"
    "scripts/debug-*.js"
)

for script in "${admin_scripts[@]}"; do
    if [ -f "$script" ]; then
        rm "$script"
        echo "✅ Removed $script"
    elif ls $script 1> /dev/null 2>&1; then
        rm $script
        echo "✅ Removed $script"
    fi
done

# Remove admin documentation
echo "📚 Removing admin documentation..."
admin_docs=(
    "ADMIN_*.md"
    "ASSETS_*.md"
    "ACCOUNT_MANAGEMENT_*.md"
    "COMPLETE_VIDEO_APPROVAL_WORKFLOW.md"
    "CHILD_PROFILE_FIELDS_COMPLETE.md"
    "CHILD_VIDEO_PLAYER_README.md"
    "CHILDRENS_VIDEO_README.md"
    "BACKGROUND_*.md"
    "AUTO_MIGRATION_GUIDE.md"
    "MIGRATION_GUIDE.md"
    "CLOUD_MIGRATION_CHECKLIST.md"
    "CLOUDFRONT_SETUP_GUIDE.md"
    "DEPLOYMENT_COMPLETE.md"
    "REMOTION_TEMPLATE_GUIDE.md"
)

for doc in "${admin_docs[@]}"; do
    if ls $doc 1> /dev/null 2>&1; then
        rm $doc
        echo "✅ Removed $doc"
    fi
done

# Remove admin SQL files
echo "🗄️ Removing admin SQL files..."
if ls *.sql 1> /dev/null 2>&1; then
    rm *.sql
    echo "✅ Removed SQL files"
fi

# Remove admin test/debug files
echo "🧪 Removing admin test files..."
admin_test_files=(
    "test-*.js"
    "check-*.js"
    "debug-*.js"
    "fresh-deployment-verification.js"
    "setup-cloudfront-cdn.js"
    "deploy-wish-button-lambda.sh"
)

for file in "${admin_test_files[@]}"; do
    if ls $file 1> /dev/null 2>&1; then
        rm $file
        echo "✅ Removed $file"
    fi
done

# Remove remotion directory (admin-only functionality)
echo "🎬 Removing Remotion directory..."
if [ -d "remotion" ]; then
    rm -rf remotion
    echo "✅ Removed remotion directory"
fi

# Remove admin-specific backup files
echo "🗂️ Removing admin backup files..."
if [ -d "backups" ]; then
    rm -rf backups
    echo "✅ Removed backups directory"
fi

# Remove debug pages
echo "🐛 Removing debug pages..."
debug_pages=(
    "pages/debug-role.tsx"
    "pages/test-*.tsx"
)

for page in "${debug_pages[@]}"; do
    if ls $page 1> /dev/null 2>&1; then
        rm $page
        echo "✅ Removed $page"
    fi
done

echo ""
echo "✅ Admin cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update package.json to remove admin-specific dependencies"
echo "2. Update next.config.js to remove admin routing"
echo "3. Create consumer-focused environment variables"
echo "4. Test the build to ensure no admin dependencies remain"
