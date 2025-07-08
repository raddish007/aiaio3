const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLullabyData() {
  try {
    console.log('=== Checking Users ===');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Users error:', usersError);
    } else {
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    console.log('\n=== Checking Children ===');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*');
    
    if (childrenError) {
      console.error('Children error:', childrenError);
    } else {
      console.log(`Found ${children.length} children:`);
      children.forEach(child => {
        console.log(`- ${child.name} (${child.age} years) - Parent ID: ${child.parent_id}`);
      });
    }

    console.log('\n=== Checking Content (Lullaby Videos) ===');
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .ilike('title', '%lullaby%');
    
    if (contentError) {
      console.error('Content error:', contentError);
    } else {
      console.log(`Found ${content.length} lullaby content items:`);
      content.forEach(item => {
        console.log(`- ${item.title} - Child ID: ${item.child_id} - Status: ${item.status}`);
      });
    }

    console.log('\n=== Checking All Content ===');
    const { data: allContent, error: allContentError } = await supabase
      .from('content')
      .select('*');
    
    if (allContentError) {
      console.error('All content error:', allContentError);
    } else {
      console.log(`Found ${allContent.length} total content items:`);
      allContent.forEach(item => {
        console.log(`- ${item.title} - Type: ${item.type} - Child ID: ${item.child_id} - Status: ${item.status}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkLullabyData(); 