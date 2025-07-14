const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignChildrenToUsers() {
  console.log('👶 Assigning children to users for demo...\n');
  
  try {
    // Get test user IDs (Karen and Carla)
    const karenUserId = '03ee1446-83f0-4dca-9692-034d4bf9c096'; // karen@karenboyd.com
    const carlaUserId = '5b2b0ab6-dab7-4337-959e-634050ea3d1a'; // carlaeng@gmail.com
    
    // Assign first 4 children to Karen
    const karenChildren = ['Andrew', 'Lorelei', 'Angelique', 'Nolan'];
    
    for (const childName of karenChildren) {
      const { data, error } = await supabase
        .from('children')
        .update({ 
          parent_id: karenUserId,
          icon: `child-${childName.toLowerCase()}.png` // Default icon path
        })
        .eq('name', childName)
        .select();
        
      if (error) {
        console.error(`❌ Error updating ${childName}:`, error);
      } else {
        console.log(`✅ Assigned ${childName} to Karen`);
      }
    }
    
    // Assign next 3 children to Carla
    const carlaChildren = ['Christopher', 'Emma', 'Mason'];
    
    for (const childName of carlaChildren) {
      const { data, error } = await supabase
        .from('children')
        .update({ 
          parent_id: carlaUserId,
          icon: `child-${childName.toLowerCase()}.png` // Default icon path
        })
        .eq('name', childName)
        .select();
        
      if (error) {
        console.error(`❌ Error updating ${childName}:`, error);
      } else {
        console.log(`✅ Assigned ${childName} to Carla`);
      }
    }
    
    console.log('\n🎉 Children assignment complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function getPrimaryInterestFromChild(childName) {
  // Get the child's primary interest from the database check we did earlier
  const interests = {
    'Andrew': 'dogs',
    'Lorelei': 'pirates', 
    'Angelique': 'dinosaurs',
    'Nolan': 'halloween',
    'Christopher': 'dinosaurs',
    'Emma': 'princesses',
    'Mason': 'jungle'
  };
  return interests[childName] || 'general';
}

assignChildrenToUsers();
