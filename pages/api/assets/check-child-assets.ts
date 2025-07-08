import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Child asset check request received:', {
    childId: req.body.childId,
    projectId: req.body.projectId,
  });

  try {
    const { childId, projectId } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'Missing required field: childId' });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database admin client not available' });
    }

    // Get child information
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !childData) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Get projects for this child
    let projectsQuery = supabaseAdmin
      .from('content_projects')
      .select('*')
      .eq('child_id', childId);

    if (projectId) {
      projectsQuery = projectsQuery.eq('id', projectId);
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    // Get existing assets for this child
    const { data: existingAssets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('child_id', childId);

    if (assetsError) {
      console.error('Error fetching existing assets:', assetsError);
      return res.status(500).json({ error: 'Failed to fetch existing assets' });
    }

    // Analyze what assets are needed based on project templates
    const requiredAssets: any[] = [];
    const existingAssetTypes = existingAssets?.map(asset => asset.type) || [];

    projects?.forEach(project => {
      const template = project.template;
      
      // Define required assets based on template type
      switch (template) {
        case 'lullaby':
          // Lullaby template needs: background music, voiceover
          if (!existingAssetTypes.includes('audio')) {
            requiredAssets.push({
              type: 'audio',
              description: 'Lullaby background music',
              template: 'lullaby',
              priority: 'high',
              status: 'missing'
            });
          }
          if (!existingAssetTypes.includes('voiceover')) {
            requiredAssets.push({
              type: 'voiceover',
              description: 'Calming voiceover for lullaby',
              template: 'lullaby',
              priority: 'high',
              status: 'missing'
            });
          }
          break;

        case 'name_video':
          // Name video template needs: character images, name pronunciation
          if (!existingAssetTypes.includes('image')) {
            requiredAssets.push({
              type: 'image',
              description: 'Character images for name video',
              template: 'name_video',
              priority: 'high',
              status: 'missing'
            });
          }
          if (!existingAssetTypes.includes('audio')) {
            requiredAssets.push({
              type: 'audio',
              description: 'Name pronunciation audio',
              template: 'name_video',
              priority: 'high',
              status: 'missing'
            });
          }
          break;

        case 'educational':
          // Educational template needs: educational images, narration
          if (!existingAssetTypes.includes('image')) {
            requiredAssets.push({
              type: 'image',
              description: 'Educational content images',
              template: 'educational',
              priority: 'medium',
              status: 'missing'
            });
          }
          if (!existingAssetTypes.includes('audio')) {
            requiredAssets.push({
              type: 'audio',
              description: 'Educational narration',
              template: 'educational',
              priority: 'medium',
              status: 'missing'
            });
          }
          break;

        default:
          // Generic template needs: images, audio
          if (!existingAssetTypes.includes('image')) {
            requiredAssets.push({
              type: 'image',
              description: 'General content images',
              template: 'generic',
              priority: 'medium',
              status: 'missing'
            });
          }
          if (!existingAssetTypes.includes('audio')) {
            requiredAssets.push({
              type: 'audio',
              description: 'General audio content',
              template: 'generic',
              priority: 'medium',
              status: 'missing'
            });
          }
      }
    });

    // Check which required assets already exist
    const updatedRequiredAssets = requiredAssets.map(asset => {
      const existing = existingAssets?.find(existingAsset => 
        existingAsset.type === asset.type && 
        existingAsset.metadata?.template === asset.template
      );
      
      return {
        ...asset,
        status: existing ? 'exists' : 'missing',
        existingAssetId: existing?.id
      };
    });

    // Get project-specific assets if projectId is provided
    let projectAssets: any[] = [];
    if (projectId) {
      const { data: projectAssetData, error: projectAssetError } = await supabaseAdmin
        .from('project_assets')
        .select(`
          *,
          assets (*)
        `)
        .eq('project_id', projectId);

      if (!projectAssetError && projectAssetData) {
        projectAssets = projectAssetData.map(pa => pa.assets).filter(Boolean);
      }
    }

    console.log('Asset check completed for child:', childId);

    return res.status(200).json({
      success: true,
      child: childData,
      projects: projects || [],
      requiredAssets: updatedRequiredAssets,
      existingAssets: existingAssets || [],
      projectAssets: projectAssets,
      summary: {
        totalProjects: projects?.length || 0,
        missingAssets: updatedRequiredAssets.filter(asset => asset.status === 'missing').length,
        existingAssets: existingAssets?.length || 0,
      }
    });

  } catch (error) {
    console.error('Child asset check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check child assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 