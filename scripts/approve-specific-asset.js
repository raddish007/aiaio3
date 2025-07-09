const { createClient } = require('@supabase/supabase-js');

// Direct environment variables (you can also set these in your shell)
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function approveAsset(assetId) {
  console.log(`🔍 Approving asset: ${assetId}`);
  
  try {
    // First, check the current status
    const { data: currentAsset, error: fetchError } = await supabase
      .from('assets')
      .select('id, theme, type, status, created_at')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching asset:', fetchError.message);
      return;
    }

    if (!currentAsset) {
      console.error('❌ Asset not found');
      return;
    }

    console.log('📋 Current asset info:');
    console.log(`   ID: ${currentAsset.id}`);
    console.log(`   Theme: ${currentAsset.theme}`);
    console.log(`   Type: ${currentAsset.type}`);
    console.log(`   Current Status: ${currentAsset.status}`);
    console.log(`   Created: ${currentAsset.created_at}`);

    // Update the status to approved (no updated_at)
    const { data: updatedAsset, error: updateError } = await supabase
      .from('assets')
      .update({ 
        status: 'approved'
      })
      .eq('id', assetId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('❌ Error updating asset:', updateError.message);
      return;
    }

    console.log('✅ Asset approved successfully!');
    console.log(`   New Status: ${updatedAsset.status}`);

    // Verify the update
    const { data: verifyAsset, error: verifyError } = await supabase
      .from('assets')
      .select('status')
      .eq('id', assetId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
    } else {
      console.log(`🔍 Verification: Asset status is now "${verifyAsset.status}"`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// The specific asset ID you provided
const assetId = 'c7ef9230-4827-4bc8-8031-911371ac6098';

console.log('🚀 Starting asset approval process...\n');
approveAsset(assetId); 