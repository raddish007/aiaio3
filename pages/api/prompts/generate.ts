import { NextApiRequest, NextApiResponse } from 'next';
import { PromptGenerator, PromptContext } from '@/lib/prompt-generator';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      childName,
      theme,
      ageRange,
      template,
      personalization = 'general',
      safeZones = ['center_safe'],
      promptCount = 1,
      aspectRatio = '16:9',
      artStyle = '2D Pixar Style',
      customArtStyle = '',
      additionalContext,
      projectId,
      assetType,
      imageType, // New structured field
      targetLetter // Add target letter for letter hunt
    } = req.body;

    // Validate required fields
    if (!ageRange || !template) {
      return res.status(400).json({ 
        error: 'Missing required fields: ageRange, template' 
      });
    }

    // Theme is required unless it's a letter-hunt template with general personalization
    if (!theme && !(template === 'letter-hunt' && personalization === 'general')) {
      return res.status(400).json({ 
        error: 'Missing required field: theme' 
      });
    }

    // Validate template
    if (!['lullaby', 'name-video', 'educational', 'name-show', 'letter-hunt'].includes(template)) {
      return res.status(400).json({ 
        error: 'Invalid template. Must be "lullaby", "name-video", "educational", "name-show", or "letter-hunt"' 
      });
    }

    // Validate safe zones
    const validSafeZones = ['left_safe', 'right_safe', 'center_safe', 'intro_safe', 'outro_safe', 'all_ok', 'not_applicable', 'frame', 'slideshow'];
    const selectedSafeZones = Array.isArray(safeZones) ? safeZones.filter((z) => validSafeZones.includes(z)) : [safeZones];
    if (selectedSafeZones.length === 0) {
      return res.status(400).json({ error: 'At least one valid safe zone must be selected.' });
    }

    // Validate aspect ratio
    const validAspectRatios = ['16:9', '9:16'];
    const selectedAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    // Clamp prompt count
    const count = Math.max(1, Math.min(10, Number(promptCount)));

    // Generate prompts for each safe zone (and aspect ratio)
    const allPrompts: any = {};
    for (const safeZone of selectedSafeZones) {
              const context: PromptContext = {
          childName,
          theme,
          ageRange,
          template,
          personalization,
          safeZone,
          aspectRatio: selectedAspectRatio,
          artStyle: artStyle === 'Other' ? customArtStyle : artStyle,
          promptCount: count,
          additionalContext,
          assetType, // Keep for backward compatibility
          imageType: imageType || assetType, // Use imageType if available, fallback to assetType
          targetLetter // Add target letter for letter hunt
        };
      // Generate prompts for this safe zone and aspect ratio
      const prompts = await PromptGenerator.generatePrompts(context);
      allPrompts[safeZone] = prompts;
    }

    // Always save prompts to database
    let targetProjectId = projectId;
    try {
      if (supabaseAdmin) {
        targetProjectId = projectId || await createStandaloneProject(theme, template, selectedSafeZones);
        await savePromptsToDatabase(targetProjectId, allPrompts);
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - prompts not saved to database');
      }
    } catch (error) {
      console.error('Error saving prompts to database:', error);
      // Continue even if saving fails
    }

    return res.status(200).json({
      success: true,
      prompts: allPrompts,
      projectId: targetProjectId,
      isStandalone: !projectId
    });

  } catch (error) {
    console.error('Error generating prompts:', error);
    return res.status(500).json({ 
      error: 'Failed to generate prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function savePromptsToDatabase(projectId: string, allPrompts: any) {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  try {
    // Save the generated prompts to the prompts table
    const promptRecords = [];

    // Process each safe zone
    for (const [safeZone, prompts] of Object.entries(allPrompts)) {
      const promptData = prompts as any;

      // Save image prompts
      for (const prompt of promptData.images) {
        promptRecords.push({
          asset_type: 'image',
          theme: promptData.metadata.theme,
          style: promptData.metadata.artStyle || '2D Pixar Style',
          safe_zone: safeZone,
          prompt_text: prompt,
          status: 'pending',
          project_id: projectId,
          metadata: {
            template: promptData.metadata.template,
            imageType: promptData.metadata.imageType || 'characterImage', // Store the new imageType
            safeZone: safeZone,
            theme: promptData.metadata.theme,
            ageRange: promptData.metadata.ageRange,
            aspectRatio: promptData.metadata.aspectRatio,
            artStyle: promptData.metadata.artStyle,
            targetLetter: promptData.metadata.targetLetter, // Include target letter in metadata
            generatedAt: promptData.metadata.generatedAt
          }
        });
      }
    }

    // Check for existing prompts to avoid duplicates
    const existingPrompts = new Set();
    if (promptRecords.length > 0) {
      const { data: existing } = await supabaseAdmin
        .from('prompts')
        .select('prompt_text')
        .in('prompt_text', promptRecords.map(p => p.prompt_text));
      
      if (existing) {
        existing.forEach(p => existingPrompts.add(p.prompt_text));
      }
    }

    // Filter out duplicates
    const uniquePrompts = promptRecords.filter(p => !existingPrompts.has(p.prompt_text));

    if (uniquePrompts.length === 0) {
      console.log('No new unique prompts to save');
      return { success: true, promptCount: 0, duplicatesSkipped: promptRecords.length };
    }

    // Insert only unique prompts
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .insert(uniquePrompts)
      .select();

    if (error) {
      console.error('Error saving prompts to database:', error);
      throw error;
    }

    console.log(`Saved ${data?.length || 0} new prompts to database${promptRecords.length - uniquePrompts.length > 0 ? ` (skipped ${promptRecords.length - uniquePrompts.length} duplicates)` : ''}`);

    // Update project status
    await supabaseAdmin
      .from('content_projects')
      .update({ 
        status: 'prompts_generated',
        metadata: {
          promptCount: data?.length || 0,
          safeZones: Object.keys(allPrompts),
          duplicatesSkipped: promptRecords.length - uniquePrompts.length
        }
      })
      .eq('id', projectId);

    return { success: true, promptCount: data?.length || 0, duplicatesSkipped: promptRecords.length - uniquePrompts.length };

  } catch (error) {
    console.error('Error in savePromptsToDatabase:', error);
    throw error;
  }
}

async function createStandaloneProject(theme: string, template: string, safeZones: string[]): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  try {
    // Create a standalone project for prompts generated without a specific project
    const { data, error } = await supabaseAdmin
      .from('content_projects')
      .insert({
        title: `Standalone - ${theme}`,
        theme: theme,
        target_age: '2-4', // Default age range
        duration: 60, // Default duration
        status: 'prompts_generated'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating standalone project:', error);
      throw error;
    }

    console.log(`Created standalone project: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('Error in createStandaloneProject:', error);
    throw error;
  }
} 