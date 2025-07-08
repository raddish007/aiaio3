const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestChildren() {
  try {
    console.log('🌙 Creating test children for lullaby projects...');

    // First, let's check if we have any existing users to use as parents
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'parent')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log('No parent users found. Creating a test parent first...');
      
      // Create a test parent user
      const { data: testParent, error: parentError } = await supabase
        .from('users')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test.parent@aiaio.com',
          name: 'Test Parent',
          role: 'parent',
          subscription_status: 'active'
        })
        .select()
        .single();

      if (parentError) {
        console.error('Error creating test parent:', parentError);
        return;
      }

      console.log('✅ Created test parent:', testParent.name);
      existingUsers.push(testParent);
    }

    // Test children data
    const testChildren = [
      {
        name: 'Nolan',
        age: 3,
        primary_interest: 'halloween',
        parent_id: existingUsers[0].id,
        profile_photo_url: null,
        metadata: {
          favorite_colors: ['orange', 'black', 'purple'],
          bedtime_routine: 'loves spooky stories',
          personality: 'adventurous and imaginative'
        }
      },
      {
        name: 'Emma',
        age: 4,
        primary_interest: 'princesses',
        parent_id: existingUsers[0].id,
        profile_photo_url: null,
        metadata: {
          favorite_colors: ['pink', 'purple', 'sparkles'],
          bedtime_routine: 'loves fairy tales',
          personality: 'creative and gentle'
        }
      },
      {
        name: 'Liam',
        age: 2,
        primary_interest: 'dinosaurs',
        parent_id: existingUsers[0].id,
        profile_photo_url: null,
        metadata: {
          favorite_colors: ['green', 'brown', 'blue'],
          bedtime_routine: 'loves dinosaur stories',
          personality: 'curious and energetic'
        }
      },
      {
        name: 'Sophia',
        age: 5,
        primary_interest: 'space',
        parent_id: existingUsers[0].id,
        profile_photo_url: null,
        metadata: {
          favorite_colors: ['blue', 'silver', 'purple'],
          bedtime_routine: 'loves space adventures',
          personality: 'imaginative and thoughtful'
        }
      },
      {
        name: 'Mason',
        age: 3,
        primary_interest: 'jungle',
        parent_id: existingUsers[0].id,
        profile_photo_url: null,
        metadata: {
          favorite_colors: ['green', 'yellow', 'orange'],
          bedtime_routine: 'loves animal stories',
          personality: 'playful and friendly'
        }
      }
    ];

    console.log(`📝 Creating ${testChildren.length} test children...`);

    // Insert children
    const { data: createdChildren, error: childrenError } = await supabase
      .from('children')
      .insert(testChildren)
      .select();

    if (childrenError) {
      console.error('Error creating children:', childrenError);
      return;
    }

    console.log('✅ Successfully created test children:');
    createdChildren.forEach(child => {
      console.log(`  👶 ${child.name} (${child.age} years) - loves ${child.primary_interest}`);
    });

    // Check if any children already have lullaby videos
    console.log('\n🔍 Checking for existing lullaby videos...');
    
    for (const child of createdChildren) {
      const { data: existingContent, error: contentError } = await supabase
        .from('content')
        .select('*')
        .eq('child_id', child.id)
        .eq('type', 'initial')
        .ilike('title', '%lullaby%');

      if (contentError) {
        console.error(`Error checking content for ${child.name}:`, contentError);
        continue;
      }

      if (existingContent && existingContent.length > 0) {
        console.log(`  ⚠️  ${child.name} already has ${existingContent.length} lullaby video(s)`);
      } else {
        console.log(`  ✅ ${child.name} needs a lullaby video`);
      }
    }

    console.log('\n🎉 Test children creation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to /admin/lullaby-projects to see children needing lullaby videos');
    console.log('2. Click "View Project" on any child to see their project details');
    console.log('3. Click "Start Project" to begin creating their lullaby video');
    console.log('4. Generate missing assets using the AI tools');

  } catch (error) {
    console.error('❌ Error in createTestChildren:', error);
  }
}

// Run the script
createTestChildren()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 