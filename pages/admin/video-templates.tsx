import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  getAssetSafeZones,
  isAssetAppropriateForTemplate,
  isAssetThemeAppropriate,
  getThemeRelevanceScore
} from '@/lib/asset-utils';
import AudioPlayer from '@/components/admin/AudioPlayer';

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  type: 'lullaby' | 'name-video' | 'letter-hunt' | 'custom';
  structure: VideoPart[];
  created_at: string;
  updated_at: string;
}

interface VideoPart {
  id: string;
  name: string;
  type: 'intro' | 'slideshow' | 'outro';
  order: number;
  duration: number; // in seconds
  requiredAssets: PartAsset[];
}

interface PartAsset {
  id: string;
  purpose: string;
  description: string;
  type: 'audio' | 'image' | 'video';
  formats: string[];
  required: boolean;
  multiple_allowed: boolean;
  max_count?: number;
  safe_zone?: string;
  default_prompt?: string;
  personalization_type?: 'generic' | 'name_substitution' | 'child_specific';
  placeholder_text?: string; // e.g., "[Name]" for name substitution
  assigned_asset_id?: string;
  assigned_asset?: any;
  personalized_prompt?: string; // Generated prompt with child's name
}

interface AssetAssignment {
  template_id: string;
  asset_purpose: string;
  assigned_asset_id?: string;
  assigned_asset?: any;
}

