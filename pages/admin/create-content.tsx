import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface VideoTemplate {
  id: string;
  name: string;
  template_type: string;
  description?: string;
  global_elements?: any[];
  parts?: any[];
  structure?: any;
  created_at: string;
}

interface Asset {
  id: string;
  theme: string;
  type: 'image' | 'audio' | 'video' | 'prompt';
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  metadata?: {
    duration?: number;
    audio_class?: string;
    template_context?: {
      template_type?: string;
      asset_purpose?: string;
    };
  };
}

interface AssetValidation {
  required: string;
  available: Asset | null;
  missing: boolean;
}

export default function CreateContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [assetValidation, setAssetValidation] = useState<AssetValidation[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      validateAssets();
    }
  }, [selectedTemplate]);

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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('video_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates');
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const validateAssets = async () => {
    if (!selectedTemplate) return;

    try {
      const requiredAssets: AssetValidation[] = [];

      // Check global elements
      if (selectedTemplate.global_elements) {
        for (const element of selectedTemplate.global_elements) {
          if (element.asset_type === 'specific' && element.specific_asset_id) {
            // Check specific asset
            const { data: asset } = await supabase
              .from('assets')
              .select('*')
              .eq('id', element.specific_asset_id)
              .eq('status', 'approved')
              .single();

            requiredAssets.push({
              required: element.description || `Asset ${element.specific_asset_id}`,
              available: asset,
              missing: !asset
            });
          } else if (element.asset_type === 'class' && element.asset_class) {
            // Check for any approved asset with this class
            const { data: assets } = await supabase
              .from('assets')
              .select('*')
              .eq('type', 'audio')
              .eq('status', 'approved')
              .eq('metadata->audio_class', element.asset_class)
              .order('created_at', { ascending: false })
              .limit(1);

            requiredAssets.push({
              required: `${element.asset_class} (${element.description || 'any approved asset'})`,
              available: assets?.[0] || null,
              missing: !assets || assets.length === 0
            });
          }
        }
      }

      // Check parts (if any)
      if (selectedTemplate.parts) {
        for (const part of selectedTemplate.parts) {
          if (part.required_assets) {
            for (const assetReq of part.required_assets) {
              if (assetReq.asset_type === 'specific' && assetReq.specific_asset_id) {
                const { data: asset } = await supabase
                  .from('assets')
                  .select('*')
                  .eq('id', assetReq.specific_asset_id)
                  .eq('status', 'approved')
                  .single();

                requiredAssets.push({
                  required: assetReq.description || `Part asset ${assetReq.specific_asset_id}`,
                  available: asset,
                  missing: !asset
                });
              } else if (assetReq.asset_type === 'class' && assetReq.asset_class) {
                const { data: assets } = await supabase
                  .from('assets')
                  .select('*')
                  .eq('type', 'audio')
                  .eq('status', 'approved')
                  .eq('metadata->audio_class', assetReq.asset_class)
                  .order('created_at', { ascending: false })
                  .limit(1);

                requiredAssets.push({
                  required: `${assetReq.asset_class} (${assetReq.description || 'any approved asset'})`,
                  available: assets?.[0] || null,
                  missing: !assets || assets.length === 0
                });
              }
            }
          }
        }
      }

      setAssetValidation(requiredAssets);
    } catch (error) {
      console.error('Error validating assets:', error);
      setError('Failed to validate assets');
    }
  };

  const generateVideo = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare asset references
      const assetReferences = assetValidation
        .filter(validation => validation.available)
        .map(validation => ({
          asset_id: validation.available!.id,
          purpose: validation.required
        }));

      // Submit to video generation API
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          assets: assetReferences,
          submitted_by: user.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Video generation job submitted successfully! Job ID: ${result.job_id || 'N/A'}`);
        // Reset form
        setSelectedTemplate(null);
        setAssetValidation([]);
      } else {
        setError(result.error || 'Failed to submit video generation job');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setError('Failed to submit video generation job');
    } finally {
      setGenerating(false);
    }
  };

  const hasAllRequiredAssets = assetValidation.length > 0 && !assetValidation.some(validation => validation.missing);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Content</h1>
            <p className="text-gray-600">Generate videos using available templates and assets</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Step 1: Template Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Select Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{template.template_type}</p>
                  {template.description && (
                    <p className="text-sm text-gray-500">{template.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Asset Validation */}
          {selectedTemplate && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Asset Validation</h2>
              
              {assetValidation.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">No required assets found for this template.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assetValidation.map((validation, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        validation.missing
                          ? 'border-red-200 bg-red-50'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{validation.required}</p>
                          {validation.available && (
                            <p className="text-sm text-gray-600">
                              Available: {validation.available.theme}
                              {validation.available.metadata?.duration && (
                                <span className="ml-2 text-gray-500">
                                  ({validation.available.metadata.duration.toFixed(1)}s)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {validation.missing ? (
                            <span className="text-red-600 text-sm font-medium">Missing</span>
                          ) : (
                            <span className="text-green-600 text-sm font-medium">✓ Available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Generate Video */}
          {selectedTemplate && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Generate Video</h2>
              
              {hasAllRequiredAssets ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 mb-4">
                    All required assets are available. Ready to generate video.
                  </p>
                  <button
                    onClick={generateVideo}
                    disabled={generating}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Generating...' : 'Generate Video'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    Cannot generate video: Some required assets are missing. Please ensure all required assets are available and approved.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Template Details */}
          {selectedTemplate && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Template Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>ID:</strong> {selectedTemplate.id}</p>
                <p><strong>Type:</strong> {selectedTemplate.template_type}</p>
                <p><strong>Created:</strong> {new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
                {selectedTemplate.global_elements && (
                  <p><strong>Global Elements:</strong> {selectedTemplate.global_elements.length}</p>
                )}
                {selectedTemplate.parts && (
                  <p><strong>Parts:</strong> {selectedTemplate.parts.length}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 