import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

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
  created_at: string;
  updated_at: string;
}

export default function TemplateAudioManagement() {
  const [templateAudios, setTemplateAudios] = useState<TemplateAudio[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    template_type: '',
    asset_purpose: '',
    custom_asset_purpose: '',
    script: '',
    voice_id: '248nvfaZe8BXhKntjmpp',
    speed: 0.8,
    description: '',
    tags: ''
  });

  const [showCustomPurpose, setShowCustomPurpose] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchTemplateAudios();
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

  const fetchTemplateAudios = async () => {
    try {
      const { data, error } = await supabase
        .from('template_audio_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching template audios:', error);
      } else {
        setTemplateAudios(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTemplateAudios:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      template_type: '',
      asset_purpose: '',
      custom_asset_purpose: '',
      script: '',
      voice_id: '248nvfaZe8BXhKntjmpp',
      speed: 0.8,
      description: '',
      tags: ''
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: TemplateAudio) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      asset_purpose: template.asset_purpose,
      custom_asset_purpose: template.asset_purpose, // Initialize custom_asset_purpose
      script: template.script,
      voice_id: template.voice_id,
      speed: template.speed,
      description: template.description || '',
      tags: template.tags ? template.tags.join(', ') : ''
    });
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async () => {
    const finalAssetPurpose = formData.asset_purpose === 'custom' ? formData.custom_asset_purpose : formData.asset_purpose;
    
    if (!formData.name || !formData.template_type || !finalAssetPurpose || !formData.script) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: formData.name,
        template_type: formData.template_type,
        asset_purpose: finalAssetPurpose,
        script: formData.script,
        voice_id: formData.voice_id,
        speed: formData.speed,
        description: formData.description || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('template_audio_scripts')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('template_audio_scripts')
          .insert({
            ...templateData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      await fetchTemplateAudios();
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
        .from('template_audio_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTemplateAudios();
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'lullaby': return '🌙';
      case 'name-video': return '📝';
      case 'letter-hunt': return '🔍';
      default: return '🎬';
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'intro_audio': return 'Intro Audio';
      case 'outro_audio': return 'Outro Audio';
      case 'background_music': return 'Background Music';
      case 'voice_narration': return 'Voice Narration';
      case 'sound_effect': return 'Sound Effect';
      default: return purpose;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Template Audio" 
        subtitle="Manage reusable audio templates"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Buttons */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push('/admin/audio-generator')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Audio Generator
          </button>
        </div>
        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Create Template Audio
          </button>
        </div>

        {/* Template List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateAudios.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTemplateIcon(template.template_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">
                        {template.template_type} • {getPurposeLabel(template.asset_purpose)}
                      </p>
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
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Script</label>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                      {template.script}
                    </p>
                  </div>

                  {template.description && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Voice: {template.voice_id}</span>
                    <span>Speed: {template.speed}x</span>
                  </div>

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templateAudios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No template audio scripts yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first template audio script to get started.
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template Audio' : 'Create Template Audio'}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Lullaby Intro - Goodnight"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Type *</label>
                    <select
                      value={formData.template_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select template type...</option>
                      <option value="lullaby">Lullaby</option>
                      <option value="name-video">Name Video</option>
                      <option value="letter-hunt">Letter Hunt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset Purpose *</label>
                    <select
                      value={formData.asset_purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, asset_purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select purpose...</option>
                      <option value="intro_audio">Intro Audio</option>
                      <option value="outro_audio">Outro Audio</option>
                      <option value="background_music">Background Music</option>
                      <option value="voice_narration">Voice Narration</option>
                      <option value="sound_effect">Sound Effect</option>
                      <option value="custom">New Asset Purpose</option>
                    </select>
                  </div>
                </div>

                {formData.asset_purpose === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Asset Purpose *</label>
                    <input
                      type="text"
                      value={formData.custom_asset_purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_asset_purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Custom Background Music, Custom Sound Effect"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Script *</label>
                  <textarea
                    value={formData.script}
                    onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter the script for this template audio..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use [NAME] as a placeholder for the child's name
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voice ID</label>
                    <select
                      value={formData.voice_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, voice_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="248nvfaZe8BXhKntjmpp">Murph (Default)</option>
                      <option value="voice_id_2">Voice 2</option>
                      <option value="voice_id_3">Voice 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speed: {formData.speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={formData.speed}
                      onChange={(e) => setFormData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Optional description of this template..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className={`px-4 py-2 text-white rounded-md ${
                    saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 