import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      pages, 
      batchSize, 
      projectId, 
      storyVariables, 
      generatedPrompts 
    }: { 
      pages: string[]; 
      batchSize?: number;
      projectId?: string;
      storyVariables?: any;
      generatedPrompts?: any;
    } = req.body;

    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'Missing required field: pages' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Missing required field: projectId (story context)' });
    }

    // FOR TESTING: Generate only 1 image at a time to avoid API waste
    const maxBatchSize = 1; // FIXED TO 1 FOR TESTING
    const actualPages = pages.slice(0, maxBatchSize);
    
    console.log(`🎨 Generating ${actualPages.length} image(s) for Wish Button story: ${actualPages.join(', ')}`);
    console.log(`📖 Project ID: ${projectId}`);
    console.log(`⚠️ LIMITED TO 1 IMAGE FOR TESTING - Generating: ${actualPages[0]}`);

    const generationResults: { [key: string]: { jobId: string; status: string; error?: string } } = {};

    // Generate only the first image for testing
    const page = actualPages[0];
    
    try {
      console.log(`🎯 Starting single image generation for ${page}...`);
      
      const result = await generatePageImage(page, projectId, storyVariables, generatedPrompts);
      generationResults[page] = result;
      
      console.log(`✅ Generated image for ${page}: ${result.status}`);
      
    } catch (error) {
      console.error(`❌ Error generating image for ${page}:`, error);
      generationResults[page] = {
        jobId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return res.status(200).json({
      success: true,
      generations: generationResults,
      message: `Generated 1 image for testing. Page: ${page}`
    });

  } catch (error) {
    console.error('💥 Error in image generation:', error);
    
    const errorDetails = error instanceof Error ? error : new Error('Unknown error occurred');
    return res.status(500).json({
      error: 'Failed to generate image',
      details: errorDetails.message,
      debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
}

async function generatePageImage(
  page: string, 
  projectId: string, 
  storyVariables?: any, 
  generatedPrompts?: any
): Promise<{ jobId: string; status: string }> {
  try {
    console.log(`🔍 Looking for image prompt for ${page} in project ${projectId}...`);
    
    // Get the latest prompt from database for this page and project
    const { data: prompts, error: promptError } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('asset_type', 'image')
      .eq('project_id', projectId)
      .ilike('metadata->>page', page)
      .eq('metadata->>template', 'wish-button')
      .order('created_at', { ascending: false })
      .limit(1);

    if (promptError) {
      console.error(`❌ Database error looking for prompt for ${page}:`, promptError);
      throw new Error(`Database error looking for prompt for ${page}: ${promptError.message}`);
    }

    if (!prompts || prompts.length === 0) {
      console.error(`❌ No image prompt found for ${page}`);
      throw new Error(`No image prompt found for ${page}. Please generate prompts first before generating images.`);
    }

    const prompt = prompts[0];
    console.log(`📝 Found prompt ${prompt.id} for ${page}:`, {
      promptText: prompt.prompt_text.substring(0, 100) + '...',
      theme: prompt.theme,
      project_id: prompt.project_id
    });

    // Call the existing asset generation API (same as Letter Hunt and ai-generator)
    const requestBody = {
      promptId: prompt.id,
      assetType: 'image',
      prompt: prompt.prompt_text,
      aspectRatio: '16:9',
      style: 'pixar_3d',
      safeZone: 'center_safe',
      imageType: 'storybook_page',
      template: 'wish-button',
      theme: prompt.theme,
      page: page,
      // Pass through metadata
      childName: prompt.metadata?.childName,
      ageRange: prompt.metadata?.ageRange,
      additionalContext: prompt.metadata?.additionalContext
    };

    console.log(`🎨 Calling asset generation API for ${page}...`);
    
    // Use localhost for internal API calls during development
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/assets/generate-fal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Asset generation API error for ${page}:`, response.status, errorText);
      throw new Error(`Asset generation failed for ${page}: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error(`❌ Asset generation returned error for ${page}:`, result);
      throw new Error(`Asset generation failed for ${page}: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ Successfully generated image for ${page}:`, {
      jobId: result.generationJob?.jobId,
      assetId: result.asset?.id,
      status: result.generationJob?.status
    });

    return {
      jobId: result.generationJob?.jobId || `generated_${Date.now()}`,
      status: result.generationJob?.status || 'completed'
    };

  } catch (error) {
    console.error(`💥 Error generating image for ${page}:`, error);
    throw error;
  }
}
