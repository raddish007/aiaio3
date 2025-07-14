const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersAndChildren() {
  console.log('👤 Checking users and their children...\n');
  
  try {
    // Check if we have any test users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
    } else {
      console.log(`Found ${profiles?.length || 0} user profiles:`);
      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          console.log(`\n👤 ${profile.full_name || profile.email}`);
          console.log(`   ID: ${profile.id}`);
          console.log(`   Email: ${profile.email}`);
          console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
          
          // Check children for this user
          const { data: userChildren, error: childError } = await supabase
            .from('children')
            .select('*')
            .eq('user_id', profile.id);

          if (childError) {
            console.log(`   ❌ Error fetching children: ${childError.message}`);
          } else {
            console.log(`   Children: ${userChildren?.length || 0}`);
            userChildren?.forEach((child, idx) => {
              console.log(`     ${idx + 1}. ${child.name} (${child.age}yo, ${child.primary_interest})`);
            });
          }
        }
      }
    }

    // Let's also check auth.users directly
    console.log('\n\n🔐 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      console.log(`Found ${authUsers.users?.length || 0} auth users:`);
      for (const user of authUsers.users) {
        console.log(`\n👤 ${user.email} (ID: ${user.id})`);
        
        // Check children for this user
        const { data: userChildren, error: childError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user.id);

        if (childError) {
          console.log(`   ❌ Error fetching children: ${childError.message}`);
        } else {
          console.log(`   Children: ${userChildren?.length || 0}`);
          userChildren?.forEach((child, idx) => {
            console.log(`     ${idx + 1}. ${child.name} (${child.age}yo, ${child.primary_interest}) - Icon: ${child.icon || 'none'}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsersAndChildren();
