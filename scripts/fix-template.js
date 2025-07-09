require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTemplate() {
  console.log('Fixing template and asset...\n');

  const templateId = 'df560d13-272c-4b1f-90cd-6bc599656d13';
  const assetId = 'b0556110-b816-4097-a1a6-31b6e96dd824';

  try {
    // 1. Approve the asset
    console.log('1. Approving asset...');
    const { error: assetError } = await supabase
      .from('assets')
      .update({ status: 'approved' })
      .eq('id', assetId);

    if (assetError) {
      console.error('❌ Asset approval error:', assetError.message);
    } else {
      console.log('✅ Asset approved');
    }

    // 2. Add a part to the template
    console.log('\n2. Adding part to template...');
    const newPart = {
      id: 'intro_part',
      name: 'Intro',
      type: 'intro',
      order: 1,
      duration: 5,
      audio_elements: [],
      image_elements: []
    };

    const { error: templateError } = await supabase
      .from('video_templates')
      .update({ 
        parts: [newPart],
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (templateError) {
      console.error('❌ Template update error:', templateError.message);
    } else {
      console.log('✅ Template updated with intro part');
    }

    // 3. Verify the fixes
    console.log('\n3. Verifying fixes...');
    
    const { data: template } = await supabase
      .from('video_templates')
      .select('parts')
      .eq('id', templateId)
      .single();

    const { data: asset } = await supabase
      .from('assets')
      .select('status')
      .eq('id', assetId)
      .single();

    console.log(`   Template parts: ${template?.parts?.length || 0}`);
    console.log(`   Asset status: ${asset?.status}`);

    if (template?.parts?.length > 0 && asset?.status === 'approved') {
      console.log('\n✅ Ready to test! Both issues are fixed.');
    } else {
      console.log('\n⚠️  Some issues may still exist.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTemplate(); 