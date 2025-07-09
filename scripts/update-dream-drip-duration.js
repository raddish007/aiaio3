const { supabaseAdmin } = require('../lib/supabase');

async function updateDreamDripDuration() {
  try {
    console.log('🎵 Updating Dream Drip duration to 108 seconds...');
    
    const { data, error } = await supabaseAdmin
      .from('assets')
      .update({
        metadata: {
          prompt: "",
          review: {
            safe_zone: ["not_applicable"],
            reviewed_at: "2025-07-08T15:40:24.306Z",
            reviewed_by: "1cb80063-9b5f-4fff-84eb-309f12bd247d",
            approval_notes: ""
          },
          volume: 0.9,
          duration: 108, // Updated to 108 seconds
          template: "lullaby",
          child_name: "",
          description: "Dream Drip bedtime song",
          duration_source: "estimated_from_file_size",
          personalization: "general",
          duration_extracted_at: "2025-07-09T00:38:07.357Z"
        }
      })
      .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
      .select();

    if (error) {
      console.error('❌ Error updating duration:', error);
      return;
    }

    console.log('✅ Successfully updated Dream Drip duration to 108 seconds');
    console.log('Updated asset:', data[0]);
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

updateDreamDripDuration(); 