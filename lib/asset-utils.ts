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