const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key to access auth.users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  try {
    console.log('=== Checking Auth Users ===');
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth users error:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} users in auth.users:`);
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`);
      if (user.user_metadata) {
        console.log(`  Metadata:`, user.user_metadata);
      }
    });

    console.log('\n=== Checking Public Users Table ===');
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (publicError) {
      console.error('Public users error:', publicError);
    } else {
      console.log(`Found ${publicUsers.length} users in public.users:`);
      publicUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Find users that exist in auth but not in public.users
    const authUserIds = authUsers.users.map(u => u.id);
    const publicUserIds = publicUsers.map(u => u.id);
    const missingUsers = authUserIds.filter(id => !publicUserIds.includes(id));

    if (missingUsers.length > 0) {
      console.log('\n=== Users Missing from Public Table ===');
      missingUsers.forEach(id => {
        const authUser = authUsers.users.find(u => u.id === id);
        console.log(`- ${authUser.email} (ID: ${id}) needs to be added to public.users`);
      });
    } else {
      console.log('\n✅ All auth users exist in public.users table');
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkAuthUsers(); 