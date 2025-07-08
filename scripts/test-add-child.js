const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAddChild() {
  console.log('🧪 Testing Add Child Functionality...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('children')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // 2. Test RLS policies by trying to insert without auth
    console.log('2. Testing RLS policies (should fail without auth)...');
    const { data: insertData, error: insertError } = await supabase
      .from('children')
      .insert({
        parent_id: 'test-user-id',
        name: 'Test Child',
        age: 3,
        primary_interest: 'halloween'
      })
      .select();

    if (insertError) {
      console.log('✅ RLS policy working correctly (insert blocked without auth)');
      console.log('   Error:', insertError.message);
    } else {
      console.log('❌ RLS policy not working (insert succeeded without auth)');
    }
    console.log('');

    // 3. Test user authentication
    console.log('3. Testing user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (expected for test script)');
      console.log('   Error:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
      
      // 4. Test child creation with authenticated user
      console.log('\n4. Testing child creation with authenticated user...');
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          name: 'Test Child',
          age: 3,
          primary_interest: 'halloween'
        })
        .select();

      if (childError) {
        console.error('❌ Child creation failed:', childError.message);
      } else {
        console.log('✅ Child created successfully:', childData);
        
        // Clean up test data
        console.log('\n5. Cleaning up test data...');
        const { error: deleteError } = await supabase
          .from('children')
          .delete()
          .eq('id', childData[0].id);
        
        if (deleteError) {
          console.error('❌ Failed to clean up test data:', deleteError.message);
        } else {
          console.log('✅ Test data cleaned up successfully');
        }
      }
    } else {
      console.log('ℹ️  No authenticated user found');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAddChild().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 