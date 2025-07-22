import { useState, useCallback } from 'react';
import { WishButtonStep, StoryVariables, WishButtonAssets, AssetStatus, PromptProgress } from '@/types/wish-button';

export const useWishButtonWorkflow = () => {
  const [currentStep, setCurrentStep] = useState<WishButtonStep>('child');
  const [storyVariables, setStoryVariables] = useState<StoryVariables | null>(null);
  const [assets, setAssets] = useState<WishButtonAssets | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ [key: string]: { image: string; audio: string; safeZone: string } } | null>(null);
  const [promptProgress, setPromptProgress] = useState<PromptProgress>({ current: 0, total: 0, currentPage: '' });
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  // Loading states
  const [generatingVariables, setGeneratingVariables] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);

  const updateStoryVariable = useCallback((key: keyof StoryVariables, value: string) => {
    if (!storyVariables) return;
    
    const updatedVariables = { ...storyVariables, [key]: value };
    setStoryVariables(updatedVariables);
    
    // Update asset descriptions when variables change
    if (assets) {
      const updatedAssets = { ...assets };
      // Update asset descriptions based on new variables
      // This logic can be expanded based on specific requirements
      setAssets(updatedAssets);
    }
  }, [storyVariables, assets]);

  const initializeAssets = useCallback((variables: StoryVariables): WishButtonAssets => {
    return {
      // Page 1: Title Page
      page1_image: {
        type: 'image',
        name: 'Title Page Image',
        description: `Title page featuring ${variables.mainCharacter} (${variables.childName}) in a ${variables.theme}-themed setting with ${variables.visualStyle} art style.`,
        status: 'missing'
      },
      page1_audio: {
        type: 'audio',
        name: 'Title Page Audio',
        description: `Narration for the title page introducing ${variables.mainCharacter} (${variables.childName}).`,
        status: 'missing'
      },
      
      // Page 2: Character Trait / Desire
      page2_image: {
        type: 'image',
        name: 'Character Trait Image',
        description: `${variables.mainCharacter} showing their characteristic trait or desire in a ${variables.theme} setting.`,
        status: 'missing'
      },
      page2_audio: {
        type: 'audio',
        name: 'Character Trait Audio',
        description: `Narration describing ${variables.mainCharacter}'s personality and desires.`,
        status: 'missing'
      },

      // Page 3: Discovery
      page3_image: {
        type: 'image',
        name: 'Discovery Image',
        description: `${variables.mainCharacter} discovering ${variables.magicButton} in ${variables.buttonLocation}.`,
        status: 'missing'
      },
      page3_audio: {
        type: 'audio',
        name: 'Discovery Audio',
        description: `Narration of ${variables.mainCharacter} finding the magic button.`,
        status: 'missing'
      },

      // Page 4: First Wish
      page4_image: {
        type: 'image',
        name: 'First Wish Image',
        description: `${variables.mainCharacter} making their first wish with ${variables.magicButton}.`,
        status: 'missing'
      },
      page4_audio: {
        type: 'audio',
        name: 'First Wish Audio',
        description: `Narration of ${variables.mainCharacter} making their first wish.`,
        status: 'missing'
      },

      // Page 5: Things Appear
      page5_image: {
        type: 'image',
        name: 'Things Appear Image',
        description: `${variables.wishResultItems} appearing around ${variables.mainCharacter}.`,
        status: 'missing'
      },
      page5_audio: {
        type: 'audio',
        name: 'Things Appear Audio',
        description: `Narration of items appearing from the wish.`,
        status: 'missing'
      },

      // Page 6: Chaos
      page6_image: {
        type: 'image',
        name: 'Chaos Image',
        description: `${variables.mainCharacter} overwhelmed by ${variables.chaoticActions} with ${variables.wishResultItems} everywhere.`,
        status: 'missing'
      },
      page6_audio: {
        type: 'audio',
        name: 'Chaos Audio',
        description: `Narration of the chaos and overwhelming situation.`,
        status: 'missing'
      },

      // Page 7: Realization
      page7_image: {
        type: 'image',
        name: 'Realization Image',
        description: `${variables.mainCharacter} experiencing ${variables.realizationEmotion} as they understand what went wrong.`,
        status: 'missing'
      },
      page7_audio: {
        type: 'audio',
        name: 'Realization Audio',
        description: `Narration of ${variables.mainCharacter}'s realization moment.`,
        status: 'missing'
      },

      // Page 8: Learning
      page8_image: {
        type: 'image',
        name: 'Learning Image',
        description: `${variables.mainCharacter} understanding they missed ${variables.missedSimpleThing}.`,
        status: 'missing'
      },
      page8_audio: {
        type: 'audio',
        name: 'Learning Audio',
        description: `Narration of the learning moment and wisdom gained.`,
        status: 'missing'
      },

      // Page 9: Happy Ending
      page9_image: {
        type: 'image',
        name: 'Happy Ending Image',
        description: `${variables.finalScene} showing ${variables.mainCharacter} content and wise.`,
        status: 'missing'
      },
      page9_audio: {
        type: 'audio',
        name: 'Happy Ending Audio',
        description: `Narration of the happy resolution and lesson learned.`,
        status: 'missing'
      },

      // Background Music
      background_music: {
        type: 'audio',
        name: 'Wish Button Background Music',
        description: 'Pre-approved background music for wish-button template',
        status: 'ready',
        id: 'a2c42732-d0f3-499a-8c6c-f2afdf0bc6a9',
        url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752847321295.MP3'
      }
    };
  }, []);

  const resetWorkflow = useCallback(() => {
    setCurrentStep('child');
    setStoryVariables(null);
    setAssets(null);
    setGeneratedPrompts(null);
    setPromptProgress({ current: 0, total: 0, currentPage: '' });
    setExpandedPrompt(null);
    setGeneratingVariables(false);
    setGeneratingPrompts(false);
  }, []);

  return {
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
  };
};
