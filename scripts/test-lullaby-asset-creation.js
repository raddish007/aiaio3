require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLullabyAssetCreation() {
  try {
    console.log('🧪 Testing Lullaby Asset Creation Process...\n');

    // 1. Get a child to test with
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .limit(1);

    if (childrenError || !children || children.length === 0) {
      console.error('❌ No children found for testing');
      return;
    }

    const child = children[0];
    console.log(`👶 Testing with child: ${child.name} (${child.age} years old)`);

    // 2. Check for existing lullaby content
    const { data: existingContent } = await supabase
      .from('content')
      .select('*')
      .eq('child_id', child.id)
      .eq('type', 'initial')
      .ilike('title', '%lullaby%');

    if (existingContent && existingContent.length > 0) {
      console.log('⚠️  Child already has a lullaby project, cleaning up...');
      // Delete existing content and assets
      await supabase
        .from('assets')
        .delete()
        .eq('content_id', existingContent[0].id);
      
      await supabase
        .from('content')
        .delete()
        .eq('id', existingContent[0].id);
      
      console.log('✅ Cleaned up existing project');
    }

    // 3. Create lullaby content record
    console.log('\n📝 Creating lullaby content record...');
    const { data: content, error: contentError } = await supabase
      .from('content')
      .insert({
        child_id: child.id,
        type: 'initial',
        title: `${child.name}'s Lullaby Video`,
        description: `Personalized lullaby video for ${child.name}`,
        status: 'pending',
        metadata: {
          template: 'lullaby',
          child_name: child.name,
          project_type: 'lullaby',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (contentError) {
      console.error('❌ Error creating content:', contentError);
      return;
    }

    console.log(`✅ Created content record: ${content.id}`);

    // 4. Create required assets
    console.log('\n🎨 Creating required assets...');
    const requiredAssets = [
      {
        type: 'audio',
        description: 'Background music (dreamdrip song)',
        prompt: `Create a gentle, calming lullaby background music for ${child.name}'s bedtime video. Soft, soothing melody with dreamy, peaceful tones suitable for children aged ${child.age}.`,
        metadata: {
          asset_purpose: 'background_music',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'slideshow'
        }
      },
      {
        type: 'audio',
        description: 'Intro audio "Bedtime for [Name]"',
        prompt: `Create a warm, gentle voice saying "Bedtime for ${child.name}" in a soothing, loving tone suitable for a ${child.age}-year-old child.`,
        metadata: {
          asset_purpose: 'intro_audio',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'intro_safe'
        }
      },
      {
        type: 'audio',
        description: 'Outro audio "Goodnight, [Name]"',
        prompt: `Create a warm, gentle voice saying "Goodnight, ${child.name}" in a soothing, loving tone suitable for a ${child.age}-year-old child.`,
        metadata: {
          asset_purpose: 'outro_audio',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'outro_safe'
        }
      },
      {
        type: 'image',
        description: 'Intro background card',
        prompt: `Create a gentle, calming bedtime scene for ${child.name}'s lullaby video intro. Soft, warm colors with peaceful bedtime elements like stars, moon, or sleeping animals. 2D Pixar style, frame composition with center area empty for title text.`,
        metadata: {
          asset_purpose: 'intro_background',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'intro_safe'
        }
      },
      {
        type: 'image',
        description: 'Outro background card',
        prompt: `Create a gentle, calming bedtime scene for ${child.name}'s lullaby video outro. Soft, warm colors with peaceful bedtime elements like stars, moon, or sleeping animals. 2D Pixar style, frame composition with center area empty for ending text.`,
        metadata: {
          asset_purpose: 'outro_background',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'outro_safe'
        }
      },
      {
        type: 'image',
        description: 'Slideshow image 1',
        prompt: `Create a peaceful bedtime scene for ${child.name}'s lullaby slideshow. A gentle sleeping animal or character in a calm, soothing environment. 2D Pixar style, soft colors, simple composition.`,
        metadata: {
          asset_purpose: 'slideshow_image',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'slideshow',
          image_number: 1
        }
      },
      {
        type: 'image',
        description: 'Slideshow image 2',
        prompt: `Create a peaceful bedtime scene for ${child.name}'s lullaby slideshow. A gentle sleeping animal or character in a calm, soothing environment. 2D Pixar style, soft colors, simple composition.`,
        metadata: {
          asset_purpose: 'slideshow_image',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'slideshow',
          image_number: 2
        }
      },
      {
        type: 'image',
        description: 'Slideshow image 3',
        prompt: `Create a peaceful bedtime scene for ${child.name}'s lullaby slideshow. A gentle sleeping animal or character in a calm, soothing environment. 2D Pixar style, soft colors, simple composition.`,
        metadata: {
          asset_purpose: 'slideshow_image',
          child_name: child.name,
          content_id: content.id,
          safe_zone: 'slideshow',
          image_number: 3
        }
      }
    ];

    let createdAssets = 0;
    for (const assetSpec of requiredAssets) {
      try {
        const { data: asset, error: assetError } = await supabase
          .from('assets')
          .insert({
            type: assetSpec.type,
            theme: `${child.name}'s Lullaby`,
            status: 'pending',
            prompt: assetSpec.prompt,
            metadata: {
              ...assetSpec.metadata,
              child_age: child.age,
              child_interest: child.primary_interest,
              created_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (assetError) {
          console.error(`❌ Error creating asset ${assetSpec.description}:`, assetError);
          continue;
        }

        console.log(`✅ Created asset: ${assetSpec.description} (${asset.id})`);
        createdAssets++;
      } catch (error) {
        console.error(`❌ Error processing asset ${assetSpec.description}:`, error);
      }
    }

    // 5. Update content status
    await supabase
      .from('content')
      .update({ 
        status: 'in_progress',
        metadata: {
          assets_created: true,
          asset_count: createdAssets,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', content.id);

    console.log(`\n🎉 Successfully created ${createdAssets} assets for ${child.name}'s lullaby project!`);

    // 6. Verify the results
    console.log('\n📊 Verification:');
    const { data: finalContent } = await supabase
      .from('content')
      .select('*')
      .eq('id', content.id)
      .single();

    const { data: finalAssets } = await supabase
      .from('assets')
      .select('*')
      .eq('content_id', content.id);

    console.log(`Content Status: ${finalContent?.status}`);
    console.log(`Total Assets: ${finalAssets?.length || 0}`);
    
    if (finalAssets) {
      const statusCounts = {};
      finalAssets.forEach(asset => {
        const status = asset.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('Asset Status Breakdown:', statusCounts);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLullabyAssetCreation(); 