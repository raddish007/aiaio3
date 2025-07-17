require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findMisassignedLetterVideos() {
  console.log('🔍 Checking for other misassigned letter-specific videos...\n');

  try {
    console.log('1. Finding videos that might be letter-specific but assigned as general...');
    
    // Get all general assignments
    const { data: generalAssignments, error: generalError } = await supabase
      .from('video_assignments')
      .select(`
        *,
        child_approved_videos (
          video_title,
          child_name,
          template_type,
          template_data
        )
      `)
      .eq('assignment_type', 'general')
      .is('child_id', null)
      .eq('status', 'published');

    if (generalError) {
      console.error('❌ Error fetching general assignments:', generalError);
      return;
    }

    console.log(`Found ${generalAssignments.length} general assignments`);

    console.log('\n2. Checking for potential letter-specific videos...');
    
    const suspiciousVideos = [];
    
    generalAssignments.forEach(assignment => {
      const video = assignment.child_approved_videos;
      if (video) {
        const title = video.video_title?.toLowerCase() || '';
        const childName = video.child_name?.toLowerCase() || '';
        
        // Check if the video seems letter-specific
        const hasLetterInTitle = /letter [a-z]/.test(title);
        const hasSpecificChildName = childName && childName !== 'general';
        const templateData = video.template_data || {};
        const hasLetterInData = JSON.stringify(templateData).toLowerCase().includes('letter');
        
        if (hasLetterInTitle || (hasSpecificChildName && hasLetterInData)) {
          suspiciousVideos.push({
            assignment_id: assignment.id,
            video_id: assignment.video_id,
            video_title: video.video_title,
            child_name: video.child_name,
            template_type: video.template_type,
            reasons: [
              hasLetterInTitle && 'Title contains letter reference',
              hasSpecificChildName && 'Has specific child name',
              hasLetterInData && 'Template data contains letter reference'
            ].filter(Boolean)
          });
        }
      }
    });

    if (suspiciousVideos.length > 0) {
      console.log(`\n⚠️  Found ${suspiciousVideos.length} potentially misassigned videos:`);
      
      suspiciousVideos.forEach((video, i) => {
        console.log(`\n   ${i+1}. "${video.video_title}"`);
        console.log(`      Video ID: ${video.video_id}`);
        console.log(`      Child Name: ${video.child_name}`);
        console.log(`      Template Type: ${video.template_type}`);
        console.log(`      Reasons: ${video.reasons.join(', ')}`);
      });

      console.log('\n💡 These videos may need to be reassigned as individual assignments');
      console.log('   to their specific children instead of being general.');
    } else {
      console.log('\n✅ No obviously misassigned letter-specific videos found.');
    }

    console.log('\n3. Checking the three children for their current video counts...');
    
    const childIds = [
      { id: '6a248ddf-fdf0-4645-9a80-e82bf7672d70', name: 'Nolan' },
      { id: '2d1db6d7-06da-430e-ab27-1886913eb469', name: 'Lorelei' },
      { id: '87109f4e-c10c-4400-a838-0cffad09b0a5', name: 'Andrew' }
    ];

    for (const child of childIds) {
      // Count individual assignments
      const { data: individualAssignments } = await supabase
        .from('video_assignments')
        .select('id')
        .eq('child_id', child.id)
        .eq('assignment_type', 'individual')
        .eq('status', 'published');

      // Count general assignments (these apply to all children)
      const { data: generalCount } = await supabase
        .from('video_assignments')
        .select('id')
        .eq('assignment_type', 'general')
        .is('child_id', null)
        .eq('status', 'published');

      console.log(`\n   ${child.name}:`);
      console.log(`     Individual videos: ${individualAssignments?.length || 0}`);
      console.log(`     General videos: ${generalCount?.length || 0} (shared with all children)`);
      console.log(`     Total videos: ${(individualAssignments?.length || 0) + (generalCount?.length || 0)}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

findMisassignedLetterVideos().catch(console.error);
