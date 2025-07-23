# HippoPolka Subdomain Deployment Guide

## Overview
This guide covers deploying your Next.js application with subdomain support for:
- `hippopolka.com` - Marketing/sales site
- `admin.hippopolka.com` - Admin dashboard  
- `app.hippopolka.com` - Parent/kids application

## Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Configure Vercel Project
```bash
# In your project directory
vercel login
vercel --prod
```

#### 3. Configure Custom Domains in Vercel Dashboard
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domains:
   - `hippopolka.com`
   - `admin.hippopolka.com`
   - `app.hippopolka.com`

#### 4. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_APP_URL=https://app.hippopolka.com
NEXT_PUBLIC_ADMIN_URL=https://admin.hippopolka.com
NEXT_PUBLIC_MAIN_URL=https://hippopolka.com
DEPLOY_TARGET=production
```
(Plus all your existing environment variables)

### Option 2: Netlify

#### 1. Build Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "https://admin.hippopolka.com/*"
  to = "https://your-netlify-url.netlify.app/admin/:splat"
  status = 200
  force = true

[[redirects]]
  from = "https://app.hippopolka.com/*"
  to = "https://your-netlify-url.netlify.app/:splat"
  status = 200
  force = true
```

### Option 3: AWS (Advanced)

#### Using CloudFront + ALB for subdomain routing
1. Deploy to EC2/ECS/Lambda
2. Configure Application Load Balancer with host-based routing
3. Set up CloudFront distributions for each subdomain
4. Configure Route 53 for DNS management

## DNS Configuration

### With Your Domain Provider
Set up these DNS records:

```
Type    Name     Value                              TTL
A       @        <your-deployment-ip>              300
CNAME   admin    <your-deployment-url>             300  
CNAME   app      <your-deployment-url>             300
CNAME   www      hippopolka.com                    300
```

### Example for Vercel:
```
Type    Name     Value                              TTL
CNAME   @        cname.vercel-dns.com              300
CNAME   admin    cname.vercel-dns.com              300
CNAME   app      cname.vercel-dns.com              300
CNAME   www      hippopolka.com                    300
```

## Environment Configuration

### 1. Production Environment
Copy `.env.production.template` to `.env.production` and update with your values.

### 2. Staging Environment
For testing, you can use subdomains like:
- `staging.hippopolka.com`
- `admin-staging.hippopolka.com`
- `app-staging.hippopolka.com`

## Testing Subdomain Setup

### 1. Local Testing
Add to your `/etc/hosts` file:
```
127.0.0.1 admin.hippopolka.local
127.0.0.1 app.hippopolka.local
127.0.0.1 hippopolka.local
```

Then test with:
```bash
npm run dev
```

Visit:
- `http://admin.hippopolka.local:3000` → Should redirect to admin
- `http://app.hippopolka.local:3000` → Should redirect to dashboard
- `http://hippopolka.local:3000` → Should show marketing site

### 2. Production Testing
After deployment, test each subdomain:
```bash
curl -I https://admin.hippopolka.com
curl -I https://app.hippopolka.com
curl -I https://hippopolka.com
```

## Security Considerations

### 1. SSL Certificates
Ensure SSL certificates cover all subdomains:
- Most hosting providers handle this automatically
- For manual setup, use wildcard certificates: `*.hippopolka.com`

### 2. CORS Configuration
Update your CORS settings to allow cross-subdomain requests if needed.

### 3. Cookie Domain Settings
For shared authentication across subdomains:
```javascript
// Set cookies for parent domain
document.cookie = "token=value; domain=.hippopolka.com; secure; samesite=strict";
```

## Monitoring & Analytics

### 1. Separate Analytics
Consider separate Google Analytics properties for:
- Marketing site (`hippopolka.com`)
- App usage (`app.hippopolka.com`)
- Admin usage (`admin.hippopolka.com`)

### 2. Error Monitoring
Configure error tracking with subdomain context in services like Sentry.

## Troubleshooting

### Common Issues

1. **Subdomain not working**
   - Check DNS propagation: `dig admin.hippopolka.com`
   - Verify hosting provider domain configuration
   - Check middleware logs

2. **Admin routes blocked**
   - Verify `DEPLOY_TARGET` environment variable
   - Check middleware configuration
   - Review Next.js rewrites

3. **CORS errors between subdomains**
   - Update API CORS settings
   - Check cookie domain configuration
   - Verify authentication token sharing

### Debug Commands
```bash
# Check DNS resolution
nslookup admin.hippopolka.com
nslookup app.hippopolka.com

# Test subdomain response
curl -H "Host: admin.hippopolka.com" http://your-ip/
curl -H "Host: app.hippopolka.com" http://your-ip/
```

## Next Steps

1. Choose your deployment platform
2. Configure DNS records
3. Set up hosting/deployment
4. Test all subdomains
5. Configure monitoring
6. Set up CI/CD pipeline for future deployments

## Support

For deployment-specific issues:
- **Vercel**: Check Vercel docs and support
- **Netlify**: Check Netlify docs and support  
- **AWS**: Check AWS documentation

For application-specific issues:
- Check middleware logs
- Verify environment variables
- Test routing logic locally
