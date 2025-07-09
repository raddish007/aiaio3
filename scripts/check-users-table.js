const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...\n');

  try {
    // Get a sample user to see the structure
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    if (users && users.length > 0) {
      const user = users[0];
      console.log('📋 User table columns:');
      Object.keys(user).forEach(key => {
        console.log(`   - ${key}: ${typeof user[key]} (${user[key]})`);
      });
    } else {
      console.log('No users found');
    }

    // Try to get user names with different column combinations
    console.log('\n🧪 Testing different column combinations...');
    
    // Test 1: Just id and email
    const { data: test1, error: error1 } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    console.log('Test 1 (id, email):', error1 ? '❌ ' + error1.message : '✅ Success');

    // Test 2: id, email, name
    const { data: test2, error: error2 } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(1);
    
    console.log('Test 2 (id, email, name):', error2 ? '❌ ' + error2.message : '✅ Success');

    // Test 3: id, email, full_name
    const { data: test3, error: error3 } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(1);
    
    console.log('Test 3 (id, email, full_name):', error3 ? '❌ ' + error3.message : '✅ Success');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkUsersTable(); 