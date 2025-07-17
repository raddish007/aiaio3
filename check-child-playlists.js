const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChildPlaylists() {
  console.log('🎬 Checking child_playlists table for Andrew...');
  
  try {
    const { data, error } = await supabase
      .from('child_playlists')
      .select('*')
      .eq('child_name', 'Andrew')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${data?.length || 0} videos for Andrew in child_playlists`);
    
    data?.forEach((video, i) => {
      console.log(`${i+1}. ${video.video_type || video.template_type}: ${video.title || video.video_title}`);
      console.log(`   Status: ${video.status || video.approval_status}`);
      console.log(`   Published: ${video.is_published ? 'YES' : 'NO'}`);
      console.log(`   URL: ${video.video_url ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // Look specifically for would you rather and lily
    console.log('🔍 Searching for "would you rather" and "lily" videos...');
    const searchResults = data?.filter(v => 
      v.title?.toLowerCase().includes('would') || 
      v.title?.toLowerCase().includes('lily') ||
      v.video_title?.toLowerCase().includes('would') ||
      v.video_title?.toLowerCase().includes('lily') ||
      v.video_type?.toLowerCase().includes('would') ||
      v.video_type?.toLowerCase().includes('lily')
    ) || [];
    
    if (searchResults.length > 0) {
      console.log('Found matching videos:');
      searchResults.forEach(video => {
        console.log(`  - ${video.video_type || video.template_type}: ${video.title || video.video_title}`);
        console.log(`    Status: ${video.status || video.approval_status}, Published: ${video.is_published}`);
      });
    } else {
      console.log('No matching videos found for "would you rather" or "lily"');
    }
    
    // Show all published videos
    const published = data?.filter(v => v.is_published) || [];
    console.log(`\n✅ Published videos for Andrew: ${published.length}`);
    published.forEach(video => {
      console.log(`  - ${video.video_type || video.template_type}: ${video.title || video.video_title}`);
    });
    
  } catch (e) {
    console.log('Error accessing child_playlists:', e.message);
  }
}

checkChildPlaylists();
