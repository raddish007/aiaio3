import { NextApiRequest, NextApiResponse } from 'next';
import { renderMediaOnLambda } from '@remotion/lambda';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childName } = req.body;

    console.log('🧪 Testing NameVideoUltraSimple Lambda with background music:', {
      childName,
    });

    // Use an actual audio file from the database that exists
    const backgroundMusic = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752156347942_248nvfaZe8BXhKntjmpp.mp3';

    // Environment variables
    const siteUrl = process.env.REMOTION_SITE_URL;
    const functionName = process.env.AWS_LAMBDA_REMOTION_FUNCTION;
    const region = process.env.AWS_REGION;

    console.log('🔧 Using environment variables:', {
      REMOTION_SITE_URL: siteUrl,
      AWS_LAMBDA_REMOTION_FUNCTION: functionName,
      AWS_REGION: region,
    });

    if (!siteUrl || !functionName || !region) {
      throw new Error('Missing required environment variables');
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Create a test job record first
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: 'dcf10e2a-d7df-4e72-ab25-d6c9b1f00bd8', // NameVideo template UUID
        status: 'pending',
        submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d', // Default admin user
        assets: [],
        template_data: {
          composition: 'NameVideoUltraSimple',
          props: {
            childName,
            backgroundMusic,
          }
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating test job record:', jobError);
      return res.status(500).json({ error: 'Failed to create test job record' });
    }

    // Start Lambda render
    const renderResult = await renderMediaOnLambda({
      composition: 'NameVideoUltraSimple',
      serveUrl: siteUrl,
      codec: 'h264',
      inputProps: {
        childName,
        backgroundMusic,
      },
      functionName,
      region: region as any,
      privacy: 'public',
    });

    console.log('✅ NameVideoUltraSimple Lambda render started successfully:', renderResult);

    // Extract renderId from the result object
    const renderId = typeof renderResult === 'string' ? renderResult : renderResult.renderId;

    // Update job with Lambda info
    await supabaseAdmin
      .from('video_generation_jobs')
      .update({
        status: 'submitted',
        lambda_request_id: renderId,
        submitted_at: new Date().toISOString(),
        output_url: `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${renderId}/out.mp4`
      })
      .eq('id', jobRecord.id);

    res.status(200).json({
      success: true,
      renderId,
      jobId: jobRecord.id,
      message: 'NameVideoUltraSimple Lambda render started',
    });

  } catch (error) {
    console.error('❌ NameVideoUltraSimple Lambda test error:', error);
    res.status(500).json({
      error: 'Lambda render failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 