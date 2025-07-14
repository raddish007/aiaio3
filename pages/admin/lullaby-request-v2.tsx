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
  generatedAt?: string;
}

interface LullabyAssets {
  // Core Music Asset
  backgroundMusic: AssetStatus;
  
  // Visual Assets
  introImage: AssetStatus;
  outroImage: AssetStatus;
  bedtimeImages: AssetStatus[]; // Array of bedtime scene images
  
  // Audio Assets
  introAudio: AssetStatus;  // "Bedtime for [NAME]"
  outroAudio: AssetStatus;  // "Goodnight, [NAME]"
}

interface LullabyPayload {
  childName: string;
  childAge: number;
  childTheme: string;
  assets: LullabyAssets;
  asset_summary: {
    total_assets: number;
    ready_assets: number;
    completion_percentage: number;
  };
}

// Asset definitions with their specific purposes
const LULLABY_ASSET_DEFINITIONS = {
  backgroundMusic: {
    type: 'music' as const,
    name: 'Background Music',
    description: 'Soothing lullaby background music (DreamDrip)',
    asset_class: 'lullaby_music'
  },
  introImage: {
    type: 'image' as const,
    name: 'Intro Image',
    description: 'Peaceful nighttime intro scene for bedtime video',
    asset_class: 'bedtime_intro'
  },
  outroImage: {
    type: 'image' as const,
    name: 'Outro Image', 
    description: 'Serene goodnight scene for bedtime conclusion',
    asset_class: 'bedtime_outro'
  },
  introAudio: {
    type: 'audio' as const,
    name: 'Intro Audio',
    description: 'Personalized "Bedtime for [NAME]" greeting',
    asset_class: 'bedtime_greeting'
  },
  outroAudio: {
    type: 'audio' as const,
    name: 'Outro Audio',
    description: 'Personalized "Goodnight, [NAME]" message',
    asset_class: 'goodnight_message'
  }
};

const BEDTIME_IMAGES_TARGET = 23; // Target number of bedtime scene images (matches template requirements)

