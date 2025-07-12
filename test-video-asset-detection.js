#!/usr/bin/env node

/**
 * Test Video Asset Detection for Letter Hunt
 * 
 * This script tests the enhanced asset detection logic that now includes video assets
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (you'll need to replace with your actual URL and key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MjA3NzcsImV4cCI6MjA2NzQ5Njc3N30.fiFJWRA4Jgen9iwYnw83OMU5nUuP8kw9yA_5maYLWaQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVideoAssetDetection() {
  console.log('🎬 Testing Video Asset Detection for Letter Hunt...\n');

  try {
    // Query for Letter Hunt video assets
    const { data: videoAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'video')
      .eq('metadata->>template', 'letter-hunt')
      .in('status', ['approved', 'pending']);

    if (error) {
      console.error('❌ Error fetching video assets:', error);
      return;
    }

    console.log(`📦 Found ${videoAssets?.length || 0} Letter Hunt video assets:\n`);

    if (!videoAssets || videoAssets.length === 0) {
      console.log('📭 No Letter Hunt video assets found in database');
      console.log('💡 Try uploading some video assets using the video asset upload tool');
      return;
    }

    // Test the asset mapping logic
    const existingByType = new Map();
    
    videoAssets.forEach(asset => {
      console.log(`🎥 Processing video asset ${asset.id}:`);
      console.log(`   - File: ${asset.file_url}`);
      console.log(`   - Metadata:`, JSON.stringify(asset.metadata, null, 2));
      
      // Apply the same logic as in the React component
      let assetKey = asset.metadata?.videoType;
      
      // FALLBACK: For legacy video assets, try to infer from category or section
      if (!assetKey && asset.type === 'video') {
        const category = asset.metadata?.category;
        const section = asset.metadata?.section;
        
        // Handle direct section mappings first
        if (section === 'introVideo') {
          assetKey = 'introVideo';
        } else if (section === 'intro2Video') {
          assetKey = 'intro2Video';
        } else if (section === 'happyDanceVideo' || section === 'dance') {
          assetKey = 'happyDanceVideo';
        }
        // Handle legacy mappings
        else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
          assetKey = 'introVideo';
        } else if (section === 'search' || section === 'intro2') {
          assetKey = 'intro2Video';
        } else if (category === 'dance') {
          assetKey = 'happyDanceVideo';
        }
        
        if (assetKey) {
          console.log(`   🔄 Legacy video: Inferred videoType: ${assetKey} from category: ${category}, section: ${section}`);
        }
      }
      
      if (assetKey) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at
        });
        console.log(`   ✅ Mapped to asset key: ${assetKey}`);
      } else {
        console.log(`   ⚠️ Could not determine asset key for this video`);
        console.log(`   💡 Consider adding 'videoType' field to metadata`);
      }
      
      console.log('');
    });

    console.log('🗂️ Asset Mapping Results:');
    console.log('========================');
    existingByType.forEach((data, key) => {
      console.log(`${key}: ${data.url}`);
    });

    if (existingByType.size === 0) {
      console.log('📭 No assets could be mapped to Letter Hunt video keys');
      console.log('💡 Make sure your video assets have proper metadata:');
      console.log('   - videoType: introVideo | intro2Video | happyDanceVideo');
      console.log('   - OR section: intro | search | dance');
      console.log('   - OR category: letter AND theme | dance');
    } else {
      console.log(`\n✅ Successfully mapped ${existingByType.size} video assets!`);
      console.log('🎯 These will now be detected by the Letter Hunt request interface');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVideoAssetDetection();
