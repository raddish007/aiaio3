# Remotion Template Deployment Guide

This guide covers how to build and deploy Remotion video templates to AWS Lambda for production use.

## 🚀 Quick Deploy Commands

### 1. Build the Project
```bash
cd remotion
npx remotion bundle src/index.ts
```

### 2. Create New Site (Recommended)
```bash
npx remotion lambda sites create --site-name=aiaio3-name-video-template-v8
```

### 3. Get Serve URL
The Serve URL will be displayed after site creation:
```
https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-name-video-template-v8/index.html
```

### 4. Update Environment Variables
Add the Serve URL to your `.env.local` file:
```
REMOTION_SITE_URL=https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-name-video-template-v8/index.html
```

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- Remotion CLI installed: `npm install -g @remotion/cli`
- AWS credentials configured in environment

## 🔧 Development Commands

### Local Preview
```bash
npm run preview
```
Access at: http://localhost:3005

### List Available Compositions
```bash
npx remotion compositions src/index.ts
```

### Render Locally (for testing)
```bash
# Render Nolan (5 letters)
npx remotion render src/index.ts NameVideo-Nolan nolan-test.mp4

# Render Lorelei (8 letters)
npx remotion render src/index.ts NameVideo-Lorelei lorelei-test.mp4

# Render Christopher (11 letters)
npx remotion render src/index.ts NameVideo-Christopher christopher-test.mp4

# Render simplified version
npx remotion render src/index.ts NameVideoSimple test-simple.mp4
```

### Bundle for Web Deployment
```bash
npx remotion bundle src/index.ts
```

## 🏗️ Project Structure

```
remotion/
├── src/
│   ├── index.ts              # Main entry point
│   ├── Root.tsx              # Root component with all compositions
│   └── compositions/
│       ├── NameVideo.tsx     # Full name learning template (complex)
│       ├── NameVideoSimple.tsx # Simplified name learning template
│       ├── Lullaby.tsx       # Lullaby template
│       ├── TemplateVideo.tsx # Generic template
│       └── ...               # Other compositions
├── package.json
├── remotion.config.js        # Lambda configuration
├── tsconfig.json            # TypeScript configuration
└── README.md
```

## 🎬 Available Compositions

### Name Video Templates
- **NameVideo-Nolan**: 5 letters, 28 seconds (7 segments × 4 seconds)
- **NameVideo-Lorelei**: 8 letters, 40 seconds (10 segments × 4 seconds)
- **NameVideo-Christopher**: 11 letters, 52 seconds (13 segments × 4 seconds)
- **NameVideoSimple**: Simplified version for testing

### Other Templates
- **Lullaby**: Bedtime lullaby videos with slideshow
- **TemplateVideo**: Generic template system
- **UniversalTemplate**: Flexible template system
- **SimpleTemplate**: Basic template
- **HelloWorld**: Development/testing template

## 🔄 Complete Deployment Workflow

### Step 1: Make Code Changes
Edit your template files in `src/compositions/`

### Step 2: Test Locally
```bash
# Start preview server
npm run preview

# Test specific compositions
npx remotion render src/index.ts NameVideoSimple test-local.mp4
```

### Step 3: Build the Project
```bash
npx remotion bundle src/index.ts
```

### Step 4: Create New Site
```bash
npx remotion lambda sites create --site-name=aiaio3-name-video-template-v8
```

### Step 5: Update Environment Variables
Update your `.env.local` with the new Serve URL displayed in Step 4:
```
REMOTION_SITE_URL=https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-name-video-template-v8/index.html
```

### Step 6: Verify Deployment
Test a video generation to ensure the new template is working.

## 🛠️ Lambda Configuration

The Lambda function is configured with:
- **Region**: us-east-1
- **Memory**: 2048MB
- **Disk Size**: 2048MB
- **Timeout**: 120 seconds
- **Version**: 4.0.322

## 🔍 Debug Mode

Templates can include debug functionality:
- Set `debugMode: true` in template props
- Shows overlays with timing and asset information
- Useful for development and troubleshooting

## 📝 Template Development

### Adding New Templates
1. Create new composition file in `src/compositions/`
2. Export the component with proper props interface
3. Add to `src/Root.tsx` with Composition wrapper
4. Build and deploy

### Template Props Example
```typescript
export interface TemplateProps {
  childName: string;
  theme: string;
  age: number;
  backgroundMusicUrl?: string;
  debugMode?: boolean;
}
```

## 🚨 Troubleshooting

### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Verify all imports are correct
# Ensure all dependencies are installed
```

### Deployment Errors
- Verify AWS credentials are configured
- Check Lambda function permissions
- Ensure region matches configuration
- **Use site creation instead of function deployment** for reliable updates

### Runtime Errors
- Check CloudWatch logs for Lambda function
- Verify template props are correct
- Test locally before deploying
- **Ensure `REMOTION_SITE_URL` is set correctly** in `.env.local`

### Common Issues
- **"Already exists" error**: Use site creation instead of function deployment
- **Template not updating**: Create a new site with a different name
- **Fatal errors at 3.33%**: Usually indicates template code issues or asset format problems

## 📊 Monitoring

### View Lambda Logs
```bash
npx remotion lambda functions ls
```

### Check Function Status
```bash
npx remotion lambda functions ls
```

### Monitor CloudWatch
- Logs are retained for 14 days
- Lambda Insights enabled for performance monitoring

## 🔧 Advanced Configuration

### Custom Lambda Settings
Edit `remotion.config.js`:
```javascript
module.exports = {
  entryPoint: "src/index.ts",
  compositions: ["NameVideo", "Lullaby"],
  region: "us-east-1",
  memorySize: 2048,
  timeoutInSeconds: 120,
};
```

### Environment Variables
Set in your deployment environment:
- `AWS_REGION`: Lambda region
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

## 📚 Additional Resources

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Lambda Deployment Guide](https://www.remotion.dev/docs/lambda)
- [Template Development](https://www.remotion.dev/docs/templates)

## 🎯 Quick Reference Commands

```bash
# Development
npm run preview                    # Start local preview
npx remotion compositions src/index.ts  # List compositions
npx remotion render src/index.ts NameVideoSimple test.mp4  # Local render

# Deployment
npx remotion bundle src/index.ts   # Build project
npx remotion lambda sites create --site-name=aiaio3-name-video-template-v8  # Deploy
npx remotion lambda functions ls   # Check functions

# Testing
curl -I https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/RENDER_ID/out.mp4  # Check render status
```

---

**Note**: Always build the project before deploying to ensure your latest changes are included in the Lambda function. 