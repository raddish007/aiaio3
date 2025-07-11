import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!process.env.REMOTION_SITE_URL) {
      throw new Error('REMOTION_SITE_URL environment variable is not set');
    }
    if (!process.env.AWS_LAMBDA_REMOTION_FUNCTION) {
      throw new Error('AWS_LAMBDA_REMOTION_FUNCTION environment variable is not set');
    }

    console.log(`🔧 Using environment variables:`, {
      REMOTION_SITE_URL: process.env.REMOTION_SITE_URL,
      AWS_LAMBDA_REMOTION_FUNCTION: process.env.AWS_LAMBDA_REMOTION_FUNCTION,
      AWS_REGION: process.env.AWS_REGION || 'us-east-1'
    });

    // Use the exact same letter audio URLs from the working test
    const inputProps = {
      childName: 'Nolan',
      letterAudioUrls: {
        "N": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.mp3",
        "O": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.mp3",
        "L": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.mp3",
        "A": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.mp3"
      },
      debugMode: true
    };

    console.log(`🧪 Testing NameVideoTest with letter audio:`, {
      childName: inputProps.childName,
      letterCount: Object.keys(inputProps.letterAudioUrls).length,
      availableLetters: Object.keys(inputProps.letterAudioUrls)
    });

    const result = await renderMediaOnLambda({
      region: (process.env.AWS_REGION as any) || 'us-east-1',
      functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION,
      serveUrl: process.env.REMOTION_SITE_URL,
      composition: 'NameVideoTest',
      inputProps,
      codec: 'h264',
      imageFormat: 'jpeg',
    });

    const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
    
    console.log(`✅ NameVideoTest Lambda render started successfully: ${result.renderId}`);
    
    return res.status(200).json({
      success: true,
      render_id: result.renderId,
      output_url: outputUrl,
      composition: 'NameVideoTest',
      input_props: inputProps,
      debug_info: {
        letterCount: Object.keys(inputProps.letterAudioUrls).length,
        availableLetters: Object.keys(inputProps.letterAudioUrls),
        testType: 'letter_audio_only'
      }
    });

  } catch (error) {
    console.error('❌ NameVideoTest Lambda render failed:', error);
    return res.status(500).json({ 
      error: 'Failed to start NameVideoTest Lambda render',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 