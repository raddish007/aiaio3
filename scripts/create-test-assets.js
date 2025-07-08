require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestAssets() {
  try {
    const testAssets = [
      {
        type: 'image',
        theme: 'Space Adventure',
        tags: ['space', 'rockets', 'stars'],
        age_range: '3-5',
        safe_zone: 'educational',
        status: 'pending',
        file_url: 'https://picsum.photos/400/300?random=1',
        metadata: { test: true }
      },
      {
        type: 'image',
        theme: 'Dinosaur World',
        tags: ['dinosaurs', 'prehistoric'],
        age_range: '4-6',
        safe_zone: 'educational',
        status: 'pending',
        file_url: 'https://picsum.photos/400/300?random=2',
        metadata: { test: true }
      },
      {
        type: 'image',
        theme: 'Ocean Friends',
        tags: ['ocean', 'fish', 'underwater'],
        age_range: '2-4',
        safe_zone: 'educational',
        status: 'approved',
        file_url: 'https://picsum.photos/400/300?random=3',
        metadata: { test: true }
      }
    ];

    for (const asset of testAssets) {
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select();

      if (error) {
        console.error('Error creating asset:', error);
      } else {
        console.log('Created asset:', data[0].id);
      }
    }

    console.log('Test assets created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAssets(); 