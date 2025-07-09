# Remotion Template Development Guide

## 🎬 Overview

This guide covers the current state, best practices, and development patterns for Remotion video templates in the AIAIO platform. The system uses Remotion to generate personalized videos for children with dynamic content, themes, and asset integration.

## 📁 Current Architecture

### Template Structure
```
remotion/
├── src/
│   ├── Root.tsx                    # Main composition registry
│   ├── index.ts                    # Entry point
│   └── compositions/
│       ├── TemplateVideo.tsx       # Main template system
│       ├── UniversalTemplate.tsx   # Flexible template system
│       ├── SimpleTemplate.tsx      # Basic template
│       ├── LullabyFresh.tsx        # Lullaby-specific template
│       ├── NameVideo.tsx           # Name learning videos
│       ├── BedtimeSong.tsx         # Bedtime song videos
│       ├── LetterHunt.tsx          # Letter recognition games
│       ├── EpisodeSegment.tsx      # Episode segments
│       └── HelloWorld*.tsx         # Development/testing templates
├── remotion.config.js              # Lambda configuration
└── package.json                    # Dependencies
```

### Database Schema
- **`video_templates`**: Template definitions with structure and requirements
- **`video_generation_jobs`**: Job tracking for video generation
- **`assets`**: Audio, image, and video assets with metadata
- **`template_asset_assignments`**: Asset assignments to templates

## 🏗️ Template Development Patterns

### 1. Template Types

#### A. Fixed Templates (Legacy)
- **Purpose**: Specific video types with hardcoded logic
- **Examples**: `NameVideo`, `BedtimeSong`, `LetterHunt`
- **Pros**: Simple, predictable, fast development
- **Cons**: Inflexible, hard to modify, limited reusability

#### B. Dynamic Templates (Current)
- **Purpose**: Configurable templates with database-driven structure
- **Examples**: `TemplateVideo`, `UniversalTemplate`
- **Pros**: Flexible, reusable, database-driven
- **Cons**: More complex, requires careful asset management

### 2. Template Structure Pattern

```typescript
interface VideoTemplate {
  id: string;
  name: string;
  template_type: string;
  global_elements: GlobalElement[];  // Assets used throughout video
  parts: VideoPart[];                // Sequential video segments
}

interface VideoPart {
  id: string;
  name: string;
  type: 'intro' | 'slideshow' | 'outro' | 'custom';
  order: number;
  duration: number;                  // Duration in seconds
  audio_elements: AudioElement[];
  image_elements: ImageElement[];
}

interface GlobalElement {
  id: string;
  type: 'audio' | 'image';
  asset_purpose: string;             // e.g., 'background_music', 'intro_audio'
  description: string;
  required: boolean;
  asset_type: 'class' | 'specific';  // Class-based or specific asset
  asset_class?: string;              // e.g., 'lullaby_music', 'bedtime_images'
  specific_asset_id?: string;        // Direct asset reference
}
```

### 3. Asset Management Patterns

#### Asset Classification
```typescript
// Asset purposes for different template types
const ASSET_PURPOSES = {
  lullaby: [
    'background_music',
    'intro_audio', 
    'intro_background',
    'slideshow_images',
    'outro_audio',
    'outro_background'
  ],
  'name-video': [
    'intro_audio',
    'letter_images',
    'background_music',
    'outro_audio'
  ],
  'letter-hunt': [
    'intro_audio',
    'letter_grid_images',
    'background_music',
    'outro_audio'
  ]
};
```

#### Safe Zones for Images
```typescript
type SafeZone = 
  | 'left_safe'      // Left 40% of screen
  | 'right_safe'     // Right 40% of screen  
  | 'center_safe'    // Center 60% of screen
  | 'intro_safe'     // Center 80% of screen
  | 'outro_safe'     // Center 80% of screen
  | 'all_ok';        // Full screen
```

## 🎨 Theme System

