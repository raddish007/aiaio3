// Asset filtering and assignment utilities for video templates and admin UI

// Extracts all safe zones from an asset object
export function getAssetSafeZones(asset: any): string[] {
  let zones: string[] = [];
  if (Array.isArray(asset.safe_zone)) zones = zones.concat(asset.safe_zone);
  else if (asset.safe_zone) zones.push(asset.safe_zone);
  if (Array.isArray(asset.metadata?.safe_zone)) zones = zones.concat(asset.metadata.safe_zone);
  else if (asset.metadata?.safe_zone) zones.push(asset.metadata.safe_zone);
  if (Array.isArray(asset.metadata?.review?.safe_zone)) zones = zones.concat(asset.metadata.review.safe_zone);
  else if (asset.metadata?.review?.safe_zone) zones.push(asset.metadata.review.safe_zone);
  // Remove duplicates and falsy values
  zones = zones.filter(Boolean);
  return Array.from(new Set(zones));
}

// Checks if an asset is appropriate for a given template type
export function isAssetAppropriateForTemplate(asset: any, templateType: string): boolean {
  if (asset.metadata?.template === templateType) {
    return true;
  }
  const templateThemes: Record<string, string[]> = {
    'lullaby': ['bedtime', 'sleep', 'calm', 'peaceful', 'gentle', 'soothing', 'lullaby', 'night', 'moon', 'stars'],
    'name-video': ['educational', 'learning', 'name', 'alphabet', 'colorful', 'fun', 'playful'],
    'letter-hunt': ['educational', 'learning', 'alphabet', 'letters', 'colorful', 'fun', 'playful']
  };
  const themes = templateThemes[templateType as keyof typeof templateThemes] || [];
  const assetTheme = asset.theme?.toLowerCase() || '';
  const assetTags = asset.tags?.map((tag: string) => tag.toLowerCase()) || [];
  const assetMetadata = asset.metadata?.tags?.map((tag: string) => tag.toLowerCase()) || [];
  return themes.some(theme => 
    assetTheme.includes(theme) || 
    assetTags.some((tag: string) => tag.includes(theme)) ||
    assetMetadata.some((tag: string) => tag.includes(theme))
  );
}

// Checks if an asset's theme matches the purpose
export function isAssetThemeAppropriate(asset: any, assetPurpose: { purpose: string }): boolean {
  const purposeThemes: Record<string, string[]> = {
    'background_music': ['music', 'melody', 'song', 'lullaby', 'calm', 'peaceful'],
    'intro_audio': ['voice', 'speech', 'narrated', 'intro', 'welcome'],
    'intro_background': ['background', 'scene', 'setting', 'intro', 'welcome'],
    'slideshow_image': ['scene', 'character', 'setting', 'story', 'visual'],
    'outro_audio': ['voice', 'speech', 'narrated', 'outro', 'goodbye', 'ending'],
    'outro_background': ['background', 'scene', 'setting', 'outro', 'ending']
  };
  const themes = purposeThemes[assetPurpose.purpose as keyof typeof purposeThemes] || [];
  const assetTheme = asset.theme?.toLowerCase() || '';
  const assetTags = asset.tags?.map((tag: string) => tag.toLowerCase()) || [];
  return themes.some(theme => 
    assetTheme.includes(theme) || 
    assetTags.some((tag: string) => tag.includes(theme))
  );
}

// Calculates a theme relevance score for sorting assets
export function getThemeRelevanceScore(asset: any, assetPurpose: { purpose: string; safe_zone?: string }): number {
  let score = 0;
  const assetTheme = asset.theme?.toLowerCase() || '';
  const assetTags = asset.tags?.map((tag: string) => tag.toLowerCase()) || [];
  if (assetPurpose.purpose === 'background_music' && assetTheme.includes('lullaby')) score += 10;
  if (assetPurpose.purpose === 'intro_audio' && assetTheme.includes('bedtime')) score += 10;
  if (assetPurpose.purpose === 'outro_audio' && assetTheme.includes('goodnight')) score += 10;
  if (asset.safe_zone === assetPurpose.safe_zone) score += 5;
  if (asset.metadata?.safe_zone === assetPurpose.safe_zone) score += 3;
  if (asset.metadata?.review?.safe_zone === assetPurpose.safe_zone) score += 3;
  const themeKeywords = ['bedtime', 'sleep', 'calm', 'peaceful', 'gentle', 'soothing'];
  themeKeywords.forEach(keyword => {
    if (assetTheme.includes(keyword)) score += 2;
    if (assetTags.some((tag: string) => tag.includes(keyword))) score += 1;
  });
  return score;
}

// Audio duration extraction functions (server-side only)
// Temporarily disabled due to webpack bundling issues with get-audio-duration
export async function extractAudioDuration(filePath: string): Promise<number | undefined> {
  if (typeof window !== 'undefined') {
    console.error('extractAudioDuration should only be called on the server-side');
    return undefined;
  }
  
  console.warn('Audio duration extraction temporarily disabled - returning undefined');
  return undefined;
  
  // TODO: Re-enable when webpack bundling issues are resolved
  // try {
  //   const { default: getAudioDuration } = await import('get-audio-duration');
  //   const duration = await getAudioDuration(filePath);
  //   return duration;
  // } catch (error) {
  //   console.error('Error extracting audio duration from file:', error);
  //   return undefined;
  // }
}

export async function extractAudioDurationFromUrl(url: string): Promise<number | undefined> {
  if (typeof window !== 'undefined') {
    console.error('extractAudioDurationFromUrl should only be called on the server-side');
    return undefined;
  }
  
  console.warn('Audio duration extraction from URL temporarily disabled - returning undefined');
  return undefined;
  
  // TODO: Re-enable when webpack bundling issues are resolved
  // try {
  //   const { default: getAudioDuration } = await import('get-audio-duration');
  //   const duration = await getAudioDuration(url);
  //   return duration;
  // } catch (error) {
  //   console.error('Error extracting audio duration from URL:', error);
  //   return undefined;
  // }
}

// Image download and upload utility function
export async function downloadAndUploadImage(
  imageUrl: string, 
  supabaseAdmin: any, 
  generationMethod: string = 'fal.ai'
): Promise<{ supabaseUrl: string; originalUrl: string; fileSize: number }> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);
    
    console.log(`Downloaded image size: ${imageData.length} bytes`);
    
    // Determine file extension from content type or URL
    let fileExt = 'jpg'; // default
    const contentType = response.headers.get('content-type');
    if (contentType) {
      if (contentType.includes('png')) fileExt = 'png';
      else if (contentType.includes('webp')) fileExt = 'webp';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExt = 'jpg';
    } else {
      // Try to extract from URL
      const urlExt = imageUrl.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp'].includes(urlExt)) {
        fileExt = urlExt;
      }
    }
    
    // Generate filename
    const fileName = `${generationMethod}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `assets/images/${fileName}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('assets')
      .upload(filePath, imageData, { 
        contentType: contentType || 'image/jpeg', 
        upsert: true 
      });
    
    if (uploadError) {
      console.error('Error uploading image to storage:', uploadError);
      throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(filePath);
    
    console.log(`Image uploaded successfully to: ${publicUrl}`);
    
    return {
      supabaseUrl: publicUrl,
      originalUrl: imageUrl,
      fileSize: imageData.length
    };
    
  } catch (error) {
    console.error('Error in downloadAndUploadImage:', error);
    throw error;
  }
} 