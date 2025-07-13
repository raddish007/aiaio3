#!/usr/bin/env node

console.log('🔍 DEBUGGING LETTER HUNT DURATION ISSUE');
console.log('=======================================');

// Match the exact calculation from LetterHunt.tsx
const standardDuration = 90; // 3 seconds * 30fps
const introDuration = 165; // 5.5 seconds * 30fps
const extendedDuration = 120; // 4 seconds * 30fps
const happyDanceEndingDuration = 165; // 5.5 seconds * 30fps

const segments = [
  { name: 'titleCard', start: 0, duration: standardDuration },
  { name: 'intro', start: standardDuration, duration: introDuration },
  { name: 'intro2', start: standardDuration + introDuration, duration: introDuration },
  { name: 'sign', start: standardDuration + introDuration + introDuration, duration: extendedDuration },
  { name: 'book', start: standardDuration + introDuration + introDuration + extendedDuration, duration: extendedDuration },
  { name: 'grocery', start: standardDuration + introDuration + introDuration + extendedDuration * 2, duration: extendedDuration },
  { name: 'happyDance', start: standardDuration + introDuration + introDuration + extendedDuration * 3, duration: happyDanceEndingDuration },
  { name: 'ending', start: standardDuration + introDuration + introDuration + extendedDuration * 3 + happyDanceEndingDuration, duration: happyDanceEndingDuration }
];

console.log('📊 Segment Calculation Check:');
segments.forEach((segment, index) => {
  const startSeconds = (segment.start / 30).toFixed(1);
  const durationSeconds = (segment.duration / 30).toFixed(1);
  const endSeconds = ((segment.start + segment.duration) / 30).toFixed(1);
  
  console.log(`${index + 1}. ${segment.name.padEnd(12)} | Start: ${segment.start.toString().padStart(4)} frames (${startSeconds}s) | Duration: ${segment.duration} frames (${durationSeconds}s) | End: ${(segment.start + segment.duration).toString().padStart(4)} frames (${endSeconds}s)`);
});

const calculatedTotalFrames = segments[segments.length - 1].start + segments[segments.length - 1].duration;
const calculatedTotalSeconds = calculatedTotalFrames / 30;

console.log(`\n🕐 Calculated Total: ${calculatedTotalFrames} frames = ${calculatedTotalSeconds} seconds`);

// Check what Root.tsx says
const fs = require('fs');
const rootContent = fs.readFileSync('./remotion/src/Root.tsx', 'utf8');
const rootDurationMatch = rootContent.match(/durationInFrames=\{(\d+)\}/);

if (rootDurationMatch) {
  const rootFrames = parseInt(rootDurationMatch[1]);
  const rootSeconds = rootFrames / 30;
  console.log(`📄 Root.tsx says: ${rootFrames} frames = ${rootSeconds} seconds`);
  
  if (calculatedTotalFrames === rootFrames) {
    console.log('✅ Calculation matches Root.tsx');
  } else {
    console.log(`❌ MISMATCH! Calculation: ${calculatedTotalFrames}, Root: ${rootFrames}`);
  }
} else {
  console.log('❌ Could not find duration in Root.tsx');
}

console.log('\n🚨 POTENTIAL ISSUES:');

// Check if 29 seconds matches any segment end
segments.forEach((segment, index) => {
  const endTime = (segment.start + segment.duration) / 30;
  if (Math.abs(endTime - 29) < 0.5) {
    console.log(`⚠️  Segment ${index + 1} (${segment.name}) ends at ${endTime}s - close to 29s!`);
  }
});

// 29 seconds = 870 frames
const endAt870 = segments.find(segment => {
  const endFrame = segment.start + segment.duration;
  return Math.abs(endFrame - 870) < 10;
});

if (endAt870) {
  console.log(`🔴 FOUND ISSUE: Something ends at ~870 frames (29s)`);
} else {
  console.log('✅ No segments end at 29 seconds');
}

console.log('\n💡 NEXT STEPS:');
console.log('1. Check if Lambda is using old cached composition');
console.log('2. Verify actual renderMediaOnLambda call parameters');
console.log('3. Check Lambda function logs for duration override');
console.log('4. Test with local Remotion preview first');
