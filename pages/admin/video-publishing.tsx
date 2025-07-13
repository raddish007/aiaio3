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
  child_id?: string;
  child_name?: string;
  personalization_level?: string;
}

interface Child {
  id: string;
  name: string;
  theme: string;
  primary_interest: string;
  parent_id: string;
}

interface VideoAssignment {
  id: string;
  video_id: string;
  child_id: string;
  assignment_type: string;
  publish_date: string;
  status: 'pending' | 'published' | 'archived';
  published_at?: string;
  assigned_by: string;
}

interface Assignment {
  video_id: string;
  child_id?: string;
  theme?: string;
  assignment_type: 'individual' | 'subset' | 'general';
  publish_date: string;
  status: 'pending' | 'published' | 'archived';
  filters?: {
    name?: string;
    theme?: string;
    letter?: string;
  };
}

interface VideoWithStatus extends Video {
  publishingStatus: 'unpublished' | 'published' | 'future';
  publishDate?: string;
  publishedDate?: string;
  assignmentCount: number;
}

interface PublishingModalProps {
  video: Video | null;
  children: Child[];
  isOpen: boolean;
  onClose: () => void;
  onPublish: (assignment: Assignment) => Promise<void>;
}

function PublishingModal({ video, children, isOpen, onClose, onPublish }: PublishingModalProps) {
  const [assignmentType, setAssignmentType] = useState<'individual' | 'subset' | 'general'>('individual');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [filters, setFilters] = useState({
    name: '',
    theme: '',
    letter: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    name: false,
    theme: false,
    letter: false
  });
  const [publishDate, setPublishDate] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const [previewChildren, setPreviewChildren] = useState<Child[]>([]);

  useEffect(() => {
    if (isOpen && video) {
      // Set assignment type based on video personalization
      const isChildSpecific = video.personalization_level === 'child_specific' && video.child_id;
      
      if (isChildSpecific && video.child_id) {
        setAssignmentType('individual');
        setSelectedChild(video.child_id);
      } else {
        setAssignmentType('individual');
        setSelectedChild('');
      }
      
      setFilters({ name: '', theme: '', letter: '' });
      setActiveFilters({ name: false, theme: false, letter: false });
      setPublishDate('');
      setPreviewChildren([]);
    }
  }, [isOpen, video]);

  useEffect(() => {
    // Update preview when assignment type or filters change
    if (assignmentType === 'individual' && selectedChild) {
      const child = children.find(c => c.id === selectedChild);
      setPreviewChildren(child ? [child] : []);
    } else if (assignmentType === 'subset') {
      const filtered = children.filter(child => {
        const nameMatch = !activeFilters.name || !filters.name || child.name.toLowerCase().includes(filters.name.toLowerCase());
        const themeMatch = !activeFilters.theme || !filters.theme || child.primary_interest === filters.theme;
        const letterMatch = !activeFilters.letter || !filters.letter || child.name.toLowerCase().startsWith(filters.letter.toLowerCase());
        return nameMatch && themeMatch && letterMatch;
      });
      setPreviewChildren(filtered);
    } else if (assignmentType === 'general') {
      setPreviewChildren(children);
    } else {
      setPreviewChildren([]);
    }
  }, [assignmentType, selectedChild, filters, activeFilters, children]);

  const getUniqueThemes = () => {
    const themes = children.map(child => child.primary_interest);
    return Array.from(new Set(themes)).sort();
  };

  const handlePublish = async () => {
    if (!video || previewChildren.length === 0) return;

    setPublishing(true);
    try {
      const assignment: Assignment = {
        video_id: video.id,
        assignment_type: assignmentType,
        publish_date: publishDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        ...(assignmentType === 'individual' && { child_id: selectedChild }),
        ...(assignmentType === 'subset' && { filters }),
        ...(assignmentType === 'general' && {})
      };

      await onPublish(assignment);
      onClose();
    } catch (error) {
      console.error('Error publishing:', error);
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Publish Video</h2>
            <p className="text-gray-600 mt-1">{video.consumer_title || video.video_title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Info */}
        <div className="flex items-start space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {video.display_image_url && (
            <img
              src={video.display_image_url}
              alt="Display"
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{video.consumer_title || video.video_title}</h3>
            <p className="text-sm text-gray-600 mt-1">{video.template_type}</p>
            {video.consumer_description && (
              <p className="text-sm text-gray-500 mt-2">{video.consumer_description}</p>
            )}
          </div>
        </div>

        {/* Assignment Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assignment Type
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="individual"
                checked={assignmentType === 'individual'}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="mr-3"
              />
              <span>Individual Child</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="subset"
                checked={assignmentType === 'subset'}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="mr-3"
              />
              <span>Subset of Audience</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="general"
                checked={assignmentType === 'general'}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="mr-3"
              />
              <span>General (All Children)</span>
            </label>
          </div>
        </div>

        {/* Assignment Options */}
        {assignmentType === 'individual' && (
          <div className="mb-6">
            {video.personalization_level === 'child_specific' && video.child_id && video.child_name ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Child (Video was made for this child)
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{video.child_name}</p>
                      <p className="text-sm text-blue-700">This video was personalized for this child</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Pre-selected
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can change the target child below if needed
                </p>
              </div>
            ) : (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Child
              </label>
            )}
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a child...</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} ({child.primary_interest}, {child.id.slice(-4)})
                </option>
              ))}
            </select>
          </div>
        )}

        {assignmentType === 'subset' && (
          <div className="mb-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Filters
            </label>
            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.name}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, name: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Name</span>
                </label>
                {activeFilters.name && (
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.theme}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, theme: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Theme</span>
                </label>
                {activeFilters.theme && (
                  <select
                    value={filters.theme}
                    onChange={(e) => setFilters(prev => ({ ...prev, theme: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a theme...</option>
                    {getUniqueThemes().map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.letter}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, letter: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Letter</span>
                </label>
                {activeFilters.letter && (
                  <input
                    type="text"
                    value={filters.letter}
                    onChange={(e) => setFilters(prev => ({ ...prev, letter: e.target.value }))}
                    placeholder="Enter letter..."
                    maxLength={1}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Publish Date */}
        <div className="mb-6">
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

        {/* Preview */}
        {previewChildren.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              This will publish to {previewChildren.length} child{previewChildren.length !== 1 ? 'ren' : ''}:
            </h4>
            <div className="max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
              {previewChildren.map((child) => (
                <div key={child.id} className="text-sm text-gray-600 py-1">
                  {child.name} ({child.primary_interest}, {child.id.slice(-4)})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || previewChildren.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoPublishing() {
  const [videos, setVideos] = useState<VideoWithStatus[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpublished' | 'published' | 'future'>('all');

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

      // Fetch video assignments to determine publishing status
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('video_assignments')
        .select('*')
        .order('publish_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Process videos with publishing status
      const videosWithStatus: VideoWithStatus[] = (videosData || []).map(video => {
        const videoAssignments = (assignmentsData || []).filter(assignment => assignment.video_id === video.id);
        
        if (videoAssignments.length === 0) {
          return {
            ...video,
            publishingStatus: 'unpublished' as const,
            assignmentCount: 0
          };
        }

        // Get the earliest publish date and check assignment statuses
        const publishDates = videoAssignments.map(a => a.publish_date).sort();
        const publishedAssignments = videoAssignments.filter(a => a.status === 'published');
        const publishedDates = publishedAssignments.map(a => a.published_at).filter(Boolean).sort();
        
        const earliestPublishDate = publishDates[0];
        const latestPublishedDate = publishedDates.length > 0 ? publishedDates[publishedDates.length - 1] : null;
        const hasPublishedAssignments = publishedAssignments.length > 0;
        
        const today = new Date().toISOString().split('T')[0];
        
        let publishingStatus: 'unpublished' | 'published' | 'future';
        let publishDate: string | undefined;
        let publishedDate: string | undefined;

        if (hasPublishedAssignments) {
          publishingStatus = 'published';
          publishedDate = latestPublishedDate || earliestPublishDate;
        } else if (earliestPublishDate > today) {
          publishingStatus = 'future';
          publishDate = earliestPublishDate;
        } else if (earliestPublishDate <= today) {
          // If publish date is today or in the past, treat as published
          publishingStatus = 'published';
          publishedDate = earliestPublishDate;
        } else {
          publishingStatus = 'unpublished';
          publishDate = earliestPublishDate;
        }

        return {
          ...video,
          publishingStatus,
          publishDate,
          publishedDate,
          assignmentCount: videoAssignments.length
        };
      });
      
      setVideos(videosWithStatus);
      setChildren(childrenData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVideo = async (assignment: Assignment) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create assignments for all target children
      const assignments = [];
      const today = new Date().toISOString().split('T')[0];
      const isPublishNow = !assignment.publish_date || assignment.publish_date <= today;
      
      if (assignment.assignment_type === 'individual' && assignment.child_id) {
        assignments.push({
          video_id: assignment.video_id,
          child_id: assignment.child_id,
          assignment_type: 'individual',
          publish_date: assignment.publish_date,
          status: isPublishNow ? 'published' : 'pending',
          published_at: isPublishNow ? new Date().toISOString() : undefined,
          assigned_by: user?.id
        });
      } else if (assignment.assignment_type === 'subset' && assignment.filters) {
        // Find children matching the filters
        const targetChildren = children.filter(child => {
          const nameMatch = !assignment.filters?.name || child.name.toLowerCase().includes(assignment.filters.name.toLowerCase());
          const themeMatch = !assignment.filters?.theme || child.primary_interest === assignment.filters.theme;
          const letterMatch = !assignment.filters?.letter || child.name.toLowerCase().startsWith(assignment.filters.letter.toLowerCase());
          return nameMatch && themeMatch && letterMatch;
        });
        
        targetChildren.forEach(child => {
          assignments.push({
            video_id: assignment.video_id,
            child_id: child.id,
            assignment_type: 'individual',
            publish_date: assignment.publish_date,
            status: isPublishNow ? 'published' : 'pending',
            published_at: isPublishNow ? new Date().toISOString() : undefined,
            assigned_by: user?.id
          });
        });
      } else if (assignment.assignment_type === 'general') {
        // Assign to all children
        children.forEach(child => {
          assignments.push({
            video_id: assignment.video_id,
            child_id: child.id,
            assignment_type: 'individual',
            publish_date: assignment.publish_date,
            status: isPublishNow ? 'published' : 'pending',
            published_at: isPublishNow ? new Date().toISOString() : undefined,
            assigned_by: user?.id
          });
        });
      }

      if (assignments.length > 0) {
        const { error } = await supabase
          .from('video_assignments')
          .insert(assignments);

        if (error) throw error;
        
        alert(`Video published successfully to ${assignments.length} children!`);
        await fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error publishing video:', error);
      alert('Error publishing video. Please try again.');
    }
  };

  const openPublishingModal = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closePublishingModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const getStatusBadge = (video: VideoWithStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (video.publishingStatus) {
      case 'unpublished':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            Unpublished
          </span>
        );
      case 'published':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Published {video.publishedDate && `(${new Date(video.publishedDate).toLocaleDateString()})`}
          </span>
        );
      case 'future':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Future {video.publishDate && `(${new Date(video.publishDate).toLocaleDateString()})`}
          </span>
        );
      default:
        return null;
    }
  };

  const filteredVideos = videos.filter(video => {
    if (statusFilter === 'all') return true;
    return video.publishingStatus === statusFilter;
  });

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
            Click on any video to publish it to specific children or audiences
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Videos ({videos.length})</option>
              <option value="unpublished">Unpublished ({videos.filter(v => v.publishingStatus === 'unpublished').length})</option>
              <option value="published">Published ({videos.filter(v => v.publishingStatus === 'published').length})</option>
              <option value="future">Future ({videos.filter(v => v.publishingStatus === 'future').length})</option>
            </select>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openPublishingModal(video)}
            >
              {/* Video Image */}
              <div className="aspect-video bg-gray-200 relative">
                {video.display_image_url ? (
                  <img
                    src={video.display_image_url}
                    alt="Display"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(video)}
                </div>
                
                {/* Publish Button Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-md opacity-0 hover:opacity-100 transition-opacity">
                    {video.publishingStatus === 'unpublished' ? 'Publish Video' : 'Manage Publishing'}
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {video.consumer_title || video.video_title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {video.template_type} • {new Date(video.created_at).toLocaleDateString()}
                </p>
                {video.consumer_description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {video.consumer_description}
                  </p>
                )}
                
                {/* Assignment Info */}
                {video.assignmentCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Assigned to {video.assignmentCount} child{video.assignmentCount !== 1 ? 'ren' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No videos available for publishing' : `No ${statusFilter} videos`}
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'Videos need to be approved and have consumer metadata set before they can be published.'
                : `No videos match the "${statusFilter}" filter.`
              }
            </p>
          </div>
        )}

        {/* Publishing Modal */}
        <PublishingModal
          video={selectedVideo}
          children={children}
          isOpen={isModalOpen}
          onClose={closePublishingModal}
          onPublish={handlePublishVideo}
        />
      </div>
    </div>
  );
} 