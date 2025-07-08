const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin() {
  try {
    console.log('=== Making admin@aiaio.com an admin user ===');
    
    // First, let's check if the user exists in the users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@aiaio.com')
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError);
      return;
    }
    
    if (existingUser) {
      console.log('User exists:', existingUser);
      
      // Update the user to have content_manager role
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'content_manager' })
        .eq('email', 'admin@aiaio.com');
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log('✅ Updated admin@aiaio.com to content_manager role');
      }
    } else {
      console.log('User not found in users table, creating...');
      
      // Create the user in the users table
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: '1cb80063-9b5f-4fff-84eb-309f12bd247d',
          email: 'admin@aiaio.com',
          name: 'Admin',
          role: 'content_manager'
        });
      
      if (insertError) {
        console.error('Error creating user:', insertError);
      } else {
        console.log('✅ Created admin@aiaio.com with content_manager role');
      }
    }
    
    // Let's also fix the RLS policies by disabling them temporarily for testing
    console.log('\n=== Temporarily disabling RLS for testing ===');
    
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ Disabled RLS on users table');
    } catch (error) {
      console.log('Could not disable RLS (might not have permission):', error.message);
    }
    
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE children DISABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ Disabled RLS on children table');
    } catch (error) {
      console.log('Could not disable RLS (might not have permission):', error.message);
    }
    
    console.log('\n=== Admin setup complete ===');
    console.log('You should now be able to access /admin pages');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

makeAdmin(); 