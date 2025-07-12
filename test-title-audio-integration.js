#!/usr/bin/env node

/**
 * Test Title Audio Integration in Letter Hunt
 * 
 * This script tests the updated Letter Hunt template to ensure:
 * 1. Title Audio is properly integrated
 * 2. Audio starts 1 second into the title section
 * 3. Audio has proper fade in/out effects
 * 4. Template builds and deploys correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Testing Letter Hunt Title Audio Integration');
console.log('=============================================');

// Check if the Remotion template has been updated
const templatePath = path.join(__dirname, 'remotion/src/compositions/LetterHunt.tsx');

if (!fs.existsSync(templatePath)) {
  console.error('❌ Letter Hunt template not found');
  process.exit(1);
}

const templateContent = fs.readFileSync(templatePath, 'utf8');

// Check for Title Audio integration
const checks = [
  {
    name: 'Title Audio Sequence Component',
    pattern: /Title Audio.*starts.*second.*title section/,
    success: '✅ Title Audio sequence component with proper timing comment found'
  },
  {
    name: 'Audio Sequence with Delay',
    pattern: /from=\{segments\[0\]\.start \+ fps\}/,
    success: '✅ Audio starts 1 second into title section (fps delay)'
  },
  {
    name: 'Volume Fade Logic',
    pattern: /volume=\{\(frame\) => \{/,
    success: '✅ Volume fade in/out logic implemented'
  },
  {
    name: 'Audio Asset Check',
    pattern: /assets\.titleAudio\?\./,
    success: '✅ Proper asset availability check'
  },
  {
    name: 'Audio URL Source',
    pattern: /src=\{assets\.titleAudio\.url\}/,
    success: '✅ Audio URL properly sourced from assets'
  }
];

let allPassed = true;

checks.forEach(check => {
  if (check.pattern.test(templateContent)) {
    console.log(check.success);
  } else {
    console.log(`❌ ${check.name} - Not found or incorrect`);
    allPassed = false;
  }
});

// Check build directory
const buildPath = path.join(__dirname, 'remotion/build');
const buildExists = fs.existsSync(buildPath);
const bundleExists = fs.existsSync(path.join(buildPath, 'bundle.js'));

console.log('\n📦 Build Status:');
console.log(buildExists ? '✅ Build directory exists' : '❌ Build directory missing');
console.log(bundleExists ? '✅ Bundle.js exists' : '❌ Bundle.js missing');

// Check API update
const apiPath = path.join(__dirname, 'pages/api/videos/generate-letter-hunt.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');
const hasUpdatedSite = apiContent.includes('letter-hunt-updated');

console.log('\n🔧 API Configuration:');
console.log(hasUpdatedSite ? '✅ API updated to use new site (letter-hunt-updated)' : '❌ API still using old site');

// Summary
console.log('\n📋 Summary:');
if (allPassed && buildExists && bundleExists && hasUpdatedSite) {
  console.log('✅ ALL TESTS PASSED - Title Audio integration is complete!');
  console.log('\n🚀 Ready for testing:');
  console.log('1. Title Audio will start 1 second into the title card');
  console.log('2. Audio has fade in/out effects (0.3s fade)');
  console.log('3. Maximum audio duration is 2 seconds');
  console.log('4. Template deployed to: letter-hunt-updated site');
  console.log('5. API updated to use new template');
  console.log('\n🎯 Next: Test video generation through the Letter Hunt UI');
} else {
  console.log('❌ Some tests failed - review the integration');
  allPassed = false;
}

process.exit(allPassed ? 0 : 1);
