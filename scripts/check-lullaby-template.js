const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLullabyTemplate() {
  console.log('🔍 Checking for lullaby video template...');

  try {
    // Check if lullaby template exists
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('video_templates')
      .select('*')
      .eq('type', 'lullaby')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching template:', fetchError);
      return;
    }

    if (existingTemplate) {
      console.log('✅ Lullaby template already exists:');
      console.log(`   ID: ${existingTemplate.id}`);
      console.log(`   Name: ${existingTemplate.name}`);
      console.log(`   Type: ${existingTemplate.type}`);
      return existingTemplate.id;
    }

    // Create lullaby template if it doesn't exist
    console.log('📝 Creating lullaby video template...');
    
    const { data: newTemplate, error: createError } = await supabase
      .from('video_templates')
      .insert({
        name: 'Lullaby Fresh Template',
        type: 'lullaby',
        description: 'Personalized lullaby video template with slideshow',
        structure: {
          intro: {
            duration: 5,
            elements: ['intro_audio', 'intro_background']
          },
          slideshow: {
            duration: 30,
            elements: ['background_music', 'slideshow_images']
          },
          outro: {
            duration: 5,
            elements: ['outro_audio', 'outro_background']
          }
        },
        metadata: {
          composition_name: 'LullabyFresh',
          required_assets: [
            'intro_audio',
            'outro_audio', 
            'background_music',
            'intro_background',
            'outro_background',
            'slideshow_images'
          ]
        },
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating template:', createError);
      return;
    }

    console.log('✅ Lullaby template created successfully:');
    console.log(`   ID: ${newTemplate.id}`);
    console.log(`   Name: ${newTemplate.name}`);
    console.log(`   Type: ${newTemplate.type}`);
    
    return newTemplate.id;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Checking lullaby video template setup...\n');
  
  const templateId = await checkLullabyTemplate();
  
  if (templateId) {
    console.log(`\n✅ Template ID for API: ${templateId}`);
    console.log('\nYou can now use this template ID in the generate-lullaby API endpoint.');
  } else {
    console.log('\n❌ Failed to setup lullaby template');
  }
}

main().catch(console.error); 