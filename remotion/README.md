# Remotion Video Generation Setup

This directory contains the Remotion configuration for generating personalized videos for the AIAIO platform.

## 🎬 Compositions

### 1. NameVideo
- **Purpose**: Personalized name learning videos
- **Duration**: 4 minutes (240 frames at 60fps)
- **Props**: `childName`, `theme`, `age`
- **Features**: Letter-by-letter animation, educational content

### 2. BedtimeSong
- **Purpose**: Personalized bedtime song videos
- **Duration**: 3 minutes (180 frames at 60fps)
- **Props**: `childName`, `theme`, `age`
- **Features**: Multiple verses, theme-based decorations

### 3. LetterHunt
- **Purpose**: Educational letter recognition games
- **Duration**: 2 minutes (120 frames at 60fps)
- **Props**: `childName`, `letter`, `theme`, `age`
- **Features**: Interactive letter grid, highlighting target letter

### 4. EpisodeSegment
- **Purpose**: Personalized episode segments
- **Duration**: 5 minutes (300 frames at 60fps)
- **Props**: `childName`, `segmentType`, `theme`, `age`, `segmentTitle`
- **Features**: Multiple segment types, dynamic content

## 🚀 Usage

### Local Development

1. **Install dependencies**:
   ```bash
   cd remotion
   npm install
   ```

2. **Preview compositions**:
   ```bash
   npm run preview
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

### AWS Lambda Deployment

1. **Deploy Lambda functions**:
   ```bash
   npm run remotion:lambda
   ```

2. **Configure environment variables**:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_VIDEO_BUCKET`
   - `AWS_LAMBDA_REMOTION_FUNCTION`

## 🎨 Themes

All compositions support multiple themes:

- **halloween**: Dark background with orange/gold accents
- **space**: Dark blue background with stars and space elements
- **ocean**: Blue background with sea creatures
- **jungle**: Green background with jungle animals
- **general**: Light blue background (default)

## 🔧 API Integration

### Generate Video
```bash
POST /api/videos/generate
{
  "compositionId": "NameVideo",
  "childName": "Nolan",
  "theme": "halloween",
  "age": 3,
  "letter": "N", // for LetterHunt
  "segmentType": "personalized", // for EpisodeSegment
  "segmentTitle": "Nolan's Special Time", // for EpisodeSegment
  "userId": "user-uuid"
}
```

### Webhook (for Lambda completion)
```bash
POST /api/videos/webhook
{
  "assetId": "asset-uuid",
  "status": "completed",
  "outputUrl": "https://s3.amazonaws.com/bucket/video.mp4"
}
```

## 📁 File Structure

```
remotion/
├── src/
│   ├── Root.tsx              # Main composition registry
│   └── compositions/
│       ├── NameVideo.tsx     # Name learning video
│       ├── BedtimeSong.tsx   # Bedtime song video
│       ├── LetterHunt.tsx    # Letter recognition game
│       └── EpisodeSegment.tsx # Episode segments
├── remotion.config.js        # Lambda configuration
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🛠️ Development

### Adding New Compositions

1. Create a new composition file in `src/compositions/`
2. Export the component with proper TypeScript interfaces
3. Add the composition to `src/Root.tsx`
4. Update `remotion.config.js` to include the new composition
5. Test locally with `npm run preview`

### Customizing Themes

1. Add new theme colors to the `getThemeColors()` function
2. Add theme-specific decorations and elements
3. Update the theme validation in the API endpoint

## 🔍 Testing

Run the test script to verify the setup:

```bash
node scripts/test-remotion.js
```

This will check:
- ✅ Dependencies are installed
- ✅ All composition files exist
- ✅ Configuration is correct
- ✅ Preview command works

## 📋 Next Steps

1. **AWS Setup**: Configure Lambda functions and S3 buckets
2. **Testing**: Test video generation via API endpoints
3. **Production**: Deploy to production environment
4. **Monitoring**: Set up logging and error tracking
5. **Optimization**: Optimize rendering performance and costs 