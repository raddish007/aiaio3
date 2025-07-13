import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface VideoMetadata {
  id: string;
  video_url: string;
  video_title: string;
  child_name: string;
  child_theme: string;
  personalization_level: 'generic' | 'theme_specific' | 'child_specific';
  approval_status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  created_at: string;
  duration_seconds: number;
  template_type: string;
  
  // Consumer metadata
  consumer_title?: string;
  consumer_description?: string;
  parent_tip?: string;
  display_image_url?: string;
  display_image_source?: 'template' | 'custom';
  selected_asset_id?: string;
  publish_date?: string;
  is_published?: boolean;
  metadata_status?: 'pending' | 'approved' | 'rejected';
  
  // Used assets for display image selection
  used_assets?: any[];
  
  // Template data for Letter Hunt videos
  template_data?: any;
}

interface Asset {
  id: string;
  type: 'image' | 'audio' | 'video';
  theme: string;
  file_url?: string;
  metadata?: any;
}

interface TemplateDefault {
  id: string;
  template_type: string;
  personalization_level: string;
  default_title: string;
  default_description: string;
  default_parent_tip: string;
  default_display_image_url: string;
  default_display_image_class?: string;
  created_at: string;
  updated_at: string;
}

export default function VideoMetadata() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoMetadata | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'no_metadata' | 'published'>('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<TemplateDefault[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchVideos();
    fetchTemplateDefaults();
  }, [filter]);

  useEffect(() => {
    // Filter videos based on search term and current filter
    let filtered = videos;
    
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.template_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.consumer_title && video.consumer_title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredVideos(filtered);
  }, [videos, searchTerm, filter]);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'approved') {
        query = query.eq('approval_status', 'approved');
      } else if (filter === 'no_metadata') {
        query = query.eq('approval_status', 'approved')
          .or('consumer_title.is.null,consumer_title.eq.');
      } else if (filter === 'published') {
        query = query.eq('is_published', true);
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

  const fetchTemplateDefaults = async () => {
    try {
      const { data, error } = await supabase
        .from('template_defaults')
        .select('*');

      if (!error && data) {
        setTemplateDefaults(data);
      }
    } catch (error) {
      console.error('Error fetching template defaults:', error);
    }
  };

  const fetchVideoAssets = async (videoId: string) => {
    try {
      console.log('Fetching video generation job for video:', videoId);
      
      // First, get the video to find its video_generation_job_id
      const { data: video, error: videoError } = await supabase
        .from('child_approved_videos')
        .select('video_generation_job_id, used_assets')
        .eq('id', videoId)
        .single();

      if (videoError) {
        console.error('Error fetching video:', videoError);
        setAssets([]);
        return;
      }

      console.log('Video data:', video);

      if (video?.video_generation_job_id) {
        // Fetch the original video generation job
        const { data: job, error: jobError } = await supabase
          .from('video_generation_jobs')
          .select('*')
          .eq('id', video.video_generation_job_id)
          .single();

        if (jobError) {
          console.error('Error fetching video generation job:', jobError);
          setAssets([]);
          return;
        }

        console.log('Video generation job:', job);

        // Extract asset IDs from the segments data
        const assetIds = new Set<string>();
        
        if (job.segments && Array.isArray(job.segments)) {
          job.segments.forEach((segment: any) => {
            // Extract asset IDs from various possible locations in the segment
            if (segment.assets && Array.isArray(segment.assets)) {
              segment.assets.forEach((asset: any) => {
                if (asset.asset_id) assetIds.add(asset.asset_id);
                if (asset.id) assetIds.add(asset.id);
              });
            }
            if (segment.asset_id) assetIds.add(segment.asset_id);
            if (segment.audio_asset_id) assetIds.add(segment.audio_asset_id);
            if (segment.image_asset_id) assetIds.add(segment.image_asset_id);
            if (segment.background_asset_id) assetIds.add(segment.background_asset_id);
          });
        }

        // Also check the used_assets array as fallback
        if (video.used_assets && Array.isArray(video.used_assets)) {
          video.used_assets.forEach((assetId: string) => assetIds.add(assetId));
        }

        console.log('Extracted asset IDs:', Array.from(assetIds));

        if (assetIds.size > 0) {
          const { data: assetData, error } = await supabase
            .from('assets')
            .select('*')
            .in('id', Array.from(assetIds));

          if (error) {
            console.error('Error fetching assets:', error);
            setAssets([]);
            return;
          }

          console.log('Fetched assets from job:', assetData);
          setAssets(assetData || []);
        } else {
          console.log('No asset IDs found in job data');
          setAssets([]);
        }
      } else {
        console.log('No video_generation_job_id found, trying used_assets fallback');
        
        // Fallback to used_assets if no job ID
        if (video?.used_assets && video.used_assets.length > 0) {
          const { data: assetData, error } = await supabase
            .from('assets')
            .select('*')
            .in('id', video.used_assets);

          if (error) {
            console.error('Error fetching assets from used_assets:', error);
            setAssets([]);
            return;
          }

          console.log('Fetched assets from used_assets:', assetData);
          setAssets(assetData || []);
        } else {
          console.log('No used_assets found, clearing assets array');
          setAssets([]);
        }
      }
    } catch (error) {
      console.error('Error fetching video assets:', error);
      setAssets([]);
    }
  };

  const getTemplateDefault = (templateType: string) => {
    return templateDefaults.find(t => t.template_type === templateType);
  };

  const processTemplateVariables = (text: string, video: VideoMetadata) => {
    if (!text) return text;
    
    return text.replace(/\{(\w+)\}/g, (match, variable) => {
      switch (variable) {
        case 'NAME':
          return video.child_name;
        case 'LETTER':
          return video.child_name.charAt(0).toUpperCase();
        default:
          return match; // Keep the original placeholder if not recognized
      }
    });
  };

  const handleEditVideo = async (video: VideoMetadata) => {
    console.log('handleEditVideo called with video:', video);
    
    // Get template default for this video type
    const templateDefault = getTemplateDefault(video.template_type);
    console.log('Found template default:', templateDefault);
    
    // Create editing video with defaults filled in
    const editingVideoData: VideoMetadata = {
      ...video,
      consumer_title: video.consumer_title || (templateDefault ? 
        processTemplateVariables(templateDefault.default_title, video) : 
        video.video_title),
      consumer_description: video.consumer_description || (templateDefault ? 
        processTemplateVariables(templateDefault.default_description, video) : ''),
      parent_tip: video.parent_tip || templateDefault?.default_parent_tip || '',
      display_image_url: video.display_image_url || templateDefault?.default_display_image_url || '',
      display_image_source: video.display_image_source || 'template'
    };

    console.log('Created editing video data:', editingVideoData);
    setEditingVideo(editingVideoData);
    setSelectedVideo(video);
    
    // Fetch assets for this video
    await fetchVideoAssets(video.id);
  };

  const handleSaveMetadata = async () => {
    if (!editingVideo) return;

    setSaving(true);
    try {
      // Get the display image URL from the current state
      const templateDefault = getTemplateDefault(editingVideo.template_type);
      const displayImageUrl = getDisplayImageUrl(editingVideo, templateDefault, assets);
      
      // Determine the final display image URL
      let finalDisplayImageUrl = editingVideo.display_image_url;
      if (editingVideo.display_image_source === 'template' && displayImageUrl) {
        finalDisplayImageUrl = displayImageUrl;
      }

      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          consumer_title: editingVideo.consumer_title,
          consumer_description: editingVideo.consumer_description,
          parent_tip: editingVideo.parent_tip,
          display_image_url: finalDisplayImageUrl,
          display_image_source: editingVideo.display_image_source,
          selected_asset_id: editingVideo.selected_asset_id,
          metadata_status: editingVideo.metadata_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVideo.id);

      if (error) {
        console.error('Error updating video metadata:', error);
        alert('Failed to update video metadata');
        return;
      }

      setEditingVideo(null);
      setSelectedVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error updating video metadata:', error);
      alert('Failed to update video metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMetadataStatus = async (videoId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('child_approved_videos')
        .update({
          metadata_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (error) throw error;

      // Refresh the videos list
      await fetchVideos();
    } catch (error) {
      console.error('Error updating metadata status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
    setSelectedVideo(null);
    setAssets([]);
    setShowAssetSelector(false);
  };

  const handleDisplayImageSourceChange = (source: 'template' | 'custom') => {
    console.log('handleDisplayImageSourceChange called with source:', source);
    if (!editingVideo) return;

    const updatedVideo = {
      ...editingVideo,
      display_image_source: source,
      display_image_url: source === 'custom' ? editingVideo.display_image_url : undefined,
      selected_asset_id: undefined
    };

    console.log('Updated editing video:', updatedVideo);
    setEditingVideo(updatedVideo);
  };



  const applyTemplateDefault = (field: 'title' | 'description' | 'parent_tip') => {
    if (!editingVideo) return;
    
    const templateDefault = getTemplateDefault(editingVideo.template_type);
    if (!templateDefault) {
      alert('No template default found for this video type');
      return;
    }

    let templateText = '';
    switch (field) {
      case 'title':
        templateText = templateDefault.default_title;
        break;
      case 'description':
        templateText = templateDefault.default_description;
        break;
      case 'parent_tip':
        templateText = templateDefault.default_parent_tip;
        break;
    }

    if (!templateText) {
      alert(`No template default found for ${field}`);
      return;
    }

    // Process template variables
    const processedText = processTemplateVariables(templateText, editingVideo);
    
    setEditingVideo({
      ...editingVideo,
      [field === 'title' ? 'consumer_title' : field === 'description' ? 'consumer_description' : 'parent_tip']: processedText
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedImageFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const uploadDisplayImage = async () => {
    if (!selectedImageFile || !editingVideo) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedImageFile.name.split('.').pop();
      const fileName = `${Date.now()}_display_image_${editingVideo.id}.${fileExt}`;
      const filePath = `assets/image/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, selectedImageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Create asset record in database
      const { error: dbError } = await supabase
        .from('assets')
        .insert({
          theme: `Display image for: ${editingVideo.video_title}`,
          type: 'image',
          file_url: publicUrl,
          tags: ['display-image', 'video-thumbnail'],
          status: 'approved',
          metadata: {
            description: `Display image for video: ${editingVideo.video_title}`,
            personalization: 'general',
            template: editingVideo.template_type
          }
        });

      if (dbError) throw dbError;

      // Update the editing video with the new image URL
      setEditingVideo({
        ...editingVideo,
        display_image_url: publicUrl,
        display_image_source: 'custom'
      });
      
      alert('Display image uploaded successfully!');
      
      // Clear the selected file but keep the preview
      setSelectedImageFile(null);
      
    } catch (error) {
      console.error('Error uploading display image:', error);
      alert('Error uploading display image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPersonalizationBadge = (level: string) => {
    switch (level) {
      case 'child_specific': return 'bg-blue-100 text-blue-800';
      case 'theme_specific': return 'bg-purple-100 text-purple-800';
      case 'generic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetadataStatus = (video: VideoMetadata) => {
    if (!video.consumer_title) return 'No Metadata';
    if (video.metadata_status === 'approved') return 'Approved';
    if (video.metadata_status === 'rejected') return 'Rejected';
    if (video.metadata_status === 'pending') return 'Pending';
    return 'Has Metadata';
  };

  const getMetadataStatusColor = (status: string) => {
    switch (status) {
      case 'No Metadata': return 'bg-red-100 text-red-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Has Metadata': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get a deterministic random index based on video ID
  function getDeterministicIndex(videoId: string, arrayLength: number): number {
    // Create a simple hash from the video ID
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      const char = videoId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % arrayLength;
  }

  // Helper to get display image URL for a video
  function getDisplayImageUrl(video: VideoMetadata, templateDefault?: TemplateDefault, assets?: Asset[]): string | undefined {
    console.log('getDisplayImageUrl called with:', {
      videoId: video.id,
      templateType: video.template_type,
      templateDefault: templateDefault,
      assetsCount: assets?.length,
      usedAssets: video.used_assets,
      displayImageSource: video.display_image_source,
      hasTemplateData: !!video.template_data
    });

    // Handle different display image sources
    if (video.display_image_source === 'custom' && video.display_image_url) {
      console.log('Using custom display image URL:', video.display_image_url);
      return video.display_image_url;
    }



    // Template default logic
    // 1. Letter Hunt: Use asset class from template default - get URL from template_data
    if (templateDefault?.template_type === 'letter-hunt' && templateDefault.default_display_image_class && video.template_data) {
      console.log('Letter Hunt logic - looking for asset class:', templateDefault.default_display_image_class);
      
      try {
        const templateData = typeof video.template_data === 'string' 
          ? JSON.parse(video.template_data) 
          : video.template_data;
        
        const classKey = templateDefault.default_display_image_class;
        const assetData = templateData?.props?.assets?.[classKey];
        
        if (assetData?.url) {
          console.log('Found URL in template_data:', assetData.url);
          return assetData.url;
        } else {
          console.log('No URL found for asset class:', classKey);
        }
      } catch (error) {
        console.error('Error parsing template_data:', error);
      }
      
      // Fallback: if no specific class found, use any image asset from the video
      const imageAsset = assets?.find(a => a.type === 'image' && a.file_url);
      if (imageAsset) {
        console.log('Using fallback image asset:', imageAsset.id, imageAsset.file_url);
        return imageAsset.file_url;
      }
    }
    
    // 2. Lullaby: Use random image from template_data.props.slideshowImageUrls
    if (templateDefault?.template_type === 'lullaby' && video.template_data) {
      console.log('Lullaby logic - looking for slideshow images in template_data');
      
      try {
        const templateData = typeof video.template_data === 'string' 
          ? JSON.parse(video.template_data) 
          : video.template_data;
        
        const slideshowImages = templateData?.props?.slideshowImageUrls || templateData?.used_assets?.slideshow_images;
        
        if (slideshowImages && Array.isArray(slideshowImages) && slideshowImages.length > 0) {
          const deterministicIndex = getDeterministicIndex(video.id, slideshowImages.length);
          const selectedImage = slideshowImages[deterministicIndex];
          console.log('Using deterministic lullaby slideshow image (index', deterministicIndex, '):', selectedImage);
          return selectedImage;
        } else {
          console.log('No slideshow images found in template_data');
        }
      } catch (error) {
        console.error('Error parsing template_data for lullaby:', error);
      }
    }
    
    // 3. Name Video: Use random image from template_data.props.letterImageUrls
    if (templateDefault?.template_type === 'name-video' && video.template_data) {
      console.log('Name Video logic - looking for letter images in template_data');
      
      try {
        const templateData = typeof video.template_data === 'string' 
          ? JSON.parse(video.template_data) 
          : video.template_data;
        
        const letterImages = templateData?.props?.letterImageUrls || templateData?.used_assets?.letter_images;
        
        if (letterImages && Array.isArray(letterImages) && letterImages.length > 0) {
          const deterministicIndex = getDeterministicIndex(video.id, letterImages.length);
          const selectedImage = letterImages[deterministicIndex];
          console.log('Using deterministic name video letter image (index', deterministicIndex, '):', selectedImage);
          return selectedImage;
        } else {
          console.log('No letter images found in template_data');
        }
      } catch (error) {
        console.error('Error parsing template_data for name-video:', error);
      }
    }
    
    // 4. Fallback to static default
    if (templateDefault?.default_display_image_url) {
      console.log('Using template default static URL:', templateDefault.default_display_image_url);
      return templateDefault.default_display_image_url;
    }
    
    // 5. Fallback to video.display_image_url
    if (video.display_image_url) {
      console.log('Using video display_image_url:', video.display_image_url);
      return video.display_image_url;
    }
    
    console.log('No display image found');
    return undefined;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Metadata Management</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Metadata Management</h1>
            <p className="text-gray-600 mt-2">Manage consumer-facing information for approved videos</p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/admin/template-defaults"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Template Defaults
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search videos by title, child name, or template type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Videos</option>
                <option value="approved">Approved Only</option>
                <option value="no_metadata">No Metadata</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredVideos.length} of {videos.length} videos
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Videos ({filteredVideos.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedVideo?.id === video.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleEditVideo(video)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {video.consumer_title || video.video_title}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.approval_status)}`}>
                        Video: {video.approval_status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMetadataStatusColor(getMetadataStatus(video))}`}>
                        Metadata: {getMetadataStatus(video)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{video.child_name}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalizationBadge(video.personalization_level)}`}>
                      {video.personalization_level.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span>{video.template_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingVideo ? 'Edit Metadata' : 'Select a Video'}
              </h2>
            </div>
            
            {editingVideo && (
              <div className="p-6 space-y-6">
                {/* Video Preview */}
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {(() => {
                    const templateDefault = getTemplateDefault(editingVideo.template_type);
                    const displayImageUrl = getDisplayImageUrl(editingVideo, templateDefault, assets);
                    console.log('Video preview - templateDefault:', templateDefault, 'displayImageUrl:', displayImageUrl, 'assets count:', assets.length);
                    return displayImageUrl ? (
                      <Image
                        src={displayImageUrl}
                        alt="Video preview"
                        width={320}
                        height={180}
                        className="rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500">No display image</span>
                    );
                  })()}
                </div>

                {/* Consumer Title */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Consumer Title *
                    </label>
                    <button
                      type="button"
                      onClick={() => applyTemplateDefault('title')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Default to Template
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingVideo.consumer_title || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, consumer_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter consumer-facing title"
                  />
                </div>

                {/* Consumer Description */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Consumer Description
                    </label>
                    <button
                      type="button"
                      onClick={() => applyTemplateDefault('description')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Default to Template
                    </button>
                  </div>
                  <textarea
                    value={editingVideo.consumer_description || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, consumer_description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter consumer-facing description"
                  />
                </div>

                {/* Parent Tip */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Parent Tip (2-5 sentences)
                    </label>
                    <button
                      type="button"
                      onClick={() => applyTemplateDefault('parent_tip')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Default to Template
                    </button>
                  </div>
                  <textarea
                    value={editingVideo.parent_tip || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, parent_tip: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter tip for parents about this video"
                  />
                </div>

                {/* Display Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Image
                  </label>
                  <div className="space-y-3">
                    {(() => {
                      const templateDefault = getTemplateDefault(editingVideo.template_type);
                      const displayImageUrl = getDisplayImageUrl(editingVideo, templateDefault, assets);
                      const isUsingTemplateDefault = !editingVideo.display_image_source || editingVideo.display_image_source === 'template';
                      
                      console.log('Display image section - templateDefault:', templateDefault, 'displayImageUrl:', displayImageUrl, 'isUsingTemplateDefault:', isUsingTemplateDefault, 'display_image_source:', editingVideo.display_image_source);
                      
                      return (
                        <>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="displayImageSource"
                                value="template"
                                checked={isUsingTemplateDefault}
                                onChange={() => handleDisplayImageSourceChange('template')}
                                className="mr-2"
                              />
                              Template Default
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="displayImageSource"
                                value="custom"
                                checked={editingVideo.display_image_source === 'custom'}
                                onChange={() => handleDisplayImageSourceChange('custom')}
                                className="mr-2"
                              />
                              Custom Upload
                            </label>
                          </div>
                          
                          {isUsingTemplateDefault && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <div className="text-sm text-blue-800">
                                <strong>Using template default:</strong>
                                {templateDefault?.template_type === 'letter-hunt' && templateDefault.default_display_image_class && (
                                  <span> Asset class "{templateDefault.default_display_image_class}" from video's used assets</span>
                                )}
                                {templateDefault?.template_type === 'lullaby' && (
                                  <span> Random image matching lullaby template, theme "{editingVideo.child_theme}", safe zone "all_ok"</span>
                                )}
                                {templateDefault?.template_type === 'name-video' && (
                                  <span> Random image matching name-video template, theme "{editingVideo.child_theme}", safe zone "left_safe"</span>
                                )}
                                {!templateDefault && (
                                  <span> No template default configured</span>
                                )}
                              </div>
                              {displayImageUrl && (
                                <div className="mt-2">
                                  <img src={displayImageUrl} alt="Template default" className="h-20 w-auto rounded" />
                                </div>
                              )}
                            </div>
                          )}

                          {editingVideo.display_image_source === 'custom' && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <div className="text-sm text-green-800">
                                <strong>Using custom image:</strong> {editingVideo.display_image_url ? 'Image uploaded' : 'No image uploaded'}
                              </div>
                              {editingVideo.display_image_url && (
                                <div className="mt-2">
                                  <img src={editingVideo.display_image_url} alt="Custom" className="h-20 w-auto rounded" />
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {editingVideo.display_image_source === 'custom' && (
                      <div className="space-y-3">
                        {/* URL input (for existing URLs) */}
                        <input
                          type="url"
                          value={editingVideo.display_image_url || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, display_image_url: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter image URL (or upload a file below)"
                        />
                        
                        {/* File upload section */}
                        <div className="border-t pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or upload a new image file:
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                          
                          {selectedImageFile && (
                            <div className="mt-3 space-y-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={imagePreviewUrl}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{selectedImageFile.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedImageFile(null);
                                    setImagePreviewUrl('');
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              
                              <button
                                onClick={uploadDisplayImage}
                                disabled={uploadingImage}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {uploadingImage ? 'Uploading...' : 'Upload Display Image'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveMetadata}
                    disabled={saving || !editingVideo.consumer_title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Metadata'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingVideo) return;
                      const updatedVideo = { ...editingVideo, metadata_status: 'approved' as const };
                      setEditingVideo(updatedVideo);
                      await handleSaveMetadata();
                    }}
                    disabled={saving || !editingVideo.consumer_title}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Approving...' : 'Approve & Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 