#!/usr/bin/env node

// Test script to create a test asset with a prompt to verify the UI displays it
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestAsset() {
  console.log('🧪 Creating test asset with prompt to verify UI display\n');

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create a test asset with a prompt
    const testAsset = {
      theme: 'test-name-show',
      type: 'image',
      prompt: 'A vibrant, colorful title screen showing "THE ANDREW SHOW" in large, playful letters with cute dog decorations around the border. The dogs should be in various poses - sitting, jumping, playing. Style should be 2D Pixar-like with bright colors and child-friendly appeal.',
      tags: ['test', 'name-show', 'dogs'],
      status: 'pending',
      file_url: 'https://via.placeholder.com/800x450/4299E1/FFFFFF?text=TEST+NAME+SHOW',
      metadata: {
        description: 'Test asset to verify prompt display in admin UI',
        personalization: 'personalized',
        child_name: 'Andrew',
        template: 'name-show',
        generated_at: new Date().toISOString(),
        generation_method: 'test-creation'
      }
    };

    console.log('📋 Creating asset:', {
      theme: testAsset.theme,
      type: testAsset.type,
      prompt: testAsset.prompt.substring(0, 100) + '...',
      child_name: testAsset.metadata.child_name
    });

    const { data, error } = await supabase
      .from('assets')
      .insert(testAsset)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test asset:', error);
      return;
    }

    console.log('\n✅ Test asset created successfully!');
    console.log(`   Asset ID: ${data.id}`);
    console.log(`   Theme: ${data.theme}`);
    console.log(`   Prompt: ${data.prompt ? 'SET' : 'NOT SET'}`);
    console.log(`   View in admin: http://localhost:3006/admin/assets`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
createTestAsset();
