import { NextApiRequest, NextApiResponse } from 'next';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childName } = req.body;

    console.log('🧪 Testing NameVideoUltraSimple with background music:', {
      childName,
    });

    // Use the exact same background music that works in HelloWorldWithImageAndAudio
    const backgroundMusic = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751981193321_7ch9q7v0y.mp3';

    // Bundle the composition
    const bundled = await bundle(path.join(process.cwd(), 'remotion/src/index.ts'));

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'NameVideoUltraSimple',
      inputProps: {
        childName,
        backgroundMusic,
      },
    });

    console.log('✅ Composition selected:', composition.id);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'remotion/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `name-video-ultra-simple-${Date.now()}.mp4`);

    // Render the video
    console.log('🎬 Starting render...');
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        childName,
        backgroundMusic,
      },
    });

    console.log('✅ Render completed:', outputPath);

    // Check if file exists and get size
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log('📁 Output file size:', stats.size, 'bytes');
    }

    res.status(200).json({
      success: true,
      message: 'NameVideoUltraSimple render completed successfully',
      outputPath,
    });

  } catch (error) {
    console.error('❌ NameVideoUltraSimple test error:', error);
    res.status(500).json({
      error: 'Render failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 