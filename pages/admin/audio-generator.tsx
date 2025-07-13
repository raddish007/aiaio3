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
  templateContext?: {
    templateType?: string;
    assetPurpose?: string;
    childName?: string;
    targetLetter?: string;
  };
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

interface TemplateAudio {
  id: string;
  name: string;
  template_type: string;
  asset_purpose: string;
  script: string;
  voice_id: string;
  speed: number;
  description?: string;
  tags?: string[];
}

export default function AudioGenerator() {
  const [audioForm, setAudioForm] = useState<AudioGenerationRequest>({
    script: '',
    voiceId: '248nvfaZe8BXhKntjmpp', // Default to Murph
    speed: 0.8, // Default speed for Murph
    style: '',
    isPersonalized: false,
    templateContext: undefined,
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
  
  // Template audio scripts
  const [templateScripts, setTemplateScripts] = useState<TemplateAudio[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchChildren();
    fetchProjects();
    fetchGeneratedAudios();
    fetchTemplateScripts();
  }, []);

  // Handle URL parameters from Letter Hunt page
  useEffect(() => {
    if (router.query.script && router.query.templateType) {
      console.log('🎯 Received Letter Hunt audio generation request:', router.query);
      
      // Pre-fill the form with Letter Hunt parameters
      setAudioForm(prev => ({
        ...prev,
        script: router.query.script as string,
        voiceId: router.query.voiceId as string || '248nvfaZe8BXhKntjmpp',
        speed: parseFloat(router.query.speed as string) || 1.0,
        isPersonalized: true,
        templateContext: {
          templateType: router.query.templateType as string,
          assetPurpose: router.query.assetPurpose as string,
          childName: router.query.childName as string,
          targetLetter: router.query.targetLetter as string,
        }
      }));
    }
  }, [router.query]);

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

  const fetchTemplateScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('template_audio_scripts')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching template scripts:', error);
      } else {
        setTemplateScripts(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTemplateScripts:', error);
    }
  };

  const handleTemplateScriptSelect = (scriptId: string) => {
    const selectedScript = templateScripts.find(script => script.id === scriptId);
    if (selectedScript) {
      const childName = audioForm.templateContext?.childName || '[NAME]';
      const targetLetter = audioForm.templateContext?.targetLetter || '[LETTER]';
      
      // Replace both [NAME] and [LETTER] placeholders
      let personalizedScript = selectedScript.script
        .replace(/\[NAME\]/g, childName)
        .replace(/\[LETTER\]/g, targetLetter);
      
      console.log('🎯 Template script selected:', {
        templateName: selectedScript.name,
        originalScript: selectedScript.script,
        personalizedScript: personalizedScript,
        childName,
        targetLetter
      });
      
      setAudioForm(prev => ({
        ...prev,
        script: personalizedScript,
        voiceId: selectedScript.voice_id,
        speed: selectedScript.speed,
        templateContext: {
          templateType: selectedScript.template_type,
          assetPurpose: selectedScript.asset_purpose,
          childName: prev.templateContext?.childName || '[NAME]',
          targetLetter: prev.templateContext?.targetLetter || '[LETTER]'
        }
      }));
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
      templateContext: audioForm.templateContext,
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
        
        // Don't automatically redirect - let user stay on audio generator
        // They can manually navigate back if needed
        console.log('✅ Audio generated successfully. Staying on audio generator page.');
        
        // Reset the form for next generation (but keep template context)
        setAudioForm(prev => ({
          script: '',
          voiceId: '248nvfaZe8BXhKntjmpp',
          speed: 0.8,
          style: '',
          isPersonalized: prev.isPersonalized,
          templateContext: prev.templateContext, // Keep template context
        }));
        
        // Show success message with return link if coming from Letter Hunt
        if (router.query.returnUrl && router.query.returnUrl.includes('letter-hunt')) {
          alert('Audio generated successfully! Click "Return to Letter Hunt" to go back and see your new audio asset.');
        } else {
          alert('Audio generated successfully! You can listen to it below and navigate back when ready.');
        }
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
              {/* Return to Letter Hunt button - show when coming from Letter Hunt */}
              {router.query.returnUrl && router.query.returnUrl.includes('letter-hunt') && (
                <button
                  onClick={() => {
                    const returnUrl = router.query.returnUrl as string;
                    if (returnUrl) {
                      router.push(returnUrl);
                    } else {
                      router.push('/admin/letter-hunt-request');
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Return to Letter Hunt
                </button>
              )}
              <button
                onClick={() => router.push('/admin/template-audio')}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
              >
                Template Audio
              </button>
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
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Quick Template</label>
                  <select
                    value=""
                    onChange={(e) => {
                      const templateType = e.target.value;
                      if (templateType) {
                        const childName = audioForm.templateContext?.childName || '[NAME]';
                        let script = '';
                        let assetPurpose = '';
                        
                        switch (templateType) {
                          case 'lullaby-intro':
                            script = `It's time for bed, ${childName}! Let's get ready for a peaceful night's sleep.`;
                            assetPurpose = 'intro_audio';
                            break;
                          case 'lullaby-outro':
                            script = `Sweet dreams, ${childName}. Sleep well and have wonderful dreams.`;
                            assetPurpose = 'outro_audio';
                            break;
                          case 'name-video-intro':
                            script = `Hello ${childName}! Let's learn about your special name today.`;
                            assetPurpose = 'intro_audio';
                            break;
                          case 'name-video-outro':
                            script = `Great job, ${childName}! You're learning so much about your name.`;
                            assetPurpose = 'outro_audio';
                            break;
                          case 'letter-hunt-intro':
                            script = `Ready for an adventure, ${childName}? Let's go on a letter hunt!`;
                            assetPurpose = 'intro_audio';
                            break;
                          case 'letter-hunt-outro':
                            script = `Amazing work, ${childName}! You found all the letters!`;
                            assetPurpose = 'outro_audio';
                            break;
                        }
                        
                        setAudioForm(prev => ({
                          ...prev,
                          script,
                          templateContext: {
                            templateType: templateType.split('-')[0],
                            assetPurpose,
                            childName: prev.templateContext?.childName || '[NAME]'
                          }
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template to auto-fill...</option>
                    <option value="lullaby-intro">Lullaby - Intro</option>
                    <option value="lullaby-outro">Lullaby - Outro</option>
                    <option value="name-video-intro">Name Video - Intro</option>
                    <option value="name-video-outro">Name Video - Outro</option>
                    <option value="letter-hunt-intro">Letter Hunt - Intro</option>
                    <option value="letter-hunt-outro">Letter Hunt - Outro</option>
                  </select>
                </div>

                {/* Template Scripts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Template Script</label>
                  <select
                    value=""
                    onChange={(e) => handleTemplateScriptSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template script...</option>
                    
                    {/* Group templates by type for better organization */}
                    {Object.entries(
                      templateScripts.reduce((groups, script) => {
                        const type = script.template_type;
                        if (!groups[type]) groups[type] = [];
                        groups[type].push(script);
                        return groups;
                      }, {} as Record<string, TemplateAudio[]>)
                    ).map(([templateType, scripts]) => (
                      <optgroup key={templateType} label={`${templateType.toUpperCase()} Templates`}>
                        {scripts.map((script) => (
                          <option key={script.id} value={script.id}>
                            {script.name} - "{script.script}"
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a template script to auto-fill with personalized content ({audioForm.templateContext?.childName || '[NAME]'}, letter {audioForm.templateContext?.targetLetter || '[LETTER]'})
                  </p>
                  
                  {/* Show current template context if available */}
                  {audioForm.templateContext && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <div className="font-medium text-blue-800">Current Template Context:</div>
                      <div className="text-blue-700">
                        Template: {audioForm.templateContext.templateType} | 
                        Purpose: {audioForm.templateContext.assetPurpose} | 
                        Child: {audioForm.templateContext.childName}
                        {audioForm.templateContext.targetLetter && ` | Letter: ${audioForm.templateContext.targetLetter}`}
                      </div>
                    </div>
                  )}
                </div>

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

                {/* Template Context - Only show if not pre-filled from URL */}
                {!router.query.templateType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎬 Template Context (optional)</label>
                    <div className="space-y-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Template Type</label>
                        <select
                          value={audioForm.templateContext?.templateType || ''}
                          onChange={(e) => setAudioForm(prev => ({ 
                            ...prev, 
                            templateContext: {
                              ...prev.templateContext,
                              templateType: e.target.value
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">No Template</option>
                          <option value="lullaby">Lullaby Template</option>
                          <option value="name-video">Name Video Template</option>
                          <option value="letter-hunt">Letter Hunt Template</option>
                        </select>
                      </div>
                      
                      {audioForm.templateContext?.templateType && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Asset Purpose</label>
                            <select
                              value={audioForm.templateContext?.assetPurpose || ''}
                              onChange={(e) => setAudioForm(prev => ({ 
                                ...prev, 
                                templateContext: {
                                  ...prev.templateContext,
                                  assetPurpose: e.target.value
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select Purpose</option>
                              {audioForm.templateContext?.templateType === 'lullaby' && (
                                <>
                                  <option value="intro_audio">Intro Audio</option>
                                  <option value="outro_audio">Outro Audio</option>
                                  <option value="background_music">Background Music</option>
                                </>
                              )}
                              {audioForm.templateContext?.templateType === 'name-video' && (
                                <>
                                  <option value="intro_audio">Intro Audio</option>
                                  <option value="outro_audio">Outro Audio</option>
                                  <option value="background_music">Background Music</option>
                                </>
                              )}
                              {audioForm.templateContext?.templateType === 'letter-hunt' && (
                                <>
                                  <option value="intro_audio">Intro Audio</option>
                                  <option value="outro_audio">Outro Audio</option>
                                  <option value="background_music">Background Music</option>
                                </>
                              )}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Child Name (optional)</label>
                            <input
                              type="text"
                              placeholder="e.g., Nolan"
                              value={audioForm.templateContext?.childName || ''}
                              onChange={(e) => setAudioForm(prev => ({ 
                                ...prev, 
                                templateContext: {
                                  ...prev.templateContext,
                                  childName: e.target.value
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {audioForm.templateContext?.templateType && (
                      <p className="text-xs text-gray-500 mt-1">
                        This audio will be tagged for the {audioForm.templateContext.templateType} template as {audioForm.templateContext.assetPurpose}.
                      </p>
                    )}
                  </div>
                )}

                {/* Child Name input for template context when coming from URL */}
                {router.query.templateType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">👶 Child Name</label>
                    <input
                      type="text"
                      placeholder="Enter child's name for personalization"
                      value={audioForm.templateContext?.childName || ''}
                      onChange={(e) => setAudioForm(prev => ({ 
                        ...prev, 
                        templateContext: {
                          ...prev.templateContext,
                          childName: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will personalize the audio script for the child (template context is locked when coming from {audioForm.templateContext?.templateType} workflow).
                    </p>
                  </div>
                )}

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
                                templateContext: undefined,
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