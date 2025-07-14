const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugLullabyMetadata() {
  console.log('🔍 Debugging Lullaby Asset Metadata...\n');

  try {
    // Check intro/outro assets metadata
    console.log('1️⃣ Intro/Outro Assets Metadata:');
    const { data: introOutroAssets, error: introOutroError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`);

    if (introOutroError) {
      console.error('❌ Error:', introOutroError);
    } else {
      introOutroAssets?.forEach(asset => {
        console.log(`\n🖼️  Asset ${asset.id.slice(-8)}:`);
        console.log(`  Type: ${asset.type}`);
        console.log(`  Asset Class: ${asset.metadata?.asset_class || asset.metadata?.imageType}`);
        console.log(`  Template: ${asset.metadata?.template}`);
        console.log(`  Child Theme: ${asset.metadata?.child_theme || 'NOT SET'}`);
        console.log(`  Theme: ${asset.theme || 'NOT SET'}`);
        console.log(`  Full Metadata:`, JSON.stringify(asset.metadata, null, 2));
      });
    }

    // Check bedtime scene assets metadata
    console.log('\n2️⃣ Bedtime Scene Assets Metadata:');
    const { data: bedtimeAssets, error: bedtimeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`);

    if (bedtimeError) {
      console.error('❌ Error:', bedtimeError);
    } else {
      bedtimeAssets?.forEach(asset => {
        console.log(`\n🌙 Asset ${asset.id.slice(-8)}:`);
        console.log(`  Type: ${asset.type}`);
        console.log(`  Asset Class: ${asset.metadata?.asset_class || asset.metadata?.imageType}`);
        console.log(`  Template: ${asset.metadata?.template || 'NOT SET'}`);
        console.log(`  Child Theme: ${asset.metadata?.child_theme || 'NOT SET'}`);
        console.log(`  Theme: ${asset.theme || 'NOT SET'}`);
        console.log(`  Full Metadata:`, JSON.stringify(asset.metadata, null, 2));
      });
    }

    // Check dog theme assets with all_ok safe_zone
    console.log('\n3️⃣ Dog Theme Assets with all_ok safe_zone:');
    const { data: dogAssets, error: dogError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', '%dog%');

    if (dogError) {
      console.error('❌ Error:', dogError);
    } else {
      const allOkAssets = dogAssets?.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        if (Array.isArray(safeZones)) {
          return safeZones.includes('all_ok');
        } else if (typeof safeZones === 'string') {
          return safeZones.includes('all_ok');
        } else if (safeZones && typeof safeZones === 'object') {
          return JSON.stringify(safeZones).includes('all_ok');
        }
        return false;
      });

      console.log(`Found ${allOkAssets?.length || 0} dog theme assets with all_ok safe_zone`);
      allOkAssets?.slice(0, 3).forEach(asset => {
        console.log(`\n🎯 Asset ${asset.id.slice(-8)}:`);
        console.log(`  Theme: ${asset.theme}`);
        console.log(`  Safe Zones: ${JSON.stringify(asset.metadata?.review?.safe_zone)}`);
        console.log(`  Asset Class: ${asset.metadata?.asset_class || asset.metadata?.imageType || 'NOT SET'}`);
        console.log(`  Template: ${asset.metadata?.template || 'NOT SET'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLullabyMetadata(); 