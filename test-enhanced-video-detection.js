#!/usr/bin/env node

/**
 * Test Enhanced Video Asset Detection for Letter Hunt
 * 
 * This script simulates the enhanced asset detection logic
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MjA3NzcsImV4cCI6MjA2NzQ5Njc3N30.fiFJWRA4Jgen9iwYnw83OMU5nUuP8kw9yA_5maYLWaQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedDetection() {
  console.log('🎬 Testing Enhanced Video Asset Detection...\n');

  // Test scenarios
  const testCases = [
    { childName: 'Andrew', targetLetter: 'A', theme: 'Dogs' },
    { childName: 'Lily', targetLetter: 'L', theme: 'Dinosaurs' },
    { childName: 'Nadia', targetLetter: 'N', theme: 'Halloween' },
    { childName: 'Bob', targetLetter: 'B', theme: 'Adventure' }
  ];

  for (const testCase of testCases) {
    const { childName, targetLetter, theme } = testCase;
    
    console.log(`\n🔍 Testing: ${childName} (Letter ${targetLetter}, Theme: ${theme})`);
    console.log('=' .repeat(60));

    try {
      // 1. Assets specific to this child and letter
      const { data: specificAssets } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'letter-hunt')
        .eq('metadata->>child_name', childName)
        .eq('metadata->>targetLetter', targetLetter);

      // 2. Letter Hunt video assets that match the target letter
      const { data: letterSpecificAssets } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'letter-hunt')
        .eq('type', 'video')
        .eq('metadata->>targetLetter', targetLetter);

      // 3. Generic Letter Hunt video assets
      const { data: genericVideoAssets } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'letter-hunt')
        .eq('type', 'video')
        .is('metadata->>child_name', null)
        .is('metadata->>targetLetter', null);

      const existingAssets = [
        ...(specificAssets || []),
        ...(letterSpecificAssets || []),
        ...(genericVideoAssets || [])
      ];

      console.log(`📦 Found ${existingAssets.length} total assets:`);
      console.log(`   - Specific: ${specificAssets?.length || 0}`);
      console.log(`   - Letter-specific: ${letterSpecificAssets?.length || 0}`);
      console.log(`   - Generic: ${genericVideoAssets?.length || 0}`);

      // Test asset mapping
      const existingByType = new Map();
      
      existingAssets.forEach(asset => {
        let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
        
        // Video asset detection logic
        if (!assetKey && asset.type === 'video') {
          const category = asset.metadata?.category;
          const section = asset.metadata?.section;
          
          if (section === 'introVideo') {
            assetKey = 'introVideo';
          } else if (section === 'intro2Video') {
            assetKey = 'intro2Video';
          } else if (section === 'happyDanceVideo' || section === 'dance') {
            assetKey = 'happyDanceVideo';
          } else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
            assetKey = 'introVideo';
          } else if (section === 'search' || section === 'intro2') {
            assetKey = 'intro2Video';
          } else if (category === 'dance') {
            assetKey = 'happyDanceVideo';
          }
        }
        
        if (assetKey) {
          console.log(`\n   🎥 Processing: ${assetKey}`);
          console.log(`      Asset ID: ${asset.id}`);
          console.log(`      Target Letter: ${asset.metadata?.targetLetter}`);
          console.log(`      Theme: ${asset.metadata?.theme}`);
          console.log(`      Section: ${asset.metadata?.section}`);
          
          // Theme matching logic
          const existingAsset = existingByType.get(assetKey);
          const shouldUseThisAsset = !existingAsset || 
            (asset.type === 'video' && asset.metadata?.theme?.toLowerCase() === theme.toLowerCase());
          
          if (shouldUseThisAsset) {
            existingByType.set(assetKey, {
              url: asset.file_url,
              status: 'ready',
              assetId: asset.id,
              theme: asset.metadata?.theme,
              targetLetter: asset.metadata?.targetLetter
            });
            console.log(`      ✅ SELECTED - Theme match: ${asset.metadata?.theme === theme}`);
          } else {
            console.log(`      ⚠️ SKIPPED - Theme mismatch: ${asset.metadata?.theme} vs ${theme}`);
          }
        }
      });

      console.log(`\n🎯 Final asset mapping:`);
      existingByType.forEach((data, key) => {
        console.log(`   ${key}: ${data.theme || 'No theme'} (Letter ${data.targetLetter || 'Any'})`);
      });

    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

testEnhancedDetection();
