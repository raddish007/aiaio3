const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAsset(assetId) {
  try {
    console.log(`Checking asset: ${assetId}`);
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('Error fetching asset:', error);
      return;
    }

    if (!data) {
      console.log('Asset not found');
      return;
    }

    console.log('\n=== Asset Details ===');
    console.log(`ID: ${data.id}`);
    console.log(`Theme: ${data.theme}`);
    console.log(`Type: ${data.type}`);
    console.log(`Status: ${data.status}`);
    console.log(`Created: ${data.created_at}`);
    
    if (data.metadata) {
      console.log('\n=== Metadata ===');
      console.log(`Description: ${data.metadata.description || 'N/A'}`);
      console.log(`Audio Class: ${data.metadata.audio_class || 'N/A'}`);
      console.log(`Letter: ${data.metadata.letter || 'N/A'}`);
      console.log(`Child Name: ${data.metadata.child_name || 'N/A'}`);
      console.log(`Template: ${data.metadata.template || 'N/A'}`);
      console.log(`Personalization: ${data.metadata.personalization || 'N/A'}`);
      
      if (data.metadata.template_context) {
        console.log('\n=== Template Context ===');
        console.log(`Template Type: ${data.metadata.template_context.template_type || 'N/A'}`);
        console.log(`Asset Purpose: ${data.metadata.template_context.asset_purpose || 'N/A'}`);
        console.log(`Child Name: ${data.metadata.template_context.child_name || 'N/A'}`);
      }
    }

    if (data.tags && data.tags.length > 0) {
      console.log(`\nTags: ${data.tags.join(', ')}`);
    }

    // Check if this matches NameVideo letter audio criteria
    if (data.type === 'audio' && data.metadata?.audio_class === 'letter_audio') {
      console.log('\n✅ This asset matches letter audio criteria!');
      console.log(`Letter: ${data.metadata.letter || 'N/A'}`);
    } else {
      console.log('\n❌ This asset does NOT match letter audio criteria');
      console.log('Expected: type=audio, audio_class=letter_audio');
      console.log(`Found: type=${data.type}, audio_class=${data.metadata?.audio_class || 'N/A'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

const assetId = process.argv[2];
if (!assetId) {
  console.error('Please provide an asset ID');
  process.exit(1);
}

checkAsset(assetId); 