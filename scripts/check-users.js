const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('👥 Checking users in database...\n');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`✅ Found ${users?.length || 0} users:`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.name}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Created: ${new Date(user.created_at).toLocaleString()}`);
      });
    } else {
      console.log('   No users found');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers(); 