### Color Schemes
```typescript
const getThemeColors = (templateType: string) => {
  switch (templateType) {
    case 'lullaby':
      return {
        background: '#1a1a2e',    // Dark blue
        primary: '#FF6B35',       // Orange
        secondary: '#FFD700',     // Gold
        text: '#FFFFFF',          // White
        accent: '#FF4500'         // Red-orange
      };
    case 'name-video':
      return {
        background: '#87CEEB',    // Sky blue
        primary: '#2E8B57',       // Sea green
        secondary: '#4169E1',     // Royal blue
        text: '#000000',          // Black
        accent: '#FF4500'         // Red-orange
      };
    // ... more themes
  }
};
```

### Theme Integration
- **Background Colors**: Applied to main containers
- **Text Colors**: Applied to all text elements
- **Accent Colors**: Used for highlights and animations
- **Image Overlays**: Applied to maintain consistency

## ⚡ Performance Best Practices

### 1. Frame Calculation
```typescript
// Calculate timing for each part
const partTimings = template.parts.reduce((acc, part, index) => {
  const startFrame = acc.length > 0 ? acc[acc.length - 1].endFrame : 0;
  const endFrame = startFrame + (part.duration * fps);
  return [...acc, { ...part, startFrame, endFrame, frameIndex: index }];
}, []);

// Find current part based on frame
const currentPart = partTimings.find(part => 
  frame >= part.startFrame && frame < part.endFrame
);
```

### 2. Asset Loading
```typescript
// Pre-calculate asset URLs to avoid runtime lookups
const getPartAssets = () => {
  const partAssets = { audio: [], images: [] };
  
  // Add global assets
  template.global_elements
    .filter(el => el.type === 'audio')
    .forEach(el => {
      if (el.asset_type === 'specific' && assets[el.specific_asset_id]) {
        partAssets.audio.push({
          id: el.id,
          url: assets[el.specific_asset_id].file_url,
          purpose: el.asset_purpose
        });
      }
    });
    
  return partAssets;
};
```

### 3. Conditional Rendering
```typescript
// Only render elements for current part
const renderCurrentPart = () => {
  if (!currentPart) return null;
  
  const partFrame = frame - currentPart.startFrame;
  const partProgress = partFrame / (currentPart.duration * fps);
  
  return (
    <div>
      {/* Render only current part elements */}
      {currentPart.image_elements.map(element => {
        const asset = assets[element.asset_id];
        if (!asset) return null;
        
        return (
          <img
            key={element.id}
            src={asset.file_url}
            style={{
              position: 'absolute',
              left: element.x || 0,
              top: element.y || 0,
              width: element.width || 'auto',
              height: element.height || 'auto',
              opacity: element.opacity || 1
            }}
          />
        );
      })}
    </div>
  );
};
```

## 🔧 Development Workflow

### 1. Creating a New Template

#### Step 1: Define Template Structure
```typescript
// In database or admin interface
const newTemplate = {
  name: "Educational Story",
  template_type: "educational",
  global_elements: [
    {
      id: "bg_music",
      type: "audio",
      asset_purpose: "background_music",
      description: "Calm background music",
      required: true,
      asset_type: "class",
      asset_class: "educational_music"
    }
  ],
  parts: [
    {
      id: "intro",
      name: "Introduction",
      type: "intro",
      order: 1,
      duration: 5,
      audio_elements: [
        {
          id: "intro_voice",
          asset_purpose: "intro_audio",
          description: "Introduction narration",
          required: true,
          asset_type: "specific"
        }
      ],
      image_elements: [
        {
          id: "intro_bg",
          asset_purpose: "intro_background",
          description: "Introduction background",
          safe_zone: "center_safe",
          required: true,
          asset_type: "specific"
        }
      ]
    }
  ]
};
```

#### Step 2: Create Remotion Composition
```typescript
// In remotion/src/compositions/NewTemplate.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface NewTemplateProps {
  childName: string;
  template: VideoTemplate;
  assets: { [key: string]: Asset };
}

export const NewTemplate: React.FC<NewTemplateProps> = ({
  childName,
  template,
  assets
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Implement template logic here
  return (
    <AbsoluteFill>
      {/* Template content */}
    </AbsoluteFill>
  );
};
```

