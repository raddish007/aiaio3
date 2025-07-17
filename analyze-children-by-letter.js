require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeChildrenByLetter() {
  console.log('🔍 Analyzing children by first letter of their names...\n');

  try {
    const { data: allChildren, error } = await supabase
      .from('children')
      .select('id, name, primary_interest')
      .order('name');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    const letterGroups = {};
    allChildren.forEach(child => {
      const firstLetter = child.name.charAt(0).toUpperCase();
      if (!letterGroups[firstLetter]) {
        letterGroups[firstLetter] = [];
      }
      letterGroups[firstLetter].push(child);
    });

    console.log('📊 Children grouped by first letter of name:');
    Object.keys(letterGroups).sort().forEach(letter => {
      const children = letterGroups[letter];
      console.log(`\n${letter}: ${children.length} child${children.length !== 1 ? 'ren' : ''}`);
      children.forEach(child => {
        console.log(`   - ${child.name} (${child.primary_interest})`);
      });
    });

    console.log(`\n📈 Summary:`);
    console.log(`Total children: ${allChildren.length}`);
    Object.keys(letterGroups).sort().forEach(letter => {
      console.log(`Letter ${letter}: ${letterGroups[letter].length} children`);
    });

    const aChildren = letterGroups['A'] || [];
    if (aChildren.length > 1) {
      console.log(`\n⚠️  Note: There are ${aChildren.length} children whose names start with "A".`);
      console.log('If you use "Subset" assignment with letter "A", all of these children will get the video.');
      console.log('If you want only Andrew to get Letter A videos, use "Individual" assignment instead.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

analyzeChildrenByLetter().catch(console.error);
