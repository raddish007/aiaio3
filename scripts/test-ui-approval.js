const { createClient } = require('@supabase/supabase-js');

// Use the same client setup as the UI (with anon key, not service role)
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, anonKey);

async function testUIApproval() {
  console.log('🧪 Testing UI approval logic...\n');

  const testAssetId = 'c7ef9230-4827-4bc8-8031-911371ac6098';

  try {
    // 1. Get current user (this is what the UI does)
    console.log('1. Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ No user authenticated');
      return;
    }

    console.log('✅ User authenticated:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // 2. Get current asset metadata (this is what the UI does)
    console.log('\n2. Getting current asset metadata...');
    const { data: currentAsset, error: assetError } = await supabase
      .from('assets')
      .select('metadata')
      .eq('id', testAssetId)
      .single();

    if (assetError) {
      console.error('❌ Error getting asset:', assetError.message);
      return;
    }

    console.log('✅ Asset metadata retrieved');

    // 3. Try the update (this is what the UI does)
    console.log('\n3. Attempting update...');
    const { data: updateResult, error: updateError } = await supabase
      .from('assets')
      .update({ 
        status: 'approved',
        metadata: {
          ...currentAsset?.metadata,
          review: {
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id
          }
        }
      })
      .eq('id', testAssetId)
      .select('id, status');

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      console.error('   Error details:', updateError);
      
      // Check if it's an RLS error
      if (updateError.message.includes('policy') || updateError.message.includes('row-level security')) {
        console.log('\n🔒 This appears to be an RLS policy issue!');
        console.log('   The user may not have the correct role or permissions.');
      }
    } else {
      console.log('✅ Update succeeded!');
      console.log(`   New status: ${updateResult[0]?.status}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testUIApproval(); 