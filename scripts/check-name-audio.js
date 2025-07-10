const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNameAudio() {
  console.log('🔍 Checking for name audio assets...\n');

  try {
    // Check for the specific Nolan asset
    console.log('1. Checking specific asset ID: 4b5b49e6-0fe3-44d8-98f9-d8218019361b');
    const { data: specificAsset, error: specificError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '4b5b49e6-0fe3-44d8-98f9-d8218019361b')
      .single();

    if (specificError) {
      console.error('❌ Error fetching specific asset:', specificError);
    } else {
      console.log('✅ Found specific asset:');
      console.log('   ID:', specificAsset.id);
      console.log('   Type:', specificAsset.type);
      console.log('   Status:', specificAsset.status);
      console.log('   Theme:', specificAsset.theme);
      console.log('   Audio Class:', specificAsset.metadata?.audio_class);
      console.log('   Child Name:', specificAsset.metadata?.child_name);
      console.log('   File URL:', specificAsset.file_url ? '✅ Present' : '❌ Missing');
    }

    console.log('\n2. Checking for all name_audio assets:');
    const { data: nameAudioAssets, error: nameAudioError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .eq('metadata->>audio_class', 'name_audio');

    if (nameAudioError) {
      console.error('❌ Error fetching name_audio assets:', nameAudioError);
    } else {
      console.log(`✅ Found ${nameAudioAssets.length} name_audio assets:`);
      nameAudioAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ID: ${asset.id}`);
        console.log(`      Child Name: ${asset.metadata?.child_name || 'Not set'}`);
        console.log(`      Theme: ${asset.theme}`);
        console.log(`      File URL: ${asset.file_url ? '✅ Present' : '❌ Missing'}`);
      });
    }

    console.log('\n3. Checking for Nolan-specific name_audio:');
    const { data: nolanAssets, error: nolanError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .eq('metadata->>audio_class', 'name_audio')
      .eq('metadata->>child_name', 'Nolan');

    if (nolanError) {
      console.error('❌ Error fetching Nolan name_audio:', nolanError);
    } else {
      console.log(`✅ Found ${nolanAssets.length} name_audio assets for Nolan:`);
      nolanAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ID: ${asset.id}`);
        console.log(`      Theme: ${asset.theme}`);
        console.log(`      File URL: ${asset.file_url ? '✅ Present' : '❌ Missing'}`);
      });
    }

    console.log('\n4. Checking for any assets with child_name = "Nolan":');
    const { data: allNolanAssets, error: allNolanError } = await supabase
      .from('assets')
      .select('*')
      .eq('metadata->>child_name', 'Nolan');

    if (allNolanError) {
      console.error('❌ Error fetching all Nolan assets:', allNolanError);
    } else {
      console.log(`✅ Found ${allNolanAssets.length} total assets for Nolan:`);
      allNolanAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ID: ${asset.id}`);
        console.log(`      Type: ${asset.type}`);
        console.log(`      Status: ${asset.status}`);
        console.log(`      Audio Class: ${asset.metadata?.audio_class || 'Not set'}`);
        console.log(`      Theme: ${asset.theme}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkNameAudio(); 