import { NextApiRequest, NextApiResponse } from 'next';
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

    // Use the exact same data as the working NameVideo request
    const inputProps = {
      childName: 'Nolan',
      childAge: 3,
      childTheme: 'halloween',
      backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
      backgroundMusicVolume: 0.25,
      introImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752181122763_axekhc80v.png',
      outroImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752181122764_eg5nx1dww.png',
      letterImageUrls: [
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_tqu9kxu47.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_07m3d64cx.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_c4t2b0skf.png',
        'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_mxymk8qdo.png'
      ],
      letterAudioUrls: {
        "N": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.mp3",
        "O": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.mp3",
        "L": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.mp3",
        "A": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.mp3"
      },
      debugMode: true
    };

    console.log(`🧪 Testing NameVideoSimple with full data:`, {
      childName: inputProps.childName,
      letterCount: Object.keys(inputProps.letterAudioUrls).length,
      availableLetters: Object.keys(inputProps.letterAudioUrls),
      hasBackgroundMusic: !!inputProps.backgroundMusicUrl,
      hasImages: !!inputProps.introImageUrl
    });

    const result = await renderMediaOnLambda({
      region: (process.env.AWS_REGION as any) || 'us-east-1',
      functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION,
      serveUrl: process.env.REMOTION_SITE_URL,
      composition: 'NameVideoSimple',
      inputProps,
      codec: 'h264',
      imageFormat: 'jpeg',
    });

    const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
    
    console.log(`✅ NameVideoSimple Lambda render started successfully: ${result.renderId}`);
    
    return res.status(200).json({
      success: true,
      render_id: result.renderId,
      output_url: outputUrl,
      composition: 'NameVideoSimple',
      input_props: inputProps,
      debug_info: {
        letterCount: Object.keys(inputProps.letterAudioUrls).length,
        availableLetters: Object.keys(inputProps.letterAudioUrls),
        testType: 'simplified_name_video',
        hasBackgroundMusic: !!inputProps.backgroundMusicUrl,
        hasImages: !!inputProps.introImageUrl
      }
    });

  } catch (error) {
    console.error('❌ NameVideoSimple Lambda render failed:', error);
    return res.status(500).json({ 
      error: 'Failed to start NameVideoSimple Lambda render',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 