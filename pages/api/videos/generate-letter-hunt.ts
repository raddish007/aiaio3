import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 client for direct asset storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to upload asset to S3
const uploadAssetToS3 = async (assetData: Buffer, fileName: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_ASSET_BUCKET!,
    Key: `letter-hunt-assets/${fileName}`,
    Body: assetData,
    ContentType: contentType,
    ACL: 'public-read'
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_S3_ASSET_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/letter-hunt-assets/${fileName}`;
};

interface LetterHuntAssets {
  titleCard: { url: string; status: 'missing' | 'generating' | 'ready' };
  introVideo: { url: string; status: 'missing' | 'generating' | 'ready' };
  intro2Video: { url: string; status: 'missing' | 'generating' | 'ready' };
  signImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  bookImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  groceryImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  happyDanceVideo: { url: string; status: 'missing' | 'generating' | 'ready' };
  endingImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  titleAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  introAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  intro2Audio: { url: string; status: 'missing' | 'generating' | 'ready' };
  signAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  bookAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  groceryAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  happyDanceAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  endingAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  backgroundMusic: { url: string; status: 'missing' | 'generating' | 'ready' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      childName, 
      targetLetter, 
      childTheme, 
      childAge, 
      childId, 
      submitted_by, 
      assets 
    } = req.body;

    if (!childName || !targetLetter) {
      return res.status(400).json({ 
        error: 'Missing required fields: childName, targetLetter' 
      });
    }

    // Validate childId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validChildId = childId && uuidRegex.test(childId) ? childId : null;
    
    if (!validChildId) {
      console.warn('⚠️ Invalid or missing childId, proceeding without moderation record');
    }

    // Validate submitted_by is a valid UUID, or use default admin user
    const validSubmittedBy = submitted_by && uuidRegex.test(submitted_by) ? submitted_by : '1cb80063-9b5f-4fff-84eb-309f12bd247d';
    
    if (submitted_by && !uuidRegex.test(submitted_by)) {
      console.warn('⚠️ Invalid submitted_by UUID, using default admin user');
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Calculate video duration: 8 segments * 3 seconds each = 24 seconds
    const durationInSeconds = 24;
    const totalSegments = 8;

    console.log(`🎬 Letter Hunt generation for "${childName}" (Letter ${targetLetter}):`, {
      childName,
      targetLetter,
      childTheme: childTheme || 'monsters',
      childAge: childAge || 3,
      totalSegments,
      durationInSeconds
    });

    // Validate assets structure
    const requiredAssetKeys = [
      'titleCard', 'introVideo', 'intro2Video', 'signImage', 'bookImage', 
      'groceryImage', 'happyDanceVideo', 'endingImage', 'titleAudio', 
      'introAudio', 'intro2Audio', 'signAudio', 'bookAudio', 'groceryAudio', 
      'happyDanceAudio', 'endingAudio', 'backgroundMusic'
    ];

    const processedAssets: LetterHuntAssets = {} as LetterHuntAssets;
    let readyAssetCount = 0;

    // Process and validate each asset
    for (const key of requiredAssetKeys) {
      const asset = assets?.[key];
      if (asset && asset.url && asset.status === 'ready') {
        processedAssets[key as keyof LetterHuntAssets] = asset;
        readyAssetCount++;
      } else {
        processedAssets[key as keyof LetterHuntAssets] = { 
          url: '', 
          status: 'missing' as const 
        };
      }
    }

    console.log(`📦 Asset validation:`, {
      totalRequired: requiredAssetKeys.length,
      readyAssets: readyAssetCount,
      readyPercentage: Math.round((readyAssetCount / requiredAssetKeys.length) * 100),
      missingAssets: requiredAssetKeys.filter(key => 
        !assets?.[key]?.url || assets[key].status !== 'ready'
      )
    });

    // Create a video generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: '79717227-d524-48cc-af06-55b25a6e053a', // Letter Hunt template UUID
        status: 'pending',
        submitted_by: validSubmittedBy,
        assets: [],
        template_data: {
          composition: 'LetterHunt',
          props: {
            childName,
            targetLetter,
            childTheme: childTheme || 'monsters',
            childAge: childAge || 3,
            assets: processedAssets
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
      targetLetter: targetLetter.toUpperCase(),
      childTheme: childTheme || 'monsters',
      childAge: childAge || 3,
      assets: processedAssets
    };

    console.log('🚀 Submitting Letter Hunt to Lambda with inputProps:', JSON.stringify(inputProps, null, 2));

    try {
      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION as any) || 'us-east-1',
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION || 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
        serveUrl: process.env.REMOTION_SITE_URL || 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/letter-hunt-updated/index.html',
        composition: 'LetterHunt',
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
          video_title: `Letter Hunt for ${childName} - Letter ${targetLetter}`,
          child_id: validChildId,
          child_name: childName,
          child_age: childAge || 3,
          child_theme: childTheme || 'monsters',
          personalization_level: 'child_specific',
          approval_status: 'pending_review',
          submitted_by: validSubmittedBy,
          duration_seconds: durationInSeconds,
          template_type: 'letter-hunt',
          template_data: {
            composition: 'LetterHunt',
            props: inputProps,
            used_assets: processedAssets,
            target_letter: targetLetter,
            asset_completeness: {
              ready_count: readyAssetCount,
              total_count: requiredAssetKeys.length,
              completion_percentage: Math.round((readyAssetCount / requiredAssetKeys.length) * 100)
            }
          }
        })
        .select()
        .single();

      if (approvedVideoError) {
        console.error('Error creating approved video record:', approvedVideoError);
      } else {
        console.log('✅ Created approved video record:', approvedVideoRecord.id);

        // Create moderation queue record
        const { data: moderationQueueRecord, error: moderationQueueError } = await supabaseAdmin
          .from('moderation_queue')
          .insert({
            approved_video_id: approvedVideoRecord.id,
            priority: 'normal',
            status: 'pending',
            created_at: new Date().toISOString()
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
        payload: inputProps,
        duration_seconds: durationInSeconds,
        asset_summary: {
          ready_assets: readyAssetCount,
          total_assets: requiredAssetKeys.length,
          completion_percentage: Math.round((readyAssetCount / requiredAssetKeys.length) * 100),
          missing_assets: requiredAssetKeys.filter(key => 
            !assets?.[key]?.url || assets[key].status !== 'ready'
          )
        },
        segments: {
          total: totalSegments,
          segments: [
            { name: 'titleCard', duration: 3, order: 1 },
            { name: 'intro', duration: 3, order: 2 },
            { name: 'intro2', duration: 3, order: 3 },
            { name: 'sign', duration: 3, order: 4 },
            { name: 'book', duration: 3, order: 5 },
            { name: 'grocery', duration: 3, order: 6 },
            { name: 'happyDance', duration: 3, order: 7 },
            { name: 'ending', duration: 3, order: 8 }
          ]
        }
      });

    } catch (lambdaError) {
      console.error('❌ Lambda render failed:', lambdaError);
      
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
    console.error('Letter Hunt video generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate Letter Hunt video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
