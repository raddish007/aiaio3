const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChildren() {
  console.log('👶 Checking all children in the database...\n');
  try {
    const { data: children, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    if (!children || children.length === 0) {
      console.log('No children found.');
      return;
    }

    console.log(`Found ${children.length} children:`);
    children.forEach((child, idx) => {
      console.log(`\n${idx + 1}. ${child.name}`);
      console.log(`   ID: ${child.id}`);
      console.log(`   User ID: ${child.user_id}`);
      console.log(`   Age: ${child.age}`);
      console.log(`   Icon: ${child.icon}`);
      console.log(`   Theme: ${child.theme}`);
      console.log(`   Primary Interest: ${child.primary_interest || 'None'}`);
      console.log(`   Profile Photo: ${child.profile_photo_url || 'None'}`);
      console.log(`   Created: ${new Date(child.created_at).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error listing children:', error);
  }
}

checkChildren();