#### Step 3: Register in Root.tsx
```typescript
// In remotion/src/Root.tsx
<Composition
  id="NewTemplate"
  component={NewTemplate}
  durationInFrames={600} // 10 minutes at 60fps
  fps={60}
  width={1920}
  height={1080}
  defaultProps={{
    childName: 'Nolan',
    template: defaultTemplate,
    assets: {}
  }}
/>
```

### 2. Asset Assignment Workflow

#### Step 1: Upload Assets
- Use admin interface to upload audio/images
- Tag assets with appropriate classes and purposes
- Set safe zones for images

#### Step 2: Assign to Templates
- Use template management interface
- Assign specific assets or asset classes
- Validate asset requirements

#### Step 3: Generate Video
- Select template and child
- System validates asset availability
- Submit to video generation queue

### 3. Testing Templates

#### Local Development
```bash
cd remotion
npm run preview
```

#### Test with Sample Data
```typescript
// Create test data
const testTemplate = {
  // ... template structure
};

const testAssets = {
  // ... asset mappings
};

// Test in Remotion preview
```

## 🚀 Deployment & Production

### AWS Lambda Configuration
```javascript
// remotion.config.js
module.exports = {
  config: {
    region: 'us-east-1',
    functionName: 'aiaio-remotion-render',
    timeoutInSeconds: 240,
    memorySizeInMb: 3008,
    maxRetries: 1,
  },
};
```

### Video Generation API
```typescript
// POST /api/videos/generate
{
  template_id: "template-uuid",
  child_name: "Nolan",
  assets: [
    {
      asset_id: "asset-uuid",
      purpose: "background_music"
    }
  ],
  submitted_by: "user-uuid"
}
```

### Job Tracking
```typescript
// Video generation job states
type JobStatus = 
  | 'pending'      // Job created
  | 'submitted'    // Sent to Lambda
  | 'processing'   // Lambda processing
  | 'completed'    // Video ready
  | 'failed';      // Error occurred
```

## 📊 Monitoring & Debugging

### 1. Asset Validation
```typescript
// Check asset availability before generation
const validateAssets = (template: VideoTemplate, assets: Asset[]) => {
  const requiredAssets = [];
  
  // Check global elements
  template.global_elements.forEach(element => {
    if (element.required && !hasAsset(element, assets)) {
      requiredAssets.push({
        purpose: element.asset_purpose,
        missing: true,
        description: element.description
      });
    }
  });
  
  return requiredAssets;
};
```

### 2. Template Validation
```typescript
// Validate template structure
const validateTemplate = (template: VideoTemplate) => {
  const errors = [];
  
  // Check for required fields
  if (!template.name) errors.push('Template name is required');
  if (!template.parts || template.parts.length === 0) {
    errors.push('Template must have at least one part');
  }
  
  // Check part ordering
  const sortedParts = [...template.parts].sort((a, b) => a.order - b.order);
  if (JSON.stringify(sortedParts) !== JSON.stringify(template.parts)) {
    errors.push('Parts must be ordered correctly');
  }
  
  return errors;
};
```

### 3. Performance Monitoring
```typescript
// Track rendering performance
const startTime = Date.now();
// ... rendering logic
const endTime = Date.now();
console.log(`Template rendered in ${endTime - startTime}ms`);
```

## 🔮 Future Improvements

### 1. Template Versioning
- Version control for templates
- A/B testing capabilities
- Rollback functionality

### 2. Advanced Asset Management
- Asset optimization (compression, formats)
- CDN integration
- Asset caching strategies

### 3. Template Marketplace
- Share templates between users
- Template rating system
- Community contributions

### 4. Real-time Preview
- Live template editing
- Instant preview generation
- Collaborative editing

## 📚 Resources

- [Remotion Documentation](https://www.remotion.dev/docs/)
- [Remotion Lambda](https://www.remotion.dev/docs/lambda)
- [Video Generation Best Practices](https://www.remotion.dev/docs/best-practices)
- [Performance Optimization](https://www.remotion.dev/docs/performance)

## 🤝 Contributing

When contributing to template development:

1. **Follow the established patterns** in existing templates
2. **Test thoroughly** with various asset combinations
3. **Document changes** in template structure
4. **Validate performance** with realistic data
5. **Update this guide** when adding new patterns

---

*This guide is a living document. Update it as the template system evolves.* 