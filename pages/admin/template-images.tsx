import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

interface TemplateImage {
  id: string;
  name: string;
  template_type: string;
  asset_purpose: string;
  description?: string;
  safe_zone: string;
  default_prompt?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function TemplateImageManagement() {
  const [templateImages, setTemplateImages] = useState<TemplateImage[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    template_type: '',
    asset_purpose: '',
    custom_asset_purpose: '',
    description: '',
    safe_zone: 'center_safe',
    default_prompt: '',
    tags: ''
  });

  const [showCustomPurpose, setShowCustomPurpose] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    fetchTemplateImages();
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

  const fetchTemplateImages = async () => {
    try {
      const { data, error } = await supabase
        .from('template_image_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching template images:', error);
      } else {
        setTemplateImages(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTemplateImages:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      template_type: '',
      asset_purpose: '',
      custom_asset_purpose: '',
      description: '',
      safe_zone: 'center_safe',
      default_prompt: '',
      tags: ''
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: TemplateImage) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      asset_purpose: template.asset_purpose,
      custom_asset_purpose: template.asset_purpose,
      description: template.description || '',
      safe_zone: template.safe_zone,
      default_prompt: template.default_prompt || '',
      tags: template.tags ? template.tags.join(', ') : ''
    });
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async () => {
    const finalAssetPurpose = formData.asset_purpose === 'custom' ? formData.custom_asset_purpose : formData.asset_purpose;
    
    if (!formData.name || !formData.template_type || !finalAssetPurpose) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: formData.name,
        template_type: formData.template_type,
        asset_purpose: finalAssetPurpose,
        description: formData.description || null,
        safe_zone: formData.safe_zone,
        default_prompt: formData.default_prompt || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('template_image_scripts')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('template_image_scripts')
          .insert({
            ...templateData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      await fetchTemplateImages();
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
        .from('template_image_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTemplateImages();
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
      case 'intro_background': return 'Intro Background';
      case 'slideshow_image': return 'Slideshow Image';
      case 'outro_background': return 'Outro Background';
      case 'character_image': return 'Character Image';
      case 'scene_background': return 'Scene Background';
      default: return purpose;
    }
  };

  const getSafeZoneLabel = (safeZone: string) => {
    switch (safeZone) {
      case 'intro_safe': return 'Intro Safe Zone';
      case 'center_safe': return 'Center Safe Zone';
      case 'outro_safe': return 'Outro Safe Zone';
      case 'all_ok': return 'All Areas OK';
      case 'not_applicable': return 'Not Applicable';
      default: return safeZone;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Template Images" 
        subtitle="Manage reusable image templates"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Buttons */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push('/admin/ai-generator')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Image Generator
          </button>
        </div>
        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Create Template Image
          </button>
        </div>

        {/* Template List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateImages.map((template) => (
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
                  {template.description && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Safe Zone</label>
                    <p className="text-sm text-gray-700 mt-1">{getSafeZoneLabel(template.safe_zone)}</p>
                  </div>

                  {template.default_prompt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Default Prompt</label>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                        {template.default_prompt}
                      </p>
                    </div>
                  )}

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

        {templateImages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No template image scripts yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first template image script to get started.
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
                  {editingTemplate ? 'Edit Template Image' : 'Create Template Image'}
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
                    placeholder="e.g., Lullaby Intro Background"
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
                      <option value="intro_background">Intro Background</option>
                      <option value="slideshow_image">Slideshow Image</option>
                      <option value="outro_background">Outro Background</option>
                      <option value="character_image">Character Image</option>
                      <option value="scene_background">Scene Background</option>
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
                      placeholder="e.g., Custom Background, Custom Character"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe the purpose of this image template..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zone *</label>
                  <select
                    value={formData.safe_zone}
                    onChange={(e) => setFormData(prev => ({ ...prev, safe_zone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="intro_safe">Intro Safe Zone</option>
                    <option value="center_safe">Center Safe Zone</option>
                    <option value="outro_safe">Outro Safe Zone</option>
                    <option value="all_ok">All Areas OK</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Prompt</label>
                  <textarea
                    value={formData.default_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Default AI prompt for generating this type of image..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="bedtime, calm, peaceful (comma separated)"
                  />
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