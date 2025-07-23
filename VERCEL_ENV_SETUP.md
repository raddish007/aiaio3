# Vercel Environment Variables Configuration

## Production Environment Variables

Add these in your Vercel Dashboard → Project → Settings → Environment Variables:

### Domain Configuration
```
NEXT_PUBLIC_APP_URL=https://app.hippopolka.com
NEXT_PUBLIC_ADMIN_URL=https://admin.hippopolka.com  
NEXT_PUBLIC_MAIN_URL=https://hippopolka.com
DEPLOY_TARGET=production
```

### Existing Environment Variables
Copy all your existing environment variables from `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://etshvxrgbssginmzsczo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_VIDEO_BUCKET=aiaio3-public-videos
AWS_S3_ASSET_BUCKET=aiaio-assets

# CloudFront
CLOUDFRONT_DISTRIBUTION_DOMAIN=d7lpoub47y3dp.cloudfront.net
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d7lpoub47y3dp.cloudfront.net

# AI Services
OPENAI_API_KEY=your_openai_key
FAL_AI_API_KEY=your_fal_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Remotion
REMOTION_SITE_URL=your_remotion_site_url
AWS_LAMBDA_REMOTION_FUNCTION=aiaio-remotion-render
```

## Important Notes:

1. **Set Environment**: Production
2. **Apply to**: All environments (or just Production if you prefer)
3. **Don't include**: NEXTAUTH_URL (Vercel sets this automatically)
