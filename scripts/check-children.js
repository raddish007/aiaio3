const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkChildren() {
  try {
    console.log('=== Checking Children ===');
    
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('*');
    
    if (childrenError) {
      console.error('Children error:', childrenError);
      return;
    }
    
    console.log(`Found ${children.length} children:`);
    
    if (children.length === 0) {
      console.log('No children found in database');
      return;
    }
    
    children.forEach(child => {
      console.log(`- ${child.name} (${child.age} years) - Parent ID: ${child.parent_id}`);
    });

    console.log('\n=== Checking Parent-Child Relationships ===');
    
    for (const child of children) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('users')
        .select('name, email, role')
        .eq('id', child.parent_id)
        .single();
      
      if (parentError) {
        console.log(`❌ Child ${child.name} has invalid parent_id: ${child.parent_id}`);
      } else {
        console.log(`✅ ${child.name} -> Parent: ${parent.name} (${parent.email}) - Role: ${parent.role}`);
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkChildren(); 