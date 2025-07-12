const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateParentDiscrepancy() {
  console.log('🔍 Investigating parent ID discrepancy...\n');

  try {
    // Get all users with detailed info
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
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Created: ${user.created_at}`);
      console.log('');
    });

    // Get all children with detailed info
    console.log('👶 All children in database:');
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
      console.log(`  - ID: ${child.id}`);
      console.log(`    Name: ${child.name}`);
      console.log(`    Parent ID: ${child.parent_id}`);
      console.log(`    Theme: ${child.primary_interest}`);
      console.log(`    Age: ${child.age}`);
      console.log(`    Created: ${child.created_at}`);
      console.log('');
    });

    // Check specific parent IDs that were causing issues
    const problematicParentIds = [
      '1cb80063-9b5f-4fff-84eb-309f12bd247d',
      '00000000-0000-0000-0000-000000000001',
      '59bba5a6-b61b-4787-82dc-4c0cecae6cf5'
    ];

    console.log('🔍 Checking specific parent IDs:');
    problematicParentIds.forEach(parentId => {
      const user = allUsers.find(u => u.id === parentId);
      const children = allChildren.filter(c => c.parent_id === parentId);
      
      console.log(`Parent ID: ${parentId}`);
      if (user) {
        console.log(`  ✅ Found in users table: ${user.email} (${user.name}) - Role: ${user.role}`);
      } else {
        console.log(`  ❌ NOT found in users table`);
      }
      console.log(`  Children: ${children.length}`);
      children.forEach(child => {
        console.log(`    - ${child.name} (${child.primary_interest})`);
      });
      console.log('');
    });

    // Check for orphaned children
    const validParentIds = allUsers.map(user => user.id);
    const orphanedChildren = allChildren.filter(child => {
      return !validParentIds.includes(child.parent_id);
    });

    console.log(`🔍 Orphaned children analysis:`);
    console.log(`Valid parent IDs: ${validParentIds.length}`);
    console.log(`Total children: ${allChildren.length}`);
    console.log(`Orphaned children: ${orphanedChildren.length}`);

    if (orphanedChildren.length > 0) {
      console.log('Orphaned children:');
      orphanedChildren.forEach(child => {
        console.log(`  - ${child.name} (Parent ID: ${child.parent_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

investigateParentDiscrepancy(); 