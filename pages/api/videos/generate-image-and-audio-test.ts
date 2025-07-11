import { NextApiRequest, NextApiResponse } from 'next';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      backgroundImageUrl,
      backgroundMusicUrl,
      backgroundMusicVolume,
      letterAudioUrl,
      letterName,
      submitted_by
    } = req.body;

    console.log('🎵 Image and Audio Test API received:', {
      backgroundImage: backgroundImageUrl,
      backgroundMusic: backgroundMusicUrl,
      volume: backgroundMusicVolume,
      letterAudio: letterAudioUrl,
      letterName: letterName
    });

    // Prepare input props for Lambda
    const inputProps = {
      backgroundImageUrl: backgroundImageUrl || 'https://picsum.photos/1920/1080',
      backgroundMusicUrl: backgroundMusicUrl || '',
      backgroundMusicVolume: backgroundMusicVolume || 0.25,
      letterAudioUrl: letterAudioUrl || '',
      letterName: letterName || ''
    };

    console.log('🚀 Sending to Remotion Lambda:', inputProps);

    try {
      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION as any) || 'us-east-1',
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION || 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
        serveUrl: process.env.REMOTION_SITE_URL || 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-name-video-template-v40/index.html',
        composition: 'HelloWorldWithImageAndAudio',
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
      });

      const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
      
      return res.status(200).json({
        success: true,
        render_id: result.renderId,
        output_url: outputUrl,
        message: 'Image and audio test video generation started successfully'
      });
    } catch (lambdaError) {
      console.error('Lambda error:', lambdaError);
      return res.status(500).json({ 
        error: 'Failed to start Remotion Lambda render',
        details: lambdaError instanceof Error ? lambdaError.message : 'Unknown Lambda error'
      });
    }

  } catch (error) {
    console.error('Image and audio test generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image and audio test video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 