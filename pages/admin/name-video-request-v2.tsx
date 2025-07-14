import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import MissingVideoTracker from '../../components/MissingVideoTracker';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_id: string;
}

interface AssetStatus {
  type: 'image' | 'audio' | 'music';
  name: string;
  description: string;
  status: 'missing' | 'generating' | 'ready';
  url?: string;
  safeZone?: 'left' | 'right';
  generatedAt?: string;
}

interface NameVideoAssets {
  // Core Music Asset
  backgroundMusic: AssetStatus;
  
  // Visual Assets
  introImage: AssetStatus;
  outroImage: AssetStatus;
  letterImages: AssetStatus[]; // Array of letter background images with safe zones
  
  // Audio Assets
  introAudio: AssetStatus;  // Full name pronunciation
  outroAudio: AssetStatus;  // "Great job, [NAME]!" message
  letterAudios: { [letter: string]: AssetStatus }; // Individual letter pronunciations
}

interface NameVideoPayload {
  childName: string;
  childAge: number;
  childTheme: string;
  assets: NameVideoAssets;
  asset_summary: {
    total_assets: number;
    ready_assets: number;
    completion_percentage: number;
  };
}

// Asset definitions with their specific purposes
const NAME_VIDEO_ASSET_DEFINITIONS = {
  backgroundMusic: {
    type: 'music' as const,
    name: 'Background Music',
    description: 'Upbeat background music for name learning (DreamDrip)',
    asset_class: 'background_music'
  },
  introImage: {
    type: 'image' as const,
    name: 'Intro Image',
    description: 'Welcome scene for name video intro',
    asset_class: 'name_intro'
  },
  outroImage: {
    type: 'image' as const,
    name: 'Outro Image', 
    description: 'Celebration scene for name video conclusion',
    asset_class: 'name_outro'
  },
  introAudio: {
    type: 'audio' as const,
    name: 'Name Audio',
    description: 'Full name pronunciation audio',
    asset_class: 'name_audio'
  },
  outroAudio: {
    type: 'audio' as const,
    name: 'Outro Audio',
    description: 'Encouraging "Great job, [NAME]!" message',
    asset_class: 'name_encouragement'
  },
  letterImages: {
    type: 'image' as const,
    name: 'Letter Background Images',
    description: 'Theme-appropriate background images for letter display',
    asset_class: 'letter_background'
  },
  letterAudios: {
    type: 'audio' as const,
    name: 'Letter Audio',
    description: 'Individual letter pronunciation',
    asset_class: 'letter_audio'
  }
};

const LETTER_IMAGES_TARGET = 20; // Target number of letter background images (with safe zones)

