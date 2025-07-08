const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAssetGeneration() {
  try {
    console.log('🧪 Testing Asset Generation...\n');

    // 1. Create a test project
    console.log('1. Creating test project...');
    const { data: project, error: projectError } = await supabase
      .from('content_projects')
      .insert({
        title: 'Test Asset Generation',
        theme: 'Space Adventure',
        target_age: '4-6',
        duration: 60,
        status: 'planning'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Error creating project:', projectError);
      return;
    }

    console.log('✅ Project created:', project.id);

    // 2. Create test assets
    console.log('\n2. Creating test assets...');
    const testAssets = [
      {
        project_id: project.id,
        type: 'image',
        prompt: 'A colorful space station with friendly aliens for children aged 4-6',
        status: 'pending'
      },
      {
        project_id: project.id,
        type: 'image',
        prompt: 'A cute robot character exploring space for children aged 4-6',
        status: 'pending'
      },
      {
        project_id: project.id,
        type: 'audio',
        prompt: 'A cheerful voiceover about space exploration for children aged 4-6',
        status: 'pending'
      }
    ];

    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .insert(testAssets)
      .select();

    if (assetsError) {
      console.error('❌ Error creating assets:', assetsError);
      return;
    }

    console.log('✅ Assets created:', assets.length);

    // 3. Test asset generation API
    console.log('\n3. Testing asset generation API...');
    
    // Test individual asset generation
    for (const asset of assets) {
      console.log(`   Generating asset ${asset.id} (${asset.type})...`);
      
      try {
        const response = await fetch('http://localhost:3000/api/assets/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId: asset.id })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Asset ${asset.id} generation started:`, result.success);
        } else {
          console.log(`   ❌ Failed to generate asset ${asset.id}`);
        }
      } catch (error) {
        console.log(`   ❌ Error generating asset ${asset.id}:`, error.message);
      }

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Check results after a delay
    console.log('\n4. Checking generation results...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { data: updatedAssets, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', project.id);

    if (fetchError) {
      console.error('❌ Error fetching updated assets:', fetchError);
      return;
    }

    console.log('\n📊 Generation Results:');
    updatedAssets.forEach(asset => {
      console.log(`   ${asset.type.toUpperCase()}: ${asset.status}${asset.url ? ' (URL generated)' : ''}`);
    });

    // 5. Cleanup
    console.log('\n5. Cleaning up test data...');
    await supabase.from('assets').delete().eq('project_id', project.id);
    await supabase.from('content_projects').delete().eq('id', project.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Asset generation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAssetGeneration(); 