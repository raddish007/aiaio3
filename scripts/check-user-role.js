const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUserRole() {
  console.log('🔍 Checking user roles and permissions...\n');

  try {
    // Get all users and their roles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log('📋 All users and their roles:');
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.email} (${user.id})`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Created: ${user.created_at}`);
      console.log('');
    });

    // Check RLS policies
    console.log('🔒 Checking RLS policies for assets table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'assets' });

    if (policiesError) {
      console.log('   Note: Could not fetch policies via RPC, but we know the update policy exists');
    } else {
      console.log('   Policies found:', policies);
    }

    // Test the update policy logic
    console.log('\n🧪 Testing update policy logic...');
    const testRoles = ['content_manager', 'asset_creator', 'video_ops', 'admin'];
    
    for (const role of testRoles) {
      const { data: roleUsers, error: roleError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', role);

      if (roleError) {
        console.log(`   ❌ Error checking ${role}:`, roleError.message);
      } else {
        console.log(`   ${role}: ${roleUsers?.length || 0} users found`);
        if (roleUsers && roleUsers.length > 0) {
          roleUsers.forEach(user => {
            console.log(`      - ${user.name || user.email} (${user.id})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkUserRole(); 