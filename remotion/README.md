# Remotion Lullaby Template - Deployment Guide

This guide covers how to deploy the Remotion lullaby video template to AWS Lambda for production use.

## 🚀 Quick Deploy Commands

### 1. Bundle the Project
```bash
cd remotion
npx remotion bundle src/index.ts
```

### 2. Deploy Lambda Functions (if not already deployed)
```bash
npx remotion lambda functions deploy
```

### 3. Deploy the Site
```bash
npx remotion lambda sites create --site-name=aiaio3-lullaby-template
```

### 4. Update Environment Variables
Add the Serve URL to your `.env.local` file:
```
REMOTION_SITE_URL=https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-lullaby-template/index.html
```

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- Remotion CLI installed globally: `npm install -g @remotion/cli`

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
npx remotion render src/index.ts Lullaby output.mp4
```

## 🏗️ Project Structure

```
remotion/
├── src/
│   ├── index.ts              # Main entry point
│   ├── Root.tsx              # Root component
│   └── compositions/
│       ├── Lullaby.tsx       # Main lullaby template
│       ├── LullabyFresh.tsx  # Alternative template
│       └── ...               # Other compositions
├── package.json
└── README.md
```

## 🎬 Available Compositions

- **Lullaby**: Main template with slideshow, personalized audio, and debug mode
- **LullabyFresh**: Alternative template with different styling
- **HelloWorld**: Basic test composition
- **TemplateVideo**: Generic template

## 🔍 Debug Mode

The Lullaby template includes comprehensive debug functionality:

### Features
- **Debug Overlays**: Show timing, asset status, and configuration info
- **Console Logging**: Detailed debug information in console
- **Timestamp Display**: Current time overlay
- **Asset Status**: Visual indicators for images, audio, and music

### Usage
Set `debugMode: true` in the payload to enable debug features:
```json
{
  "debugMode": true,
  "childName": "Nolan",
  "childTheme": "halloween",
  // ... other parameters
}
```

### Debug Information Displayed
- Child details (name, age, theme)
- Timing information (intro, outro, slideshow)
- Asset status (images, audio, music)
- Font sizing calculations
- Slideshow image counts and usage

## 🎯 Template Features

### Lullaby Template
- **3-Part Structure**: Intro (9s), Slideshow (variable), Outro (5s)
- **Personalized Audio**: Intro and outro audio based on child name
- **Slideshow**: Ken Burns effects with crossfade transitions
- **Theme-Based Assets**: Images filtered by child theme and safe zones
- **Dynamic Text Sizing**: Responsive font sizing for different name lengths
- **Background Music**: DreamDrip audio with volume control

### Timing
- **Intro**: 0-5s title display, 5-9s intro audio
- **Slideshow**: 5 seconds per image with 1s crossfade
- **Outro**: Starts 1 second early for smooth transition

## 🔄 Redeployment

When making changes to the template:

1. **Update the code** in `src/compositions/Lullaby.tsx`
2. **Bundle the project**:
   ```bash
   npx remotion bundle src/index.ts
   ```
3. **Redeploy the site**:
   ```bash
   npx remotion lambda sites create --site-name=aiaio3-lullaby-template
   ```
4. **Update the Serve URL** in your `.env.local` if it changes

## 🐛 Troubleshooting

### Common Issues

**Port conflicts during preview:**
- The preview server uses port 3005 by default
- If occupied, it will try other ports automatically

**Bundle errors:**
- Ensure you're using `src/index.ts` as the entry point
- Clear cache if needed: `rm -rf build/`

**Lambda deployment issues:**
- Check AWS credentials and permissions
- Verify region settings (default: us-east-1)

### Lambda Configuration
- **Memory**: 2048MB
- **Disk size**: 2048MB
- **Timeout**: 120 seconds
- **Region**: us-east-1

## 📊 Monitoring

### View Lambda Logs
```bash
npx remotion lambda functions logs
```

### List Deployed Functions
```bash
npx remotion lambda functions list
```

## 🔗 Integration

The deployed template integrates with:
- **Next.js Admin UI**: For video generation requests
- **Supabase**: For asset management and user data
- **AWS Lambda**: For video rendering
- **Personalized Content**: Based on child name and theme

## 📝 Environment Variables

Required in `.env.local`:
```
REMOTION_SITE_URL=https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-lullaby-template/index.html
```

## 🎉 Success Indicators

After deployment:
- ✅ Bundle completes without errors
- ✅ Lambda functions deploy successfully
- ✅ Site URL is accessible
- ✅ Admin UI can generate videos
- ✅ Debug mode works correctly
- ✅ Clean video output (no debug overlays when disabled)

---

**Last Updated**: January 2025  
**Version**: 4.0.322  
**Template**: Lullaby with Debug Mode Support 