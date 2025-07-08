const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLullabyQuery() {
  try {
    console.log('=== Debugging Lullaby Projects Query ===');
    
    // Test 1: Get all users
    console.log('\n1. Testing: Get all users');
    const { data: allUsers, error: allUsersError } = await supabase
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
    console.log('\n2. Testing: Get users with role = parent');
    const { data: parentUsers, error: parentUsersError } = await supabase
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
    console.log('\n3. Testing: Get all children');
    const { data: allChildren, error: childrenError } = await supabase
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
    console.log('\n4. Testing: Simulate page logic');
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

debugLullabyQuery(); 