import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not available' });
  }

  try {
    const { templateType, daysThreshold = 30 } = req.query;

    // Get all children with their parent info
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select(`
        id,
        name,
        age,
        primary_interest,
        parent_id,
        users!parent_id(email)
      `)
      .order('name');

    if (childrenError) {
      throw new Error(`Error fetching children: ${childrenError.message}`);
    }

    if (!children || children.length === 0) {
      return res.status(200).json({
        success: true,
        templateType: templateType || 'all',
        daysThreshold: parseInt(daysThreshold as string),
        totalChildren: 0,
        childrenMissingVideos: [],
        summary: 'No children found in database',
        stats: {
          totalWithNoVideos: 0,
          totalWithOldVideos: 0
        }
      });
    }

    // Get existing video jobs for this template type (if table exists)
    let videoJobs: any[] = [];
    try {
      let videoJobsQuery = supabaseAdmin
        .from('video_jobs')
        .select(`
          id,
          child_name,
          template_name,
          status,
          created_at,
          output_url
        `)
        .in('status', ['completed', 'approved', 'published']);

      // Filter by template type if specified
      if (templateType && templateType !== 'all') {
        videoJobsQuery = videoJobsQuery.ilike('template_name', `%${templateType}%`);
      }

      const { data, error: jobsError } = await videoJobsQuery;

      if (jobsError) {
        console.warn(`Error fetching video jobs (table may not exist): ${jobsError.message}`);
        videoJobs = []; // Continue without video_jobs data
      } else {
        videoJobs = data || [];
      }
    } catch (error) {
      console.warn('video_jobs table not accessible, continuing with approved_videos only');
      videoJobs = [];
    }

    // Also get videos from the child_approved_videos table (approved and pending review)
    let approvedVideosQuery = supabaseAdmin
      .from('child_approved_videos')
      .select(`
        id,
        child_id,
        child_name,
        template_type,
        approval_status,
        created_at,
        video_url
      `)
      .in('approval_status', ['approved', 'pending_review']);

    // Filter by template type if specified
    if (templateType && templateType !== 'all') {
      approvedVideosQuery = approvedVideosQuery.eq('template_type', templateType);
    }

    const { data: approvedVideos, error: approvedError } = await approvedVideosQuery;

    if (approvedError) {
      console.warn(`Error fetching approved videos: ${approvedError.message}`);
    }

    // Analyze which children are missing videos
    const childrenMissingVideos = [];
    const threshold = parseInt(daysThreshold as string);

    for (const child of children) {
      // Check both video_jobs and child_approved_videos
      const childVideos = videoJobs?.filter(job => 
        job.child_name?.toLowerCase() === child.name.toLowerCase()
      ) || [];

      // Match by child_id first (more reliable), then fallback to name matching
      const childApprovedVideos = approvedVideos?.filter((video: any) => {
        // Priority 1: Exact child_id match
        if (video.child_id === child.id) {
          return true;
        }
        // Priority 2: Name match only if no child_id is available or doesn't match any other child
        if (!video.child_id && video.child_name?.toLowerCase() === child.name.toLowerCase()) {
          return true;
        }
        return false;
      }) || [];

      // Combine all videos for this child
      const allChildVideos = [
        ...childVideos.map(job => ({
          created_at: job.created_at,
          source: 'video_jobs',
          template: job.template_name,
          status: job.status
        })),
        ...childApprovedVideos.map((video: any) => ({
          created_at: video.created_at,
          source: 'approved_videos',
          template: video.template_type,
          status: video.approval_status
        }))
      ];

      let missingReason = '';
      let lastVideoDate = null;

      if (allChildVideos.length === 0) {
        missingReason = 'No videos found';
      } else {
        // Check if videos are recent enough
        const latestVideo = allChildVideos.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const daysSinceLastVideo = Math.floor(
          (Date.now() - new Date(latestVideo.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        lastVideoDate = latestVideo.created_at;

        if (daysSinceLastVideo > threshold) {
          missingReason = `Last video ${daysSinceLastVideo} days ago`;
        }
      }

      if (missingReason) {
        childrenMissingVideos.push({
          id: child.id,
          name: child.name,
          age: child.age,
          primary_interest: child.primary_interest,
          parent_email: (child as any).users?.email,
          missingReason,
          lastVideoDate,
          totalVideos: allChildVideos.length
        });
      }
    }

    return res.status(200).json({
      success: true,
      templateType: templateType || 'all',
      daysThreshold: threshold,
      totalChildren: children.length,
      childrenMissingVideos,
      summary: `${childrenMissingVideos.length} of ${children.length} children need videos`,
      stats: {
        totalWithNoVideos: childrenMissingVideos.filter(c => c.totalVideos === 0).length,
        totalWithOldVideos: childrenMissingVideos.filter(c => c.totalVideos > 0).length
      }
    });

  } catch (error) {
    console.error('Error checking missing videos:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
