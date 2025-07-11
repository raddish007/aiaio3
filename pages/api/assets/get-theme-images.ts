import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, childName } = req.query;

    if (!theme || !supabaseAdmin) {
      return res.status(400).json({ error: 'Theme parameter is required and database not available' });
    }

    const themeStr = Array.isArray(theme) ? theme[0] : theme;
    console.log(`🔍 Fetching background images for theme: ${themeStr}`);

    // Query for all approved images with matching theme
    const { data: allImages, error: imagesError } = await supabaseAdmin
      .from('assets')
      .select('id, file_url, theme, safe_zone, tags, metadata')
      .eq('type', 'image')
      .eq('status', 'approved')
      .or(`theme.ilike.%${themeStr}%,tags.cs.{${themeStr.toLowerCase()}}`)
      .limit(100);

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }

    console.log(`Found ${allImages?.length || 0} images for theme: ${themeStr}`);

    // Filter images based on safe zones in metadata.review.safe_zone
    const processedImages = (allImages || []).map(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return {
        ...img,
        safe_zones: safeZones,
        is_center_safe: safeZones.includes('center_safe'),
        is_left_safe: safeZones.includes('left_safe'),
        is_right_safe: safeZones.includes('right_safe'),
        is_intro_safe: safeZones.includes('intro_safe'),
        is_outro_safe: safeZones.includes('outro_safe')
      };
    });

    // Categorize images by safe zones
    const categorizedImages = {
      center_safe: processedImages.filter(img => img.is_center_safe),
      left_safe: processedImages.filter(img => img.is_left_safe),
      right_safe: processedImages.filter(img => img.is_right_safe),
      intro_safe: processedImages.filter(img => img.is_intro_safe),
      outro_safe: processedImages.filter(img => img.is_outro_safe),
      letter_safe: processedImages.filter(img => img.is_left_safe || img.is_right_safe),
      all_images: processedImages
    };

    // Select random images for each category
    const getRandomImages = (images: any[], count: number = 10) => {
      if (images.length === 0) return [];
      const shuffled = [...images].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    const selectedImages = {
      intro_images: getRandomImages(categorizedImages.center_safe.length > 0 ? categorizedImages.center_safe : categorizedImages.intro_safe),
      outro_images: getRandomImages(categorizedImages.center_safe.length > 0 ? categorizedImages.center_safe : categorizedImages.outro_safe),
      letter_images: getRandomImages(categorizedImages.letter_safe, 20),
      letter_images_with_metadata: getRandomImages(categorizedImages.letter_safe, 20).map(img => ({
        url: img.file_url,
        safeZone: img.is_left_safe ? 'left' : 'right'
      }))
    };

    return res.status(200).json({
      success: true,
      theme: themeStr,
      childName,
      statistics: {
        total_images: allImages?.length || 0,
        center_safe: categorizedImages.center_safe.length,
        left_safe: categorizedImages.left_safe.length,
        right_safe: categorizedImages.right_safe.length,
        intro_safe: categorizedImages.intro_safe.length,
        outro_safe: categorizedImages.outro_safe.length,
        letter_safe: categorizedImages.letter_safe.length
      },
      images: selectedImages,
      debug: {
        sample_images: processedImages.slice(0, 3).map(img => ({
          id: img.id,
          theme: img.theme,
          safe_zones: img.safe_zones,
          tags: img.tags
        }))
      }
    });

  } catch (error) {
    console.error('Error in get-theme-images API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
