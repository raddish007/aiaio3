const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function makeUserAdmin(email) {
  try {
    console.log(`Updating user ${email} to admin role...`);
    
    // Update the user's role to content_manager (admin role)
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'content_manager' })
      .eq('email', email);
    
    if (error) {
      console.error('Error updating user:', error);
      return;
    }
    
    console.log('User updated successfully!');
    console.log('Updated data:', data);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Verification - User data:', verifyData);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'admin@aiaio.com';
makeUserAdmin(email); 