const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLoreleiAndAndrewVideos() {
  console.log('🔧 Fixing Lorelei and Andrew video publishing issues...\n');

  const videoIds = [
    'b8e38e08-dfed-4d52-8745-f6b5d2537acb', // Lorelei
    '325f2dfa-c380-41fe-982b-addad3c40b14'  // Andrew
  ];
  
  // Get children info
  const { data: children } = await supabase
    .from('children')
    .select('id, name')
    .in('name', ['Lorelei', 'Andrew']);
    
  const loreleiId = children?.find(c => c.name === 'Lorelei')?.id;
  const andrewId = children?.find(c => c.name === 'Andrew')?.id;
  
  console.log('👶 Children IDs:');
  console.log(`  Lorelei: ${loreleiId}`);
  console.log(`  Andrew: ${andrewId}`);
  
  for (const videoId of videoIds) {
    try {
      console.log(`\n🔍 Processing video: ${videoId}`);
      
      // 1. Check the video details
      const { data: video, error: videoError } = await supabase
        .from('child_approved_videos')
        .select('id, video_title, child_name, child_id, personalization_level')
        .eq('id', videoId)
        .single();
        
      if (videoError || !video) {
        console.error(`❌ Video not found: ${videoId}`);
        continue;
      }
      
      console.log(`📹 Video: ${video.video_title}`);
      console.log(`  Child Name: ${video.child_name}`);
      console.log(`  Child ID: ${video.child_id}`);
      console.log(`  Personalization: ${video.personalization_level}`);
      
      // 2. Check current assignments
      const { data: assignments, error: assignError } = await supabase
        .from('video_assignments')
        .select('id, assignment_type, child_id, status, is_active')
        .eq('video_id', videoId);
        
      if (assignError) {
        console.error(`❌ Error checking assignments for ${videoId}:`, assignError);
        continue;
      }
      
      console.log(`📋 Current assignments (${assignments.length}):`);
      assignments.forEach((assignment, i) => {
        console.log(`  ${i+1}. Type: ${assignment.assignment_type}, Child: ${assignment.child_id || 'General'}, Status: ${assignment.status}, Active: ${assignment.is_active}`);
      });
      
      // 3. Find problematic general assignments
      const generalAssignments = assignments.filter(a => 
        a.child_id === null && 
        a.assignment_type === 'general' && 
        a.is_active
      );
      
      // 4. Determine target child based on video name
      let targetChildId = null;
      let targetChildName = '';
      
      if (video.child_name?.toLowerCase().includes('lorelei') || video.video_title?.toLowerCase().includes('lorelei')) {
        targetChildId = loreleiId;
        targetChildName = 'Lorelei';
      } else if (video.child_name?.toLowerCase().includes('andrew') || video.video_title?.toLowerCase().includes('andrew')) {
        targetChildId = andrewId;
        targetChildName = 'Andrew';
      }
      
      if (!targetChildId) {
        console.log(`⚠️ Could not determine target child for video: ${video.video_title}`);
        continue;
      }
      
      console.log(`🎯 Target child: ${targetChildName} (${targetChildId})`);
      
      // 5. Archive general assignments
      if (generalAssignments.length > 0) {
        console.log(`🗄️ Archiving ${generalAssignments.length} general assignment(s)...`);
        
        for (const assignment of generalAssignments) {
          const { error: archiveError } = await supabase
            .from('video_assignments')
            .update({ 
              status: 'archived',
              is_active: false,
              archived_at: new Date().toISOString()
            })
            .eq('id', assignment.id);
            
          if (archiveError) {
            console.error(`❌ Error archiving assignment ${assignment.id}:`, archiveError);
          } else {
            console.log(`✅ Archived general assignment: ${assignment.id}`);
          }
        }
      }
      
      // 6. Check if individual assignment to target child exists
      const individualAssignment = assignments.find(a => 
        a.child_id === targetChildId && 
        a.assignment_type === 'individual'
      );
      
      if (individualAssignment) {
        console.log(`✅ Individual assignment to ${targetChildName} already exists: ${individualAssignment.id}`);
        
        // Make sure it's active and published
        if (individualAssignment.status !== 'published' || !individualAssignment.is_active) {
          console.log(`🔄 Updating assignment status to published and active...`);
          
          const { error: updateError } = await supabase
            .from('video_assignments')
            .update({ 
              status: 'published',
              is_active: true,
              published_at: new Date().toISOString()
            })
            .eq('id', individualAssignment.id);
            
          if (updateError) {
            console.error(`❌ Error updating assignment:`, updateError);
          } else {
            console.log(`✅ Assignment updated to published and active`);
          }
        }
      } else {
        console.log(`📝 Creating individual assignment to ${targetChildName}...`);
        
        const { error: createError } = await supabase
          .from('video_assignments')
          .insert({
            video_id: videoId,
            child_id: targetChildId,
            assignment_type: 'individual',
            publish_date: new Date().toISOString().split('T')[0],
            status: 'published',
            published_at: new Date().toISOString(),
            is_active: true,
            assigned_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d' // Use consistent user ID
          });
          
        if (createError) {
          console.error(`❌ Error creating assignment:`, createError);
        } else {
          console.log(`✅ Individual assignment to ${targetChildName} created!`);
        }
      }
      
      console.log(`✅ Video ${videoId} fixed for ${targetChildName}`);
      
    } catch (error) {
      console.error(`❌ Error processing video ${videoId}:`, error);
    }
  }
  
  // 7. Final verification
  console.log('\n🔍 Final verification...');
  
  for (const videoId of videoIds) {
    const { data: finalAssignments } = await supabase
      .from('video_assignments')
      .select('assignment_type, child_id, status, is_active')
      .eq('video_id', videoId)
      .eq('is_active', true);
      
    console.log(`\nVideo ${videoId} active assignments:`);
    finalAssignments?.forEach((assignment, i) => {
      const type = assignment.child_id ? 'Individual' : 'General';
      const target = assignment.child_id ? 
        (assignment.child_id === loreleiId ? 'Lorelei' : 
         assignment.child_id === andrewId ? 'Andrew' : 
         assignment.child_id) : 'All children';
      console.log(`  ${i+1}. ${type} (${assignment.status}) -> ${target}`);
    });
  }
  
  console.log('\n🎉 Fix completed! Both videos should now only appear for their intended children.');
}

fixLoreleiAndAndrewVideos();
