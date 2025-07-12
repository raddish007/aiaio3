require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function approvePendingLetterHuntAssets() {
  console.log('🔍 Finding pending Letter Hunt assets to approve...');
  
  // Find all pending Letter Hunt assets
  const { data: pendingAssets, error: fetchError } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'pending')
    .eq('metadata->>template', 'letter-hunt')
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    console.error('❌ Error fetching pending assets:', fetchError);
    return;
  }
  
  console.log(`📦 Found ${pendingAssets.length} pending Letter Hunt assets to approve:`);
  
  for (const asset of pendingAssets) {
    console.log(`\n⏳ Approving asset ${asset.id}...`);
    console.log(`   📅 Created: ${new Date(asset.created_at).toLocaleString()}`);
    console.log(`   👶 Child: ${asset.metadata?.child_name}`);
    console.log(`   🔧 Asset Purpose: ${asset.metadata?.assetPurpose}`);
    console.log(`   📄 Script: ${asset.metadata?.script?.substring(0, 50)}...`);
    
    const { error: updateError } = await supabase
      .from('assets')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id);
    
    if (updateError) {
      console.error(`❌ Error approving asset ${asset.id}:`, updateError);
    } else {
      console.log(`✅ Successfully approved asset ${asset.id}`);
    }
  }
}

async function main() {
  await approvePendingLetterHuntAssets();
  console.log('\n🎉 Asset approval process complete!');
  process.exit(0);
}

main().catch(console.error);
