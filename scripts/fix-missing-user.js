const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingUser() {
  console.log('🔧 Fixing missing user record...\n');

  try {
    // Create the missing user record for erica@erica.com
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: '59bba5a6-b61b-4787-82dc-4c0cecae6cf5',
        email: 'erica@erica.com',
        name: 'Erica',
        role: 'parent'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user record:', userError);
      return;
    }

    console.log('✅ Created missing user record:', user);

    // Now let's check if there are any children for this user
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', '59bba5a6-b61b-4787-82dc-4c0cecae6cf5');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
    } else {
      console.log(`\n👶 Found ${children.length} children for Erica:`);
      children.forEach(child => {
        console.log(`   - ${child.name} (age ${child.age}) - ID: ${child.id}`);
      });
    }

    console.log('\n🎉 User record fixed successfully!');
    console.log('You should now be able to register new users without foreign key errors.');

  } catch (error) {
    console.error('❌ Error fixing missing user:', error);
  }
}

fixMissingUser(); 