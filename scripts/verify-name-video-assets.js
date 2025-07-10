const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAssets() {
  console.log('🔍 Verifying NameVideo assets...\n');

  const assets = {
    // Letter Images
    letterImages: [
      '7e06e960-3efd-49de-b020-505736638698',
      '3e94b546-7e07-4215-9859-e22228d86a52', 
      '4aaaa489-d602-46e9-846f-04560b1ef183',
      '703c642d-8a64-42cf-9177-1c60558ce457'
    ],
    // Name Audio (intro/outro)
    nameAudio: '7a7e07cf-6b0f-4c07-a63b-e4bb05fe9783',
    // Letter Audios
    letterAudios: [
      '3f1fb53a-8977-46c6-b26e-5c6403cb6e74', // N
      'c7fc5bd5-c888-423b-84f2-f4e994e92626', // O
      'c6f8b267-9100-4f5b-9952-0e2870c82659', // L
      'd27d4d6a-a2bc-4995-bbe6-91050e891d1d'  // A
    ],
    // Background Music
    backgroundMusic: 'f7365c71-cd52-44d2-b289-02bdc6e74c74'
  };

  try {
    // Check letter images
    console.log('1. Checking letter images...');
    const { data: letterImages, error: letterImagesError } = await supabase
      .from('assets')
      .select('id, theme, type, status, file_url, metadata')
      .in('id', assets.letterImages);

    if (letterImagesError) {
      console.error('❌ Error fetching letter images:', letterImagesError);
    } else {
      console.log(`✅ Found ${letterImages.length} letter images:`);
      letterImages.forEach(img => {
        console.log(`   - ${img.id}: ${img.theme} (${img.status})`);
        console.log(`     URL: ${img.file_url ? '✅ Present' : '❌ Missing'}`);
        console.log(`     Safe zone: ${img.metadata?.review?.safe_zone?.join(', ') || 'Not set'}`);
      });
    }

    // Check name audio
    console.log('\n2. Checking name audio...');
    const { data: nameAudio, error: nameAudioError } = await supabase
      .from('assets')
      .select('id, theme, type, status, file_url, metadata')
      .eq('id', assets.nameAudio)
      .single();

    if (nameAudioError) {
      console.error('❌ Error fetching name audio:', nameAudioError);
    } else {
      console.log('✅ Name audio found:');
      console.log(`   - ${nameAudio.id}: ${nameAudio.theme} (${nameAudio.status})`);
      console.log(`   - Audio class: ${nameAudio.metadata?.audio_class}`);
      console.log(`   - Child name: ${nameAudio.metadata?.child_name}`);
      console.log(`   - URL: ${nameAudio.file_url ? '✅ Present' : '❌ Missing'}`);
    }

    // Check letter audios
    console.log('\n3. Checking letter audios...');
    const { data: letterAudios, error: letterAudiosError } = await supabase
      .from('assets')
      .select('id, theme, type, status, file_url, metadata')
      .in('id', assets.letterAudios);

    if (letterAudiosError) {
      console.error('❌ Error fetching letter audios:', letterAudiosError);
    } else {
      console.log(`✅ Found ${letterAudios.length} letter audios:`);
      letterAudios.forEach(audio => {
        console.log(`   - ${audio.id}: ${audio.theme} (${audio.status})`);
        console.log(`     Letter: ${audio.metadata?.letter}`);
        console.log(`     Audio class: ${audio.metadata?.audio_class}`);
        console.log(`     URL: ${audio.file_url ? '✅ Present' : '❌ Missing'}`);
      });
    }

    // Check background music
    console.log('\n4. Checking background music...');
    const { data: bgMusic, error: bgMusicError } = await supabase
      .from('assets')
      .select('id, theme, type, status, file_url, metadata')
      .eq('id', assets.backgroundMusic)
      .single();

    if (bgMusicError) {
      console.error('❌ Error fetching background music:', bgMusicError);
    } else {
      console.log('✅ Background music found:');
      console.log(`   - ${bgMusic.id}: ${bgMusic.theme} (${bgMusic.status})`);
      console.log(`   - URL: ${bgMusic.file_url ? '✅ Present' : '❌ Missing'}`);
    }

    // Test URL accessibility
    console.log('\n5. Testing URL accessibility...');
    const allUrls = [
      ...letterImages.map(img => img.file_url),
      nameAudio.file_url,
      ...letterAudios.map(audio => audio.file_url),
      bgMusic.file_url
    ].filter(url => url);

    console.log(`Testing ${allUrls.length} URLs...`);
    
    for (const url of allUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ ${url.split('/').pop()}`);
        } else {
          console.log(`   ❌ ${url.split('/').pop()} (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ ${url.split('/').pop()} (Network error)`);
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    const totalAssets = assets.letterImages.length + 1 + assets.letterAudios.length + 1;
    const foundAssets = (letterImages?.length || 0) + (nameAudio ? 1 : 0) + (letterAudios?.length || 0) + (bgMusic ? 1 : 0);
    console.log(`   Total assets needed: ${totalAssets}`);
    console.log(`   Assets found: ${foundAssets}`);
    console.log(`   Missing: ${totalAssets - foundAssets}`);

    if (foundAssets === totalAssets) {
      console.log('\n🎉 All assets are present and should work!');
    } else {
      console.log('\n⚠️ Some assets are missing - this could cause render issues.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyAssets(); 