export default function LullabyRequestV2() {
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [payload, setPayload] = useState<LullabyPayload | null>(null);
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
      
      // Update the asset status to ready with the generated asset URL
      setPayload(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          [assetKey]: {
            ...prev.assets[assetKey as keyof LullabyAssets],
            status: 'ready',
            url: assetUrl || '',
            generatedAt: new Date().toISOString()
          }
        }
      } : null);
      
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
      console.log(`🌙 Initializing Lullaby payload for ${nameToUse} (theme: ${themeToUse})`);

      // Fetch all relevant assets for this child and theme
      const [
        specificAssets,
        bedtimeImages, 
        backgroundMusicAsset,
        themeImages,
        oldStyleThemeImages,
        oldStyleSlideshowImages
      ] = await Promise.all([
        // Child-specific assets
        supabase
          .from('assets')
          .select('*')
          .eq('status', 'approved')
          .eq('metadata->>template', 'lullaby')
          .eq('metadata->>child_name', nameToUse),
        
        // Bedtime scene images for theme (lullaby template only)
        supabase
          .from('assets')
          .select('*')
          .eq('status', 'approved')
          .eq('type', 'image')
          .eq('metadata->>template', 'lullaby')
          .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
          .or(`metadata->>child_theme.eq.${themeToUse},theme.ilike.%${themeToUse}%`),
        
        // Background music (DreamDrip asset)
        supabase
          .from('assets')
          .select('*')
          .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
          .single(),
        
        // Theme-specific intro/outro images (new asset_class system and fallback to imageType)
        supabase
          .from('assets')
          .select('*')
          .eq('status', 'approved')
          .eq('type', 'image')
          .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`)
          .eq('metadata->>template', 'lullaby')
          .or(`metadata->>child_theme.eq.${themeToUse},theme.ilike.%${themeToUse}%`),
        
        // No fallback queries - only use proper lullaby template assets
        supabase
          .from('assets')
          .select('*')
          .limit(0), // Empty query since we don't use fallbacks
        
        // No fallback queries - only use proper lullaby template assets
        supabase
          .from('assets')
          .select('*')
          .limit(0) // Empty query since we don't use fallbacks
      ]);

      console.log('🔍 Asset fetch results:', {
        specificAssets: specificAssets.data?.length || 0,
        bedtimeImages: bedtimeImages.data?.length || 0,
        backgroundMusic: backgroundMusicAsset.data ? 'found' : 'missing',
        themeImages: themeImages.data?.length || 0,
        oldStyleThemeImages: 'N/A (no fallbacks)',
        oldStyleSlideshowImages: 'N/A (no fallbacks)'
      });

      // Initialize asset status objects
      const assets: LullabyAssets = {
        backgroundMusic: {
          type: 'music',
          name: 'Background Music',
          description: 'Soothing lullaby background music (DreamDrip)',
          status: backgroundMusicAsset.data ? 'ready' : 'missing',
          url: backgroundMusicAsset.data?.file_url || '',
          generatedAt: backgroundMusicAsset.data?.created_at
        },
        introImage: {
          type: 'image',
          name: 'Intro Image',
          description: `Peaceful ${themeToUse}-themed nighttime intro scene`,
          status: 'missing',
          url: '',
        },
        outroImage: {
          type: 'image',
          name: 'Outro Image', 
          description: `Serene ${themeToUse}-themed goodnight scene`,
          status: 'missing', 
          url: '',
        },
        bedtimeImages: [],
        introAudio: {
          type: 'audio',
          name: 'Intro Audio',
          description: `Personalized "Bedtime for ${nameToUse}" greeting`,
          status: 'missing',
          url: '',
        },
        outroAudio: {
          type: 'audio',
          name: 'Outro Audio',
          description: `Personalized "Goodnight, ${nameToUse}" message`,
          status: 'missing',
          url: '',
        }
      };

      // Map specific assets to payload
      if (specificAssets.data) {
        console.log('🔍 Processing specific assets:', specificAssets.data.length);
        specificAssets.data.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
          
          console.log(`🎯 Asset ${asset.id.slice(-8)}: type=${asset.type}, class=${assetClass}, script="${asset.metadata?.script || 'N/A'}"`);
          
          switch (assetClass) {
            case 'bedtime_greeting':
              console.log('  → Assigning to introAudio');
              assets.introAudio = {
                ...assets.introAudio,
                status: 'ready',
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
            case 'goodnight_message':
              console.log('  → Assigning to outroAudio');
              assets.outroAudio = {
                ...assets.outroAudio,
                status: 'ready',
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
            case 'bedtime_intro':
              console.log('  → Assigning to introImage');
              assets.introImage = {
                ...assets.introImage,
                status: 'ready',
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
            case 'bedtime_outro':
              assets.outroImage = {
                ...assets.outroImage,
                status: 'ready',
                url: asset.file_url || '',
                generatedAt: asset.created_at
              };
              break;
          }
        });
        
        // Log final audio asset status
        console.log('🎵 Final audio asset status:');
        console.log(`  Intro Audio: ${assets.introAudio.status} | URL: ${assets.introAudio.url ? 'Present' : 'Missing'}`);
        console.log(`  Outro Audio: ${assets.outroAudio.status} | URL: ${assets.outroAudio.url ? 'Present' : 'Missing'}`);
        console.log(`  Same URL: ${assets.introAudio.url === assets.outroAudio.url ? 'YES ⚠️' : 'NO ✅'}`);
      }

      // Process bedtime scene images
      if (bedtimeImages.data) {
        assets.bedtimeImages = bedtimeImages.data.map(asset => ({
          type: 'image' as const,
          name: `Bedtime Scene ${asset.id.slice(-4)}`,
          description: 'Soothing bedtime imagery',
          status: 'ready',
          url: asset.file_url || '',
          generatedAt: asset.created_at
        }));
      }

      // No fallbacks - only use proper lullaby slideshow images
      console.log(`📊 Bedtime images found: ${assets.bedtimeImages.length}/${BEDTIME_IMAGES_TARGET} (no fallbacks used)`);

      // Add fallback intro/outro images if needed
      if (assets.introImage.status === 'missing' && themeImages.data) {
        const introAsset = themeImages.data.find(a => 
          (a.metadata?.asset_class === 'bedtime_intro' || a.metadata?.imageType === 'bedtime_intro') &&
          (a.metadata?.child_theme === themeToUse || a.theme?.toLowerCase().includes(themeToUse.toLowerCase()))
        );
        if (introAsset) {
          console.log(`🎯 Found theme-matched intro image: ${introAsset.id.slice(-8)} (theme: ${introAsset.theme})`);
          assets.introImage = {
            ...assets.introImage,
            status: 'ready',
            url: introAsset.file_url || '',
            generatedAt: introAsset.created_at
          };
        }
      }

      // No fallbacks for intro images - only use proper lullaby intro images

      if (assets.outroImage.status === 'missing' && themeImages.data) {
        const outroAsset = themeImages.data.find(a => 
          (a.metadata?.asset_class === 'bedtime_outro' || a.metadata?.imageType === 'bedtime_outro') &&
          (a.metadata?.child_theme === themeToUse || a.theme?.toLowerCase().includes(themeToUse.toLowerCase()))
        );
        if (outroAsset) {
          console.log(`🎯 Found theme-matched outro image: ${outroAsset.id.slice(-8)} (theme: ${outroAsset.theme})`);
          assets.outroImage = {
            ...assets.outroImage,
            status: 'ready',
            url: outroAsset.file_url || '',
            generatedAt: outroAsset.created_at
          };
        }
      }

      // No fallbacks for outro images - only use proper lullaby outro images

      // Calculate asset summary
      const baseAssets = 5; // backgroundMusic, introImage, outroImage, introAudio, outroAudio
      const totalBedtimeImages = Math.max(assets.bedtimeImages.length, BEDTIME_IMAGES_TARGET);
      const totalAssets = baseAssets + totalBedtimeImages;
      
      const readyBaseAssets = [
        assets.backgroundMusic,
        assets.introImage, 
        assets.outroImage,
        assets.introAudio,
        assets.outroAudio
      ].filter(asset => asset.status === 'ready').length;
      
      const readyBedtimeImages = assets.bedtimeImages.filter(img => img.status === 'ready').length;
      const readyAssets = readyBaseAssets + readyBedtimeImages;

      const newPayload: LullabyPayload = {
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
      console.log('🌙 Initialized Lullaby payload:', newPayload);

    } catch (error) {
      console.error('Error initializing payload:', error);
    } finally {
      setLoading(false);
    }
  };

  // Individual asset generation functions (paralleling LetterHunt)
  const generateAsset = async (assetKey: keyof LullabyAssets) => {
    if (!payload) {
      console.error('No payload available for asset generation');
      return;
    }

    if (assetKey === 'bedtimeImages') {
      console.error('bedtimeImages is an array, use generateBedtimeImage instead');
      return;
    }

    const asset = payload.assets[assetKey] as AssetStatus;
    console.log(`🎯 Generating asset: ${assetKey}`, { asset, payload });

    try {
      // Handle image generation 
      if (asset.type === 'image') {
        let assetClass = '';
        let safeZone = '';
        
        if (assetKey === 'introImage') {
          assetClass = 'bedtime_intro';
          safeZone = 'frame'; // Frame composition with center area empty for title text
        } else if (assetKey === 'outroImage') {
          assetClass = 'bedtime_outro';
          safeZone = 'outro_safe'; // Closing frame with decorative border
        }

        const promptParams = new URLSearchParams({
          templateType: 'lullaby',
          childName: payload.childName,
          childTheme: payload.childTheme,
          assetClass: assetClass,
          safeZone: safeZone,
          artStyle: '2D Pixar Style',
          ageRange: '3-5',
          aspectRatio: '16:9',
          personalization: 'themed',
          assetKey: assetKey
        });
        
        console.log(`🎨 Redirecting to prompt generator for ${asset.name} with safe zone: ${safeZone}...`);
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
            script = `Bedtime for ${childName}`;
            assetClass = 'bedtime_greeting';
            break;
          case 'outroAudio':
            script = `Goodnight, ${childName}.`;
            assetClass = 'goodnight_message';
            break;
          default:
            throw new Error(`Unknown audio asset: ${assetKey}`);
        }

        const audioParams = new URLSearchParams({
          templateType: 'lullaby',
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

  const generateBedtimeImage = async () => {
    if (!payload) return;

    const promptParams = new URLSearchParams({
      templateType: 'lullaby',
      childTheme: payload.childTheme,
      assetClass: 'bedtime_scene',
      artStyle: '2D Pixar Style',
      ageRange: '3-5',
      aspectRatio: '16:9',
      personalization: 'themed',
      assetKey: 'bedtimeImages'
    });
    
    console.log(`🎨 Redirecting to prompt generator for bedtime scene image...`);
    await router.push(`/admin/prompt-generator?${promptParams.toString()}`);
  };

  const canGenerateVideo = () => {
    if (!payload) return false;
    
    // For manual name input without selectedChild, create a minimal check
    const hasChildInfo = selectedChild || childName;
    
    // Require minimum assets for generation
    return hasChildInfo &&
           payload.assets.backgroundMusic.status === 'ready' && 
           payload.assets.introAudio.status === 'ready' &&
           payload.asset_summary.completion_percentage >= 60; // At least 60% complete
  };

  const generateVideo = async () => {
    if (!payload) return;

    // Handle case where we have manual name input but no selectedChild
    const childIdToUse = selectedChild?.id || 'manual-input';

    setGenerating(true);
    try {
      // Convert our asset structure to the format expected by the current Lullaby template
      // The API expects: backgroundMusicUrl, introImageUrl, outroImageUrl, slideshowImageUrls, introAudioUrl, outroAudioUrl
      const requestPayload = {
        childName: payload.childName,
        childAge: payload.childAge,
        childTheme: payload.childTheme,
        childId: childIdToUse,
        backgroundMusicUrl: payload.assets.backgroundMusic.url,
        introImageUrl: payload.assets.introImage.url || '', 
        outroImageUrl: payload.assets.outroImage.url || '',
        slideshowImageUrls: payload.assets.bedtimeImages
          .filter(img => img.status === 'ready')
          .map(img => img.url)
          .filter(url => url), // Remove empty URLs
        introAudioUrl: payload.assets.introAudio.url || '',
        outroAudioUrl: payload.assets.outroAudio.url || '',
        submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d' // Default admin user UUID
      };

      console.log('🚀 Generating Lullaby video with payload:', requestPayload);

      const response = await fetch('/api/videos/generate-lullaby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Lullaby video generation started successfully!\n\nJob ID: ${result.job_id}\nRender ID: ${result.render_id}\nOutput URL: ${result.output_url}`);
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

  return (
    <>
      <Head>
        <title>Lullaby Video Request v2 - Admin Panel</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🌙 Lullaby Video Request v2
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
            videoType="lullaby"
            templateName="Lullaby"
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
                {loading ? 'Loading Assets...' : 'Create Lullaby Payload'}
              </button>
            </div>
          ) : (
            <>
              {/* Payload Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Lullaby Payload for {payload.childName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Child Name</div>
                    <div className="text-lg font-bold text-blue-700">{payload.childName}</div>
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
              </div>

              {/* Individual Assets */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Individual Assets</h2>
                
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

                  {/* Intro Audio */}
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

              {/* Bedtime Images Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Bedtime Scene Images ({payload.assets.bedtimeImages.filter(img => img.status === 'ready').length}/{BEDTIME_IMAGES_TARGET} ready)
                  </h3>
                  <button
                    onClick={generateBedtimeImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Generate Bedtime Image
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {payload.assets.bedtimeImages.slice(0, BEDTIME_IMAGES_TARGET).map((img, index) => (
                    <div key={index} className={`p-2 rounded border-2 ${
                      img.status === 'ready' ? 'border-green-200 bg-green-50' :
                      img.status === 'generating' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      {img.url ? (
                        <img src={img.url} alt={`Bedtime ${index + 1}`} className="w-full h-16 object-cover rounded" />
                      ) : (
                        <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center text-xs">
                          No Image
                        </div>
                      )}
                      <p className="text-xs mt-1 text-center">{img.status.toUpperCase()}</p>
                    </div>
                  ))}
                  
                  {/* Show placeholder slots for missing images */}
                  {Array.from({ length: Math.max(0, BEDTIME_IMAGES_TARGET - payload.assets.bedtimeImages.length) }).map((_, index) => (
                    <div key={`placeholder-${index}`} className="p-2 rounded border-2 border-gray-200 bg-gray-50">
                      <div className="w-full h-16 bg-gray-300 rounded flex items-center justify-center text-xs">
                        Missing
                      </div>
                      <p className="text-xs mt-1 text-center text-gray-500">NEEDED</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payload JSON Display */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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

              {/* Video Generation Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Generate Video</h3>
                
                <button
                  onClick={generateVideo}
                  disabled={!canGenerateVideo() || generating}
                  className={`px-6 py-3 rounded-lg font-medium text-lg ${
                    canGenerateVideo() 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {generating ? 'Generating Video...' : 'Generate Lullaby Video'}
                </button>

                {!canGenerateVideo() && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">
                      <strong>Generation Requirements:</strong>
                      <br />• Background music must be ready
                      <br />• Intro audio must be ready  
                      <br />• At least 60% of assets must be complete
                      <br />• Current completion: {payload.asset_summary.completion_percentage}%
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
