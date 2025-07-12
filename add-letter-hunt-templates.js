const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const letterHuntTemplates = [
  {
    name: 'Letter Hunt Title',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "[NAME]'s letter hunt!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Title announcement for Letter Hunt video',
    tags: ['title', 'announcement', 'energetic']
  },
  {
    name: 'Letter Hunt Intro - Today We Look',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "Today we're looking for the letter [LETTER]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Introduction explaining which letter to hunt for',
    tags: ['intro', 'instruction', 'letter']
  },
  {
    name: 'Letter Hunt Search Instructions',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "Everywhere you go, look for the letter [LETTER]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Instructions to search for the target letter',
    tags: ['instruction', 'search', 'everywhere']
  },
  {
    name: 'Letter Hunt Signs Location',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "On signs",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Indicating letters can be found on signs',
    tags: ['location', 'signs', 'short']
  },
  {
    name: 'Letter Hunt Books Location',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "On books",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Indicating letters can be found on books',
    tags: ['location', 'books', 'short']
  },
  {
    name: 'Letter Hunt Grocery Location',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "Even in the grocery store!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Indicating letters can be found at grocery stores',
    tags: ['location', 'grocery', 'excitement']
  },
  {
    name: 'Letter Hunt Happy Dance',
    template_type: 'letter-hunt',
    asset_purpose: 'intro_audio',
    script: "And when you find your letter, I want you to do a little happy dance!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Encouragement to dance when finding letters',
    tags: ['encouragement', 'dance', 'celebration']
  },
  {
    name: 'Letter Hunt Ending',
    template_type: 'letter-hunt',
    asset_purpose: 'outro_audio',
    script: "Have fun finding the letter [LETTER], [NAME]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Final encouragement for the letter hunt',
    tags: ['ending', 'encouragement', 'personalized']
  }
];

async function addLetterHuntTemplates() {
  try {
    console.log('🎯 Adding Letter Hunt audio templates...');
    
    // Check for existing Letter Hunt templates first (check by name for uniqueness)
    const { data: existing, error: checkError } = await supabase
      .from('template_audio_scripts')
      .select('name')
      .eq('template_type', 'letter-hunt');
    
    if (checkError) {
      console.error('❌ Error checking existing templates:', checkError);
      return;
    }
    
    const existingNames = existing.map(t => t.name);
    console.log('🔍 Existing Letter Hunt names:', existingNames);
    
    // Filter out templates that already exist
    const newTemplates = letterHuntTemplates.filter(template => 
      !existingNames.includes(template.name)
    );
    
    if (newTemplates.length === 0) {
      console.log('✅ All Letter Hunt templates already exist!');
      return;
    }
    
    console.log(`📝 Adding ${newTemplates.length} new templates...`);
    
    // Add new templates
    const { data, error } = await supabase
      .from('template_audio_scripts')
      .insert(newTemplates)
      .select();
    
    if (error) {
      console.error('❌ Error adding templates:', error);
    } else {
      console.log(`✅ Successfully added ${data.length} Letter Hunt templates:`);
      data.forEach(template => {
        console.log(`  - ${template.name} (${template.asset_purpose})`);
      });
    }
    
    // Show final count
    const { data: finalCount, error: countError } = await supabase
      .from('template_audio_scripts')
      .select('id')
      .eq('template_type', 'letter-hunt');
    
    if (!countError) {
      console.log(`\n🎊 Total Letter Hunt templates: ${finalCount.length}`);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

addLetterHuntTemplates();
