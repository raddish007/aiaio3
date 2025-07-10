import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  global_elements: GlobalElement[];
  parts: VideoPart[];
  created_at: string;
  updated_at: string;
}

interface GlobalElement {
  id: string;
  type: 'audio' | 'image';
  asset_purpose: string;
  description: string;
  required: boolean;
  asset_type: 'class' | 'specific'; // New: class = tagged set, specific = individual asset
  asset_class?: string; // For asset classes (tags)
  specific_asset_id?: string; // For specific assets
  specific_asset_name?: string; // Display name for specific asset
}

interface VideoPart {
  id: string;
  name: string;
  type: 'intro' | 'slideshow' | 'outro' | 'custom';
  order: number;
  duration: number;
  audio_elements: AudioElement[];
  image_elements: ImageElement[];
}

interface AudioElement {
  id: string;
  asset_purpose: string;
  description: string;
  required: boolean;
  asset_type: 'class' | 'specific'; // New: class = tagged set, specific = individual asset
  asset_class?: string; // For asset classes (tags)
  specific_asset_id?: string; // For specific assets
  specific_asset_name?: string; // Display name for specific asset
}

interface ImageElement {
  id: string;
  asset_purpose: string;
  description: string;
  safe_zone: string;
  required: boolean;
  asset_type: 'class' | 'specific'; // New: class = tagged set, specific = individual asset
  asset_class?: string; // For asset classes (tags)
  specific_asset_id?: string; // For specific assets
  specific_asset_name?: string; // Display name for specific asset
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<VideoTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customTemplateType, setCustomTemplateType] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [showAssetSearch, setShowAssetSearch] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: '',
    global_elements: [] as GlobalElement[],
    parts: [] as VideoPart[]
  });

  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchTemplates();
    fetchAssets();
  }, []);

  // Close asset search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAssetSearch && !(event.target as Element).closest('.asset-search-container')) {
        setShowAssetSearch(null);
        setAssetSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAssetSearch]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
      } else {
        setAssets(data || []);
      }
    } catch (error) {
      console.error('Error in fetchAssets:', error);
    }
  };

  const getAssetClassOptions = (type: 'audio' | 'image') => {
    const options = new Set<string>();
    if (type === 'audio') {
      options.add('name_audio'); // Always include name_audio
    }
    assets.forEach(asset => {
      if (asset.type === type) {
        // Add audio_class for audio assets
        if (type === 'audio' && asset.metadata?.audio_class) {
          options.add(asset.metadata.audio_class);
        }
        // Add tags for both audio and image assets
        if (asset.tags && Array.isArray(asset.tags)) {
          asset.tags.forEach((tag: string) => options.add(tag));
        }
      }
    });
    return Array.from(options).sort();
  };

  const getSafeZoneOptions = () => {
    return [
      'left_safe',
      'right_safe', 
      'center_safe',
      'intro_safe',
      'outro_safe',
      'all_ok',
      'not_applicable',
      'frame',
      'slideshow'
    ];
  };

  const searchAssets = (searchTerm: string, type: 'audio' | 'image') => {
    if (!searchTerm.trim()) return [];
    
    return assets.filter(asset => 
      asset.type === type &&
      asset.status === 'approved' &&
      (asset.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
       asset.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
       asset.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10); // Limit to 10 results
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
    setLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('video_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
      } else {
        // Map database 'type' field to 'template_type' for frontend
        const mappedTemplates = (data || []).map(template => ({
          ...template,
          template_type: template.type // Map type to template_type
        }));
        setTemplates(mappedTemplates);
      }
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setCustomTemplateType('');
    setAssetSearchTerm('');
    setShowAssetSearch(null);
    setFormData({
      name: '',
      description: '',
      template_type: '',
      global_elements: [],
      parts: []
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: VideoTemplate) => {
    setEditingTemplate(template);
    setAssetSearchTerm('');
    setShowAssetSearch(null);
    
    // Handle custom template type
    const isCustomType = !['lullaby', 'name-video', 'letter-hunt'].includes(template.template_type);
    setCustomTemplateType(isCustomType ? template.template_type : '');
    
    setFormData({
      name: template.name,
      description: template.description,
      template_type: isCustomType ? 'custom' : template.template_type,
      global_elements: template.global_elements || [],
      parts: template.parts || []
    });
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async () => {
    const finalTemplateType = formData.template_type === 'custom' ? customTemplateType : formData.template_type;
    
    if (!formData.name || !finalTemplateType) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        type: finalTemplateType, // Map template_type to type for database
        global_elements: formData.global_elements,
        parts: formData.parts,
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('video_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('video_templates')
          .insert({
            ...templateData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      await fetchTemplates();
      setShowCreateModal(false);
      setEditingTemplate(null);
      alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('video_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTemplates();
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

  const handleGenerateVideo = async (template: VideoTemplate) => {
    const childName = prompt('Enter child name for the video:');
    if (!childName) return;

    try {
      const response = await fetch('/api/videos/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          childName,
          userId: (await supabase.auth.getUser()).data.user?.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Video generation started! Asset ID: ${result.videoAsset.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Error generating video. Please try again.');
    }
  };

  const addGlobalElement = () => {
    const newElement: GlobalElement = {
      id: `global_${Date.now()}`,
      type: 'audio',
      asset_purpose: '',
      description: '',
      required: true,
      asset_type: 'specific' // Default to specific asset
    };
    setFormData(prev => ({
      ...prev,
      global_elements: [...prev.global_elements, newElement]
    }));
  };

  const removeGlobalElement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      global_elements: prev.global_elements.filter(el => el.id !== id)
    }));
  };

  const updateGlobalElement = (id: string, field: keyof GlobalElement, value: any) => {
    setFormData(prev => ({
      ...prev,
      global_elements: prev.global_elements.map(el => 
        el.id === id ? { ...el, [field]: value } : el
      )
    }));
  };

  const addPart = () => {
    const newPart: VideoPart = {
      id: Date.now().toString(),
      name: '',
      type: 'custom',
      order: formData.parts.length + 1,
      duration: 5,
      audio_elements: [],
      image_elements: []
    };
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
  };

  const removePart = (id: string) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter(part => part.id !== id)
    }));
  };

  const updatePart = (id: string, field: keyof VideoPart, value: any) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map(part => 
        part.id === id ? { ...part, [field]: value } : part
      )
    }));
  };

  const addAudioElement = (partId: string) => {
    const newAudioElement: AudioElement = {
      id: `audio_${Date.now()}`,
      asset_purpose: '',
      description: '',
      required: true,
      asset_type: 'specific' // Default to specific asset
    };
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map(p => 
        p.id === partId 
          ? { ...p, audio_elements: [...p.audio_elements, newAudioElement] }
          : p
      )
    }));
  };

  const addImageElement = (partId: string) => {
    const newImageElement: ImageElement = {
      id: `image_${Date.now()}`,
      asset_purpose: '',
      description: '',
      safe_zone: 'center_safe',
      required: true,
      asset_type: 'specific' // Default to specific asset
    };
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map(p => 
        p.id === partId 
          ? { ...p, image_elements: [...p.image_elements, newImageElement] }
          : p
      )
    }));
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'lullaby': return '🌙';
      case 'name-video': return '📝';
      case 'letter-hunt': return '🔍';
      case 'bedtime': return '😴';
      case 'educational': return '📚';
      case 'entertainment': return '🎭';
      case 'story': return '📖';
      case 'song': return '🎵';
      case 'game': return '🎮';
      case 'dev': return '⚙️';
      case 'test': return '🧪';
      case 'custom': return '✏️';
      default: return '🎬';
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
            <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/template-audio')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Audio Templates
              </button>
              <button
                onClick={() => router.push('/admin/template-images')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                Image Templates
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Create Video Template
          </button>
        </div>

        {/* Template List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTemplateIcon(template.template_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.template_type}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleGenerateVideo(template)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Generate Video
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {template.description && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Global Elements: {template.global_elements?.length || 0}</span>
                    <span>Parts: {template.parts?.length || 0}</span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No video templates yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first video template to get started.
            </p>
            <button
              onClick={handleCreateTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Your First Template
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Video Template' : 'Create Video Template'}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Lullaby Video Template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Type *</label>
                    <select
                      value={formData.template_type}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, template_type: value }));
                        if (value !== 'custom') {
                          setCustomTemplateType('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select template type...</option>
                      <option value="lullaby">🌙 Lullaby</option>
                      <option value="name-video">📝 Name Video</option>
                      <option value="letter-hunt">🔍 Letter Hunt</option>
                      <option value="bedtime">😴 Bedtime</option>
                      <option value="educational">📚 Educational</option>
                      <option value="entertainment">🎭 Entertainment</option>
                      <option value="story">📖 Story</option>
                      <option value="song">🎵 Song</option>
                      <option value="game">🎮 Game</option>
                      <option value="dev">⚙️ Development</option>
                      <option value="test">🧪 Test</option>
                      <option value="custom">✏️ Custom (with text box)</option>
                    </select>
                  </div>

                  {formData.template_type === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Template Type *</label>
                      <input
                        type="text"
                        value={customTemplateType}
                        onChange={(e) => setCustomTemplateType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., educational, story-time, music-video"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe the purpose of this video template..."
                  />
                </div>

                {/* Global Elements */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Global Elements</h4>
                    <button
                      onClick={addGlobalElement}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                    >
                      + Add Element
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.global_elements.map((element) => (
                      <div key={element.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-900">Global Element</h5>
                          <button
                            onClick={() => removeGlobalElement(element.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={element.type}
                              onChange={(e) => updateGlobalElement(element.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="audio">Audio</option>
                              <option value="image">Image</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Purpose</label>
                            <input
                              type="text"
                              value={element.asset_purpose}
                              onChange={(e) => updateGlobalElement(element.id, 'asset_purpose', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., background_music"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={element.description}
                            onChange={(e) => updateGlobalElement(element.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe this global element..."
                          />
                        </div>

                        <div className="mt-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={element.required}
                              onChange={(e) => updateGlobalElement(element.id, 'required', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>

                        {/* Asset Type and Selection */}
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                          <select
                            value={element.asset_type}
                            onChange={(e) => updateGlobalElement(element.id, 'asset_type', e.target.value as 'class' | 'specific')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="specific">Specific Asset</option>
                            <option value="class">Asset Class (Tagged Set)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {element.asset_type === 'specific' 
                              ? 'Specific Asset: Choose a particular asset file (e.g., "My Background Music")'
                              : 'Asset Class: Use any asset with a specific tag (e.g., "background_music_class")'
                            }
                          </p>
                        </div>

                        {element.asset_type === 'class' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Class</label>
                            <select
                              value={element.asset_class || ''}
                              onChange={(e) => updateGlobalElement(element.id, 'asset_class', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select asset class...</option>
                              {getAssetClassOptions(element.type).map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Available classes from existing {element.type} assets
                            </p>
                          </div>
                        )}

                        {element.asset_type === 'specific' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search and Select Asset</label>
                            <div className="relative asset-search-container">
                              <input
                                type="text"
                                value={assetSearchTerm}
                                onChange={(e) => setAssetSearchTerm(e.target.value)}
                                onFocus={() => setShowAssetSearch(element.id)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Search ${element.type} assets...`}
                              />
                              
                              {showAssetSearch === element.id && assetSearchTerm && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {searchAssets(assetSearchTerm, element.type).map(asset => (
                                    <div
                                      key={asset.id}
                                      onClick={() => {
                                        updateGlobalElement(element.id, 'specific_asset_id', asset.id);
                                        updateGlobalElement(element.id, 'specific_asset_name', asset.theme);
                                        setAssetSearchTerm('');
                                        setShowAssetSearch(null);
                                      }}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-sm">{asset.theme}</div>
                                      <div className="text-xs text-gray-500">
                                        {asset.tags?.slice(0, 3).join(', ')}
                                      </div>
                                    </div>
                                  ))}
                                  {searchAssets(assetSearchTerm, element.type).length === 0 && (
                                    <div className="px-3 py-2 text-gray-500 text-sm">
                                      No assets found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {element.specific_asset_name && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <div className="text-sm font-medium text-green-800">
                                  Selected: {element.specific_asset_name}
                                </div>
                                <button
                                  onClick={() => {
                                    updateGlobalElement(element.id, 'specific_asset_id', '');
                                    updateGlobalElement(element.id, 'specific_asset_name', '');
                                  }}
                                  className="text-xs text-green-600 hover:text-green-800 mt-1"
                                >
                                  Clear selection
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Parts */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Video Parts</h4>
                    <button
                      onClick={addPart}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                    >
                      + Add Part
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.parts.map((part) => (
                      <div key={part.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-900">Video Part</h5>
                          <button
                            onClick={() => removePart(part.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={part.name}
                              onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Intro"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={part.type}
                              onChange={(e) => updatePart(part.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="intro">Intro</option>
                              <option value="slideshow">Slideshow</option>
                              <option value="outro">Outro</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <input
                              type="number"
                              value={part.order}
                              onChange={(e) => updatePart(part.id, 'order', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (sec)</label>
                            <input
                              type="number"
                              value={part.duration}
                              onChange={(e) => updatePart(part.id, 'duration', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                        </div>

                        {/* Audio Elements */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-medium text-gray-700">Audio Elements</h6>
                            <button
                              onClick={() => addAudioElement(part.id)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              + Add Audio
                            </button>
                          </div>

                          <div className="space-y-2">
                            {part.audio_elements.map((audio) => (
                              <div key={audio.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={audio.asset_purpose}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                a.id === audio.id ? { ...a, asset_purpose: e.target.value } : a
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Asset purpose"
                                  />
                                  <input
                                    type="text"
                                    value={audio.description}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                a.id === audio.id ? { ...a, description: e.target.value } : a
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Description"
                                  />
                                </div>

                                {/* Asset Type Selection */}
                                <div className="mb-2">
                                  <select
                                    value={audio.asset_type}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                a.id === audio.id ? { ...a, asset_type: e.target.value as 'class' | 'specific' } : a
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="specific">Specific Asset</option>
                                    <option value="class">Asset Class (Tagged Set)</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {audio.asset_type === 'specific' 
                                      ? 'Specific Asset: Choose a particular audio file'
                                      : 'Asset Class: Use any audio with a specific tag'
                                    }
                                  </p>
                                </div>

                                {/* Asset Class or Specific Asset */}
                                {audio.asset_type === 'class' && (
                                  <div className="mb-2">
                                    <select
                                      value={audio.asset_class || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          parts: prev.parts.map(p => 
                                            p.id === part.id 
                                              ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                  a.id === audio.id ? { ...a, asset_class: e.target.value } : a
                                                )}
                                              : p
                                          )
                                        }));
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select audio class...</option>
                                      {getAssetClassOptions('audio').map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {audio.asset_type === 'specific' && (
                                  <div className="mb-2">
                                    <div className="relative asset-search-container">
                                      <input
                                        type="text"
                                        value={assetSearchTerm}
                                        onChange={(e) => setAssetSearchTerm(e.target.value)}
                                        onFocus={() => setShowAssetSearch(`audio_${audio.id}`)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Search audio assets..."
                                      />
                                      
                                      {showAssetSearch === `audio_${audio.id}` && assetSearchTerm && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                          {searchAssets(assetSearchTerm, 'audio').map(asset => (
                                            <div
                                              key={asset.id}
                                              onClick={() => {
                                                setFormData(prev => ({
                                                  ...prev,
                                                  parts: prev.parts.map(p => 
                                                    p.id === part.id 
                                                      ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                          a.id === audio.id ? { 
                                                            ...a, 
                                                            specific_asset_id: asset.id,
                                                            specific_asset_name: asset.theme 
                                                          } : a
                                                        )}
                                                      : p
                                                  )
                                                }));
                                                setAssetSearchTerm('');
                                                setShowAssetSearch(null);
                                              }}
                                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                              <div className="font-medium text-sm">{asset.theme}</div>
                                              <div className="text-xs text-gray-500">
                                                {asset.tags?.slice(0, 3).join(', ')}
                                              </div>
                                            </div>
                                          ))}
                                          {searchAssets(assetSearchTerm, 'audio').length === 0 && (
                                            <div className="px-3 py-2 text-gray-500 text-sm">
                                              No audio assets found
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {audio.specific_asset_name && (
                                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                        <div className="text-sm font-medium text-green-800">
                                          Selected: {audio.specific_asset_name}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setFormData(prev => ({
                                              ...prev,
                                              parts: prev.parts.map(p => 
                                                p.id === part.id 
                                                  ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                      a.id === audio.id ? { 
                                                        ...a, 
                                                        specific_asset_id: '',
                                                        specific_asset_name: '' 
                                                      } : a
                                                    )}
                                                  : p
                                              )
                                            }));
                                          }}
                                          className="text-xs text-green-600 hover:text-green-800 mt-1"
                                        >
                                          Clear selection
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="checkbox"
                                      checked={audio.required}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          parts: prev.parts.map(p => 
                                            p.id === part.id 
                                              ? { ...p, audio_elements: p.audio_elements.map(a => 
                                                  a.id === audio.id ? { ...a, required: e.target.checked } : a
                                                )}
                                              : p
                                          )
                                        }));
                                      }}
                                      className="mr-1"
                                    />
                                    Required
                                  </label>
                                  <button
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, audio_elements: p.audio_elements.filter(a => a.id !== audio.id) }
                                            : p
                                        )
                                      }));
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Image Elements */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-medium text-gray-700">Image Elements</h6>
                            <button
                              onClick={() => addImageElement(part.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              + Add Image
                            </button>
                          </div>

                          <div className="space-y-2">
                            {part.image_elements.map((image) => (
                              <div key={image.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={image.asset_purpose}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, image_elements: p.image_elements.map(i => 
                                                i.id === image.id ? { ...i, asset_purpose: e.target.value } : i
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Asset purpose"
                                  />
                                  <input
                                    type="text"
                                    value={image.description}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, image_elements: p.image_elements.map(i => 
                                                i.id === image.id ? { ...i, description: e.target.value } : i
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Description"
                                  />
                                </div>

                                {/* Asset Type Selection */}
                                <div className="mb-2">
                                  <select
                                    value={image.asset_type}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, image_elements: p.image_elements.map(i => 
                                                i.id === image.id ? { ...i, asset_type: e.target.value as 'class' | 'specific' } : i
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="specific">Specific Asset</option>
                                    <option value="class">Asset Class (Tagged Set)</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {image.asset_type === 'specific' 
                                      ? 'Specific Asset: Choose a particular image file'
                                      : 'Asset Class: Use any image with a specific tag'
                                    }
                                  </p>
                                </div>

                                {/* Asset Class or Specific Asset */}
                                {image.asset_type === 'class' && (
                                  <div className="mb-2">
                                    <select
                                      value={image.asset_class || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          parts: prev.parts.map(p => 
                                            p.id === part.id 
                                              ? { ...p, image_elements: p.image_elements.map(i => 
                                                  i.id === image.id ? { ...i, asset_class: e.target.value } : i
                                                )}
                                              : p
                                          )
                                        }));
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select image class...</option>
                                      {getAssetClassOptions('image').map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {image.asset_type === 'specific' && (
                                  <div className="mb-2">
                                    <div className="relative asset-search-container">
                                      <input
                                        type="text"
                                        value={assetSearchTerm}
                                        onChange={(e) => setAssetSearchTerm(e.target.value)}
                                        onFocus={() => setShowAssetSearch(`image_${image.id}`)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Search image assets..."
                                      />
                                      
                                      {showAssetSearch === `image_${image.id}` && assetSearchTerm && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                          {searchAssets(assetSearchTerm, 'image').map(asset => (
                                            <div
                                              key={asset.id}
                                              onClick={() => {
                                                setFormData(prev => ({
                                                  ...prev,
                                                  parts: prev.parts.map(p => 
                                                    p.id === part.id 
                                                      ? { ...p, image_elements: p.image_elements.map(i => 
                                                          i.id === image.id ? { 
                                                            ...i, 
                                                            specific_asset_id: asset.id,
                                                            specific_asset_name: asset.theme 
                                                          } : i
                                                        )}
                                                      : p
                                                  )
                                                }));
                                                setAssetSearchTerm('');
                                                setShowAssetSearch(null);
                                              }}
                                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                              <div className="font-medium text-sm">{asset.theme}</div>
                                              <div className="text-xs text-gray-500">
                                                {asset.tags?.slice(0, 3).join(', ')}
                                              </div>
                                            </div>
                                          ))}
                                          {searchAssets(assetSearchTerm, 'image').length === 0 && (
                                            <div className="px-3 py-2 text-gray-500 text-sm">
                                              No image assets found
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {image.specific_asset_name && (
                                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                        <div className="text-sm font-medium text-green-800">
                                          Selected: {image.specific_asset_name}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setFormData(prev => ({
                                              ...prev,
                                              parts: prev.parts.map(p => 
                                                p.id === part.id 
                                                  ? { ...p, image_elements: p.image_elements.map(i => 
                                                      i.id === image.id ? { 
                                                        ...i, 
                                                        specific_asset_id: '',
                                                        specific_asset_name: '' 
                                                      } : i
                                                    )}
                                                  : p
                                              )
                                            }));
                                          }}
                                          className="text-xs text-green-600 hover:text-green-800 mt-1"
                                        >
                                          Clear selection
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <select
                                    value={image.safe_zone}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, image_elements: p.image_elements.map(i => 
                                                i.id === image.id ? { ...i, safe_zone: e.target.value } : i
                                              )}
                                            : p
                                        )
                                      }));
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    {getSafeZoneOptions().map(option => (
                                      <option key={option} value={option}>
                                        {option.replace('_', ' ').toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center justify-between">
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="checkbox"
                                      checked={image.required}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          parts: prev.parts.map(p => 
                                            p.id === part.id 
                                              ? { ...p, image_elements: p.image_elements.map(i => 
                                                  i.id === image.id ? { ...i, required: e.target.checked } : i
                                                )}
                                              : p
                                          )
                                        }));
                                      }}
                                      className="mr-1"
                                    />
                                    Required
                                  </label>
                                  <button
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        parts: prev.parts.map(p => 
                                          p.id === part.id 
                                            ? { ...p, image_elements: p.image_elements.filter(i => i.id !== image.id) }
                                            : p
                                        )
                                      }));
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 