import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

interface GeneralVideoFormData {
  title: string;
  description: string;
  parentTip: string;
  theme: string;
  ageRange: string;
  duration?: number;
  tags: string[];
  displayImageUrl?: string;
}

interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export default function GeneralVideoUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  const [formData, setFormData] = useState<GeneralVideoFormData>({
    title: '',
    description: '',
    parentTip: '',
    theme: '', // theme is now optional
    ageRange: '3-5',
    tags: []
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata>({});
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');

  const themes = [
    'dinosaurs', 'space', 'animals', 'vehicles', 'princesses', 
    'superheroes', 'nature', 'ocean', 'farm', 'construction',
    'music', 'art', 'sports', 'food', 'colors', 'shapes',
    'numbers', 'letters', 'emotions', 'friendship', 'family'
  ];

  const ageRanges = ['0-2', '3-5', '6-8', '9-12'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-detect video metadata
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      const ratio = video.videoWidth / video.videoHeight;
      const is16by9 = Math.abs(ratio - 16/9) < 0.1; // Allow some tolerance
      
      const metadata: VideoMetadata = {
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: is16by9 ? '16:9' : `${video.videoWidth}:${video.videoHeight}`
      };
      
      console.log(`📹 Video metadata detected: ${video.videoWidth}x${video.videoHeight}, duration: ${metadata.duration}s, ratio: ${ratio.toFixed(2)}`);
      
      if (!is16by9) {
        console.warn(`⚠️ Video aspect ratio is ${metadata.aspectRatio}, expected 16:9`);
      } else {
        console.log(`✅ Video is 16:9 aspect ratio`);
      }
      
      setVideoMetadata(metadata);
      setFormData(prev => ({ ...prev, duration: metadata.duration }));
    };
    
    video.src = url;
  };

  const handleFormChange = (field: keyof GeneralVideoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
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
    if (!selectedImageFile) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedImageFile.name.split('.').pop();
      const fileName = `${Date.now()}_display_image.${fileExt}`;
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
          theme: `Display image for: ${formData.title}`,
          type: 'image',
          file_url: publicUrl,
          tags: ['display-image', 'video-thumbnail'],
          status: 'approved',
          metadata: {
            description: `Display image for video: ${formData.title}`,
            personalization: 'general',
            template: 'general'
          }
        });

      if (dbError) throw dbError;

      // Update form data with the image URL
      setFormData(prev => ({ ...prev, displayImageUrl: publicUrl }));
      
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

  const uploadGeneralVideo = async () => {
    if (!selectedFile) {
      alert('Please select a video file');
      return;
    }

    if (!formData.title || !formData.description || !formData.parentTip) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get pre-signed S3 upload URL
      console.log('📤 Getting pre-signed upload URL...');
      const uploadUrlResponse = await fetch('/api/upload-video-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: selectedFile.name, 
          filetype: selectedFile.type 
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url: uploadUrl, publicUrl } = await uploadUrlResponse.json();

      // Step 2: Upload video file directly to S3
      console.log('📤 Uploading video to S3...');
      const s3UploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!s3UploadResponse.ok) {
        throw new Error('S3 upload failed');
      }

      // Step 3: Save video metadata to database
      console.log('💾 Saving video metadata to database...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to upload videos');
      }
      
      // Create a general video in the existing system
      const { error: videoError } = await supabase
        .from('child_approved_videos')
        .insert({
          video_generation_job_id: null, // NULL for manual uploads
          video_source: 'manual_upload', // Indicate this is a manual upload
          video_url: publicUrl,
          video_title: formData.title,
          child_id: null, // General video, not child-specific
          child_name: 'General',
          child_age: 0,
          child_theme: formData.theme || 'general',
          personalization_level: 'generic',
          approval_status: 'approved',
          metadata_status: 'approved', // Pre-approved for general uploads
          submitted_by: user.id, // Use actual user ID
          duration_seconds: videoMetadata.duration || 0,
          template_type: 'general-upload',
          template_data: {
            title: formData.title,
            description: formData.description,
            parent_tip: formData.parentTip,
            display_image: formData.displayImageUrl || '',
            tags: formData.tags,
            ageRange: formData.ageRange,
            width: videoMetadata.width,
            height: videoMetadata.height,
            aspectRatio: videoMetadata.aspectRatio,
            uploadedVia: 'general-upload',
            originalFilename: selectedFile.name
          },
          consumer_title: formData.title,
          consumer_description: formData.description,
          parent_tip: formData.parentTip,
          display_image_url: formData.displayImageUrl || '',
          is_published: false // Will be published via video publishing admin
        });
      
      if (videoError) {
        console.error('Database error:', videoError);
        throw new Error('Failed to save video metadata');
      }

      // Get the created video ID
      const { data: videoData } = await supabase
        .from('child_approved_videos')
        .select('id')
        .eq('video_url', publicUrl)
        .single();
      
      if (videoData) {
        // Create a general video assignment (but not published yet)
        await supabase
          .from('video_assignments')
          .insert({
            video_id: videoData.id,
            child_id: null, // General assignment
            assignment_type: 'general',
            publish_date: new Date().toISOString(),
            status: 'pending', // Not published yet - admin will publish via video publishing tool
            assigned_by: user.id, // Use actual user ID
            metadata: {
              source: 'general-upload',
              originalFilename: selectedFile.name
            }
          });
      }

      console.log('✅ Video uploaded successfully');
      alert('Video uploaded successfully and is ready for publishing!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        parentTip: '',
        theme: '',
        ageRange: '3-5',
        tags: [],
        displayImageUrl: undefined
      });
      setSelectedFile(null);
      setSelectedImageFile(null);
      setPreviewUrl('');
      setImagePreviewUrl('');
      setVideoMetadata({});
      setTagInput('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Upload General Video - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload General Video</h1>
                <p className="mt-2 text-gray-600">
                  Upload complete videos for general publishing to children
                </p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Video Information</h2>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {videoMetadata.duration && (
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {Math.floor(videoMetadata.duration / 60)}:{(videoMetadata.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Enter a descriptive title for the video"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe what this video is about"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parent Tip */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Tip *
                </label>
                <textarea
                  value={formData.parentTip}
                  onChange={(e) => handleFormChange('parentTip', e.target.value)}
                  placeholder="2-5 sentence tip for parents about this video"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Theme */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleFormChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a theme...</option>
                  {themes.map(theme => (
                    <option key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range
                </label>
                <select
                  value={formData.ageRange}
                  onChange={(e) => handleFormChange('ageRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ageRanges.map(age => (
                    <option key={age} value={age}>
                      {age} years
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Image (Optional)
                </label>
                <div className="space-y-3">
                  {/* Current display image */}
                  {formData.displayImageUrl && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <img
                          src={formData.displayImageUrl}
                          alt="Display"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">Display image uploaded</p>
                          <p className="text-xs text-green-600">This image will be used as the video thumbnail</p>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, displayImageUrl: undefined }))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image upload */}
                  {!formData.displayImageUrl && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {selectedImageFile && (
                        <div className="space-y-3">
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
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={uploadGeneralVideo}
                disabled={uploading || !selectedFile}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Video Preview</h2>
              
              {previewUrl ? (
                <div className="space-y-4">
                  <video
                    ref={videoPreviewRef}
                    src={previewUrl}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '300px' }}
                  />
                  
                  {formData.title && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{formData.title}</h3>
                      {formData.description && (
                        <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
                      )}
                      {formData.parentTip && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">
                            <strong>Parent Tip:</strong> {formData.parentTip}
                          </p>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.theme && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {formData.theme}
                          </span>
                        )}
                        {formData.ageRange && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {formData.ageRange}
                          </span>
                        )}
                        {formData.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>Select a video file to see preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 