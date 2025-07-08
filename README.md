# AIAIO Platform - Admin Asset Management

## 🎉 CSS Issue Resolution

### The Problem
The admin asset management page was experiencing severe CSS issues where:
- Tailwind CSS classes weren't being applied
- Asset images weren't sizing correctly
- Modals weren't overlaying properly
- Layout spacing was inconsistent
- All CSS changes appeared to be ignored

### Root Cause
**Missing `postcss.config.js` file** - This is absolutely critical for Tailwind CSS to work with Next.js.

### The Fix
Created `postcss.config.js` in the project root:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Why This Happened
- Tailwind CSS requires PostCSS to process and generate actual CSS from utility classes
- Next.js looks for `postcss.config.js` to know how to process CSS files
- Without this file, Tailwind classes remain as text in HTML but don't generate any styles
- This explains why CSS changes weren't being applied - they weren't being processed at all!

### Required Dependencies
Make sure these are installed:
```bash
npm install tailwindcss postcss autoprefixer
```

### Complete Tailwind Setup Checklist
1. ✅ `tailwind.config.js` - Configured with content paths
2. ✅ `postcss.config.js` - **CRITICAL** - Was missing, now added
3. ✅ `styles/globals.css` - Contains Tailwind directives
4. ✅ `pages/_app.tsx` - Imports global CSS
5. ✅ Dependencies installed (tailwindcss, postcss, autoprefixer)

### How to Verify Tailwind is Working
Add a test div with obvious classes:
```jsx
<div className="bg-red-500 text-white p-4 text-center font-bold">
  TAILWIND TEST - If you see this in red, Tailwind is working
</div>
```

### Common Symptoms of Missing PostCSS Config
- Tailwind classes in HTML but no styles applied
- CSS changes not taking effect
- Layout completely broken
- Inconsistent styling
- Fast Refresh warnings about CSS

### Prevention
Always ensure `postcss.config.js` exists when setting up Tailwind CSS with Next.js. This is a common oversight that can cause hours of debugging!

---

## Project Overview

AIAIO is a personalized video content platform for children, featuring:
- Parent registration and child profiles
- Admin workflows for content management
- Asset approval and review system
- Video generation pipeline
- Personalized content delivery

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage, AWS S3
- **Video**: Remotion (AWS Lambda)
- **AI**: OpenAI, FAL.ai (Imagen)
- **Voice**: ElevenLabs

## Admin Features
- **Asset Management**: Upload, review, and approve content assets
- **Content Creation**: Generate personalized videos with AI-powered asset generation
- **Job Monitoring**: Track video generation progress
- **Analytics**: View platform usage and performance

## 🎯 Asset Generation System

The platform includes a complete asset generation system that creates images and audio content for video production.

### Features

- **AI-Powered Image Generation**: Uses fal.ai (Imagen) for high-quality, child-friendly images
- **Smart Prompt Generation**: OpenAI GPT-4 generates contextual prompts for different asset types
- **Project-Based Workflow**: Organize assets by content projects with themes and age targeting
- **Batch Processing**: Generate multiple assets simultaneously for a project
- **Review System**: Approve/reject generated assets with detailed feedback
- **Status Tracking**: Real-time status updates (pending → generating → completed)

### Asset Types

- **Background Images**: Scenes and environments
- **Character Images**: Friendly, animated characters  
- **Props & Objects**: Items and elements
- **Voiceover Scripts**: Narrative content (placeholder for TTS integration)
- **Background Music**: Mood and style (placeholder for music generation)

### Quick Start

1. **Create a Content Project**:
   - Go to Admin → Content Creation
   - Create a new project with theme, target age, and duration
   - Click "Generate All Assets" to create asset records

2. **Generate Assets**:
   - Assets are automatically queued for generation
   - Monitor status in the Asset Management dashboard
   - Individual assets can be regenerated if needed

3. **Review & Approve**:
   - Review generated assets in the Asset Management page
   - Approve or reject with feedback
   - Approved assets are ready for video assembly

### API Endpoints

- `POST /api/assets/generate` - Generate assets by ID or project ID
- Supports individual asset generation or batch project generation

### Testing

Run the asset generation test:
```bash
node scripts/test-asset-generation.js
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

4. Access admin panel at `/admin`

## Key Files
- `pages/admin/assets.tsx` - Asset management interface
- `pages/admin/index.tsx` - Admin dashboard
- `lib/supabase.ts` - Database client
- `styles/globals.css` - Global styles and Tailwind imports

## Troubleshooting

### CSS Not Working?
1. Check if `postcss.config.js` exists
2. Verify Tailwind dependencies are installed
3. Clear `.next` cache: `rm -rf .next`
4. Restart development server

### Database Issues?
- Check Supabase connection
- Verify RLS policies
- Check environment variables

### Build Issues?
- Clear cache: `rm -rf .next node_modules && npm install`
- Check for TypeScript errors
- Verify all imports are correct 