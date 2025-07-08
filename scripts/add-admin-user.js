const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addAdminUser(email, name = 'Admin User') {
  try {
    console.log(`Adding admin user: ${email}`);
    
    // Insert the user with admin role
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name,
        role: 'content_manager'
      })
      .select();
    
    if (error) {
      console.error('Error adding user:', error);
      return;
    }
    
    console.log('Admin user added successfully!');
    console.log('User data:', data);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address: node scripts/add-admin-user.js <email>');
  process.exit(1);
}

addAdminUser(email); 