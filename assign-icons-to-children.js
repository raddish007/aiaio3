const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignIconsToChildren() {
  console.log('🎨 Assigning black & white icons to children...\n');
  
  try {
    // Icon assignments based on children's interests/themes
    const iconAssignments = {
      'Andrew': 'icon_bear.png',    // dogs -> bear (friendly animal)
      'Lorelei': 'icon_rocket.png', // pirates -> rocket (adventure)
      'Angelique': 'icon_dinosaur.png', // dinosaurs -> dinosaur
      'Nolan': 'icon_cat.png',      // halloween -> cat (spooky)
      'Christopher': 'icon_dinosaur.png', // dinosaurs -> dinosaur
      'Emma': 'icon_owl.png',       // princesses -> owl (wise/elegant)
      'Mason': 'icon_fox.png',      // jungle -> fox (forest animal)
      'Jack': 'icon_penguin.png'    // ocean -> penguin (water animal)
    };
    
    for (const [childName, iconFile] of Object.entries(iconAssignments)) {
      const { data, error } = await supabase
        .from('children')
        .update({ icon: iconFile })
        .eq('name', childName)
        .select();
        
      if (error) {
        console.error(`❌ Error updating ${childName}:`, error);
      } else {
        console.log(`✅ Assigned ${iconFile} to ${childName}`);
      }
    }
    
    console.log('\n🎉 Icon assignment complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignIconsToChildren();
