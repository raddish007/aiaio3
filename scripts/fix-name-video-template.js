require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNameVideoTemplate() {
  console.log('🔧 Fixing NameVideo template configuration...\n');

  const templateId = 'dcf10e2a-d7df-4e72-ab25-d6c9b1f00bd8';

  try {
    // First, check current template
    console.log('📋 Current template configuration:');
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('video_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching template:', fetchError.message);
      return;
    }

    console.log(JSON.stringify(currentTemplate, null, 2));

    // Update template with proper configuration
    console.log('\n🔄 Updating template...');
    const updatedTemplate = {
      structure: {
        composition_id: 'NameVideo',
        total_duration: 15,
        parts_count: 3,
        requires_letter_assets: true,
        requires_background_music: true
      },
      parts: [
        {
          id: 'intro',
          name: 'Introduction',
          type: 'intro',
          order: 1,
          duration: 3,
          audio_elements: [],
          image_elements: []
        },
        {
          id: 'name_spelling',
          name: 'Name Spelling',
          type: 'main',
          order: 2,
          duration: 10,
          audio_elements: [
            {
              id: 'letter_audio',
              type: 'audio',
              required: true,
              asset_type: 'letter_audio',
              description: 'Letter pronunciation audio',
              asset_purpose: 'letter_sound'
            }
          ],
          image_elements: [
            {
              id: 'letter_image',
              type: 'image',
              required: true,
              asset_type: 'letter_image',
              description: 'Letter image',
              asset_purpose: 'letter_visual'
            }
          ]
        },
        {
          id: 'outro',
          name: 'Outro',
          type: 'outro',
          order: 3,
          duration: 2,
          audio_elements: [],
          image_elements: []
        }
      ],
      global_elements: [
        {
          id: 'background_music',
          type: 'audio',
          required: true,
          asset_type: 'specific',
          description: 'Background music',
          asset_purpose: 'bg_music',
          specific_asset_id: '2095fd08-1cb1-4373-bafa-f6115dd7dad2', // Dream Drip music
          specific_asset_name: 'Dream Drip'
        }
      ]
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('video_templates')
      .update(updatedTemplate)
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating template:', updateError.message);
      return;
    }

    console.log('✅ Template updated successfully!');
    console.log('\n📋 Updated template configuration:');
    console.log(JSON.stringify(updatedData, null, 2));

    // Verify the update
    console.log('\n🔍 Verifying template configuration:');
    console.log(`   Composition ID: ${updatedData.structure?.composition_id}`);
    console.log(`   Parts Count: ${updatedData.parts?.length || 0}`);
    console.log(`   Global Elements Count: ${updatedData.global_elements?.length || 0}`);
    console.log(`   Structure: ${JSON.stringify(updatedData.structure)}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixNameVideoTemplate(); 