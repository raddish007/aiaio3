import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { FalAIService, ImageGenerationRequest, AudioGenerationRequest } from '@/lib/fal-ai';
import { extractAudioDurationFromUrl, downloadAndUploadImage } from '@/lib/asset-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Asset generation request received:', {
    promptId: req.body.promptId,
    assetType: req.body.assetType,
    prompt: req.body.prompt?.substring(0, 50) + '...',
  });

  // Debug environment variables
  console.log('Environment variables in API:', {
    FAL_AI_API_KEY: process.env.FAL_AI_API_KEY ? 'SET' : 'NOT SET',
    FAL_KEY: process.env.FAL_KEY ? 'SET' : 'NOT SET',
    FAL_API_KEY: process.env.FAL_API_KEY ? 'SET' : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('FAL'))
  });

  try {
    const { promptId, assetType, prompt, aspectRatio, duration, style, safeZone } = req.body;

    if (!assetType || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: assetType, prompt' });
    }

    // Check if FAL_AI_API_KEY, FAL_KEY, or FAL_API_KEY is configured
    const falApiKey = process.env.FAL_AI_API_KEY || process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (!falApiKey) {
      console.log('Environment variables check:', {
        FAL_AI_API_KEY: process.env.FAL_AI_API_KEY ? 'SET' : 'NOT SET',
        FAL_KEY: process.env.FAL_KEY ? 'SET' : 'NOT SET',
        FAL_API_KEY: process.env.FAL_API_KEY ? 'SET' : 'NOT SET'
      });
      return res.status(500).json({ 
        error: 'FAL_AI_API_KEY, FAL_KEY, or FAL_API_KEY not configured',
        details: 'Please add your fal.ai API key to your .env.local file. You can get one from https://fal.ai/keys'
      });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    let promptData = null;
    
    // Only fetch prompt from database if promptId is provided
    if (promptId) {
      const { data, error: promptError } = await supabaseAdmin
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (promptError || !data) {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      
      promptData = data;
    }

    // Note: We now allow reusing prompts intentionally, so we don't check if it's already used

    let generationJob;
    let assetData: any = {};

    // Generate asset based on type
    if (assetType === 'image') {
      const imageRequest: ImageGenerationRequest = {
        prompt: prompt,
        aspectRatio: aspectRatio || '16:9', // Use provided aspect ratio or default to landscape
        style: style,
        safeZone: safeZone,
        model: 'imagen4', // Default to Imagen4
      };

      console.log('Starting image generation with request:', imageRequest);
      console.log('Environment check before fal.ai call:', {
        FAL_AI_API_KEY: process.env.FAL_AI_API_KEY ? 'SET' : 'NOT SET',
        FAL_KEY: process.env.FAL_KEY ? 'SET' : 'NOT SET'
      });

      // For now, use synchronous generation for simplicity
      generationJob = await FalAIService.generateImage(imageRequest);
      
      console.log('Image generation result:', {
        status: generationJob.status,
        hasResult: !!generationJob.result,
        error: generationJob.error,
      });
      
      if (generationJob.status === 'completed' && generationJob.result) {
        // Extract image URL from the new fal.ai response format
        const imageUrl = generationJob.result.images?.[0]?.url || 
                        generationJob.result.image?.url || 
                        generationJob.result.url;
        
        if (!imageUrl) {
          throw new Error('No image URL found in generation result');
        }

        // Download and upload image to Supabase storage
        const { supabaseUrl, originalUrl, fileSize } = await downloadAndUploadImage(
          imageUrl, 
          supabaseAdmin, 
          'fal.ai_imagen4'
        );

        // Handle special metadata mapping for lullaby slideshow assets
        const isLullabySlideshow = req.body.template === 'lullaby' && 
                                  (req.body.imageType === 'bedtime_scene' || safeZone === 'slideshow');
        
        const metadata = {
          ...(promptData?.metadata || {}),
          ...req.body, // Include any additional context from the request
          generated_at: new Date().toISOString(),
          generation_method: 'fal.ai_imagen4',
          job_id: generationJob.jobId,
          aspect_ratio: aspectRatio,
          style: style,
          safe_zone: safeZone,
          safeZone: safeZone, // Also set camelCase version
          seed: generationJob.result.seed,
          fal_original_url: originalUrl, // Store original FAL URL for reference
          file_size_bytes: fileSize,
        };

        // For lullaby slideshow assets, ensure correct fields are set
        if (isLullabySlideshow) {
          metadata.imageType = 'bedtime_scene';
          metadata.asset_class = 'bedtime_scene';
          metadata.template = 'lullaby';
        }

        assetData = {
          type: 'image',
          theme: promptData?.theme || req.body.theme || 'general',
          tags: [style, safeZone].filter(Boolean),
          status: 'pending',
          file_url: supabaseUrl, // Use permanent Supabase URL
          prompt: prompt, // Use the provided prompt text
          metadata: metadata,
        };
      }
    } else if (assetType === 'audio') {
      const audioRequest: AudioGenerationRequest = {
        prompt: prompt,
        duration: duration || 10,
        style: style,
      };

      // For now, use synchronous generation for simplicity
      generationJob = await FalAIService.generateAudio(audioRequest);
      
      if (generationJob.status === 'completed' && generationJob.result) {
        // Extract audio URL from the new fal.ai response format
        const audioUrl = generationJob.result.audio?.url || 
                        generationJob.result.url;
        
        if (!audioUrl) {
          throw new Error('No audio URL found in generation result');
        }

        // Download and upload audio to Supabase storage
        const { supabaseUrl, originalUrl, fileSize } = await downloadAndUploadImage(
          audioUrl, 
          supabaseAdmin, 
          'fal.ai_flux'
        );

        // Extract actual audio duration from the generated file
        let actualDuration: number | undefined;
        try {
          actualDuration = await extractAudioDurationFromUrl(supabaseUrl);
          console.log(`FAL AI audio duration extracted: ${actualDuration?.toFixed(2)} seconds`);
        } catch (durationError) {
          console.warn('Failed to extract FAL AI audio duration:', durationError);
          // Use requested duration as fallback
          actualDuration = duration;
        }

        assetData = {
          type: 'audio',
          theme: promptData?.theme || req.body.theme || 'general',
          tags: [style].filter(Boolean),
          status: 'pending',
          file_url: supabaseUrl, // Use permanent Supabase URL
          prompt: prompt, // Use the provided prompt text
          metadata: {
            ...(promptData?.metadata || {}),
            ...req.body, // Include any additional context from the request
            generated_at: new Date().toISOString(),
            generation_method: 'fal.ai_flux',
            job_id: generationJob.jobId,
            duration: actualDuration, // Use extracted duration
            requested_duration: duration, // Keep original requested duration
            style: style,
            fal_original_url: originalUrl, // Store original FAL URL for reference
            file_size_bytes: fileSize,
          },
        };
      }
    } else {
      return res.status(400).json({ error: 'Unsupported asset type' });
    }

    if (generationJob.status === 'failed') {
      return res.status(500).json({ 
        error: 'Generation failed', 
        details: generationJob.error 
      });
    }

    // Create asset generation job record
    const { data: jobRecord, error: jobError } = await supabaseAdmin
      .from('asset_generation_jobs')
      .insert({
        prompt_id: promptId,
        status: generationJob.status,
        started_at: generationJob.createdAt,
        completed_at: generationJob.completedAt,
        error_message: generationJob.error,
        output_asset_id: null, // Will be updated after asset creation
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
      return res.status(500).json({ error: 'Failed to create job record' });
    }

    // Create the asset record
    const { data: assetRecord, error: assetError } = await supabaseAdmin
      .from('assets')
      .insert(assetData)
      .select()
      .single();

    if (assetError) {
      console.error('Error creating asset:', assetError);
      return res.status(500).json({ error: 'Failed to create asset' });
    }

    // Update job record with asset ID
    await supabaseAdmin
      .from('asset_generation_jobs')
      .update({ output_asset_id: assetRecord.id })
      .eq('id', jobRecord.id);

    // Mark prompt as completed when asset is successfully created (only if we have a real promptId)
    if (promptId && promptData) {
      await supabaseAdmin
        .from('prompts')
        .update({ 
          status: 'completed',
          metadata: {
            ...(promptData.metadata || {}),
            completed_at: new Date().toISOString(),
            used_for_asset_id: assetRecord.id
          }
        })
        .eq('id', promptId);
    }

    return res.status(200).json({
      success: true,
      job: jobRecord,
      asset: assetRecord,
      generationJob: {
        id: generationJob.id,
        status: generationJob.status,
        jobId: generationJob.jobId,
      },
    });

  } catch (error) {
    console.error('Asset generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 