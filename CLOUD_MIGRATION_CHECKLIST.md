# 🚀 Cloud Migration Checklist

## ✅ Pre-Migration (Complete these first)

- [ ] **Supabase Login**: Run `supabase login` and complete browser authentication
- [ ] **Create Cloud Project**: Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create new project
- [ ] **Get Project Credentials**: Copy Project URL and API keys from Settings → API

## 🔧 Migration Steps

- [ ] **Run Migration Script**: `node scripts/migrate-to-cloud.js`
- [ ] **Link Project**: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] **Push Schema**: `supabase db push`
- [ ] **Update Environment**: Replace local URLs with cloud URLs in `.env.local`
- [ ] **Create Storage Buckets**: assets, videos, temp
- [ ] **Test Connection**: `npm run db:generate`

## 🎬 Video Generation Setup

- [ ] **Test Asset Creation**: `node scripts/test-asset-generation.js`
- [ ] **Test Video API**: Try the `/api/videos/generate` endpoint
- [ ] **Configure Lambda**: Set up AWS Lambda function for video rendering
- [ ] **Test End-to-End**: Generate a complete video

## 📊 Post-Migration

- [ ] **Monitor Usage**: Check Supabase dashboard for metrics
- [ ] **Backup Data**: Ensure regular backups are configured
- [ ] **Update Documentation**: Update any deployment docs
- [ ] **Team Access**: Grant team members access to cloud project

## 🚨 If Something Goes Wrong

- [ ] **Check Logs**: `supabase logs`
- [ ] **Verify Credentials**: Double-check environment variables
- [ ] **Test Connection**: Try connecting via Supabase Studio
- [ ] **Rollback Plan**: Keep local backup for emergency rollback

---

**Need Help?** See `MIGRATION_GUIDE.md` for detailed instructions. 