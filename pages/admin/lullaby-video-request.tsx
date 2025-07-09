import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  parent_id: string;
}

export default function LullabyVideoRequest() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dreamDripDuration, setDreamDripDuration] = useState<number | null>(null);
  const [jobInfo, setJobInfo] = useState<{
    job_id: string;
    render_id: string;
    output_url: string;
    job_tracking_url: string;
  } | null>(null);

  // Helper function to get theme emoji
  const getThemeEmoji = (theme: string) => {
    const themeEmojis: { [key: string]: string } = {
      'halloween': '🎃',
      'space': '🚀',
      'animals': '🐾',
      'vehicles': '🚗',
      'dinosaurs': '🦕',
      'princesses': '👑',
      'superheroes': '🦸‍♂️',
      'nature': '🌿',
      'jungle': '🦁',
      'ocean': '🐠',
      'farm': '🐄',
      'construction': '🏗️',
      'music': '🎵',
      'sports': '⚽',
      'food': '🍕',
      'default': '🌟'
    };
    return themeEmojis[theme] || themeEmojis.default;
  };

  useEffect(() => {
    checkAdminAccess();
    fetchChildren();
    fetchDreamDripDuration();
  }, []);

  const fetchDreamDripDuration = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('metadata')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single();

      if (error) throw error;
      if (data?.metadata?.duration) {
        setDreamDripDuration(data.metadata.duration);
      }
    } catch (error) {
      console.error('Error fetching DreamDrip duration:', error);
      setError('Failed to load DreamDrip duration');
    }
  };

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }
  };

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const submitLullabyVideo = async () => {
    if (!selectedChild) return;

    setSubmittingVideo(true);
    setError(null);
    setSuccess(null);
    setJobInfo(null);

    try {
      // Submit video generation job to Lambda with new Lullaby template
      const response = await fetch('/api/videos/generate-lullaby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: selectedChild.name,
          childAge: selectedChild.age,
          childTheme: selectedChild.primary_interest,
          childId: selectedChild.id,
          submitted_by: (await supabase.auth.getUser()).data.user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit video generation');
      }

      const result = await response.json();
      setSuccess(`Lullaby video generation started successfully!`);
      setJobInfo({
        job_id: result.job_id,
        render_id: result.render_id,
        output_url: result.output_url,
        job_tracking_url: result.job_tracking_url
      });
      
      // Reset form
      setSelectedChild(null);

    } catch (error) {
      console.error('Error submitting video:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit video generation');
    } finally {
      setSubmittingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Lullaby Video Request</h1>
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
        {/* Step 1: Select Child */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Child</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedChild?.id === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getThemeEmoji(child.primary_interest)}</span>
                  <div className="font-medium text-gray-900">{child.name}</div>
                </div>
                <div className="text-sm text-gray-500">
                  Age: {child.age} • Theme: {child.primary_interest}
                </div>
              </button>
            ))}
          </div>

          {children.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No children found. Please add children first.</p>
            </div>
          )}
        </div>

        {/* Step 2: Child Data for Lambda */}
        {selectedChild && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Step 2: Child Data for {selectedChild.name}'s Lullaby Video
              </h2>
              <div className="ml-3 flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span className="mr-1">{getThemeEmoji(selectedChild.primary_interest)}</span>
                {selectedChild.primary_interest} theme
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Data that will be sent to Lambda:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child Name:</span>
                    <span className="font-medium">{selectedChild.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child Age:</span>
                    <span className="font-medium">{selectedChild.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Theme/Interest:</span>
                    <span className="font-medium">{selectedChild.primary_interest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child ID:</span>
                    <span className="font-mono text-sm">{selectedChild.id}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium">Lullaby</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Background Music:</span>
                    <span className="text-yellow-600">⚠️ Not yet implemented</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intro Audio:</span>
                    <span className="text-yellow-600">⚠️ Not yet implemented</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slideshow Images:</span>
                    <span className="text-yellow-600">⚠️ Not yet implemented</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">JSON Payload Preview:</h4>
                <pre className="text-sm text-blue-800 bg-blue-100 p-3 rounded overflow-x-auto">
{JSON.stringify({
  childName: selectedChild.name,
  childAge: selectedChild.age,
  childTheme: selectedChild.primary_interest,
  childId: selectedChild.id,
  submitted_by: 'current_user_id',
  duration: dreamDripDuration || 'Loading...'
}, null, 2)}
                </pre>
                {dreamDripDuration && (
                  <div className="mt-3 text-sm text-blue-700">
                    <span className="font-medium">Duration:</span> {dreamDripDuration} seconds (fetched from DreamDrip asset)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate Video */}
        {selectedChild && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Generate Lullaby Video</h2>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 mb-4">
                Ready to generate {selectedChild.name}'s lullaby video with basic template data.
                <br />
                <span className="text-sm text-blue-600">
                  Note: This will render the basic template without personalized assets (background music, intro audio, etc.) 
                  which will be added in future phases.
                </span>
              </p>
              <button
                onClick={submitLullabyVideo}
                disabled={submittingVideo}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVideo ? 'Submitting to Lambda...' : 'Generate Lullaby Video'}
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{success}</p>
            
            {jobInfo && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700 mb-1">Job ID:</div>
                    <div className="font-mono text-gray-900">{jobInfo.job_id}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700 mb-1">Render ID:</div>
                    <div className="font-mono text-gray-900">{jobInfo.render_id}</div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-700 mb-1">Output URL:</div>
                  <div className="font-mono text-sm text-gray-900 break-all">
                    {jobInfo.output_url}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-green-200">
                  <a 
                    href={jobInfo.job_tracking_url}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Track Job Progress
                  </a>
                  <a 
                    href="/admin/jobs"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View All Jobs
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 