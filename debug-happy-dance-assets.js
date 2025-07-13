#!/usr/bin/env node

console.log('🔍 CHECKING HAPPY DANCE VIDEO ASSETS IN DATABASE');
console.log('=================================================');

// This would typically require Supabase client, but let's check the query logic instead
console.log('📋 Asset Detection Logic:');
console.log('   • Looking for videoType = "happyDanceVideo"');
console.log('   • Should match theme-specific videos');
console.log('   • Status should be "ready"');

console.log('\n🎯 Possible Issues:');
console.log('1. No videos with videoType = "happyDanceVideo" in database');
console.log('2. Videos exist but status != "ready"');
console.log('3. Theme mismatch (video theme != selected theme)');
console.log('4. Asset query is not finding the videos');

console.log('\n🔧 Debugging Steps:');
console.log('1. Check Supabase assets table for:');
console.log('   SELECT * FROM assets WHERE "videoType" = \'happyDanceVideo\';');
console.log('');
console.log('2. Check if videos are theme-specific:');
console.log('   SELECT * FROM assets WHERE "videoType" = \'happyDanceVideo\' AND theme = \'your-theme\';');
console.log('');
console.log('3. Check the frontend asset detection query');
console.log('   • Verify isVideoAsset() function includes happyDanceVideo');
console.log('   • Check video detection logic in Letter Hunt page');

console.log('\n💡 Quick Fix Options:');
console.log('A. Create a test happyDanceVideo asset manually');
console.log('B. Check if existing dance videos have wrong videoType');
console.log('C. Verify theme matching logic');

console.log('\n🎪 Expected Asset Structure:');
console.log('{');
console.log('  videoType: "happyDanceVideo",');
console.log('  theme: "monsters", // or whatever theme');
console.log('  assetPurpose: "video",');
console.log('  status: "ready",');
console.log('  url: "https://..."');
console.log('}');
