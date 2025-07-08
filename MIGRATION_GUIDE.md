# Supabase Cloud Migration Guide

This guide will help you migrate from local Supabase to cloud Supabase for video generation support.

## 🚀 Why Migrate to Cloud?

- **Asset Storage**: Videos require cloud-based assets (images, audio) accessible by AWS Lambda
- **Scalability**: Cloud storage can handle large video files and high traffic
- **Production Ready**: Cloud setup is required for production deployment
- **Collaboration**: Team members can access the same data

## 📋 Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Already installed (version 1.100.0)
3. **AWS Credentials**: Already configured in `.env.local`

## 🔧 Step-by-Step Migration

### 1. Login to Supabase CLI

```bash
supabase login
```

Follow the browser prompt to authenticate.

### 2. Create Cloud Project

```bash
supabase projects create aiaio-platform --org-id YOUR_ORG_ID
```

Replace `YOUR_ORG_ID` with your organization ID (found in Supabase dashboard).

### 3. Link Local Project to Cloud

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your project reference ID.

### 4. Push Database Schema

```bash
supabase db push
```

This will apply all your local migrations to the cloud database.

### 5. Update Environment Variables

Update your `.env.local` file with cloud credentials:

```env
# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_cloud_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_cloud_service_role_key

# Keep existing AWS and other configurations
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
# ... other variables
```

### 6. Configure Storage Buckets

In the Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Create buckets:
   - `assets` - for images, audio files
   - `videos` - for generated videos
   - `temp` - for temporary files

3. Set bucket policies (public read, authenticated write)

### 7. Test the Migration

```bash
# Test database connection
npm run db:generate

# Test asset creation
node scripts/test-asset-generation.js
```

## 🔄 Migration Scripts

### Backup Local Data (Optional)

```bash
# Export local data
supabase db dump --data-only > local_data_backup.sql

# Export schema
supabase db dump --schema-only > local_schema_backup.sql
```

### Restore to Cloud (If Needed)

```bash
# Restore schema
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < local_schema_backup.sql

# Restore data
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < local_data_backup.sql
```

## 🎬 Video Generation Setup

### 1. Update Asset Storage

The video generation API will now store assets in cloud storage:

```typescript
// Example: Upload image to cloud storage
const { data, error } = await supabase.storage
  .from('assets')
  .upload(`images/${assetId}.jpg`, imageFile);
```

### 2. Configure Lambda Access

Ensure your AWS Lambda functions can access Supabase:

```typescript
// In your Lambda function
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### 3. Test Video Generation

```bash
# Test video generation API
curl -X POST http://localhost:3000/api/videos/generate \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "NameVideo",
    "childName": "Nolan",
    "theme": "halloween",
    "age": 3,
    "userId": "test-user-id"
  }'
```

## 🔍 Verification Checklist

- [ ] Supabase CLI logged in
- [ ] Cloud project created and linked
- [ ] Database schema pushed to cloud
- [ ] Environment variables updated
- [ ] Storage buckets configured
- [ ] Asset creation working
- [ ] Video generation API responding
- [ ] Lambda functions can access cloud assets

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**: Check environment variables and project reference
2. **Permission Errors**: Verify service role key has proper permissions
3. **Storage Errors**: Ensure buckets exist and policies are set correctly
4. **Migration Errors**: Check for schema conflicts

### Debug Commands

```bash
# Check project status
supabase status

# View logs
supabase logs

# Reset local project (if needed)
supabase db reset
```

## 📊 Post-Migration

### Monitor Performance

- Check Supabase dashboard for usage metrics
- Monitor Lambda function execution times
- Track storage usage and costs

### Optimize

- Implement asset caching strategies
- Optimize video file sizes
- Set up automated backups

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Storage API Documentation](https://supabase.com/docs/guides/storage)
- [Database Migration Guide](https://supabase.com/docs/guides/database/migrations) 