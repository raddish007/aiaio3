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
  console.log('👶 Checking children in database...\n');

  try {
    const { data: children, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    console.log(`✅ Found ${children?.length || 0} children:`);
    if (children && children.length > 0) {
      children.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.name}`);
        console.log(`      ID: ${child.id}`);
        console.log(`      Age: ${child.age}`);
        console.log(`      Interest: ${child.primary_interest}`);
        console.log(`      Parent ID: ${child.parent_id}`);
        console.log(`      Created: ${new Date(child.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   No children found');
      console.log('\n💡 You need to create a child first to test the video player.');
      console.log('   You can do this through the dashboard or create a test child.');
    }

  } catch (error) {
    console.error('❌ Error checking children:', error);
  }
}

checkChildren(); 