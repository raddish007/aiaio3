import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_id: string;
}

export default function LullabyVideoRequest() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dreamDripDuration, setDreamDripDuration] = useState<number | null>(null);
  const [jobInfo, setJobInfo] = useState<{
    job_id: string;
    render_id: string;
    output_url: string;
    job_tracking_url: string;
  } | null>(null);
  const [themeAssets, setThemeAssets] = useState<{
    introImage?: { id: string; file_url: string; theme: string; safe_zone: string };
    outroImage?: { id: string; file_url: string; theme: string; safe_zone: string };
    slideshowImages?: { id: string; file_url: string; theme: string; safe_zone: string }[];
    introAudio?: { id: string; file_url: string; theme: string };
    outroAudio?: { id: string; file_url: string; theme: string };
  } | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Helper function to get theme emoji
  const getThemeEmoji = (theme: string) => {
    const themeEmojis: { [key: string]: string } = {
      'halloween': '🎃',
      'space': '🚀',
      'animals': '🐾',
      'vehicles': '🚗',
      'dinosaurs': '🦕',
      'princesses': '👑',
      'superheroes': '🦸‍♂️',
      'nature': '🌿',
      'jungle': '🦁',
      'ocean': '🐠',
      'farm': '🐄',
      'construction': '🏗️',
      'music': '🎵',
      'sports': '⚽',
      'food': '🍕',
      'default': '🌟'
    };
    return themeEmojis[theme.toLowerCase()] || themeEmojis['default'];
  };

  // Fetch theme-matching assets for the selected child
  const fetchThemeAssets = async (childTheme: string, child: Child) => {
    setAssetLoading(true);
    setAssetError(null);
    setThemeAssets(null);

    try {
      console.log(`🔍 Fetching assets for theme: ${childTheme} for child: ${child.name}`);

      // Query for all approved images with matching theme
      const { data: allImages, error: imagesError } = await supabase
        .from('assets')
        .select('id, file_url, theme, safe_zone, tags, metadata')
        .eq('type', 'image')
        .eq('status', 'approved')
        .ilike('theme', `%${childTheme}%`)
        .limit(50); // Increased limit to get more images for slideshow selection

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        throw new Error('Failed to fetch images');
      }

      console.log('Found all images:', allImages);

      // Filter images based on metadata.review.safe_zone array
      const availableImages = allImages || [];
      
      // Filter for intro and outro images based on metadata (no center_safe for lullaby videos)
      const introImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('intro_safe');
      });

      const outroImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('outro_safe');
      });

      // Filter for slideshow images - use all_ok safe zone for lullaby template
      const slideshowImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        
        // Debug logging for first few images to understand safe zone format
        if (availableImages.indexOf(img) < 3) {
          console.log('🔍 Safe zone debug for image:', {
            id: img.id,
            theme: img.theme,
            safeZones: safeZones,
            safeZonesType: typeof safeZones,
            isArray: Array.isArray(safeZones),
            hasAllOk: safeZones.includes('all_ok'),
            safeZonesString: JSON.stringify(safeZones)
          });
        }
        
        // Handle different safe zone formats
        if (Array.isArray(safeZones)) {
          return safeZones.includes('all_ok');
        } else if (typeof safeZones === 'string') {
          return safeZones.includes('all_ok');
        } else if (safeZones && typeof safeZones === 'object') {
          // Handle case where safe_zone might be an object
          return JSON.stringify(safeZones).includes('all_ok');
        }
        
        return false;
      });

      // Select different assets for intro and outro when possible
      let introImage = introImages[0];
      let outroImage = outroImages[0];

      // If we have the same asset for both, try to find a different one for outro
      if (introImage && outroImage && introImage.id === introImage.id) {
        // Look for a different asset that's safe for outro
        const differentOutroImage = outroImages.find(img => img.id !== introImage.id);
        if (differentOutroImage) {
          outroImage = differentOutroImage;
        }
      }

      // Select slideshow images (limit to 23 to match template requirements)
      // Randomize the order for variety
      const shuffledSlideshowImages = [...slideshowImages].sort(() => Math.random() - 0.5);
      const selectedSlideshowImages = shuffledSlideshowImages.slice(0, 23);

      // Fetch personalized audio files for the child
      console.log(`🎵 Fetching personalized audio for child: ${child.name}, theme: ${childTheme}`);
      
      // First, get all approved audio files to see what's available
      const { data: allAudioFiles, error: allAudioError } = await supabase
        .from('assets')
        .select('id, file_url, theme, tags, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .limit(20);

      if (allAudioError) {
        console.error('Error fetching all audio files:', allAudioError);
      }

      console.log('All available audio files:', allAudioFiles);

      // Filter for personalized audio based on child name
      let personalizedIntroAudio = null;
      let personalizedOutroAudio = null;

      if (allAudioFiles && allAudioFiles.length > 0) {
        // Look for audio files that might be personalized for this child
        const childNameLower = child.name.toLowerCase();
        
                 // Check for exact name matches in metadata and audio_class
         personalizedIntroAudio = allAudioFiles.find((audio: any) => {
           const metadata = audio.metadata || {};
           const hasChildName = metadata.child_name?.toLowerCase() === childNameLower;
           const isIntro = metadata.audio_class === 'intro_audio';
           return hasChildName && isIntro;
         });

         personalizedOutroAudio = allAudioFiles.find((audio: any) => {
           const metadata = audio.metadata || {};
           const hasChildName = metadata.child_name?.toLowerCase() === childNameLower;
           const isOutro = metadata.audio_class === 'outro_audio';
           return hasChildName && isOutro;
         });

        console.log('Personalized audio search results:', {
          childName: childNameLower,
          introAudio: personalizedIntroAudio,
          outroAudio: personalizedOutroAudio
        });
      }

      // Only use Nolan's audio if the child is actually Nolan
      let nolanIntroAudio = null;
      let nolanOutroAudio = null;
      
      if (child.name.toLowerCase() === 'nolan') {
        const { data: nolanIntro, error: nolanIntroError } = await supabase
          .from('assets')
          .select('id, file_url, theme, tags, metadata')
          .eq('id', '89f7a13a-b9bd-4e5e-88dc-547c685fb40d') // Nolan intro
          .eq('type', 'audio')
          .eq('status', 'approved')
          .single();

        const { data: nolanOutro, error: nolanOutroError } = await supabase
          .from('assets')
          .select('id, file_url, theme, tags, metadata')
          .eq('id', 'b17f4202-7238-430e-aa4b-7ca4b433f53f') // Nolan outro
          .eq('type', 'audio')
          .eq('status', 'approved')
          .single();

        nolanIntroAudio = nolanIntro;
        nolanOutroAudio = nolanOutro;

        if (nolanIntroError) {
          console.error('Error fetching Nolan intro audio:', nolanIntroError);
        }
        if (nolanOutroError) {
          console.error('Error fetching Nolan outro audio:', nolanOutroError);
        }
      }

      if (allAudioError) {
        console.error('Error fetching all audio files:', allAudioError);
      }

      // Also query for theme-based audio files as fallback
      const { data: themeAudioFiles, error: themeAudioError } = await supabase
        .from('assets')
        .select('id, file_url, theme, tags, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .ilike('theme', `%${childTheme}%`)
        .limit(10);

      if (themeAudioError) {
        console.error('Error fetching theme audio files:', themeAudioError);
      }

      console.log('Found audio files:', {
        childName: child.name,
        allAudioCount: allAudioFiles?.length || 0,
        personalizedIntro: personalizedIntroAudio,
        personalizedOutro: personalizedOutroAudio,
        nolanIntro: nolanIntroAudio,
        nolanOutro: nolanOutroAudio,
        themeAudio: themeAudioFiles
      });

      // Find intro and outro audio files
      // Priority: 1. Personalized audio for the specific child, 2. Nolan's audio (if child is Nolan), 3. Theme-based audio
      let introAudio: any = null;
      let outroAudio: any = null;

      // First, try personalized audio
      if (personalizedIntroAudio) {
        introAudio = personalizedIntroAudio;
      } else if (nolanIntroAudio && child.name.toLowerCase() === 'nolan') {
        // Only use Nolan's audio if the child is actually Nolan
        introAudio = nolanIntroAudio;
      }

      if (personalizedOutroAudio) {
        outroAudio = personalizedOutroAudio;
      } else if (nolanOutroAudio && child.name.toLowerCase() === 'nolan') {
        // Only use Nolan's audio if the child is actually Nolan
        outroAudio = nolanOutroAudio;
      }

      // If we still don't have personalized audio, don't fall back to theme-based audio
      // This ensures we only use audio that's specifically for the child

      // Filter safe zones to only show intro_safe and outro_safe for lullaby videos
      const getLullabySafeZones = (safeZones: string[]) => {
        return safeZones.filter(zone => zone === 'intro_safe' || zone === 'outro_safe');
      };

      console.log('Filtered assets:', {
        totalImages: availableImages.length,
        introImages: introImages.length,
        outroImages: outroImages.length,
        slideshowImages: slideshowImages.length,
        selectedSlideshowImages: selectedSlideshowImages.length,
        audioFiles: (themeAudioFiles?.length || 0) + (nolanIntroAudio ? 1 : 0) + (nolanOutroAudio ? 1 : 0),
        slideshowSelection: {
          available: slideshowImages.length,
          selected: selectedSlideshowImages.length,
          randomized: true,
          templateRequirement: 23
        },
        themeSearch: childTheme,
        sampleSlideshowImages: slideshowImages.slice(0, 3).map(img => ({
          id: img.id,
          theme: img.theme,
          safeZones: img.metadata?.review?.safe_zone
        })),
        introImage: introImage ? { 
          id: introImage.id, 
          theme: introImage.theme, 
          safe_zone: getLullabySafeZones(introImage.metadata?.review?.safe_zone || [])
        } : null,
        outroImage: outroImage ? { 
          id: outroImage.id, 
          theme: outroImage.theme, 
          safe_zone: getLullabySafeZones(outroImage.metadata?.review?.safe_zone || [])
        } : null,
        introAudio: introAudio ? {
          id: introAudio.id,
          theme: introAudio.theme,
          file_url: introAudio.file_url
        } : null,
        outroAudio: outroAudio ? {
          id: outroAudio.id,
          theme: outroAudio.theme,
          file_url: outroAudio.file_url
        } : null
      });

      setThemeAssets({
        introImage: introImage ? {
          id: introImage.id,
          file_url: introImage.file_url,
          theme: introImage.theme,
          safe_zone: introImage.metadata?.review?.safe_zone
        } : undefined,
        outroImage: outroImage ? {
          id: outroImage.id,
          file_url: outroImage.file_url,
          theme: outroImage.theme,
          safe_zone: outroImage.metadata?.review?.safe_zone
        } : undefined,
        slideshowImages: selectedSlideshowImages.length > 0 ? selectedSlideshowImages.map(img => ({
          id: img.id,
          file_url: img.file_url,
          theme: img.theme,
          safe_zone: img.metadata?.review?.safe_zone
        })) : undefined,
        introAudio: introAudio ? {
          id: introAudio.id,
          file_url: introAudio.file_url,
          theme: introAudio.theme
        } : undefined,
        outroAudio: outroAudio ? {
          id: outroAudio.id,
          file_url: outroAudio.file_url,
          theme: outroAudio.theme
        } : undefined
      });

      // Show warnings if assets are missing
      let warnings = [];
      
      if (!introImage && !outroImage && selectedSlideshowImages.length === 0) {
        warnings.push(`No approved images found for theme "${childTheme}" with any safe zones.`);
      } else {
        if (!introImage) {
          warnings.push(`No intro images found for theme "${childTheme}". Will use fallback.`);
        }
        if (!outroImage) {
          warnings.push(`No outro images found for theme "${childTheme}". Will use fallback.`);
        }
        if (selectedSlideshowImages.length === 0) {
          warnings.push(`No slideshow images found for theme "${childTheme}". Will use fallback.`);
        } else if (selectedSlideshowImages.length < 23) {
          warnings.push(`Only ${selectedSlideshowImages.length} slideshow images found for theme "${childTheme}" (need 23 for full slideshow). Images will repeat to fill duration.`);
        }
      }
      
      // Audio requirements - personalized audio is mandatory
      if (!introAudio) {
        warnings.push(`❌ No personalized intro audio found for "${child.name}". Personalized intro audio is required.`);
      }
      if (!outroAudio) {
        warnings.push(`❌ No personalized outro audio found for "${child.name}". Personalized outro audio is required.`);
      }
      
      if (warnings.length > 0) {
        setAssetError(warnings.join(' '));
      }

    } catch (error) {
      console.error('Error fetching theme assets:', error);
      setAssetError(error instanceof Error ? error.message : 'Failed to fetch theme assets');
    } finally {
      setAssetLoading(false);
    }
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setJobInfo(null);
    setError(null);
    setSuccess(null);
    
    // Fetch theme-matching assets for this child
    fetchThemeAssets(child.primary_interest, child);
  };

  useEffect(() => {
    checkAdminAccess();
    fetchChildren();
    fetchDreamDripDuration();
  }, []);

  const fetchDreamDripDuration = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('metadata')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single();

      if (error) throw error;
      if (data?.metadata?.duration) {
        setDreamDripDuration(data.metadata.duration);
      }
    } catch (error) {
      console.error('Error fetching DreamDrip duration:', error);
      setError('Failed to load DreamDrip duration');
    }
  };

  const checkAdminAccess = async () => {
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
      setError('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const submitLullabyVideo = async () => {
    if (!selectedChild) return;
    if (assetError) {
      setError('Cannot submit video: Missing required personalized audio files.');
      return;
    }

    setSubmittingVideo(true);
    setError(null);
    setSuccess(null);
    setJobInfo(null);

    try {
      // Submit video generation job to Lambda with new Lullaby template
      const response = await fetch('/api/videos/generate-lullaby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: selectedChild.name,
          childAge: selectedChild.age,
          childTheme: selectedChild.primary_interest,
          childId: selectedChild.id,
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d', // Use a valid UUID from the database
          introImageUrl: themeAssets?.introImage?.file_url,
          outroImageUrl: themeAssets?.outroImage?.file_url,
          slideshowImageUrls: themeAssets?.slideshowImages?.map(img => img.file_url) || [],
          introAudioUrl: themeAssets?.introAudio?.file_url,
          outroAudioUrl: themeAssets?.outroAudio?.file_url,
          debugMode: debugMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit video generation');
      }

      const result = await response.json();
      setSuccess(`Lullaby video generation started successfully!`);
      setJobInfo({
        job_id: result.job_id,
        render_id: result.render_id,
        output_url: result.output_url,
        job_tracking_url: result.job_tracking_url
      });
      
      // Reset form
      setSelectedChild(null);

    } catch (error) {
      console.error('Error submitting video:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit video generation');
    } finally {
      setSubmittingVideo(false);
    }
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Lullaby Video Request</h1>
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
        {/* Step 1: Select Child */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Child</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedChild?.id === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getThemeEmoji(child.primary_interest)}</span>
                  <div className="font-medium text-gray-900">{child.name}</div>
                </div>
                <div className="text-sm text-gray-500">
                  Age: {child.age} • Theme: {child.primary_interest}
                </div>
              </button>
            ))}
          </div>

          {children.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No children found. Please add children first.</p>
            </div>
          )}
        </div>

        {/* Step 2: Child Data for Lambda */}
        {selectedChild && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Step 2: Child Data for {selectedChild.name}'s Lullaby Video
              </h2>
              <div className="ml-3 flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span className="mr-1">{getThemeEmoji(selectedChild.primary_interest)}</span>
                {selectedChild.primary_interest} theme
              </div>
            </div>
            
            {/* Debug Mode Checkbox - at the top so it affects asset loading */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-yellow-800">
                  🐛 Enable Debug Mode
                </span>
              </label>
              <p className="text-xs text-yellow-700 mt-1 ml-6">
                Shows debug information and timing details in the video overlay
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Data that will be sent to Lambda:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child Name:</span>
                    <span className="font-medium">{selectedChild.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child Age:</span>
                    <span className="font-medium">{selectedChild.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Theme/Interest:</span>
                    <span className="font-medium">{selectedChild.primary_interest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child ID:</span>
                    <span className="font-mono text-sm">{selectedChild.id}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium">Lullaby</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Background Music:</span>
                    <span className="text-yellow-600">⚠️ Not yet implemented</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intro Audio:</span>
                    <span className={themeAssets?.introAudio ? 'text-green-600' : 'text-yellow-600'}>
                      {themeAssets?.introAudio ? '✅ Found' : '⚠️ Not found'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Outro Audio:</span>
                    <span className={themeAssets?.outroAudio ? 'text-green-600' : 'text-yellow-600'}>
                      {themeAssets?.outroAudio ? '✅ Found' : '⚠️ Not found'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slideshow Images:</span>
                    <span className="font-medium">
                      {themeAssets?.slideshowImages ? `${themeAssets.slideshowImages.length}/23 images` : '0/23 images'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">JSON Payload Preview:</h4>
                
                {/* Asset Loading Indicator */}
                {assetLoading && (
                  <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
                    🔍 Loading theme-matching assets...
                  </div>
                )}

                {/* Asset Error/Warning */}
                {assetError && (
                  <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm">
                    ⚠️ {assetError}
                  </div>
                )}

                {/* Asset Success */}
                {themeAssets && !assetError && (
                  <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
                    ✅ Found theme-matching assets for {selectedChild.primary_interest}
                    {themeAssets.introImage && (
                      <div className="mt-1 text-xs">
                        Intro: {themeAssets.introImage.id} (safe_zone: {Array.isArray(themeAssets.introImage.safe_zone) ? themeAssets.introImage.safe_zone.join(', ') : themeAssets.introImage.safe_zone || 'null'})
                      </div>
                    )}
                    {themeAssets.outroImage && (
                      <div className="mt-1 text-xs">
                        Outro: {themeAssets.outroImage.id} (safe_zone: {Array.isArray(themeAssets.outroImage.safe_zone) ? themeAssets.outroImage.safe_zone.join(', ') : themeAssets.outroImage.safe_zone || 'null'})
                      </div>
                    )}
                    {themeAssets.slideshowImages && themeAssets.slideshowImages.length > 0 && (
                      <div className="mt-1 text-xs">
                        Slideshow: {themeAssets.slideshowImages.length} images (IDs: {themeAssets.slideshowImages.map(img => img.id).join(', ')})
                      </div>
                    )}
                    {themeAssets.introAudio && (
                      <div className="mt-1 text-xs">
                        Intro Audio: {themeAssets.introAudio.id} ({themeAssets.introAudio.theme})
                      </div>
                    )}
                    {themeAssets.outroAudio && (
                      <div className="mt-1 text-xs">
                        Outro Audio: {themeAssets.outroAudio.id} ({themeAssets.outroAudio.theme})
                      </div>
                    )}
                  </div>
                )}

                <pre className="text-sm text-blue-800 bg-blue-100 p-3 rounded overflow-x-auto">
{JSON.stringify({
  childName: selectedChild.name,
  childAge: selectedChild.age,
  childTheme: selectedChild.primary_interest,
  childId: selectedChild.id,
  submitted_by: 'current_user_id',
  duration: dreamDripDuration || 'Loading...',
  introImageUrl: themeAssets?.introImage?.file_url || 'No intro image found',
  outroImageUrl: themeAssets?.outroImage?.file_url || 'No outro image found',
  slideshowImageUrls: themeAssets?.slideshowImages?.map(img => img.file_url) || [],
  introAudioUrl: themeAssets?.introAudio?.file_url || '',
  outroAudioUrl: themeAssets?.outroAudio?.file_url || '',
  debugMode: debugMode,
  assetInfo: {
    introImage: themeAssets?.introImage ? {
      id: themeAssets.introImage.id,
      theme: themeAssets.introImage.theme,
      safe_zone: themeAssets.introImage.safe_zone
    } : null,
    outroImage: themeAssets?.outroImage ? {
      id: themeAssets.outroImage.id,
      theme: themeAssets.outroImage.theme,
      safe_zone: themeAssets.outroImage.safe_zone
    } : null,
    slideshowImages: themeAssets?.slideshowImages?.map(img => ({
      id: img.id,
      theme: img.theme,
      safe_zone: img.safe_zone
    })) || []
  }
}, null, 2)}
                </pre>
                {dreamDripDuration && (
                  <div className="mt-3 text-sm text-blue-700">
                    <span className="font-medium">Duration:</span> {dreamDripDuration} seconds (fetched from DreamDrip asset)
                  </div>
                )}
              </div>

              {/* Asset Visual Preview */}
              {themeAssets && !assetLoading && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Asset Preview</h4>
                  
                  <div className="space-y-6">
                    {/* Intro Image */}
                    {themeAssets.introImage && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-blue-600 mr-2">🎬</span>
                          Intro Image
                        </h5>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={themeAssets.introImage.file_url} 
                              alt="Intro"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/128x80/1a1a1a/666666?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600">
                              <div><strong>ID:</strong> {themeAssets.introImage.id}</div>
                              <div><strong>Theme:</strong> {themeAssets.introImage.theme}</div>
                              <div><strong>Safe Zones:</strong> {Array.isArray(themeAssets.introImage.safe_zone) ? themeAssets.introImage.safe_zone.join(', ') : themeAssets.introImage.safe_zone || 'None'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Slideshow Images */}
                    {themeAssets.slideshowImages && themeAssets.slideshowImages.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-purple-600 mr-2">🖼️</span>
                          Slideshow Images ({themeAssets.slideshowImages.length}/23)
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Randomized Order
                          </span>
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {themeAssets.slideshowImages.map((img, index) => (
                            <div key={img.id} className="bg-gray-50 p-2 rounded-lg">
                              <div className="w-full h-20 bg-gray-100 rounded overflow-hidden mb-2">
                                <img 
                                  src={img.file_url} 
                                  alt={`Slideshow ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/128x80/1a1a1a/666666?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="text-xs text-gray-600">
                                <div className="font-medium">#{index + 1}</div>
                                <div className="truncate">{img.id}</div>
                                <div className="text-gray-500">{img.theme}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outro Image */}
                    {themeAssets.outroImage && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-purple-600 mr-2">🌙</span>
                          Outro Image
                        </h5>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={themeAssets.outroImage.file_url} 
                              alt="Outro"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/128x80/1a1a1a/666666?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600">
                              <div><strong>ID:</strong> {themeAssets.outroImage.id}</div>
                              <div><strong>Theme:</strong> {themeAssets.outroImage.theme}</div>
                              <div><strong>Safe Zones:</strong> {Array.isArray(themeAssets.outroImage.safe_zone) ? themeAssets.outroImage.safe_zone.join(', ') : themeAssets.outroImage.safe_zone || 'None'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Intro Audio */}
                    {themeAssets.introAudio && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-green-600 mr-2">🎤</span>
                          Intro Audio
                        </h5>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="text-3xl text-gray-400">🎵</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600">
                              <div><strong>ID:</strong> {themeAssets.introAudio.id}</div>
                              <div><strong>Theme:</strong> {themeAssets.introAudio.theme}</div>
                              <div><strong>Type:</strong> Personalized intro for {selectedChild.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Outro Audio */}
                    {themeAssets.outroAudio && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-green-600 mr-2">🌙</span>
                          Outro Audio
                        </h5>
                        <div className="flex items-start space-x-4">
                          <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="text-3xl text-gray-400">🎵</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-600">
                              <div><strong>ID:</strong> {themeAssets.outroAudio.id}</div>
                              <div><strong>Theme:</strong> {themeAssets.outroAudio.theme}</div>
                              <div><strong>Type:</strong> Personalized outro for {selectedChild.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Background Music Info */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="text-blue-600 mr-2">🎼</span>
                        Background Music
                      </h5>
                      <div className="text-sm text-gray-600">
                        <div><strong>Source:</strong> DreamDrip (Ambient lullaby music)</div>
                        <div><strong>Duration:</strong> {dreamDripDuration || 'Loading...'} seconds</div>
                        <div><strong>Volume:</strong> 80% (will be mixed with personalized audio)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Generate Video */}
        {selectedChild && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Generate Lullaby Video</h2>
            
            {/* Audio Requirements Warning */}
            {assetError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Personalized Audio Required
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>This child requires personalized intro and outro audio files to generate a lullaby video.</p>
                      <p className="mt-1 font-medium">Please ensure personalized audio files are available for {selectedChild.name} before proceeding.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 mb-4">
                Ready to generate {selectedChild.name}'s personalized lullaby video with slideshow and audio!
                <br />
                <span className="text-sm text-blue-600">
                  This will create a complete lullaby video with personalized intro/outro audio, 
                  theme-matching slideshow images, and ambient background music.
                </span>
              </p>
              
              <button
                onClick={submitLullabyVideo}
                disabled={submittingVideo || !!assetError}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVideo ? 'Submitting to Lambda...' : 
                 assetError ? 'Cannot Submit - Missing Required Audio' : 
                 'Generate Lullaby Video'}
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{success}</p>
            
            {jobInfo && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700 mb-1">Job ID:</div>
                    <div className="font-mono text-gray-900">{jobInfo.job_id}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700 mb-1">Render ID:</div>
                    <div className="font-mono text-gray-900">{jobInfo.render_id}</div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-700 mb-1">Output URL:</div>
                  <div className="font-mono text-sm text-gray-900 break-all">
                    {jobInfo.output_url}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-green-200">
                  <a 
                    href={jobInfo.job_tracking_url}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Track Job Progress
                  </a>
                  <a 
                    href="/admin/jobs"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View All Jobs
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 