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
  // Part 1: Title (0-3s)
  titleCard: { url: string; status: 'missing' | 'generating' | 'ready' };
  titleAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 2: Letter + Theme (3-6s)
  introVideo: { url: string; status: 'missing' | 'generating' | 'ready' };
  introAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 3: Search (6-9s)
  intro2Video: { url: string; status: 'missing' | 'generating' | 'ready' };
  intro2Audio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 4: Intro 3 (9-12s)
  intro3Video: { url: string; status: 'missing' | 'generating' | 'ready' };
  intro3Audio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 5: Sign (12-15s)
  signImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  signAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 6: Book (15-18s)
  bookImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  bookAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 7: Grocery (18-21s)
  groceryImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  groceryAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 8: Happy Dance (21-24s)
  happyDanceVideo: { url: string; status: 'missing' | 'generating' | 'ready' };
  happyDanceAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Part 9: Ending (24-27s)
  endingImage: { url: string; status: 'missing' | 'generating' | 'ready' };
  endingAudio: { url: string; status: 'missing' | 'generating' | 'ready' };
  
  // Background music throughout
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

    // Calculate video duration: 8 segments with extended durations
    // titleCard(3s) + intro(5.5s) + intro2(5.5s) + sign(4s) + book(4s) + grocery(4s) + happyDance(5.5s) + ending(5.5s) = 37 seconds
    const durationInSeconds = 37;
    const totalSegments = 8;

    console.log(`🎬 Letter Hunt generation for "${childName}" (Letter ${targetLetter}):`, {
      childName,
      targetLetter,
      childTheme: childTheme || 'monsters',
      childAge: childAge || 3,
      totalSegments,
      durationInSeconds
    });

    // Define all 19 assets that the Remotion template expects
    const allAssetKeys = [
      'titleCard', 'titleAudio',           // Part 1: Title (0-3s)
      'introVideo', 'introAudio',          // Part 2: Letter + Theme (3-6s)
      'intro2Video', 'intro2Audio',        // Part 3: Search (6-9s)
      'signImage', 'signAudio',            // Part 5: Sign (12-15s)
      'bookImage', 'bookAudio',            // Part 6: Book (15-18s)
      'groceryImage', 'groceryAudio',      // Part 7: Grocery (18-21s)
      'happyDanceVideo', 'happyDanceAudio', // Part 8: Happy Dance (21-24s)
      'endingImage', 'endingAudio',        // Part 9: Ending (24-27s)
      'backgroundMusic'                    // Background music throughout
    ];

    // Define which assets are currently being generated (first 3 parts + background music)
    const currentAssetKeys = [
      'titleCard', 'titleAudio',           // Part 1: Title (0-3s)
      'introVideo', 'introAudio',          // Part 2: Letter + Theme (3-6s)
      'intro2Video', 'intro2Audio',        // Part 3: Search (6-9s)  
      'backgroundMusic'                    // Background music throughout
    ];

    const processedAssets: LetterHuntAssets = {} as LetterHuntAssets;
    let readyAssetCount = 0;

    // Process all 19 assets - provide fallbacks for missing ones
    for (const key of allAssetKeys) {
      const asset = assets?.[key];
      if (asset && asset.url && asset.status === 'ready') {
        processedAssets[key as keyof LetterHuntAssets] = asset;
        readyAssetCount++;
      } else {
        // For assets not currently being generated, always set as missing
        // For current assets, set as missing if not provided
        processedAssets[key as keyof LetterHuntAssets] = { 
          url: '', 
          status: 'missing' as const 
        };
      }
    }

    console.log(`📦 Asset validation:`, {
      totalRequired: allAssetKeys.length,
      readyAssets: readyAssetCount,
      readyPercentage: Math.round((readyAssetCount / allAssetKeys.length) * 100),
      missingAssets: allAssetKeys.filter((key: string) => 
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
        serveUrl: process.env.REMOTION_SITE_URL || 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/letter-hunt-fixed/index.html',
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
          duration_seconds: Math.round(durationInSeconds),
          template_type: 'letter-hunt',
          template_data: {
            composition: 'LetterHunt',
            props: inputProps,
            used_assets: processedAssets,
            target_letter: targetLetter,
            asset_completeness: {
              ready_count: readyAssetCount,
              total_count: allAssetKeys.length,
              completion_percentage: Math.round((readyAssetCount / allAssetKeys.length) * 100)
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
          .from('video_moderation_queue')
          .insert({
            child_approved_video_id: approvedVideoRecord.id,
            assigned_to: null,
            priority: 1,
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
        payload: inputProps,
        duration_seconds: Math.round(durationInSeconds),
        asset_summary: {
          ready_assets: readyAssetCount,
          total_assets: allAssetKeys.length,
          completion_percentage: Math.round((readyAssetCount / allAssetKeys.length) * 100),
          missing_assets: allAssetKeys.filter((key: string) => 
            !assets?.[key]?.url || assets[key].status !== 'ready'
          )
        },
        segments: {
          total: totalSegments,
          segments: [
            { name: 'titleCard', duration: 3, order: 1 },
            { name: 'intro', duration: 5.5, order: 2 },
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
