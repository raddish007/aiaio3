const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlaylistsStructure() {
  console.log('🔍 Checking child_playlists table structure...');
  
  try {
    const { data, error } = await supabase
      .from('child_playlists')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Sample record columns:', Object.keys(data[0]).join(', '));
      console.log('\nFirst few records:');
      data.forEach((record, i) => {
        console.log(`${i+1}.`, JSON.stringify(record, null, 2));
      });
    } else {
      console.log('No records found in child_playlists');
    }
    
  } catch (e) {
    console.log('Error accessing child_playlists:', e.message);
  }
}

checkPlaylistsStructure();
