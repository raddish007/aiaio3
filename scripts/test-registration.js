const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  try {
    console.log('Testing registration...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Try to create a test user in auth
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log('Creating test user:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          role: 'parent',
        },
      },
    });
    
    if (authError) {
      console.error('Auth signup failed:', authError);
      return;
    }
    
    console.log('✅ Auth user created:', authData.user?.id);
    
    // Test 3: Try to insert into users table
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testEmail,
          name: 'Test User',
          role: 'parent',
          password_hash: 'hashed_by_auth',
        });
      
      if (userError) {
        console.error('❌ Users table insert failed:', userError);
        return;
      }
      
      console.log('✅ Users table insert successful');
    }
    
    // Test 4: Clean up - delete the test user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', testEmail);
    
    if (deleteError) {
      console.error('Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test user cleaned up');
    }
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration(); 