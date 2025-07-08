const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testChildNames = ['Nolan', 'Emma', 'Liam', 'Sophia', 'Mason'];

async function listChildContent() {
  try {
    // Fetch all children with these names
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name')
      .in('name', testChildNames);

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
      return;
    }

    if (!children || children.length === 0) {
      console.log('No test children found.');
      return;
    }

    for (const child of children) {
      console.log(`\n--- Content for ${child.name} (${child.id}) ---`);
      const { data: content, error: contentError } = await supabase
        .from('content')
        .select('id, child_id, title, type, status, created_at')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false });
      if (contentError) {
        console.error(`Error fetching content for ${child.name}:`, contentError);
        continue;
      }
      if (!content || content.length === 0) {
        console.log('  (No content records)');
      } else {
        content.forEach(row => {
          console.log(`  [${row.status}] ${row.type} - ${row.title} (${row.id}) @ ${row.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in listChildContent:', error);
  }
}

listChildContent()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 