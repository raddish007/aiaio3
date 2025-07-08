const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createTestLullabyData() {
  try {
    console.log('=== Creating Test Data for Lullaby Projects ===');

    // Create test users
    console.log('\n1. Creating test users...');
    
    const testUsers = [
      {
        id: '1cb80063-9b5f-4fff-84eb-309f12bd247d',
        email: 'admin@aiaio.com',
        name: 'Admin',
        role: 'content_manager'
      },
      {
        id: '59bba5a6-b61b-4787-82dc-4c0cecae6cf5',
        email: 'erica@erica.com',
        name: 'Erica',
        role: 'parent'
      },
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test.parent@aiaio.com',
        name: 'Test Parent',
        role: 'parent'
      }
    ];

    for (const user of testUsers) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(user, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error creating user ${user.email}:`, error);
      } else {
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      }
    }

    // Create test children
    console.log('\n2. Creating test children...');
    
    const testChildren = [
      {
        parent_id: '59bba5a6-b61b-4787-82dc-4c0cecae6cf5', // Erica
        name: 'Nolan',
        age: 3,
        primary_interest: 'halloween'
      },
      {
        parent_id: '59bba5a6-b61b-4787-82dc-4c0cecae6cf5', // Erica
        name: 'Lorelei',
        age: 3,
        primary_interest: 'space'
      },
      {
        parent_id: '00000000-0000-0000-0000-000000000001', // Test Parent
        name: 'Emma',
        age: 4,
        primary_interest: 'animals'
      },
      {
        parent_id: '00000000-0000-0000-0000-000000000001', // Test Parent
        name: 'Liam',
        age: 2,
        primary_interest: 'vehicles'
      }
    ];

    for (const child of testChildren) {
      const { error } = await supabaseAdmin
        .from('children')
        .insert(child);
      
      if (error) {
        console.error(`Error creating child ${child.name}:`, error);
      } else {
        console.log(`✅ Created child: ${child.name} (${child.age} years)`);
      }
    }

    console.log('\n=== Test Data Created Successfully ===');
    console.log('You can now test the lullaby-projects page!');

  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestLullabyData(); 