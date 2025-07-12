require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Environment check:');
console.log('  SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('  SERVICE_KEY:', supabaseKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('🔍 Checking for Letter Hunt audio templates...');
    
    const { data, error } = await supabase
      .from('template_audio_scripts')
      .select('*')
      .eq('template_type', 'letter-hunt');
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('📋 Letter Hunt audio templates found:', data.length);
      if (data.length > 0) {
        data.forEach((template, index) => {
          console.log(`\n${index + 1}. ${template.name}`);
          console.log(`   Purpose: ${template.asset_purpose}`);
          console.log(`   Script: "${template.script}"`);
          console.log(`   Voice: ${template.voice_id}`);
          console.log(`   Speed: ${template.speed}`);
        });
      } else {
        console.log('📝 No Letter Hunt audio templates found. We need to create them.');
      }
    }
  } catch (e) {
    console.error('❌ Script error:', e.message);
  }
})();
