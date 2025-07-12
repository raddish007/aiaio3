const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAccountCreation() {
  console.log('🔍 Debugging account creation...\n');

  try {
    // Check all users
    console.log('📋 All users in database:');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role} - Created: ${user.created_at}`);
    });

    // Check parent users specifically
    console.log('\n👨‍👩‍👧‍👦 Parent users only:');
    const { data: parentUsers, error: parentError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('role', 'parent')
      .order('created_at', { ascending: false });

    if (parentError) {
      console.error('❌ Error fetching parents:', parentError);
      return;
    }

    console.log(`Found ${parentUsers.length} parent users:`);
    parentUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Created: ${user.created_at}`);
    });

    // Check all children
    console.log('\n👶 All children in database:');
    const { data: allChildren, error: childrenError } = await supabase
      .from('children')
      .select('id, name, parent_id, primary_interest, age, created_at')
      .order('created_at', { ascending: false });

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    console.log(`Found ${allChildren.length} children:`);
    allChildren.forEach(child => {
      console.log(`  - ${child.name} (Age: ${child.age}, Theme: ${child.primary_interest}) - Parent ID: ${child.parent_id} - Created: ${child.created_at}`);
    });

    // Check for orphaned children (children without valid parent)
    console.log('\n🔍 Checking for orphaned children...');
    const orphanedChildren = allChildren.filter(child => {
      return !parentUsers.find(parent => parent.id === child.parent_id);
    });

    if (orphanedChildren.length > 0) {
      console.log(`⚠️  Found ${orphanedChildren.length} orphaned children:`);
      orphanedChildren.forEach(child => {
        console.log(`  - ${child.name} (Parent ID: ${child.parent_id} - Parent not found in users table)`);
      });
    } else {
      console.log('✅ No orphaned children found');
    }

    // Check recent activity (last 24 hours)
    console.log('\n⏰ Recent activity (last 24 hours):');
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentUsers = allUsers.filter(user => new Date(user.created_at) > oneDayAgo);
    const recentChildren = allChildren.filter(child => new Date(child.created_at) > oneDayAgo);

    console.log(`Recent users (${recentUsers.length}):`);
    recentUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role} - Created: ${user.created_at}`);
    });

    console.log(`Recent children (${recentChildren.length}):`);
    recentChildren.forEach(child => {
      console.log(`  - ${child.name} (Parent ID: ${child.parent_id}) - Created: ${child.created_at}`);
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

debugAccountCreation(); 