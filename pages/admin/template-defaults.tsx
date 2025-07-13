import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

interface TemplateDefault {
  id: string;
  template_type: string;
  personalization_level: string;
  default_title: string;
  default_description: string;
  default_parent_tip: string;
  default_display_image_url: string;
  default_display_image_class?: string;
  created_at: string;
  updated_at: string;
}

interface ImageAsset {
  id: string;
  theme: string;
  file_url: string;
  metadata?: {
    template?: string;
  };
}

export default function TemplateDefaults() {
  const [templateDefaults, setTemplateDefaults] = useState<TemplateDefault[]>([]);
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    template_type: '',
    personalization_level: '',
    default_title: '',
    default_description: '',
    default_parent_tip: '',
    default_display_image_url: '',
    default_display_image_class: ''
  });

  useEffect(() => {
    fetchTemplateDefaults();
    fetchImageAssets();
  }, []);

  const fetchTemplateDefaults = async () => {
    try {
      const { data, error } = await supabase
        .from('template_defaults')
        .select('*')
        .order('template_type, personalization_level');

      if (error) throw error;
      setTemplateDefaults(data || []);
    } catch (error) {
      console.error('Error fetching template defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImageAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, theme, file_url, metadata')
        .eq('type', 'image')
        .eq('status', 'approved')
        .order('theme');

      if (error) throw error;
      setImageAssets(data || []);
    } catch (error) {
      console.error('Error fetching image assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('template_defaults')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        alert('Template default updated successfully!');
      } else {
        const { error } = await supabase
          .from('template_defaults')
          .insert([formData]);

        if (error) throw error;
        alert('Template default created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchTemplateDefaults();
    } catch (error) {
      console.error('Error saving template default:', error);
      alert('Error saving template default. Please try again.');
    }
  };

  const handleEdit = (template: TemplateDefault) => {
    setFormData({
      template_type: template.template_type,
      personalization_level: template.personalization_level,
      default_title: template.default_title,
      default_description: template.default_description,
      default_parent_tip: template.default_parent_tip,
      default_display_image_url: template.default_display_image_url,
      default_display_image_class: template.default_display_image_class || ''
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template default?')) return;

    try {
      const { error } = await supabase
        .from('template_defaults')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Template default deleted successfully!');
      fetchTemplateDefaults();
    } catch (error) {
      console.error('Error deleting template default:', error);
      alert('Error deleting template default. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      template_type: '',
      personalization_level: '',
      default_title: '',
      default_description: '',
      default_parent_tip: '',
      default_display_image_url: '',
      default_display_image_class: ''
    });
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case 'lullaby': return '🌙';
      case 'name-video': return '📝';
      case 'letter-hunt': return '🔍';
      default: return '🎬';
    }
  };

  const getPersonalizationLabel = (level: string) => {
    switch (level) {
      case 'generic': return 'Generic (All Children)';
      case 'theme': return 'Theme-Specific';
      case 'child': return 'Child-Specific';
      default: return level;
    }
  };

  // Function to process template with variables for preview
  const processTemplate = (template: string, variables: Record<string, string> = {}) => {
    return template.replace(/\{(\w+)\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  };

  // Add asset class options for Letter Hunt
  const LETTER_HUNT_ASSET_CLASSES = [
    { value: 'titleCard', label: 'Title Card' },
    { value: 'signImage', label: 'Sign Image' },
    { value: 'bookImage', label: 'Book Image' },
    { value: 'groceryImage', label: 'Grocery Image' },
    { value: 'endingImage', label: 'Ending Image' },
  ];

  // Sample images for preview (these are just for admin UI preview, not real data)
  const SAMPLE_LULLABY_IMAGES = [
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193322_kj0do0rpe.png',
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193322_vy6kg3c9j.png',
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193322_tmtztwy5f.png',
  ];
  const SAMPLE_NAMEVIDEO_IMAGES = [
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_tqu9kxu47.png',
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_07m3d64cx.png',
    'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053331_c4t2b0skf.png',
  ];

  function getSampleDisplayImage(template: TemplateDefault) {
    if (template.template_type === 'lullaby') {
      // Pick a random sample lullaby image
      return SAMPLE_LULLABY_IMAGES[Math.floor(Math.random() * SAMPLE_LULLABY_IMAGES.length)];
    }
    if (template.template_type === 'name-video') {
      // Pick a random sample name video image
      return SAMPLE_NAMEVIDEO_IMAGES[Math.floor(Math.random() * SAMPLE_NAMEVIDEO_IMAGES.length)];
    }
    // For letter-hunt and others, use the static URL if present
    return template.default_display_image_url || '';
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Template Defaults" subtitle="Manage default metadata and parent tips for video templates" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Template Defaults</h1>
          <p className="text-gray-600">
            Manage default metadata and parent tips for video templates with variable substitution.
          </p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + Create Template Default
          </button>
        </div>

        {/* Template Defaults List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateDefaults.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTemplateIcon(template.template_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {template.template_type.replace('-', ' ')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getPersonalizationLabel(template.personalization_level)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Preview with sample variables */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Title Preview:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {processTemplate(template.default_title, { NAME: 'Emma', LETTER: 'A' })}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Description Preview:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {processTemplate(template.default_description, { NAME: 'Emma', LETTER: 'A' })}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Parent Tip Preview:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {processTemplate(template.default_parent_tip, { NAME: 'Emma', LETTER: 'A' })}
                    </p>
                  </div>

                  {(template.template_type === 'lullaby' || template.template_type === 'name-video') ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Display Image (Sample):</h4>
                      <img
                        src={getSampleDisplayImage(template)}
                        alt="Sample Display"
                        className="w-full h-32 object-cover rounded"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        A random image from the video will be used as the display image for this template type.
                      </div>
                    </div>
                  ) : template.default_display_image_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Display Image:</h4>
                      <img
                        src={template.default_display_image_url}
                        alt="Display"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Template Default' : 'Create Template Default'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template Type *</label>
                      <select
                        value={formData.template_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select template type...</option>
                        <option value="lullaby">Lullaby</option>
                        <option value="name-video">Name Video</option>
                        <option value="letter-hunt">Letter Hunt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personalization Level *</label>
                      <select
                        value={formData.personalization_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, personalization_level: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select level...</option>
                        <option value="generic">Generic (All Children)</option>
                        <option value="theme">Theme-Specific</option>
                        <option value="child">Child-Specific</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Title * (Use {`{NAME}`}, {`{LETTER}`} for variables)
                    </label>
                    <input
                      type="text"
                      value={formData.default_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Learning the Letter {LETTER} with {NAME}"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Description * (Use {`{NAME}`}, {`{LETTER}`} for variables)
                    </label>
                    <textarea
                      value={formData.default_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="e.g., Join {NAME} on an exciting adventure to learn the letter {LETTER}!"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Parent Tip * (Use {`{NAME}`}, {`{LETTER}`} for variables)
                    </label>
                    <textarea
                      value={formData.default_parent_tip}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_parent_tip: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="e.g., Practice the letter {LETTER} sound with {NAME} throughout the day!"
                      required
                    />
                  </div>

                  {formData.template_type === 'letter-hunt' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Display Image Asset Class
                      </label>
                      <select
                        value={formData.default_display_image_class || ''}
                        onChange={e => setFormData(prev => ({ ...prev, default_display_image_class: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select asset class...</option>
                        {LETTER_HUNT_ASSET_CLASSES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {formData.default_display_image_class && (
                        <div className="mt-2 text-xs text-gray-500">
                          This will use the video’s own asset for the selected class (e.g., the Title Card generated for each video).
                        </div>
                      )}
                    </div>
                  ) : formData.template_type === 'lullaby' ? (
                    <div className="text-blue-700 text-sm bg-blue-50 rounded p-2">
                      A random image matching the video’s theme and safe zone <b>all_ok</b> will be used as the display image.
                    </div>
                  ) : formData.template_type === 'name-video' ? (
                    <div className="text-blue-700 text-sm bg-blue-50 rounded p-2">
                      A random image matching the video’s theme and safe zone <b>left_safe</b> will be used as the display image.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Display Image
                      </label>
                      <select
                        value={formData.default_display_image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, default_display_image_url: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an image...</option>
                        {imageAssets.map((asset) => (
                          <option key={asset.id} value={asset.file_url}>
                            {asset.theme} ({asset.metadata?.template || 'no template'})
                          </option>
                        ))}
                      </select>
                      {formData.default_display_image_url && (
                        <div className="mt-2">
                          <img 
                            src={formData.default_display_image_url} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Preview (with sample data):</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Title:</strong> {processTemplate(formData.default_title, { NAME: 'Emma', LETTER: 'A' })}
                      </div>
                      <div>
                        <strong>Description:</strong> {processTemplate(formData.default_description, { NAME: 'Emma', LETTER: 'A' })}
                      </div>
                      <div>
                        <strong>Parent Tip:</strong> {processTemplate(formData.default_parent_tip, { NAME: 'Emma', LETTER: 'A' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 