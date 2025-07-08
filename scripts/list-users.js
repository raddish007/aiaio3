const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  try {
    console.log('Listing all users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('Users in database:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

listUsers(); 