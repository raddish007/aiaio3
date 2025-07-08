import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface PromptGeneratorForm {
  childName: string;
  theme: string;
  ageRange: string;
  template: 'lullaby' | 'name-video';
  personalization: 'general' | 'personalized';
  safeZones: string[];
  promptCount: number;
  aspectRatio: '16:9' | '9:16';
  artStyle: string;
  customArtStyle: string;
  additionalContext: string;
}

interface GeneratedPrompts {
  [safeZone: string]: {
    images: string[];
    metadata: {
      template: string;
      safeZone: string;
      theme: string;
      ageRange: string;
      aspectRatio: string;
      artStyle: string;
      generatedAt: string;
    };
  };
}

export default function PromptGeneratorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<PromptGeneratorForm>({
    childName: '',
    theme: '',
    ageRange: '2-4',
    template: 'name-video',
    personalization: 'general',
    safeZones: ['center_safe'],
    promptCount: 3,
    aspectRatio: '16:9',
    artStyle: '2D Pixar Style',
    customArtStyle: '',
    additionalContext: ''
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedPrompts(result.prompts);
        
        if (result.isStandalone) {
          setSuccess(`Prompts generated and saved to database! Project ID: ${result.projectId}`);
        } else {
          setSuccess('Prompts generated successfully!');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate prompts');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (template: 'lullaby' | 'name-video') => {
    setForm(prev => ({
      ...prev,
      template,
      safeZones: template === 'lullaby' ? ['slideshow'] : ['center_safe']
    }));
  };

  const getSafeZoneOptions = () => {
    if (form.template === 'lullaby') {
      return [
        { value: 'slideshow', label: 'Slideshow (Full Frame)' },
        { value: 'frame', label: 'Frame (Edges Only)' }
      ];
    } else {
      return [
        { value: 'left_safe', label: 'Left Safe (Right Side Character)' },
        { value: 'right_safe', label: 'Right Safe (Left Side Character)' },
        { value: 'center_safe', label: 'Center Safe (Bottom Character)' }
      ];
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Prompt Generator</h1>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Generate High-Quality Prompts</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('name-video')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'name-video'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Name Video</div>
                    <div className="text-sm text-gray-600">Educational content with single characters</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('lullaby')}
                    className={`p-4 border rounded-lg text-left ${
                      form.template === 'lullaby'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Lullaby</div>
                    <div className="text-sm text-gray-600">Calming bedtime content</div>
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme *
                </label>
                <input
                  type="text"
                  value={form.theme}
                  onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Space Adventure, Ocean Friends, Forest Animals"
                  required
                />
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Age Range *
                </label>
                <select
                  value={form.ageRange}
                  onChange={(e) => setForm(prev => ({ ...prev, ageRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2-4">2-4 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="4-6">4-6 years</option>
                  <option value="5-7">5-7 years</option>
                </select>
              </div>

              {/* Personalization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personalization
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="general"
                      checked={form.personalization === 'general'}
                      onChange={(e) => setForm(prev => ({ ...prev, personalization: e.target.value as 'general' | 'personalized' }))}
                      className="mr-2"
                    />
                    General Content
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="personalized"
                      checked={form.personalization === 'personalized'}
                      onChange={(e) => setForm(prev => ({ ...prev, personalization: e.target.value as 'general' | 'personalized' }))}
                      className="mr-2"
                    />
                    Personalized Content
                  </label>
                </div>
              </div>

              {/* Child Name (if personalized) */}
              {form.personalization === 'personalized' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    value={form.childName}
                    onChange={(e) => setForm(prev => ({ ...prev, childName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's name"
                  />
                </div>
              )}

              {/* Safe Zone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Safe Zones</label>
                <div className="flex flex-wrap gap-4">
                  {['left_safe', 'right_safe', 'center_safe', 'frame', 'slideshow'].map(zone => (
                    <label key={zone} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={form.safeZones.includes(zone)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm(prev => ({ ...prev, safeZones: [...prev.safeZones, zone] }));
                          } else {
                            setForm(prev => ({ ...prev, safeZones: prev.safeZones.filter(z => z !== zone) }));
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
                  value={form.promptCount}
                  onChange={e => setForm(prev => ({ ...prev, promptCount: Math.max(1, Math.min(10, Number(e.target.value))) }))}
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
                      checked={form.aspectRatio === '16:9'}
                      onChange={() => setForm(prev => ({ ...prev, aspectRatio: '16:9' }))}
                    />
                    <span>16:9 (Landscape)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={form.aspectRatio === '9:16'}
                      onChange={() => setForm(prev => ({ ...prev, aspectRatio: '9:16' }))}
                    />
                    <span>9:16 (Portrait)</span>
                  </label>
                </div>
              </div>

              {/* Art Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Art Style</label>
                <select
                  value={form.artStyle}
                  onChange={(e) => setForm(prev => ({ ...prev, artStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2D Pixar Style">2D Pixar Style</option>
                  <option value="Watercolor">Watercolor</option>
                  <option value="Crayon Drawing">Crayon Drawing</option>
                  <option value="Storybook Illustration">Storybook Illustration</option>
                  <option value="Clay Animation">Clay Animation</option>
                  <option value="Paper Cutout">Paper Cutout</option>
                  <option value="Digital Cartoon">Digital Cartoon</option>
                  <option value="Felt Art">Felt Art</option>
                  <option value="Wooden Toy Style">Wooden Toy Style</option>
                  <option value="Finger Painting">Finger Painting</option>
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {/* Custom Art Style (if Other is selected) */}
              {form.artStyle === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Art Style</label>
                  <input
                    type="text"
                    value={form.customArtStyle}
                    onChange={(e) => setForm(prev => ({ ...prev, customArtStyle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your custom art style..."
                    required
                  />
                </div>
              )}

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context
                </label>
                <textarea
                  value={form.additionalContext}
                  onChange={(e) => setForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional details or preferences..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !form.theme}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Prompts...' : 'Generate Prompts'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Generated Prompts</h2>
            
            {generatedPrompts ? (
              <div className="space-y-6">
                {Object.entries(generatedPrompts).map(([safeZone, prompts]) => (
                  <div key={safeZone} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4 capitalize">
                      {safeZone.replace('_', ' ')} Zone
                    </h3>
                    
                    {/* Images */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Image Prompts ({prompts.images.length})</h4>
                      <div className="space-y-2">
                        {prompts.images.map((prompt, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-medium text-gray-700 mb-1">Image {index + 1}:</div>
                            <div className="text-gray-600">{prompt}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Template:</span> {prompts.metadata.template}
                        </div>
                        <div>
                          <span className="font-medium">Safe Zone:</span> {prompts.metadata.safeZone}
                        </div>
                        <div>
                          <span className="font-medium">Theme:</span> {prompts.metadata.theme}
                        </div>
                        <div>
                          <span className="font-medium">Age Range:</span> {prompts.metadata.ageRange}
                        </div>
                        <div>
                          <span className="font-medium">Aspect Ratio:</span> {prompts.metadata.aspectRatio}
                        </div>
                        <div>
                          <span className="font-medium">Art Style:</span> {prompts.metadata.artStyle || '2D Pixar Style'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Generate prompts to see results here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 