// Script to generate and update playlists for each child in the child_playlists table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateChildPlaylists() {
  console.log('🧩 Updating child playlists...');

  // 1. Get all children
  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('*');
  if (childrenError) {
    console.error('❌ Error fetching children:', childrenError);
    return;
  }

  // 2. For each child, gather their videos
  for (const child of children) {
    // Get all approved, active videos with assignments
    const { data: videosRaw, error: videosError } = await supabase
      .from('child_approved_videos')
      .select('*, video_assignments(*)')
      .eq('approval_status', 'approved')
      .eq('is_active', true);
    if (videosError) {
      console.error(`❌ Error fetching videos for child ${child.name}:`, videosError);
      continue;
    }

    // Filter for child-specific videos (only published/pending assignments)
    const childSpecific = videosRaw.filter(video =>
      Array.isArray(video.video_assignments) &&
      video.video_assignments.some((a) => 
        a.child_id === child.id && 
        (a.status === 'published' || a.status === 'pending')
      )
    );
    
    // General videos from child_approved_videos (only published/pending assignments)
    const general = videosRaw.filter(video =>
      Array.isArray(video.video_assignments) &&
      video.video_assignments.some((a) => 
        a.child_id === null && 
        (a.status === 'published' || a.status === 'pending')
      )
    );
    
    // Theme-specific videos from child_approved_videos (only if published and not archived)
    const theme = videosRaw.filter(video =>
      video.personalization_level === 'theme_specific' &&
      video.child_theme === child.primary_interest &&
      video.is_published === true &&
      Array.isArray(video.video_assignments) &&
      video.video_assignments.some((a) => a.status === 'published' || a.status === 'pending')
    );
    
    // Combine and deduplicate (using video_url as unique identifier)
    const all = [...childSpecific, ...general, ...theme];
    const unique = all.filter((v, i, self) => 
      i === self.findIndex(x => 
        (x.video_url === v.video_url) || 
        (x.id === v.id && x.id !== undefined)
      )
    );

    // Format for playlist
    const playlist = unique.map(video => {
      // Only get active assignments (not archived)
      let assignment = (video.video_assignments || [])
        .filter(a => a.status === 'published' || a.status === 'pending')
        .find(a => a.child_id === child.id) ||
        (video.video_assignments || [])
        .filter(a => a.status === 'published' || a.status === 'pending')
        .find(a => a.child_id === null) ||
        (video.video_assignments || [])
        .filter(a => a.status === 'published' || a.status === 'pending')[0];
      
      // Skip this video if no active assignment found
      if (!assignment) {
        return null;
      }
      
      return {
        id: video.id,
        title: video.consumer_title || video.video_title,
        description: video.consumer_description || '',
        parent_tip: video.parent_tip || '',
        display_image: video.display_image_url || '',
        video_url: video.video_url,
        publish_date: assignment?.publish_date || video.created_at,
        personalization_level: video.personalization_level,
        child_theme: video.child_theme,
        duration_seconds: video.duration_seconds,
        is_published: video.is_published,
        metadata: {
          source: 'child_approved_videos',
          assignment_status: assignment.status,
          ...video.template_data,
          assignment_metadata: assignment?.metadata || {}
        }
      };
    }).filter(video => video !== null); // Remove null entries from videos with no active assignments
    playlist.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

    // 3. Upsert into child_playlists
    const { error: upsertError } = await supabase
      .from('child_playlists')
      .upsert({ child_id: child.id, videos: playlist, updated_at: new Date().toISOString() });
    if (upsertError) {
      console.error(`❌ Error upserting playlist for child ${child.name}:`, upsertError);
    } else {
      const approvedCount = playlist.filter(v => v.metadata?.source === 'child_approved_videos').length;
      console.log(`✅ Updated playlist for ${child.name} (${playlist.length} total videos from child_approved_videos)`);
    }
  }

  console.log('🎉 Done updating playlists!');
}

// If the child_playlists table does not exist, run this SQL in Supabase:
//
// CREATE TABLE child_playlists (
//   child_id UUID PRIMARY KEY REFERENCES children(id),
//   videos JSONB NOT NULL,
//   updated_at TIMESTAMP DEFAULT NOW()
// );

module.exports = { updateChildPlaylists }; 