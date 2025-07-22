import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';
import { AssetDetailModal } from '@/components/assets/AssetModal/AssetDetailModal';
import { User } from '@supabase/supabase-js';

// Import our modular components and hooks
import {
  ChildSelection,
  PreviousStories,
  StoryVariablesEditor,
  AssetManagement,
  VideoSubmission,
  PromptReview,
  ImageGeneration,
  ImageReview,
  AudioScriptReview,
  AudioGeneration
} from '@/components/wish-button';

import {
  useWishButtonData,
  useWishButtonWorkflow,
  useWishButtonSubmission,
  useAssetModal
} from '@/hooks/wish-button';

import { WishButtonService } from '@/services/wish-button/WishButtonService';
import { Child, StoryVariables, WishButtonAssets, WishButtonPayload } from '@/types/wish-button';

export default function WishButtonRequestRefactored() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Use our custom hooks for state management
  const {
    children,
    selectedChild,
    previousStories,
    currentStoryProject,
    loading,
    showPreviousStories,
    setCurrentStoryProject,
    setShowPreviousStories,
    handleChildSelect,
    fetchPreviousStories,
    deleteStory
  } = useWishButtonData();

  const {
    currentStep,
    storyVariables,
    assets,
    generatedPrompts,
    promptProgress,
    expandedPrompt,
    generatingVariables,
    generatingPrompts,
    setCurrentStep,
    setStoryVariables,
    setAssets,
    setGeneratedPrompts,
    setPromptProgress,
    setExpandedPrompt,
    setGeneratingVariables,
    setGeneratingPrompts,
    updateStoryVariable,
    initializeAssets,
    resetWorkflow
  } = useWishButtonWorkflow();

  const {
    payload,
    submittingVideo,
    videoSubmissionResult,
    setPayload,
    submitToRemotionPipeline,
    canSubmitVideo
  } = useWishButtonSubmission();

  const {
    selectedAsset,
    isAssetModalOpen,
    openAssetModal,
    closeAssetModal,
    handleAssetApprove,
    handleAssetReject
  } = useAssetModal();

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
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  // Navigation handlers
  const handleBackToChildSelection = () => {
    setCurrentStep('child');
    resetWorkflow();
  };

  const handleCreateNewStory = () => {
    setCurrentStep('variables');
    if (selectedChild) {
      generateStoryVariables(selectedChild);
    }
  };

  const handleLoadExistingStory = async (story: any) => {
    try {
      console.log('Loading existing story:', story);
      
      setCurrentStoryProject(story);
      
      if (story.metadata?.storyVariables) {
        setStoryVariables(story.metadata.storyVariables);
        const initialAssets = initializeAssets(story.metadata.storyVariables);
        setAssets(initialAssets);
        
        // Refresh assets from database
        if (story.id) {
          const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(story.id, initialAssets);
          setAssets(refreshedAssets);
        }
        
        setCurrentStep('variables');
      }
      
      if (story.metadata?.generatedPrompts) {
        setGeneratedPrompts(story.metadata.generatedPrompts);
      }
    } catch (error) {
      console.error('Error loading existing story:', error);
    }
  };

  // Story generation functions (these would need to be implemented based on your existing logic)
  const generateStoryVariables = async (child: Child) => {
    setGeneratingVariables(true);
    
    try {
      console.log('🎭 Generating story variables for child:', child);
      
      const response = await fetch('/api/wish-button/generate-story-variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: child.name,
          theme: child.primary_interest,
          age: child.age,
          childDescription: child.child_description,
          pronouns: child.pronouns,
          sidekickDescription: child.sidekick_description,
          themeOverride: child.theme // Use specific theme if set
        })
      });

      const data = await response.json();
      console.log('📝 Story variables API response:', data);
      
      if (data.success && data.storyVariables) {
        console.log('✅ Story variables generated successfully:', data.storyVariables);
        setStoryVariables(data.storyVariables);
        const initialAssets = initializeAssets(data.storyVariables);
        setAssets(initialAssets);
        
        // Create or update story project
        try {
          await createOrUpdateStoryProject(child, data.storyVariables);
          console.log('✅ Story project created/updated successfully');
        } catch (projectError) {
          console.error('⚠️ Failed to create/update project, but story variables are available:', projectError);
          // Show a more helpful error message to user
          if (projectError instanceof Error) {
            alert(`Story variables generated successfully, but failed to save project: ${projectError.message}. You can still proceed with the story creation.`);
          }
          // Don't fail the entire operation - user can still proceed with story variables
        }
      } else {
        throw new Error(data.error || 'Failed to generate story variables');
      }
    } catch (error) {
      console.error('Error generating story variables:', error);
      alert('Failed to generate story variables. Please try again.');
    } finally {
      setGeneratingVariables(false);
    }
  };

  const createOrUpdateStoryProject = async (child: Child, variables: StoryVariables) => {
    try {
      console.log('🗄️ Creating/updating story project for child:', child.name);
      
      const projectData = {
        title: `${child.name}'s Wish Button Story`,
        theme: child.theme || child.primary_interest || 'adventure', // Add required theme field
        target_age: child.age ? `${child.age}` : '4', // Add required target_age field (default to 4)
        duration: 180, // Will be dynamically set in remotion template
        metadata: {
          template: 'wish-button',
          child_name: child.name,
          child_id: child.id,
          pronouns: child.pronouns || 'they/them', // Include pronouns for story generation
          visual_style: variables.visualStyle || 'watercolor', // Visual style from story variables
          storyVariables: variables,
          version: '1.0'
        }
      };

      console.log('📋 Project data to save:', projectData);

      if (currentStoryProject?.id) {
        console.log('🔄 Updating existing project:', currentStoryProject.id);
        // Update existing project
        const { data, error } = await supabase
          .from('content_projects')
          .update(projectData)
          .eq('id', currentStoryProject.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase update error:', error);
          throw error;
        }
        
        console.log('✅ Project updated successfully:', data);
        setCurrentStoryProject(data);
      } else {
        console.log('➕ Creating new project');
        // Create new project
        const { data, error } = await supabase
          .from('content_projects')
          .insert(projectData)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase insert error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('✅ Project created successfully:', data);
        setCurrentStoryProject(data);
      }
    } catch (error) {
      console.error('💥 Error creating/updating story project:', error);
      throw error;
    }
  };

  const generateAllPrompts = async () => {
    if (!storyVariables || !assets || !currentStoryProject) {
      console.error('Missing required data for prompt generation:', { storyVariables, assets, currentStoryProject });
      alert('Missing story context. Please ensure story variables are generated first.');
      return;
    }
    
    // Clear any existing prompts before generating new ones
    setGeneratedPrompts(null);
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
      const { error } = await supabase
        .from('content_projects')
        .update({
          metadata: {
            ...currentStoryProject?.metadata,
            generatedPrompts: prompts,
            promptGenerationMethod: 'openai-assistant'
          }
        })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project with prompts:', error);
        throw error;
      }
      
      console.log('✅ Successfully saved prompts to project metadata');
    } catch (error) {
      console.error('Error saving prompts to project:', error);
      // Don't throw here - prompts are still generated, just not saved to project
    }
  };

  const generateImage = async (page: string) => {
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
        if (assets) {
          const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(currentStoryProject.id, assets);
          setAssets(refreshedAssets);
        }
        
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate image for ${page}: ${errorMessage}`);
    }
  };

  const generateAudio = async (page: string) => {
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
        if (assets) {
          const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(currentStoryProject.id, assets);
          setAssets(refreshedAssets);
        }
        
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate audio for ${page}: ${errorMessage}`);
    }
  };

  const handleAssetApproveWithRefresh = async (asset: any) => {
    await handleAssetApprove(asset, async () => {
      if (currentStoryProject?.id && assets) {
        const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(currentStoryProject.id, assets);
        setAssets(refreshedAssets);
      }
    });
  };

  const handleAssetRejectWithRefresh = async (asset: any) => {
    await handleAssetReject(asset, async () => {
      if (currentStoryProject?.id && assets) {
        const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(currentStoryProject.id, assets);
        setAssets(refreshedAssets);
      }
    });
  };

  const refreshAssets = async () => {
    if (currentStoryProject?.id && assets) {
      const refreshedAssets = await WishButtonService.refreshAssetsFromDatabase(currentStoryProject.id, assets);
      setAssets(refreshedAssets);
    }
  };

  const preparePayload = () => {
    if (!storyVariables || !assets || !currentStoryProject) return;

    const payloadData: WishButtonPayload = {
      childName: storyVariables.childName,
      theme: storyVariables.theme,
      storyVariables,
      metadata: {
        template: 'wish-button',
        version: '1.0',
        generatedAt: new Date().toISOString(),
        projectId: currentStoryProject.id
      },
      assets: {
        page1_image: assets.page1_image,
        page1_audio: assets.page1_audio,
        page2_image: assets.page2_image,
        page2_audio: assets.page2_audio,
        background_music: assets.background_music,
        // Add other pages as optional
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

    setPayload(payloadData);
    setCurrentStep('submit');
  };

  // Render the appropriate step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'child':
        return (
          <ChildSelection
            children={children}
            loading={loading}
            onChildSelect={(child) => {
              handleChildSelect(child);
              setCurrentStep('stories');
            }}
          />
        );

      case 'stories':
        if (!selectedChild) return null;
        return (
          <PreviousStories
            child={selectedChild}
            stories={previousStories}
            showPreviousStories={showPreviousStories}
            onShowPreviousStories={setShowPreviousStories}
            onLoadStory={handleLoadExistingStory}
            onDeleteStory={deleteStory}
            onCreateNew={handleCreateNewStory}
            onBack={handleBackToChildSelection}
          />
        );

      case 'variables':
        if (!storyVariables) return null;
        return (
          <StoryVariablesEditor
            variables={storyVariables}
            onUpdateVariable={updateStoryVariable}
            onNext={generateAllPrompts}
            onBack={() => setCurrentStep('stories')}
            generatingVariables={generatingVariables}
            generatingPrompts={generatingPrompts}
            generatedPrompts={generatedPrompts}
            onViewPrompts={() => setCurrentStep('prompts')}
          />
        );

      case 'prompts':
        return (
          <PromptReview
            generatedPrompts={generatedPrompts}
            generatingPrompts={generatingPrompts}
            promptProgress={promptProgress}
            onSetGeneratedPrompts={setGeneratedPrompts}
            onBack={() => setCurrentStep('variables')}
            onNext={() => setCurrentStep('images')}
          />
        );

      case 'images':
        if (!assets) return null;
        return (
          <ImageGeneration
            assets={assets}
            onGenerateImage={generateImage}
            onBack={() => setCurrentStep('prompts')}
            onNext={() => setCurrentStep('image-review')}
          />
        );

      case 'image-review':
        if (!assets) return null;
        return (
          <ImageReview
            assets={assets}
            onGenerateImage={generateImage}
            onOpenAssetModal={openAssetModal}
            onRefreshAssets={refreshAssets}
            onBack={() => setCurrentStep('images')}
            onNext={() => setCurrentStep('audio')}
          />
        );

      case 'audio':
        if (!generatedPrompts) return null;
        return (
          <AudioScriptReview
            generatedPrompts={generatedPrompts}
            onSetGeneratedPrompts={setGeneratedPrompts}
            onBack={() => setCurrentStep('image-review')}
            onNext={() => setCurrentStep('audio-generation')}
          />
        );

      case 'audio-generation':
        if (!assets) return null;
        return (
          <AudioGeneration
            assets={assets}
            onGenerateAudio={generateAudio}
            onOpenAssetModal={openAssetModal}
            onRefreshAssets={refreshAssets}
            onBack={() => setCurrentStep('audio')}
            onNext={preparePayload}
          />
        );

      case 'submit':
        return (
          <VideoSubmission
            payload={payload}
            submittingVideo={submittingVideo}
            videoSubmissionResult={videoSubmissionResult}
            canSubmitVideo={canSubmitVideo()}
            onSubmitVideo={submitToRemotionPipeline}
            onBack={() => setCurrentStep('audio-generation')}
          />
        );

      default:
        return null;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Wish Button Story Request (Refactored)" />
      
      {renderCurrentStep()}

      {/* Asset Review Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isAssetModalOpen}
        onClose={closeAssetModal}
        onApprove={(selectedAsset?.status === 'pending' || selectedAsset?.status === 'pending_review') ? handleAssetApproveWithRefresh : undefined}
        onReject={(selectedAsset?.status === 'pending' || selectedAsset?.status === 'pending_review') ? handleAssetRejectWithRefresh : undefined}
      />
    </div>
  );
}
