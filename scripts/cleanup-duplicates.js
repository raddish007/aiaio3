const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDuplicates() {
  try {
    console.log('=== Cleaning up duplicate children ===');
    
    // Get all children
    const { data: allChildren, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('*')
      .order('created_at');
    
    if (childrenError) {
      console.error('Error fetching children:', childrenError);
      return;
    }
    
    console.log(`Found ${allChildren.length} total children`);
    
    // Group by name and parent_id to find duplicates
    const groups = {};
    allChildren.forEach(child => {
      const key = `${child.name}-${child.parent_id}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(child);
    });
    
    // Find duplicates and keep only the first one
    const toDelete = [];
    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for ${group[0].name} (parent: ${group[0].parent_id})`);
        // Keep the first one, delete the rest
        for (let i = 1; i < group.length; i++) {
          toDelete.push(group[i].id);
        }
      }
    });
    
    if (toDelete.length === 0) {
      console.log('No duplicates found');
      return;
    }
    
    console.log(`Deleting ${toDelete.length} duplicate children...`);
    
    // Delete duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('children')
      .delete()
      .in('id', toDelete);
    
    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
    } else {
      console.log('✅ Successfully cleaned up duplicates');
    }
    
    // Show final count
    const { data: finalChildren } = await supabaseAdmin
      .from('children')
      .select('*');
    
    console.log(`Final count: ${finalChildren.length} children`);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

cleanupDuplicates(); 