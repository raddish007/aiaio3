import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      childName, 
      childAge, 
      childTheme, 
      childId, 
      submitted_by, 
      introImageUrl, 
      outroImageUrl, 
      letterImageUrls, 
      letterAudioUrls, 
      introAudioUrl, 
      outroAudioUrl 
    } = req.body;

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

    // Calculate video duration based on name length
    const letters = childName.toUpperCase().split('');
    const totalSegments = letters.length + 2; // intro + letters + outro
    const durationInSeconds = totalSegments * 2; // 2 seconds per segment (updated from 4)

    console.log(`🎬 NameVideov2 generation for "${childName}":`, {
      letters: letters,
      totalSegments: totalSegments,
      durationInSeconds: durationInSeconds,
      childAge: childAge,
      childTheme: childTheme
    });

    // Get background music asset from database
    let backgroundMusicUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav'; // Fallback
    try {
      const { data: musicAsset, error: musicError } = await supabaseAdmin
        .from('assets')
        .select('file_url')
        .eq('id', 'f7365c71-cd52-44d2-b289-02bdc6e74c74')
        .single();

      if (!musicError && musicAsset?.file_url) {
        backgroundMusicUrl = musicAsset.file_url;
        console.log(`Using background music from database: ${backgroundMusicUrl}`);
      } else {
        console.log(`Using fallback background music: ${backgroundMusicUrl}`);
      }
    } catch (error) {
      console.warn('Failed to fetch background music from database, using fallback:', error);
    }

    // Get name audio asset for intro/outro (child's name pronunciation)
    let nameAudioUrl = '';
    try {
      const { data: nameAudioAssets, error: nameAudioError } = await supabaseAdmin
        .from('assets')
        .select('file_url, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>audio_class', 'name_audio')
        .eq('metadata->>child_name', childName)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!nameAudioError && nameAudioAssets && nameAudioAssets.length > 0) {
        nameAudioUrl = nameAudioAssets[0].file_url;
        console.log(`Using name audio for ${childName} from database: ${nameAudioUrl}`);
      } else {
        console.error(`No name audio found for child: ${childName}`);
        return res.status(400).json({ 
          error: `Name audio not found for child: ${childName}. Please create a name_audio asset for this child first.` 
        });
      }
    } catch (error) {
      console.error('Failed to fetch name audio from database:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch name audio from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Convert letterAudioUrls from asset objects to URL strings (_reference format)
    const letterAudioUrlStrings: { [letter: string]: string } = {};
    if (letterAudioUrls) {
      Object.entries(letterAudioUrls).forEach(([letter, asset]) => {
        if (asset && typeof asset === 'object' && 'file_url' in asset) {
          letterAudioUrlStrings[letter] = (asset as any).file_url;
        } else if (typeof asset === 'string') {
          letterAudioUrlStrings[letter] = asset;
        }
      });
    }

    // Validate and process assets
    const processedAssets = {
      backgroundMusicUrl,
      backgroundMusicVolume: 0.25, // Reduced volume for better balance
      introImageUrl: introImageUrl || '',
      outroImageUrl: outroImageUrl || '',
      letterImageUrls: Array.isArray(letterImageUrls) ? letterImageUrls : [],
      // _REFERENCE STRUCTURE: audioAssets instead of individual audio props
      audioAssets: {
        fullName: nameAudioUrl, // Used for both intro and outro
        letters: letterAudioUrlStrings // Direct letter -> URL mapping
      }
    };

    // Log asset validation
    console.log('📦 Asset validation:', {
      hasBackgroundMusic: !!processedAssets.backgroundMusicUrl,
      hasIntroImage: !!processedAssets.introImageUrl,
      hasOutroImage: !!processedAssets.outroImageUrl,
      letterImageCount: processedAssets.letterImageUrls.length,
      hasNameAudio: !!processedAssets.audioAssets.fullName,
      letterAudioCount: Object.keys(processedAssets.audioAssets.letters).length,
      letterAudioKeys: Object.keys(processedAssets.audioAssets.letters)
    });

    // Create a video generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: 'dcf10e2a-d7df-4e72-ab25-d6c9b1f00bd8', // NameVideo template UUID
        status: 'pending',
        submitted_by: userId,
        assets: [],
        template_data: {
          composition: 'NameVideov2',
          props: {
            childName,
            childAge: childAge || 3,
            childTheme: childTheme || 'default',
            ...processedAssets,
            debugMode: false
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
      ...processedAssets,
      debugMode: false
    };

    console.log('🚀 Submitting to Lambda with inputProps:', JSON.stringify(inputProps, null, 2));

    try {
      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION as any) || 'us-east-1',
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION || 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
        serveUrl: process.env.REMOTION_SITE_URL || 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/aiaio3-name-video-template/index.html',
        composition: 'NameVideov2',
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
      });

      const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
      
      console.log('✅ Lambda render started successfully:', {
        renderId: result.renderId,
        outputUrl: outputUrl
      });
      
      // Update job with Lambda info
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'submitted',
          lambda_request_id: result.renderId,
          submitted_at: new Date().toISOString(),
          output_url: outputUrl
        })
        .eq('id', jobRecord.id);

      // Create child approved video record for moderation
      const { data: approvedVideoRecord, error: approvedVideoError } = await supabaseAdmin
        .from('child_approved_videos')
        .insert({
          video_generation_job_id: jobRecord.id,
          video_url: outputUrl,
          video_title: `NameVideov2 for ${childName}`,
          child_id: childId,
          child_name: childName,
          child_age: childAge || 3,
          child_theme: childTheme || 'default',
          personalization_level: 'child_specific', // Since it's personalized with child name
          approval_status: 'pending_review',
          submitted_by: userId,
          duration_seconds: Math.round(durationInSeconds),
          template_type: 'name-video-v2',
          template_data: {
            composition: 'NameVideov2',
            props: inputProps,
            used_assets: {
              intro_image: processedAssets.introImageUrl,
              outro_image: processedAssets.outroImageUrl,
              letter_images: processedAssets.letterImageUrls,
              name_audio: processedAssets.audioAssets.fullName,
              letter_audios: processedAssets.audioAssets.letters,
              background_music: processedAssets.backgroundMusicUrl
            }
          }
        })
        .select()
        .single();

      if (approvedVideoError) {
        console.error('Error creating approved video record:', approvedVideoError);
        // Don't fail the whole request, just log the error
      } else {
        console.log('✅ Created child approved video record for moderation:', approvedVideoRecord.id);
        
        // Create moderation queue entry
        const { data: moderationQueueRecord, error: moderationQueueError } = await supabaseAdmin
          .from('video_moderation_queue')
          .insert({
            child_approved_video_id: approvedVideoRecord.id,
            assigned_to: null, // Will be assigned by admin
            priority: 1, // Default priority
            status: 'pending_review',
            review_notes: null
          })
          .select()
          .single();

        if (moderationQueueError) {
          console.error('Error creating moderation queue record:', moderationQueueError);
        } else {
          console.log('✅ Created moderation queue record:', moderationQueueRecord.id);
        }
      }

      return res.status(200).json({
        success: true,
        job_id: jobRecord.id,
        render_id: result.renderId,
        output_url: outputUrl,
        job_tracking_url: `/admin/jobs?job_id=${jobRecord.id}`,
        payload: inputProps, // Return the payload for verification
        duration_seconds: Math.round(durationInSeconds),
        segments: {
          total: totalSegments,
          intro: { duration: 4, safeZone: 'center' },
          letters: letters.map((letter: string, index: number) => ({
            letter,
            duration: 4,
            safeZone: index % 2 === 0 ? 'left' : 'right'
          })),
          outro: { duration: 4, safeZone: 'center' }
        }
      });

    } catch (lambdaError) {
      console.error('❌ Lambda render error:', lambdaError);
      
      // Update job as failed
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: lambdaError instanceof Error ? lambdaError.message : 'Remotion Lambda render failed',
          failed_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);

      return res.status(500).json({ 
        error: 'Failed to start Remotion Lambda render',
        details: lambdaError instanceof Error ? lambdaError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ NameVideov2 generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate NameVideov2',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 