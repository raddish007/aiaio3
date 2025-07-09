import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childName, childAge, childTheme, childId, submitted_by, introImageUrl, outroImageUrl } = req.body;

    if (!childName || !childId) {
      return res.status(400).json({ 
        error: 'Missing required fields: childName, childId' 
      });
    }

    // Use provided submitted_by or fallback to a default admin user
    const userId = submitted_by || '1cb80063-9b5f-4fff-84eb-309f12bd247d';

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Get DreamDrip asset duration from database
    let dreamDripDuration = 88; // Default fallback (updated to 88 seconds)
    try {
      const { data: dreamDripAsset, error: assetError } = await supabaseAdmin
        .from('assets')
        .select('metadata')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single();

      if (!assetError && dreamDripAsset?.metadata?.duration) {
        dreamDripDuration = dreamDripAsset.metadata.duration;
        console.log(`Using DreamDrip duration from database: ${dreamDripDuration} seconds`);
      } else {
        console.log(`Using default DreamDrip duration: ${dreamDripDuration} seconds`);
      }
    } catch (error) {
      console.warn('Failed to fetch DreamDrip duration, using default:', error);
    }

    // Create a video generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: 'ed70f4f7-88ff-4424-a866-3999afbb86e1', // Lullaby Video template
        status: 'pending',
        submitted_by: userId,
        assets: [],
        template_data: {
          composition: 'Lullaby',
          props: {
            childName,
            childAge: childAge || 3,
            childTheme: childTheme || 'default',
            backgroundMusicUrl: '',
            backgroundMusicVolume: 0.8,
            duration: dreamDripDuration,
            debugMode: true
          }
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
      return res.status(500).json({ error: 'Failed to create job record' });
    }

    // Prepare input props for Lambda
    const inputProps = {
      childName,
      childAge: childAge || 3,
      childTheme: childTheme || 'default',
      backgroundMusicUrl: '',
      backgroundMusicVolume: 0.8,
      duration: dreamDripDuration,
      introImageUrl: introImageUrl || 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
      outroImageUrl: outroImageUrl || 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
      introAudioUrl: '', // Personalized audio for intro (empty for now)
      debugMode: true
    };

    try {
      const result = await renderMediaOnLambda({
        region: 'us-east-1',
        functionName: 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
        serveUrl: 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/f5rflwily9/index.html',
        composition: 'Lullaby',
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
      });

      // Update job with Lambda info
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'submitted',
          lambda_request_id: result.renderId,
          submitted_at: new Date().toISOString(),
          output_url: `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`
        })
        .eq('id', jobRecord.id);

      return res.status(200).json({
        success: true,
        job_id: jobRecord.id,
        render_id: result.renderId,
        output_url: `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`,
        job_tracking_url: `/admin/jobs?job_id=${jobRecord.id}`
      });
    } catch (lambdaError) {
      // Update job as failed
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: lambdaError instanceof Error ? lambdaError.message : 'Remotion Lambda render failed',
          failed_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);
      return res.status(500).json({ error: 'Failed to start Remotion Lambda render' });
    }

  } catch (error) {
    console.error('Lullaby video generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate lullaby video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 