import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

interface Video {
  id: string;
  video_title: string;
  template_type: string;
  consumer_title: string;
  consumer_description: string;
  parent_tip: string;
  display_image_url: string;
  created_at: string;
  reviewed_at: string;
  metadata_status: 'pending' | 'approved' | 'rejected';
}

interface Child {
  id: string;
  name: string;
  theme: string;
  parent_id: string;
}

interface Assignment {
  video_id: string;
  child_id?: string;
  theme?: string;
  assignment_type: 'individual' | 'theme' | 'general';
  publish_date: string;
  status: 'pending' | 'published' | 'archived';
}

export default function VideoPublishing() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<'individual' | 'theme' | 'general'>('individual');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [publishDate, setPublishDate] = useState<string>('');
  const [previewAssignments, setPreviewAssignments] = useState<Assignment[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch approved videos with approved consumer metadata
      const { data: videosData, error: videosError } = await supabase
        .from('child_approved_videos')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('metadata_status', 'approved')
        .not('consumer_title', 'is', null)
        .not('consumer_description', 'is', null)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      // Fetch all children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .order('name');

      if (childrenError) throw childrenError;

      console.log('Fetched videos:', videosData);
      console.log('Videos with display images:', videosData?.filter(v => v.display_image_url));
      console.log('Videos without display images:', videosData?.filter(v => !v.display_image_url));
      
      setVideos(videosData || []);
      setChildren(childrenData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueThemes = () => {
    const themes = children.map(child => child.theme);
    return Array.from(new Set(themes)).sort();
  };

  const handleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAll = () => {
    setSelectedVideos(videos.map(video => video.id));
  };

  const handleDeselectAll = () => {
    setSelectedVideos([]);
  };

  const generatePreviewAssignments = () => {
    if (selectedVideos.length === 0) return;

    const assignments: Assignment[] = [];
    const today = new Date().toISOString().split('T')[0];

    selectedVideos.forEach(videoId => {
      switch (assignmentType) {
        case 'individual':
          if (selectedChild) {
            assignments.push({
              video_id: videoId,
              child_id: selectedChild,
              assignment_type: 'individual',
              publish_date: publishDate || today,
              status: 'pending'
            });
          }
          break;
        case 'theme':
          if (selectedTheme) {
            assignments.push({
              video_id: videoId,
              theme: selectedTheme,
              assignment_type: 'theme',
              publish_date: publishDate || today,
              status: 'pending'
            });
          }
          break;
        case 'general':
          assignments.push({
            video_id: videoId,
            assignment_type: 'general',
            publish_date: publishDate || today,
            status: 'pending'
          });
          break;
      }
    });

    setPreviewAssignments(assignments);
    setIsPreviewMode(true);
  };

  const publishAssignments = async () => {
    if (previewAssignments.length === 0) return;

    setPublishing(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Add assigned_by to all assignments
      const assignmentsWithUser = previewAssignments.map(assignment => ({
        ...assignment,
        assigned_by: user?.id
      }));

      const { error } = await supabase
        .from('video_assignments')
        .insert(assignmentsWithUser);

      if (error) throw error;

      // Reset form
      setSelectedVideos([]);
      setPreviewAssignments([]);
      setIsPreviewMode(false);
      setPublishDate('');
      
      alert('Videos published successfully!');
    } catch (error) {
      console.error('Error publishing assignments:', error);
      alert('Error publishing videos. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const getAssignmentDescription = (assignment: Assignment) => {
    const video = videos.find(v => v.id === assignment.video_id);
    const child = children.find(c => c.id === assignment.child_id);
    
    switch (assignment.assignment_type) {
      case 'individual':
        return `Individual assignment to ${child?.name || 'Unknown Child'}`;
      case 'theme':
        return `Theme-based assignment to all children with ${assignment.theme} theme`;
      case 'general':
        return 'General assignment to all children';
      default:
        return 'Unknown assignment type';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title="Video Publishing Tool" />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Video Publishing Tool" />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Publishing Tool</h1>
          <p className="mt-2 text-gray-600">
            Select approved videos and assign them to children for publishing
          </p>
        </div>

        {!isPreviewMode ? (
          <div className="space-y-8">
            {/* Video Selection */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Select Videos</h2>
                <div className="space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedVideos.includes(video.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVideoSelection(video.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(video.id)}
                        onChange={() => handleVideoSelection(video.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {video.consumer_title || video.video_title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {video.template_type} • {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          {video.display_image_url ? (
                            <img
                              src={video.display_image_url}
                              alt="Display"
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => {
                                console.log('Image failed to load:', video.display_image_url);
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const nextSibling = target.nextElementSibling as HTMLElement;
                                if (nextSibling) {
                                  nextSibling.style.display = 'flex';
                                }
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', video.display_image_url);
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${
                              video.display_image_url ? 'hidden' : 'flex'
                            }`}
                          >
                            {video.display_image_url ? 'Image Failed to Load' : 'No Display Image Set'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Configuration */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Type
                  </label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="individual">Individual Child Assignment</option>
                    <option value="theme">Theme-based Assignment</option>
                    <option value="general">General Assignment (All Children)</option>
                  </select>
                </div>

                {assignmentType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Child
                    </label>
                    <select
                      value={selectedChild}
                      onChange={(e) => setSelectedChild(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a child...</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name} ({child.theme})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {assignmentType === 'theme' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Theme
                    </label>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a theme...</option>
                      {getUniqueThemes().map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to publish immediately
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Button */}
            <div className="flex justify-center">
              <button
                onClick={generatePreviewAssignments}
                disabled={selectedVideos.length === 0 || 
                  (assignmentType === 'individual' && !selectedChild) ||
                  (assignmentType === 'theme' && !selectedTheme)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Preview Assignments ({selectedVideos.length} videos selected)
              </button>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Preview Assignments</h2>
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Back to Selection
                </button>
              </div>

              <div className="space-y-4">
                {previewAssignments.map((assignment, index) => {
                  const video = videos.find(v => v.id === assignment.video_id);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {video?.display_image_url && (
                          <img
                            src={video.display_image_url}
                            alt="Display"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {video?.consumer_title || video?.video_title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {getAssignmentDescription(assignment)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Publish Date: {assignment.publish_date}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={publishAssignments}
                  disabled={publishing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {publishing ? 'Publishing...' : `Publish ${previewAssignments.length} Assignments`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 