export default function NameVideoRequestV2() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [payload, setPayload] = useState<NameVideoPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  // Handle URL parameters and returning from asset generation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const generatedImageUrl = urlParams.get('generatedImageUrl');
    const generatedAudioUrl = urlParams.get('generatedAudioUrl');
    const assetKey = urlParams.get('assetKey');
    const childId = urlParams.get('child_id');
    
    // Handle asset generation return
    if ((generatedImageUrl || generatedAudioUrl) && assetKey && payload) {
      const assetUrl = generatedImageUrl || generatedAudioUrl;
      const assetType = generatedImageUrl ? 'image' : 'audio';
      
      console.log(`🎨 Received generated ${assetType} for ${assetKey}:`, assetUrl);
      
      // Handle letter audio specifically
      if (assetKey.startsWith('letter_')) {
        const letter = assetKey.replace('letter_', '');
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            letterAudios: {
              ...prev.assets.letterAudios,
              [letter]: {
                ...prev.assets.letterAudios[letter],
                status: 'ready',
                url: assetUrl || '',
                generatedAt: new Date().toISOString()
              }
            }
          }
        } : null);
      } else {
        // Update the regular asset
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            [assetKey]: {
              ...prev.assets[assetKey as keyof NameVideoAssets],
              status: 'ready',
              url: assetUrl || '',
              generatedAt: new Date().toISOString()
            }
          }
        } : null);
      }
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Handle child selection from URL
    if (childId && children.length > 0) {
      const child = children.find(c => c.id === childId);
      if (child) {
        setSelectedChild(child);
        setChildName(child.name);
      }
    }
  }, [payload, children, router.query]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('name');

      if (error) throw error;
      setChildren(data || []);
      
      // Don't auto-select a child - let user choose
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setChildName(child.name);
    console.log(`🎯 Selected child: ${child.name}`);
  };

  const handleManualNameInput = (name: string) => {
    setChildName(name);
  };

  const initializePayload = async () => {
    const nameToUse = selectedChild?.name || childName;
    const themeToUse = selectedChild?.primary_interest || 'default';
    const ageToUse = selectedChild?.age || 3;
    
    if (!nameToUse) {
      alert('Please enter child name or select a child');
      return;
    }

    setLoading(true);
    try {
      console.log(`📝 Initializing NameVideo payload for ${nameToUse} (theme: ${themeToUse})`);

      // Get the unique letters for this child's name (for audio assets)
      const allLetters = nameToUse.toUpperCase().split('');
      const letters = allLetters.filter((letter, index) => allLetters.indexOf(letter) === index);
      
      // For background images, we need one image per letter position (including duplicates)
      const totalLetterPositions = allLetters.length;
      
      // Fetch all relevant assets for this child and theme
      const [
        specificAssets,
        letterImages, 
        backgroundMusicAsset,
        themeImages,
        letterAudioAssets,
        oldStyleThemeImages
      ] = await Promise.all([
        // Child-specific assets
        supabase
          .from('assets')
          .select('*')
          .in('status', ['approved', 'pending'])
          .or(`metadata->>template.eq.namevideo,metadata->>template.eq.name-video`)
          .eq('metadata->>child_name', nameToUse),
        
        // Letter background images for theme (with safe zones)
        supabase
          .from('assets')
          .select('*')
          .in('status', ['approved', 'pending'])
          .eq('type', 'image')
          .eq('metadata->>asset_class', 'letter_background')
          .eq('metadata->>child_theme', themeToUse),
        
        // Background music - using DreamDrip asset like Lullaby
        supabase
          .from('assets')
          .select('*')
          .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
          .single(),
        
        // Theme-specific intro/outro images
        supabase
          .from('assets')
          .select('*')
          .in('status', ['approved', 'pending'])
          .eq('type', 'image')
          .in('metadata->>asset_class', ['name_intro', 'name_outro'])
          .eq('metadata->>child_theme', themeToUse),

        // Letter audio assets (generic, not child-specific)
        supabase
          .from('assets')
          .select('*')
          .in('status', ['approved', 'pending'])
          .eq('type', 'audio')
          .or(`metadata->>asset_class.eq.letter_audio,metadata->>audio_class.eq.letter_audio`),
        
        // Fallback: Old-style theme-matching images with safe_zone (for backwards compatibility)
        supabase
          .from('assets')
          .select('*')
          .eq('status', 'approved')
          .eq('type', 'image')
          .ilike('theme', `%${themeToUse}%`)
      ]);

      console.log('🔍 Asset fetch results:', {
        specificAssets: specificAssets.data?.length || 0,
        letterImages: letterImages.data?.length || 0,
        backgroundMusic: backgroundMusicAsset.data ? 'found' : 'missing',
        themeImages: themeImages.data?.length || 0,
        letterAudios: letterAudioAssets.data?.length || 0,
        oldStyleThemeImages: oldStyleThemeImages.data?.length || 0
      });

      // Initialize asset status objects
      const assets: NameVideoAssets = {
        backgroundMusic: {
          type: 'music',
          name: 'Background Music',
          description: 'Upbeat background music for name learning (DreamDrip)',
          status: backgroundMusicAsset.data ? 'ready' : 'missing',
          url: backgroundMusicAsset.data?.file_url || '',
          generatedAt: backgroundMusicAsset.data?.created_at
        },
        introImage: {
          type: 'image',
          name: 'Intro Image',
          description: `Welcome scene for ${nameToUse}'s name video`,
          status: 'missing',
          url: '',
        },
        outroImage: {
          type: 'image',
          name: 'Outro Image', 
          description: `Celebration scene for ${nameToUse}'s name completion`,
          status: 'missing', 
          url: '',
        },
        letterImages: [],
        introAudio: {
          type: 'audio',
          name: 'Name Audio',
          description: `Full name pronunciation: "${nameToUse}"`,
          status: 'missing',
          url: '',
        },
        outroAudio: {
          type: 'audio',
          name: 'Outro Audio',
          description: `Encouraging "Great job, ${nameToUse}!" message`,
          status: 'missing',
          url: '',
        },
        letterAudios: {}
      };

      // Initialize letter audio assets for each letter
      letters.forEach(letter => {
        assets.letterAudios[letter] = {
          type: 'audio',
          name: `Letter ${letter} Audio`,
          description: `Pronunciation of letter "${letter}"`,
          status: 'missing',
          url: ''
        };
      });

      // Map specific assets to payload
      if (specificAssets.data) {
        specificAssets.data.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
          const status = asset.status === 'approved' ? 'ready' : 'generating';
          
          switch (assetClass) {
            case 'name_audio':
              console.log('  → Assigning to introAudio (will be used for both intro and outro)');
              assets.introAudio = {
                ...assets.introAudio,
                status,
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
            case 'name_encouragement':
              console.log('  → Skipping name_encouragement (NameVideo uses same audio for intro/outro)');
              // Skip - NameVideo always uses the name audio for both intro and outro
              break;
            case 'name_intro':
              assets.introImage = {
                ...assets.introImage,
                status,
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
            case 'name_outro':
              assets.outroImage = {
                ...assets.outroImage,
                status,
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
          }
        });
      }

      // NameVideo ALWAYS uses the same audio for intro and outro (child's name)
      if (assets.introAudio.status === 'ready') {
        console.log('🔄 NameVideo: Using intro audio (child name) for both intro and outro');
        assets.outroAudio = {
          ...assets.outroAudio,
          status: assets.introAudio.status,
          url: assets.introAudio.url,
          generatedAt: assets.introAudio.generatedAt
        };
      }

      // Process letter background images with safe zones
      if (letterImages.data) {
        assets.letterImages = letterImages.data.map(asset => ({
          type: 'image' as const,
          name: `Letter Background ${asset.id.slice(-4)}`,
          description: `Background image for letter display (${asset.metadata?.safe_zone || 'unknown'} safe zone)`,
          status: asset.status === 'approved' ? 'ready' : 'generating',
          url: asset.file_url || '',
          safeZone: asset.metadata?.safe_zone as 'left' | 'right' || 'left',
          generatedAt: asset.created_at
        }));
      }

      // Process letter audio assets
      if (letterAudioAssets.data) {
        letterAudioAssets.data.forEach(asset => {
          const letter = asset.metadata?.letter?.toUpperCase();
          if (letter && assets.letterAudios[letter]) {
            assets.letterAudios[letter] = {
              ...assets.letterAudios[letter],
              status: asset.status === 'approved' ? 'ready' : 'generating',
              url: asset.file_url || '',
              generatedAt: asset.created_at
            };
          }
        });
      }

      // Fallback: Add old-style letter background images with proper alternating safe zones
      if (oldStyleThemeImages.data && assets.letterImages.length < totalLetterPositions) {
        // Separate left and right safe zone images from the SAME theme only
        const leftSafeImages = oldStyleThemeImages.data.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          if (Array.isArray(safeZones)) {
            return safeZones.includes('left_safe');
          } else if (typeof safeZones === 'string') {
            return safeZones.includes('left_safe');
          } else if (safeZones && typeof safeZones === 'object') {
            return JSON.stringify(safeZones).includes('left_safe');
          }
          return false;
        });

        const rightSafeImages = oldStyleThemeImages.data.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          if (Array.isArray(safeZones)) {
            return safeZones.includes('right_safe');
          } else if (typeof safeZones === 'string') {
            return safeZones.includes('right_safe');
          } else if (safeZones && typeof safeZones === 'object') {
            return JSON.stringify(safeZones).includes('right_safe');
          }
          return false;
        });

        console.log(`📋 Found ${leftSafeImages.length} left-safe and ${rightSafeImages.length} right-safe images for ${themeToUse} theme`);

        // Create alternating pattern: left, right, left, right, etc.
        const additionalImages = [];
        const stillNeeded = totalLetterPositions - assets.letterImages.length;
        
        for (let i = 0; i < stillNeeded; i++) {
          const needsLeft = (assets.letterImages.length + i) % 2 === 0; // Even positions = left, odd = right
          const sourceImages = needsLeft ? leftSafeImages : rightSafeImages;
          const safeZone: 'left' | 'right' = needsLeft ? 'left' : 'right';
          
          if (sourceImages.length > 0) {
            // Use images round-robin style if we have multiple
            const imageIndex = Math.floor(i / 2) % sourceImages.length;
            const asset = sourceImages[imageIndex];
            
            additionalImages.push({
              type: 'image' as const,
              name: `Letter Background ${asset.id.slice(-4)} (Legacy)`,
              description: `Background image for letter display (${themeToUse} theme) - ${safeZone} safe zone`,
              status: 'ready' as const,
              url: asset.file_url || '',
              safeZone,
              generatedAt: asset.created_at
            });
          } else {
            console.log(`⚠️ No ${safeZone}-safe images available for position ${assets.letterImages.length + i + 1}`);
            // Don't add anything - show empty slot instead
          }
        }

        if (additionalImages.length > 0) {
          console.log(`✅ Adding ${additionalImages.length} alternating letter images from ${themeToUse} theme`);
          assets.letterImages = [...assets.letterImages, ...additionalImages];
        } else {
          console.log(`❌ No suitable letter images found for ${themeToUse} theme - will show empty slots`);
        }
      }

      // Add fallback intro/outro images if needed
      if (assets.introImage.status === 'missing' && themeImages.data) {
        const introAsset = themeImages.data.find(a => a.metadata?.asset_class === 'name_intro');
        if (introAsset) {
          assets.introImage = {
            ...assets.introImage,
            status: introAsset.status === 'approved' ? 'ready' : 'generating',
            url: introAsset.file_url || '',
            generatedAt: introAsset.created_at
          };
        }
      }

      // Fallback to old-style intro images with safe_zone
      if (assets.introImage.status === 'missing' && oldStyleThemeImages.data) {
        const oldStyleIntroAsset = oldStyleThemeImages.data.find(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('intro_safe');
        });
        if (oldStyleIntroAsset) {
          assets.introImage = {
            ...assets.introImage,
            status: 'ready',
            url: oldStyleIntroAsset.file_url || '',
            generatedAt: oldStyleIntroAsset.created_at
          };
        }
      }

      if (assets.outroImage.status === 'missing' && themeImages.data) {
        const outroAsset = themeImages.data.find(a => a.metadata?.asset_class === 'name_outro');
        if (outroAsset) {
          assets.outroImage = {
            ...assets.outroImage,
            status: outroAsset.status === 'approved' ? 'ready' : 'generating',
            url: outroAsset.file_url || '',
            generatedAt: outroAsset.created_at
          };
        }
      }

      // Fallback to old-style outro images with safe_zone
      if (assets.outroImage.status === 'missing' && oldStyleThemeImages.data) {
        const oldStyleOutroAsset = oldStyleThemeImages.data.find(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('outro_safe');
        });
        if (oldStyleOutroAsset) {
          assets.outroImage = {
            ...assets.outroImage,
            status: 'ready',
            url: oldStyleOutroAsset.file_url || '',
            generatedAt: oldStyleOutroAsset.created_at
          };
        }
      }

      // Calculate asset summary
      const baseAssets = 4; // backgroundMusic, introImage, outroImage, introAudio, outroAudio
      const letterAudioCount = letters.length;
      const targetLetterImages = totalLetterPositions; // One background image per letter position (including duplicates)
      const totalLetterImages = Math.max(assets.letterImages.length, targetLetterImages);
      const totalAssets = baseAssets + letterAudioCount + totalLetterImages;
      
      const readyBaseAssets = [
        assets.backgroundMusic,
        assets.introImage, 
        assets.outroImage,
        assets.introAudio,
        assets.outroAudio
      ].filter(asset => asset.status === 'ready').length;
      
      const readyLetterAudios = Object.values(assets.letterAudios).filter(audio => audio.status === 'ready').length;
      const readyLetterImages = assets.letterImages.filter(img => img.status === 'ready').length;
      const readyAssets = readyBaseAssets + readyLetterAudios + readyLetterImages;

      const newPayload: NameVideoPayload = {
        childName: nameToUse,
        childAge: ageToUse,
        childTheme: themeToUse,
        assets,
        asset_summary: {
          total_assets: totalAssets,
          ready_assets: readyAssets,
          completion_percentage: Math.round((readyAssets / totalAssets) * 100)
        }
      };

      setPayload(newPayload);
      console.log('📝 Initialized NameVideo payload:', newPayload);

    } catch (error) {
      console.error('Error initializing payload:', error);
    } finally {
      setLoading(false);
    }
  };

  // Individual asset generation functions (paralleling LetterHunt)
  const generateAsset = async (assetKey: keyof NameVideoAssets) => {
    if (!payload) {
      console.error('No payload available for asset generation');
      return;
    }

    if (assetKey === 'letterImages' || assetKey === 'letterAudios') {
      console.error(`${assetKey} is a collection, use specific generation functions instead`);
      return;
    }

    const asset = payload.assets[assetKey] as AssetStatus;
    console.log(`🎯 Generating asset: ${assetKey}`, { asset, payload });

    try {
      // Handle image generation 
      if (asset.type === 'image') {
        let assetClass = '';
        
        if (assetKey === 'introImage') assetClass = 'name_intro';
        else if (assetKey === 'outroImage') assetClass = 'name_outro';

        const promptParams = new URLSearchParams({
          templateType: 'namevideo',
          childName: payload.childName,
          childTheme: payload.childTheme,
          assetType: assetKey,
          assetClass: assetClass,
          artStyle: '2D Pixar Style',
          ageRange: '3-5',
          aspectRatio: '16:9',
          personalization: 'themed',
          returnUrl: window.location.href,
          assetKey: assetKey
        });
        
        console.log(`🎨 Redirecting to prompt generator for ${asset.name}...`);
        await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
        return;
      } 
      
      // Handle audio generation with hardcoded scripts (following LetterHunt pattern)
      else if (asset.type === 'audio') {
        console.log(`🎤 Generating audio for ${assetKey}...`);
        
        // Hardcoded scripts for each audio asset type
        let script = '';
        let assetClass = '';
        const childName = payload.childName;

        // Map each audio asset to its specific script
        switch (assetKey) {
          case 'introAudio':
            script = childName; // Just the child's name for pronunciation
            assetClass = 'name_audio';
            break;
          case 'outroAudio':
            script = `Great job, ${childName}!`;
            assetClass = 'name_encouragement';
            break;
          default:
            throw new Error(`Unknown audio asset: ${assetKey}`);
        }

        const audioParams = new URLSearchParams({
          templateType: 'namevideo',
          assetPurpose: assetClass,
          childName: childName,
          script: script,
          voiceId: '248nvfaZe8BXhKntjmpp', // Murph voice
          speed: '1.0',
          assetKey: assetKey,
          returnUrl: window.location.href
        });
        
        console.log(`🎤 Redirecting to audio generator for ${asset.name} with script: "${script}"`);
        await router.push(`/admin/audio-generator?${audioParams.toString()}`);
        return;
      }
      
      else {
        alert(`Generation for ${asset.type} assets coming soon!`);
      }
    } catch (error) {
      console.error('Error generating asset:', error);
      alert(`Failed to generate ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateLetterImage = async (safeZone: 'left' | 'right') => {
    if (!payload) return;

    const promptParams = new URLSearchParams({
      templateType: 'namevideo',
      childTheme: payload.childTheme,
      assetType: 'letterImages',
      assetClass: 'letter_background',
      artStyle: '2D Pixar Style',
      ageRange: '3-5',
      aspectRatio: '16:9',
      personalization: 'themed',
      safeZone: safeZone,
      returnUrl: window.location.href,
      assetKey: 'letterImages'
    });
    
    console.log(`🎨 Redirecting to prompt generator for ${safeZone} letter background image...`);
    await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
  };

  const generateLetterAudio = async (letter: string) => {
    if (!payload) return;

    console.log(`🎤 Generating letter audio for "${letter}"...`);
    
    // Hardcoded script: just the letter itself for pronunciation
    const script = letter;

    const audioParams = new URLSearchParams({
      templateType: 'namevideo',
      assetPurpose: 'letter_audio',
      childName: payload.childName,
      script: script,
      letter: letter,
      voiceId: '248nvfaZe8BXhKntjmpp', // Murph voice
      speed: '1.0',
      assetKey: `letter_${letter}`,
      returnUrl: window.location.href
    });
    
    console.log(`🎤 Redirecting to audio generator for letter ${letter} with script: "${script}"`);
    await router.push(`/admin/audio-generator?${audioParams.toString()}`);
  };

  const canGenerateVideo = () => {
    if (!payload) return false;
    
    // Calculate required images based on name length
    const nameLength = payload.childName.length;
    const requiredImages = nameLength;
    
    // Require minimum assets for generation
    const hasRequiredAudio = payload.assets.backgroundMusic.status === 'ready' && 
                            payload.assets.introAudio.status === 'ready';
    const hasMinimumImages = payload.assets.letterImages.filter(img => img.status === 'ready').length >= requiredImages;
    
    return hasRequiredAudio && 
           hasMinimumImages &&
           payload.asset_summary.completion_percentage >= 50; // At least 50% complete
  };

  const generateVideo = async () => {
    if (!payload) return;

    // Handle case where we have manual name input but no selectedChild
    const childIdToUse = selectedChild?.id || 'manual-input';

    setGenerating(true);
    try {
      // Convert our asset structure to the format expected by the NameVideo template
      // Keep ALL letters (including duplicates) for proper video sequence
      const letters = payload.childName.toUpperCase().split('');
      
      // Prepare letter image metadata with safe zones
      const letterImagesWithMetadata = payload.assets.letterImages
        .filter(img => img.status === 'ready')
        .map(img => ({
          url: img.url,
          safeZone: img.safeZone || 'left'
        }));

      // Prepare letter audio URLs in the expected format
      // Note: duplicate letters (like H in Christopher) will use the same audio asset
      const letterAudioUrls: { [letter: string]: { file_url: string } } = {};
      Object.entries(payload.assets.letterAudios).forEach(([letter, audio]) => {
        if (audio.status === 'ready' && audio.url) {
          letterAudioUrls[letter] = { file_url: audio.url };
        }
      });

      // Prepare audioAssets structure
      const audioAssets = {
        fullName: payload.assets.introAudio.url || '',
        letters: Object.fromEntries(
          Object.entries(payload.assets.letterAudios)
            .filter(([_, audio]) => audio.status === 'ready' && audio.url)
            .map(([letter, audio]) => [letter, audio.url])
        )
      };

      const requestPayload = {
        childName: payload.childName,
        childAge: payload.childAge,
        childTheme: payload.childTheme,
        childId: childIdToUse,
        backgroundMusicUrl: payload.assets.backgroundMusic.url,
        introImageUrl: payload.assets.introImage.url || '', 
        outroImageUrl: payload.assets.outroImage.url || '',
        letterImagesWithMetadata: letterImagesWithMetadata,
        letterAudioUrls: letterAudioUrls,
        audioAssets: audioAssets,
        introAudioUrl: payload.assets.introAudio.url || '',
        outroAudioUrl: payload.assets.outroAudio.url || '',
        submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d' // Default admin user UUID
      };

      console.log('🚀 Generating NameVideo with payload:', requestPayload);

      const response = await fetch('/api/videos/generate-name-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ NameVideo generation started successfully!\n\nJob ID: ${result.job_id}\nRender ID: ${result.render_id}\nOutput URL: ${result.output_url}`);
      } else {
        console.error('API Error Response:', result);
        alert(`❌ Error generating video: ${result.error}\n\nDetails: ${result.details || 'No additional details'}`);
      }

    } catch (error) {
      console.error('Error generating video:', error);
      alert('❌ Error generating video. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const getLettersArray = () => {
    if (!childName) return [];
    // Get unique letters to avoid duplicate React keys
    const letters = childName.toUpperCase().split('');
    return letters.filter((letter, index) => letters.indexOf(letter) === index); // Remove duplicates while preserving order
  };

  const getAllLettersArray = () => {
    if (!childName) return [];
    // Get ALL letters including duplicates for background images
    return childName.toUpperCase().split('');
  };

  return (
    <>
      <Head>
        <title>Name Video Request v2 - Admin Panel</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                📝 Name Video Request v2
              </h1>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
          {/* Missing Video Tracker */}
          <MissingVideoTracker
            videoType="namevideo"
            templateName="NameVideo"
            className="mb-6"
            onChildSelect={handleChildSelect}
          />
          
          {!payload ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Video Details</h2>
              
              {selectedChild && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-green-800">
                    ✅ Selected Child: {selectedChild.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Age {selectedChild.age}, loves {selectedChild.primary_interest}
                  </div>
                  <div style={{ fontSize: 14, color: '#2e7d32', fontWeight: 'bold' }}>
                    🎨 Theme: {selectedChild.primary_interest} (based on child's interests)
                  </div>
                  <button
                    onClick={() => {
                      setSelectedChild(null);
                      setChildName('');
                    }}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid #4caf50', 
                      color: '#2e7d32',
                      padding: '4px 8px', 
                      borderRadius: 4, 
                      fontSize: 12,
                      marginTop: 8,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Selection
                  </button>
                </div>
              )}
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  Child's Name:
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => handleManualNameInput(e.target.value)}
                  placeholder="Enter child's name or select from tracker above"
                  disabled={!!selectedChild}
                  style={{ 
                    padding: 8, 
                    fontSize: 16, 
                    width: 300, 
                    borderRadius: 4, 
                    border: '1px solid #ddd',
                    backgroundColor: selectedChild ? '#f5f5f5' : 'white'
                  }}
                />
                {childName && (
                  <div className="mt-2 text-sm text-gray-600">
                    📝 Unique Letters: {getLettersArray().join(' · ')} ({getLettersArray().length} unique letters)
                    <br />📝 Total Letters: {getAllLettersArray().join(' · ')} ({getAllLettersArray().length} total letters)
                    <br />
                    📝 Full Name: {childName.toUpperCase().split('').join(' · ')} ({childName.length} total letters)
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  Video Theme:
                </label>
                <div style={{ 
                  padding: 8, 
                  fontSize: 16, 
                  backgroundColor: '#f0f8ff', 
                  border: '1px solid #0066cc', 
                  borderRadius: 4,
                  color: '#0066cc',
                  fontWeight: 'bold'
                }}>
                  🎨 {selectedChild ? selectedChild.primary_interest : 'Auto-generated'} Theme
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 'normal', 
                    color: '#666',
                    marginLeft: 8
                  }}>
                    {selectedChild ? '(based on child\'s interests)' : '(based on child\'s interests when selected)'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={initializePayload}
                disabled={loading || !childName}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: 16, 
                  backgroundColor: (!childName || loading) ? '#ccc' : '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: (!childName || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Loading Assets...' : 'Create NameVideo Payload'}
              </button>
            </div>
          ) : (
            <>
              {/* Payload Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  NameVideo Payload for {payload.childName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Child Name</div>
                    <div className="text-lg font-bold text-blue-700">{payload.childName}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {getLettersArray().length} unique letters: {getLettersArray().join(' · ')}
                      <br />{getAllLettersArray().length} total letters: {getAllLettersArray().join(' · ')}
                      <br />
                      {payload.childName.length} total letters
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">Theme</div>
                    <div className="text-lg font-bold text-purple-700">{payload.childTheme}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Asset Progress</div>
                    <div className="text-lg font-bold text-green-700">
                      {payload.asset_summary.ready_assets}/{payload.asset_summary.total_assets} 
                      ({payload.asset_summary.completion_percentage}%)
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${payload.asset_summary.completion_percentage}%` }}
                  ></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setPayload(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Edit Details
                  </button>
                  

                </div>

                {!canGenerateVideo() && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">
                      <strong>Generation Requirements:</strong>
                      <br />• Background music must be ready
                      <br />• Name audio must be ready  
                      <br />• At least {payload.childName.length} letter background images must be ready ({payload.assets.letterImages.filter(img => img.status === 'ready').length} available)
                      <br />• At least 50% of assets must be complete
                      <br />• Current completion: {payload.asset_summary.completion_percentage}%
                    </p>
                  </div>
                )}
              </div>

              {/* Core Assets */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Assets</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Background Music */}
                  <div className={`p-4 rounded-lg border-2 ${
                    payload.assets.backgroundMusic.status === 'ready' ? 'border-green-200 bg-green-50' :
                    payload.assets.backgroundMusic.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{payload.assets.backgroundMusic.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        payload.assets.backgroundMusic.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.backgroundMusic.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.backgroundMusic.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{payload.assets.backgroundMusic.description}</p>
                    {payload.assets.backgroundMusic.url && (
                      <div className="mt-2">
                        <audio controls className="w-full h-8">
                          <source src={payload.assets.backgroundMusic.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    {payload.assets.backgroundMusic.status === 'missing' && (
                      <button
                        onClick={() => generateAsset('backgroundMusic')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                  </div>

                  {/* Name Audio */}
                  <div className={`p-4 rounded-lg border-2 ${
                    payload.assets.introAudio.status === 'ready' ? 'border-green-200 bg-green-50' :
                    payload.assets.introAudio.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{payload.assets.introAudio.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        payload.assets.introAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.introAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.introAudio.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{payload.assets.introAudio.description}</p>
                    {payload.assets.introAudio.url && (
                      <div className="mt-2">
                        <audio controls className="w-full h-8">
                          <source src={payload.assets.introAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    {payload.assets.introAudio.status === 'missing' && (
                      <button
                        onClick={() => generateAsset('introAudio')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                  </div>

                  {/* Outro Audio */}
                  <div className={`p-4 rounded-lg border-2 ${
                    payload.assets.outroAudio.status === 'ready' ? 'border-green-200 bg-green-50' :
                    payload.assets.outroAudio.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{payload.assets.outroAudio.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        payload.assets.outroAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.outroAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.outroAudio.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{payload.assets.outroAudio.description}</p>
                    {payload.assets.outroAudio.url && (
                      <div className="mt-2">
                        <audio controls className="w-full h-8">
                          <source src={payload.assets.outroAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    {payload.assets.outroAudio.status === 'missing' && (
                      <button
                        onClick={() => generateAsset('outroAudio')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                  </div>

                  {/* Intro Image */}
                  <div className={`p-4 rounded-lg border-2 ${
                    payload.assets.introImage.status === 'ready' ? 'border-green-200 bg-green-50' :
                    payload.assets.introImage.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{payload.assets.introImage.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        payload.assets.introImage.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.introImage.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.introImage.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{payload.assets.introImage.description}</p>
                    {payload.assets.introImage.url && (
                      <div className="mt-2">
                        <img src={payload.assets.introImage.url} alt="Intro" className="w-full h-20 object-cover rounded" />
                      </div>
                    )}
                    {payload.assets.introImage.status === 'missing' && (
                      <button
                        onClick={() => generateAsset('introImage')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                  </div>

                  {/* Outro Image */}
                  <div className={`p-4 rounded-lg border-2 ${
                    payload.assets.outroImage.status === 'ready' ? 'border-green-200 bg-green-50' :
                    payload.assets.outroImage.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{payload.assets.outroImage.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        payload.assets.outroImage.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.outroImage.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.outroImage.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{payload.assets.outroImage.description}</p>
                    {payload.assets.outroImage.url && (
                      <div className="mt-2">
                        <img src={payload.assets.outroImage.url} alt="Outro" className="w-full h-20 object-cover rounded" />
                      </div>
                    )}
                    {payload.assets.outroImage.status === 'missing' && (
                      <button
                        onClick={() => generateAsset('outroImage')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Letter Audio Assets */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Letter Audio ({Object.values(payload.assets.letterAudios).filter(audio => audio.status === 'ready').length}/{getLettersArray().length} ready)
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {getLettersArray().map((letter, index) => {
                    const letterAudio = payload.assets.letterAudios[letter];
                    return (
                      <div key={letter} className={`p-3 rounded border-2 ${
                        letterAudio?.status === 'ready' ? 'border-green-200 bg-green-50' :
                        letterAudio?.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                        'border-red-200 bg-red-50'
                      }`}>
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">{letter}</div>
                          <div className="text-xs mb-2">{letterAudio?.status?.toUpperCase() || 'MISSING'}</div>
                          {letterAudio?.url && (
                            <audio controls className="w-full h-6 mb-2">
                              <source src={letterAudio.url} type="audio/mpeg" />
                            </audio>
                          )}
                          {(!letterAudio || letterAudio.status === 'missing') && (
                            <button
                              onClick={() => generateLetterAudio(letter)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Letter Background Images */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Letter Background Images ({payload.assets.letterImages.filter(img => img.status === 'ready').length}/{getAllLettersArray().length} ready)
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateLetterImage('left')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Generate Left Safe Zone
                    </button>
                    <button
                      onClick={() => generateLetterImage('right')}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      Generate Right Safe Zone
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {payload.assets.letterImages.slice(0, getAllLettersArray().length).map((img, index) => (
                    <div key={index} className={`p-2 rounded border-2 ${
                      img.status === 'ready' ? 'border-green-200 bg-green-50' :
                      img.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      {img.url ? (
                        <img src={img.url} alt={`Letter Background ${index + 1}`} className="w-full h-16 object-cover rounded" />
                      ) : (
                        <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center text-xs">
                          No Image
                        </div>
                      )}
                      <p className="text-xs mt-1 text-center">
                        {img.status.toUpperCase()} 
                        {img.safeZone && <span className="ml-1 text-blue-600">({img.safeZone.toUpperCase()})</span>}
                      </p>
                    </div>
                  ))}
                  
                  {/* Show placeholder slots for missing images */}
                  {Array.from({ length: Math.max(0, getAllLettersArray().length - payload.assets.letterImages.length) }).map((_, index) => (
                    <div key={`placeholder-${index}`} className="p-2 rounded border-2 border-gray-200 bg-gray-50">
                      <div className="w-full h-16 bg-gray-300 rounded flex items-center justify-center text-xs">
                        Missing
                      </div>
                      <p className="text-xs mt-1 text-center text-gray-500">NEEDED</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Video Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Generate Video</h2>
                    <p className="text-gray-600">Ready to create the personalized name video?</p>
                  </div>
                  
                  <button
                    onClick={generateVideo}
                    disabled={!canGenerateVideo() || generating}
                    className={`px-8 py-3 rounded-lg font-medium text-lg ${
                      canGenerateVideo() 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {generating ? 'Generating...' : 'Generate Name Video'}
                  </button>
                </div>

                {!canGenerateVideo() && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">
                      <strong>Generation Requirements:</strong>
                      <br />• Background music must be ready
                      <br />• Name audio must be ready  
                      <br />• At least {getAllLettersArray().length} letter background images must be ready
                      <br />• At least 50% of assets must be complete
                      <br />• Current completion: {payload.asset_summary.completion_percentage}%
                    </p>
                  </div>
                )}
              </div>

              {/* Payload JSON Display */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Current Payload (JSON)</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(payload, null, 2)}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                    alert('Payload copied to clipboard!');
                  }}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Copy to Clipboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
