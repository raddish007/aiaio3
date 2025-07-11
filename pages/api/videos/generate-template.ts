import { NextApiRequest, NextApiResponse } from 'next';
import { lambdaClient, S3_BUCKETS, LAMBDA_FUNCTIONS } from '@/lib/aws';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      templateId, 
      childName, 
      userId 
    } = req.body;

    // Validate required parameters
    if (!templateId || !childName) {
      return res.status(400).json({ error: 'Missing required parameters: templateId, childName' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('video_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Error fetching template:', templateError);
      return res.status(404).json({ error: 'Template not found' });
    }

    // Collect all asset IDs from the template
    const assetIds = new Set<string>();
    
    // Global elements
    template.global_elements?.forEach((el: any) => {
      if (el.asset_type === 'specific' && el.specific_asset_id) {
        assetIds.add(el.specific_asset_id);
      }
    });

    // Parts elements
    template.parts?.forEach((part: any) => {
      part.audio_elements?.forEach((el: any) => {
        if (el.asset_type === 'specific' && el.specific_asset_id) {
          assetIds.add(el.specific_asset_id);
        }
      });
      part.image_elements?.forEach((el: any) => {
        if (el.asset_type === 'specific' && el.specific_asset_id) {
          assetIds.add(el.specific_asset_id);
        }
      });
    });

    // Fetch all required assets
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('id', Array.from(assetIds))
      .eq('status', 'approved');

    if (assetsError) {
      console.error('Error fetching assets:', assetsError);
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }

    // Create assets lookup object
    const assetsLookup: { [key: string]: any } = {};
    assets?.forEach(asset => {
      assetsLookup[asset.id] = asset;
    });

    // Create video asset record
    const { data: videoAsset, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert({
        type: 'video',
        theme: `${childName}'s ${template.name}`,
        status: 'pending',
        metadata: {
          template_id: templateId,
          child_name: childName,
          template_type: template.template_type,
          user_id: userId,
          render_params: {
            compositionId: 'TemplateVideo',
            inputProps: {
              childName,
              template,
              assets: assetsLookup,
            },
          },
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Error creating video asset:', assetError);
      return res.status(500).json({ 
        error: 'Failed to create video asset',
        details: assetError.message 
      });
    }

    // Calculate total duration for the video
    const totalDuration = template.parts?.reduce((total: number, part: any) => total + part.duration, 0) || 10;
    const totalFrames = totalDuration * 60; // 60fps

    // Prepare Lambda payload
    const lambdaPayload = {
      compositionId: 'SimpleTemplate',
      inputProps: {
        childName,
        template,
        assets: assetsLookup,
      },
      outputBucket: S3_BUCKETS.VIDEOS,
      outputKey: `videos/${videoAsset.id}/template-${Date.now()}.mp4`,
      assetId: videoAsset.id,
      durationInFrames: totalFrames,
    };

    // Invoke Lambda function for video rendering
    const invokeCommand = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTIONS.REMOTION_RENDER,
      Payload: JSON.stringify(lambdaPayload),
      InvocationType: 'Event', // Async invocation
    });

    try {
      await lambdaClient.send(invokeCommand);
      console.log('Lambda function invoked successfully for template video rendering');
    } catch (lambdaError) {
      console.error('Error invoking Lambda function:', lambdaError);
      
      // Update asset status to failed
      await supabaseAdmin
        .from('assets')
        .update({ status: 'failed' })
        .eq('id', videoAsset.id);

      return res.status(500).json({ 
        error: 'Failed to start video rendering',
        details: lambdaError instanceof Error ? lambdaError.message : 'Unknown error'
      });
    }

    res.status(200).json({
      success: true,
      videoAsset,
      template,
      assetsCount: assets?.length || 0,
      totalDuration,
      message: 'Template video generation started successfully',
    });

  } catch (error) {
    console.error('Template video generation error:', error);
    res.status(500).json({ 
      error: 'Template video generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 