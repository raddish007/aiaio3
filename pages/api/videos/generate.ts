import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { renderMediaOnLambda } from '@remotion/lambda/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { template_id, assets, submitted_by, child_name, theme = 'default', age = 3, use_simple_composition = false } = req.body;

    if (!template_id || !assets || !submitted_by || !child_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: template_id, assets, submitted_by, child_name' 
      });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Get the template details
    const { data: template, error: templateError } = await supabaseAdmin
      .from('video_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Validate that all assets exist and are approved
    const assetIds = assets.map((asset: any) => asset.asset_id);
    const { data: assetData, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('id', assetIds);

    if (assetError || !assetData) {
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }

    // Check if all assets are approved
    const unapprovedAssets = assetData.filter(asset => asset.status !== 'approved');
    if (unapprovedAssets.length > 0) {
      return res.status(400).json({ 
        error: 'Some assets are not approved',
        unapprovedAssets: unapprovedAssets.map(asset => ({ id: asset.id, theme: asset.theme }))
      });
    }

    // Create a video generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('video_generation_jobs')
      .insert({
        template_id: template_id,
        status: 'pending',
        submitted_by: submitted_by,
        assets: assets,
        template_data: template,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
      return res.status(500).json({ error: 'Failed to create job record' });
    }

    // Calculate total duration for the video
    const totalDuration = template.parts?.reduce((total: number, part: any) => total + part.duration, 0) || 10;
    const totalFrames = totalDuration * 60; // 60fps

    // Create assets lookup object
    const assetsLookup: { [key: string]: any } = {};
    assetData.forEach(asset => {
      assetsLookup[asset.id] = {
        id: asset.id,
        type: asset.type,
        file_url: asset.file_url,
        theme: asset.theme,
        metadata: asset.metadata,
      };
    });

    // Prepare input props for Remotion
    let inputProps;
    let compositionId;
    
    if (req.body.use_image_composition) {
      // Use HelloWorldWithImage composition
      compositionId = 'HelloWorldWithImage';
      inputProps = {
        backgroundImageUrl: req.body.background_image_url || 'https://picsum.photos/1920/1080'
      };
    } else if (use_simple_composition) {
      // Use simple HelloWorld composition
      compositionId = 'HelloWorld';
      inputProps = {};
    } else {
      // Use UniversalTemplate composition
      compositionId = 'UniversalTemplate';
      inputProps = {
        childName: child_name,
        template: {
          id: template.id,
          name: template.name,
          template_type: template.template_type,
          global_elements: template.global_elements || [],
          parts: template.parts || [],
        },
        assets: assetsLookup,
        theme,
        age,
      };
    }

    // Start Remotion Lambda render
    try {
      console.log('Starting Remotion Lambda render...');
      console.log('Function name:', process.env.AWS_LAMBDA_REMOTION_FUNCTION);
      console.log('Site URL:', process.env.REMOTION_SITE_URL);
      console.log('Input props:', JSON.stringify(inputProps, null, 2));

      const result = await renderMediaOnLambda({
        region: (process.env.AWS_REGION || 'us-east-1') as any,
        functionName: process.env.AWS_LAMBDA_REMOTION_FUNCTION!,
        serveUrl: process.env.REMOTION_SITE_URL!,
        composition: compositionId,
        inputProps,
        codec: 'h264',
        imageFormat: 'jpeg',
        ...(process.env.REMOTION_WEBHOOK_URL ? { webhook: { url: process.env.REMOTION_WEBHOOK_URL, secret: null } } : {}),
      });

      console.log('Remotion Lambda render started:', result);

      // Update job status to 'submitted' with render ID
      await supabaseAdmin
        .from('video_generation_jobs')
        .update({ 
          status: 'submitted',
          lambda_request_id: result.renderId,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', jobRecord.id);

      return res.status(200).json({
        success: true,
        job_id: jobRecord.id,
        render_id: result.renderId,
        message: 'Video generation job submitted successfully',
      });

    } catch (lambdaError) {
      console.error('Remotion Lambda render error:', lambdaError);
      
      // Update job status to 'failed'
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
    console.error('Video generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 