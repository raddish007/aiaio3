const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupOrphanedChildren() {
  console.log('🧹 Cleaning up orphaned children...\n');

  try {
    // Get all children
    const { data: allChildren, error: childrenError } = await supabase
      .from('children')
      .select('id, name, parent_id, created_at');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    // Get all valid parent IDs
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const validParentIds = allUsers.map(user => user.id);
    console.log('✅ Valid parent IDs:', validParentIds);

    // Find orphaned children
    const orphanedChildren = allChildren.filter(child => {
      return !validParentIds.includes(child.parent_id);
    });

    console.log(`🔍 Found ${orphanedChildren.length} orphaned children:`);
    orphanedChildren.forEach(child => {
      console.log(`  - ${child.name} (ID: ${child.id}, Parent ID: ${child.parent_id})`);
    });

    if (orphanedChildren.length === 0) {
      console.log('✅ No orphaned children to clean up');
      return;
    }

    // Delete orphaned children
    const orphanedIds = orphanedChildren.map(child => child.id);
    console.log('🗑️  Deleting orphaned children with IDs:', orphanedIds);

    const { error: deleteError } = await supabase
      .from('children')
      .delete()
      .in('id', orphanedIds);

    if (deleteError) {
      console.error('❌ Error deleting orphaned children:', deleteError);
      return;
    }

    console.log('✅ Successfully deleted orphaned children');

    // Verify cleanup
    const { data: remainingChildren, error: verifyError } = await supabase
      .from('children')
      .select('id, name, parent_id');

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return;
    }

    const remainingOrphaned = remainingChildren.filter(child => {
      return !validParentIds.includes(child.parent_id);
    });

    console.log(`✅ Cleanup complete. ${remainingOrphaned.length} orphaned children remaining.`);
    if (remainingOrphaned.length > 0) {
      console.log('Remaining orphaned children:', remainingOrphaned);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

cleanupOrphanedChildren(); 