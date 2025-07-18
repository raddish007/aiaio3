import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';
import { AssetDetailModal } from '@/components/assets/AssetModal/AssetDetailModal';
import { User } from '@supabase/supabase-js';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  theme?: string;
  child_description?: string;
  pronouns?: string;
  sidekick_description?: string;
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
  status: 'missing' | 'generating' | 'ready' | 'pending' | 'pending_review' | 'completed' | 'approved' | 'rejected' | 'failed';
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

interface WishButtonPayload {
  childName: string;
  theme: string;
  storyVariables: StoryVariables;
  metadata: {
    template: string;
    version: string;
    generatedAt: string;
    projectId: string;
  };
  assets: {
    // Page assets for testing (Pages 1-2)
    page1_image: AssetStatus;
    page1_audio: AssetStatus;
    page2_image: AssetStatus;
    page2_audio: AssetStatus;
    
    // Background music
    background_music: AssetStatus;
    
    // Future expansion for all 9 pages
    page3_image?: AssetStatus;
    page3_audio?: AssetStatus;
    page4_image?: AssetStatus;
    page4_audio?: AssetStatus;
    page5_image?: AssetStatus;
    page5_audio?: AssetStatus;
    page6_image?: AssetStatus;
    page6_audio?: AssetStatus;
    page7_image?: AssetStatus;
    page7_audio?: AssetStatus;
    page8_image?: AssetStatus;
    page8_audio?: AssetStatus;
    page9_image?: AssetStatus;
    page9_audio?: AssetStatus;
  };
}

