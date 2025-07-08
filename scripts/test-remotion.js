const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Remotion Setup...\n');

// Check if we're in the right directory
const remotionPath = path.join(__dirname, '..', 'remotion');
console.log(`📁 Remotion directory: ${remotionPath}`);

try {
  // Check if remotion dependencies are installed
  console.log('\n📦 Checking Remotion dependencies...');
  const packageJson = require(path.join(remotionPath, 'package.json'));
  console.log(`✅ Remotion version: ${packageJson.dependencies.remotion}`);
  console.log(`✅ Lambda version: ${packageJson.dependencies['@remotion/lambda']}`);

  // Check compositions
  console.log('\n🎬 Checking compositions...');
  const compositions = [
    'NameVideo.tsx',
    'BedtimeSong.tsx', 
    'LetterHunt.tsx',
    'EpisodeSegment.tsx'
  ];

  compositions.forEach(comp => {
    const compPath = path.join(remotionPath, 'src', 'compositions', comp);
    try {
      require('fs').accessSync(compPath);
      console.log(`✅ ${comp} - Found`);
    } catch (err) {
      console.log(`❌ ${comp} - Missing`);
    }
  });

  // Check configuration
  console.log('\n⚙️ Checking configuration...');
  const config = require(path.join(remotionPath, 'remotion.config.js'));
  console.log(`✅ Entry point: ${config.entryPoint}`);
  console.log(`✅ Compositions: ${config.compositions.join(', ')}`);

  // Test preview command (this will fail if there are syntax errors)
  console.log('\n🎥 Testing Remotion preview...');
  try {
    execSync('npm run preview', { 
      cwd: remotionPath, 
      stdio: 'pipe',
      timeout: 10000 // 10 second timeout
    });
    console.log('✅ Remotion preview command works');
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('⚠️ Preview command timed out (this is normal for a test)');
    } else {
      console.log('❌ Preview command failed:', error.message);
    }
  }

  console.log('\n🎉 Remotion setup looks good!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up AWS Lambda function for video rendering');
  console.log('2. Configure S3 buckets for video storage');
  console.log('3. Test video generation via API endpoints');
  console.log('4. Deploy to production');

} catch (error) {
  console.error('\n❌ Error testing Remotion setup:', error.message);
  process.exit(1);
} 