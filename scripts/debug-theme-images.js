#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugThemeImages() {
  console.log('🔍 Debugging Theme Images for Name Video...\n');

  try {
    // Test different themes
    const testThemes = ['halloween', 'space', 'dinosaurs', 'animals', 'princesses'];
    
    for (const theme of testThemes) {
      console.log(`\n🎃 Testing theme: ${theme.toUpperCase()}`);
      console.log('=' .repeat(50));

      // Query images for this theme
      const { data: images, error } = await supabase
        .from('assets')
        .select('id, file_url, theme, safe_zone, tags, metadata')
        .eq('type', 'image')
        .eq('status', 'approved')
        .or(`theme.ilike.%${theme}%,tags.cs.{${theme}}`)
        .limit(20);

      if (error) {
        console.error(`❌ Error fetching ${theme} images:`, error);
        continue;
      }

      console.log(`📊 Total images found: ${images?.length || 0}`);

      if (!images || images.length === 0) {
        console.log(`⚠️ No images found for theme: ${theme}`);
        continue;
      }

      // Analyze safe zones
      const safeZoneStats = {
        center_safe: 0,
        left_safe: 0,
        right_safe: 0,
        intro_safe: 0,
        outro_safe: 0,
        no_safe_zone: 0,
        multiple_zones: 0
      };

      const imageDetails = images.map(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        
        // Count safe zones
        if (safeZones.includes('center_safe')) safeZoneStats.center_safe++;
        if (safeZones.includes('left_safe')) safeZoneStats.left_safe++;
        if (safeZones.includes('right_safe')) safeZoneStats.right_safe++;
        if (safeZones.includes('intro_safe')) safeZoneStats.intro_safe++;
        if (safeZones.includes('outro_safe')) safeZoneStats.outro_safe++;
        if (safeZones.length === 0) safeZoneStats.no_safe_zone++;
        if (safeZones.length > 1) safeZoneStats.multiple_zones++;

        return {
          id: img.id,
          theme: img.theme,
          safe_zones: safeZones,
          url_exists: !!img.file_url,
          tags: img.tags || []
        };
      });

      console.log('\n📊 Safe Zone Distribution:');
      console.log(`   Center Safe: ${safeZoneStats.center_safe}`);
      console.log(`   Left Safe: ${safeZoneStats.left_safe}`);
      console.log(`   Right Safe: ${safeZoneStats.right_safe}`);
      console.log(`   Intro Safe: ${safeZoneStats.intro_safe}`);
      console.log(`   Outro Safe: ${safeZoneStats.outro_safe}`);
      console.log(`   No Safe Zone: ${safeZoneStats.no_safe_zone}`);
      console.log(`   Multiple Zones: ${safeZoneStats.multiple_zones}`);

      // Check suitability for name video
      const centerImages = imageDetails.filter(img => img.safe_zones.includes('center_safe'));
      const leftImages = imageDetails.filter(img => img.safe_zones.includes('left_safe'));
      const rightImages = imageDetails.filter(img => img.safe_zones.includes('right_safe'));
      const letterImages = imageDetails.filter(img => 
        img.safe_zones.includes('left_safe') || img.safe_zones.includes('right_safe')
      );

      console.log('\n🎬 Name Video Suitability:');
      console.log(`   Intro/Outro options: ${centerImages.length} (need: 2)`);
      console.log(`   Letter images: ${letterImages.length} (recommended: 10+)`);
      console.log(`   Left-safe images: ${leftImages.length}`);
      console.log(`   Right-safe images: ${rightImages.length}`);

      const isViable = centerImages.length >= 2 && letterImages.length >= 5;
      console.log(`   ${isViable ? '✅ VIABLE' : '❌ NOT VIABLE'} for name videos`);

      // Show sample images
      if (imageDetails.length > 0) {
        console.log('\n📋 Sample Images:');
        imageDetails.slice(0, 5).forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.theme} (${img.safe_zones.join(', ') || 'no zones'})`);
          console.log(`      ID: ${img.id}`);
          console.log(`      Tags: ${img.tags.join(', ')}`);
          console.log(`      URL: ${img.url_exists ? '✅' : '❌'}`);
        });
      }
    }

    // Test the new API endpoint
    console.log('\n🧪 Testing New API Endpoint...');
    console.log('=' .repeat(50));
    
    const testTheme = 'halloween';
    const response = await fetch(`http://localhost:3000/api/assets/get-theme-images?theme=${testTheme}`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Response for ${testTheme}:`, {
        success: data.success,
        statistics: data.statistics,
        intro_images: data.images?.intro_images?.length || 0,
        outro_images: data.images?.outro_images?.length || 0,
        letter_images: data.images?.letter_images?.length || 0,
        letter_images_with_metadata: data.images?.letter_images_with_metadata?.length || 0
      });
    } else {
      console.error('❌ API test failed:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug script
debugThemeImages().then(() => {
  console.log('\n🎉 Debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
