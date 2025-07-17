import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

interface VideoForModeration {
  id: string;
  video_url: string;
  video_title: string;
  child_id: string;
  child_name: string;
  child_age: number;
  child_theme: string;
  personalization_level: 'generic' | 'theme_specific' | 'child_specific';
  approval_status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  submitted_by: string;
  created_at: string;
  duration_seconds: number;
  template_type: string;
  template_data: any;
  is_published?: boolean;
  video_moderation_queue?: {
    id: string;
    assigned_to: string | null;
    priority: number;
    status: string;
  };
}

export default function VideoModeration() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoForModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoForModeration | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [user, setUser] = useState<any>(null);
  
  // Bulk moderation state
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'reject' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchVideos();
  }, [filter]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['content_manager', 'asset_creator', 'video_ops'].includes(userProfile.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
  };

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_moderation_queue (
            id,
            assigned_to,
            priority,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('approval_status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (videoId: string) => {
    if (!user) return;

    try {
      // Get the video data for migration
      const selectedVideoData = videos.find(v => v.id === videoId);
      if (!selectedVideoData) {
        console.error('Video not found');
        return;
      }

      let finalVideoUrl = selectedVideoData.video_url;
      let migrationInfo = undefined;

      // Check if this is a Remotion video that needs migration
      if (selectedVideoData.video_url.includes('remotionlambda')) {
        console.log('🔄 Migrating Remotion video to public bucket...');
        
        try {
          // Import and use the migration function
          const { copyRemotionVideoToPublicBucket } = await import('@/lib/video-approval');
          
          const publicUrl = await copyRemotionVideoToPublicBucket(
            selectedVideoData.video_url,
            selectedVideoData.id,
            selectedVideoData.child_name
          );
          
          finalVideoUrl = publicUrl;
          migrationInfo = {
            originalUrl: selectedVideoData.video_url,
            migratedUrl: finalVideoUrl,
            migratedAt: new Date().toISOString(),
            migrationType: 'auto-on-approval'
          };
          console.log('✅ Video migrated to public bucket:', publicUrl);
        } catch (migrationError) {
          console.warn('⚠️ Migration failed, proceeding with original URL:', migrationError);
          // Don't fail approval if migration fails - video can still be approved with original URL
        }
      } else if (selectedVideoData.video_url.includes('aiaio3-public-videos')) {
        console.log('✅ Video already in public bucket, no migration needed');
      } else {
        console.log('ℹ️ Video from unknown source, using original URL');
      }

      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          approval_status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          approval_notes: reviewNotes,
          video_url: finalVideoUrl, // Use migrated URL if available
          template_data: {
            ...selectedVideoData.template_data,
            migration: migrationInfo || selectedVideoData.template_data?.migration
          }
        })
        .eq('id', videoId);

      if (error) {
        console.error('Error approving video:', error);
        return;
      }

      // Add to review history
      await supabase
        .from('video_review_history')
        .insert({
          child_approved_video_id: videoId,
          reviewer_id: user.id,
          review_action: 'approved',
          review_notes: reviewNotes
        });

      // Update moderation queue
      await supabase
        .from('video_moderation_queue')
        .update({
          status: 'approved',
          review_notes: reviewNotes
        })
        .eq('child_approved_video_id', videoId);

      // Find and update corresponding assignment if it exists
      if (selectedVideoData) {
        try {
          const { data: assignment, error: assignmentFindError } = await supabase
            .from('child_video_assignments')
            .select('id')
            .eq('child_id', selectedVideoData.child_id)
            .eq('template_type', selectedVideoData.template_type)
            .single();

          if (!assignmentFindError && assignment) {
            await supabase
              .from('child_video_assignments')
              .update({
                status: 'approved',
                output_video_url: finalVideoUrl, // Use migrated URL
                approved_at: new Date().toISOString(),
                approved_by: user.id
              })
              .eq('id', assignment.id);
            
            console.log('✅ Assignment status updated to approved');
          }
        } catch (assignmentError) {
          console.warn('Could not update assignment status:', assignmentError);
          // Don't fail the whole approval if assignment update fails
        }
      }

      setReviewNotes('');
      setSelectedVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error approving video:', error);
    }
  };

  const handleReject = async (videoId: string) => {
    if (!user || !reviewNotes.trim()) {
      alert('Please provide rejection reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          approval_status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reviewNotes
        })
        .eq('id', videoId);

      if (error) {
        console.error('Error rejecting video:', error);
        return;
      }

      // Add to review history
      await supabase
        .from('video_review_history')
        .insert({
          child_approved_video_id: videoId,
          reviewer_id: user.id,
          review_action: 'rejected',
          review_notes: reviewNotes
        });

      // Update moderation queue
      await supabase
        .from('video_moderation_queue')
        .update({
          status: 'rejected',
          review_notes: reviewNotes
        })
        .eq('child_approved_video_id', videoId);

      setReviewNotes('');
      setSelectedVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error rejecting video:', error);
    }
  };

  const handleNeedsRevision = async (videoId: string) => {
    if (!user || !reviewNotes.trim()) {
      alert('Please provide revision notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          approval_status: 'needs_revision',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          approval_notes: reviewNotes
        })
        .eq('id', videoId);

      if (error) {
        console.error('Error marking video for revision:', error);
        return;
      }

      // Add to review history
      await supabase
        .from('video_review_history')
        .insert({
          child_approved_video_id: videoId,
          reviewer_id: user.id,
          review_action: 'needs_revision',
          review_notes: reviewNotes
        });

      // Update moderation queue
      await supabase
        .from('video_moderation_queue')
        .update({
          status: 'needs_revision',
          review_notes: reviewNotes
        })
        .eq('child_approved_video_id', videoId);

      setReviewNotes('');
      setSelectedVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error marking video for revision:', error);
    }
  };

  // Bulk moderation functions
  const handleSelectVideo = (videoId: string, checked: boolean) => {
    const newSelected = new Set(selectedVideos);
    if (checked) {
      newSelected.add(videoId);
    } else {
      newSelected.delete(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVideoIds = new Set(videos.map(v => v.id));
      setSelectedVideos(allVideoIds);
    } else {
      setSelectedVideos(new Set());
    }
  };

  const handleBulkAction = (action: 'delete' | 'reject') => {
    if (selectedVideos.size === 0) {
      alert('Please select at least one video');
      return;
    }
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const executeBulkAction = async () => {
    if (!user || selectedVideos.size === 0) return;

    try {
      const videoIds = Array.from(selectedVideos);
      
      if (bulkAction === 'delete') {
        // Delete videos from database
        const { error } = await supabase
          .from('child_approved_videos')
          .delete()
          .in('id', videoIds);

        if (error) {
          console.error('Error deleting videos:', error);
          alert('Error deleting videos: ' + error.message);
          return;
        }

        // Also delete from moderation queue
        await supabase
          .from('video_moderation_queue')
          .delete()
          .in('child_approved_video_id', videoIds);

        console.log(`✅ Bulk deleted ${videoIds.length} videos`);
      } else if (bulkAction === 'reject') {
        if (!bulkNotes.trim()) {
          alert('Please provide rejection reason');
          return;
        }

        // Reject videos
        const { error } = await supabase
          .from('child_approved_videos')
          .update({
            approval_status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: bulkNotes
          })
          .in('id', videoIds);

        if (error) {
          console.error('Error rejecting videos:', error);
          alert('Error rejecting videos: ' + error.message);
          return;
        }

        // Add to review history for each video
        const reviewHistoryRecords = videoIds.map(id => ({
          child_approved_video_id: id,
          reviewer_id: user.id,
          review_action: 'rejected',
          review_notes: bulkNotes
        }));

        await supabase
          .from('video_review_history')
          .insert(reviewHistoryRecords);

        // Update moderation queue
        await supabase
          .from('video_moderation_queue')
          .update({
            status: 'rejected',
            review_notes: bulkNotes
          })
          .in('child_approved_video_id', videoIds);

        console.log(`✅ Bulk rejected ${videoIds.length} videos`);
      }

      // Reset state and refresh
      setSelectedVideos(new Set());
      setBulkAction('');
      setBulkNotes('');
      setShowBulkModal(false);
      fetchVideos();
      
      alert(`✅ Successfully ${bulkAction === 'delete' ? 'deleted' : 'rejected'} ${videoIds.length} videos`);
    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('Error executing bulk action: ' + (error as Error).message);
    }
  };

  const handleTogglePublish = async (videoId: string, currentPublishStatus: boolean) => {
    if (!user) return;

    try {
      const newPublishStatus = !currentPublishStatus;
      
      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          is_published: newPublishStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (error) {
        console.error('Error toggling publish status:', error);
        alert('Failed to update publish status');
        return;
      }

      // Update local state
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, is_published: newPublishStatus }
          : video
      ));

      // Update selected video if it's the one being modified
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(prev => prev ? { ...prev, is_published: newPublishStatus } : null);
      }

      alert(`Video ${newPublishStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update publish status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPersonalizationBadge = (level: string) => {
    switch (level) {
      case 'child_specific': return 'bg-purple-100 text-purple-800';
      case 'theme_specific': return 'bg-blue-100 text-blue-800';
      case 'generic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Video Moderation" 
        subtitle="Review and approve videos for child consumption"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters and Bulk Actions */}
        <div className="mb-6">
          {/* Filter buttons */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              All Videos
            </button>
            <button
              onClick={() => setFilter('pending_review')}
              className={`px-4 py-2 rounded-md ${
                filter === 'pending_review' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-md ${
                filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-md ${
                filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Bulk Actions */}
          {videos.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVideos.size === videos.length && videos.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Select All ({selectedVideos.size} of {videos.length} selected)
                    </span>
                  </label>
                </div>
                
                {selectedVideos.size > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                    >
                      Bulk Reject ({selectedVideos.size})
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Bulk Delete ({selectedVideos.size})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="grid gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Checkbox for selection */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={(e) => handleSelectVideo(video.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{video.video_title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.approval_status)}`}>
                        {video.approval_status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalizationBadge(video.personalization_level)}`}>
                        {video.personalization_level.replace('_', ' ')}
                      </span>
                      {/* Migration Status Badge */}
                      {video.video_url.includes('remotionlambda') && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Auto-Migrate</span>
                        </span>
                      )}
                      {video.template_data?.migration && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Migrated</span>
                        </span>
                      )}
                      {video.approval_status === 'approved' && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                          video.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                              video.is_published 
                                ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l3.122-3.122 3.122 3.122-3.122 3.122z"
                            } />
                          </svg>
                          <span>{video.is_published ? 'Published' : 'Unpublished'}</span>
                        </span>
                      )}
                    </div>                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Child:</span> {video.child_name} ({video.child_age})
                      </div>
                      <div>
                        <span className="font-medium">Theme:</span> {video.child_theme}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {video.duration_seconds}s
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Video URL Link */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Video URL:</span>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>View Video</span>
                        </a>
                      </div>
                    </div>

                    {/* Supabase URL Link */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Database Record:</span>
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/app/editor/table/child_approved_videos?row=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>View in Supabase</span>
                        </a>
                      </div>
                    </div>

                    {/* Video Preview */}
                    <div className="mb-4">
                      <video
                        controls
                        className="w-full max-w-md rounded-lg"
                        src={video.video_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      {video.approval_status === 'pending_review' && (
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Review Video
                        </button>
                      )}
                      
                      {video.approval_status === 'approved' && (
                        <>
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleTogglePublish(video.id, video.is_published || false)}
                            className={`px-4 py-2 rounded-md font-medium ${
                              video.is_published
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {video.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No videos found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Review Video: {selectedVideo.video_title}</h2>
              
              <div className="mb-4">
                <video
                  controls
                  className="w-full rounded-lg"
                  src={selectedVideo.video_url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video URL Link in Modal */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Video URL:</span>
                  <a
                    href={selectedVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>View Video</span>
                  </a>
                </div>
              </div>

              {/* Supabase URL Link in Modal */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Database Record:</span>
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/app/editor/table/child_approved_videos?row=${selectedVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View in Supabase</span>
                  </a>
                </div>
              </div>

              {/* Migration Status Indicator */}
              {selectedVideo.video_url.includes('remotionlambda') && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Remotion Video - Auto-Migration</p>
                      <p className="text-xs text-blue-700">
                        When approved, this video will be automatically copied to the public CDN bucket for better performance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show if video was already migrated */}
              {selectedVideo.template_data?.migration && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">Video Migrated</p>
                      <p className="text-xs text-green-700">
                        This video was migrated to the public CDN bucket on {new Date(selectedVideo.template_data.migration.migratedAt).toLocaleString()}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show status for videos already in public bucket (manually uploaded or previously migrated) */}
              {selectedVideo.video_url.includes('aiaio3-public-videos') && !selectedVideo.template_data?.migration && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">Public CDN Video</p>
                      <p className="text-xs text-green-700">
                        This video is already stored in the public CDN bucket for optimal streaming performance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Add your review notes here..."
                />
              </div>

              {/* Show publish status for approved videos */}
              {selectedVideo.approval_status === 'approved' && (
                <div className={`mb-4 p-3 border rounded-md ${
                  selectedVideo.is_published 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className={`w-5 h-5 ${
                        selectedVideo.is_published ? 'text-green-600' : 'text-yellow-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                          selectedVideo.is_published 
                            ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l3.122-3.122 3.122 3.122-3.122 3.122z"
                        } />
                      </svg>
                      <div>
                        <p className={`text-sm font-medium ${
                          selectedVideo.is_published ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                          {selectedVideo.is_published ? 'Published' : 'Unpublished'}
                        </p>
                        <p className={`text-xs ${
                          selectedVideo.is_published ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {selectedVideo.is_published 
                            ? 'This video is visible to children and parents'
                            : 'This video is approved but not yet published'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePublish(selectedVideo.id, selectedVideo.is_published || false)}
                      className={`px-3 py-1 text-sm rounded-md font-medium ${
                        selectedVideo.is_published
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {selectedVideo.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(selectedVideo.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleNeedsRevision(selectedVideo.id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Needs Revision
                </button>
                <button
                  onClick={() => handleReject(selectedVideo.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedVideo(null);
                    setReviewNotes('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Confirm Bulk {bulkAction === 'delete' ? 'Delete' : 'Reject'}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {bulkAction === 'delete' 
                  ? `Are you sure you want to permanently delete ${selectedVideos.size} selected videos? This action cannot be undone.`
                  : `Are you sure you want to reject ${selectedVideos.size} selected videos?`
                }
              </p>

              {bulkAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Provide reason for bulk rejection..."
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={executeBulkAction}
                  className={`px-4 py-2 text-white rounded-md ${
                    bulkAction === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  disabled={bulkAction === 'reject' && !bulkNotes.trim()}
                >
                  Confirm {bulkAction === 'delete' ? 'Delete' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkAction('');
                    setBulkNotes('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}