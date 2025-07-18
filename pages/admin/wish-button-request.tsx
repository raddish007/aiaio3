import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import AdminHeader from '@/components/AdminHeader';
import { AssetDetailModal } from '@/components/assets/AssetModal/AssetDetailModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  theme?: string;
}

interface StoryVariables {
  childName: string;
  theme: string;
  visualStyle: string;
  mainCharacter: string;
  sidekick: string;
  wishResultItems: string;
  buttonLocation: string;
  magicButton: string;
  chaoticActions: string;
  realizationEmotion: string;
  missedSimpleThing: string;
  finalScene: string;
}

interface AssetStatus {
  type: 'image' | 'audio';
  name: string;
  description: string;
  status: 'missing' | 'generating' | 'ready' | 'pending_review' | 'completed' | 'approved' | 'rejected' | 'failed';
  url?: string;
  id?: string; // Database ID for tracking
}

interface WishButtonAssets {
  // Page 1: Title Page
  page1_image: AssetStatus;
  page1_audio: AssetStatus;
  
  // Page 2: Character Trait / Desire  
  page2_image: AssetStatus;
  page2_audio: AssetStatus;

  // Page 3: Discovery
  page3_image: AssetStatus;
  page3_audio: AssetStatus;

  // Page 4: First Wish
  page4_image: AssetStatus;
  page4_audio: AssetStatus;

  // Page 5: Things Appear
  page5_image: AssetStatus;
  page5_audio: AssetStatus;

  // Page 6: Chaos
  page6_image: AssetStatus;
  page6_audio: AssetStatus;

  // Page 7: Realization
  page7_image: AssetStatus;
  page7_audio: AssetStatus;

  // Page 8: Learning
  page8_image: AssetStatus;
  page8_audio: AssetStatus;

  // Page 9: Happy Ending
  page9_image: AssetStatus;
  page9_audio: AssetStatus;

  // Background Music
  background_music: AssetStatus;
}

