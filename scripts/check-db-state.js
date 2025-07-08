const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`👥 Users table: ${users.length} records`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    // Check children table
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*');
    
    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
    } else {
      console.log(`\n👶 Children table: ${children.length} records`);
      children.forEach(child => {
        console.log(`   - ${child.name} (age ${child.age}) - Parent ID: ${child.parent_id}`);
      });
    }

    // Check auth.users (Supabase's built-in auth table)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      console.log(`\n🔐 Auth users: ${authUsers.users.length} records`);
      authUsers.users.forEach(user => {
        console.log(`   - ${user.email} - ID: ${user.id} - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
    }

    // Check for orphaned children (children without matching users)
    if (children && children.length > 0) {
      console.log('\n🔍 Checking for orphaned children...');
      const userIds = users.map(u => u.id);
      const orphanedChildren = children.filter(child => !userIds.includes(child.parent_id));
      
      if (orphanedChildren.length > 0) {
        console.log(`⚠️  Found ${orphanedChildren.length} orphaned children:`);
        orphanedChildren.forEach(child => {
          console.log(`   - ${child.name} (ID: ${child.id}) - Parent ID: ${child.parent_id} (not found in users table)`);
        });
      } else {
        console.log('✅ No orphaned children found');
      }
    }

  } catch (error) {
    console.error('❌ Error checking database state:', error);
  }
}

checkDatabaseState(); 