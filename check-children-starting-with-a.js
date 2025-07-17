require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChildrenStartingWithA() {
  console.log('🔍 Checking all children whose names start with "A"...\n');

  try {
    const { data: allChildren, error } = await supabase
      .from('children')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    console.log(`Found ${allChildren.length} total children:`);
    allChildren.forEach((child, i) => {
      const startsWithA = child.name.toLowerCase().startsWith('a');
      console.log(`   ${i+1}. ${child.name} ${startsWithA ? '👈 STARTS WITH A' : ''}`);
      if (startsWithA) {
        console.log(`      ID: ${child.id}`);
        console.log(`      Primary Interest: ${child.primary_interest}`);
        console.log(`      Theme: ${child.theme || 'none'}`);
      }
    });

    const childrenStartingWithA = allChildren.filter(child => 
      child.name.toLowerCase().startsWith('a')
    );

    console.log(`\n📊 Summary: ${childrenStartingWithA.length} children start with "A":`);
    childrenStartingWithA.forEach((child, i) => {
      console.log(`   ${i+1}. ${child.name} (${child.primary_interest})`);
    });

    if (childrenStartingWithA.length !== 1) {
      console.log('\n⚠️  This explains why the video is assigned to multiple children!');
      console.log('If you want only Andrew to get Letter A videos, you need to either:');
      console.log('1. Use "Individual" assignment type and select Andrew specifically, OR');
      console.log('2. Use a different filter that uniquely identifies Andrew');
    }

    // Check the latest video assignment
    console.log('\n🔍 Checking latest video assignments...');
    const { data: recentAssignments, error: assignError } = await supabase
      .from('video_assignments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }

    console.log('Recent assignments:');
    recentAssignments.forEach((assignment, i) => {
      console.log(`   ${i+1}. Video: ${assignment.video_id.slice(-8)}...`);
      console.log(`      Type: ${assignment.assignment_type}`);
      console.log(`      Child: ${assignment.child_id?.slice(-8) || 'null (general)'}...`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Created: ${assignment.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkChildrenStartingWithA().catch(console.error);
