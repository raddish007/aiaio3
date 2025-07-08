const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminQuery() {
  try {
    console.log('=== Debugging Admin Lullaby Projects Query ===');
    
    // Test 1: Get all users
    console.log('\n1. Testing: Get all users (admin client)');
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role');
    
    if (allUsersError) {
      console.error('All users error:', allUsersError);
    } else {
      console.log(`Found ${allUsers.length} total users:`);
      allUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Test 2: Get users with role = 'parent'
    console.log('\n2. Testing: Get users with role = parent (admin client)');
    const { data: parentUsers, error: parentUsersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'parent')
      .order('name');
    
    if (parentUsersError) {
      console.error('Parent users error:', parentUsersError);
    } else {
      console.log(`Found ${parentUsers.length} parent users:`);
      console.log('Parent users:', parentUsers);
    }

    // Test 3: Get all children
    console.log('\n3. Testing: Get all children (admin client)');
    const { data: allChildren, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('*');
    
    if (childrenError) {
      console.error('Children error:', childrenError);
    } else {
      console.log(`Found ${allChildren.length} children:`);
      allChildren.forEach(child => {
        console.log(`- ${child.name} (${child.age} years) - Parent ID: ${child.parent_id}`);
      });
    }

    // Test 4: Simulate the exact logic from the page
    console.log('\n4. Testing: Simulate page logic (admin client)');
    if (parentUsers && allChildren) {
      const childrenWithParentsData = [];
      for (const child of allChildren) {
        const parent = parentUsers.find(u => u.id === child.parent_id);
        console.log(`🔗 Child ${child.name} (${child.id}) -> Parent:`, parent);
        if (!parent) {
          console.log(`❌ No parent found for child ${child.name}`);
          continue;
        }
        childrenWithParentsData.push({
          child,
          parent,
          hasLullabyVideo: false, // Simplified for testing
          missingAssets: []
        });
      }
      console.log(`📋 Final childrenWithParentsData: ${childrenWithParentsData.length} items`);
      childrenWithParentsData.forEach(item => {
        console.log(`- ${item.child.name} -> ${item.parent.name} (${item.parent.email})`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

debugAdminQuery(); 