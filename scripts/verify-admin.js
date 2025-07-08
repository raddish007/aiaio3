const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAdmin() {
  try {
    console.log('=== Verifying Admin Access ===');
    
    // Test 1: Check if we can access users table
    console.log('\n1. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@aiaio.com');
    
    if (usersError) {
      console.error('Users table error:', usersError);
    } else {
      console.log(`Found ${users.length} admin users:`);
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Test 2: Check if we can access children table
    console.log('\n2. Testing children table access...');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .limit(5);
    
    if (childrenError) {
      console.error('Children table error:', childrenError);
    } else {
      console.log(`Found ${children.length} children (showing first 5):`);
      children.forEach(child => {
        console.log(`- ${child.name} (${child.age} years) - Parent ID: ${child.parent_id}`);
      });
    }

    // Test 3: Test the exact query that the admin page uses
    console.log('\n3. Testing admin page query...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', '1cb80063-9b5f-4fff-84eb-309f12bd247d')
      .single();
    
    if (adminError) {
      console.error('Admin user query error:', adminError);
    } else {
      console.log('Admin user data:', adminUser);
    }

    console.log('\n=== Verification Complete ===');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

verifyAdmin(); 