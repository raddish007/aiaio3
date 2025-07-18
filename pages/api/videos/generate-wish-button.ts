import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

interface WishButtonAssets {
  page1_image: { url: string; status: 'missing' | 'generating' | 'ready' };
  page1_audio: { url: string; status: 'missing' | 'generating' | 'ready' };
  page2_image: { url: string; status: 'missing' | 'generating' | 'ready' };
  page2_audio: { url: string; status: 'missing' | 'generating' | 'ready' };
  background_music: { url: string; status: 'missing' | 'generating' | 'ready' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available - missing service role key');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { 
      childName, 
      childId, 
      theme,
      storyVariables,
      assets,
      submitted_by 
    } = req.body;

    console.log('🎬 Wish Button generation request:', {
      childName,
      childId,
      theme,
      hasStoryVariables: !!storyVariables,
      assetsProvided: Object.keys(assets || {}),
      submitted_by
    });

    // Validate required parameters
    if (!childName || !theme || !storyVariables || !assets) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['childName', 'theme', 'storyVariables', 'assets']
      });
    }

    // Validate child ID if provided (use placeholder if testing)
    const validChildId = childId && childId !== 'manual-input' ? childId : null;
    const validSubmittedBy = submitted_by || '1cb80063-9b5f-4fff-84eb-309f12bd247d'; // Default for testing

    // Video duration: 16 seconds (2 pages × 8 seconds each)
    const durationInSeconds = 16;

    console.log(`🎬 Wish Button generation for "${childName}" (Theme: ${theme}):`, {
      childName,
      theme,
      durationInSeconds,
      validChildId,
      validSubmittedBy
    });

    // Define the 5 required assets for the template
    const requiredAssetKeys = [
      'page1_image', 'page1_audio',     // Page 1: Title page
      'page2_image', 'page2_audio',     // Page 2: Story page
      'background_music'                // Background music throughout
    ];

    const processedAssets: WishButtonAssets = {} as WishButtonAssets;
    let readyAssetCount = 0;

    // Process all assets - provide fallbacks for missing ones
    for (const key of requiredAssetKeys) {
      const asset = assets?.[key];
      if (asset && asset.url && asset.status === 'ready') {
        processedAssets[key as keyof WishButtonAssets] = asset;
        readyAssetCount++;
      } else {
        // For assets not ready, set as missing with empty URL
        processedAssets[key as keyof WishButtonAssets] = {
          url: '',
          status: 'missing'
        };
        console.log(`⚠️ Asset ${key} not ready or missing:`, asset?.status || 'not provided');
      }
    }

    console.log(`📊 Asset completeness: ${readyAssetCount}/${requiredAssetKeys.length} assets ready`);

    // Find or create a wish-button template
    let templateId: string;
    
    // First, try to find existing wish-button template
    const { data: existingTemplate, error: templateFindError } = await supabaseAdmin
      .from('video_templates')
      .select('id')
      .eq('name', 'Wish Button Story')
      .eq('template_type', 'wish-button')
      .single();
    
    if (existingTemplate) {
      templateId = existingTemplate.id;
      console.log('✅ Found existing wish-button template:', templateId);
    } else {
      // Create new wish-button template
      console.log('🔧 Creating new wish-button template...');
      const { data: newTemplate, error: templateCreateError } = await supabaseAdmin
        .from('video_templates')
        .insert({
          name: 'Wish Button Story',
          description: 'Personalized interactive storybook videos with wish button theme',
          type: 'custom', // Use the enum value
          template_type: 'wish-button', // Use the varchar field for specific type
          structure: {
            composition: 'WishButton',
            duration: 16,
            pages: [
              { page: 'page1', type: 'title', duration: 8 },
              { page: 'page2', type: 'story', duration: 8 }
            ]
          },
          metadata: {
            template_type: 'wish-button',
            version: '1.0',
            created_for: 'personalized-stories'
          },
          is_active: true
        })
        .select('id')
        .single();
      
      if (templateCreateError) {
        console.error('Error creating wish-button template:', templateCreateError);
        return res.status(500).json({ error: 'Failed to create template record' });
      }
      
      templateId = newTemplate.id;
      console.log('✅ Created new wish-button template:', templateId);
    }

    // Create a video generation job record (following Letter Hunt pattern)
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: templateId, // Use the found/created template ID
        status: 'pending',
        submitted_by: validSubmittedBy,
        assets: [],
        template_data: {
          composition: 'WishButton',
          props: {
            childName,
            theme,
            storyVariables,
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
      theme,
      storyVariables,
      assets: processedAssets
    };

    console.log('🚀 Submitting Wish Button to Lambda with inputProps:', JSON.stringify(inputProps, null, 2));

    try {
      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION as any) || 'us-east-1',
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION || 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
        serveUrl: process.env.REMOTION_SITE_URL || 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/wish-button/index.html',
        composition: 'WishButton',
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
      });

      const outputUrl = `https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/${result.renderId}/out.mp4`;
      
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

      // Create child approved video record for moderation (if child ID provided)
      if (validChildId) {
        const { data: approvedVideoRecord, error: approvedVideoError } = await supabaseAdmin
          .from('child_approved_videos')
          .insert({
            video_generation_job_id: jobRecord.id,
            video_url: outputUrl,
            video_title: `Wish Button Story for ${childName}`,
            child_id: validChildId,
            child_name: childName,
            child_age: storyVariables.age || 3,
            child_theme: theme,
            personalization_level: 'child_specific',
            approval_status: 'pending_review',
            submitted_by: validSubmittedBy,
            duration_seconds: Math.round(durationInSeconds),
            template_type: 'wish-button',
            template_data: {
              composition: 'WishButton',
              props: inputProps,
              used_assets: processedAssets,
              story_variables: storyVariables,
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
        }

        // Create moderation queue entry
        const { data: moderationQueueRecord, error: moderationQueueError } = await supabaseAdmin
          .from('moderation_queue')
          .insert({
            item_type: 'video',
            item_id: approvedVideoRecord?.id,
            child_id: validChildId,
            status: 'pending',
            priority: 'normal',
            submitted_by: validSubmittedBy,
            submitted_at: new Date().toISOString(),
            metadata: {
              video_title: `Wish Button Story for ${childName}`,
              template_type: 'wish-button',
              duration_seconds: durationInSeconds,
              child_name: childName,
              child_theme: theme
            }
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
    console.error('Wish Button video generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate wish button video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