export default function VideoTemplates() {
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssetAssignmentModal, setShowAssetAssignmentModal] = useState(false);
  const [selectedAssetPurpose, setSelectedAssetPurpose] = useState<PartAsset | null>(null);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetFilter, setAssetFilter] = useState<'all' | 'general' | 'template_specific'>('all');
  const [assetAssignments, setAssetAssignments] = useState<{[key: string]: any}>({}); // Track assignments by template_id:asset_purpose

  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    handleAssetSearch(assetSearchTerm);
  }, [assetFilter, availableAssets]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
    fetchTemplates();
  };

  const fetchTemplates = async () => {
    try {
      // Try to fetch templates from database first
      const { data: dbTemplates, error: dbError } = await supabase
        .from('video_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching templates from database:', dbError);
        // If there's a database error, fall back to default templates
        console.log('Falling back to default templates due to database error');
      }

      if (dbTemplates && dbTemplates.length > 0) {
        // Load templates from database
        const loadedTemplates: VideoTemplate[] = dbTemplates.map(dbTemplate => ({
          id: dbTemplate.id,
          name: dbTemplate.name,
          description: dbTemplate.description,
          type: dbTemplate.type,
          structure: dbTemplate.structure,
          created_at: dbTemplate.created_at,
          updated_at: dbTemplate.updated_at
        }));

        // Load asset assignments for each template
        for (const template of loadedTemplates) {
          const { data: assignments } = await supabase
            .from('template_asset_assignments')
            .select(`
              asset_purpose,
              assigned_asset_id,
              assets!inner(*)
            `)
            .eq('template_id', template.id);

          if (assignments) {
            // Update template structure with assigned assets
            template.structure = template.structure.map(part => ({
              ...part,
              requiredAssets: part.requiredAssets.map(asset => {
                const assignment = assignments.find(a => a.asset_purpose === asset.purpose);
                if (assignment) {
                  return {
                    ...asset,
                    assigned_asset_id: assignment.assigned_asset_id,
                    assigned_asset: assignment.assets
                  };
                }
                return asset;
              })
            }));
          }
        }

        setTemplates(loadedTemplates);
      } else {
        // Create default templates if none exist in database
        const defaultTemplates: VideoTemplate[] = [
          {
            id: uuidv4(),
            name: 'Lullaby Video',
            description: 'Gentle bedtime videos with calming music and soothing visuals',
            type: 'lullaby',
            structure: [
              {
                id: 'intro',
                name: 'Intro',
                type: 'intro',
                order: 1,
                duration: 5,
                requiredAssets: [
                  {
                    id: 'bg_music',
                    purpose: 'background_music',
                    description: 'Background music (dreamdrip song)',
                    type: 'audio',
                    formats: ['wav', 'mp3'],
                    required: true,
                    multiple_allowed: false,
                    safe_zone: 'slideshow',
                    default_prompt: 'Create a gentle, calming lullaby background music. Soft, soothing melody with dreamy, peaceful tones suitable for children.'
                  },
                  {
                    id: 'intro_audio',
                    purpose: 'intro_audio',
                    description: 'Intro audio "Bedtime for [Name]"',
                    type: 'audio',
                    formats: ['wav', 'mp3'],
                    required: true,
                    multiple_allowed: false,
                    safe_zone: 'intro_safe',
                    default_prompt: 'Create a warm, gentle voice saying "Bedtime for [Name]" in a soothing, loving tone suitable for a child.',
                    personalization_type: 'name_substitution',
                    placeholder_text: '[Name]'
                  },
                  {
                    id: 'intro_bg',
                    purpose: 'intro_background',
                    description: 'Intro background card',
                    type: 'image',
                    formats: ['png', 'jpg', 'jpeg'],
                    required: true,
                    multiple_allowed: false,
                    safe_zone: 'intro_safe',
                    default_prompt: 'Create a gentle, calming bedtime scene for the video intro. Soft, warm colors with peaceful bedtime elements like stars, moon, or sleeping animals. 2D Pixar style, frame composition with center area empty for title text.'
                  }
                ]
              },
              {
                id: 'slideshow',
                name: 'Slideshow',
                type: 'slideshow',
                order: 2,
                duration: 10,
                requiredAssets: [
                  {
                    id: 'slideshow_images',
                    purpose: 'slideshow_image',
                    description: 'Slideshow images (multiple)',
                    type: 'image',
                    formats: ['png', 'jpg', 'jpeg'],
                    required: true,
                    multiple_allowed: true,
                    max_count: 5,
                    safe_zone: 'all_ok', // <-- update this line
                    default_prompt: 'Create a peaceful bedtime scene for the lullaby slideshow. A gentle sleeping animal or character in a calm, soothing environment. 2D Pixar style, soft colors, simple composition.'
                  }
                ]
              },
              {
                id: 'outro',
                name: 'Outro',
                type: 'outro',
                order: 3,
                duration: 5,
                requiredAssets: [
                  {
                    id: 'outro_audio',
                    purpose: 'outro_audio',
                    description: 'Outro audio "Goodnight, [Name]"',
                    type: 'audio',
                    formats: ['wav', 'mp3'],
                    required: true,
                    multiple_allowed: false,
                    safe_zone: 'outro_safe',
                    default_prompt: 'Create a warm, gentle voice saying "Goodnight, [Name]" in a soothing, loving tone suitable for a child.',
                    personalization_type: 'name_substitution',
                    placeholder_text: '[Name]'
                  },
                  {
                    id: 'outro_bg',
                    purpose: 'outro_background',
                    description: 'Outro background card',
                    type: 'image',
                    formats: ['png', 'jpg', 'jpeg'],
                    required: true,
                    multiple_allowed: false,
                    safe_zone: 'outro_safe',
                    default_prompt: 'Create a gentle, calming bedtime scene for the video outro. Soft, warm colors with peaceful bedtime elements like stars, moon, or sleeping animals. 2D Pixar style, frame composition with center area empty for ending text.'
                  }
                ]
              }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        setTemplates(defaultTemplates);
        
        // Save default templates to database
        for (const template of defaultTemplates) {
          await saveTemplateToDatabase(template);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplateToDatabase = async (template: VideoTemplate) => {
    try {
      const { data, error } = await supabase
        .from('video_templates')
        .insert({
          id: template.id,
          name: template.name,
          description: template.description,
          type: template.type,
          structure: template.structure,
          created_by: user?.id
        });

      if (error) {
        console.error('Error saving template to database:', error);
      } else {
        console.log('Template saved to database:', template.name);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const openTemplateModal = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const openAssetAssignmentModal = async (assetPurpose: PartAsset) => {
    console.log('openAssetAssignmentModal called with:', {
      assetPurpose,
      selectedTemplate: selectedTemplate?.id
    });
    
    if (!selectedTemplate) {
      alert('No template selected. Please select a template first.');
      return;
    }
    
    setSelectedAssetPurpose(assetPurpose);
    setShowAssetAssignmentModal(true);
    
    // Fetch assets for assignment with intelligent filtering
    try {
      // First, get all approved assets of the correct type
      const { data: allAssets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('type', assetPurpose.type)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        alert('Error fetching assets. Please try again.');
        return;
      }

      // Filter assets based on template requirements
      const eligibleAssets = allAssets?.filter(asset => {
        // Check if asset is appropriate for template type (primary filter)
        const isTemplateAppropriate = isAssetAppropriateForTemplate(asset, selectedTemplate.type);
        if (!isTemplateAppropriate) {
          return false;
        }

        // Only include assets that have the required safe zone
        const assetSafeZones = getAssetSafeZones(asset);
        const requiredZone = assetPurpose.safe_zone || '';
        if (requiredZone && typeof requiredZone === 'string') {
          if (!assetSafeZones.includes(requiredZone)) {
            return false;
          }
        }

        // For theme appropriateness, be lenient
        const hasAppropriateTheme = assetPurpose.purpose === 'background_music' ? 
          isAssetThemeAppropriate(asset, assetPurpose) : true;

        return hasAppropriateTheme;
      }) || [];

      // Sort by relevance (exact safe zone match first, then theme relevance)
      const sortedAssets = eligibleAssets.sort((a, b) => {
        // Exact safe zone match gets highest priority
        const aSafeZoneMatch = a.safe_zone === assetPurpose.safe_zone ? 3 : 
                              a.metadata?.safe_zone === assetPurpose.safe_zone ? 2 :
                              a.metadata?.review?.safe_zone === assetPurpose.safe_zone ? 1 : 0;
        const bSafeZoneMatch = b.safe_zone === assetPurpose.safe_zone ? 3 : 
                              b.metadata?.safe_zone === assetPurpose.safe_zone ? 2 :
                              b.metadata?.review?.safe_zone === assetPurpose.safe_zone ? 1 : 0;
        
        if (aSafeZoneMatch !== bSafeZoneMatch) {
          return bSafeZoneMatch - aSafeZoneMatch;
        }

        // Then sort by theme relevance
        const aThemeScore = getThemeRelevanceScore(a, assetPurpose);
        const bThemeScore = getThemeRelevanceScore(b, assetPurpose);
        
        return bThemeScore - aThemeScore;
      });

      console.log('Asset filtering results:', {
        assetPurpose,
        totalAssets: allAssets?.length || 0,
        eligibleAssets: eligibleAssets.length,
        safeZone: assetPurpose.safe_zone,
        templateType: selectedTemplate.type
      });

      setAvailableAssets(sortedAssets);
      setFilteredAssets(sortedAssets);
    } catch (error) {
      console.error('Error in openAssetAssignmentModal:', error);
      alert('Error opening asset assignment modal. Please try again.');
    }
  };

  const handleAssetSearch = (searchTerm: string) => {
    setAssetSearchTerm(searchTerm);
    
    let filtered = availableAssets;
    
    // Apply asset type filter
    if (assetFilter === 'general') {
      filtered = filtered.filter(asset => !asset.metadata?.template_specific);
    } else if (assetFilter === 'template_specific') {
      filtered = filtered.filter(asset => asset.metadata?.template_specific);
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(asset => 
        asset.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.metadata?.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.metadata?.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredAssets(filtered);
  };

  const assignAssetToTemplate = async (selectedAsset: any) => {
    try {
      console.log('assignAssetToTemplate called with:', {
        selectedTemplate: selectedTemplate?.id,
        selectedAssetPurpose: selectedAssetPurpose?.purpose,
        selectedAsset: selectedAsset?.id
      });
      
      if (!selectedTemplate) {
        throw new Error('No template selected');
      }
      
      if (!selectedAssetPurpose) {
        throw new Error('No asset purpose selected');
      }
      
      if (!selectedAsset) {
        throw new Error('No asset selected');
      }

      // Add detailed logging before upsert
      console.log('Assigning asset to template:', {
        template_id: selectedTemplate.id,
        asset_purpose: selectedAssetPurpose.purpose,
        assigned_asset_id: selectedAsset.id,
        assigned_by: user?.id
      });

      // Save assignment to database
      const { error: dbError } = await supabase
        .from('template_asset_assignments')
        .upsert({
          template_id: selectedTemplate.id,
          asset_purpose: selectedAssetPurpose.purpose,
          assigned_asset_id: selectedAsset.id,
          assigned_by: user?.id
        }, {
          onConflict: 'template_id,asset_purpose'
        });

      if (dbError) {
        console.error('Error saving assignment to database:', dbError);
        throw new Error('Failed to save assignment to database');
      }

      // Create assignment key
      const assignmentKey = `${selectedTemplate.id}:${selectedAssetPurpose.purpose}`;
      
      // Update assignments state
      setAssetAssignments(prev => ({
        ...prev,
        [assignmentKey]: selectedAsset
      }));

      // Update the template's required assets to show the assignment
      setTemplates(prev => prev.map(template => {
        if (template.id === selectedTemplate.id) {
          return {
            ...template,
            structure: template.structure.map(part => ({
              ...part,
              requiredAssets: part.requiredAssets.map(asset => {
                if (asset.purpose === selectedAssetPurpose.purpose) {
                  return {
                    ...asset,
                    assigned_asset_id: selectedAsset.id,
                    assigned_asset: selectedAsset
                  };
                }
                return asset;
              })
            }))
          };
        }
        return template;
      }));

      console.log(`Assigned asset ${selectedAsset.id} to template ${selectedTemplate.id} for purpose ${selectedAssetPurpose.purpose}`);
      
      alert(`Successfully assigned "${selectedAsset.theme}" to ${selectedAssetPurpose.description}`);
      
      setShowAssetAssignmentModal(false);
      setSelectedAssetPurpose(null);
    } catch (error) {
      console.error('Error assigning asset:', error);
      alert(`Error assigning asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const removeAssetAssignment = async (templateId: string, assetPurpose: string) => {
    try {
      // Remove from database
      const { error: dbError } = await supabase
        .from('template_asset_assignments')
        .delete()
        .eq('template_id', templateId)
        .eq('asset_purpose', assetPurpose);

      if (dbError) {
        console.error('Error removing assignment from database:', dbError);
        throw new Error('Failed to remove assignment from database');
      }

      // Create assignment key
      const assignmentKey = `${templateId}:${assetPurpose}`;
      
      // Remove from assignments state
      setAssetAssignments(prev => {
        const newAssignments = { ...prev };
        delete newAssignments[assignmentKey];
        return newAssignments;
      });

      // Update the template's required assets to remove the assignment
      setTemplates(prev => prev.map(template => {
        if (template.id === templateId) {
          return {
            ...template,
            structure: template.structure.map(part => ({
              ...part,
              requiredAssets: part.requiredAssets.map(asset => {
                if (asset.purpose === assetPurpose) {
                  return {
                    ...asset,
                    assigned_asset_id: undefined,
                    assigned_asset: undefined
                  };
                }
                return asset;
              })
            }))
          };
        }
        return template;
      }));

      console.log(`Removed asset assignment for template ${templateId}, purpose ${assetPurpose}`);
    } catch (error) {
      console.error('Error removing asset assignment:', error);
      alert('Error removing asset assignment. Please try again.');
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'video': return '🎬';
      default: return '📁';
    }
  };

  const getFormatDisplay = (formats: string[]) => {
    return formats.map(format => format.toUpperCase()).join(', ');
  };

  const generateRemotionComposition = (template: VideoTemplate) => {
    const compositionName = template.name.replace(/\s+/g, '') + 'Composition';
    
    const compositionCode = `import { Composition } from 'remotion';
import { ${compositionName} } from './${compositionName}';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="${template.id}"
        component={${compositionName}}
        durationInFrames={${template.structure.reduce((total, part) => total + (part.duration * 30), 0)}}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};`;

    const componentCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { interpolate } from 'remotion';

interface ${compositionName}Props {
  childName: string;
  assets: {
    backgroundMusic?: string;
    introAudio?: string;
    introImage?: string;
    slideshowImages?: string[];
    outroAudio?: string;
    outroImage?: string;
  };
}

export const ${compositionName}: React.FC<${compositionName}Props> = ({ childName, assets }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate timing for each part
  const introDuration = ${template.structure.find(p => p.type === 'intro')?.duration || 5} * fps;
  const slideshowDuration = ${template.structure.find(p => p.type === 'slideshow')?.duration || 10} * fps;
  const outroDuration = ${template.structure.find(p => p.type === 'outro')?.duration || 5} * fps;

  // Determine current part
  let currentPart = 'intro';
  let partFrame = frame;
  
  if (frame >= introDuration) {
    if (frame >= introDuration + slideshowDuration) {
      currentPart = 'outro';
      partFrame = frame - introDuration - slideshowDuration;
    } else {
      currentPart = 'slideshow';
      partFrame = frame - introDuration;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background Music */}
      {assets.backgroundMusic && (
        <audio src={assets.backgroundMusic} autoPlay loop />
      )}

      {currentPart === 'intro' && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          backgroundImage: assets.introImage ? \`url(\${assets.introImage})\` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {/* Intro Audio */}
          {assets.introAudio && frame < introDuration && (
            <audio src={assets.introAudio} autoPlay />
          )}
          
          {/* Intro Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '48px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            Bedtime for {childName}
          </div>
        </div>
      )}

      {currentPart === 'slideshow' && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%'
        }}>
          {assets.slideshowImages && assets.slideshowImages.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: \`url(\${assets.slideshowImages[Math.floor(partFrame / (slideshowDuration / assets.slideshowImages.length)) % assets.slideshowImages.length]})\`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
          )}
        </div>
      )}

      {currentPart === 'outro' && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          backgroundImage: assets.outroImage ? \`url(\${assets.outroImage})\` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {/* Outro Audio */}
          {assets.outroAudio && partFrame < outroDuration && (
            <audio src={assets.outroAudio} autoPlay />
          )}
          
          {/* Outro Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '48px',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            Goodnight, {childName}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};`;

    return { compositionCode, componentCode };
  };

  const exportTemplate = (template: VideoTemplate) => {
    const { compositionCode, componentCode } = generateRemotionComposition(template);
    
    // Create a downloadable file
    const templateData = {
      template,
      remotionCode: {
        composition: compositionCode,
        component: componentCode
      },
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checkPersonalizedAssets = async (template: VideoTemplate, childName: string) => {
    const missingAssets: PartAsset[] = [];
    
    for (const part of template.structure) {
      for (const asset of part.requiredAssets) {
        if (asset.personalization_type === 'name_substitution' || asset.personalization_type === 'child_specific') {
          // Check if personalized asset exists for this child
          const { data: existingAssets } = await supabase
            .from('assets')
            .select('*')
            .eq('type', asset.type)
            .eq('status', 'approved')
            .ilike('theme', `%${childName}%`)
            .eq('metadata->purpose', asset.purpose);

          if (!existingAssets || existingAssets.length === 0) {
            missingAssets.push({
              ...asset,
              personalized_prompt: asset.default_prompt?.replace(asset.placeholder_text || '[Name]', childName)
            });
          }
        }
      }
    }

    return missingAssets;
  };

  const generateMissingAssets = async (template: VideoTemplate, childName: string) => {
    const missingAssets = await checkPersonalizedAssets(template, childName);
    
    if (missingAssets.length === 0) {
      alert('All personalized assets already exist for this child!');
      return;
    }

    // Generate missing assets
    for (const asset of missingAssets) {
      try {
        const response = await fetch('/api/assets/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: asset.type,
            theme: `${childName}'s ${asset.description}`,
            prompt: asset.personalized_prompt || asset.default_prompt,
            child_name: childName,
            template: template.id,
            purpose: asset.purpose,
            safe_zone: asset.safe_zone,
            personalization_type: asset.personalization_type
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate ${asset.description}`);
        }

        console.log(`Generated ${asset.description} for ${childName}`);
      } catch (error) {
        console.error(`Error generating ${asset.description}:`, error);
        alert(`Failed to generate ${asset.description} for ${childName}`);
      }
    }

    alert(`Generated ${missingAssets.length} personalized assets for ${childName}`);
  };

  function RequiredAssetCard({ asset, onReview, onAssign, eligibleAssets = [], onUpload }: {
    asset: any;
    onReview: () => void;
    onAssign: () => void;
    eligibleAssets?: any[];
    onUpload?: () => void;
  }) {
    const isHardCoded = asset.hard_coded || asset.default_asset || asset.assignable === false;
    const isDynamicPool = asset.multiple_allowed === true || asset.purpose === 'intro_background';
    const hasEligible = eligibleAssets && eligibleAssets.length > 0;
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between p-2 bg-gray-100 rounded mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getAssetIcon(asset.type)}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{asset.description}</p>
            <p className="text-xs text-gray-500">
              {asset.type} | {getFormatDisplay(asset.formats)}
              {asset.safe_zone && <span className="ml-2">Safe Zone: {asset.safe_zone}</span>}
            </p>
            {isDynamicPool ? (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  Dynamic (from pool)
                  <span title="A random eligible asset will be selected from the pool each time a video is generated.">ℹ️</span>
                </span>
                {hasEligible ? (
                  <div className="flex gap-1 mt-1">
                    {eligibleAssets.slice(0, 3).map((ex, i) => (
                      <span key={ex.id || i} className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                        {ex.file_url ? <img src={ex.file_url} alt={ex.theme || 'Asset'} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, marginRight: 4 }} /> : null}
                        {ex.theme || ex.name || 'Asset'}
                      </span>
                    ))}
                    {eligibleAssets.length > 3 && <span className="text-xs text-gray-400">+{eligibleAssets.length - 3} more</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-600 font-medium">No eligible assets found.</span>
                    {onUpload && <button onClick={onUpload} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">Upload Asset</button>}
                  </div>
                )}
              </div>
            ) : asset.assigned_asset ? (
              <p className="text-xs text-green-600 font-medium mt-1">
                ✓ Assigned: {asset.assigned_asset.theme}
              </p>
            ) : (
              <span className="text-xs text-red-600 font-medium mt-1">No asset assigned.</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 mt-2 md:mt-0">
          {isDynamicPool ? (
            <button className="bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs cursor-not-allowed" disabled>
              Dynamic
            </button>
          ) : asset.assigned_asset ? (
            <button
              onClick={onReview}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
            >
              Review
            </button>
          ) : (
            <button
              onClick={isHardCoded ? onReview : onAssign}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
            >
              {isHardCoded ? 'Review Assets' : 'Assign'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Video Templates</h1>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Video Templates</h2>
          <p className="text-gray-600">
            Configure asset requirements and assignments for different video types.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {template.type}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Required Assets:</h4>
                  <div className="space-y-2">
                    {template.structure.map((part) => (
                      <div key={part.id} className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-md font-semibold text-gray-900 mb-2">{part.name}</h5>
                        <div className="space-y-2">
                          {part.requiredAssets.map((asset) => (
                            <RequiredAssetCard
                              key={asset.id}
                              asset={asset}
                              onReview={() => openAssetAssignmentModal(asset)}
                              onAssign={() => openAssetAssignmentModal(asset)}
                              eligibleAssets={selectedAssetPurpose ? getEligibleAssets(selectedAssetPurpose) : []}
                              onUpload={selectedAssetPurpose ? () => handleUpload(selectedAssetPurpose) : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <p>Required Safe Zones:</p>
                    <ul className="list-disc list-inside">
                      {template.structure.flatMap(part => 
                        part.requiredAssets
                          .filter(asset => asset.safe_zone)
                          .map(asset => (
                            <li key={asset.id}>
                              {asset.description}: {asset.safe_zone}
                            </li>
                          ))
                      )}
                    </ul>
                  </div>
                  <button
                    onClick={() => openTemplateModal(template)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Manage Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Management Modal */}
      {showTemplateModal && selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTemplateModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Template: {selectedTemplate.name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    router.push('/admin/assets');
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm flex items-center space-x-1"
                >
                  <span>📤</span>
                  <span>Upload Assets</span>
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {selectedTemplate.type}<br/>
                <strong>Description:</strong> {selectedTemplate.description}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Asset Status:</strong> {selectedTemplate.structure.flatMap(part => part.requiredAssets).filter(a => a.assigned_asset).length} of {selectedTemplate.structure.flatMap(part => part.requiredAssets).length} assets assigned
                </p>
                {selectedTemplate.structure.flatMap(part => part.requiredAssets)
                  .filter(a => a.assigned_asset && !a.multiple_allowed)
                  .map(asset => (
                    <span key={asset.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getAssetIcon(asset.type)} {asset.assigned_asset?.theme}
                    </span>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Template Structure:</h4>
              {selectedTemplate.structure.map((part, index) => (
                <div key={part.id} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-md font-semibold text-gray-900 mb-2">{part.name}</h5>
                  <div className="space-y-2">
                    {part.requiredAssets.map((asset, assetIndex) => (
                      <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getAssetIcon(asset.type)}</span>
                          <div>
                            <span className="font-medium text-gray-900">{asset.description}</span>
                            <p className="text-xs text-gray-500">
                              Type: {asset.type} | Formats: {getFormatDisplay(asset.formats)}
                              {asset.multiple_allowed && ` | Multiple: ${asset.max_count || 'unlimited'}`}
                              {asset.personalization_type && (
                                <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  🎯 Template-Specific
                                </span>
                              )}
                            </p>
                            {asset.default_prompt && (
                              <p className="text-xs text-gray-400 mt-1 truncate" title={asset.default_prompt}>
                                Default prompt: {asset.default_prompt.substring(0, 80)}...
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            asset.required ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {asset.required ? 'Required' : 'Optional'}
                          </span>
                          
                          {asset.assigned_asset ? (
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                ✓ Assigned: {asset.assigned_asset.theme}
                              </span>
                              <button
                                onClick={() => openAssetAssignmentModal(asset)}
                                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                              >
                                Review
                              </button>
                              <button
                                onClick={async () => await removeAssetAssignment(selectedTemplate.id, asset.purpose)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssetAssignmentModal(asset)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Assign Asset
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const childName = prompt('Enter child name for personalized assets:');
                    if (childName) {
                      generateMissingAssets(selectedTemplate, childName);
                    }
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center space-x-2"
                >
                  <span>👶</span>
                  <span>Generate for Child</span>
                </button>
                <button
                  onClick={() => exportTemplate(selectedTemplate)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center space-x-2"
                >
                  <span>📦</span>
                  <span>Export Template</span>
                </button>
                <button
                  onClick={() => {
                    // Here you would save template changes
                    alert('Template changes saved!');
                    setShowTemplateModal(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Assignment Modal */}
      {showAssetAssignmentModal && selectedAssetPurpose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssetAssignmentModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Assign Asset: {selectedAssetPurpose.description}
              </h3>
              <button
                onClick={() => setShowAssetAssignmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Requirements Section */}
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Requirements for this asset:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Type: {selectedAssetPurpose.type}</li>
                  <li>• Formats: {getFormatDisplay(selectedAssetPurpose.formats)}</li>
                  {selectedAssetPurpose.safe_zone && (
                    <li>• Safe Zone: {selectedAssetPurpose.safe_zone}</li>
                  )}
                  {selectedAssetPurpose.multiple_allowed && (
                    <li>• Multiple allowed: {selectedAssetPurpose.max_count || 'unlimited'}</li>
                  )}
                  {selectedAssetPurpose.personalization_type && (
                    <li>• Personalization: {selectedAssetPurpose.personalization_type}</li>
                  )}
                  {selectedAssetPurpose.default_prompt && (
                    <li>• Default Prompt: {selectedAssetPurpose.default_prompt.substring(0, 100)}...</li>
                  )}
                </ul>
              </div>

              <input
                type="text"
                placeholder="Search assets by theme, child name, or prompt..."
                value={assetSearchTerm}
                onChange={(e) => handleAssetSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Asset Type Filter */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setAssetFilter('all')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    assetFilter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Assets
                </button>
                <button
                  onClick={() => setAssetFilter('general')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    assetFilter === 'general' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  General Assets
                </button>
                <button
                  onClick={() => setAssetFilter('template_specific')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    assetFilter === 'template_specific' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Template-Specific
                </button>
              </div>
            </div>

            {/* Upload Button */}
            <div className="mb-4 flex justify-between items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Compatible formats:</strong> {getFormatDisplay(selectedAssetPurpose.formats)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssetAssignmentModal(false);
                  router.push('/admin/assets');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <span>📤</span>
                <span>Upload New Asset</span>
              </button>
            </div>

            {saving ? (
              <div className="text-center py-8">Loading available assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {assetSearchTerm ? 'No assets found matching your search.' : 'No compatible assets found.'}
                </p>
                <button
                  onClick={() => setShowAssetAssignmentModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found {filteredAssets.length} compatible assets. Click any asset to assign it to this template.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {filteredAssets.map((asset) => {
                    const relevanceScore = getThemeRelevanceScore(asset, selectedAssetPurpose);
                    const assetSafeZones = getAssetSafeZones(asset);
                    const requiredZone = selectedAssetPurpose.safe_zone || '';
                    const hasExactMatch = assetSafeZones.includes(requiredZone);
                    const isAllOk = assetSafeZones.includes('all_ok');
                    const safeZoneMatch = hasExactMatch ? 'exact' : 'none';
                    
                    return (
                      <div
                        key={asset.id}
                        className={`border rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors ${
                          selectedAssetPurpose?.assigned_asset_id === asset.id ? 'border-green-500 bg-green-50' : ''
                        }`}
                        onClick={() => assignAssetToTemplate(asset)}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">
                            {asset.type === 'audio' ? '🎵' : '🖼️'}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{asset.theme}</h4>
                            <p className="text-xs text-gray-500">{asset.type}</p>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              relevanceScore >= 10 ? 'bg-green-100 text-green-800' :
                              relevanceScore >= 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Score: {relevanceScore}
                            </div>
                          </div>
                        </div>

                        {/* Safe Zone Match */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 mb-1">
                            Required: <span className="font-medium">{requiredZone || 'any'}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            safeZoneMatch === 'exact' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {safeZoneMatch === 'exact' ? '✓' : '✗'} Asset: {hasExactMatch ? requiredZone : (assetSafeZones.length > 0 ? assetSafeZones.join(', ') : 'none')}
                          </span>
                          {isAllOk && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">all_ok (not a match for specific requirements)</span>
                          )}
                        </div>
                        
                        {/* Template-specific indicator */}
                        {asset.metadata?.template_specific && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <span className="mr-1">🎯</span>
                              Template-Specific
                            </span>
                            {asset.metadata?.personalization_type && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {asset.metadata.personalization_type === 'name_substitution' ? 'Name Substitution' : 
                                 asset.metadata.personalization_type === 'child_specific' ? 'Child-Specific' : 'General'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Relevance Indicators */}
                        <div className="text-xs text-gray-600 space-y-1 mb-2">
                          {asset.theme?.toLowerCase().includes('lullaby') && (
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">✓</span>
                              <span>Lullaby themed</span>
                            </div>
                          )}
                          {asset.theme?.toLowerCase().includes('bedtime') && (
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">✓</span>
                              <span>Bedtime themed</span>
                            </div>
                          )}
                          {asset.theme?.toLowerCase().includes('calm') && (
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">✓</span>
                              <span>Calming</span>
                            </div>
                          )}
                          {asset.theme?.toLowerCase().includes('peaceful') && (
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">✓</span>
                              <span>Peaceful</span>
                            </div>
                          )}
                        </div>
                        
                        {asset.metadata?.child_name && (
                          <p className="text-xs text-gray-600 mb-2">
                            Created for: {asset.metadata.child_name}
                          </p>
                        )}
                        
                        {asset.metadata?.prompt && (
                          <p className="text-xs text-gray-500 truncate" title={asset.metadata.prompt}>
                            {asset.metadata.prompt.substring(0, 100)}...
                          </p>
                        )}
                        
                        {asset.type === 'audio' && (
                          <div className="mt-2">
                            <AudioPlayer 
                              asset={asset}
                              className="w-full"
                              showControls={true}
                            />
                          </div>
                        )}
                        
                        {asset.type === 'image' && (
                          asset.file_url ? (
                            <img
                              src={asset.file_url}
                              alt={asset.theme || 'Asset preview'}
                              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, marginRight: 12, border: '1px solid #eee' }}
                            />
                          ) : (
                            <div style={{
                              width: 64, height: 64, background: '#f3f4f6', borderRadius: 8, marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 24, border: '1px solid #e5e7eb'
                            }}>
                              🖼️
                            </div>
                          )
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(asset.created_at).toLocaleDateString()}
                        </p>

                        {selectedAssetPurpose?.assigned_asset_id === asset.id && (
                          <div className="mt-2">
                            <span className="text-green-600 text-sm font-medium">
                              ✓ Currently Assigned
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center pt-4 border-t">
                  <button
                    onClick={() => setShowAssetAssignmentModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">How assets are filtered and scored:</h5>
                  <ul className="space-y-1">
                    <li>• <strong>Safe Zone Match:</strong> ✓ = exact match, ~ = partial match, ✗ = no match</li>
                    <li>• <strong>Relevance Score:</strong> Higher scores indicate better matches for the template type and purpose</li>
                    <li>• <strong>Theme Indicators:</strong> Shows which lullaby/bedtime themes are present</li>
                    <li>• Assets are automatically filtered to show only those appropriate for {selectedTemplate?.type} templates</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 