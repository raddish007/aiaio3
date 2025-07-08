import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface ContentProject {
  id: string;
  title: string;
  theme: string;
  target_age: string;
  duration: number;
  status: 'planning' | 'generating' | 'reviewing' | 'approved' | 'video_ready';
  created_at: string;
}

interface Asset {
  id: string;
  project_id: string;
  type: 'image' | 'audio' | 'text';
  prompt: string;
  url?: string;
  status: 'pending' | 'generating' | 'completed' | 'approved' | 'rejected';
  created_at: string;
}

export default function ContentCreation() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add new state for safe zones, prompt count, and aspect ratio
  const [safeZones, setSafeZones] = useState<string[]>(['center_safe']);
  const [promptCount, setPromptCount] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Update newProject state to default target_age to '2-4' and remove duration
  const [newProject, setNewProject] = useState({
    title: '',
    theme: '',
    target_age: '2-4',
  });

  // Asset generation state
  const [selectedProject, setSelectedProject] = useState<ContentProject | null>(null);
  const [assetPrompts, setAssetPrompts] = useState({
    backgrounds: '',
    characters: '',
    props: '',
    voiceover: '',
    music: ''
  });

  useEffect(() => {
    checkUser();
    loadProjects();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      router.push('/dashboard');
      return;
    }

    setUser(user);
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('content_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProjects(data);
  };

  const loadAssets = async (projectId: string) => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (data) setAssets(data);
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('content_projects')
      .insert([{
        title: newProject.title,
        theme: newProject.theme,
        target_age: newProject.target_age,
        duration: 60, // Keep default duration for new projects
        status: 'planning'
      }])
      .select();

    if (data) {
      setProjects([data[0], ...projects]);
      setNewProject({ title: '', theme: '', target_age: '2-4' }); // Reset new project form
      setActiveTab('projects');
    }
    setLoading(false);
  };

  const generateAssets = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      // Generate asset prompts using AI
      const promptGroups = await generateAssetPrompts(selectedProject); // now returns array of groups
      const assetData = [];
      // Each group: { safeZone, aspectRatio, prompts }
      for (const group of promptGroups) {
        const { safeZone, aspectRatio, prompts } = group;
        // backgrounds
        (prompts.backgrounds || []).forEach((prompt: string, index: number) => {
          assetData.push({
            project_id: selectedProject.id,
            type: 'image',
            prompt,
            status: 'pending',
            metadata: {
              category: 'background',
              index,
              template: 'name-video',
              safeZone,
              aspectRatio
            }
          });
        });
        // characters
        (prompts.characters || []).forEach((prompt: string, index: number) => {
          assetData.push({
            project_id: selectedProject.id,
            type: 'image',
            prompt,
            status: 'pending',
            metadata: {
              category: 'character',
              index,
              template: 'name-video',
              safeZone,
              aspectRatio
            }
          });
        });
        // props
        (prompts.props || []).forEach((prompt: string, index: number) => {
          assetData.push({
            project_id: selectedProject.id,
            type: 'image',
            prompt,
            status: 'pending',
            metadata: {
              category: 'prop',
              index,
              template: 'name-video',
              safeZone,
              aspectRatio
            }
          });
        });
        // voiceover
        if (prompts.voiceover) {
          assetData.push({
            project_id: selectedProject.id,
            type: 'audio',
            prompt: prompts.voiceover,
            status: 'pending',
            metadata: {
              category: 'voiceover',
              template: 'name-video',
              safeZone,
              aspectRatio
            }
          });
        }
        // music
        if (prompts.music) {
          assetData.push({
            project_id: selectedProject.id,
            type: 'audio',
            prompt: prompts.music,
            status: 'pending',
            metadata: {
              category: 'music',
              template: 'name-video',
              safeZone,
              aspectRatio
            }
          });
        }
      }
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select();
      if (data) {
        setAssets([...data, ...assets]);
        // Update project status
        await supabase
          .from('content_projects')
          .update({ status: 'generating' })
          .eq('id', selectedProject.id);
        // Trigger asset generation
        try {
          const response = await fetch('/api/assets/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: selectedProject.id })
          });
          if (response.ok) {
            const result = await response.json();
            console.log('Asset generation started:', result);
            setTimeout(() => {
              loadAssets(selectedProject.id);
            }, 2000);
          } else {
            console.error('Failed to trigger asset generation');
          }
        } catch (error) {
          console.error('Error triggering asset generation:', error);
        }
      }
    } catch (error) {
      console.error('Error generating assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAssetPrompts = async (project: ContentProject) => {
    try {
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: project.theme,
          ageRange: project.target_age,
          template: 'name-video', // or make configurable
          personalization: 'general',
          safeZones, // pass array
          promptCount,
          aspectRatio,
          projectId: project.id
        })
      });
      if (response.ok) {
        const result = await response.json();
        return result.prompts;
      } else {
        throw new Error('Failed to generate prompts');
      }
    } catch (error) {
      console.error('Error generating AI prompts:', error);
      // Fallback to template prompts
      return {
        backgrounds: [`Create a colorful, child-friendly background for a ${project.theme} story targeting ${project.target_age} year olds`],
        characters: [`Design friendly, animated characters for a ${project.theme} story for ${project.target_age} year olds`],
        props: [`Generate fun props and objects related to ${project.theme} for children aged ${project.target_age}`],
        voiceover: `Create a warm, engaging voiceover script for a ${project.theme} story for ${project.target_age} year olds`,
        music: `Compose cheerful background music suitable for a ${project.theme} story for ${project.target_age} year olds`
      };
    }
  };

  const approveAsset = async (assetId: string) => {
    const { error } = await supabase
      .from('assets')
      .update({ status: 'approved' })
      .eq('id', assetId);

    if (!error) {
      setAssets(assets.map(asset => 
        asset.id === assetId ? { ...asset, status: 'approved' } : asset
      ));
    }
  };

  const rejectAsset = async (assetId: string) => {
    const { error } = await supabase
      .from('assets')
      .update({ status: 'rejected' })
      .eq('id', assetId);

    if (!error) {
      setAssets(assets.map(asset => 
        asset.id === assetId ? { ...asset, status: 'rejected' } : asset
      ));
    }
  };

  const generateVideo = async (projectId: string) => {
    setLoading(true);
    
    // This would trigger the Remotion video generation pipeline
    // For now, just update the project status
    const { error } = await supabase
      .from('content_projects')
      .update({ status: 'video_ready' })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, status: 'video_ready' } : project
      ));
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'video_ready': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Creation</h1>
          <p className="mt-2 text-gray-600">Manage the complete asset creation pipeline</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'projects', name: 'Projects', icon: '📋' },
              { id: 'planning', name: 'Content Planning', icon: '✏️' },
              { id: 'assets', name: 'Asset Generation', icon: '🎨' },
              { id: 'review', name: 'Asset Review', icon: '👀' },
              { id: 'video', name: 'Video Assembly', icon: '🎬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
              <form onSubmit={createProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Title</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Theme</label>
                    <input
                      type="text"
                      value={newProject.theme}
                      onChange={(e) => setNewProject({...newProject, theme: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., Space Adventure, Ocean Friends"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Age</label>
                    <select
                      value={newProject.target_age}
                      onChange={(e) => setNewProject({...newProject, target_age: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="2-4">2-4 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="4-6">4-6 years</option>
                      <option value="5-7">5-7 years</option>
                    </select>
                  </div>
                  {/* Safe Zone Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zones</label>
                    <div className="flex flex-wrap gap-4">
                      {['left_safe', 'right_safe', 'center_safe', 'frame', 'slideshow'].map(zone => (
                        <label key={zone} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={safeZones.includes(zone)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSafeZones([...safeZones, zone]);
                              } else {
                                setSafeZones(safeZones.filter(z => z !== zone));
                              }
                            }}
                          />
                          <span className="capitalize">{zone.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Prompts per Safe Zone</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={promptCount}
                      onChange={e => setPromptCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={aspectRatio === '16:9'}
                          onChange={() => setAspectRatio('16:9')}
                        />
                        <span>16:9 (Landscape)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={aspectRatio === '9:16'}
                          onChange={() => setAspectRatio('9:16')}
                        />
                        <span>9:16 (Portrait)</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Content Projects</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theme</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.theme}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.target_age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setActiveTab('assets');
                              loadAssets(project.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Manage Assets
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setActiveTab('review');
                              loadAssets(project.id);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Asset Generation Tab */}
        {activeTab === 'assets' && selectedProject && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Generate Assets for: {selectedProject.title}
              </h2>
              <p className="text-gray-600 mb-6">
                Theme: {selectedProject.theme} | Target Age: {selectedProject.target_age}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Images</label>
                  <textarea
                    value={assetPrompts.backgrounds}
                    onChange={(e) => setAssetPrompts({...assetPrompts, backgrounds: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Describe the background scenes you want to generate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Character Images</label>
                  <textarea
                    value={assetPrompts.characters}
                    onChange={(e) => setAssetPrompts({...assetPrompts, characters: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Describe the characters you want to generate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Props & Objects</label>
                  <textarea
                    value={assetPrompts.props}
                    onChange={(e) => setAssetPrompts({...assetPrompts, props: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Describe the props and objects you want to generate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voiceover Script</label>
                  <textarea
                    value={assetPrompts.voiceover}
                    onChange={(e) => setAssetPrompts({...assetPrompts, voiceover: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe the voiceover content you want to generate..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Music</label>
                  <textarea
                    value={assetPrompts.music}
                    onChange={(e) => setAssetPrompts({...assetPrompts, music: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Describe the background music you want to generate..."
                  />
                </div>
              </div>
              
              <button
                onClick={generateAssets}
                disabled={loading}
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating Assets...' : 'Generate All Assets'}
              </button>
            </div>

            {/* Asset Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Asset Generation Status</h3>
              </div>
              <div className="p-6">
                {assets.length === 0 ? (
                  <p className="text-gray-500">No assets generated yet. Click "Generate All Assets" to start.</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{asset.type.toUpperCase()}</span>
                          <p className="text-sm text-gray-600 mt-1">{asset.prompt}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAssetStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Asset Review Tab */}
        {activeTab === 'review' && selectedProject && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Review Assets for: {selectedProject.title}
              </h2>
              
              {assets.length === 0 ? (
                <p className="text-gray-500">No assets to review. Generate assets first.</p>
              ) : (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-lg">{asset.type.toUpperCase()}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAssetStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt:</label>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{asset.prompt}</p>
                      </div>
                      
                      {asset.url && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preview:</label>
                          {asset.type === 'image' ? (
                            <img src={asset.url} alt="Asset preview" className="max-w-xs rounded border" />
                          ) : (
                            <audio controls className="w-full">
                              <source src={asset.url} type="audio/mpeg" />
                            </audio>
                          )}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveAsset(asset.id)}
                          disabled={asset.status === 'approved'}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectAsset(asset.id)}
                          disabled={asset.status === 'rejected'}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Assembly Tab */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Video Assembly</h2>
              
              <div className="space-y-4">
                {projects.filter(p => p.status === 'approved').map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-gray-600">{project.theme} • {project.target_age} • {project.duration}s</p>
                      </div>
                      <button
                        onClick={() => generateVideo(project.id)}
                        disabled={loading}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? 'Generating...' : 'Generate Video'}
                      </button>
                    </div>
                  </div>
                ))}
                
                {projects.filter(p => p.status === 'approved').length === 0 && (
                  <p className="text-gray-500">No projects ready for video generation. Approve assets first.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Planning Tab */}
        {activeTab === 'planning' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Content Planning Tools</h2>
            <p className="text-gray-600 mb-6">
              Use AI-powered tools to help plan and structure your content before creating projects.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Story Concept Generator</h3>
                <p className="text-sm text-gray-600 mb-3">Generate creative story concepts based on themes and age groups.</p>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Generate Concepts
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Script Writer</h3>
                <p className="text-sm text-gray-600 mb-3">Create engaging scripts with appropriate dialogue for target age groups.</p>
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Write Script
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Scene Breakdown</h3>
                <p className="text-sm text-gray-600 mb-3">Break down stories into individual scenes with timing and requirements.</p>
                <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                  Create Breakdown
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Asset Checklist</h3>
                <p className="text-sm text-gray-600 mb-3">Generate comprehensive checklists for all required assets.</p>
                <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                  Create Checklist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 