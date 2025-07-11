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

export default function NameVideov2Request() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jobInfo, setJobInfo] = useState<{
    job_id: string;
    render_id: string;
    output_url: string;
    job_tracking_url: string;
  } | null>(null);
  const [themeAssets, setThemeAssets] = useState<{
    introImage?: { id: string; file_url: string; theme: string; safe_zone: string };
    outroImage?: { id: string; file_url: string; theme: string; safe_zone: string };
    letterImages?: { id: string; file_url: string; theme: string; safe_zone: string }[];
    introAudio?: { id: string; file_url: string; theme: string };
    outroAudio?: { id: string; file_url: string; theme: string };
    letterAudios?: { [letter: string]: { id: string; file_url: string; theme: string } };
    backgroundMusic?: { id: string; file_url: string; theme: string; metadata?: any };
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
        .limit(50);

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        throw new Error('Failed to fetch images');
      }

      console.log('Found all images:', allImages);

      // Filter images based on metadata.review.safe_zone array
      const availableImages = allImages || [];
      
      // Filter for intro and outro images (center_safe)
      const introImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('center_safe');
      });

      const outroImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('center_safe');
      });

      // Filter for letter images (left_safe and right_safe)
      const leftImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('left_safe');
      });

      const rightImages = availableImages.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('right_safe');
      });

      // Combine left and right images for letter segments
      const letterImages = [...leftImages, ...rightImages];

      // Select different assets for intro and outro when possible
      let introImage = introImages[0];
      let outroImage = outroImages[0];

      // If we have the same asset for both, try to find a different one for outro
      if (introImage && outroImage && introImage.id === outroImage.id) {
        const differentOutroImage = outroImages.find(img => img.id !== introImage.id);
        if (differentOutroImage) {
          outroImage = differentOutroImage;
        }
      }

      // Fetch personalized audio files for the child
      console.log(`🎵 Fetching personalized audio for child: ${child.name}, theme: ${childTheme}`);
      
      const { data: allAudioFiles, error: allAudioError } = await supabase
        .from('assets')
        .select('id, file_url, theme, tags, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .limit(50);

      if (allAudioError) {
        console.error('Error fetching all audio files:', allAudioError);
      }

      console.log('All available audio files:', allAudioFiles);

      // Filter for personalized audio based on child name
      let personalizedIntroAudio = null;
      let personalizedOutroAudio = null;
      let personalizedLetterAudios: { [letter: string]: any } = {};

      if (allAudioFiles && allAudioFiles.length > 0) {
        const childNameLower = child.name.toLowerCase();
        
        // Look for name audio (child's name pronunciation for intro/outro)
        const nameAudio = allAudioFiles.find((audio: any) => {
          const metadata = audio.metadata || {};
          const hasChildName = metadata.child_name?.toLowerCase() === childNameLower;
          const isNameAudio = metadata.audio_class === 'name_audio';
          return hasChildName && isNameAudio;
        });

        // Use the same name audio for both intro and outro
        personalizedIntroAudio = nameAudio ? {
          id: nameAudio.id,
          file_url: nameAudio.file_url,
          theme: nameAudio.theme
        } : undefined;
        personalizedOutroAudio = nameAudio ? {
          id: nameAudio.id,
          file_url: nameAudio.file_url,
          theme: nameAudio.theme
        } : undefined;

        // Look for letter audio (general, not personalized)
        const childLetters = child.name.toUpperCase().split('');
        childLetters.forEach(letter => {
          const letterAudio = allAudioFiles.find((audio: any) => {
            const metadata = audio.metadata || {};
            const isLetterAudio = metadata.audio_class === 'letter_audio' && metadata.letter === letter;
            return isLetterAudio;
          });
          if (letterAudio) {
            personalizedLetterAudios[letter] = letterAudio;
          }
        });

        console.log('Personalized audio search results:', {
          childName: childNameLower,
          nameAudio: nameAudio,
          introAudio: personalizedIntroAudio,
          outroAudio: personalizedOutroAudio,
          letterAudios: personalizedLetterAudios
        });
      }

      // Fetch background music asset from database
      const { data: backgroundMusicAsset, error: musicError } = await supabase
        .from('assets')
        .select('id, file_url, theme, metadata')
        .eq('id', 'f7365c71-cd52-44d2-b289-02bdc6e74c74')
        .single();

      if (musicError) {
        console.error('Error fetching background music:', musicError);
      }

      // Set theme assets
      setThemeAssets({
        introImage: introImage ? {
          id: introImage.id,
          file_url: introImage.file_url,
          theme: introImage.theme,
          safe_zone: introImage.safe_zone
        } : undefined,
        outroImage: outroImage ? {
          id: outroImage.id,
          file_url: outroImage.file_url,
          theme: outroImage.theme,
          safe_zone: outroImage.safe_zone
        } : undefined,
        letterImages: letterImages.map(img => ({
          id: img.id,
          file_url: img.file_url,
          theme: img.theme,
          safe_zone: img.safe_zone
        })),
        introAudio: personalizedIntroAudio || undefined,
        outroAudio: personalizedOutroAudio || undefined,
        letterAudios: personalizedLetterAudios,
        backgroundMusic: backgroundMusicAsset ? {
          id: backgroundMusicAsset.id,
          file_url: backgroundMusicAsset.file_url,
          theme: backgroundMusicAsset.theme,
          metadata: backgroundMusicAsset.metadata
        } : undefined
      });

    } catch (error) {
      console.error('Error fetching theme assets:', error);
      setAssetError(error instanceof Error ? error.message : 'Failed to fetch theme assets');
    } finally {
      setAssetLoading(false);
    }
  };

  const handleChildSelect = (child: Child) => {
    setSelectedChild(child);
    setError(null);
    setSuccess(null);
    setJobInfo(null);
    fetchThemeAssets(child.primary_interest, child);
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

  const submitNameVideov2 = async () => {
    if (!selectedChild) {
      setError('No child selected');
      return;
    }

    setSubmittingVideo(true);
    setError(null);
    setSuccess(null);
    setJobInfo(null);

    try {
      const response = await fetch('/api/videos/generate-name-video-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: selectedChild.name,
          childAge: selectedChild.age,
          childTheme: selectedChild.primary_interest,
          childId: selectedChild.id,
          submitted_by: null, // Will use default admin user
          introImageUrl: themeAssets?.introImage?.file_url || '',
          outroImageUrl: themeAssets?.outroImage?.file_url || '',
          letterImageUrls: themeAssets?.letterImages?.map(img => img.file_url) || [],
          // New audioAssets structure matching the API
          letterAudioUrls: Object.fromEntries(
            Object.entries(themeAssets?.letterAudios || {}).map(([letter, asset]) => [
              letter, 
              (asset as any).file_url
            ])
          ) || {},
          // These will be fetched by the API from the database
          introAudioUrl: null,
          outroAudioUrl: null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccess(`NameVideov2 generation started successfully!`);
      setJobInfo(result);
      
      // Reset form
      setSelectedChild(null);
      setThemeAssets(null);

    } catch (error) {
      console.error('Error submitting video:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit video generation');
    } finally {
      setSubmittingVideo(false);
    }
  };

  useEffect(() => {
    checkAdminAccess();
    fetchChildren();
  }, []);

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
            <h1 className="text-2xl font-bold text-gray-900">NameVideov2 Request</h1>
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
                Step 2: Child Data for {selectedChild.name}'s NameVideov2
              </h2>
              <div className="ml-3 flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span className="mr-1">{getThemeEmoji(selectedChild.primary_interest)}</span>
                {selectedChild.primary_interest} theme
              </div>
            </div>
            
            {/* Debug Mode Checkbox */}
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
                    <span className="font-medium">NameVideov2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Background Music:</span>
                    <span className={themeAssets?.backgroundMusic ? 'text-green-600' : 'text-yellow-600'}>
                      {themeAssets?.backgroundMusic ? '✅ Found' : '⚠️ Not found'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name Audio:</span>
                    <span className="text-green-600">
                      ✅ Will be fetched from database
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Audio Class:</span>
                    <span className="text-blue-600">
                      name_audio for {selectedChild.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Loading Status */}
              {assetLoading && (
                <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
                  🔄 Loading theme-matching assets for {selectedChild.primary_interest}...
                </div>
              )}

              {/* Asset Error */}
              {assetError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  ⚠️ {assetError}
                </div>
              )}

              {/* Asset Success */}
              {themeAssets && !assetError && (
                <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
                  ✅ Found theme-matching assets for {selectedChild.primary_interest}
                  {themeAssets.introImage && (
                    <div className="mt-1 text-xs">
                      Intro: {themeAssets.introImage.id} (safe_zone: {themeAssets.introImage.safe_zone})
                    </div>
                  )}
                  {themeAssets.outroImage && (
                    <div className="mt-1 text-xs">
                      Outro: {themeAssets.outroImage.id} (safe_zone: {themeAssets.outroImage.safe_zone})
                    </div>
                  )}
                  {themeAssets.letterImages && themeAssets.letterImages.length > 0 && (
                    <div className="mt-1 text-xs">
                      Letter Images: {themeAssets.letterImages.length} images
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
                  {themeAssets.letterAudios && Object.keys(themeAssets.letterAudios).length > 0 && (
                    <div className="mt-1 text-xs">
                      Letter Audio: {Object.keys(themeAssets.letterAudios).length} letters ({Object.keys(themeAssets.letterAudios).join(', ')})
                    </div>
                  )}
                </div>
              )}

                              <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">📤 Input Payload (sent to API):</h4>
                    <pre className="text-sm text-blue-800 bg-blue-100 p-3 rounded overflow-x-auto">
{JSON.stringify({
  childName: selectedChild.name,
  childAge: selectedChild.age,
  childTheme: selectedChild.primary_interest,
  childId: selectedChild.id,
  submitted_by: null,
  introImageUrl: themeAssets?.introImage?.file_url || '',
  outroImageUrl: themeAssets?.outroImage?.file_url || '',
  letterImageUrls: themeAssets?.letterImages?.map(img => img.file_url) || [],
  introAudioUrl: null, // Will be fetched by API from database
  outroAudioUrl: null, // Will be fetched by API from database
  letterAudioUrls: Object.fromEntries(
    Object.entries(themeAssets?.letterAudios || {}).map(([letter, asset]) => [
      letter, 
      (asset as any).file_url
    ])
  ) || {}
}, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">🎬 Output Payload (created by API for Remotion):</h4>
                    <pre className="text-sm text-green-800 bg-green-100 p-3 rounded overflow-x-auto">
{JSON.stringify({
  childName: selectedChild.name,
  childAge: selectedChild.age,
  childTheme: selectedChild.primary_interest,
  backgroundMusicUrl: themeAssets?.backgroundMusic?.file_url || 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
  backgroundMusicVolume: 0.25,
  introImageUrl: themeAssets?.introImage?.file_url || '',
  outroImageUrl: themeAssets?.outroImage?.file_url || '',
  letterImageUrls: themeAssets?.letterImages?.map(img => img.file_url) || [],
  audioAssets: {
    fullName: `[Will be fetched from database: name_audio for ${selectedChild.name}]`,
    letters: Object.fromEntries(
      Object.entries(themeAssets?.letterAudios || {}).map(([letter, asset]) => [
        letter, 
        (asset as any).file_url
      ])
    ) || {}
  },
  debugMode: false
}, null, 2)}
                    </pre>
                  </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={submitNameVideov2}
                disabled={submittingVideo}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  submittingVideo
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submittingVideo ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating NameVideov2...
                  </span>
                ) : (
                  'Generate NameVideov2'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 