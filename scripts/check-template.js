require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplate() {
  console.log('Checking specific template and asset...\n');

  const templateId = 'df560d13-272c-4b1f-90cd-6bc599656d13';
  const assetId = 'b0556110-b816-4097-a1a6-31b6e96dd824';
  const userId = '1cb80063-9b5f-4fff-84eb-309f12bd247d';

  try {
    // Check template
    console.log('1. Checking template...');
    const { data: template, error: templateError } = await supabase
      .from('video_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error('❌ Template error:', templateError.message);
    } else {
      console.log('✅ Template found:', template.name);
      console.log(`   Type: ${template.template_type}`);
      console.log(`   Global elements: ${template.global_elements?.length || 0}`);
      console.log(`   Parts: ${template.parts?.length || 0}`);
      console.log(`   Template data:`, JSON.stringify(template, null, 2));
    }

    // Check asset
    console.log('\n2. Checking asset...');
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError) {
      console.error('❌ Asset error:', assetError.message);
    } else {
      console.log('✅ Asset found:', asset.theme);
      console.log(`   Type: ${asset.type}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   File URL: ${asset.file_url}`);
    }

    // Check user
    console.log('\n3. Checking user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User error:', userError.message);
    } else {
      console.log('✅ User found:', user.name);
      console.log(`   Role: ${user.role}`);
    }

    // Check if template has parts
    if (template && (!template.parts || template.parts.length === 0)) {
      console.log('\n⚠️  TEMPLATE HAS NO PARTS! This will cause the API to fail.');
      console.log('   You need to add at least one part to the template.');
    }

    // Check if asset is approved
    if (asset && asset.status !== 'approved') {
      console.log('\n⚠️  ASSET IS NOT APPROVED! This will cause the API to fail.');
      console.log(`   Asset status: ${asset.status}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkTemplate(); 