
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlaylistTable() {
  console.log('🎬 Checking playlist table for Andrew videos...');
  
  const { data, error } = await supabase
    .from('playlist')
    .select('*')
    .eq('child_name', 'Andrew')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total playlist entries for Andrew:', data?.length || 0);
  
  data?.forEach((video, index) => {
    console.log(`${index + 1}. ${video.video_type}: ${video.title}`);
    console.log(`   Status: ${video.status}`);
    console.log(`   URL: ${video.video_url ? 'YES' : 'NO'}`);
    console.log(`   Published: ${video.is_published ? 'YES' : 'NO'}`);
    console.log('');
  });
  
  // Search specifically for would you rather and lily
  console.log('🔍 Searching for "would you rather" and "lily" videos...');
  const searchResults = data?.filter(v => 
    v.title?.toLowerCase().includes('would') || 
    v.title?.toLowerCase().includes('lily') ||
    v.video_type?.toLowerCase().includes('would') ||
    v.video_type?.toLowerCase().includes('lily')
  ) || [];
  
  if (searchResults.length > 0) {
    console.log('Found matching videos:');
    searchResults.forEach(video => {
      console.log(`  - ${video.video_type}: ${video.title} (status: ${video.status}, published: ${video.is_published})`);
    });
  } else {
    console.log('No matching videos found for "would you rather" or "lily"');
  }
}

checkPlaylistTable();

