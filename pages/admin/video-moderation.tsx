import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface VideoForModeration {
  id: string;
  video_url: string;
  video_title: string;
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
      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          approval_status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          approval_notes: reviewNotes
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Moderation</h1>
          <p className="text-gray-600">Review and approve videos for child consumption</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
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
        </div>

        {/* Video List */}
        <div className="grid gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{video.video_title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.approval_status)}`}>
                      {video.approval_status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalizationBadge(video.personalization_level)}`}>
                      {video.personalization_level.replace('_', ' ')}
                    </span>
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
                  {video.approval_status === 'pending_review' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Review Video
                      </button>
                    </div>
                  )}
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
    </div>
  );
} 