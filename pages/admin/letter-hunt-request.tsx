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
  type: 'image' | 'audio' | 'video';
  name: string;
  description: string;
  status: 'missing' | 'generating' | 'ready';
  url?: string;
  generatedAt?: string;
}

interface LetterHuntPayload {
  childName: string;
  targetLetter: string;
  assets: {
    titleCard: AssetStatus;
    introVideo: AssetStatus;
    intro2Video: AssetStatus;
    signImage: AssetStatus;
    bookImage: AssetStatus;
    groceryImage: AssetStatus;
    happyDanceVideo: AssetStatus;
    endingImage: AssetStatus;
    endingVideo: AssetStatus;
    // Audio assets
    titleAudio: AssetStatus;
    introAudio: AssetStatus;
    intro2Audio: AssetStatus;
    signAudio: AssetStatus;
    bookAudio: AssetStatus;
    groceryAudio: AssetStatus;
    happyDanceAudio: AssetStatus;
    endingAudio: AssetStatus;
    backgroundMusic: AssetStatus;
  };
}

export default function LetterHuntRequest() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [targetLetter, setTargetLetter] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [payload, setPayload] = useState<LetterHuntPayload | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  // Handle URL parameters (child_id, assignment_id)
  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (router.query.child_id && children.length > 0) {
      const child = children.find(c => c.id === router.query.child_id);
      if (child) {
        setSelectedChild(child);
        setChildName(child.name);
        // Set default target letter to first letter of child's name
        setTargetLetter(child.name.charAt(0).toUpperCase());
      }
    }
  }, [router.query.child_id, children]);

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
    }
  };
  const [loading, setLoading] = useState(false);

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setChildName(child.name);
    // Auto-populate target letter as first letter of child's name
    const firstLetter = child.name.charAt(0).toUpperCase();
    setTargetLetter(firstLetter);
    
    console.log(`🎯 Auto-selected letter "${firstLetter}" for ${child.name}`);
  };

  const handleManualNameInput = (name: string) => {
    setChildName(name);
    // Auto-populate target letter as first letter of manually typed name
    if (name.length > 0) {
      const firstLetter = name.charAt(0).toUpperCase();
      setTargetLetter(firstLetter);
      console.log(`🎯 Auto-populated letter "${firstLetter}" for manually typed name "${name}"`);
    } else {
      setTargetLetter('');
    }
  };

  const initializePayload = async () => {
    const nameToUse = selectedChild?.name || childName;
    const themeToUse = selectedChild?.primary_interest || 'adventure';
    
    if (!nameToUse || !targetLetter) {
      alert('Please enter both child name and target letter');
      return;
    }

    console.log(`🔍 Checking for existing Letter Hunt assets for ${nameToUse} (Letter ${targetLetter})`);

    // Check for existing Letter Hunt assets - both specific and generic
    // 1. Assets specific to this child and letter
    const { data: specificAssets, error: specificError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', nameToUse)
      .eq('metadata->>targetLetter', targetLetter);

    // 2. Letter Hunt video assets that match the target letter (regardless of child name)
    const { data: letterSpecificAssets, error: letterError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .eq('metadata->>targetLetter', targetLetter);

    // 3. Letter-specific audio assets (not personalized, reusable across children)
    const { data: letterSpecificAudioAssets, error: letterAudioError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    // 4. Generic Letter Hunt video assets (not tied to specific child/letter)
    const { data: genericVideoAssets, error: genericError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
      .is('metadata->>targetLetter', null);

    // 5. Generic Letter Hunt audio assets (not tied to specific child/letter)
    const { data: genericAudioAssets, error: genericAudioError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
      .is('metadata->>targetLetter', null);

    // 6. Letter Hunt image assets that match the target letter (not tied to specific child)
    const { data: letterSpecificImageAssets, error: letterImageError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'image')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    // Combine all sets of assets, prioritizing specific > letter-specific > generic
    const existingAssets = [
      ...(specificAssets || []),
      ...(letterSpecificAssets || []),
      ...(letterSpecificAudioAssets || []),
      ...(genericVideoAssets || []),
      ...(genericAudioAssets || []),
      ...(letterSpecificImageAssets || [])
    ];
    const error = specificError || letterError || letterAudioError || genericError || genericAudioError || letterImageError;

    if (error) {
      console.error('Error checking for existing assets:', error);
    }

    console.log(`📦 Found ${existingAssets?.length || 0} existing Letter Hunt assets:`, existingAssets);
    
    // Enhanced logging for video asset debugging
    existingAssets?.forEach(asset => {
      if (asset.type === 'video') {
        console.log(`🎥 Video Asset Debug:`, {
          id: asset.id,
          targetLetter: asset.metadata?.targetLetter,
          theme: asset.metadata?.theme,
          section: asset.metadata?.section,
          category: asset.metadata?.category,
          child_name: asset.metadata?.child_name,
          searchingFor: `Letter ${targetLetter}, Theme ${themeToUse}`
        });
      }
    });

    // Create mapping of existing assets by imageType (for images), assetPurpose (for audio), or videoType (for videos)
    const existingByType = new Map();
    existingAssets?.forEach(asset => {
      // For images, use imageType; for audio, use assetPurpose; for videos, use videoType
      let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
      
      // FALLBACK: For legacy audio assets without assetPurpose, try to infer from template_context
      if (!assetKey && asset.type === 'audio' && asset.metadata?.template_context?.asset_purpose) {
        assetKey = asset.metadata.template_context.asset_purpose;
        console.log(`🔄 Legacy asset: Using template_context.asset_purpose: ${assetKey} for asset ${asset.id}`);
      }
      
      // FALLBACK: For legacy video assets, try to infer from category or section
      if (!assetKey && asset.type === 'video') {
        // Try to map common video categories to our asset keys
        const category = asset.metadata?.category;
        const section = asset.metadata?.section;
        
        // Handle specific asset ID mappings for known videos
        // Letter + Theme videos (introVideo)
        if (asset.id === 'eb3fcec0-d9a4-421d-a2fa-1bded854365d' || // Halloween + Letter N
            asset.id === '540dc1d4-f8c6-4c71-9b80-5d9f6964e9db' || // Dinosaurs + Letter L
            asset.id === 'c0793472-2eb4-4dab-aaec-c28689391077') {   // Dogs + Letter A
          assetKey = 'introVideo';
        }
        // Search videos (intro2Video)
        else if (asset.id === 'c39cf5dc-dc21-4057-84d6-7ac059e1ee96' || // Dinosaurs search
                 asset.id === '9b211a49-820f-477a-9512-322795762221' || // Dog search
                 asset.id === 'b4bb12bd-f2a3-4035-9d38-6fca03b9c8dc') {   // Halloween search
          assetKey = 'intro2Video';
        }
        // Handle direct section mappings for future uploads
        else if (section === 'introVideo') {
          assetKey = 'introVideo';
        } else if (section === 'intro2Video') {
          assetKey = 'intro2Video';
        } else if (section === 'happyDanceVideo' || section === 'dance') {
          assetKey = 'happyDanceVideo';
        }
        // Handle legacy mappings
        else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
          assetKey = 'introVideo';
        } else if (section === 'search' || section === 'intro2' || category === 'thematic') {
          assetKey = 'intro2Video';
        } else if (section === 'adventure' || section === 'intro3') {
          assetKey = 'intro3Video';
        } else if (category === 'dance') {
          assetKey = 'happyDanceVideo';
        }
        
        if (assetKey) {
          console.log(`🔄 Legacy video: Inferred videoType: ${assetKey} from category: ${category}, section: ${section} for asset ${asset.id}`);
        }
      }
      
      if (assetKey) {
        const existingAsset = existingByType.get(assetKey);
        let shouldUseThisAsset = false;
        
        if (asset.type === 'video') {
          // For videos, ONLY use if theme matches exactly
          const currentTheme = asset.metadata?.theme?.toLowerCase();
          const desiredTheme = themeToUse.toLowerCase();
          
          // Normalize theme names to handle plural/singular differences
          const normalizeTheme = (theme: string) => {
            const normalized = theme.toLowerCase();
            // Handle common plural/singular cases
            if (normalized === 'dogs' || normalized === 'dog') return 'dog';
            if (normalized === 'dinosaurs' || normalized === 'dinosaur') return 'dinosaur';
            if (normalized === 'cats' || normalized === 'cat') return 'cat';
            if (normalized === 'adventures' || normalized === 'adventure') return 'adventure';
            return normalized;
          };
          
          const normalizedCurrentTheme = normalizeTheme(currentTheme || '');
          const normalizedDesiredTheme = normalizeTheme(desiredTheme);
          
          if (normalizedCurrentTheme === normalizedDesiredTheme) {
            if (!existingAsset) {
              // First matching theme video found
              shouldUseThisAsset = true;
              console.log(`✅ First ${assetKey} video with matching theme: ${currentTheme}`);
            } else {
              // Multiple videos with same theme - randomly select between them
              const shouldReplace = Math.random() < 0.5; // 50% chance to replace
              if (shouldReplace) {
                shouldUseThisAsset = true;
                console.log(`🎲 Randomly replacing ${assetKey}: ${existingAsset.theme} → ${currentTheme} (random selection)`);
              } else {
                console.log(`🎲 Randomly keeping existing ${assetKey}: ${existingAsset.theme} (random selection)`);
              }
            }
          } else {
            // Theme doesn't match - skip this asset
            shouldUseThisAsset = false;
            console.log(`⚠️ Skipping video asset ${assetKey} - theme mismatch: ${currentTheme} !== ${desiredTheme}`);
          }
        } else {
          // Non-video assets (images, audio) - use first one found, or random selection if multiple
          if (!existingAsset) {
            shouldUseThisAsset = true;
            console.log(`✅ First ${assetKey} asset found`);
          } else {
            // Multiple non-video assets - randomly select between them
            const shouldReplace = Math.random() < 0.5; // 50% chance to replace
            if (shouldReplace) {
              shouldUseThisAsset = true;
              console.log(`🎲 Randomly replacing ${assetKey} (random selection)`);
            } else {
              console.log(`🎲 Randomly keeping existing ${assetKey} (random selection)`);
            }
          }
        }
        
        if (shouldUseThisAsset) {
          existingByType.set(assetKey, {
            url: asset.file_url,
            status: 'ready',
            assetId: asset.id,
            generatedAt: asset.created_at,
            theme: asset.metadata?.theme
          });
          console.log(`✅ Using asset: ${assetKey} (${asset.type}) - ${asset.file_url}${asset.metadata?.theme ? ` [Theme: ${asset.metadata.theme}]` : ''}`);
        }
      } else {
        console.log(`⚠️ Asset missing key field:`, {
          id: asset.id,
          type: asset.type,
          imageType: asset.metadata?.imageType,
          assetPurpose: asset.metadata?.assetPurpose,
          videoType: asset.metadata?.videoType,
          category: asset.metadata?.category,
          section: asset.metadata?.section,
          templateContextAssetPurpose: asset.metadata?.template_context?.asset_purpose
        });
      }
    });

    // Check for video assets that should exist but don't have theme matches
    // Only first 3 parts are included in current render: intro, search, (adventure removed for now)
    const requiredVideoAssets = ['introVideo', 'intro2Video'];
    const videoErrors: Array<{
      type: string;
      error: string;
      message: string;
      availableThemes?: string[];
    }> = [];
    
    requiredVideoAssets.forEach(videoKey => {
      const hasMatchingVideo = existingByType.has(videoKey);
      if (!hasMatchingVideo) {
        // Check if we have videos for this type but with wrong themes
        const availableVideos = existingAssets?.filter(asset => {
          let assetKey = asset.metadata?.videoType;
          
          // Use the same mapping logic to determine what this asset would be classified as
          if (!assetKey && asset.type === 'video') {
            const category = asset.metadata?.category;
            const section = asset.metadata?.section;
            
            if (asset.id === 'eb3fcec0-d9a4-421d-a2fa-1bded854365d' || 
                asset.id === '540dc1d4-f8c6-4c71-9b80-5d9f6964e9db' || 
                asset.id === 'c0793472-2eb4-4dab-aaec-c28689391077') {
              assetKey = 'introVideo';
            } else if (asset.id === 'c39cf5dc-dc21-4057-84d6-7ac059e1ee96' || 
                       asset.id === '9b211a49-820f-477a-9512-322795762221' || 
                       asset.id === 'b4bb12bd-f2a3-4035-9d38-6fca03b9c8dc') {
              assetKey = 'intro2Video';
            } else if (section === 'introVideo') {
              assetKey = 'introVideo';
            } else if (section === 'intro2Video') {
              assetKey = 'intro2Video';
            } else if (section === 'happyDanceVideo' || section === 'dance') {
              assetKey = 'happyDanceVideo';
            } else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
              assetKey = 'introVideo';
            } else if (section === 'search' || section === 'intro2' || category === 'thematic') {
              assetKey = 'intro2Video';
            } else if (section === 'adventure' || section === 'intro3') {
              assetKey = 'intro3Video';
            } else if (category === 'dance') {
              assetKey = 'happyDanceVideo';
            }
          }
          
          return assetKey === videoKey;
        });
        
        if (availableVideos && availableVideos.length > 0) {
          const availableThemes = availableVideos.map(v => v.metadata?.theme).filter(t => t);
          videoErrors.push({
            type: videoKey,
            error: 'theme_mismatch',
            message: `No ${videoKey} video found for theme "${themeToUse}". Available themes: ${availableThemes.join(', ')}`,
            availableThemes
          });
        } else {
          videoErrors.push({
            type: videoKey,
            error: 'missing_entirely',
            message: `No ${videoKey} videos found at all. Please upload videos for this segment.`
          });
        }
      }
    });

    // Log video errors
    if (videoErrors.length > 0) {
      console.error('🚨 Video Theme Matching Errors:', videoErrors);
      videoErrors.forEach(error => {
        console.error(`❌ ${error.message}`);
      });
    }

    // Create payload with only the 3-part assets that are actually used in render
    const newPayload: LetterHuntPayload = {
      childName: nameToUse.trim(),
      targetLetter: targetLetter.toUpperCase().trim(),
      assets: {
        // Images
        titleCard: existingByType.get('titleCard') ? {
          ...existingByType.get('titleCard'),
          type: 'image',
          name: 'Title Card',
          description: `"${nameToUse}'s Letter Hunt!" title card with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Title Card',
          description: `"${nameToUse}'s Letter Hunt!" title card with ${themeToUse} theme`,
          status: 'missing'
        },
        signImage: existingByType.get('signImage') ? {
          ...existingByType.get('signImage'),
          type: 'image',
          name: 'Letter on Signs',
          description: `Letter ${targetLetter} on colorful street sign with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter on Signs',
          description: `Letter ${targetLetter} on colorful street sign with ${themeToUse} theme`,
          status: 'missing'
        },
        bookImage: existingByType.get('bookImage') ? {
          ...existingByType.get('bookImage'),
          type: 'image',
          name: 'Letter on Books',
          description: `Letter ${targetLetter} on children's book cover with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter on Books',
          description: `Letter ${targetLetter} on children's book cover with ${themeToUse} theme`,
          status: 'missing'
        },
        groceryImage: existingByType.get('groceryImage') ? {
          ...existingByType.get('groceryImage'),
          type: 'image',
          name: 'Letter in Grocery Store',
          description: `Letter ${targetLetter} on grocery store sign/cereal box with ${themeToUse} theme`
        } : {
          type: 'image',
          name: 'Letter in Grocery Store',
          description: `Letter ${targetLetter} on grocery store sign/cereal box with ${themeToUse} theme`,
          status: 'missing'
        },
        endingImage: existingByType.get('endingImage') ? {
          ...existingByType.get('endingImage'),
          type: 'image',
          name: 'Ending Image',
          description: `Letter ${targetLetter} with ${themeToUse} characters waving goodbye`
        } : {
          type: 'image',
          name: 'Ending Image',
          description: `Letter ${targetLetter} with ${themeToUse} characters waving goodbye`,
          status: 'missing'
        },
        // Videos
        introVideo: existingByType.get('introVideo') ? {
          ...existingByType.get('introVideo'),
          type: 'video',
          name: 'Intro Video',
          description: `${themeToUse} character pointing to giant letter`
        } : {
          type: 'video',
          name: 'Intro Video',
          description: `${themeToUse} character pointing to giant letter`,
          status: 'missing'
        },
        intro2Video: existingByType.get('intro2Video') ? {
          ...existingByType.get('intro2Video'),
          type: 'video',
          name: 'Search Video',
          description: `${themeToUse} character searching around playfully`
        } : {
          type: 'video',
          name: 'Search Video',
          description: `${themeToUse} character searching around playfully`,
          status: 'missing'
        },
        happyDanceVideo: existingByType.get('happyDanceVideo') ? {
          ...existingByType.get('happyDanceVideo'),
          type: 'video',
          name: 'Happy Dance Video',
          description: `${themeToUse} character doing a joyful dance`
        } : {
          type: 'video',
          name: 'Happy Dance Video',
          description: `${themeToUse} character doing a joyful dance`,
          status: 'missing'
        },
        endingVideo: existingByType.get('endingVideo') ? {
          ...existingByType.get('endingVideo'),
          type: 'video',
          name: 'Ending Video',
          description: `Letter ${targetLetter} ending video with colorful celebration`
        } : {
          type: 'video',
          name: 'Ending Video',
          description: `Letter ${targetLetter} ending video with colorful celebration`,
          status: 'missing'
        },
        // Audio assets
        titleAudio: existingByType.get('titleAudio') ? {
          ...existingByType.get('titleAudio'),
          type: 'audio',
          name: 'Title Audio',
          description: `"Letter Hunt for ${nameToUse}"`
        } : {
          type: 'audio',
          name: 'Title Audio',
          description: `"Letter Hunt for ${nameToUse}"`,
          status: 'missing'
        },
        introAudio: existingByType.get('introAudio') ? {
          ...existingByType.get('introAudio'),
          type: 'audio',
          name: 'Intro Audio',
          description: `"Today we're looking for the letter ${targetLetter}!"`
        } : {
          type: 'audio',
          name: 'Intro Audio',
          description: `"Today we're looking for the letter ${targetLetter}!"`,
          status: 'missing'
        },
        intro2Audio: existingByType.get('intro2Audio') ? {
          ...existingByType.get('intro2Audio'),
          type: 'audio',
          name: 'Search Audio',
          description: `"Everywhere you go, look for the letter ${targetLetter}!"`
        } : {
          type: 'audio',
          name: 'Search Audio',
          description: `"Everywhere you go, look for the letter ${targetLetter}!"`,
          status: 'missing'
        },
        signAudio: existingByType.get('signAudio') ? {
          ...existingByType.get('signAudio'),
          type: 'audio',
          name: 'Signs Audio',
          description: '"On signs"'
        } : {
          type: 'audio',
          name: 'Signs Audio',
          description: '"On signs"',
          status: 'missing'
        },
        bookAudio: existingByType.get('bookAudio') ? {
          ...existingByType.get('bookAudio'),
          type: 'audio',
          name: 'Books Audio',
          description: '"On books"'
        } : {
          type: 'audio',
          name: 'Books Audio',
          description: '"On books"',
          status: 'missing'
        },
        groceryAudio: existingByType.get('groceryAudio') ? {
          ...existingByType.get('groceryAudio'),
          type: 'audio',
          name: 'Grocery Audio',
          description: '"Even in the grocery store!"'
        } : {
          type: 'audio',
          name: 'Grocery Audio',
          description: '"Even in the grocery store!"',
          status: 'missing'
        },
        happyDanceAudio: existingByType.get('happyDanceAudio') ? {
          ...existingByType.get('happyDanceAudio'),
          type: 'audio',
          name: 'Happy Dance Audio',
          description: '"And when you find your letter, I want you to do a little happy dance!"'
        } : {
          type: 'audio',
          name: 'Happy Dance Audio',
          description: '"And when you find your letter, I want you to do a little happy dance!"',
          status: 'missing'
        },
        endingAudio: {
          type: 'audio',
          name: 'Ending Audio',
          description: `"Have fun finding the letter ${targetLetter}, ${nameToUse}!"`,
          status: 'missing'
        },
        backgroundMusic: {
          type: 'audio',
          name: 'Background Music',
          description: 'Cheerful background music for Letter Hunt video',
          status: 'ready',
          url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752340926893.MP3'
        }
      }
    };

    // Log findings
    const foundAssets = Array.from(existingByType.keys());
    if (foundAssets.length > 0) {
      console.log(`✅ Found existing assets: ${foundAssets.join(', ')}`);
      
      // Debug: Check what titleAudio data we have
      const titleAudioData = existingByType.get('titleAudio');
      console.log('🎯 TitleAudio data from map:', titleAudioData);
    } else {
      console.log('📭 No existing assets found for this child/letter combination');
    }

    setPayload(newPayload);
  };

  const generateAsset = async (assetKey: keyof LetterHuntPayload['assets']) => {
    if (!payload) {
      console.error('No payload available for asset generation');
      return;
    }

    const asset = payload.assets[assetKey];
    console.log(`🎯 Generating asset: ${assetKey}`, { asset, payload });

    try {
      // Handle image generation 
      if (asset.type === 'image' && assetKey === 'titleCard') {
        // Instead of calling API directly, redirect to manual prompt creation flow
        const promptParams = new URLSearchParams({
          templateType: 'letter-hunt',
          childName: payload.childName,
          targetLetter: payload.targetLetter,
          assetType: 'titleCard', // This will be mapped to imageType in the prompt generator
          artStyle: '2D Pixar Style',
          ageRange: '3-5',
          aspectRatio: '16:9',
          personalization: 'personalized', // Title card is personalized with child's name
          returnUrl: window.location.href, // Return to this page after prompt creation
          assetKey: assetKey // So we know which asset to update when returning
        });

        // Only add theme if a child is selected (titleCard is personalized)
        if (selectedChild?.primary_interest) {
          promptParams.append('theme', selectedChild.primary_interest);
        }
        
        console.log(`🎨 Redirecting to manual prompt creation for ${asset.name}...`);
        console.log('📋 Prompt params:', promptParams.toString());
        
        await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
        return; // Don't update status since we're redirecting
      } 
      
      // Handle letter-specific image generation (signImage, bookImage, groceryImage)
      else if (asset.type === 'image' && ['signImage', 'bookImage', 'groceryImage'].includes(assetKey)) {
        let promptContext = '';
        
        switch (assetKey) {
          case 'signImage':
            promptContext = `A simple, colorful street sign that displays only the letter "${payload.targetLetter}" in large, bold, clear text. The letter should be the ONLY text visible on the sign - no other words, numbers, or letters. The sign should be bright and cheerful with a clean, simple design in 2D Pixar animation style. Set against a simple background like a park or street scene. Focus entirely on making the letter "${payload.targetLetter}" prominent and easy to read.`;
            break;
          case 'bookImage':
            promptContext = `A children's book with the letter "${payload.targetLetter}" prominently displayed on the front cover in large, bold, clear text. The letter should be the main focus of the book cover - no other text or letters visible. Simple, clean book design in 2D Pixar animation style with bright, cheerful colors. The book can be shown on a simple surface or held, but the letter "${payload.targetLetter}" should be the clear focal point.`;
            break;
          case 'groceryImage':
            promptContext = `A grocery store product (can, box, or jar) with the letter "${payload.targetLetter}" prominently displayed on the label in large, bold, clear text. The letter should be the ONLY visible text on the product - no brand names, other letters, or words. Simple, clean product design in 2D Pixar animation style with bright, cheerful colors. The product should be clearly visible, with the letter "${payload.targetLetter}" as the main focal point.`;
            break;
        }

        const promptParams = new URLSearchParams({
          templateType: 'letter-hunt',
          targetLetter: payload.targetLetter,
          assetType: assetKey, // This will be mapped to imageType in the prompt generator
          artStyle: '2D Pixar Style',
          ageRange: '3-5',
          aspectRatio: '16:9',
          personalization: 'general', // Letter-specific images are general, not personalized
          theme: '', // Pass empty theme to avoid 'monsters' fallback
          letterFocus: payload.targetLetter, // Add letter focus dropdown assignment
          returnUrl: window.location.href,
          assetKey: assetKey
        });
        
        // Note: We no longer pass customPrompt as additionalContext
        // The prompt generator will build the appropriate task based on imageType and targetLetter
        
        console.log(`🎨 Redirecting to manual prompt creation for ${asset.name}...`);
        console.log('📋 Prompt params:', promptParams.toString());
        
        await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
        return; // Don't update status since we're redirecting
      } 
      
      // Handle audio generation
      else if (asset.type === 'audio') {
        console.log(`🎤 Redirecting to audio generator for ${assetKey}...`);
        
        // Create the script based on the asset description and payload data
        let script = '';
        const childName = payload.childName;
        const targetLetter = payload.targetLetter;

        // Map each audio asset to its script
        switch (assetKey) {
          case 'titleAudio':
            script = `Letter Hunt for ${childName}`;
            break;
          case 'introAudio':
            script = `Today we're looking for the letter ${targetLetter}!`;
            break;
          case 'intro2Audio':
            script = `Everywhere you go, look for the letter ${targetLetter}!`;
            break;
          case 'signAudio':
            script = "On signs";
            break;
          case 'bookAudio':
            script = "On books";
            break;
          case 'groceryAudio':
            script = "Even in the grocery store!";
            break;
          case 'happyDanceAudio':
            script = "And when you find your letter, I want you to do a little happy dance!";
            break;
          case 'endingAudio':
            script = `Have fun finding the letter ${targetLetter}, ${childName}!`;
            break;
          default:
            throw new Error(`Unknown audio asset: ${assetKey}`);
        }

        // Redirect to audio generator with pre-filled parameters
        const audioParams = new URLSearchParams({
          templateType: 'letter-hunt',
          assetPurpose: assetKey,
          targetLetter: targetLetter,
          script: script,
          voiceId: '248nvfaZe8BXhKntjmpp', // Murph voice
          speed: '1.0',
          assetKey: assetKey, // So we know which asset to update when returning
          returnUrl: window.location.href // Return to this page after audio generation
        });

        // For letter-specific audio (not personalized), don't include childName
        const isLetterSpecificAudio = ['introAudio', 'intro2Audio', 'signAudio', 'bookAudio', 'groceryAudio', 'happyDanceAudio'].includes(assetKey);
        if (!isLetterSpecificAudio) {
          audioParams.append('childName', childName);
        }
        
        console.log(`🎤 Redirecting to audio generator for ${asset.name}...`);
        console.log('📋 Audio params:', audioParams.toString());
        
        await router.push(`/admin/audio-generator?${audioParams.toString()}`);
        return; // Don't update status since we're redirecting
      } 
      
      // Handle video generation
      else if (asset.type === 'video') {
        console.log(`🎬 Redirecting to video asset upload for ${assetKey}...`);
        
        // Map asset keys to appropriate metadata for video upload
        let videoType = assetKey;
        let section = '';
        
        switch (assetKey) {
          case 'introVideo':
            section = 'intro';
            break;
          case 'intro2Video':
            section = 'search';
            break;
          case 'happyDanceVideo':
            section = 'dance';
            break;
          case 'endingVideo':
            section = 'ending';
            break;
          default:
            section = assetKey.replace('Video', '');
        }

        // Redirect to video asset upload with pre-filled parameters
        const videoParams = new URLSearchParams({
          template: 'letter-hunt',
          videoType: videoType,
          section: section,
          theme: selectedChild?.primary_interest || 'adventure',
          letter: payload.targetLetter,
          childName: payload.childName,
          returnUrl: window.location.href,
          assetKey: assetKey
        });
        
        console.log(`🎬 Redirecting to video asset upload for ${asset.name}...`);
        console.log('📋 Video params:', videoParams.toString());
        
        await router.push(`/admin/video-asset-upload?${videoParams.toString()}`);
        return; // Don't update status since we're redirecting
      }
      
      else {
        // Update status to generating for other asset types
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            [assetKey]: { ...asset, status: 'generating' }
          }
        } : null);
        
        // Placeholder for other asset types
        alert(`Generation for ${asset.type} assets coming soon!`);
        setPayload(prev => prev ? {
          ...prev,
          assets: {
            ...prev.assets,
            [assetKey]: { ...asset, status: 'missing' }
          }
        } : null);
      }
    } catch (error) {
      console.error('Error generating asset:', error);
      console.error('Error details:', {
        assetKey,
        asset,
        payload,
        selectedChild,
        error: error instanceof Error ? error.message : error
      });
      alert(`Failed to generate ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      setPayload(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          [assetKey]: { ...asset, status: 'missing' }
        }
      } : null);
    }
  };

  const canSubmitVideo = () => {
    if (!payload) return false;
    // For Letter Hunt, we don't require child selection in test mode
    // The API handles invalid/missing child IDs gracefully by skipping moderation records
    
    // Phase 2: Require Title Card AND Title Audio for video generation
    // This enables integration of Title Audio into the Remotion template
    return payload.assets.titleCard.status === 'ready' && 
           payload.assets.titleAudio.status === 'ready';
    
    // TODO: Later enable all assets: return Object.values(payload.assets).every(asset => asset.status === 'ready');
  };

  const submitForVideoGeneration = async () => {
    if (!payload || !canSubmitVideo()) return;

    setLoading(true);
    try {
      console.log('🎬 Submitting Letter Hunt video generation:', payload);
      
      // Clean asset objects to only include url and status (remove type, name, description, etc.)
      // Send assets for the complete 8-segment video
      const allowedAssetKeys = [
        'titleCard', 'titleAudio',           // Part 1: Title (0-3s)
        'introVideo', 'introAudio',          // Part 2: Letter + Theme (3-8.5s) 
        'intro2Video', 'intro2Audio',        // Part 3: Search (8.5-14s)
        'signImage', 'signAudio',            // Part 4: Signs (14-18s)
        'bookImage', 'bookAudio',            // Part 5: Books (18-22s)
        'groceryImage', 'groceryAudio',      // Part 6: Grocery (22-26s)
        'happyDanceVideo', 'happyDanceAudio', // Part 7: Happy Dance (26-31.5s)
        'endingVideo', 'endingAudio',        // Part 8: Ending (31.5-37s)
        'backgroundMusic'                    // Background music throughout
      ];
      
      const cleanedAssets: any = {};
      Object.entries(payload.assets).forEach(([key, asset]) => {
        // Only include assets for the first 3 parts
        if (allowedAssetKeys.includes(key)) {
          cleanedAssets[key] = {
            url: asset.url || '',
            status: asset.status
          };
        }
      });
      
      console.log('🧹 Cleaned assets for API:', cleanedAssets);
      
      // Call our new Letter Hunt generation API
      const response = await fetch('/api/videos/generate-letter-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: payload.childName,
          targetLetter: payload.targetLetter,
          childTheme: selectedChild?.primary_interest || 'adventure',
          childAge: selectedChild?.age || 3,
          childId: selectedChild?.id || null, // Send null instead of placeholder
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d', // Use valid admin UUID
          assets: cleanedAssets
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Letter Hunt video generation started successfully! 
        
🎬 Render ID: ${data.render_id}
📹 Output URL: ${data.output_url}
⏱️ Duration: ${data.duration_seconds} seconds
📦 Assets Ready: ${data.asset_summary.ready_assets}/${data.asset_summary.total_assets} (${data.asset_summary.completion_percentage}%)

Your video will be available for review in the admin dashboard once complete.`);
        
        // If this was called from an assignment, mark it as completed
        if (router.query.assignment_id) {
          try {
            const assignmentResponse = await fetch('/api/admin/manage-assignments', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assignment_id: router.query.assignment_id,
                status: 'completed',
                output_video_url: data.output_url,
                updated_by: 'current-user-id'
              })
            });

            if (assignmentResponse.ok) {
              console.log('✅ Assignment marked as completed');
            }
          } catch (assignmentError) {
            console.error('Error updating assignment:', assignmentError);
            // Don't fail the whole operation if assignment update fails
          }
        }

        // Stay on current page - no redirect
        console.log('✅ Video generation started successfully - staying on current page');
        
      } else {
        throw new Error(data.error || 'Failed to start video generation');
      }
      
    } catch (error) {
      console.error('Error submitting video:', error);
      alert(`❌ Failed to submit video generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle returning from prompt creation, audio generation, or video upload with generated asset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const generatedImageUrl = urlParams.get('generatedImageUrl');
    const generatedAudioUrl = urlParams.get('generatedAudioUrl');
    const generatedVideoUrl = urlParams.get('generatedVideoUrl');
    const assetKey = urlParams.get('assetKey');
    
    if ((generatedImageUrl || generatedAudioUrl || generatedVideoUrl) && assetKey && payload) {
      const assetUrl = generatedImageUrl || generatedAudioUrl || generatedVideoUrl;
      const assetType = generatedImageUrl ? 'image' : generatedAudioUrl ? 'audio' : 'video';
      
      console.log(`🎨 Received generated ${assetType} for ${assetKey}:`, assetUrl);
      
      // Update the asset status to ready with the generated asset URL
      setPayload(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          [assetKey]: {
            ...prev.assets[assetKey as keyof typeof prev.assets],
            status: 'ready',
            url: assetUrl,
            generatedAt: new Date().toISOString()
          }
        }
      } : null);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname + (window.location.search.replace(/[?&](generatedImageUrl|generatedAudioUrl|generatedVideoUrl|assetKey)=[^&]*/g, '').replace(/^&/, '?') || '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [payload, router.query]);

  return (
    <>
      <Head>
        <title>Letter Hunt - Create Video</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Letter Hunt Video Request
                {router.query.assignment_id && (
                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Assignment Mode
                  </span>
                )}
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
          videoType="letter-hunt"
          templateName="Letter Hunt"
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
                    setTargetLetter('');
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
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Target Letter:
                {childName && (
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 'normal', 
                    color: '#666',
                    marginLeft: 8
                  }}>
                    (auto-populated from first letter of name)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={targetLetter}
                onChange={(e) => setTargetLetter(e.target.value.toUpperCase().slice(0, 1))}
                placeholder="Enter target letter"
                maxLength={1}
                style={{ padding: 8, fontSize: 16, width: 60, borderRadius: 4, border: '1px solid #ddd' }}
              />
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
              style={{ 
                background: '#0066cc', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: 4, 
                fontSize: 16, 
                cursor: 'pointer' 
              }}
            >
              Initialize Letter Hunt
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#e8f5e8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <h2>Letter Hunt for {payload.childName} - Letter {payload.targetLetter}</h2>
              <p>Generate all required assets below, then submit for video creation.</p>
            </div>

            {/* Test Mode Notice */}
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 32 
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>
                🧪 Phase 3: 6-Part Video Render (Title + Letter + Search + Signs + Books + Grocery)
              </h3>
              <p style={{ margin: 0, color: '#856404' }}>
                Currently rendering 6-part videos: Title Card + Title Audio are required. 
                The render includes Parts 1-6 (Title, Letter + Theme, Search, Signs, Books, Grocery Store).
                Happy Dance segment is not included in current renders.
              </p>
            </div>

            {/* Letter Hunt Video Parts - Organized by Segments */}
            <div className="space-y-8">
              
              {/* Part 1: Title Card (3 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 1</span>
                  Title Card (0-3 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title Card Image */}
                  <div className="border border-gray-200 rounded-lg p-4" 
                       style={{ background: payload.assets.titleCard.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.titleCard.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.titleCard.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.titleCard.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.titleCard.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.titleCard.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.titleCard.description}</p>
                    
                    {payload.assets.titleCard.status === 'ready' && payload.assets.titleCard.url && (
                      <div className="mb-3">
                        <img 
                          src={payload.assets.titleCard.url} 
                          alt={payload.assets.titleCard.name}
                          className="w-full h-auto rounded border"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('titleCard')}
                      disabled={payload.assets.titleCard.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.titleCard.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.titleCard.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.titleCard.status === 'ready' ? 'Regenerate' :
                       payload.assets.titleCard.status === 'generating' ? 'Generating...' : 
                       'Generate Image'}
                    </button>
                  </div>
                  
                  {/* Title Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.titleAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.titleAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.titleAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.titleAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.titleAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.titleAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.titleAudio.description}</p>
                    
                    {payload.assets.titleAudio.status === 'ready' && payload.assets.titleAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.titleAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('titleAudio')}
                      disabled={payload.assets.titleAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.titleAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.titleAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.titleAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.titleAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 2: Letter + Theme (3-6 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 2</span>
                  Letter + Theme (3-6 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intro Video */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.introVideo.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.introVideo.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.introVideo.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.introVideo.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.introVideo.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.introVideo.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.introVideo.description}</p>
                    
                    {payload.assets.introVideo.status === 'ready' && payload.assets.introVideo.url && (
                      <div className="mb-3">
                        <video controls className="w-full h-auto rounded border">
                          <source src={payload.assets.introVideo.url} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('introVideo')}
                      disabled={payload.assets.introVideo.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.introVideo.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.introVideo.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.introVideo.status === 'ready' ? 'Regenerate' :
                       payload.assets.introVideo.status === 'generating' ? 'Generating...' : 
                       'Generate Video'}
                    </button>
                  </div>
                  
                  {/* Intro Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.introAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.introAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.introAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.introAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.introAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.introAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.introAudio.description}</p>
                    
                    {payload.assets.introAudio.status === 'ready' && payload.assets.introAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.introAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('introAudio')}
                      disabled={payload.assets.introAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.introAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.introAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.introAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.introAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 3: Search (6-9 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 3</span>
                  Search (6-9 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Intro2 Video (Search) */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.intro2Video.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.intro2Video.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.intro2Video.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.intro2Video.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.intro2Video.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.intro2Video.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.intro2Video.description}</p>
                    
                    {payload.assets.intro2Video.status === 'ready' && payload.assets.intro2Video.url && (
                      <div className="mb-3">
                        <video controls className="w-full h-auto rounded border">
                          <source src={payload.assets.intro2Video.url} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('intro2Video')}
                      disabled={payload.assets.intro2Video.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.intro2Video.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.intro2Video.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.intro2Video.status === 'ready' ? 'Regenerate' :
                       payload.assets.intro2Video.status === 'generating' ? 'Generating...' : 
                       'Generate Video'}
                    </button>
                  </div>
                  
                  {/* Intro2 Audio (Search) */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.intro2Audio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.intro2Audio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.intro2Audio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.intro2Audio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.intro2Audio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.intro2Audio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.intro2Audio.description}</p>
                    
                    {payload.assets.intro2Audio.status === 'ready' && payload.assets.intro2Audio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.intro2Audio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('intro2Audio')}
                      disabled={payload.assets.intro2Audio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.intro2Audio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.intro2Audio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.intro2Audio.status === 'ready' ? 'Regenerate' :
                       payload.assets.intro2Audio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 4: Letter Hunt - Signs (9-12 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 4</span>
                  Letter Hunt - Signs (9-12 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sign Image */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.signImage.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.signImage.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.signImage.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.signImage.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.signImage.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.signImage.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.signImage.description}</p>
                    
                    {payload.assets.signImage.status === 'ready' && payload.assets.signImage.url && (
                      <div className="mb-3">
                        <img 
                          src={payload.assets.signImage.url} 
                          alt={payload.assets.signImage.name}
                          className="w-full h-auto rounded border"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('signImage')}
                      disabled={payload.assets.signImage.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.signImage.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.signImage.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.signImage.status === 'ready' ? 'Regenerate' :
                       payload.assets.signImage.status === 'generating' ? 'Generating...' : 
                       'Generate Image'}
                    </button>
                  </div>
                  
                  {/* Sign Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.signAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.signAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.signAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.signAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.signAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.signAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.signAudio.description}</p>
                    
                    {payload.assets.signAudio.status === 'ready' && payload.assets.signAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.signAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('signAudio')}
                      disabled={payload.assets.signAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.signAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.signAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.signAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.signAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 5: Letter Hunt - Books (12-15 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-pink-100 text-pink-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 5</span>
                  Letter Hunt - Books (12-15 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Book Image */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.bookImage.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.bookImage.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.bookImage.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.bookImage.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.bookImage.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.bookImage.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.bookImage.description}</p>
                    
                    {payload.assets.bookImage.status === 'ready' && payload.assets.bookImage.url && (
                      <div className="mb-3">
                        <img 
                          src={payload.assets.bookImage.url} 
                          alt={payload.assets.bookImage.name}
                          className="w-full h-auto rounded border"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('bookImage')}
                      disabled={payload.assets.bookImage.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.bookImage.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.bookImage.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.bookImage.status === 'ready' ? 'Regenerate' :
                       payload.assets.bookImage.status === 'generating' ? 'Generating...' : 
                       'Generate Image'}
                    </button>
                  </div>
                  
                  {/* Book Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.bookAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.bookAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.bookAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.bookAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.bookAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.bookAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.bookAudio.description}</p>
                    
                    {payload.assets.bookAudio.status === 'ready' && payload.assets.bookAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.bookAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('bookAudio')}
                      disabled={payload.assets.bookAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.bookAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.bookAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.bookAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.bookAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 6: Letter Hunt - Grocery Store (15-18 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 6</span>
                  Letter Hunt - Grocery Store (15-18 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grocery Image */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.groceryImage.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.groceryImage.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.groceryImage.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.groceryImage.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.groceryImage.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.groceryImage.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.groceryImage.description}</p>
                    
                    {payload.assets.groceryImage.status === 'ready' && payload.assets.groceryImage.url && (
                      <div className="mb-3">
                        <img 
                          src={payload.assets.groceryImage.url} 
                          alt={payload.assets.groceryImage.name}
                          className="w-full h-auto rounded border"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('groceryImage')}
                      disabled={payload.assets.groceryImage.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.groceryImage.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.groceryImage.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.groceryImage.status === 'ready' ? 'Regenerate' :
                       payload.assets.groceryImage.status === 'generating' ? 'Generating...' : 
                       'Generate Image'}
                    </button>
                  </div>
                  
                  {/* Grocery Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.groceryAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.groceryAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.groceryAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.groceryAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.groceryAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.groceryAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.groceryAudio.description}</p>
                    
                    {payload.assets.groceryAudio.status === 'ready' && payload.assets.groceryAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.groceryAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('groceryAudio')}
                      disabled={payload.assets.groceryAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.groceryAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.groceryAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.groceryAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.groceryAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 7: Happy Dance (24-27 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 7</span>
                  Happy Dance (24-27 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Happy Dance Video */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.happyDanceVideo.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.happyDanceVideo.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.happyDanceVideo.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.happyDanceVideo.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.happyDanceVideo.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.happyDanceVideo.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.happyDanceVideo.description}</p>
                    
                    {payload.assets.happyDanceVideo.status === 'ready' && payload.assets.happyDanceVideo.url && (
                      <div className="mb-3">
                        <video controls className="w-full h-auto rounded border">
                          <source src={payload.assets.happyDanceVideo.url} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('happyDanceVideo')}
                      disabled={payload.assets.happyDanceVideo.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.happyDanceVideo.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.happyDanceVideo.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.happyDanceVideo.status === 'ready' ? 'Regenerate' :
                       payload.assets.happyDanceVideo.status === 'generating' ? 'Generating...' : 
                       'Generate Video'}
                    </button>
                  </div>
                  
                  {/* Happy Dance Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.happyDanceAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.happyDanceAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.happyDanceAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.happyDanceAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.happyDanceAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.happyDanceAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.happyDanceAudio.description}</p>
                    
                    {payload.assets.happyDanceAudio.status === 'ready' && payload.assets.happyDanceAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.happyDanceAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('happyDanceAudio')}
                      disabled={payload.assets.happyDanceAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.happyDanceAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.happyDanceAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.happyDanceAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.happyDanceAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 8: Ending (29-32 seconds) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">Part 8</span>
                  Ending (29-32 seconds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ending Video */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.endingVideo?.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.endingVideo?.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      Ending Video
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.endingVideo?.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.endingVideo?.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.endingVideo?.status || 'missing'}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">Letter-specific ending video showing the letter {targetLetter}</p>
                    
                    {payload.assets.endingVideo?.status === 'ready' && payload.assets.endingVideo?.url && (
                      <div className="mb-3">
                        <video controls className="w-full h-auto rounded border">
                          <source src={payload.assets.endingVideo.url} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('endingVideo')}
                      disabled={payload.assets.endingVideo?.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.endingVideo?.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.endingVideo?.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.endingVideo?.status === 'ready' ? 'Regenerate' :
                       payload.assets.endingVideo?.status === 'generating' ? 'Generating...' : 
                       'Generate Video'}
                    </button>
                  </div>
                  
                  {/* Ending Audio */}
                  <div className="border border-gray-200 rounded-lg p-4"
                       style={{ background: payload.assets.endingAudio.status === 'ready' ? '#f0f8f0' : 
                                           payload.assets.endingAudio.status === 'generating' ? '#fff8dc' : '#f9f9f9' }}>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.endingAudio.name}
                      <span className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded ${
                        payload.assets.endingAudio.status === 'ready' ? 'bg-green-100 text-green-800' :
                        payload.assets.endingAudio.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payload.assets.endingAudio.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.endingAudio.description}</p>
                    
                    {payload.assets.endingAudio.status === 'ready' && payload.assets.endingAudio.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.endingAudio.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateAsset('endingAudio')}
                      disabled={payload.assets.endingAudio.status === 'generating'}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        payload.assets.endingAudio.status === 'ready' ? 'bg-green-600 text-white' :
                        payload.assets.endingAudio.status === 'generating' ? 'bg-yellow-500 text-white cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {payload.assets.endingAudio.status === 'ready' ? 'Regenerate' :
                       payload.assets.endingAudio.status === 'generating' ? 'Generating...' : 
                       'Generate Audio'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Background Music - Global Asset */}
              <div className="bg-gray-50 rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">🎵</span>
                  Background Music (0-24 seconds - Throughout Video)
                </h3>
                <div className="max-w-md">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      {payload.assets.backgroundMusic.name}
                      <span className="ml-2 text-xs font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">
                        {payload.assets.backgroundMusic.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{payload.assets.backgroundMusic.description}</p>
                    
                    {payload.assets.backgroundMusic.status === 'ready' && payload.assets.backgroundMusic.url && (
                      <div className="mb-3">
                        <audio controls className="w-full">
                          <source src={payload.assets.backgroundMusic.url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      ✅ Background music is automatically included in all Letter Hunt videos
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20, marginTop: 32 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 'bold' }}>
                  🚧 Additional Parts (Coming Soon)
                </h3>
                <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    Parts 3-8 include letter searching segments (signs, books, grocery store), happy dance, and ending.
                    Asset generation for these parts will be available soon.
                  </p>
                </div>
              </div>
            </div>

            {/* Remaining assets in old format for now */}
            <div style={{ display: 'none' }}>
              {Object.entries(payload.assets).map(([key, asset]) => (
                <div
                  key={key}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                    background: asset.status === 'ready' ? '#f0f8f0' : 
                               asset.status === 'generating' ? '#fff8dc' : '#f9f9f9'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                    {asset.name}
                    <span style={{ 
                      marginLeft: 8, 
                      fontSize: 12, 
                      color: asset.status === 'ready' ? 'green' : 
                             asset.status === 'generating' ? 'orange' : 'red',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {asset.status}
                    </span>
                  </h3>
                  
                  <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>
                    {asset.description}
                  </p>
                  
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    Type: {asset.type}
                  </div>

                  {asset.status === 'ready' && asset.url && (
                    <div style={{ marginBottom: 12 }}>
                      {asset.type === 'image' && (
                        <img 
                          src={asset.url} 
                          alt={asset.name}
                          style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
                        />
                      )}
                      {asset.type === 'audio' && (
                        <audio controls style={{ width: '100%' }}>
                          <source src={asset.url} type="audio/mpeg" />
                        </audio>
                      )}
                      {asset.type === 'video' && (
                        <video controls style={{ maxWidth: '100%', height: 'auto' }}>
                          <source src={asset.url} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      generateAsset(key as keyof LetterHuntPayload['assets']);
                    }}
                    disabled={asset.status === 'generating'}
                    type="button"
                    style={{
                      background: asset.status === 'ready' ? '#28a745' :
                                 asset.status === 'generating' ? '#ffc107' : '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: asset.status === 'generating' ? 'not-allowed' : 'pointer',
                      fontSize: 14
                    }}
                  >
                    {asset.status === 'ready' ? 'Regenerate' :
                     asset.status === 'generating' ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              ))}
            </div>

            {/* JSON Payload Preview */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">JSON Payload Preview:</h4>
              
              {/* Asset Status Summary */}
              <div className="mb-3 p-2 bg-white border border-blue-300 rounded text-sm">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title Card:</span>
                    <span className={payload.assets.titleCard.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}>
                      {payload.assets.titleCard.status === 'ready' ? '✅ Ready' : '⚠️ Not ready'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title Audio:</span>
                    <span className={payload.assets.titleAudio.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}>
                      {payload.assets.titleAudio.status === 'ready' ? '✅ Ready' : '⚠️ Not ready'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets:</span>
                    <span className="font-medium">
                      {Object.values(payload.assets).filter(asset => asset.status === 'ready').length}/16 ready
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON Preview */}
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
{JSON.stringify({
  childName: payload.childName,
  targetLetter: payload.targetLetter,
  childTheme: selectedChild?.primary_interest || 'monsters',
  childAge: selectedChild?.age || 3,
  childId: selectedChild?.id || 'test-child',
  submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d',
  assets: Object.fromEntries(
    Object.entries(payload.assets).map(([key, asset]) => [
      key,
      {
        url: asset.url || '',
        status: asset.status
      }
    ])
  )
}, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <button
                onClick={submitForVideoGeneration}
                disabled={!canSubmitVideo() || loading}
                style={{
                  background: canSubmitVideo() ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: 8,
                  fontSize: 18,
                  cursor: canSubmitVideo() ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? 'Submitting...' : 
                 canSubmitVideo() ? 'Generate Letter Hunt Video!' : 
                 'Generate Title Card + Title Audio to Enable Video Generation'}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
