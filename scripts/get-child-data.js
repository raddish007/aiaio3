const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getChildById(childId) {
  console.log(`👶 Fetching child info for child ID: ${childId}\n`);

  try {
    const { data: child, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (error) {
      console.error('❌ Error fetching child:', error);
      return;
    }

    if (!child) {
      console.log('   No child found for this ID');
      return null;
    }

    console.log(`✅ Child found: ${child.name}`);
    console.log(`   ID: ${child.id}`);
    console.log(`   Age: ${child.age}`);
    console.log(`   Theme/Interest: ${child.primary_interest}`);
    console.log(`   Profile Photo: ${child.profile_photo_url || 'None'}`);
    console.log(`   Created: ${new Date(child.created_at).toLocaleString()}`);
    console.log(`   Metadata: ${JSON.stringify(child.metadata, null, 2)}`);

    return child;
  } catch (error) {
    console.error('❌ Error getting child:', error);
    return null;
  }
}

// TEMP: List all children in the database
async function listAllChildren() {
  console.log('👶 Listing all children in the database...\n');
  try {
    const { data: children, error } = await supabase
      .from('children')
      .select('id, name, parent_id, age, primary_interest, profile_photo_url, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }
    if (!children || children.length === 0) {
      console.log('No children found.');
      return;
    }
    children.forEach((child, idx) => {
      console.log(`\n${idx + 1}. ${child.name}`);
      console.log(`   ID: ${child.id}`);
      console.log(`   Parent ID: ${child.parent_id}`);
      console.log(`   Age: ${child.age}`);
      console.log(`   Theme/Interest: ${child.primary_interest}`);
      console.log(`   Profile Photo: ${child.profile_photo_url || 'None'}`);
      console.log(`   Created: ${new Date(child.created_at).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error listing children:', error);
  }
}

// If running directly, fetch Nolan's detailed info
if (require.main === module) {
  const childId = '034515a7-122c-42d1-8bf0-1790e887e7f4'; // Nolan
  getChildById(childId).then((child) => {
    if (child) {
      console.log('\n📋 Child Data Summary for Lullaby Template:');
      console.log(JSON.stringify(child, null, 2));
    }
  });
}

module.exports = { getChildById, listAllChildren }; 