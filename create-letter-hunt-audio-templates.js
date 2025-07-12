require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const letterHuntAudioTemplates = [
  {
    name: 'Letter Hunt Title Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'titleAudio',
    script: "[NAME]'s letter hunt!",
    voice_id: '248nvfaZe8BXhKntjmpp', // Murph voice
    speed: 1.0,
    description: 'Title announcement for Letter Hunt video',
    tags: ['letter-hunt', 'title', 'announcement']
  },
  {
    name: 'Letter Hunt Intro Audio',
    template_type: 'letter-hunt', 
    asset_purpose: 'introAudio',
    script: "Today we're looking for the letter [LETTER]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Introduction explaining target letter',
    tags: ['letter-hunt', 'intro', 'explanation']
  },
  {
    name: 'Letter Hunt Search Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'intro2Audio', 
    script: "Everywhere you go, look for the letter [LETTER]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Instruction to search for the letter',
    tags: ['letter-hunt', 'search', 'instruction']
  },
  {
    name: 'Letter Hunt Signs Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'signAudio',
    script: "On signs",
    voice_id: '248nvfaZe8BXhKntjmpp', 
    speed: 1.0,
    description: 'Voiceover for signs segment',
    tags: ['letter-hunt', 'signs', 'location']
  },
  {
    name: 'Letter Hunt Books Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'bookAudio',
    script: "On books",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Voiceover for books segment', 
    tags: ['letter-hunt', 'books', 'location']
  },
  {
    name: 'Letter Hunt Grocery Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'groceryAudio',
    script: "Even in the grocery store!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Voiceover for grocery store segment',
    tags: ['letter-hunt', 'grocery', 'location']
  },
  {
    name: 'Letter Hunt Happy Dance Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'happyDanceAudio',
    script: "And when you find your letter, I want you to do a little happy dance!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Instruction for happy dance celebration',
    tags: ['letter-hunt', 'celebration', 'dance']
  },
  {
    name: 'Letter Hunt Ending Audio',
    template_type: 'letter-hunt',
    asset_purpose: 'endingAudio', 
    script: "Have fun finding the letter [LETTER], [NAME]!",
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 1.0,
    description: 'Encouraging farewell message',
    tags: ['letter-hunt', 'ending', 'encouragement']
  }
];

(async () => {
  try {
    console.log('🎤 Creating Letter Hunt audio templates...');
    
    // Check if templates already exist
    for (const template of letterHuntAudioTemplates) {
      const { data: existing } = await supabase
        .from('template_audio_scripts')
        .select('id, name')
        .eq('template_type', template.template_type)
        .eq('asset_purpose', template.asset_purpose)
        .single();
      
      if (existing) {
        console.log(`⏭️  Skipping ${template.name} - already exists`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('template_audio_scripts')
        .insert(template)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating ${template.name}:`, error);
      } else {
        console.log(`✅ Created: ${data.name} (${data.asset_purpose})`);
      }
    }
    
    console.log('\n🎉 Letter Hunt audio templates setup complete!');
    
  } catch (e) {
    console.error('❌ Script error:', e.message);
  }
})();
