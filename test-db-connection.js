require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test database connection and check schema
async function testDatabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test basic connection
    console.log('\n🔍 Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Check if tables exist by trying to query them
    console.log('\n🔍 Checking table structure...');
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('Users sample:', usersData);
    }
    
    // Check children table
    const { data: childrenData, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .limit(1);
      
    if (childrenError) {
      console.error('❌ Children table error:', childrenError.message);
    } else {
      console.log('✅ Children table accessible');
      console.log('Children sample:', childrenData);
    }
    
    // Check leads table
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
      
    if (leadsError) {
      console.error('❌ Leads table error:', leadsError.message);
    } else {
      console.log('✅ Leads table accessible');
      console.log('Leads sample:', leadsData);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testDatabaseConnection();
