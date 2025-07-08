import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface AudioGenerationRequest {
  script: string;
  voiceId: string;
  speed: number;
  style?: string;
  projectId?: string;
  isPersonalized: boolean;
}

interface Child {
  id: string;
  name: string;
  custom_assets?: any;
}

interface Project {
  id: string;
  name: string;
  child_id: string;
  template: string;
  status: string;
}

export default function AudioGenerator() {
  const [audioForm, setAudioForm] = useState<AudioGenerationRequest>({
    script: '',
    voiceId: '248nvfaZe8BXhKntjmpp', // Default to Murph
    speed: 0.8, // Default speed for Murph
    style: '',
    isPersonalized: false,
  });
  
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedAudios, setGeneratedAudios] = useState<any[]>([]);
  
  // Project and child checking
  const [children, setChildren] = useState<Child[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [checkingAssets, setCheckingAssets] = useState(false);
  const [assetCheckResult, setAssetCheckResult] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchChildren();
    fetchProjects();
    fetchGeneratedAudios();
  }, []);

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
    setLoading(false);
  };

  const fetchChildren = async () => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching children:', error);
    } else {
      setChildren(data || []);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('content_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
  };

  const fetchGeneratedAudios = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .order('created_at', { ascending: false })
      .limit(10); // Show last 10 generated audios

    if (error) {
      console.error('Error fetching generated audios:', error);
    } else {
      setGeneratedAudios(data || []);
    }
  };

  const handleGenerateAudio = async () => {
    if (!audioForm.script.trim()) {
      alert('Please enter a script');
      return;
    }

    setGenerating(true);
    setGenerationResult(null);
    setConfigError(null);

    // Store the current form data for the request
    const requestData = {
      script: audioForm.script.trim(),
      voiceId: audioForm.voiceId,
      speed: audioForm.speed,
      style: audioForm.style,
      projectId: audioForm.projectId,
      isPersonalized: audioForm.isPersonalized,
    };

    try {
      const response = await fetch('/api/assets/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Refresh the generated audios list
        await fetchGeneratedAudios();
        // Reset the form for next generation
        setAudioForm({
          script: '',
          voiceId: '248nvfaZe8BXhKntjmpp',
          speed: 0.8,
          style: '',
          isPersonalized: false,
        });
        alert('Audio generated successfully!');
      } else {
        if (result.error === 'ELEVENLABS_API_KEY not configured') {
          setConfigError('ELEVENLABS_API_KEY not configured. Please add your ElevenLabs API key to your .env.local file.');
        } else {
          alert(`Generation failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckChildAssets = async () => {
    if (!selectedChild) {
      alert('Please select a child first');
      return;
    }

    setCheckingAssets(true);
    setAssetCheckResult(null);

    try {
      const response = await fetch('/api/assets/check-child-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          projectId: selectedProject || null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAssetCheckResult(result);
      } else {
        alert(`Asset check failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Asset check error:', error);
      alert('Asset check failed. Please try again.');
    } finally {
      setCheckingAssets(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setAudioForm(prev => ({
      ...prev,
      voiceId,
      // Set default speed based on voice
      speed: voiceId === '248nvfaZe8BXhKntjmpp' ? 0.8 : 1.0, // Murph default 0.8, others 1.0
    }));
  };

  const handleRegenerateAudio = async (assetId: string) => {
    // Find the asset to regenerate
    const assetToRegenerate = generatedAudios.find(audio => audio.id === assetId);
    if (!assetToRegenerate) {
      alert('Asset not found for regeneration');
      return;
    }

    setGenerating(true);
    setConfigError(null);

    try {
      const response = await fetch('/api/assets/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: assetToRegenerate.metadata?.script || '',
          voiceId: assetToRegenerate.metadata?.voice_id || '248nvfaZe8BXhKntjmpp',
          speed: assetToRegenerate.metadata?.speed || 0.8,
          style: assetToRegenerate.metadata?.style || '',
          projectId: assetToRegenerate.metadata?.project_id,
          isPersonalized: assetToRegenerate.metadata?.is_personalized || false,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Refresh the generated audios list
        await fetchGeneratedAudios();
        alert('Audio regenerated successfully!');
      } else {
        if (result.error === 'ELEVENLABS_API_KEY not configured') {
          setConfigError('ELEVENLABS_API_KEY not configured. Please add your ElevenLabs API key to your .env.local file.');
        } else {
          alert(`Regeneration failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Audio regeneration error:', error);
      alert('Regeneration failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Audio Generator</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/assets')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Back to Assets
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Audio Generation */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Custom Audio</h2>
              
              <div className="space-y-4">
                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎤 Voice</label>
                  <select
                    value={audioForm.voiceId}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="248nvfaZe8BXhKntjmpp">Murph (Default)</option>
                    <option value="voice_id_2">Voice 2</option>
                    <option value="voice_id_3">Voice 3</option>
                    {/* Add more voices as needed */}
                  </select>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed: {audioForm.speed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={audioForm.speed}
                    onChange={(e) => setAudioForm(prev => ({ 
                      ...prev, 
                      speed: parseFloat(e.target.value) 
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* Script Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📝 Script</label>
                  <textarea
                    placeholder="Enter the script for audio generation..."
                    value={audioForm.script}
                    onChange={(e) => setAudioForm(prev => ({ 
                      ...prev, 
                      script: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={6}
                  />
                </div>

                {/* Style Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., cheerful, calm, excited..."
                    value={audioForm.style}
                    onChange={(e) => setAudioForm(prev => ({ 
                      ...prev, 
                      style: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project (optional)</label>
                  <select
                    value={audioForm.projectId || ''}
                    onChange={(e) => setAudioForm(prev => ({ 
                      ...prev, 
                      projectId: e.target.value || undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Personalized Project Checkbox */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={audioForm.isPersonalized}
                      onChange={(e) => setAudioForm(prev => ({ 
                        ...prev, 
                        isPersonalized: e.target.checked 
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🎯 Personalized Project (e.g., recording a specific name)
                    </span>
                  </label>
                  {audioForm.isPersonalized && (
                    <p className="text-xs text-gray-500 mt-1">
                      This audio is for a specific personalized project and should be tagged accordingly.
                    </p>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateAudio}
                  disabled={!audioForm.script.trim() || generating}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    !audioForm.script.trim() || generating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {generating ? 'Generating Audio...' : 'Generate Audio'}
                </button>
              </div>

              {/* Configuration Error */}
              {configError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">Configuration Error</h3>
                  <p className="text-sm text-red-700 mb-2">{configError}</p>
                  <div className="text-sm text-red-600">
                    <p>To fix this:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Get your API key from <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="underline">ElevenLabs</a></li>
                      <li>Add it to your <code className="bg-red-100 px-1 rounded">.env.local</code> file:</li>
                      <li><code className="bg-red-100 px-1 rounded">ELEVENLABS_API_KEY=your_api_key_here</code></li>
                      <li>Restart your development server</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Generation Result */}
              {generationResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Audio Generated Successfully!</h3>
                  <div className="text-sm text-green-700">
                    <p>Asset ID: {generationResult.asset?.id}</p>
                    {generationResult.audioData && (
                      <div className="mt-2">
                        <audio controls className="w-full">
                          <source src={generationResult.audioData} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <div className="flex space-x-2 mt-2">
                          <a
                            href={generationResult.audioData}
                            download="generated-audio.mp3"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Download Audio
                          </a>
                          <button
                            onClick={() => handleRegenerateAudio(generationResult.asset.id)}
                            disabled={generating}
                            className="text-orange-600 hover:text-orange-800 underline disabled:opacity-50"
                          >
                            {generating ? 'Regenerating...' : '🔄 Regenerate'}
                          </button>
                          <button
                            onClick={() => {
                              setGenerationResult(null);
                              setAudioForm({
                                script: '',
                                voiceId: '248nvfaZe8BXhKntjmpp',
                                speed: 0.8,
                                style: '',
                                isPersonalized: false,
                              });
                            }}
                            className="text-green-600 hover:text-green-800 underline"
                          >
                            ✨ Generate Another
                          </button>
                        </div>
                      </div>
                    )}
                    {generationResult.generationInfo && (
                      <div className="mt-2 text-xs text-green-600">
                        <p>Voice: {generationResult.generationInfo.voiceId}</p>
                        <p>Speed: {generationResult.generationInfo.speed}x</p>
                        <p>Script Length: {generationResult.generationInfo.scriptLength} characters</p>
                        <p>Audio Size: {Math.round(generationResult.generationInfo.audioSize / 1024)} KB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Audios History */}
              {generatedAudios.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Generated Audios</h3>
                  <div className="space-y-3">
                    {generatedAudios.map((audio) => (
                      <div key={audio.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{audio.theme}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(audio.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {audio.metadata?.audio_data && (
                          <div className="mb-3">
                            <audio controls className="w-full">
                              <source src={audio.metadata.audio_data} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600">
                            {audio.metadata?.script && (
                              <p className="truncate max-w-xs">
                                "{audio.metadata.script.substring(0, 50)}..."
                              </p>
                            )}
                            <p>Voice: {audio.metadata?.voice_id || 'Unknown'}</p>
                            <p>Speed: {audio.metadata?.speed || 1.0}x</p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <a
                              href={audio.metadata?.audio_data}
                              download={`${audio.theme}.mp3`}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => handleRegenerateAudio(audio.id)}
                              disabled={generating}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                              {generating ? '...' : '🔄'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Asset Checking */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Check Child Assets</h2>
              <p className="text-sm text-gray-600 mb-4">
                Check what custom assets a child needs for their video projects.
              </p>
              
              <div className="space-y-4">
                {/* Child Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👶 Child</label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a child...</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project (optional)</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {projects
                      .filter(project => !selectedChild || project.child_id === selectedChild)
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Check Assets Button */}
                <button
                  onClick={handleCheckChildAssets}
                  disabled={!selectedChild || checkingAssets}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    !selectedChild || checkingAssets
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {checkingAssets ? 'Checking Assets...' : 'Check Required Assets'}
                </button>
              </div>

              {/* Asset Check Result */}
              {assetCheckResult && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Asset Check Results</h3>
                  <div className="text-sm text-blue-700">
                    {assetCheckResult.requiredAssets && assetCheckResult.requiredAssets.length > 0 ? (
                      <div>
                        <p className="font-medium mb-2">Required Assets:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {assetCheckResult.requiredAssets.map((asset: any, index: number) => (
                            <li key={index}>
                              {asset.type}: {asset.description}
                              {asset.status === 'missing' && (
                                <span className="text-red-600 ml-2">(Missing)</span>
                              )}
                              {asset.status === 'exists' && (
                                <span className="text-green-600 ml-2">(Exists)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>No specific assets required for this child/project combination.</p>
                    )}
                    
                    {assetCheckResult.existingAssets && assetCheckResult.existingAssets.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Existing Assets:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {assetCheckResult.existingAssets.map((asset: any, index: number) => (
                            <li key={index}>
                              {asset.type}: {asset.name || asset.id}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 