export default function WishButtonRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [currentStoryProject, setCurrentStoryProject] = useState<any | null>(null); // Track the active story/project
  const [storyVariables, setStoryVariables] = useState<StoryVariables | null>(null);
  const [assets, setAssets] = useState<WishButtonAssets | null>(null);
  const [currentStep, setCurrentStep] = useState<'child' | 'stories' | 'variables' | 'prompts' | 'images' | 'image-review' | 'audio' | 'payload' | 'submit' | 'review'>('child');
  const [generatingVariables, setGeneratingVariables] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ [key: string]: { image: string; audio: string; safeZone: string } } | null>(null);
  const [previousStories, setPreviousStories] = useState<any[]>([]);
  const [showPreviousStories, setShowPreviousStories] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [promptProgress, setPromptProgress] = useState({ current: 0, total: 0, currentPage: '' });
  
  // Asset review modal state
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setCurrentStep('stories');
    fetchPreviousStories(child);
  };

  // New function to refresh assets from database
  const refreshAssetsFromDatabase = async (projectId: string) => {
    try {
      console.log(`🔄 Refreshing assets for project ${projectId}...`);
      
      const { data: dbAssets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .eq('metadata->>template', 'wish-button');

      if (error) {
        console.error('Error fetching assets:', error);
        return;
      }

      console.log(`Found ${dbAssets?.length || 0} assets in database`, dbAssets);

      // Additional debug: check if any assets exist for this project without template filter
      const { data: allProjectAssets, error: allError } = await supabase
        .from('assets')
        .select('id, type, metadata->template, metadata->asset_purpose, metadata->page')
        .eq('project_id', projectId);
        
      if (!allError) {
        console.log(`🔍 All assets for project ${projectId}:`, allProjectAssets);
      }

      if (!assets) return; // Need initial assets structure

      // Update assets with database data
      const updatedAssets = { ...assets };

      dbAssets?.forEach(dbAsset => {
        console.log(`🔍 Processing asset ${dbAsset.id}:`, {
          type: dbAsset.type,
          asset_purpose: dbAsset.metadata?.asset_purpose,
          page: dbAsset.metadata?.page,
          template: dbAsset.metadata?.template,
          status: dbAsset.status,
          url: dbAsset.url
        });

        const assetPurpose = dbAsset.metadata?.asset_purpose || dbAsset.metadata?.page;
        const assetType = dbAsset.type;
        
        // Map database assets to UI asset structure
        let assetKey = '';
        if (assetPurpose && assetType === 'image') {
          assetKey = `${assetPurpose}_image`;
        } else if (assetPurpose && assetType === 'audio') {
          assetKey = `${assetPurpose}_audio`;
        } else if (assetPurpose === 'background_music') {
          assetKey = 'background_music';
        }

        console.log(`🔗 Mapping ${dbAsset.id} to UI key: ${assetKey}`);

        if (assetKey && updatedAssets[assetKey as keyof WishButtonAssets]) {
          const currentAsset = updatedAssets[assetKey as keyof WishButtonAssets];
          updatedAssets[assetKey as keyof WishButtonAssets] = {
            ...currentAsset,
            status: dbAsset.status === 'approved' ? 'ready' : 
                   dbAsset.status === 'pending' ? 'pending_review' : 
                   dbAsset.status,
            url: dbAsset.url,
            id: dbAsset.id
          };
          console.log(`✅ Updated UI asset ${assetKey}:`, updatedAssets[assetKey as keyof WishButtonAssets]);
        } else {
          console.log(`⚠️ No matching UI asset found for key: ${assetKey}`);
        }
      });

      setAssets(updatedAssets);
      console.log('✅ Assets refreshed from database', updatedAssets);
      
    } catch (error) {
      console.error('Error refreshing assets:', error);
    }
  };

  const fetchPreviousStories = async (child: Child) => {
    try {
      const { data, error } = await supabase
        .from('content_projects')
        .select('*')
        .eq('metadata->>template', 'wish-button')
        .eq('metadata->>child_name', child.name)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Previous stories not available:', error.message);
        setPreviousStories([]);
        return;
      }
      setPreviousStories(data || []);
    } catch (error) {
      console.error('Error fetching previous stories:', error);
      setPreviousStories([]);
    }
  };

  const loadExistingStory = async (story: any) => {
    try {
      console.log('Loading existing story:', story);
      
      // Set the story variables from the saved project
      if (story.metadata?.storyVariables) {
        setStoryVariables(story.metadata.storyVariables);
      }
      
      // Set the current story project
      setCurrentStoryProject(story);
      
      // Load prompts if they exist
      if (story.metadata?.generatedPrompts) {
        setGeneratedPrompts(story.metadata.generatedPrompts);
      }
      
      // Refresh assets from database for this project
      await refreshAssetsFromDatabase(story.id);
      
      // Move to the appropriate step based on what's available
      if (story.metadata?.generatedPrompts) {
        setCurrentStep('images'); // Skip to images since prompts are already generated
      } else if (story.metadata?.storyVariables) {
        setCurrentStep('variables'); // Show variables but allow progression to prompts
      } else {
        setCurrentStep('variables'); // Start fresh with variables
      }
      
    } catch (error) {
      console.error('Error loading existing story:', error);
      alert('Failed to load existing story. Please try again.');
    }
  };

  const openAssetModal = (asset: any) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

  const closeAssetModal = () => {
    setSelectedAsset(null);
    setIsAssetModalOpen(false);
  };

  const handleAssetApprove = async (asset: any) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'approved' })
        .eq('id', asset.id);

      if (!error) {
        // Refresh assets to show updated status
        await refreshAssetsFromDatabase(currentStoryProject?.id);
        closeAssetModal();
      }
    } catch (error) {
      console.error('Failed to approve asset:', error);
    }
  };

  const handleAssetReject = async (asset: any) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'rejected' })
        .eq('id', asset.id);

      if (!error) {
        // Refresh assets to show updated status
        await refreshAssetsFromDatabase(currentStoryProject?.id);
        closeAssetModal();
      }
    } catch (error) {
      console.error('Failed to reject asset:', error);
    }
  };

  const generateStoryVariables = async (child: Child) => {
    setGeneratingVariables(true);
    
    try {
      const response = await fetch('/api/wish-button/generate-story-variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: child.name,
          theme: child.primary_interest,
          age: child.age
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStoryVariables(data.storyVariables);
        
        // Create or update the story project in the database
        const storyProject = await createOrUpdateStoryProject(child, data.storyVariables);
        setCurrentStoryProject(storyProject);
        
        initializeAssets(data.storyVariables);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating story variables:', error);
      alert('Failed to generate story variables. Please try again.');
    } finally {
      setGeneratingVariables(false);
    }
  };

  const createOrUpdateStoryProject = async (child: Child, storyVariables: StoryVariables) => {
    try {
      // First, check if there's an existing project for this child with similar story variables
      const { data: existingProjects, error: queryError } = await supabase
        .from('content_projects')
        .select('*')
        .eq('metadata->>template', 'wish-button')
        .eq('metadata->>child_name', child.name)
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError) {
        console.error('Error querying existing projects:', queryError);
      }

      let storyProject;

      // If we have an existing project and it's recent (today), update it
      const latestProject = existingProjects?.[0];
      const isRecentProject = latestProject && 
        new Date(latestProject.created_at).toDateString() === new Date().toDateString();

      if (isRecentProject) {
        // Update existing project
        const { data: updatedProject, error: updateError } = await supabase
          .from('content_projects')
          .update({
            metadata: {
              ...latestProject.metadata,
              storyVariables,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', latestProject.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }

        storyProject = updatedProject;
        console.log('📝 Updated existing story project:', storyProject.id);
      } else {
        // Create new project
        const { data: newProject, error: createError } = await supabase
          .from('content_projects')
          .insert({
            metadata: {
              template: 'wish-button',
              child_name: child.name,
              child_id: child.id,
              theme: child.primary_interest,
              storyVariables,
              created_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating project:', createError);
          throw createError;
        }

        storyProject = newProject;
        console.log('🆕 Created new story project:', storyProject.id);
      }

      return storyProject;
      
    } catch (error) {
      console.error('Error creating/updating story project:', error);
      throw error;
    }
  };

  const initializeAssets = (variables: StoryVariables) => {
    const initialAssets: WishButtonAssets = {
      // Page 1: Title Page
      page1_image: {
        type: 'image',
        name: 'Title Card',
        description: `Title card: "A WISH BUTTON FOR ${variables.childName.toUpperCase()}" with ${variables.sidekick}`,
        status: 'missing'
      },
      page1_audio: {
        type: 'audio',
        name: 'Title Audio',
        description: `"A Wish Button for ${variables.childName}"`,
        status: 'missing'
      },
      
      // Page 2: Character Trait
      page2_image: {
        type: 'image',
        name: 'Character Loves Image',
        description: `${variables.mainCharacter} loving ${variables.wishResultItems}`,
        status: 'missing'
      },
      page2_audio: {
        type: 'audio',
        name: 'Character Loves Audio',
        description: `"${variables.childName} loved ${variables.wishResultItems}..."`,
        status: 'missing'
      },

      // Page 3: Discovery
      page3_image: {
        type: 'image',
        name: 'Button Discovery Image',
        description: `${variables.mainCharacter} finding the magical button in ${variables.buttonLocation}`,
        status: 'missing'
      },
      page3_audio: {
        type: 'audio',
        name: 'Button Discovery Audio',
        description: `"One day, while exploring ${variables.buttonLocation}..."`,
        status: 'missing'
      },

      // Page 4: First Wish
      page4_image: {
        type: 'image',
        name: 'First Wish Image',
        description: `${variables.mainCharacter} pressing the button with excitement`,
        status: 'missing'
      },
      page4_audio: {
        type: 'audio',
        name: 'First Wish Audio',
        description: `"I wish for ${variables.wishResultItems}!"`,
        status: 'missing'
      },

      // Page 5: Things Appear
      page5_image: {
        type: 'image',
        name: 'Wishes Appear Image',
        description: `${variables.wishResultItems} appearing around ${variables.mainCharacter}`,
        status: 'missing'
      },
      page5_audio: {
        type: 'audio',
        name: 'Wishes Appear Audio',
        description: `"POOF! Suddenly, ${variables.wishResultItems} appeared everywhere!"`,
        status: 'missing'
      },

      // Page 6: Chaos
      page6_image: {
        type: 'image',
        name: 'Too Much Chaos Image',
        description: `${variables.mainCharacter} overwhelmed as things ${variables.chaoticActions}`,
        status: 'missing'
      },
      page6_audio: {
        type: 'audio',
        name: 'Too Much Chaos Audio',
        description: `"But then... they started to ${variables.chaoticActions}!"`,
        status: 'missing'
      },

      // Page 7: Realization
      page7_image: {
        type: 'image',
        name: 'Realization Image',
        description: `${variables.mainCharacter} feeling ${variables.realizationEmotion}`,
        status: 'missing'
      },
      page7_audio: {
        type: 'audio',
        name: 'Realization Audio',
        description: `"${variables.childName} felt ${variables.realizationEmotion}..."`,
        status: 'missing'
      },

      // Page 8: Learning
      page8_image: {
        type: 'image',
        name: 'Learning Image',
        description: `${variables.mainCharacter} pressing the button thoughtfully`,
        status: 'missing'
      },
      page8_audio: {
        type: 'audio',
        name: 'Learning Audio',
        description: `"I wish for just enough ${variables.wishResultItems} to share..."`,
        status: 'missing'
      },

      // Page 9: Happy Ending
      page9_image: {
        type: 'image',
        name: 'Happy Ending Image',
        description: `${variables.finalScene} with ${variables.mainCharacter} and ${variables.sidekick}`,
        status: 'missing'
      },
      page9_audio: {
        type: 'audio',
        name: 'Happy Ending Audio',
        description: `"And from that day on, ${variables.childName} learned..."`,
        status: 'missing'
      },

      // Background Music
      background_music: {
        type: 'audio',
        name: 'Background Music',
        description: `Gentle, whimsical background music for ${variables.theme} theme`,
        status: 'missing'
      }
    };
    
    setAssets(initialAssets);
  };

  const updateStoryVariable = (key: keyof StoryVariables, value: string) => {
    if (storyVariables) {
      setStoryVariables(prev => ({ ...prev!, [key]: value }));
      // Update asset descriptions when variables change
      if (assets) {
        const updatedAssets = { ...assets };
        
        // Update descriptions based on new variables
        updatedAssets.page1_image.description = `${storyVariables.mainCharacter} standing in a sunny field waving hello, with ${storyVariables.sidekick} by their feet`;
        updatedAssets.page2_image.description = `${storyVariables.mainCharacter} excitedly imagining ${value}`;
        updatedAssets.page2_audio.description = `"${storyVariables.childName} loved ${value}. Not just a little—a lot! More ${value}, more everything!"`;
        
        setAssets(updatedAssets);
      }
    }
  };

  const generateAllPrompts = async () => {
    if (!storyVariables || !assets) return;
    
    setGeneratingPrompts(true);
    setCurrentStep('prompts');
    
    const pages = ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'];
    setPromptProgress({ current: 0, total: pages.length, currentPage: '' });
    
    try {
      console.log('🎯 Starting prompt generation for Wish Button story');
      console.log('📊 Story variables being sent:', storyVariables);
      console.log('📄 Generating prompts for pages:', pages);
      
      const startTime = Date.now();
      
      setPromptProgress({ current: 0, total: pages.length, currentPage: 'Initializing...' });
      
      const response = await fetch('/api/wish-button/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyVariables,
          pages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      if (data.success) {
        console.log(`✅ Generated prompts for all 9 pages in ${duration.toFixed(2)}s`);
        console.log('📝 Generated prompts summary:');
        Object.entries(data.prompts).forEach(([page, prompts]: [string, any]) => {
          console.log(`${page}:`, {
            imageLength: prompts.image?.length || 0,
            audioLength: prompts.audio?.length || 0,
            safeZone: prompts.safeZone,
            imagePreview: prompts.image?.substring(0, 100) + '...',
            audioPreview: prompts.audio?.substring(0, 100) + '...'
          });
        });
        setGeneratedPrompts(data.prompts);
        setPromptProgress({ current: pages.length, total: pages.length, currentPage: 'Complete!' });
        
        // Stay on prompts step to show results - don't auto-advance
        // User can manually proceed to images when ready
      } else {
        console.error('❌ API returned error:', data.error, data.details);
        throw new Error(data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('💥 Error generating prompts:', error);
      setPromptProgress({ current: 0, total: 0, currentPage: 'Error occurred' });
      
      if (error instanceof Error) {
        alert(`Failed to generate prompts: ${error.message}`);
      } else {
        alert('Failed to generate prompts. Please check the console for details.');
      }
    } finally {
      setGeneratingPrompts(false);
    }
  };

  const generateAllImages = async () => {
    if (!storyVariables || !assets) return;
    
    setCurrentStep('images');
    
    try {
      console.log('🎨 Starting batch image generation...');
      
      // Process images in smaller batches to avoid overwhelming the API
      const allPages = ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'];
      const batchSize = 3; // Process 3 images at a time
      
      for (let i = 0; i < allPages.length; i += batchSize) {
        const batch = allPages.slice(i, i + batchSize);
        console.log(`🎯 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
        
        const response = await fetch('/api/wish-button/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pages: batch,
            batchSize: batchSize
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Batch API Response Error:', response.status, errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed:`, data.generations);
          
          // Small delay between batches
          if (i + batchSize < allPages.length) {
            console.log('⏱️ Waiting 3 seconds before next batch...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          console.error('❌ Batch API returned error:', data.error, data.details);
          throw new Error(data.error || 'Unknown batch error');
        }
      }
      
      console.log('✅ All image generation batches completed');
      alert('Image generation completed! Please review the images before proceeding to audio.');
      setCurrentStep('image-review');
      
    } catch (error) {
      console.error('💥 Error in batch image generation:', error);
      if (error instanceof Error) {
        alert(`Failed to generate images: ${error.message}`);
      } else {
        alert('Failed to generate images. Please check the console for details.');
      }
    }
  };

  const generateSingleImage = async (page: string) => {
    if (!storyVariables || !assets || !currentStoryProject) {
      console.error('Missing required data for image generation:', { storyVariables, assets, currentStoryProject });
      alert('Missing story context. Please ensure story variables are generated first.');
      return;
    }
    
    try {
      console.log(`🎯 Starting single image generation for ${page} in project ${currentStoryProject.id}...`);
      
      // Update asset status to generating
      setAssets(prev => prev ? {
        ...prev,
        [`${page}_image`]: { ...prev[`${page}_image` as keyof WishButtonAssets], status: 'generating' }
      } : null);
      
      const response = await fetch('/api/wish-button/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: [page], // Single page only
          batchSize: 1,
          projectId: currentStoryProject.id, // Pass the story project ID
          storyVariables, // Pass story context
          generatedPrompts // Pass prompts context
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Single Image API Response Error:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Single image generation completed for ${page}:`, data.generations);
        
        // Refresh assets from database to get the latest status
        await refreshAssetsFromDatabase(currentStoryProject.id);
        
        alert(`Image generation completed for ${page}! Asset refreshed from database.`);
        
      } else {
        console.error('❌ Single Image API returned error:', data.error, data.details);
        throw new Error(data.error || 'Unknown single image generation error');
      }
      
    } catch (error) {
      console.error('💥 Error in single image generation:', error);
      
      // Reset asset status on error
      setAssets(prev => prev ? {
        ...prev,
        [`${page}_image`]: { ...prev[`${page}_image` as keyof WishButtonAssets], status: 'failed' }
      } : null);
      
      if (error instanceof Error) {
        alert(`Failed to generate image for ${page}: ${error.message}`);
      } else {
        alert(`Failed to generate image for ${page}. Please check the console for details.`);
      }
    }
  };

  const generateAllAudio = async () => {
    if (!storyVariables || !assets) return;
    
    setCurrentStep('audio');
    
    try {
      const response = await fetch('/api/wish-button/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'],
          includeBackgroundMusic: true,
          storyVariables
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Started audio generation for all 9 pages + background music');
        // Update asset status to generating
        if (assets) {
          const updatedAssets = { ...assets };
          Object.keys(updatedAssets).forEach(key => {
            if (key.includes('_audio') || key === 'background_music') {
              updatedAssets[key as keyof WishButtonAssets].status = 'generating';
            }
          });
          setAssets(updatedAssets);
        }
        setCurrentStep('review');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio. Please try again.');
    }
  };

  const getThemeEmoji = (theme: string) => {
    const emojis: { [key: string]: string } = {
      halloween: '🎃',
      space: '🚀',
      animals: '🐾',
      dogs: '🐕',
      cats: '🐱',
      dinosaurs: '🦕',
      princesses: '👸',
      vehicles: '🚗',
      monsters: '👾',
      default: '⭐'
    };
    return emojis[theme.toLowerCase()] || emojis.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Wish Button Story Generator"
        subtitle="Create personalized 9-page interactive storybook videos"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'child', label: 'Select Child', icon: '👶' },
              { key: 'stories', label: 'Choose Story', icon: '📚' },
              { key: 'variables', label: 'Story Variables', icon: '📖' },
              { key: 'prompts', label: 'Generate Prompts', icon: '✨' },
              { key: 'images', label: 'Generate Images', icon: '🎨' },
              { key: 'image-review', label: 'Review Images', icon: '👀' },
              { key: 'audio', label: 'Generate Audio', icon: '🎤' },
              { key: 'review', label: 'Review & Submit', icon: '🎬' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key 
                    ? 'bg-blue-600 text-white' 
                    : index <= ['child', 'stories', 'variables', 'prompts', 'images', 'image-review', 'audio', 'review'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">{step.label}</span>
                {index < 7 && <div className="w-8 h-px bg-gray-300 mx-4"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Child Selection */}
        {currentStep === 'child' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Child for Wish Button Story</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">
                      {getThemeEmoji(child.primary_interest)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">
                        {child.age} year{child.age !== 1 ? 's' : ''} old • {child.primary_interest}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Previous Stories */}
        {currentStep === 'stories' && selectedChild && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 2: Choose Option for {selectedChild.name}
            </h2>
            
            <div className="space-y-6">
              {/* Create New Story Option */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Create New Wish Button Story
                    </h3>
                    <p className="text-blue-700">
                      Generate a fresh story with new characters and theme for {selectedChild.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      generateStoryVariables(selectedChild);
                      setCurrentStep('variables');
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create New Story
                  </button>
                </div>
              </div>

              {/* Previous Stories Section */}
              {previousStories.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Previous Wish Button Stories ({previousStories.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {previousStories.map((story, index) => (
                      <div key={story.id} className="bg-gray-50 border border-gray-200 rounded p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              Story #{index + 1}
                              {story.metadata?.storyVariables?.theme && (
                                <span className="text-sm text-gray-600 ml-2">({story.metadata.storyVariables.theme})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              Created: {new Date(story.created_at).toLocaleDateString()}
                            </p>
                            {story.metadata?.storyVariables && (
                              <p className="text-sm text-gray-600">
                                Character: {story.metadata.storyVariables.mainCharacter?.substring(0, 50)}...
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => loadExistingStory(story)}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
                            >
                              Load & Continue
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previousStories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No previous stories found for {selectedChild.name}.</p>
                  <p className="text-sm">Create your first Wish Button story above!</p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setCurrentStep('child')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Child Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Story Variables */}
        {currentStep === 'variables' && selectedChild && (
          <div className="space-y-6">
            {/* Story Variables Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Step 3: Story Variables for {selectedChild.name}
              </h3>
            
            {generatingVariables ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating personalized story variables...</p>
              </div>
            ) : storyVariables ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Character Descriptions */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Story Elements</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">What They Wish For</label>
                      <input
                        type="text"
                        value={storyVariables.wishResultItems}
                        onChange={(e) => updateStoryVariable('wishResultItems', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., toys, cookies, stickers..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Location</label>
                      <input
                        type="text"
                        value={storyVariables.buttonLocation}
                        onChange={(e) => updateStoryVariable('buttonLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., garden, playground, bedroom..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">What Goes Wrong</label>
                      <input
                        type="text"
                        value={storyVariables.chaoticActions}
                        onChange={(e) => updateStoryVariable('chaoticActions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., pile up everywhere, make a mess, get too noisy..."
                      />
                    </div>
                  </div>

                  {/* Visual Style & Characters */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Visual Style & Characters</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Visual Style</label>
                      <select
                        value={storyVariables.visualStyle}
                        onChange={(e) => updateStoryVariable('visualStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="2D Pixar Style">2D Pixar Style</option>
                        <option value="Disney Animation Style">Disney Animation Style</option>
                        <option value="Studio Ghibli Style">Studio Ghibli Style</option>
                        <option value="Cartoon Network Style">Cartoon Network Style</option>
                        <option value="Nick Jr Style">Nick Jr Style</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Main Character</label>
                      <textarea
                        value={storyVariables.mainCharacter}
                        onChange={(e) => updateStoryVariable('mainCharacter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Describe the main character..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sidekick Character</label>
                      <textarea
                        value={storyVariables.sidekick}
                        onChange={(e) => updateStoryVariable('sidekick', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Describe the sidekick character..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={generateAllPrompts}
                    disabled={generatingPrompts}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {generatingPrompts ? 'Generating...' : 'Generate Story Prompts'}
                  </button>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        )}

        {/* Step 3: Prompts Generated */}
        {currentStep === 'prompts' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Story Prompts Generated</h2>
            
            {generatingPrompts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating illustration prompts for all 9 pages...</p>
                
                {/* Progress Information */}
                <div className="mt-4 max-w-md mx-auto">
                  <div className="text-sm text-gray-500 mb-2">
                    {promptProgress.currentPage && `Current: ${promptProgress.currentPage}`}
                  </div>
                  
                  {promptProgress.total > 0 && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(promptProgress.current / promptProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {promptProgress.current} of {promptProgress.total} pages
                      </div>
                    </>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-3">
                    ⏱️ This typically takes 30-60 seconds
                  </div>
                </div>
              </div>
            ) : generatedPrompts ? (
              <div className="space-y-6">
                <p className="text-green-600">✅ Generated prompts for all 9 pages</p>
                
                {/* Prompts Display */}
                <div className="space-y-4">
                  {Object.entries(generatedPrompts).map(([page, prompts]) => (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 capitalize">{page.replace('page', 'Page ')} Prompts</h3>
                      
                      <div className="space-y-3">
                        {/* Image Prompt */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">🎨 Image Prompt</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Safe Zone: {prompts.safeZone}</span>
                              <button
                                onClick={() => setExpandedPrompt(expandedPrompt === `${page}_image` ? null : `${page}_image`)}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                {expandedPrompt === `${page}_image` ? 'Collapse' : 'View Full'}
                              </button>
                            </div>
                          </div>
                          <div className={`${expandedPrompt === `${page}_image` ? '' : 'max-h-20 overflow-hidden'} transition-all`}>
                            <textarea
                              value={prompts.image}
                              onChange={(e) => {
                                setGeneratedPrompts(prev => ({
                                  ...prev!,
                                  [page]: { ...prev![page], image: e.target.value }
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={expandedPrompt === `${page}_image` ? 8 : 3}
                            />
                          </div>
                        </div>

                        {/* Audio Script */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">🎤 Audio Script</h4>
                            <button
                              onClick={() => setExpandedPrompt(expandedPrompt === `${page}_audio` ? null : `${page}_audio`)}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                            >
                              {expandedPrompt === `${page}_audio` ? 'Collapse' : 'Edit'}
                            </button>
                          </div>
                          <div className={`${expandedPrompt === `${page}_audio` ? '' : 'max-h-16 overflow-hidden'} transition-all`}>
                            <textarea
                              value={prompts.audio}
                              onChange={(e) => {
                                setGeneratedPrompts(prev => ({
                                  ...prev!,
                                  [page]: { ...prev![page], audio: e.target.value }
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={expandedPrompt === `${page}_audio` ? 4 : 2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentStep('variables')}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                  >
                    Back to Variables
                  </button>
                  <button
                    onClick={() => setCurrentStep('images')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Continue to Image Generation
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No prompts generated yet</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Image Generation */}
        {currentStep === 'images' && assets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Generate Story Images</h2>
            
            <div className="space-y-6">
              {/* Image Generation Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Image Generation Status</h3>
                <p className="text-sm text-blue-700">
                  Generating images for all 9 pages. Each image will respect safe zone requirements for text overlay.
                </p>
              </div>

              {/* Page Images - Currently limited to Page 1 and 2 for testing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['page1', 'page2'] as const).map((page) => {
                  const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        🎨 {imageAsset.name}
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          imageAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                          imageAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {imageAsset.status}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{imageAsset.description}</p>
                      
                      {imageAsset.status === 'ready' && imageAsset.url && (
                        <div className="mb-3">
                          <img 
                            src={imageAsset.url} 
                            alt={imageAsset.name}
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                      
                      <button
                        disabled={imageAsset.status === 'generating'}
                        onClick={() => generateSingleImage(page)}
                        className={`w-full px-4 py-2 rounded text-sm font-medium ${
                          imageAsset.status === 'ready' ? 'bg-green-600 text-white' :
                          imageAsset.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                          'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {imageAsset.status === 'ready' ? 'Regenerate' :
                         imageAsset.status === 'generating' ? 'Generating...' : 
                         'Generate Image'}
                      </button>
                    </div>
                  );
                })}
                
                {/* Commented out remaining images for testing */}
                {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
                  const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4 opacity-50">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        🎨 {imageAsset.name} 
                        <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                          Disabled for Testing
                        </span>
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{imageAsset.description}</p>
                      
                      <button
                        disabled={true}
                        className="w-full px-4 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Generate Image (Disabled)
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('prompts')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Prompts
                </button>
                <button
                  onClick={() => setCurrentStep('image-review')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Review Images →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4.5: Image Review */}
        {currentStep === 'image-review' && assets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Review Generated Images</h2>
            
            <div className="space-y-6">
              {/* Review Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-900 mb-2">Image Review Instructions</h3>
                <p className="text-sm text-yellow-700">
                  Click "Review" to open the detailed asset review modal. You can approve, reject, or regenerate images using the same workflow as the main asset management system.
                </p>
              </div>

              {/* Refresh Assets Button */}
              <div className="mb-6">
                <button
                  onClick={() => currentStoryProject && refreshAssetsFromDatabase(currentStoryProject.id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Refresh Assets
                </button>
              </div>

              {/* Image Review Grid - Currently limited to Page 1 and 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(['page1', 'page2'] as const).map((page) => {
                  const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                  const pageNumber = parseInt(page.replace('page', ''));
                  
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Image Display */}
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        {imageAsset.status === 'ready' && imageAsset.url ? (
                          <img 
                            src={imageAsset.url} 
                            alt={imageAsset.name}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() => imageAsset.id && openAssetModal({ 
                              id: imageAsset.id, 
                              url: imageAsset.url,
                              type: 'image',
                              title: imageAsset.name,
                              status: imageAsset.status,
                              metadata: { page: pageNumber }
                            })}
                          />
                        ) : imageAsset.status === 'pending_review' && imageAsset.url ? (
                          <img 
                            src={imageAsset.url} 
                            alt={imageAsset.name}
                            className="w-full h-48 object-cover cursor-pointer"
                            onClick={() => imageAsset.id && openAssetModal({ 
                              id: imageAsset.id, 
                              url: imageAsset.url,
                              type: 'image',
                              title: imageAsset.name,
                              status: imageAsset.status,
                              metadata: { page: pageNumber }
                            })}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">
                              {imageAsset.status === 'generating' ? 'Generating...' : 'No image available'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Image Details */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">Page {pageNumber}</h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            imageAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                            imageAsset.status === 'approved' ? 'bg-green-100 text-green-800' :
                            imageAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                            imageAsset.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {imageAsset.status === 'pending_review' ? 'Ready for Review' : 
                             imageAsset.status === 'ready' ? 'Ready' : imageAsset.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{imageAsset.description}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            disabled={imageAsset.status === 'generating'}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                              imageAsset.status === 'generating' 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            onClick={() => generateSingleImage(page)}
                          >
                            {imageAsset.status === 'generating' ? 'Generating...' : 'Regenerate'}
                          </button>
                          
                          {(imageAsset.status === 'ready' || imageAsset.status === 'pending_review') && imageAsset.id && (
                            <button
                              className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                              onClick={() => openAssetModal({ 
                                id: imageAsset.id, 
                                url: imageAsset.url,
                                type: 'image',
                                title: imageAsset.name,
                                status: imageAsset.status,
                                metadata: { page: pageNumber }
                              })}
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Remaining images - disabled for testing */}
                {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
                  const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                  const pageNumber = parseInt(page.replace('page', ''));
                  
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg overflow-hidden opacity-50">
                      {/* Image Display */}
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Disabled for Testing</span>
                        </div>
                      </div>
                      
                      {/* Image Details */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">Page {pageNumber}</h4>
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                            Disabled
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{imageAsset.description}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            disabled={true}
                            className="flex-1 px-3 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            Regenerate (Disabled)
                          </button>
                          
                          <button
                            disabled={true}
                            className="flex-1 px-3 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            Approve (Disabled)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Review Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-blue-900">Review Status (Testing with Pages 1-2 Only)</h3>
                  <button
                    onClick={() => currentStoryProject && refreshAssetsFromDatabase(currentStoryProject.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    disabled={!currentStoryProject}
                  >
                    🔄 Refresh Assets
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Ready Images: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'image' && 
                        (asset.status === 'ready' || asset.status === 'pending_review') &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Generating: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'image' && 
                        asset.status === 'generating' &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Failed: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'image' && 
                        asset.status === 'failed' &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('images')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Image Generation
                </button>
                <button
                  onClick={() => {
                    const readyImages = Object.values(assets).filter(asset => 
                      asset.type === 'image' && 
                      (asset.status === 'ready' || asset.status === 'pending_review') &&
                      (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                    ).length;
                    
                    if (readyImages < 2) {
                      alert(`Please ensure Pages 1-2 images are generated and ready. Currently ${readyImages}/2 images are ready.`);
                      return;
                    }
                    
                    setCurrentStep('audio');
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Proceed to Audio Generation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Audio Generation */}
        {currentStep === 'audio' && assets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6: Generate Story Audio</h2>
            
            <div className="space-y-6">
              {/* Audio Status Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Audio Generation Status</h3>
                <p className="text-sm text-green-700">
                  Generating narration audio for all 9 pages plus background music using ElevenLabs voice synthesis.
                </p>
              </div>

              {/* Background Music Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    🎼 {assets.background_music.name}
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      assets.background_music.status === 'ready' ? 'bg-green-100 text-green-800' :
                      assets.background_music.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assets.background_music.status}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{assets.background_music.description}</p>
                  
                  {assets.background_music.status === 'ready' && assets.background_music.url && (
                    <div className="mb-3">
                      <audio controls className="w-full">
                        <source src={assets.background_music.url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  <button
                    disabled={assets.background_music.status === 'generating'}
                    className={`w-full px-4 py-2 rounded text-sm font-medium ${
                      assets.background_music.status === 'ready' ? 'bg-green-600 text-white' :
                      assets.background_music.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                      'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {assets.background_music.status === 'ready' ? 'Regenerate' :
                     assets.background_music.status === 'generating' ? 'Generating...' : 
                     'Generate Background Music'}
                  </button>
                </div>
              </div>

              {/* All Page Audio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
                  const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        🎤 {audioAsset.name}
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          audioAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                          audioAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {audioAsset.status}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{audioAsset.description}</p>
                      
                      {audioAsset.status === 'ready' && audioAsset.url && (
                        <div className="mb-3">
                          <audio controls className="w-full">
                            <source src={audioAsset.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      <button
                        disabled={audioAsset.status === 'generating'}
                        className={`w-full px-4 py-2 rounded text-sm font-medium ${
                          audioAsset.status === 'ready' ? 'bg-green-600 text-white' :
                          audioAsset.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                          'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {audioAsset.status === 'ready' ? 'Regenerate' :
                         audioAsset.status === 'generating' ? 'Generating...' : 
                         'Generate Audio'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('image-review')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Image Review
                </button>
                <button
                  onClick={() => setCurrentStep('payload')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Build Payload →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Build Payload */}
        {currentStep === 'payload' && assets && storyVariables && generatedPrompts && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 7: Build Payload for Remotion</h2>
            
            <div className="space-y-6">
              {/* Payload Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Payload Generation Status</h3>
                <p className="text-sm text-blue-700">
                  Building the complete payload for Remotion video generation using Letter Hunt payload structure as reference.
                </p>
              </div>

              {/* Assets Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">🎨 Image Assets Ready</h3>
                  <div className="space-y-2 text-sm">
                    {(['page1', 'page2'] as const).map((page) => {
                      const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                      return (
                        <div key={page} className="flex justify-between items-center">
                          <span>{imageAsset.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            imageAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {imageAsset.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audio Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">🎤 Audio Assets Status</h3>
                  <div className="space-y-2 text-sm">
                    {(['page1', 'page2'] as const).map((page) => {
                      const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
                      return (
                        <div key={page} className="flex justify-between items-center">
                          <span>{audioAsset.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            audioAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {audioAsset.status || 'pending'}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center">
                      <span>Background Music</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        assets.background_music.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assets.background_music.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payload Preview */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">📦 Payload Structure (Preview)</h3>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  <pre className="whitespace-pre-wrap text-gray-700">
{`{
  "childName": "${storyVariables.childName}",
  "theme": "${storyVariables.theme}",
  "visualStyle": "${storyVariables.visualStyle}",
  "storyVariables": {
    "mainCharacter": "${storyVariables.mainCharacter.substring(0, 50)}...",
    "sidekick": "${storyVariables.sidekick.substring(0, 50)}...",
    "buttonLocation": "${storyVariables.buttonLocation}",
    "wishResultItems": "${storyVariables.wishResultItems}"
  },
  "assets": {
    "page1_image": "${assets.page1_image.url || 'pending'}",
    "page2_image": "${assets.page2_image.url || 'pending'}",
    "page1_audio": "${assets.page1_audio.url || 'pending'}",
    "page2_audio": "${assets.page2_audio.url || 'pending'}",
    "background_music": "${assets.background_music.url || 'pending'}"
  },
  "metadata": {
    "template": "wish-button",
    "version": "1.0",
    "generatedAt": "${new Date().toISOString()}"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Payload Actions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">⚠️ Payload Generation (Stubbed)</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  This step will build the complete payload structure based on the Letter Hunt implementation. 
                  The exact Remotion template payload structure needs to be determined.
                </p>
                <button
                  onClick={() => {
                    // TODO: Implement actual payload generation API call
                    alert('Payload generation API call will be implemented here, following Letter Hunt pattern');
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                >
                  Generate Payload (Stubbed)
                </button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('audio')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Audio
                </button>
                <button
                  onClick={() => setCurrentStep('submit')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Submit to Remotion →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Submit to Remotion */}
        {currentStep === 'submit' && assets && storyVariables && generatedPrompts && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 8: Submit to Remotion Lambda</h2>
            
            <div className="space-y-6">
              {/* Submission Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">🚀 Remotion Submission</h3>
                <p className="text-sm text-green-700">
                  Submit the complete payload to Remotion Lambda for video generation, following the Letter Hunt submission pattern.
                </p>
              </div>

              {/* Pre-submission Checklist */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">✅ Pre-submission Checklist</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded bg-green-500 text-white text-xs flex items-center justify-center mr-2">✓</span>
                    Story variables generated and validated
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded bg-green-500 text-white text-xs flex items-center justify-center mr-2">✓</span>
                    Prompts generated for all pages
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded bg-green-500 text-white text-xs flex items-center justify-center mr-2">✓</span>
                    Images generated and reviewed (Pages 1-2)
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded bg-yellow-500 text-white text-xs flex items-center justify-center mr-2">!</span>
                    Audio generation (stubbed)
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 rounded bg-yellow-500 text-white text-xs flex items-center justify-center mr-2">!</span>
                    Payload built and validated (stubbed)
                  </div>
                </div>
              </div>

              {/* Submission Actions */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">⚠️ Remotion Submission (Stubbed)</h3>
                <p className="text-sm text-red-700 mb-3">
                  This step will submit the payload to Remotion Lambda and save the result to the database, 
                  following the exact pattern used in Letter Hunt request submission.
                </p>
                <button
                  onClick={() => {
                    // TODO: Implement actual Remotion submission
                    alert('Remotion Lambda submission will be implemented here, following Letter Hunt pattern');
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Submit to Remotion (Stubbed)
                </button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('payload')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Payload
                </button>
                <button
                  onClick={() => setCurrentStep('review')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  View Results →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Review & Submit */}
        {currentStep === 'review' && assets && storyVariables && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 9: Final Review & Results</h2>
            
            <div className="space-y-6">
              {/* Story Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Story Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Child:</span> {storyVariables.childName}</p>
                    <p><span className="font-medium">Theme:</span> {storyVariables.theme}</p>
                    <p><span className="font-medium">Visual Style:</span> {storyVariables.visualStyle}</p>
                    <p><span className="font-medium">Wish Items:</span> {storyVariables.wishResultItems}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Main Character:</span> {storyVariables.mainCharacter.substring(0, 50)}...</p>
                    <p><span className="font-medium">Sidekick:</span> {storyVariables.sidekick.substring(0, 50)}...</p>
                    <p><span className="font-medium">Button Location:</span> {storyVariables.buttonLocation}</p>
                  </div>
                </div>
              </div>

              {/* Asset Review */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Generated Assets Review</h3>
                
                {/* Page 1 Review */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">📖 Page 1: Title Page</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">🎨 Title Image</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          assets.page1_image.status === 'ready' ? 'bg-green-100 text-green-800' :
                          assets.page1_image.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assets.page1_image.status}
                        </span>
                      </div>
                      {assets.page1_image.url && (
                        <div className="border border-gray-200 rounded p-2">
                          <img 
                            src={assets.page1_image.url} 
                            alt="Page 1 Image" 
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">🎤 Title Audio</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          assets.page1_audio.status === 'ready' ? 'bg-green-100 text-green-800' :
                          assets.page1_audio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assets.page1_audio.status}
                        </span>
                      </div>
                      {assets.page1_audio.url && (
                        <div className="border border-gray-200 rounded p-2">
                          <audio controls className="w-full">
                            <source src={assets.page1_audio.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Page 2 Review */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">💝 Page 2: Character Trait</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">🎨 Character Image</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          assets.page2_image.status === 'ready' ? 'bg-green-100 text-green-800' :
                          assets.page2_image.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assets.page2_image.status}
                        </span>
                      </div>
                      {assets.page2_image.url && (
                        <div className="border border-gray-200 rounded p-2">
                          <img 
                            src={assets.page2_image.url} 
                            alt="Page 2 Image" 
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">🎤 Character Audio</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          assets.page2_audio.status === 'ready' ? 'bg-green-100 text-green-800' :
                          assets.page2_audio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assets.page2_audio.status}
                        </span>
                      </div>
                      {assets.page2_audio.url && (
                        <div className="border border-gray-200 rounded p-2">
                          <audio controls className="w-full">
                            <source src={assets.page2_audio.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Ready to Create Video?</h3>
                <p className="text-sm text-green-700 mb-4">
                  All assets have been generated and are ready for video compilation. This will submit the story to the Remotion rendering pipeline.
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('audio')}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                  >
                    Back to Audio
                  </button>
                  <button
                    // onClick={submitToRemotionPipeline}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                    disabled
                  >
                    Submit to Video Pipeline (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asset Review Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isAssetModalOpen}
        onClose={closeAssetModal}
        onApprove={selectedAsset?.status === 'pending_review' ? handleAssetApprove : undefined}
        onReject={selectedAsset?.status === 'pending_review' ? handleAssetReject : undefined}
      />
    </div>
  );
}
