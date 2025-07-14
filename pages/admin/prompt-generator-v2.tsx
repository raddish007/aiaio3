import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { getThemeCategories, getSafeZonesForTemplate } from '@/lib/prompt-engine-client';
import AdminHeader from '@/components/AdminHeader';

interface PromptForm {
  childName: string;
  theme: string;
  ageRange: string;
  template: 'lullaby' | 'name-video' | 'name-show' | 'educational' | 'letter-hunt';
  personalization: 'general' | 'personalized' | 'themed';
  safeZones: string[];
  promptCount: number;
  aspectRatio: '16:9' | '9:16';
  artStyle: string;
  customArtStyle: string;
  additionalContext: string;
  assetType?: string; // Keep for backward compatibility
  imageType?: 'titleCard' | 'signImage' | 'bookImage' | 'groceryImage' | 'endingImage' | 'characterImage' | 'sceneImage';
  assetClass?: 'bedtime_intro' | 'bedtime_outro' | 'bedtime_scene' | 'letter_background_left' | 'letter_background_right'; // New for Lullaby/NameVideo
  targetLetter?: string; // Add target letter field for Letter Hunt
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
      variations?: string[];
      generatedAt: string;
    };
  };
}

export default function PromptGeneratorV2() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<PromptForm>({
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
    additionalContext: '',
    assetType: undefined,
    imageType: undefined,
    assetClass: undefined,
    targetLetter: undefined
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showThemeHelper, setShowThemeHelper] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  // Handle URL parameters for pre-filling form (e.g., from Lullaby v2, NameVideo v2, Letter Hunt pages)
  useEffect(() => {
    if (router.isReady) {
      const { query } = router;
      
      if (query.templateType === 'lullaby') {
        // For Lullaby, determine asset class and use all_ok safe zone
        const assetClass = (query.assetClass as string) || 'bedtime_intro';
        
        setForm(prev => ({
          ...prev,
          template: 'lullaby',
          childName: (query.childName as string) || '',
          theme: (query.childTheme as string) || '',
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: ['all_ok'], // All Lullaby images use all_ok
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: 'themed', // Lullaby is always themed
          assetClass: assetClass as any
        }));
      }
      else if (query.templateType === 'name-video') {
        // For NameVideo, determine asset class and use appropriate safe zone
        const assetClass = (query.assetClass as string) || 'letter_background_left';
        
        setForm(prev => ({
          ...prev,
          template: 'name-video',
          childName: (query.childName as string) || '',
          theme: (query.childTheme as string) || '',
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: ['all_ok'], // For now, use all_ok for NameVideo too
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: 'themed',
          assetClass: assetClass as any
        }));
      }
      else if (query.templateType === 'letter-hunt') {
        // For Letter Hunt, determine proper safe zone based on image type
        const imageType = (query.assetType as string) || 'titleCard';
        let safeZone = 'center_safe'; // Default safe zone
        
        // Title cards can use all_ok since they're designed for full composition
        if (imageType === 'titleCard') {
          safeZone = 'all_ok';
        }
        // Other image types might need different safe zones based on their requirements
        else if (imageType === 'signImage' || imageType === 'bookImage' || imageType === 'groceryImage') {
          safeZone = 'all_ok'; // Letter-specific images can use full composition for better visual impact
        }
        else if (imageType === 'endingImage') {
          safeZone = 'all_ok'; // Celebratory ending can use full composition
        }
        
        setForm(prev => ({
          ...prev,
          template: 'letter-hunt',
          childName: (query.childName as string) || '',
          theme: (query.theme as string) || '', // Don't default to 'monsters' - use empty string
          ageRange: (query.ageRange as string) || '3-5',
          safeZones: [safeZone],
          aspectRatio: (query.aspectRatio as '16:9' | '9:16') || '16:9',
          artStyle: (query.artStyle as string) || '2D Pixar Style',
          personalization: (query.personalization as 'general' | 'personalized') || 'general',
          imageType: imageType as any,
          targetLetter: (query.letterFocus as string) || (query.targetLetter as string) || ''
        }));
      }
      else {
        // Other templates use default settings
        if (query.childName) {
          setForm(prev => ({
            ...prev,
            childName: query.childName as string,
            theme: (query.theme as string) || prev.theme,
            ageRange: (query.ageRange as string) || prev.ageRange,
            template: (query.templateType as any) || prev.template,
            aspectRatio: (query.aspectRatio as '16:9' | '9:16') || prev.aspectRatio,
            artStyle: (query.artStyle as string) || prev.artStyle,
            personalization: (query.personalization as 'general' | 'personalized') || prev.personalization
          }));
        }
      }
    }
  }, [router.isReady, router.query]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  // Asset class options for Lullaby and NameVideo
  const getAssetClassOptions = () => {
    if (form.template === 'lullaby') {
      return [
        { value: 'bedtime_intro', label: 'Intro Scene', desc: 'Peaceful nighttime intro scene' },
        { value: 'bedtime_outro', label: 'Outro Scene', desc: 'Serene goodnight conclusion scene' },
        { value: 'bedtime_scene', label: 'Slideshow Scene', desc: 'Soothing bedtime imagery for slideshow' }
      ];
    } else if (form.template === 'name-video') {
      return [
        { value: 'letter_background_left', label: 'Left Background', desc: 'Letter background with left safe zone' },
        { value: 'letter_background_right', label: 'Right Background', desc: 'Letter background with right safe zone' }
      ];
    }
    return [];
  };

  // Image type options for Letter Hunt (keeping existing functionality)
  const getImageTypeOptions = () => {
    if (form.template === 'letter-hunt') {
      return [
        { value: 'titleCard', label: 'Title Card', desc: 'Main letter introduction card' },
        { value: 'signImage', label: 'Sign Image', desc: 'Letter on street signs' },
        { value: 'bookImage', label: 'Book Image', desc: 'Letter on book covers' },
        { value: 'groceryImage', label: 'Grocery Image', desc: 'Letter on grocery items' },
        { value: 'endingImage', label: 'Ending Image', desc: 'Celebratory completion scene' },
        { value: 'characterImage', label: 'Character Image', desc: 'Character representation' },
        { value: 'sceneImage', label: 'Scene Image', desc: 'General scene imagery' }
      ];
    }
    return [];
  };

  const handleGeneratePrompts = async () => {
    if (!form.childName || !form.theme) {
      setError('Child name and theme are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build the appropriate prompt context based on template and asset type
      let promptContext = '';
      
      if (form.template === 'lullaby') {
        switch (form.assetClass) {
          case 'bedtime_intro':
            promptContext = `Create a peaceful nighttime intro scene for a lullaby video with ${form.theme} theme. The scene should be calming and set the mood for bedtime. Include gentle, dreamy elements that would help a child feel relaxed and ready for sleep.`;
            break;
          case 'bedtime_outro':
            promptContext = `Create a serene goodnight conclusion scene for a lullaby video with ${form.theme} theme. The scene should convey a sense of peaceful ending and sweet dreams. Include elements that suggest rest, comfort, and gentle closure to the bedtime story.`;
            break;
          case 'bedtime_scene':
            promptContext = `Create soothing bedtime imagery for a lullaby slideshow with ${form.theme} theme. The scene should be calming and dreamlike, perfect for helping a child drift off to sleep. Include soft, comforting elements that create a peaceful atmosphere.`;
            break;
        }
      } else if (form.template === 'name-video') {
        switch (form.assetClass) {
          case 'letter_background_left':
            promptContext = `Create a letter background image with ${form.theme} theme, designed with a left safe zone for letter placement. The right side should have interesting thematic elements while keeping the left side clear for letter overlay.`;
            break;
          case 'letter_background_right':
            promptContext = `Create a letter background image with ${form.theme} theme, designed with a right safe zone for letter placement. The left side should have interesting thematic elements while keeping the right side clear for letter overlay.`;
            break;
        }
      } else if (form.template === 'letter-hunt') {
        // Keep existing Letter Hunt logic
        switch (form.imageType) {
          case 'titleCard':
            promptContext = `Create a title card for letter ${form.targetLetter?.toUpperCase()} with ${form.theme || 'playful'} theme`;
            break;
          case 'signImage':
            promptContext = `Create an image of the letter ${form.targetLetter?.toUpperCase()} on a street sign or road sign with ${form.theme || 'urban'} theme`;
            break;
          case 'bookImage':
            promptContext = `Create an image of the letter ${form.targetLetter?.toUpperCase()} on a book cover with ${form.theme || 'educational'} theme`;
            break;
          case 'groceryImage':
            promptContext = `Create an image of the letter ${form.targetLetter?.toUpperCase()} on a grocery item or food package with ${form.theme || 'food'} theme`;
            break;
          case 'endingImage':
            promptContext = `Create a celebratory ending scene for completing letter ${form.targetLetter?.toUpperCase()} with ${form.theme || 'celebration'} theme`;
            break;
          default:
            promptContext = `Create an image for letter ${form.targetLetter?.toUpperCase()} with ${form.theme || 'general'} theme`;
        }
      }

      // Add any additional context
      if (form.additionalContext) {
        promptContext += ` Additional context: ${form.additionalContext}`;
      }

      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: form.childName,
          theme: form.theme,
          ageRange: form.ageRange,
          template: form.template,
          personalization: form.personalization,
          safeZones: form.safeZones,
          promptCount: form.promptCount,
          aspectRatio: form.aspectRatio,
          artStyle: form.artStyle === 'Custom' ? form.customArtStyle : form.artStyle,
          additionalContext: promptContext,
          assetClass: form.assetClass,
          imageType: form.imageType,
          targetLetter: form.targetLetter
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }

      const data = await response.json();
      setGeneratedPrompts(data.prompts);
      setSuccess(`Generated ${Object.keys(data.prompts).length} prompt sets successfully!`);

    } catch (error) {
      console.error('Error generating prompts:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssets = async (safeZone: string) => {
    if (!generatedPrompts || !generatedPrompts[safeZone]) {
      setError('No prompts available for this safe zone');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promptData = generatedPrompts[safeZone];
      
      // Create asset entries in the database
      const response = await fetch('/api/assets/create-from-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts: promptData.images,
          metadata: {
            ...promptData.metadata,
            child_name: form.childName,
            child_theme: form.theme,
            asset_class: form.assetClass,
            image_type: form.imageType,
            target_letter: form.targetLetter,
            template: form.template
          },
          assetType: 'image'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assets');
      }

      const data = await response.json();
      setSuccess(`Created ${data.assets.length} asset(s) successfully! They will be processed for generation.`);

    } catch (error) {
      console.error('Error creating assets:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Prompt Generator v2" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🎨 Prompt Generator v2
          </h1>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Name *
                  </label>
                  <input
                    type="text"
                    value={form.childName}
                    onChange={(e) => setForm({ ...form, childName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme *
                  </label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., dinosaurs, princess, space"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={form.template}
                    onChange={(e) => setForm({ ...form, template: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lullaby">Lullaby</option>
                    <option value="name-video">Name Video</option>
                    <option value="letter-hunt">Letter Hunt</option>
                    <option value="name-show">Name Show</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range
                  </label>
                  <select
                    value={form.ageRange}
                    onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2-4">2-4 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="4-6">4-6 years</option>
                    <option value="5-7">5-7 years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Asset Type Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Asset Configuration</h3>
              
              <div className="space-y-4">
                {/* Asset Class for Lullaby/NameVideo */}
                {(form.template === 'lullaby' || form.template === 'name-video') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type
                    </label>
                    <select
                      value={form.assetClass || ''}
                      onChange={(e) => setForm({ ...form, assetClass: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select asset type...</option>
                      {getAssetClassOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Image Type for Letter Hunt */}
                {form.template === 'letter-hunt' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Type
                      </label>
                      <select
                        value={form.imageType || ''}
                        onChange={(e) => setForm({ ...form, imageType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select image type...</option>
                        {getImageTypeOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Letter
                      </label>
                      <input
                        type="text"
                        value={form.targetLetter || ''}
                        onChange={(e) => setForm({ ...form, targetLetter: e.target.value.toUpperCase() })}
                        maxLength={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., A"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Art Style
                  </label>
                  <select
                    value={form.artStyle}
                    onChange={(e) => setForm({ ...form, artStyle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2D Pixar Style">2D Pixar Style</option>
                    <option value="Watercolor">Watercolor</option>
                    <option value="Digital Art">Digital Art</option>
                    <option value="Cartoon">Cartoon</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {form.artStyle === 'Custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Art Style
                    </label>
                    <input
                      type="text"
                      value={form.customArtStyle}
                      onChange={(e) => setForm({ ...form, customArtStyle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your custom art style"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={form.aspectRatio}
                    onChange={(e) => setForm({ ...form, aspectRatio: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Prompts
                  </label>
                  <select
                    value={form.promptCount}
                    onChange={(e) => setForm({ ...form, promptCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 prompt</option>
                    <option value={3}>3 prompts</option>
                    <option value={5}>5 prompts</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Context */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={form.additionalContext}
              onChange={(e) => setForm({ ...form, additionalContext: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional context or requirements for the prompts..."
            />
          </div>

          {/* Safe Zones Display */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Safe Zones</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                {form.template === 'lullaby' ? 'Using all_ok safe zone for all Lullaby images' :
                 form.template === 'name-video' ? 'Using all_ok safe zone for NameVideo images' :
                 `Using ${form.safeZones.join(', ')} safe zone(s)`}
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-8">
            <button
              onClick={handleGeneratePrompts}
              disabled={loading || !form.childName || !form.theme}
              className={`w-full py-3 px-4 rounded-md font-medium ${
                loading || !form.childName || !form.theme
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Generating Prompts...' : 'Generate Prompts'}
            </button>
          </div>

          {/* Generated Prompts */}
          {generatedPrompts && (
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Generated Prompts</h3>
              
              {Object.entries(generatedPrompts).map(([safeZone, data]) => (
                <div key={safeZone} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Safe Zone: {safeZone}
                    </h4>
                    <button
                      onClick={() => handleCreateAssets(safeZone)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
                    >
                      Create Assets
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {data.images.map((prompt, index) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">{prompt}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Template: {data.metadata.template}</p>
                    <p>Theme: {data.metadata.theme}</p>
                    <p>Art Style: {data.metadata.artStyle}</p>
                    <p>Generated: {new Date(data.metadata.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
