const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNolanVideoIssue() {
  console.log('🔍 Debugging Nolan video publishing issue...\n');

  const videoId = '29b6e644-a3aa-4774-87dc-33227c9b431e';
  
  try {
    // 1. Check the video in child_approved_videos
    console.log('1. Checking video in child_approved_videos table...');
    const { data: video, error: videoError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('id', videoId)
      .single();
      
    if (videoError) {
      console.error('❌ Error finding video:', videoError);
      return;
    }
    
    console.log('📹 Video details:');
    console.log('  ID:', video.id);
    console.log('  Title:', video.video_title);
    console.log('  Child Name:', video.child_name);
    console.log('  Child ID:', video.child_id);
    console.log('  Personalization Level:', video.personalization_level);
    console.log('  Template Type:', video.template_type);
    console.log('  Is Published:', video.is_published);
    console.log('  Approval Status:', video.approval_status);
    console.log('  Created:', video.created_at);
    console.log('  Reviewed At:', video.reviewed_at);
    
    // 2. Check video assignments
    console.log('\n2. Checking video assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);
      
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError);
      
      // Try alternative column names or query structure
      console.log('\n   Trying alternative query...');
      const { data: altAssignments, error: altError } = await supabase
        .from('video_assignments')
        .select('id, video_id, child_id, assignment_type, status, publish_date, published_at, is_active, assigned_by')
        .eq('video_id', videoId);
        
      if (altError) {
        console.error('❌ Alternative query also failed:', altError);
      } else {
        assignments = altAssignments;
      }
    } else {
      console.log(`📋 Found ${assignments.length} assignments for this video:`);
      assignments.forEach((assignment, i) => {
        console.log(`\n  Assignment ${i+1}:`);
        console.log('    ID:', assignment.id);
        console.log('    Assignment Type:', assignment.assignment_type);
        console.log('    Child ID:', assignment.child_id || 'General (null)');
        console.log('    Theme:', assignment.theme || 'None');
        console.log('    Status:', assignment.status);
        console.log('    Publish Date:', assignment.publish_date);
        console.log('    Published At:', assignment.published_at);
        console.log('    Is Active:', assignment.is_active);
        console.log('    Assigned By:', assignment.assigned_by);
        console.log('    Created:', assignment.created_at);
      });
    }
    
    // 3. Check if Nolan exists and get his details
    console.log('\n3. Checking for Nolan in children table...');
    const { data: nolan, error: nolanError } = await supabase
      .from('children')
      .select('*')
      .eq('name', 'Nolan')
      .single();
      
    if (nolanError) {
      console.error('❌ Error finding Nolan:', nolanError);
    } else {
      console.log('👶 Nolan details:');
      console.log('  ID:', nolan.id);
      console.log('  Name:', nolan.name);
      console.log('  Age:', nolan.age);
      console.log('  Theme:', nolan.primary_interest);
      console.log('  Parent ID:', nolan.parent_id);
    }
    
    // 4. Check what children can see this video based on current assignments
    console.log('\n4. Checking which children can see this video...');
    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        if (assignment.status === 'published' && assignment.is_active) {
          if (assignment.child_id === null) {
            console.log('  ⚠️ GENERAL ASSIGNMENT - All children can see this video!');
          } else {
            const { data: assignedChild } = await supabase
              .from('children')
              .select('name, id')
              .eq('id', assignment.child_id)
              .single();
            
            if (assignedChild) {
              console.log(`  ✅ Individual assignment to: ${assignedChild.name} (${assignedChild.id})`);
            } else {
              console.log(`  ❓ Assignment to unknown child ID: ${assignment.child_id}`);
            }
          }
        } else {
          console.log(`  ⏸️ Inactive assignment (status: ${assignment.status})`);
        }
      }
    }
    
    // 5. Suggest a fix
    console.log('\n5. DIAGNOSIS & SOLUTION:');
    
    const generalAssignments = assignments?.filter(a => 
      a.child_id === null && 
      a.status === 'published' && 
      a.is_active
    ) || [];
    
    const individualAssignments = assignments?.filter(a => 
      a.child_id !== null && 
      a.status === 'published' && 
      a.is_active
    ) || [];
    
    if (generalAssignments.length > 0) {
      console.log('❌ ISSUE FOUND: This video has a GENERAL assignment!');
      console.log('   This means it appears for ALL children, not just Nolan.');
      console.log('\n💡 SOLUTION: Archive the general assignment and create an individual one for Nolan.');
      
      if (nolan) {
        console.log('\n🔧 TO FIX THIS, RUN:');
        console.log('   1. Archive the general assignment');
        console.log('   2. Create a new individual assignment for Nolan');
        console.log(`   3. Nolan's ID: ${nolan.id}`);
      }
    } else if (individualAssignments.length === 0) {
      console.log('❌ ISSUE FOUND: No active assignments found!');
      console.log('💡 SOLUTION: Create an individual assignment for Nolan.');
    } else {
      console.log('✅ Assignments look correct for individual publishing.');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugNolanVideoIssue();
