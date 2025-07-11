import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

interface Prompt {
  id: string;
  asset_type: 'image' | 'audio' | 'video' | 'prompt';
  theme: string;
  style?: string;
  safe_zone?: string;
  prompt_text: string;
  created_at: string;
  status: string;
  metadata?: any;
}

interface GenerationJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  jobId?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export default function AIGenerator() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editedPromptText, setEditedPromptText] = useState('');
  const [generationForm, setGenerationForm] = useState({
    style: '',
    safeZone: 'center_safe' as 'left_safe' | 'right_safe' | 'center_safe' | 'intro_safe' | 'outro_safe' | 'all_ok' | 'not_applicable' | 'frame' | 'slideshow',
  });
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [filter, setFilter] = useState({
    assetType: 'all',
    theme: '',
    status: 'all',
    showUsed: false,
  });
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchPrompts();
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
  };

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
    } else {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  const handleGenerateAsset = async () => {
    if (!selectedPrompt) {
      alert('Please select a prompt first');
      return;
    }

    // Check if prompt has been modified but not saved
    if (editedPromptText !== selectedPrompt.prompt_text) {
      const shouldContinue = confirm(
        'You have unsaved changes to the prompt. Do you want to generate with the modified prompt?\n\n' +
        'Click OK to generate with modified prompt, or Cancel to save first.'
      );
      if (!shouldContinue) {
        return;
      }
    }

    setGenerating(true);
    setGenerationResult(null);
    setConfigError(null);

    try {
      const response = await fetch('/api/assets/generate-fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          assetType: 'image', // Always image for this page
          prompt: editedPromptText || selectedPrompt.prompt_text, // Use edited text if available
          aspectRatio: '16:9', // Hardcoded to 16:9
          duration: 30,
          style: generationForm.style,
          safeZone: generationForm.safeZone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Refresh prompts to show updated status
        fetchPrompts();
      } else {
        if (result.error === 'FAL_AI_API_KEY not configured') {
          setConfigError('FAL_AI_API_KEY not configured. Please add your fal.ai API key to your .env.local file.');
        } else {
          alert(`Generation failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async (count: number) => {
    // Auto-select an available image prompt if none selected
    let promptToUse = selectedPrompt;
    if (!promptToUse) {
      const availableImagePrompts = prompts.filter(p => 
        p.asset_type === 'image' && p.status !== 'completed'
      );
      if (availableImagePrompts.length === 0) {
        alert('No available image prompts found. Please generate some prompts first.');
        return;
      }
      promptToUse = availableImagePrompts[0];
      setSelectedPrompt(promptToUse);
    }

    setBatchGenerating(true);
    setBatchResults([]);
    setGenerationResult(null); // Clear previous results

    try {
      const results = [];
      console.log(`Starting batch generation of ${count} images using prompt: ${promptToUse.theme}`);
      
      for (let i = 0; i < count; i++) {
        console.log(`Generating image ${i + 1}/${count}...`);
        
        const response = await fetch('/api/assets/generate-fal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptId: promptToUse.id,
            assetType: 'image', // Force image type for quick generation
            prompt: promptToUse.prompt_text,
            aspectRatio: '16:9', // Default aspect ratio
            duration: 30,
            style: promptToUse.style || '',
            safeZone: 'center_safe', // Default safe zone
          }),
        });

        const result = await response.json();
        if (response.ok) {
          results.push(result);
          console.log(`Image ${i + 1} generated successfully:`, result.asset?.id);
        } else {
          console.error(`Generation ${i + 1} failed:`, result.error);
          results.push({ error: result.error || 'Generation failed' });
        }
      }

      setBatchResults(results);
      
      // Show success message
      const successCount = results.filter(r => !r.error).length;
      if (successCount > 0) {
        alert(`Successfully generated ${successCount} out of ${count} images!`);
      }
      
      // Refresh prompts to show updated status
      await fetchPrompts();
      
      // Clear selected prompt so it disappears from the list
      setSelectedPrompt(null);
      
    } catch (error) {
      console.error('Batch generation error:', error);
      alert('Batch generation failed. Please try again.');
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleBatchGenerateSchnell = async (count: number) => {
    // Auto-select an available image prompt if none selected
    let promptToUse = selectedPrompt;
    if (!promptToUse) {
      const availableImagePrompts = prompts.filter(p => 
        p.asset_type === 'image' && p.status !== 'completed'
      );
      if (availableImagePrompts.length === 0) {
        alert('No available image prompts found. Please generate some prompts first.');
        return;
      }
      promptToUse = availableImagePrompts[0];
      setSelectedPrompt(promptToUse);
    }

    setBatchGenerating(true);
    setBatchResults([]);
    setGenerationResult(null); // Clear previous results

    try {
      const results = [];
      console.log(`Starting batch Schnell generation of ${count} images using prompt: ${promptToUse.theme}`);
      
      for (let i = 0; i < count; i++) {
        console.log(`Generating Schnell image ${i + 1}/${count}...`);
        
        const response = await fetch('/api/assets/generate-schnell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptId: promptToUse.id,
            assetType: 'image', // Force image type for quick generation
            prompt: promptToUse.prompt_text,
            aspectRatio: '16:9', // Default aspect ratio
            duration: 30,
            style: promptToUse.style || '',
            safeZone: 'center_safe', // Default safe zone
          }),
        });

        const result = await response.json();
        if (response.ok) {
          results.push(result);
          console.log(`Schnell image ${i + 1} generated successfully:`, result.asset?.id);
        } else {
          console.error(`Schnell generation ${i + 1} failed:`, result.error);
          results.push({ error: result.error || 'Schnell generation failed' });
        }
      }

      setBatchResults(results);
      
      // Show success message
      const successCount = results.filter(r => !r.error).length;
      if (successCount > 0) {
        alert(`Successfully generated ${successCount} out of ${count} Schnell images!`);
      }
      
      // Refresh prompts to show updated status
      await fetchPrompts();
      
      // Clear selected prompt so it disappears from the list
      setSelectedPrompt(null);
      
    } catch (error) {
      console.error('Schnell batch generation error:', error);
      alert('Schnell batch generation failed. Please try again.');
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleCustomPromptGenerate = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a custom prompt');
      return;
    }

    setGenerating(true);
    setGenerationResult(null);
    setConfigError(null);

    try {
      const response = await fetch('/api/assets/generate-fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: null, // No prompt ID for custom prompts
          assetType: 'image', // Default to image for custom prompts
          prompt: customPrompt.trim(),
          aspectRatio: '16:9', // Default aspect ratio
          duration: 30,
          style: '',
          safeZone: 'center_safe', // Default safe zone
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Clear the custom prompt after successful generation
        setCustomPrompt('');
        alert('Custom prompt image generated successfully!');
      } else {
        if (result.error === 'FAL_AI_API_KEY not configured') {
          setConfigError('FAL_AI_API_KEY not configured. Please add your fal.ai API key to your .env.local file.');
        } else {
          alert(`Generation failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Custom prompt generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt || !editedPromptText.trim()) {
      alert('Please enter a prompt text');
      return;
    }

    try {
      const { error } = await supabase
        .from('prompts')
        .update({ prompt_text: editedPromptText.trim() })
        .eq('id', selectedPrompt.id);

      if (error) {
        console.error('Error updating prompt:', error);
        alert('Failed to save prompt. Please try again.');
        return;
      }

      // Update the local prompt data
      setSelectedPrompt({ ...selectedPrompt, prompt_text: editedPromptText.trim() });
      
      // Refresh the prompts list
      fetchPrompts();
      
      alert('Prompt saved successfully!');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    if (filter.assetType !== 'all' && prompt.asset_type !== filter.assetType) return false;
    if (filter.theme && !prompt.theme.toLowerCase().includes(filter.theme.toLowerCase())) return false;
    if (filter.status !== 'all' && prompt.status !== filter.status) return false;
    // Show used prompts if checkbox is checked, otherwise hide them
    if (!filter.showUsed && prompt.status === 'used') return false;
    return true;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="AI Asset Generator"
        subtitle="Generate and manage AI assets with custom prompts"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Generation Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-200">
          {/* Generation Status */}
          {batchGenerating && (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Generating images...</span>
              </div>
              <p className="text-center text-sm text-blue-600 mt-1">Please wait, this may take several minutes</p>
            </div>
          )}

          {/* Batch Results Summary */}
          {batchResults.length > 0 && !batchGenerating && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
              <h3 className="text-green-800 font-medium text-center mb-2">✅ Generation Complete!</h3>
              <p className="text-center text-sm text-green-700">
                Successfully generated {batchResults.filter(r => !r.error).length} out of {batchResults.length} images
              </p>
              {batchResults.some(r => r.error) && (
                <p className="text-center text-xs text-green-600 mt-1">
                  Some images failed to generate. Check the results below for details.
                </p>
              )}
            </div>
          )}
          
          {/* Imagen4 Section */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 Quick Image Generation (Imagen4)</h2>
            <p className="text-gray-600">Generate multiple images with Google's Imagen4 model</p>
          </div>
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => handleBatchGenerate(1)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '1 Image'}
            </button>
            <button
              onClick={() => handleBatchGenerate(5)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '5 Images'}
            </button>
            <button
              onClick={() => handleBatchGenerate(10)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '10 Images'}
            </button>
            <button
              onClick={() => handleBatchGenerate(15)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '15 Images'}
            </button>
          </div>

          {/* Schnell Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚡ Quick Schnell Generation (FLUX.1)</h2>
            <p className="text-gray-600">Generate images with FLUX.1 Schnell turbo mode</p>
          </div>
          
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handleBatchGenerateSchnell(1)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '1 Schnell'}
            </button>
            <button
              onClick={() => handleBatchGenerateSchnell(5)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '5 Schnell'}
            </button>
            <button
              onClick={() => handleBatchGenerateSchnell(10)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '10 Schnell'}
            </button>
            <button
              onClick={() => handleBatchGenerateSchnell(15)}
              disabled={batchGenerating}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                batchGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {batchGenerating ? 'Generating...' : '15 Schnell'}
            </button>
          </div>
          
          {batchGenerating && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Generating images... This may take a few minutes.</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Check the browser console for detailed progress</p>
            </div>
          )}
        </div>

        {/* Aspect Ratio Warning */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Aspect Ratio Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  All images are currently generated in <strong>16:9 aspect ratio</strong> for proper context handling. 
                  This ensures optimal results with the fal.ai models.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Prompts */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Prompts</h2>
              <p className="text-sm text-gray-600 mb-4">
                {filter.showUsed 
                  ? 'Showing all prompts (including used ones). Check the box below to hide used prompts.' 
                  : 'Only unused prompts are shown. Check the box below to show used prompts for reuse.'
                }
              </p>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filter.assetType}
                    onChange={(e) => setFilter(prev => ({ ...prev, assetType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="prompt">Prompt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <input
                    type="text"
                    placeholder="Search themes..."
                    value={filter.theme}
                    onChange={(e) => setFilter(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filter.showUsed}
                      onChange={(e) => setFilter(prev => ({ ...prev, showUsed: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show Used Prompts</span>
                  </label>
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Custom Prompt</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter your own prompt:</label>
                    <textarea
                      placeholder="Enter a custom prompt for image generation..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCustomPromptGenerate}
                      disabled={!customPrompt.trim() || generating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {generating ? 'Generating...' : 'Generate Image'}
                    </button>
                    <button
                      onClick={() => setCustomPrompt('')}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompts List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setEditedPromptText(prompt.prompt_text);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{prompt.theme}</span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {prompt.asset_type}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            prompt.status === 'used' ? 'bg-gray-100 text-gray-600' :
                            prompt.status === 'completed' ? 'bg-green-100 text-green-600' :
                            prompt.status === 'failed' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {prompt.status === 'used' ? 'Used' : prompt.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{prompt.prompt_text}</p>
                        {prompt.style && (
                          <p className="text-xs text-gray-500 mt-1">Style: {prompt.style}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Generation Controls */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Settings</h2>
              
              {selectedPrompt ? (
                <div className="space-y-4">
                  {/* Debug Info */}
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    Debug: Asset Type = image | Selected Prompt = {selectedPrompt.theme}
                  </div>
                  
                  {/* Selected Prompt Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Selected Prompt</h3>
                    <p className="text-sm text-gray-600 mb-3">{selectedPrompt.theme}</p>
                    
                    {/* Editable Prompt Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt Text (Editable)
                        {editedPromptText !== selectedPrompt.prompt_text && (
                          <span className="ml-2 text-xs text-orange-600 font-normal">
                            • Modified (unsaved)
                          </span>
                        )}
                      </label>
                      <textarea
                        value={editedPromptText}
                        onChange={(e) => setEditedPromptText(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Edit the prompt text before generating..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          {editedPromptText.length} characters
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditedPromptText(selectedPrompt.prompt_text)}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Reset to Original
                          </button>
                          <button
                            onClick={handleSavePrompt}
                            disabled={editedPromptText === selectedPrompt.prompt_text}
                            className={`text-xs px-2 py-1 rounded ${
                              editedPromptText === selectedPrompt.prompt_text
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generation Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                        16:9 (Landscape) - Fixed for optimal results
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zone</label>
                      <select
                        value={generationForm.safeZone}
                        onChange={(e) => setGenerationForm(prev => ({ 
                          ...prev, 
                          safeZone: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="center_safe">Center Safe</option>
                        <option value="left_safe">Left Safe</option>
                        <option value="right_safe">Right Safe</option>
                        <option value="intro_safe">Intro Safe</option>
                        <option value="outro_safe">Outro Safe</option>
                        <option value="all_ok">All OK</option>
                        <option value="not_applicable">Not Applicable</option>
                        <option value="frame">Frame</option>
                        <option value="slideshow">Slideshow</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Style (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., pixar, watercolor, realistic..."
                        value={generationForm.style}
                        onChange={(e) => setGenerationForm(prev => ({ 
                          ...prev, 
                          style: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleGenerateAsset}
                      disabled={generating || batchGenerating}
                      className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                        generating || batchGenerating
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {generating ? 'Generating...' : 'Generate Image'}
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
                          <li>Get your API key from <a href="https://fal.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">fal.ai/keys</a></li>
                          <li>Add it to your <code className="bg-red-100 px-1 rounded">.env.local</code> file:</li>
                          <li><code className="bg-red-100 px-1 rounded">FAL_AI_API_KEY=your_api_key_here</code></li>
                          <li>Restart your development server</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Generation Result */}
                  {generationResult && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">Generation Successful!</h3>
                      <div className="text-sm text-green-700">
                        <p>Asset ID: {generationResult.asset?.id}</p>
                        <p>Job ID: {generationResult.generationJob?.jobId}</p>
                        {generationResult.asset?.file_url && (
                          <div className="mt-2">
                            <a
                              href={generationResult.asset.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View Generated Asset
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Batch Generation Results */}
                  {batchResults.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Batch Generation Complete!</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Successfully generated {batchResults.length} assets
                      </p>
                      <div className="space-y-2">
                        {batchResults.map((result, index) => (
                          <div key={index} className="text-sm text-blue-700">
                            <p>Asset {index + 1}: {result.asset?.id}</p>
                            {result.asset?.file_url && (
                              <a
                                href={result.asset.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View Asset {index + 1}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a prompt from the left panel to start generating assets.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 