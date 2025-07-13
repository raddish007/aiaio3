#!/usr/bin/env node

// This script verifies that the Root.tsx composition has the correct duration
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Root.tsx composition duration...');

const rootPath = path.join(__dirname, 'remotion/src/Root.tsx');
const rootContent = fs.readFileSync(rootPath, 'utf8');

// Look for durationInFrames in LetterHunt composition
const letterHuntMatch = rootContent.match(/id="LetterHunt"[\s\S]*?durationInFrames=\{(\d+)\}/);

if (letterHuntMatch) {
  const frames = parseInt(letterHuntMatch[1]);
  const seconds = frames / 30;
  
  console.log(`✅ Found LetterHunt composition duration:`);
  console.log(`   Frames: ${frames}`);
  console.log(`   Seconds: ${seconds}`);
  
  if (frames === 1110) {
    console.log('✅ Duration is correct (37 seconds)');
  } else {
    console.log(`❌ Duration is incorrect. Expected 1110 frames (37s), got ${frames} frames (${seconds}s)`);
  }
} else {
  console.log('❌ Could not find LetterHunt composition duration in Root.tsx');
}

// Also check the comment to verify our changes
const commentMatch = rootContent.match(/37 seconds at 30fps/);
if (commentMatch) {
  console.log('✅ Found correct duration comment');
} else {
  console.log('⚠️  Duration comment may not be updated');
}

console.log('\n🔧 Recommendation:');
console.log('   The issue might be Lambda caching. Try:');
console.log('   1. Clear Lambda cache');
console.log('   2. Use a new site name');
console.log('   3. Check if the serveUrl is using the correct site');
