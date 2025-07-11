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

export default function NameVideoRequest() {
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
    letterImages?: { id: string; file_url: string; theme: string; safe_zone: string; metadata?: any }[];
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

      // Combine left and right images for letter segments and shuffle them for randomization
      const allLetterImages = [...leftImages, ...rightImages];
      
      // Shuffle the images to ensure randomization
      const letterImages = allLetterImages.sort(() => Math.random() - 0.5);

      // Select random assets for intro and outro when possible
      let introImage = introImages.length > 0 ? introImages[Math.floor(Math.random() * introImages.length)] : undefined;
      let outroImage = outroImages.length > 0 ? outroImages[Math.floor(Math.random() * outroImages.length)] : undefined;

      // If we have the same asset for both, try to find a different one for outro
      if (introImage && outroImage && introImage.id === outroImage.id) {
        const differentOutroImages = outroImages.filter(img => img.id !== introImage.id);
        if (differentOutroImages.length > 0) {
          outroImage = differentOutroImages[Math.floor(Math.random() * differentOutroImages.length)];
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

      const backgroundMusicUrl = backgroundMusicAsset?.file_url || 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav'; // Fallback

      setThemeAssets({
        introImage,
        outroImage,
        letterImages,
        introAudio: personalizedIntroAudio || undefined,
        outroAudio: personalizedOutroAudio || undefined,
        letterAudios: personalizedLetterAudios,
        backgroundMusic: backgroundMusicAsset || undefined
      });

      console.log('✅ Theme assets loaded:', {
        introImage,
        outroImage,
        letterImages: letterImages.length,
        leftImages: leftImages.length,
        rightImages: rightImages.length,
        shuffledLetterImages: letterImages.map(img => img.id),
        introAudio: personalizedIntroAudio,
        outroAudio: personalizedOutroAudio,
        letterAudios: Object.keys(personalizedLetterAudios)
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
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching children:', error);
    } else {
      setChildren(data || []);
    }
    setLoading(false);
  };

  const submitNameVideo = async () => {
    if (!selectedChild || !themeAssets) {
      setError('No child selected or assets not loaded');
      return;
    }

    setSubmittingVideo(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/videos/generate-name-video', {
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
          introImageUrl: themeAssets.introImage?.file_url || '',
          outroImageUrl: themeAssets.outroImage?.file_url || '',
          letterImageUrls: themeAssets.letterImages?.map(img => img.file_url) || [],
          // NEW: Pass letter images with safe zone metadata
          letterImagesWithMetadata: themeAssets.letterImages?.map(img => ({
            url: img.file_url,
            safeZone: img.metadata?.review?.safe_zone?.includes('left_safe') ? 'left' : 'right'
          })) || [],
          // New audioAssets structure matching the API
          letterAudioUrls: Object.fromEntries(
            Object.entries(themeAssets.letterAudios || {}).map(([letter, asset]) => [
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
      setSuccess(`Name video generation started successfully!`);
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
            <h1 className="text-2xl font-bold text-gray-900">Name Video Request</h1>
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
                Step 2: Child Data for {selectedChild.name}'s Name Video
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
                    <span className="font-medium">Name Video</span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Letter Images:</span>
                    <span className="font-medium">
                      {themeAssets?.letterImages ? `${themeAssets.letterImages.length} images` : '0 images'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Letter Audios:</span>
                    <span className="font-medium">
                      {themeAssets?.letterAudios ? 
                        `${Object.keys(themeAssets.letterAudios).length}/${new Set(selectedChild.name.toUpperCase().split('')).size} letters` : 
                        '0 letters'}
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
                    {themeAssets.letterImages && themeAssets.letterImages.length > 0 && (
                      <div className="mt-1 text-xs">
                        Letter Images: {themeAssets.letterImages.length} images (IDs: {themeAssets.letterImages.map(img => img.id).join(', ')})
                      </div>
                    )}
                    <div className="mt-1 text-xs">
                      Name Audio: Will be fetched from database (name_audio class for {selectedChild.name})
                    </div>
                    {themeAssets.letterAudios && Object.keys(themeAssets.letterAudios).length > 0 && (
                      <div className="mt-1 text-xs">
                        Letter Audios: {Object.keys(themeAssets.letterAudios).join(', ')} ({Object.keys(themeAssets.letterAudios).length} letters)
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
  introImageUrl: themeAssets?.introImage?.file_url || 'No intro image found',
  outroImageUrl: themeAssets?.outroImage?.file_url || 'No outro image found',
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
  childId: selectedChild.id,
  submitted_by: null,
  introImageUrl: themeAssets?.introImage?.file_url || '',
  outroImageUrl: themeAssets?.outroImage?.file_url || '',
  letterImageUrls: themeAssets?.letterImages?.map(img => img.file_url) || [],
  // CORRECT: letterAudioUrls as flat object (what API actually receives)
  letterAudioUrls: Object.fromEntries(
    Object.entries(themeAssets?.letterAudios || {}).map(([letter, asset]) => [
      letter, 
      (asset as any).file_url
    ])
  ) || {},
  // These will be fetched by the API from the database
  introAudioUrl: null,
  outroAudioUrl: null
}, null, 2)}
                    </pre>
                  </div>
                </div>
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

                    {/* Letter Images */}
                    {themeAssets.letterImages && themeAssets.letterImages.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-purple-600 mr-2">🔤</span>
                          Letter Images ({themeAssets.letterImages.length} images)
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Left/Right Safe Zones
                          </span>
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {themeAssets.letterImages.map((img, index) => (
                            <div key={img.id} className="bg-gray-50 p-2 rounded-lg">
                              <div className="w-full h-20 bg-gray-100 rounded overflow-hidden mb-2">
                                <img 
                                  src={img.file_url} 
                                  alt={`Letter ${index + 1}`}
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
                                <div className="text-gray-500">{Array.isArray(img.safe_zone) ? img.safe_zone.join(', ') : img.safe_zone}</div>
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
                          <span className="text-purple-600 mr-2">🌟</span>
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

                    {/* Letter Audios */}
                    {themeAssets.letterAudios && Object.keys(themeAssets.letterAudios).length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-green-600 mr-2">🔤</span>
                          Letter Audios ({Object.keys(themeAssets.letterAudios).length}/{selectedChild.name.length} letters)
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {Object.entries(themeAssets.letterAudios).map(([letter, audio]) => (
                            <div key={letter} className="bg-gray-50 p-2 rounded-lg">
                              <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-2">
                                <div className="text-2xl text-gray-400">🎵</div>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div className="font-medium">Letter: {letter}</div>
                                <div className="truncate">{audio.id}</div>
                                <div className="text-gray-500">{audio.theme}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outro Audio */}
                    {themeAssets.outroAudio && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <span className="text-green-600 mr-2">🌟</span>
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
                        <div><strong>Source:</strong> {themeAssets?.backgroundMusic?.theme || 'Background Music Asset'}</div>
                        <div><strong>Asset ID:</strong> {themeAssets?.backgroundMusic?.id || 'f7365c71-cd52-44d2-b289-02bdc6e74c74'}</div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Generate Name Video</h2>
            
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
                      Asset Requirements
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Some required assets are missing for this name video generation.</p>
                      <p className="mt-1 font-medium">Please ensure all required assets are available for {selectedChild.name} before proceeding.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 mb-4">
                Ready to generate {selectedChild.name}'s personalized name video with letter spelling!
                <br />
                <span className="text-sm text-blue-600">
                  This will create a complete name video with personalized intro/outro audio, 
                  letter-specific audio for each letter in {selectedChild.name}, theme-matching images, 
                  and ambient background music.
                </span>
              </p>
              
              <button
                onClick={submitNameVideo}
                disabled={submittingVideo || !!assetError}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVideo ? 'Submitting to Lambda...' : 
                 assetError ? 'Cannot Submit - Missing Required Assets' : 
                 'Generate Name Video'}
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