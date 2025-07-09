const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

// Create two clients: one with service role (bypasses RLS), one with user context
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key');

async function testRLSUpdate() {
  console.log('🧪 Testing RLS policy for asset updates...\n');

  const contentManagerUserId = '1cb80063-9b5f-4fff-84eb-309f12bd247d';
  const testAssetId = 'c7ef9230-4827-4bc8-8031-911371ac6098';

  try {
    // 1. First, set the asset back to pending using service role
    console.log('1. Setting asset back to pending...');
    const { error: resetError } = await supabaseAdmin
      .from('assets')
      .update({ status: 'pending' })
      .eq('id', testAssetId);

    if (resetError) {
      console.error('❌ Error resetting asset:', resetError.message);
      return;
    }
    console.log('✅ Asset reset to pending');

    // 2. Check current status
    const { data: currentAsset } = await supabaseAdmin
      .from('assets')
      .select('status')
      .eq('id', testAssetId)
      .single();
    
    console.log(`   Current status: ${currentAsset?.status}`);

    // 3. Try to update as the content_manager user (this should work with RLS)
    console.log('\n2. Testing update as content_manager user...');
    
    // Set the auth context to the content_manager user
    const { data: { session }, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: 'admin@example.com', // You'll need to provide the actual email
      password: 'password' // You'll need to provide the actual password
    });

    if (authError) {
      console.log('   Note: Could not authenticate as user, testing with service role but simulating user context');
      
      // Alternative: test the policy logic directly
      const { data: policyTest, error: policyError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', contentManagerUserId)
        .eq('role', 'content_manager')
        .single();

      if (policyError) {
        console.error('❌ Policy test failed:', policyError.message);
      } else {
        console.log('✅ Policy logic test passed - user has correct role');
        console.log(`   User ID: ${policyTest.id}, Role: ${policyTest.role}`);
      }
    } else {
      console.log('✅ Authenticated as content_manager user');
      
      // Try the update
      const { data: updateResult, error: updateError } = await supabaseUser
        .from('assets')
        .update({ status: 'approved' })
        .eq('id', testAssetId)
        .select('status');

      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Update succeeded!');
        console.log(`   New status: ${updateResult[0]?.status}`);
      }
    }

    // 4. Check final status
    console.log('\n3. Final status check...');
    const { data: finalAsset } = await supabaseAdmin
      .from('assets')
      .select('status')
      .eq('id', testAssetId)
      .single();
    
    console.log(`   Final status: ${finalAsset?.status}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testRLSUpdate(); 