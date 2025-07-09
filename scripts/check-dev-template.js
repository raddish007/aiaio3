const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevTemplate() {
  console.log('🔍 Checking Dev template...\n');

  try {
    // Query for the Dev template
    const { data: templates, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('type', 'dev')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching templates:', error);
      return;
    }

    if (templates.length === 0) {
      console.log('❌ No Dev templates found');
      return;
    }

    console.log(`✅ Found ${templates.length} Dev template(s):\n`);

    templates.forEach((template, index) => {
      console.log(`📋 Template ${index + 1}:`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Type: ${template.type}`);
      console.log(`   Description: ${template.description || 'None'}`);
      console.log(`   Created: ${new Date(template.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(template.updated_at).toLocaleString()}`);
      
      console.log(`\n   📦 Global Elements (${template.global_elements?.length || 0}):`);
      if (template.global_elements && template.global_elements.length > 0) {
        template.global_elements.forEach((el, i) => {
          console.log(`     ${i + 1}. ${el.type} - ${el.asset_purpose}`);
          console.log(`        Description: ${el.description}`);
          console.log(`        Asset Type: ${el.asset_type}`);
          if (el.asset_type === 'specific' && el.specific_asset_id) {
            console.log(`        Specific Asset ID: ${el.specific_asset_id}`);
            console.log(`        Specific Asset Name: ${el.specific_asset_name}`);
          } else if (el.asset_type === 'class' && el.asset_class) {
            console.log(`        Asset Class: ${el.asset_class}`);
          }
          console.log(`        Required: ${el.required}`);
        });
      } else {
        console.log('     None');
      }

      console.log(`\n   🎬 Parts (${template.parts?.length || 0}):`);
      if (template.parts && template.parts.length > 0) {
        template.parts.forEach((part, i) => {
          console.log(`     ${i + 1}. ${part.name} (${part.type})`);
          console.log(`        Duration: ${part.duration} seconds`);
          console.log(`        Order: ${part.order}`);
          console.log(`        Audio Elements: ${part.audio_elements?.length || 0}`);
          console.log(`        Image Elements: ${part.image_elements?.length || 0}`);
          
          if (part.audio_elements && part.audio_elements.length > 0) {
            console.log(`        Audio Elements:`);
            part.audio_elements.forEach((audio, j) => {
              console.log(`          ${j + 1}. ${audio.asset_purpose} (${audio.asset_type})`);
            });
          }
          
          if (part.image_elements && part.image_elements.length > 0) {
            console.log(`        Image Elements:`);
            part.image_elements.forEach((image, j) => {
              console.log(`          ${j + 1}. ${image.asset_purpose} (${image.asset_type}) - Safe Zone: ${image.safe_zone}`);
            });
          }
        });
      } else {
        console.log('     None');
      }

      console.log(`\n   📊 Structure (legacy):`);
      console.log(`     ${JSON.stringify(template.structure, null, 2)}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDevTemplate(); 