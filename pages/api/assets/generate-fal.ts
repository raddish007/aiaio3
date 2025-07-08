import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { FalAIService, ImageGenerationRequest, AudioGenerationRequest } from '@/lib/fal-ai';

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

    if (!promptId || !assetType || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: promptId, assetType, prompt' });
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

    // Get the prompt from database
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (promptError || !promptData) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Note: We now allow reusing prompts intentionally, so we don't check if it's already used

    let generationJob;
    let assetData: any = {};

    // Generate asset based on type
    if (assetType === 'image') {
      const imageRequest: ImageGenerationRequest = {
        prompt: prompt,
        aspectRatio: '16:9', // Hardcoded to 16:9 for proper context
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

        assetData = {
          type: 'image',
          theme: promptData.theme,
          tags: [style, safeZone].filter(Boolean),
          status: 'pending',
          file_url: imageUrl,
          metadata: {
            ...promptData.metadata,
            generated_at: new Date().toISOString(),
            generation_method: 'fal.ai_imagen4',
            job_id: generationJob.jobId,
            aspect_ratio: aspectRatio,
            style: style,
            safe_zone: safeZone,
            seed: generationJob.result.seed,
          },
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

        assetData = {
          type: 'audio',
          theme: promptData.theme,
          tags: [style].filter(Boolean),
          status: 'pending',
          file_url: audioUrl,
          metadata: {
            ...promptData.metadata,
            generated_at: new Date().toISOString(),
            generation_method: 'fal.ai_flux',
            job_id: generationJob.jobId,
            duration: duration,
            style: style,
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

    // Note: We no longer mark prompts as used to allow reusing them

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