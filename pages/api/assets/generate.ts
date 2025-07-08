import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { AIService } from '@/lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assetId, projectId } = req.body;

    // If assetId is provided, generate that specific asset
    if (assetId) {
      const result = await generateSingleAsset(assetId);
      return res.status(200).json(result);
    }

    // If projectId is provided, generate all pending assets for that project
    if (projectId) {
      const result = await generateProjectAssets(projectId);
      return res.status(200).json(result);
    }

    // Otherwise, generate all pending assets
    const result = await generateAllPendingAssets();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Asset generation error:', error);
    return res.status(500).json({ error: 'Failed to generate assets' });
  }
}

async function generateSingleAsset(assetId: string) {
  // Get the asset
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (fetchError || !asset) {
    throw new Error('Asset not found');
  }

  if (asset.status !== 'pending') {
    throw new Error('Asset is not in pending status');
  }

  // Update status to generating
  await supabase
    .from('assets')
    .update({ status: 'generating' })
    .eq('id', assetId);

  try {
    let generatedUrl: string | null = null;

    // Generate based on asset type
    if (asset.type === 'image') {
      generatedUrl = await AIService.generateImage(
        asset.prompt || `Create a child-friendly image for theme: ${asset.theme}`,
        'pixar',
        'center'
      );
    } else if (asset.type === 'audio') {
      // For now, we'll use a placeholder for audio generation
      // You can integrate with ElevenLabs or other TTS services here
      generatedUrl = await generateAudioPlaceholder(asset.prompt || asset.theme);
    }

    if (generatedUrl) {
      // Update asset with generated URL and completed status
      const { error: updateError } = await supabase
        .from('assets')
        .update({ 
          status: 'completed',
          url: generatedUrl,
          metadata: {
            ...asset.metadata,
            generated_at: new Date().toISOString(),
            generation_method: asset.type === 'image' ? 'fal.ai' : 'placeholder'
          }
        })
        .eq('id', assetId);

      if (updateError) throw updateError;

      return { 
        success: true, 
        assetId, 
        url: generatedUrl,
        type: asset.type 
      };
    } else {
      throw new Error('Failed to generate content');
    }

  } catch (error) {
    // Update status back to pending on error
    await supabase
      .from('assets')
      .update({ 
        status: 'pending',
        metadata: {
          ...asset.metadata,
          last_error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .eq('id', assetId);

    throw error;
  }
}

async function generateProjectAssets(projectId: string) {
  // Get all pending assets for the project
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending');

  if (error) throw error;

  const results = [];
  for (const asset of assets || []) {
    try {
      const result = await generateSingleAsset(asset.id);
      results.push(result);
    } catch (error) {
      results.push({ 
        success: false, 
        assetId: asset.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return { 
    success: true, 
    projectId, 
    results,
    total: assets?.length || 0,
    successful: results.filter(r => r.success).length
  };
}

async function generateAllPendingAssets() {
  // Get all pending assets
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'pending')
    .limit(10); // Limit to prevent overwhelming the system

  if (error) throw error;

  const results = [];
  for (const asset of assets || []) {
    try {
      const result = await generateSingleAsset(asset.id);
      results.push(result);
    } catch (error) {
      results.push({ 
        success: false, 
        assetId: asset.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return { 
    success: true, 
    results,
    total: assets?.length || 0,
    successful: results.filter(r => r.success).length
  };
}

async function generateAudioPlaceholder(prompt: string): Promise<string> {
  // Placeholder for audio generation
  // In a real implementation, you would integrate with:
  // - ElevenLabs for TTS
  // - Suno for music generation
  // - Or other audio generation services
  
  // For now, return a placeholder URL
  return `https://via.placeholder.com/300x100/4F46E5/FFFFFF?text=Audio+Generated+for:+${encodeURIComponent(prompt)}`;
} 