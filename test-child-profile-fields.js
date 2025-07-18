const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testChildProfileFields() {
  console.log('🧪 Testing child profile fields...\n');

  try {
    // Test 1: Check if new columns exist
    console.log('1. Checking if new columns exist...');
    const { data: children, error: selectError } = await supabase
      .from('children')
      .select('name, child_description, pronouns, sidekick_description')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting children:', selectError);
      return;
    }

    console.log('✅ New columns exist and are selectable');

    // Test 2: Show current data
    console.log('\n2. Current child data with new fields:');
    const { data: allChildren, error: allError } = await supabase
      .from('children')
      .select('name, child_description, pronouns, sidekick_description')
      .order('name');

    if (allError) {
      console.error('❌ Error fetching all children:', allError);
      return;
    }

    allChildren?.forEach((child, index) => {
      console.log(`\n${index + 1}. ${child.name}`);
      console.log(`   Description: ${child.child_description || 'Not set'}`);
      console.log(`   Pronouns: ${child.pronouns || 'Not set'}`);
      console.log(`   Sidekick: ${child.sidekick_description || 'Not set'}`);
    });

    // Test 3: Test updating a child with new fields
    console.log('\n3. Testing update functionality...');
    
    const testChild = allChildren?.[0];
    if (testChild) {
      const testDescription = 'a test child with brown hair and a friendly smile';
      const testPronouns = 'they/them';
      const testSidekick = 'a magical test companion with sparkly wings';

      const { error: updateError } = await supabase
        .from('children')
        .update({
          child_description: testDescription,
          pronouns: testPronouns,
          sidekick_description: testSidekick
        })
        .eq('name', testChild.name);

      if (updateError) {
        console.error('❌ Error updating child:', updateError);
        return;
      }

      console.log(`✅ Successfully updated ${testChild.name} with test data`);

      // Verify the update
      const { data: updatedChild, error: verifyError } = await supabase
        .from('children')
        .select('name, child_description, pronouns, sidekick_description')
        .eq('name', testChild.name)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError);
        return;
      }

      console.log('\n✅ Verified update:');
      console.log(`   Description: ${updatedChild.child_description}`);
      console.log(`   Pronouns: ${updatedChild.pronouns}`);
      console.log(`   Sidekick: ${updatedChild.sidekick_description}`);

      // Restore original data if it existed
      const { error: restoreError } = await supabase
        .from('children')
        .update({
          child_description: testChild.child_description,
          pronouns: testChild.pronouns,
          sidekick_description: testChild.sidekick_description
        })
        .eq('name', testChild.name);

      if (!restoreError) {
        console.log('✅ Restored original data');
      }
    }

    console.log('\n🎉 All tests passed! Child profile fields are working correctly.');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testChildProfileFields();
