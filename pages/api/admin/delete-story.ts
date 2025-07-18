import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storyId } = req.body;

    if (!storyId) {
      return res.status(400).json({ error: 'Story ID is required' });
    }

    console.log(`🗑️ [API] Deleting story ${storyId} with admin privileges...`);

    // First, verify the story exists
    const { data: storyCheck, error: checkError } = await supabaseAdmin
      .from('content_projects')
      .select('id, title')
      .eq('id', storyId)
      .single();

    if (checkError) {
      console.error('❌ [API] Story not found:', checkError);
      return res.status(404).json({ error: `Story not found: ${checkError.message}` });
    }

    console.log(`✅ [API] Story found:`, storyCheck);

    // Get all assets for this project
    const { data: projectAssets, error: fetchError } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('project_id', storyId);

    if (fetchError) {
      console.error('❌ [API] Error fetching assets:', fetchError);
      return res.status(500).json({ error: `Failed to fetch assets: ${fetchError.message}` });
    }

    console.log(`📄 [API] Found ${projectAssets?.length || 0} assets to delete`);

    // Get all prompts for this project
    const { data: projectPrompts, error: promptsError } = await supabaseAdmin
      .from('prompts')
      .select('id')
      .eq('project_id', storyId);

    if (promptsError) {
      console.error('❌ [API] Error fetching prompts:', promptsError);
      return res.status(500).json({ error: `Failed to fetch prompts: ${promptsError.message}` });
    }

    console.log(`📝 [API] Found ${projectPrompts?.length || 0} prompts to delete`);

    // Delete asset generation jobs first (handles all foreign key dependencies)
    let deletedJobs: any[] = [];
    
    // Collect all IDs that could be referenced in asset_generation_jobs
    const allAssetIds = projectAssets?.map(asset => asset.id) || [];
    const allPromptIds = projectPrompts?.map(prompt => prompt.id) || [];
    
    if (allAssetIds.length > 0 || allPromptIds.length > 0) {
      console.log('🔗 [API] Deleting asset generation jobs with all FK references...');
      
      // Delete jobs by asset_id
      if (allAssetIds.length > 0) {
        const { data: jobsData1, error: jobsError1 } = await supabaseAdmin
          .from('asset_generation_jobs')
          .delete()
          .in('asset_id', allAssetIds)
          .select('id');

        if (jobsError1) {
          console.error('⚠️ [API] Error deleting jobs by asset_id (continuing):', jobsError1);
        } else {
          console.log(`✅ [API] Deleted ${jobsData1?.length || 0} jobs by asset_id`);
          deletedJobs.push(...(jobsData1 || []));
        }

        // Delete jobs by output_asset_id
        const { data: jobsData2, error: jobsError2 } = await supabaseAdmin
          .from('asset_generation_jobs')
          .delete()
          .in('output_asset_id', allAssetIds)
          .select('id');

        if (jobsError2) {
          console.error('⚠️ [API] Error deleting jobs by output_asset_id (continuing):', jobsError2);
        } else {
          console.log(`✅ [API] Deleted ${jobsData2?.length || 0} jobs by output_asset_id`);
          deletedJobs.push(...(jobsData2 || []));
        }
      }

      // Delete jobs by prompt_id
      if (allPromptIds.length > 0) {
        const { data: jobsData3, error: jobsError3 } = await supabaseAdmin
          .from('asset_generation_jobs')
          .delete()
          .in('prompt_id', allPromptIds)
          .select('id');

        if (jobsError3) {
          console.error('⚠️ [API] Error deleting jobs by prompt_id (continuing):', jobsError3);
        } else {
          console.log(`✅ [API] Deleted ${jobsData3?.length || 0} jobs by prompt_id`);
          deletedJobs.push(...(jobsData3 || []));
        }
      }

      console.log(`✅ [API] Total deleted jobs: ${deletedJobs.length}`);
    }

    // Delete all prompts
    let deletedPrompts: any[] = [];
    if (projectPrompts && projectPrompts.length > 0) {
      const { data: promptsData, error: promptsDeleteError } = await supabaseAdmin
        .from('prompts')
        .delete()
        .eq('project_id', storyId)
        .select('id');

      if (promptsDeleteError) {
        console.error('⚠️ [API] Error deleting prompts (continuing):', promptsDeleteError);
      } else {
        deletedPrompts = promptsData || [];
        console.log(`✅ [API] Deleted ${deletedPrompts.length} prompts`);
      }
    }

    // Delete all assets
    const { data: deletedAssets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('project_id', storyId)
      .select('id');

    if (assetsError) {
      console.error('⚠️ [API] Error deleting assets (continuing):', assetsError);
    } else {
      console.log(`✅ [API] Deleted ${deletedAssets?.length || 0} assets`);
    }

    // Finally, delete the content project (this will work with service role)
    const { data: deletedProject, error: projectError } = await supabaseAdmin
      .from('content_projects')
      .delete()
      .eq('id', storyId)
      .select('id');

    if (projectError) {
      console.error('❌ [API] Error deleting project:', projectError);
      return res.status(500).json({ error: `Failed to delete project: ${projectError.message}` });
    }

    if (!deletedProject || deletedProject.length === 0) {
      console.error('❌ [API] Project deletion returned empty result');
      return res.status(500).json({ error: 'Project was not deleted (unknown reason)' });
    }

    console.log(`✅ [API] Successfully deleted project:`, deletedProject);

    return res.status(200).json({ 
      success: true, 
      message: 'Story and all associated data deleted successfully',
      deletedProject: deletedProject[0],
      deletedAssets: deletedAssets?.length || 0,
      deletedPrompts: deletedPrompts?.length || 0,
      deletedJobs: deletedJobs.length
    });

  } catch (error) {
    console.error('💥 [API] Error in delete story:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