export default function WishButtonRequest() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [currentStoryProject, setCurrentStoryProject] = useState<any | null>(null); // Track the active story/project
  const [storyVariables, setStoryVariables] = useState<StoryVariables | null>(null);
  const [assets, setAssets] = useState<WishButtonAssets | null>(null);
  const [currentStep, setCurrentStep] = useState<'child' | 'stories' | 'variables' | 'prompts' | 'images' | 'image-review' | 'audio' | 'audio-generation' | 'audio-review' | 'payload' | 'submit' | 'review'>('child');
  const [generatingVariables, setGeneratingVariables] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ [key: string]: { image: string; audio: string; safeZone: string } } | null>(null);
  const [previousStories, setPreviousStories] = useState<any[]>([]);
  const [showPreviousStories, setShowPreviousStories] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [promptProgress, setPromptProgress] = useState({ current: 0, total: 0, currentPage: '' });
  
  // Payload state
  const [payload, setPayload] = useState<WishButtonPayload | null>(null);
  
  // Asset review modal state
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  // Video submission state
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [videoSubmissionResult, setVideoSubmissionResult] = useState<{
    success: boolean;
    job_id?: string;
    render_id?: string;
    output_url?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchChildren();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

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
    fetchPreviousStories(child, false);
  };

  // New function to refresh assets from database
  const refreshAssetsFromDatabase = async (projectId: string) => {
    try {
      console.log(`🔄 Refreshing assets for project ${projectId}...`);
      
      if (!projectId) {
        console.error('❌ No project ID provided for refresh');
        return;
      }
      
      // Query for wish-button assets - try both flat template and nested template_context
      const { data: dbAssets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching assets:', error);
        return;
      }

      console.log(`🔍 Fetched ${dbAssets?.length || 0} total assets for project ${projectId}`);
      
      // Special check for the new assets
      const newAssetIds = ['6e267312-b426-489f-9343-76ebf435a5c4', 'fb258fe1-a7bd-4ace-856a-8d840c751231'];
      const foundNewAssets = dbAssets?.filter(asset => newAssetIds.includes(asset.id)) || [];
      console.log(`🎯 Found ${foundNewAssets.length} of the new assets:`, foundNewAssets.map(a => ({ id: a.id, project_id: a.project_id, type: a.type })));

      // Filter for wish-button assets on the client side to avoid SQL operator issues
      const wishButtonAssets = dbAssets?.filter(asset => {
        const metadata = asset.metadata || {};
        const isWishButton = (
          metadata.template === 'wish-button' ||
          metadata.template_context?.template_type === 'wish-button'
        );
        console.log(`🔍 Checking asset ${asset.id}:`, {
          type: asset.type,
          template: metadata.template,
          template_context_type: metadata.template_context?.template_type,
          isWishButton: isWishButton,
          metadata: metadata
        });
        return isWishButton;
      }) || [];

      console.log(`Found ${wishButtonAssets?.length || 0} wish-button assets in database for project ${projectId}`, wishButtonAssets);
      
      if (wishButtonAssets?.length === 0) {
        console.log('⚠️ No wish-button assets found for this project. Checking all project assets...');
        console.log('All project assets:', dbAssets);
      }

      if (!assets) return; // Need initial assets structure

      // Update assets with database data
      const updatedAssets = { ...assets };

      wishButtonAssets?.forEach(dbAsset => {
        console.log(`🔍 Processing asset ${dbAsset.id}:`, {
          type: dbAsset.type,
          template: dbAsset.metadata?.template,
          template_context: dbAsset.metadata?.template_context,
          asset_purpose: dbAsset.metadata?.asset_purpose || dbAsset.metadata?.template_context?.asset_purpose,
          page: dbAsset.metadata?.page,
          status: dbAsset.status,
          url: dbAsset.file_url,
          fullMetadata: dbAsset.metadata
        });

        // Get asset purpose from multiple possible locations
        const assetPurpose = dbAsset.metadata?.asset_purpose || 
                           dbAsset.metadata?.template_context?.asset_purpose ||
                           dbAsset.metadata?.page ||
                           dbAsset.metadata?.assetPurpose; // Letter hunt format
        const assetType = dbAsset.type;
        
        console.log(`🎯 Extracted asset purpose: ${assetPurpose}, type: ${assetType}`);
        
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

        // Debug for ALL audio assets to understand the metadata issue
        if (dbAsset.type === 'audio') {
          console.log('🎵 AUDIO ASSET DEBUG:');
          console.log('Audio Asset ID:', dbAsset.id);
          console.log('Asset key:', assetKey);
          console.log('Asset key exists in updatedAssets?', assetKey && assetKey in updatedAssets);
          console.log('Metadata size (chars):', JSON.stringify(dbAsset.metadata).length);
          console.log('Metadata keys:', Object.keys(dbAsset.metadata || {}));
          
          // Check if metadata has audio_data
          if (dbAsset.metadata?.audio_data) {
            console.log('🚨 HUGE METADATA DETECTED - audio_data size:', dbAsset.metadata.audio_data.length);
            console.log('Audio_data preview:', dbAsset.metadata.audio_data.substring(0, 100) + '...');
          } else {
            console.log('✅ Clean metadata - no audio_data field (using file_url)');
          }
          
          // Special debugging for the new assets
          if (dbAsset.id === '6e267312-b426-489f-9343-76ebf435a5c4' || dbAsset.id === 'fb258fe1-a7bd-4ace-856a-8d840c751231') {
            console.log('🚨 NEW ASSET SPECIAL DEBUG:');
            console.log('Asset ID:', dbAsset.id);
            console.log('Asset purpose from metadata.asset_purpose:', dbAsset.metadata?.asset_purpose);
            console.log('Asset purpose from metadata.page:', dbAsset.metadata?.page);
            console.log('Asset purpose from template_context:', dbAsset.metadata?.template_context?.asset_purpose);
            console.log('Computed assetPurpose:', assetPurpose);
            console.log('Computed assetKey:', assetKey);
            console.log('Does updatedAssets have this key?', assetKey in updatedAssets);
            console.log('All updatedAssets keys:', Object.keys(updatedAssets));
          }
          
          // Log the clean metadata (without audio_data)
          const cleanMetadata = { ...dbAsset.metadata };
          if (cleanMetadata.audio_data) {
            cleanMetadata.audio_data = `[TRUNCATED - ${cleanMetadata.audio_data.length} chars]`;
          }
          console.log('Clean metadata:', cleanMetadata);
          
          console.log('updatedAssets keys:', Object.keys(updatedAssets));
          console.log('updatedAssets[assetKey]:', updatedAssets[assetKey as keyof WishButtonAssets]);
        }

        if (assetKey && updatedAssets[assetKey as keyof WishButtonAssets]) {
          const currentAsset = updatedAssets[assetKey as keyof WishButtonAssets];
          const mappedStatus = dbAsset.status === 'approved' ? 'ready' : 
                             dbAsset.status === 'pending' ? 'pending_review' : 
                             dbAsset.status;
          
          console.log(`📝 Status mapping for ${assetKey}: ${dbAsset.status} → ${mappedStatus}`);
          
          // Special protection for background music - only update if we have a real background music asset
          if (assetKey === 'background_music') {
            // Only update background music if this is actually a background music asset from DB
            const isRealBackgroundMusic = dbAsset.metadata?.asset_purpose === 'background_music' || 
                                         dbAsset.metadata?.template_context?.asset_purpose === 'background_music' ||
                                         dbAsset.id === 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9'; // Our known BG music ID
            
            if (isRealBackgroundMusic) {
              console.log('🎵 Updating background music with real database asset');
              updatedAssets[assetKey as keyof WishButtonAssets] = {
                ...currentAsset,
                status: mappedStatus,
                url: dbAsset.file_url,
                id: dbAsset.id
              };
            } else {
              console.log('🎵 Protecting pre-set background music, not updating');
            }
          } else {
            // Normal update for non-background-music assets
            updatedAssets[assetKey as keyof WishButtonAssets] = {
              ...currentAsset,
              status: mappedStatus,
              url: dbAsset.file_url, // Use file_url instead of url
              id: dbAsset.id
            };
          }
          
          console.log(`✅ Updated UI asset ${assetKey}:`, updatedAssets[assetKey as keyof WishButtonAssets]);

          // Final debug for audio assets
          if (dbAsset.type === 'audio') {
            console.log('🎵 FINAL AUDIO STATE:');
            console.log(`Final updatedAssets[${assetKey}]:`, updatedAssets[assetKey as keyof WishButtonAssets]);
            console.log('Should show review button?', 
              (mappedStatus === 'pending_review' || mappedStatus === 'pending' || mappedStatus === 'ready') && 
              !!dbAsset.id
            );
          }
        } else {
          console.log(`⚠️ No matching UI asset found for key: ${assetKey}`);
          // Debug for audio assets that don't get mapped
          if (dbAsset.type === 'audio') {
            console.log('🎵 AUDIO ASSET NOT MAPPED:');
            console.log('Asset key:', assetKey);
            console.log('Asset key exists check:', assetKey && assetKey in updatedAssets);
            console.log('Available keys:', Object.keys(updatedAssets));
          }
        }
      });

      setAssets(updatedAssets);
      console.log('✅ Assets refreshed from database', updatedAssets);
      
      // Separately fetch and update background music if it's not already set correctly
      if (!updatedAssets.background_music || updatedAssets.background_music.status === 'missing' || !updatedAssets.background_music.url) {
        console.log('🎵 Background music needs updating, fetching from database...');
        try {
          const { data: bgMusicAsset, error } = await supabase
            .from('assets')
            .select('*')
            .eq('id', 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9')
            .single();
            
          if (!error && bgMusicAsset) {
            console.log('✅ Found background music asset in database:', bgMusicAsset);
            updatedAssets.background_music = {
              type: 'audio',
              name: 'Wish Button Background Music',
              description: bgMusicAsset.metadata?.description || 'Pre-approved background music for wish-button template',
              status: bgMusicAsset.status === 'approved' ? 'ready' : bgMusicAsset.status,
              id: bgMusicAsset.id,
              url: bgMusicAsset.file_url
            };
            setAssets(updatedAssets);
            console.log('🎵 Updated background music asset:', updatedAssets.background_music);
          } else {
            console.warn('⚠️ Background music not found in database, using fallback');
            // Use fallback background music asset
            updatedAssets.background_music = {
              type: 'audio',
              name: 'Wish Button Background Music',
              description: 'Pre-approved background music for wish-button template',
              status: 'ready',
              id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
              url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
            };
            setAssets(updatedAssets);
            console.log('🎵 Using fallback background music asset:', updatedAssets.background_music);
          }
        } catch (error) {
          console.error('❌ Error fetching background music:', error);
          // Use fallback background music asset
          updatedAssets.background_music = {
            type: 'audio',
            name: 'Wish Button Background Music',
            description: 'Pre-approved background music for wish-button template',
            status: 'ready',
            id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
            url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
          };
          setAssets(updatedAssets);
          console.log('🎵 Using fallback background music asset after error:', updatedAssets.background_music);
        }
      } else {
        console.log('✅ Background music already properly set:', updatedAssets.background_music);
      }
      
    } catch (error) {
      console.error('Error refreshing assets:', error);
    }
  };

  const fetchPreviousStories = async (child: Child, forceRefresh = false) => {
    try {
      console.log(`🔍 Fetching previous stories for child: ${child.name} (ID: ${child.id})${forceRefresh ? ' [FORCE REFRESH]' : ''}`);
      
      // Add timestamp to force cache bust
      const timestamp = Date.now();
      
      let query = supabase
        .from('content_projects')
        .select('*')
        .eq('metadata->>template', 'wish-button')
        .eq('metadata->>child_name', child.name)
        .order('created_at', { ascending: false });
      
      // Force fresh data by adding a harmless filter that doesn't change results
      if (forceRefresh) {
        console.log('🔄 Adding cache-busting measures...');
        query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // This will never match but forces fresh query
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Previous stories not available:', error.message);
        setPreviousStories([]);
        return;
      }
      
      console.log(`📚 Found ${data?.length || 0} previous stories for ${child.name} (timestamp: ${timestamp}):`, data?.map(s => ({ id: s.id.substring(0, 8), title: s.title, created: s.created_at })));
      
      // Log full IDs for debugging
      console.log('📋 Full story IDs in result:', data?.map(s => s.id));
      
      setPreviousStories(data || []);
      
      // Extra logging to verify state change
      console.log(`🔍 Set previousStories state to ${data?.length || 0} items`);
      
    } catch (error) {
      console.error('Error fetching previous stories:', error);
      setPreviousStories([]);
    }
  };

  const loadExistingStory = async (story: any) => {
    try {
      console.log('Loading existing story:', story);
      
      // Set the current story project first
      setCurrentStoryProject(story);
      
      // Set the story variables from the saved project
      if (story.metadata?.storyVariables) {
        setStoryVariables(story.metadata.storyVariables);
        console.log('✅ Loaded story variables from metadata');
      }
      
      // For existing projects, check if they have prompts in metadata
      // We still want to load existing prompts, just not cache new ones from the old system
      if (story.metadata?.generatedPrompts) {
        setGeneratedPrompts(story.metadata.generatedPrompts);
        console.log('✅ Loaded existing prompts from project metadata');
      } else {
        console.log('🔄 No cached prompts found - prompts will be generated with new OpenAI Assistant system');
      }

      // Refresh assets from database for the UI first
      await refreshAssetsFromDatabase(story.id);

      // Check assets directly from database to determine proper step
      console.log('🔍 Checking assets from database for step determination...');
      const { data: dbAssets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', story.id);

      if (error) {
        console.error('Error fetching assets for step determination:', error);
      }

      const wishButtonAssets = dbAssets?.filter(asset => {
        const metadata = asset.metadata || {};
        return (
          metadata.template === 'wish-button' ||
          metadata.template_context?.template_type === 'wish-button'
        );
      }) || [];

      console.log(`📋 Found ${wishButtonAssets.length} wish-button assets in database`);

      // Analyze assets to determine step
      const imageAssets = wishButtonAssets.filter(asset => 
        asset.asset_type === 'image' || asset.type === 'image'
      );
      
      const audioAssets = wishButtonAssets.filter(asset => 
        asset.asset_type === 'audio' || asset.type === 'audio'
      );

      console.log(`🎨 Image assets: ${imageAssets.length}, Audio assets: ${audioAssets.length}`);
      console.log('📝 Image asset details:', imageAssets.map(a => ({ id: a.id, status: a.status, url: a.file_url })));
      console.log('📝 Audio asset details:', audioAssets.map(a => ({ id: a.id, status: a.status, url: a.file_url })));

      // Determine target step based on assets
      let targetStep = 'variables'; // default
      
      const hasStoryVariables = !!(story.metadata?.storyVariables);
      const hasPrompts = !!(story.metadata?.generatedPrompts);
      
      if (audioAssets.length > 0) {
        targetStep = 'payload'; // Has audio, go to payload page
      } else if (imageAssets.length > 0) {
        targetStep = 'audio'; // Has images, go to audio generation
      } else if (hasPrompts) {
        targetStep = 'images'; // Has prompts, go to image generation  
      } else if (hasStoryVariables) {
        targetStep = 'prompts'; // Has variables, go to prompt generation
      }

      console.log('📍 Determined target step:', targetStep, {
        hasStoryVariables,
        hasPrompts,
        imageCount: imageAssets.length,
        audioCount: audioAssets.length,
        reasoning: audioAssets.length > 0 ? 'Has audio assets' : 
                  imageAssets.length > 0 ? 'Has image assets' :
                  hasPrompts ? 'Has prompts' :
                  hasStoryVariables ? 'Has story variables' : 'Default'
      });
      
      // Update project status if it has assets but is still "planning"
      if ((imageAssets.length > 0 || audioAssets.length > 0) && story.status === 'planning') {
        console.log('🔄 Updating project status from planning to completed');
        await supabase
          .from('content_projects')
          .update({ status: 'completed' })
          .eq('id', story.id);
      }
      
      // Wait longer for React state to update, then set step
      setTimeout(() => {
        console.log('🔍 Setting step after delay:', targetStep);
        setCurrentStep(targetStep);
        
        // For projects with assets, ensure we have minimal state to render
        if (targetStep === 'payload' && (imageAssets.length > 0 || audioAssets.length > 0)) {
          // If we're going to payload step but don't have React state yet, 
          // create minimal state from the database assets
          if (!assets) {
            console.log('🔧 Creating minimal assets state for payload step');
            const minimalAssets = {
              page1_image: imageAssets[0] ? { status: 'approved', url: imageAssets[0].file_url } : null,
              page2_image: imageAssets[1] ? { status: 'approved', url: imageAssets[1].file_url } : null,
              page1_audio: audioAssets.find(a => a.status === 'approved') ? { status: 'approved', url: audioAssets.find(a => a.status === 'approved').file_url } : null,
              page2_audio: audioAssets.filter(a => a.status === 'approved')[1] ? { status: 'approved', url: audioAssets.filter(a => a.status === 'approved')[1].file_url } : null,
            };
            setAssets(minimalAssets as any);
          }
          
          // Ensure story variables are set from metadata if not already
          if (!storyVariables && story.metadata?.storyVariables) {
            setStoryVariables(story.metadata.storyVariables);
          }
        }
        
        // Debug the rendering conditions
        setTimeout(() => {
          console.log('🔍 Review step rendering debug:', {
            currentStep: targetStep,
            hasAssets: !!assets,
            hasStoryVariables: !!storyVariables,
            assetKeys: assets ? Object.keys(assets) : 'none',
            storyVarKeys: storyVariables ? Object.keys(storyVariables) : 'none'
          });
        }, 100);
      }, 1000); // Increased to 1 second
      
    } catch (error) {
      console.error('Error loading existing story:', error);
      alert('Failed to load existing story. Please try again.');
    }
  };  const deleteStory = async (storyId: string, storyTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${storyTitle}"? This will also delete all associated assets and cannot be undone.`)) {
      return;
    }

    try {
      console.log(`🗑️ Deleting story ${storyId} and its assets via API...`);
      console.log(`🔍 Story ID type: ${typeof storyId}, length: ${storyId.length}`);
      
      // Call the admin API endpoint that uses service role permissions
      const response = await fetch('/api/admin/delete-story', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success) {
        console.error('❌ API returned unsuccessful response:', data);
        throw new Error(data.error || 'Deletion failed');
      }

      console.log('✅ Successfully deleted story via API:', data);
      
      // Refresh the previous stories list with aggressive cache busting
      if (selectedChild) {
        console.log(`🔄 Refreshing previous stories list for ${selectedChild.name} with force refresh...`);
        
        // Add a delay to ensure database changes are committed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a complete refresh with cache busting
        await fetchPreviousStories(selectedChild, true);
        console.log(`✅ Refreshed previous stories list with force refresh`);
        
        // Double-check by calling again after another delay
        setTimeout(async () => {
          console.log('🔄 Double-checking stories list after additional delay...');
          await fetchPreviousStories(selectedChild, true);
        }, 2000);
      }
      
      // If the deleted story was the currently loaded one, reset the state
      if (currentStoryProject?.id === storyId) {
        console.log('🗑️ Deleted story was currently loaded, resetting state...');
        setCurrentStoryProject(null);
        setStoryVariables(null);
        setGeneratedPrompts(null);
        setAssets(null);
        setCurrentStep('stories');
      }
      
      alert(`Story deleted successfully! Removed project and ${data.deletedAssets} assets.`);
      
    } catch (error) {
      console.error('💥 Error deleting story:', error);
      alert(`Failed to delete story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openAssetModal = async (asset: any) => {
    try {
      // Fetch the full asset data from the database
      const { data: fullAsset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset.id)
        .single();

      if (error) {
        console.error('Error fetching asset for modal:', error);
        // Fallback to the simplified asset
        setSelectedAsset(asset);
      } else {
        // Use the full asset data from database
        setSelectedAsset(fullAsset);
      }
      setIsAssetModalOpen(true);
    } catch (error) {
      console.error('Error opening asset modal:', error);
      // Fallback to the simplified asset
      setSelectedAsset(asset);
      setIsAssetModalOpen(true);
    }
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

  const buildPayload = () => {
    if (!storyVariables || !assets || !currentStoryProject || !selectedChild) {
      console.error('Missing required data for payload building:', { storyVariables, assets, currentStoryProject, selectedChild });
      return;
    }

    console.log('🔍 Building payload with assets:', {
      hasBackgroundMusic: !!assets.background_music,
      backgroundMusicStatus: assets.background_music?.status,
      backgroundMusicUrl: assets.background_music?.url,
      allAssetKeys: Object.keys(assets)
    });

    // Ensure background music is included - use fallback if needed
    const backgroundMusicAsset = assets.background_music || {
      type: 'audio',
      name: 'Wish Button Background Music',
      description: 'Pre-approved background music for wish-button template',
      status: 'ready',
      id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
      url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
    };

    const newPayload: WishButtonPayload = {
      childName: storyVariables.childName,
      theme: storyVariables.theme,
      storyVariables: storyVariables,
      metadata: {
        template: 'wish-button',
        version: '1.0',
        generatedAt: new Date().toISOString(),
        projectId: currentStoryProject.id
      },
      assets: {
        // Core pages for testing
        page1_image: assets.page1_image,
        page1_audio: assets.page1_audio,
        page2_image: assets.page2_image,
        page2_audio: assets.page2_audio,
        background_music: backgroundMusicAsset,
        
        // Future expansion - all other pages
        page3_image: assets.page3_image,
        page3_audio: assets.page3_audio,
        page4_image: assets.page4_image,
        page4_audio: assets.page4_audio,
        page5_image: assets.page5_image,
        page5_audio: assets.page5_audio,
        page6_image: assets.page6_image,
        page6_audio: assets.page6_audio,
        page7_image: assets.page7_image,
        page7_audio: assets.page7_audio,
        page8_image: assets.page8_image,
        page8_audio: assets.page8_audio,
        page9_image: assets.page9_image,
        page9_audio: assets.page9_audio
      }
    };

    setPayload(newPayload);
    console.log('🏗️ Built Wish Button payload:', newPayload);
    console.log('🎵 Background music in payload:', newPayload.assets.background_music);
  };

  const submitToRemotionPipeline = async () => {
    if (!payload || !selectedChild || !storyVariables) {
      console.error('Missing required data for video submission');
      alert('Missing required data for video submission');
      return;
    }

    // Validate that required assets are ready
    const requiredAssets = ['page1_image', 'page1_audio', 'page2_image', 'page2_audio', 'background_music'];
    const missingAssets = requiredAssets.filter(key => {
      const asset = payload.assets[key as keyof typeof payload.assets];
      return !asset || asset.status !== 'ready' && asset.status !== 'approved';
    });

    if (missingAssets.length > 0) {
      alert(`Cannot submit video: Missing ready assets: ${missingAssets.join(', ')}`);
      return;
    }

    setSubmittingVideo(true);
    setVideoSubmissionResult(null);

    try {
      console.log('🎬 Submitting Wish Button video generation...');

      // Clean asset objects to only include url and status
      const cleanedAssets: any = {};
      requiredAssets.forEach(key => {
        const asset = payload.assets[key as keyof typeof payload.assets];
        cleanedAssets[key] = {
          url: asset.url || '',
          status: asset.status
        };
      });

      console.log('🧹 Cleaned assets for API:', cleanedAssets);

      // Call our new Wish Button generation API
      const response = await fetch('/api/videos/generate-wish-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: payload.childName,
          theme: payload.theme,
          childId: selectedChild.id,
          storyVariables: payload.storyVariables,
          assets: cleanedAssets,
          submitted_by: user?.id
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Video generation submitted successfully:', result);
        setVideoSubmissionResult({
          success: true,
          job_id: result.job_id,
          render_id: result.render_id,
          output_url: result.output_url
        });
        alert(`✅ Wish Button video generation started successfully!\n\nJob ID: ${result.job_id}\nRender ID: ${result.render_id}\nOutput URL: ${result.output_url}`);
      } else {
        console.error('❌ Video generation failed:', result);
        setVideoSubmissionResult({
          success: false,
          error: result.error || 'Unknown error'
        });
        alert(`❌ Failed to submit video: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error submitting video:', error);
      setVideoSubmissionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      });
      alert(`💥 Error submitting video: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setSubmittingVideo(false);
    }
  };

  const canSubmitVideo = () => {
    if (!payload || !selectedChild || !storyVariables) return false;
    
    // Check that required assets are ready
    const requiredAssets = ['page1_image', 'page1_audio', 'page2_image', 'page2_audio', 'background_music'];
    const assetStatuses = requiredAssets.map(key => {
      const asset = payload.assets[key as keyof typeof payload.assets];
      return {
        key,
        asset: !!asset,
        status: asset?.status,
        ready: asset && (asset.status === 'ready' || asset.status === 'approved')
      };
    });
    
    console.log('🔍 Asset readiness check:', assetStatuses);
    
    const allReady = requiredAssets.every(key => {
      const asset = payload.assets[key as keyof typeof payload.assets];
      return asset && (asset.status === 'ready' || asset.status === 'approved');
    });
    
    console.log('🎯 Can submit video:', allReady);
    return allReady;
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
        
        await initializeAssets(data.storyVariables);
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
            title: `Wish Button Story for ${child.name}`,
            theme: child.primary_interest,
            target_age: `${child.age} years`,
            duration: 90, // Default duration for wish button stories
            status: 'planning',
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

  const initializeAssets = async (variables: StoryVariables) => {
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

      // Background Music - Fetch from database
      background_music: {
        type: 'audio',
        name: 'Wish Button Background Music',
        description: 'Pre-approved background music for wish-button template',
        status: 'approved',
        id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
        url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
      }
    };
    
    // Fetch the real background music asset from database
    try {
      console.log('🎵 Fetching background music asset from database...');
      const { data: bgMusicAsset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9')
        .single();
        
      if (!error && bgMusicAsset) {
        console.log('✅ Found background music asset in database:', bgMusicAsset);
        initialAssets.background_music = {
          type: 'audio',
          name: 'Wish Button Background Music',
          description: bgMusicAsset.metadata?.description || 'Pre-approved background music for wish-button template',
          status: bgMusicAsset.status === 'approved' ? 'ready' : bgMusicAsset.status,
          id: bgMusicAsset.id,
          url: bgMusicAsset.file_url
        };
        console.log('🎵 Updated background music asset:', initialAssets.background_music);
      } else {
        console.warn('⚠️ Could not fetch background music from database, using fallback');
      }
    } catch (error) {
      console.error('❌ Error fetching background music:', error);
    }
    
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
    if (!storyVariables || !assets || !currentStoryProject) {
      console.error('Missing required data for prompt generation:', { storyVariables, assets, currentStoryProject });
      alert('Missing story context. Please ensure story variables are generated first.');
      return;
    }
    
    setGeneratingPrompts(true);
    setCurrentStep('prompts');
    
    const pages = ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'];
    setPromptProgress({ current: 0, total: pages.length, currentPage: '' });
    
    try {
      console.log('🎯 Starting prompt generation for Wish Button story');
      console.log('📊 Story variables being sent:', storyVariables);
      console.log('📄 Generating prompts for pages:', pages);
      console.log('📋 Project ID being sent:', currentStoryProject.id);
      
      const startTime = Date.now();
      
      setPromptProgress({ current: 0, total: pages.length, currentPage: 'Initializing...' });
      
      const response = await fetch('/api/wish-button/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyVariables,
          pages,
          projectId: currentStoryProject?.id // Pass the existing project ID
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
        
        // Save the generated prompts to the project metadata for persistence
        if (currentStoryProject) {
          await updateProjectWithPrompts(currentStoryProject.id, data.prompts);
        }
        
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

  const updateProjectWithPrompts = async (projectId: string, prompts: any) => {
    try {
      console.log('💾 Saving generated prompts to project metadata...');
      const { error } = await supabase
        .from('content_projects')
        .update({
          metadata: {
            ...currentStoryProject?.metadata,
            generatedPrompts: prompts,
            lastPromptsGenerated: new Date().toISOString(),
            promptGenerationMethod: 'openai-assistant'
          }
        })
        .eq('id', projectId);

      if (error) {
        console.error('❌ Error saving prompts to project:', error);
      } else {
        console.log('✅ Prompts saved to project metadata');
      }
    } catch (error) {
      console.error('❌ Error in updateProjectWithPrompts:', error);
    }
  };

  const generateAllImages = async () => {
    if (!storyVariables || !assets || !currentStoryProject || !generatedPrompts) {
      console.error('Missing required data for image generation:', { 
        storyVariables: !!storyVariables, 
        assets: !!assets, 
        currentStoryProject: !!currentStoryProject,
        generatedPrompts: !!generatedPrompts
      });
      alert('Missing required data for image generation. Please ensure story variables and prompts are generated first.');
      return;
    }
    
    setCurrentStep('images');
    
    try {
      console.log('🎨 Starting batch image generation...');
      console.log('📊 Sending current data:', {
        projectId: currentStoryProject.id,
        storyVariables: Object.keys(storyVariables),
        generatedPrompts: Object.keys(generatedPrompts)
      });
      
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
            batchSize: batchSize,
            projectId: currentStoryProject.id,
            storyVariables: storyVariables,
            generatedPrompts: generatedPrompts
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

  const generateSingleAudio = async (page: string) => {
    if (!storyVariables || !assets || !currentStoryProject || !generatedPrompts) {
      console.error('Missing required data for audio generation:', { storyVariables, assets, currentStoryProject, generatedPrompts });
      alert('Missing story context. Please ensure story variables and prompts are generated first.');
      return;
    }
    
    try {
      console.log(`🎯 Starting single audio generation for ${page} in project ${currentStoryProject.id}...`);
      
      // Update asset status to generating (reset from any previous failed state)
      setAssets(prev => prev ? {
        ...prev,
        [`${page}_audio`]: { ...prev[`${page}_audio` as keyof WishButtonAssets], status: 'generating' }
      } : null);
      
      // Get the audio script for this page
      const pagePrompts = generatedPrompts[page];
      if (!pagePrompts?.audio) {
        throw new Error(`No audio script found for ${page}`);
      }
      
      // Use the existing audio generation API that works with Letter Hunt
      const response = await fetch('/api/assets/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: pagePrompts.audio,
          voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
          speed: 0.85,
          style: 'storytelling',
          projectId: currentStoryProject.id,
          isPersonalized: true,
          templateContext: {
            templateType: 'wish-button',
            assetPurpose: page, // e.g., 'page1', 'page2'
            childName: storyVariables.childName,
            // Add any wish-button specific context
            wishItem: storyVariables.wishResultItems
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Audio Generation API Response Error:', response.status, errorText);
        
        // Parse the error to get better user message
        let userMessage = `Server error (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.details && errorData.details.includes('system_busy')) {
            userMessage = 'ElevenLabs API is experiencing heavy traffic. Please try again in a few minutes. Higher subscriptions have priority.';
          } else if (errorData.details && errorData.details.includes('429')) {
            userMessage = 'Rate limit reached. Please wait a moment and try again.';
          } else if (errorData.error) {
            userMessage = errorData.error;
          }
        } catch (parseError) {
          // Keep the generic message if parsing fails
        }
        
        throw new Error(userMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Single audio generation completed for ${page}:`, data.asset);
        console.log(`🎯 Asset created with status: ${data.asset.status}, ID: ${data.asset.id}, URL: ${data.asset.file_url}`);
        
        // Wait a moment to ensure database write is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh assets from database to get the latest status
        console.log(`🔄 Refreshing assets from database for project: ${currentStoryProject.id}`);
        await refreshAssetsFromDatabase(currentStoryProject.id);
        
        alert(`Audio generation completed for ${page}! Asset created with ID: ${data.asset.id}. Check the review button above.`);
        
      } else {
        console.error('❌ Audio Generation API returned error:', data.error, data.details);
        throw new Error(data.error || 'Unknown audio generation error');
      }
      
    } catch (error) {
      console.error('💥 Error in single audio generation:', error);
      
      // Reset asset status on error
      setAssets(prev => prev ? {
        ...prev,
        [`${page}_audio`]: { ...prev[`${page}_audio` as keyof WishButtonAssets], status: 'failed' }
      } : null);
      
      if (error instanceof Error) {
        alert(`Failed to generate audio for ${page}: ${error.message}`);
      } else {
        alert(`Failed to generate audio for ${page}. Please check the console for details.`);
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

  // Helper function to determine which steps are completed
  const getCompletedSteps = () => {
    const completed = new Set(['child']); // Child selection is always completed when we have a selected child
    
    if (selectedChild) {
      completed.add('stories'); // Stories step is completed when we have a selected child
    }
    
    if (storyVariables) {
      completed.add('variables'); // Variables are generated
    }
    
    if (generatedPrompts) {
      completed.add('prompts'); // Prompts are generated
    }
    
    if (assets) {
      // Check if any images are generated/ready
      const imageKeys = ['page1_image', 'page2_image', 'page3_image', 'page4_image', 'page5_image', 'page6_image', 'page7_image', 'page8_image', 'page9_image'];
      const hasImages = imageKeys.some(key => {
        const asset = assets[key as keyof WishButtonAssets];
        return asset && (asset.status === 'ready' || asset.status === 'approved' || asset.status === 'pending_review' || asset.url);
      });
      
      if (hasImages) {
        completed.add('images');
        completed.add('image-review');
      }
      
      // Check if any audio is generated/ready
      const audioKeys = ['page1_audio', 'page2_audio', 'page3_audio', 'page4_audio', 'page5_audio', 'page6_audio', 'page7_audio', 'page8_audio', 'page9_audio'];
      const hasAudio = audioKeys.some(key => {
        const asset = assets[key as keyof WishButtonAssets];
        return asset && (asset.status === 'ready' || asset.status === 'approved' || asset.status === 'pending_review' || asset.url);
      });
      
      if (hasAudio) {
        completed.add('audio');
        completed.add('audio-generation');
        completed.add('audio-review');
      }
    }
    
    if (payload) {
      completed.add('payload');
      completed.add('review');
    }
    
    return completed;
  };

  // Helper function to check if a step can be navigated to
  const canNavigateToStep = (stepKey: string) => {
    const completedSteps = getCompletedSteps();
    
    // Always allow navigation to completed steps
    if (completedSteps.has(stepKey)) {
      return true;
    }
    
    // Allow navigation to the next logical step based on completion
    const stepOrder = ['child', 'stories', 'variables', 'prompts', 'images', 'image-review', 'audio', 'audio-generation', 'audio-review', 'payload', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(stepKey);
    
    // Allow navigation to current step or one step ahead
    return targetIndex <= currentIndex + 1;
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

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
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
              { key: 'audio', label: 'Audio Scripts', icon: '📝' },
              { key: 'audio-generation', label: 'Generate Audio', icon: '🎤' },
              { key: 'audio-review', label: 'Review Audio', icon: '🎧' },
              { key: 'payload', label: 'Build Payload', icon: '📦' },
              { key: 'review', label: 'Final Review', icon: '🎬' }
            ].map((step, index) => {
              const completedSteps = getCompletedSteps();
              const isCompleted = completedSteps.has(step.key);
              const isCurrent = currentStep === step.key;
              const canNavigate = canNavigateToStep(step.key);
              
              return (
                <div key={step.key} className="flex items-center">
                  <button
                    onClick={() => canNavigate ? setCurrentStep(step.key) : null}
                    disabled={!canNavigate}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCurrent 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : isCompleted
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : canNavigate
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } ${canNavigate ? 'cursor-pointer' : ''}`}
                    title={isCompleted ? `${step.label} (Completed)` : canNavigate ? step.label : `${step.label} (Not available yet)`}
                  >
                    {isCompleted && !isCurrent ? '✓' : step.icon}
                  </button>
                  <span className={`ml-2 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                  {index < 10 && <div className={`w-8 h-px mx-4 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-300'
                  }`}></div>}
                </div>
              );
            })}
          </div>
          
          {/* Progress Information */}
          {(storyVariables || generatedPrompts || assets) && (
            <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-4">
                {currentStoryProject && (
                  <span>📁 Project: {currentStoryProject.id.substring(0, 8)}...</span>
                )}
                {storyVariables && (
                  <span>✅ Variables: {storyVariables.childName}</span>
                )}
                {generatedPrompts && (
                  <span>✅ Prompts: {Object.keys(generatedPrompts).length} pages</span>
                )}
                {assets && (
                  <span>🎨 Assets: {Object.values(assets).filter(asset => asset.status === 'ready' || asset.status === 'approved').length} ready</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Story Context Card */}
        {currentStoryProject && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  📖 Currently Working On: {selectedChild?.name}'s Wish Button Story
                </h3>
                <div className="text-sm text-blue-700 mt-1 space-x-4">
                  <span>🆔 Project: {currentStoryProject.id.substring(0, 8)}...</span>
                  {storyVariables && (
                    <>
                      <span>🎭 Theme: {storyVariables.theme}</span>
                      <span>✨ Wish Item: {storyVariables.wishResultItems}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  // Reset to fresh state
                  setCurrentStoryProject(null);
                  setStoryVariables(null);
                  setGeneratedPrompts(null);
                  setAssets(null);
                  setCurrentStep('stories');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🔄 Start Fresh
              </button>
            </div>
          </div>
        )}

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
                    {previousStories.map((story, index) => {
                      const hasVariables = !!story.metadata?.storyVariables;
                      const hasPrompts = !!story.metadata?.generatedPrompts;
                      const createdDate = new Date(story.created_at).toLocaleDateString();
                      const createdTime = new Date(story.created_at).toLocaleTimeString();
                      const theme = story.metadata?.storyVariables?.theme || story.theme || 'Unknown';
                      
                      return (
                        <div key={story.id} className="bg-gray-50 border border-gray-200 rounded p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Story #{index + 1} - {theme} Theme
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>📅 Created: {createdDate} at {createdTime}</p>
                                <p>🆔 Project ID: {story.id.substring(0, 8)}...</p>
                                {hasVariables && story.metadata.storyVariables && (
                                  <p>🎭 Character: {story.metadata.storyVariables.mainCharacter?.substring(0, 50)}...</p>
                                )}
                              </div>
                              
                              {/* Progress Indicators */}
                              <div className="mt-3 flex items-center space-x-4 text-xs">
                                <span className={`px-2 py-1 rounded ${hasVariables ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {hasVariables ? '✅' : '⏳'} Variables
                                </span>
                                <span className={`px-2 py-1 rounded ${hasPrompts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {hasPrompts ? '✅' : '⏳'} Prompts
                                </span>
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                                  📊 Status: {story.status}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex space-x-2">
                              <button
                                onClick={() => loadExistingStory(story)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                              >
                                Resume Story
                              </button>
                              <button
                                onClick={() => deleteStory(story.id, `Story #${index + 1} - ${theme} Theme`)}
                                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm font-medium"
                                title="Delete this story and all its assets"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                
                {/* Navigation for loaded stories */}
                {generatedPrompts && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentStep('stories')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                      >
                        ← Back to Stories
                      </button>
                      <button
                        onClick={() => setCurrentStep('prompts')}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                      >
                        View Prompts →
                      </button>
                    </div>
                  </div>
                )}
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
                            onClick={async () => imageAsset.id && await openAssetModal({ 
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
                            onClick={async () => imageAsset.id && await openAssetModal({ 
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
                          
                          {(imageAsset.status === 'ready' || imageAsset.status === 'pending_review' || imageAsset.status === 'approved') && imageAsset.id && (
                            <button
                              className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                              onClick={async () => await openAssetModal({ 
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
                        (asset.status === 'ready' || asset.status === 'pending_review' || asset.status === 'approved') &&
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
                    console.log('🔍 Debug: Checking assets for audio generation...');
                    console.log('Current assets:', assets);
                    console.log('Current story project:', currentStoryProject);
                    
                    const readyImages = Object.entries(assets).filter(([key, asset]) => 
                      asset.type === 'image' && 
                      (asset.status === 'ready' || asset.status === 'pending_review' || asset.status === 'approved') &&
                      (key === 'page1_image' || key === 'page2_image')
                    );
                    
                    console.log('Ready images found:', readyImages);
                    console.log('Ready images count:', readyImages.length);
                    
                    if (readyImages.length < 2) {
                      alert(`Please ensure Pages 1-2 images are generated and ready. Currently ${readyImages.length}/2 images are ready.`);
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

        {/* Step 6a: Audio Prompt Review */}
        {currentStep === 'audio' && generatedPrompts && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6a: Review Audio Scripts</h2>
            
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Audio Script Review</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Review and edit the audio scripts for Pages 1-2 before generating the actual audio. These scripts will be converted to speech using ElevenLabs voice synthesis.
                </p>
                <div className="text-xs text-blue-600">
                  💡 Tip: Scripts are automatically saved as you edit them. Click "Generate Audio →" when ready to proceed to audio generation.
                </div>
              </div>

              {/* Background Music Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">🎼 Wish Button Background Music</h4>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      Pre-approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Using existing approved background music track (ID: a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9)
                  </p>
                  <div className="text-xs text-green-600">
                    ✅ Background music is already approved and ready to use
                  </div>
                </div>
              </div>

              {/* Audio Scripts - Pages 1-2 only for testing */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Audio Scripts (Testing with Pages 1-2)</h3>
                
                {(['page1', 'page2'] as const).map((page) => {
                  const pageNum = parseInt(page.replace('page', ''));
                  const pagePrompts = generatedPrompts[page];
                  
                  if (!pagePrompts) return null;
                  
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">
                        🎤 Page {pageNum} Audio Script
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Narration Script
                          </label>
                          <textarea
                            value={pagePrompts.audio}
                            onChange={(e) => {
                              setGeneratedPrompts(prev => ({
                                ...prev!,
                                [page]: { ...prev![page], audio: e.target.value }
                              }));
                              // Note: For production, consider debounced API call to update prompts in database
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={3}
                            placeholder="Enter the narration script for this page..."
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Character count: {pagePrompts.audio.length} | Estimated duration: ~{Math.ceil(pagePrompts.audio.length / 15)} seconds
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Disabled pages for testing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                  {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
                    const pageNum = parseInt(page.replace('page', ''));
                    return (
                      <div key={page} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">
                          🎤 Page {pageNum} Audio Script
                        </h4>
                        <div className="bg-gray-100 p-3 rounded text-sm text-gray-500">
                          Disabled for testing - focusing on Pages 1-2 only
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  onClick={() => setCurrentStep('audio-generation')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Generate Audio →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6b: Audio Generation & Moderation */}
        {currentStep === 'audio-generation' && assets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6b: Generate & Moderate Audio</h2>
            
            {/* Debug: Show current audio asset statuses */}
            {(() => {
              console.log('🔍 Step 6b - Current audio asset statuses:', {
                page1_audio: assets.page1_audio ? {
                  status: assets.page1_audio.status,
                  id: assets.page1_audio.id,
                  url: assets.page1_audio.url,
                  hasId: !!assets.page1_audio.id,
                  shouldShowReview: (assets.page1_audio.status === 'pending_review' || assets.page1_audio.status === 'pending' || assets.page1_audio.status === 'ready') && !!assets.page1_audio.id
                } : 'undefined',
                page2_audio: assets.page2_audio ? {
                  status: assets.page2_audio.status,
                  id: assets.page2_audio.id,
                  url: assets.page2_audio.url,
                  hasId: !!assets.page2_audio.id,
                  shouldShowReview: (assets.page2_audio.status === 'pending_review' || assets.page2_audio.status === 'pending' || assets.page2_audio.status === 'ready') && !!assets.page2_audio.id
                } : 'undefined'
              });
              return null;
            })()}
            
            <div className="space-y-6">
              {/* Generation Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-green-900">Audio Generation Status</h3>
                  <button
                    onClick={() => currentStoryProject && refreshAssetsFromDatabase(currentStoryProject.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    disabled={!currentStoryProject}
                  >
                    🔄 Refresh Assets
                  </button>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  Generate audio for Pages 1-2 using the reviewed scripts. Background music is pre-approved and ready to use.
                </p>
                <div className="text-xs text-green-600">
                  💡 If generation fails due to ElevenLabs being busy, click "Retry Generation" to try again.
                </div>
              </div>

              {/* Background Music - Pre-approved */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">🎼 Wish Button Background Music</h4>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      Approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Using existing approved background music (ID: a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9)
                  </p>
                  <div className="text-xs text-green-600">
                    ✅ Ready to use in video compilation
                  </div>
                </div>
              </div>

              {/* Page Audio Generation - Pages 1-2 only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['page1', 'page2'] as const).map((page) => {
                  const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
                  const pageNum = parseInt(page.replace('page', ''));
                  
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        🎤 Page {pageNum} Audio
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          audioAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                          audioAsset.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                          audioAsset.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          audioAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          audioAsset.status === 'approved' ? 'bg-green-100 text-green-800' :
                          audioAsset.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {audioAsset.status === 'pending_review' ? 'Ready for Review' : 
                           audioAsset.status === 'pending' ? 'Ready for Review' :
                           audioAsset.status === 'failed' ? 'Failed - Retry' : audioAsset.status}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{audioAsset.description}</p>
                      
                      {(audioAsset.status === 'ready' || audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'approved') && audioAsset.url && (
                        <div className="mb-3 border border-gray-200 rounded p-2">
                          <audio controls className="w-full">
                            <source src={audioAsset.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          disabled={audioAsset.status === 'generating'}
                          onClick={() => generateSingleAudio(page)}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                            audioAsset.status === 'generating' 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : audioAsset.status === 'failed'
                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {audioAsset.status === 'generating' ? 'Generating...' : 
                           audioAsset.status === 'failed' ? 'Retry Generation' :
                           (audioAsset.status === 'ready' || audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'approved') ? 'Regenerate' : 'Generate'}
                        </button>
                        
                        {(audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'ready') && audioAsset.id && (
                          <button
                            className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                            onClick={async () => {
                              console.log(`🎯 Opening review modal for ${page} audio:`, {
                                id: audioAsset.id,
                                status: audioAsset.status,
                                url: audioAsset.url
                              });
                              await openAssetModal({ 
                                id: audioAsset.id, 
                                url: audioAsset.url,
                                type: 'audio',
                                title: `Page ${pageNum} Audio`,
                                status: audioAsset.status,
                                metadata: { page: pageNum }
                              });
                            }}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Audio Status Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Audio Generation Summary (Testing with Pages 1-2)</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Ready Audio: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        (asset.status === 'ready' || asset.status === 'pending_review' || asset.status === 'pending' || asset.status === 'approved') &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Generating: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        asset.status === 'generating' &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Failed: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        asset.status === 'failed' &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Background Music: </span>
                    <span className="font-medium text-green-900">✅ Pre-approved</span>
                  </div>
                </div>
              </div>

              {/* Disabled pages for testing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
                {(['page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'] as const).map((page) => {
                  const pageNum = parseInt(page.replace('page', ''));
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">
                        🎤 Page {pageNum} Audio
                      </h4>
                      <div className="bg-gray-100 p-3 rounded text-sm text-gray-500 mb-3">
                        Disabled for testing
                      </div>
                      <button
                        disabled={true}
                        className="w-full px-3 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Generate (Disabled)
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('audio')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Audio Scripts
                </button>
                <button
                  onClick={() => setCurrentStep('audio-review')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Review Audio →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6c: Audio Review & Moderation */}
        {currentStep === 'audio-review' && assets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 6c: Review Generated Audio</h2>
            
            {/* Debug: Show current audio asset statuses */}
            {(() => {
              console.log('🔍 Step 6c - Current audio asset statuses:', {
                page1_audio: assets.page1_audio ? {
                  status: assets.page1_audio.status,
                  id: assets.page1_audio.id,
                  url: assets.page1_audio.url,
                  hasId: !!assets.page1_audio.id,
                  shouldShowReview: (assets.page1_audio.status === 'pending_review' || assets.page1_audio.status === 'pending' || assets.page1_audio.status === 'ready') && !!assets.page1_audio.id
                } : 'undefined',
                page2_audio: assets.page2_audio ? {
                  status: assets.page2_audio.status,
                  id: assets.page2_audio.id,
                  url: assets.page2_audio.url,
                  hasId: !!assets.page2_audio.id,
                  shouldShowReview: (assets.page2_audio.status === 'pending_review' || assets.page2_audio.status === 'pending' || assets.page2_audio.status === 'ready') && !!assets.page2_audio.id
                } : 'undefined'
              });
              return null;
            })()}
            
            <div className="space-y-6">
              {/* Review Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-900 mb-2">Audio Review Instructions</h3>
                <p className="text-sm text-yellow-700">
                  Listen to the generated audio files and approve or reject them. You can regenerate individual audio files if needed.
                  Use the "Review" button to open the detailed asset review modal.
                </p>
              </div>

              {/* Refresh Assets Button */}
              <div className="mb-6">
                <button
                  onClick={() => currentStoryProject && refreshAssetsFromDatabase(currentStoryProject.id)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  🔄 Refresh Assets
                </button>
              </div>

              {/* Background Music - Pre-approved */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-900 mb-4">🎵 Background Music</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">🎼 Wish Button Background Music</h4>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      Approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Using existing approved background music (ID: a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9)
                  </p>
                  <div className="text-xs text-green-600">
                    ✅ Ready to use in video compilation
                  </div>
                </div>
              </div>

              {/* Audio Review Grid - Pages 1-2 only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['page1', 'page2'] as const).map((page) => {
                  const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
                  const pageNumber = parseInt(page.replace('page', ''));
                  
                  return (
                    <div key={page} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">
                          🎤 Page {pageNumber} Audio
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          audioAsset.status === 'ready' ? 'bg-green-100 text-green-800' :
                          audioAsset.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                          audioAsset.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          audioAsset.status === 'approved' ? 'bg-green-100 text-green-800' :
                          audioAsset.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          audioAsset.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {audioAsset.status === 'pending_review' ? 'Ready for Review' : 
                           audioAsset.status === 'pending' ? 'Ready for Review' :
                           audioAsset.status === 'approved' ? 'Approved' :
                           audioAsset.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{audioAsset.description}</p>
                      
                      {/* Audio Player */}
                      {(audioAsset.status === 'ready' || audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'approved') && audioAsset.url ? (
                        <div className="mb-4 border border-gray-200 rounded p-3 bg-gray-50">
                          <audio controls className="w-full">
                            <source src={audioAsset.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded text-center text-sm text-gray-500">
                          {audioAsset.status === 'generating' ? '🎤 Generating audio...' :
                           audioAsset.status === 'failed' ? '❌ Generation failed' :
                           '⏳ Audio not yet generated'}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {audioAsset.status === 'missing' || audioAsset.status === 'failed' ? (
                          <button
                            onClick={() => generateSingleAudio(page)}
                            className="flex-1 px-3 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {audioAsset.status === 'failed' ? 'Retry Generation' : 'Generate Audio'}
                          </button>
                        ) : audioAsset.status === 'generating' ? (
                          <button
                            disabled
                            className="flex-1 px-3 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            Generating...
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => generateSingleAudio(page)}
                              className="flex-1 px-3 py-2 rounded text-sm font-medium bg-orange-600 text-white hover:bg-orange-700"
                            >
                              Regenerate
                            </button>
                            
                            {(audioAsset.status === 'pending_review' || audioAsset.status === 'pending' || audioAsset.status === 'ready') && audioAsset.id && (
                              <button
                                className="flex-1 px-3 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                                onClick={async () => {
                                  console.log(`🎯 Opening review modal for ${page} audio from audio-review step:`, {
                                    id: audioAsset.id,
                                    status: audioAsset.status,
                                    url: audioAsset.url
                                  });
                                  await openAssetModal({ 
                                    id: audioAsset.id, 
                                    url: audioAsset.url,
                                    type: 'audio',
                                    title: `Page ${pageNumber} Audio`,
                                    status: audioAsset.status,
                                    metadata: { page: pageNumber }
                                  });
                                }}
                              >
                                Review & Approve
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Audio Status Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Audio Review Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Generated: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        (asset.status === 'ready' || asset.status === 'pending_review' || asset.status === 'pending' || asset.status === 'approved') &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Approved: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        asset.status === 'approved' &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Pending Review: </span>
                    <span className="font-medium text-blue-900">
                      {Object.values(assets).filter(asset => 
                        asset.type === 'audio' && 
                        (asset.status === 'pending_review' || asset.status === 'pending') &&
                        (asset.name.includes('Page 1') || asset.name.includes('Page 2'))
                      ).length}/2
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Background Music: </span>
                    <span className="font-medium text-green-900">✅ Pre-approved</span>
                  </div>
                </div>
              </div>

              {/* Audio Review Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">📋 Audio Review Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Listen for clear pronunciation and natural speech patterns</li>
                  <li>• Check that the audio matches the script content</li>
                  <li>• Ensure appropriate pacing for the target age group</li>
                  <li>• Verify audio quality (no distortion, clear voice)</li>
                  <li>• Use the asset modal to approve or reject each audio file</li>
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('audio-generation')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Audio Generation
                </button>
                <button
                  onClick={() => {
                    // Check if audio assets are approved before proceeding
                    const approvedAudio = Object.entries(assets).filter(([key, asset]) => 
                      asset.type === 'audio' && 
                      (asset.status === 'approved' || asset.status === 'ready') && // Check for both approved and ready status
                      (key === 'page1_audio' || key === 'page2_audio')
                    );
                    
                    console.log('🔍 Final Review Check:', {
                      page1_audio: assets?.page1_audio,
                      page2_audio: assets?.page2_audio,
                      approvedAudio: approvedAudio,
                      approvedCount: approvedAudio.length
                    });
                    
                    if (approvedAudio.length < 2) {
                      alert(`Please approve Pages 1-2 audio before proceeding. Currently ${approvedAudio.length}/2 audio files are approved.`);
                      return;
                    }
                    
                    setCurrentStep('payload');
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Continue to Final Review →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Build Payload for Remotion */}
        {currentStep === 'payload' && assets && storyVariables && currentStoryProject && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 7: Build Payload for Remotion</h2>
            
            <div className="space-y-6">
              
              {!payload ? (
                /* Initial Payload Building */
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">Ready to Build Payload</h3>
                    <p className="text-sm text-blue-700">
                      All assets have been generated and approved. Click below to build the complete payload structure for Remotion video generation.
                    </p>
                  </div>

                  {/* Pre-build Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Story Info */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-800 mb-3">📖 Story Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Child:</strong> {storyVariables.childName}</div>
                        <div><strong>Theme:</strong> {storyVariables.theme}</div>
                        <div><strong>Main Character:</strong> {storyVariables.mainCharacter.substring(0, 40)}...</div>
                        <div><strong>Wish Item:</strong> {storyVariables.wishResultItems}</div>
                        <div><strong>Project ID:</strong> {currentStoryProject.id}</div>
                      </div>
                    </div>

                    {/* Asset Readiness */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-800 mb-3">✅ Asset Readiness</h3>
                      <div className="space-y-2 text-sm">
                        {(['page1', 'page2'] as const).map((page) => {
                          const imageAsset = assets[`${page}_image` as keyof WishButtonAssets];
                          const audioAsset = assets[`${page}_audio` as keyof WishButtonAssets];
                          return (
                            <div key={page} className="space-y-1">
                              <div className="flex justify-between">
                                <span>Page {page.replace('page', '')} Image:</span>
                                <span className={`text-xs font-bold ${
                                  (imageAsset.status === 'ready' || imageAsset.status === 'approved') ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {(imageAsset.status === 'ready' || imageAsset.status === 'approved') ? '✓' : '✗'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Page {page.replace('page', '')} Audio:</span>
                                <span className={`text-xs font-bold ${
                                  (audioAsset.status === 'ready' || audioAsset.status === 'approved') ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {(audioAsset.status === 'ready' || audioAsset.status === 'approved') ? '✓' : '✗'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-2 border-t">
                          <span>Background Music:</span>
                          <span className="text-xs font-bold text-green-600">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Build Button */}
                  <div className="text-center">
                    <button
                      onClick={buildPayload}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
                    >
                      🏗️ Build Wish Button Payload
                    </button>
                  </div>
                </div>
              ) : (
                /* Payload Built - Display Structure */
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-green-900 mb-2">🎯 Payload Built Successfully</h3>
                    <p className="text-sm text-green-700">
                      Complete payload structure is ready for Remotion video generation. Review the details below and proceed to submit.
                    </p>
                  </div>

                  {/* Payload Visual Structure - Similar to Letter Hunt */}
                  <div className="space-y-6">
                    
                    {/* Story Metadata */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-800 mb-3">📋 Story Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div><strong>Child Name:</strong> {payload.childName}</div>
                          <div><strong>Theme:</strong> {payload.theme}</div>
                          <div><strong>Template:</strong> {payload.metadata.template}</div>
                        </div>
                        <div>
                          <div><strong>Version:</strong> {payload.metadata.version}</div>
                          <div><strong>Project ID:</strong> {payload.metadata.projectId}</div>
                          <div><strong>Generated:</strong> {new Date(payload.metadata.generatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Page 1: Title Page */}
                    <div className="border border-blue-200 rounded-lg p-4" style={{ background: '#f8faff' }}>
                      <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Page 1</span>
                        Title Page: "A Wish Button for {payload.childName}"
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Page 1 Image */}
                        <div className="border border-gray-200 rounded-lg p-3" 
                             style={{ background: payload.assets.page1_image.status === 'ready' || payload.assets.page1_image.status === 'approved' ? '#f0f8f0' : '#f9f9f9' }}>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            🎨 {payload.assets.page1_image.name}
                            <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                              (payload.assets.page1_image.status === 'ready' || payload.assets.page1_image.status === 'approved') ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payload.assets.page1_image.status}
                            </span>
                          </h4>
                          {payload.assets.page1_image.url && (
                            <div className="mb-2">
                              <img 
                                src={payload.assets.page1_image.url} 
                                alt={payload.assets.page1_image.name}
                                className="w-full h-auto rounded border max-h-32 object-cover"
                              />
                            </div>
                          )}
                          <div className="text-xs text-gray-600">URL: {payload.assets.page1_image.url || 'Not available'}</div>
                        </div>

                        {/* Page 1 Audio */}
                        <div className="border border-gray-200 rounded-lg p-3" 
                             style={{ background: payload.assets.page1_audio.status === 'ready' || payload.assets.page1_audio.status === 'approved' ? '#f0f8f0' : '#f9f9f9' }}>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            🎤 {payload.assets.page1_audio.name}
                            <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                              (payload.assets.page1_audio.status === 'ready' || payload.assets.page1_audio.status === 'approved') ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payload.assets.page1_audio.status}
                            </span>
                          </h4>
                          {payload.assets.page1_audio.url && (
                            <div className="mb-2">
                              <audio controls className="w-full h-8">
                                <source src={payload.assets.page1_audio.url} type="audio/mpeg" />
                              </audio>
                            </div>
                          )}
                          <div className="text-xs text-gray-600">URL: {payload.assets.page1_audio.url || 'Not available'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Page 2: Character Loves */}
                    <div className="border border-purple-200 rounded-lg p-4" style={{ background: '#faf8ff' }}>
                      <h3 className="font-medium text-purple-900 mb-3 flex items-center">
                        <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Page 2</span>
                        Character Trait: "{payload.childName} loved {payload.storyVariables.wishResultItems}"
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Page 2 Image */}
                        <div className="border border-gray-200 rounded-lg p-3" 
                             style={{ background: payload.assets.page2_image.status === 'ready' || payload.assets.page2_image.status === 'approved' ? '#f0f8f0' : '#f9f9f9' }}>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            🎨 {payload.assets.page2_image.name}
                            <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                              (payload.assets.page2_image.status === 'ready' || payload.assets.page2_image.status === 'approved') ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payload.assets.page2_image.status}
                            </span>
                          </h4>
                          {payload.assets.page2_image.url && (
                            <div className="mb-2">
                              <img 
                                src={payload.assets.page2_image.url} 
                                alt={payload.assets.page2_image.name}
                                className="w-full h-auto rounded border max-h-32 object-cover"
                              />
                            </div>
                          )}
                          <div className="text-xs text-gray-600">URL: {payload.assets.page2_image.url || 'Not available'}</div>
                        </div>

                        {/* Page 2 Audio */}
                        <div className="border border-gray-200 rounded-lg p-3" 
                             style={{ background: payload.assets.page2_audio.status === 'ready' || payload.assets.page2_audio.status === 'approved' ? '#f0f8f0' : '#f9f9f9' }}>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            🎤 {payload.assets.page2_audio.name}
                            <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                              (payload.assets.page2_audio.status === 'ready' || payload.assets.page2_audio.status === 'approved') ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payload.assets.page2_audio.status}
                            </span>
                          </h4>
                          {payload.assets.page2_audio.url && (
                            <div className="mb-2">
                              <audio controls className="w-full h-8">
                                <source src={payload.assets.page2_audio.url} type="audio/mpeg" />
                              </audio>
                            </div>
                          )}
                          <div className="text-xs text-gray-600">URL: {payload.assets.page2_audio.url || 'Not available'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Background Music */}
                    <div className="border border-green-200 rounded-lg p-4" style={{ background: '#f0f8f0' }}>
                      <h3 className="font-medium text-green-900 mb-3 flex items-center">
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Audio</span>
                        Background Music
                      </h3>
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          🎵 {payload.assets.background_music?.name || 'Background Music'}
                          <span className="ml-2 text-xs font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">
                            {payload.assets.background_music?.status || 'unknown'}
                          </span>
                        </h4>
                        <div className="text-xs text-gray-600">Pre-approved background music for wish-button template</div>
                        <div className="text-xs text-gray-600 mt-1">ID: {payload.assets.background_music?.id || 'none'}</div>
                      </div>
                    </div>

                    {/* Future Pages Preview */}
                    <div className="border border-gray-300 rounded-lg p-4" style={{ background: '#f8f8f8' }}>
                      <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <span className="bg-gray-200 text-gray-700 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Future</span>
                        Pages 3-9 (Not Yet Implemented)
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>The complete 9-page story will include:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Page 3: Discovery of the magical button</li>
                          <li>Page 4: First wish and button press</li>
                          <li>Page 5: Wishes appearing everywhere</li>
                          <li>Page 6: Chaos and overwhelming results</li>
                          <li>Page 7: Realization and reflection</li>
                          <li>Page 8: Learning moderation and wisdom</li>
                          <li>Page 9: Happy ending with lesson learned</li>
                        </ul>
                      </div>
                    </div>

                    {/* Asset Status Summary */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="font-medium text-blue-900 mb-3">📊 Asset Status Summary</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Page 1 Image:</span>
                          <span className={payload.assets.page1_image?.status === 'ready' || payload.assets.page1_image?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                            {payload.assets.page1_image?.status === 'ready' || payload.assets.page1_image?.status === 'approved' ? '✅ Ready' : '⚠️ Not ready'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Page 1 Audio:</span>
                          <span className={payload.assets.page1_audio?.status === 'ready' || payload.assets.page1_audio?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                            {payload.assets.page1_audio?.status === 'ready' || payload.assets.page1_audio?.status === 'approved' ? '✅ Ready' : '⚠️ Not ready'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Page 2 Image:</span>
                          <span className={payload.assets.page2_image?.status === 'ready' || payload.assets.page2_image?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                            {payload.assets.page2_image?.status === 'ready' || payload.assets.page2_image?.status === 'approved' ? '✅ Ready' : '⚠️ Not ready'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Page 2 Audio:</span>
                          <span className={payload.assets.page2_audio?.status === 'ready' || payload.assets.page2_audio?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                            {payload.assets.page2_audio?.status === 'ready' || payload.assets.page2_audio?.status === 'approved' ? '✅ Ready' : '⚠️ Not ready'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Background Music:</span>
                          <span className={payload.assets.background_music?.status === 'ready' || payload.assets.background_music?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                            {payload.assets.background_music?.status === 'ready' || payload.assets.background_music?.status === 'approved' ? '✅ Ready' : '⚠️ Not ready'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700 font-medium">Total Ready:</span>
                          <span className="font-medium text-blue-800">
                            {[
                              payload.assets.page1_image?.status === 'ready' || payload.assets.page1_image?.status === 'approved',
                              payload.assets.page1_audio?.status === 'ready' || payload.assets.page1_audio?.status === 'approved',
                              payload.assets.page2_image?.status === 'ready' || payload.assets.page2_image?.status === 'approved',
                              payload.assets.page2_audio?.status === 'ready' || payload.assets.page2_audio?.status === 'approved',
                              payload.assets.background_music?.status === 'ready' || payload.assets.background_music?.status === 'approved'
                            ].filter(Boolean).length} / 5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* JSON Payload Preview */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-800 mb-3">📄 JSON Payload Preview</h3>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-64 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('audio-review')}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Back to Audio Review
                </button>
                <div className="flex space-x-3">
                  {payload && (
                    <button
                      onClick={submitToRemotionPipeline}
                      disabled={submittingVideo || !canSubmitVideo()}
                      className={`px-6 py-2 rounded-md font-medium ${
                        canSubmitVideo() && !submittingVideo
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {submittingVideo ? 'Submitting to Remotion...' : 'Submit to Video Pipeline'}
                    </button>
                  )}
                  {payload && (
                    <button
                      onClick={() => setCurrentStep('review')}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                    >
                      Continue to Final Review →
                    </button>
                  )}
                </div>
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
        {currentStep === 'review' && assets && (
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
                    onClick={submitToRemotionPipeline}
                    disabled={submittingVideo || !canSubmitVideo()}
                    className={`px-6 py-2 rounded-md font-medium ${
                      canSubmitVideo() && !submittingVideo
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submittingVideo ? 'Submitting to Remotion...' : 'Submit to Video Pipeline'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Submission Results */}
        {videoSubmissionResult && (
          <div className="mt-8 p-6 rounded-lg border-2 border-blue-500 bg-blue-50">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              Video Submission Status
            </h2>
            {videoSubmissionResult.success ? (
              <div className="text-green-800">
                <p className="font-medium">✅ Video submission successful!</p>
                <p>Job ID: {videoSubmissionResult.job_id}</p>
                <p className="mt-2 text-sm">
                  Your video is being processed. You can check the status in the video management panel.
                </p>
              </div>
            ) : (
              <div className="text-red-800">
                <p className="font-medium">❌ Video submission failed</p>
                <p className="mt-2">Error: {videoSubmissionResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Review Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isAssetModalOpen}
        onClose={closeAssetModal}
        onApprove={(selectedAsset?.status === 'pending' || selectedAsset?.status === 'pending_review') ? handleAssetApprove : undefined}
        onReject={(selectedAsset?.status === 'pending' || selectedAsset?.status === 'pending_review') ? handleAssetReject : undefined}
      />
    </div>
  );
}
