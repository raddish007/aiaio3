import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

interface VideoAssetFormData {
  title: string;
  template: string;
  section: string;
  category: 'generic' | 'thematic' | 'letter-specific' | 'name-specific' | 'letter-and-theme';
  theme?: string;
  targetLetter?: string;
  childName?: string;
  prompt: string;
  volume: number;
  ageRange: string;
}

interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export default function VideoAssetUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  const [formData, setFormData] = useState<VideoAssetFormData>({
    title: '',
    template: 'letter-hunt',
    section: '',
    category: 'generic',
    prompt: '',
    volume: 0.8,
    ageRange: '3-5'
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata>({});
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Template configurations
  const templateConfig = {
    'letter-hunt': {
      name: 'Letter Hunt',
      sections: [
        { value: 'introVideo', label: 'Part 1 - Character pointing to giant letter' },
        { value: 'intro2Video', label: 'Part 2 - Theme + Letter combination' },
        { value: 'intro3Video', label: 'Part 3 - Character searching playfully' },
        { value: 'happyDanceVideo', label: 'Happy Dance - Character doing joyful dance' }
      ]
    }
    // Future templates can be added here
  };

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
      
      console.log(`📹 Video metadata detected: ${video.videoWidth}x${video.videoHeight}, ratio: ${ratio.toFixed(2)}, is16:9: ${is16by9}`);
      
      if (!is16by9) {
        console.warn(`⚠️ Video aspect ratio is ${metadata.aspectRatio}, expected 16:9`);
      } else {
        console.log(`✅ Video is 16:9 aspect ratio`);
      }
      
      setVideoMetadata(metadata);
    };
    
    video.src = url;
  };

  const handleFormChange = (field: keyof VideoAssetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAssetMetadata = () => {
    const metadata: any = {
      template: formData.template,
      section: formData.section,
      videoType: formData.section, // Add videoType field that matches section for consistent detection
      category: formData.category,
      volume: formData.volume,
      ageRange: formData.ageRange,
      prompt: formData.prompt,
      createdAt: new Date().toISOString(),
      videoMetadata: videoMetadata
    };

    // Add category-specific metadata
    switch (formData.category) {
      case 'thematic':
        metadata.theme = formData.theme;
        break;
      case 'letter-specific':
        metadata.targetLetter = formData.targetLetter;
        metadata.theme = formData.theme; // Optional theme for letter-specific
        break;
      case 'letter-and-theme':
        metadata.targetLetter = formData.targetLetter; // Required
        metadata.theme = formData.theme; // Required
        break;
      case 'name-specific':
        metadata.childName = formData.childName;
        metadata.theme = formData.theme; // Optional theme for name-specific
        break;
    }

    return metadata;
  };

  const uploadVideoAsset = async () => {
    if (!selectedFile) {
      alert('Please select a video file');
      return;
    }

    if (!formData.title || !formData.section || !formData.prompt) {
      alert('Please fill in all required fields');
      return;
    }

    // Category-specific validation
    if (formData.category === 'thematic' && !formData.theme) {
      alert('Theme is required for thematic assets');
      return;
    }
    if (formData.category === 'letter-specific' && !formData.targetLetter) {
      alert('Target letter is required for letter-specific assets');
      return;
    }
    if (formData.category === 'letter-and-theme' && (!formData.targetLetter || !formData.theme)) {
      alert('Both target letter and theme are required for letter+theme assets');
      return;
    }
    if (formData.category === 'name-specific' && !formData.childName) {
      alert('Child name is required for name-specific assets');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `video_${timestamp}.${fileExtension}`;
      const filePath = `assets/video/${fileName}`;

      // Upload file to Supabase storage
      console.log('📤 Uploading video file...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Create asset record
      const assetRecord = {
        type: 'video',
        title: formData.title,
        theme: formData.theme || 'generic', // Required field - use 'generic' as default
        file_url: publicUrl,
        status: 'approved', // Auto-approved as requested
        metadata: generateAssetMetadata()
        // Note: created_at defaults to NOW() in database, no need to specify
      };

      console.log('💾 Creating asset record:', assetRecord);

      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert([assetRecord])
        .select()
        .single();

      if (assetError) {
        throw new Error(`Database insert failed: ${assetError.message}`);
      }

      console.log('✅ Video asset uploaded successfully:', assetData);

      alert(`✅ Video asset uploaded successfully!

📋 Details:
• Asset ID: ${assetData.id}
• Template: ${formData.template}
• Section: ${formData.section}
• Category: ${formData.category}
• Duration: ${videoMetadata.duration}s
• Resolution: ${videoMetadata.width}x${videoMetadata.height}
• Status: Approved (ready for use)

The video asset is now available for use in ${formData.template} templates.`);

      // Reset form
      setFormData({
        title: '',
        template: 'letter-hunt',
        section: '',
        category: 'generic',
        prompt: '',
        volume: 0.8,
        ageRange: '3-5'
      });
      setSelectedFile(null);
      setPreviewUrl('');
      setVideoMetadata({});
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Video Asset Upload - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Video Asset Upload
              </h1>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload Video Asset</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g., Monster Character Intro Video"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template *
                  </label>
                  <select
                    value={formData.template}
                    onChange={(e) => handleFormChange('template', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(templateConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Section *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleFormChange('section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select section...</option>
                    {templateConfig[formData.template as keyof typeof templateConfig]?.sections.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="generic">Generic - Works for any child/letter/theme</option>
                    <option value="thematic">Thematic - Specific theme only</option>
                    <option value="letter-specific">Letter Specific - Tied to specific letter only</option>
                    <option value="letter-and-theme">Letter + Theme - Specific letter AND theme combination</option>
                    <option value="name-specific">Name Specific - Tied to specific child</option>
                  </select>
                </div>

                {/* Category-specific fields */}
                {(formData.category === 'thematic' || formData.category === 'letter-specific' || formData.category === 'letter-and-theme' || formData.category === 'name-specific') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme {(formData.category === 'thematic' || formData.category === 'letter-and-theme') ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.theme || ''}
                      onChange={(e) => handleFormChange('theme', e.target.value)}
                      placeholder="Enter theme (e.g., monsters, adventure, princess, etc.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Common themes: monsters, adventure, princess, dinosaurs, space, ocean, halloween, christmas, animals, vehicles, fantasy
                    </p>
                  </div>
                )}

                {(formData.category === 'letter-specific' || formData.category === 'letter-and-theme') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Letter *
                    </label>
                    <select
                      value={formData.targetLetter || ''}
                      onChange={(e) => handleFormChange('targetLetter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select letter...</option>
                      {letters.map((letter) => (
                        <option key={letter} value={letter}>{letter}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.category === 'name-specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Child Name *
                    </label>
                    <input
                      type="text"
                      value={formData.childName || ''}
                      onChange={(e) => handleFormChange('childName', e.target.value)}
                      placeholder="Enter child's name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Technical Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume Level
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={formData.volume}
                      onChange={(e) => handleFormChange('volume', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">{formData.volume}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Range
                  </label>
                  <select
                    value={formData.ageRange}
                    onChange={(e) => handleFormChange('ageRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3-5">3-5 years</option>
                    <option value="6-8">6-8 years</option>
                    <option value="3-8">3-8 years</option>
                  </select>
                </div>

              </div>

              {/* Right Column - File Upload & Preview */}
              <div className="space-y-4">
                
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Select Video File
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports MP4, MOV, AVI. Recommended: 16:9 aspect ratio
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>📁 Selected: {selectedFile.name}</p>
                      <p>📏 Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>

                {/* Video Preview */}
                {previewUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preview
                    </label>
                    <video
                      ref={videoPreviewRef}
                      src={previewUrl}
                      controls
                      className="w-full rounded-lg border"
                      style={{ maxHeight: '200px' }}
                    />
                    
                    {/* Video Metadata */}
                    {videoMetadata.duration && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p>⏱️ Duration: {videoMetadata.duration}s</p>
                        <p>📐 Resolution: {videoMetadata.width}x{videoMetadata.height}</p>
                        <p>📏 Aspect Ratio: {videoMetadata.aspectRatio || '16:9'}</p>
                        {videoMetadata.aspectRatio && videoMetadata.aspectRatio !== '16:9' && (
                          <p className="text-yellow-600">⚠️ Not 16:9 aspect ratio (videos should be 16:9)</p>
                        )}
                        {(!videoMetadata.aspectRatio || videoMetadata.aspectRatio === '16:9') && (
                          <p className="text-green-600">✅ 16:9 aspect ratio</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
              
            </div>

            {/* Prompt Field - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creation Prompt *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => handleFormChange('prompt', e.target.value)}
                placeholder="Describe the prompt or process used to create this video asset..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={uploadVideoAsset}
                disabled={uploading || !selectedFile}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  uploading || !selectedFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload Video Asset'}
              </button>
            </div>

          </div>

          {/* Usage Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📋 Usage Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Generic</strong>: Works across all themes/letters/names</li>
              <li>• <strong>Thematic</strong>: Specific to themes like "Halloween" or "Monsters"</li>
              <li>• <strong>Letter Specific</strong>: Shows or relates to a specific letter (A-Z)</li>
              <li>• <strong>Letter + Theme</strong>: Specific letter AND theme combination (e.g., "A" with "Monsters")</li>
              <li>• <strong>Name Specific</strong>: Created for a specific child's name</li>
              <li>• All uploads are automatically approved and ready for use</li>
              <li>• Templates will use these assets based on exact metadata matches</li>
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
