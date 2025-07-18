require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWishButtonPrompts() {
  console.log('🔍 Checking Wish Button prompts in database...');
  
  // Check for duplicate prompts
  const { data: prompts, error } = await supabaseAdmin
    .from('prompts')
    .select('*')
    .eq('metadata->>template', 'wish-button')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching prompts:', error);
    return;
  }

  console.log(`📊 Found ${prompts.length} wish-button prompts total`);

  // Group by page and asset type
  const groupedPrompts = {};
  prompts.forEach(prompt => {
    const page = prompt.metadata?.page || 'unknown';
    const assetType = prompt.asset_type || 'unknown';
    const key = `${page}_${assetType}`;
    
    if (!groupedPrompts[key]) {
      groupedPrompts[key] = [];
    }
    groupedPrompts[key].push(prompt);
  });

  console.log('\n📋 Prompts by page and asset type:');
  Object.entries(groupedPrompts).forEach(([key, promptList]) => {
    console.log(`${key}: ${promptList.length} prompts`);
    if (promptList.length > 1) {
      console.log(`  ⚠️ DUPLICATES FOUND - IDs: ${promptList.map(p => p.id).join(', ')}`);
      console.log(`  📅 Dates: ${promptList.map(p => p.created_at).join(', ')}`);
    }
  });

  // Check specifically for image prompts
  console.log('\n🖼️ Image prompts specifically:');
  ['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9'].forEach(page => {
    const imagePrompts = prompts.filter(p => 
      p.asset_type === 'image' && 
      p.metadata?.page === page
    );
    console.log(`${page}: ${imagePrompts.length} image prompts`);
    if (imagePrompts.length > 1) {
      console.log(`  ⚠️ Multiple found: ${imagePrompts.map(p => `${p.id} (${p.created_at})`).join(', ')}`);
    }
  });
}

checkWishButtonPrompts().catch(console.error);
